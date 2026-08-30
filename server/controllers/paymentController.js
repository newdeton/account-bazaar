import Product from "../models/Product.js";
import Order from "../models/order.js";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL =
  process.env.FLW_API_URL ||
  "https://api.flutterwave.com/v3";

const USD_TO_KES_RATE = Number(
  process.env.USD_TO_KES_RATE || 129
);

const PAYMENT_CURRENCY = "KES";

/* =========================================================
   FLUTTERWAVE SECRET KEY
========================================================= */

const getFlutterwaveSecretKey = () => {
  const key = process.env.FLW_SECRET_KEY;

  if (!key) {
    throw new Error(
      "FLW_SECRET_KEY is not configured in server/.env"
    );
  }

  return key;
};

/* =========================================================
   FLUTTERWAVE REQUEST
========================================================= */

const flutterwaveRequest = async (
  endpoint,
  options = {}
) => {
  const secretKey =
    getFlutterwaveSecretKey();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        Authorization: `Bearer ${secretKey}`,

        "Content-Type":
          "application/json",

        ...(options.headers || {}),
      },
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    const message =
      data?.message ||
      "Flutterwave API request failed.";

    const error =
      new Error(message);

    error.response = {
      data,
      status: response.status,
    };

    throw error;
  }

  return data;
};

/* =========================================================
   GENERATE TRANSACTION REFERENCE
========================================================= */

const generateReference = () => {
  return `AB-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()}`;
};

/* =========================================================
   GENERATE ORDER ID
========================================================= */

const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
};

/* =========================================================
   CHECK MONGODB OBJECT ID
========================================================= */

const isMongoObjectId = (value) => {
  return /^[a-f\d]{24}$/i.test(
    String(value || "")
  );
};

/* =========================================================
   FIND PRODUCT
========================================================= */

const findProduct = async (id) => {
  if (!id) {
    return null;
  }

  const value =
    String(id).trim();

  /* MongoDB _id */

  if (isMongoObjectId(value)) {
    return Product.findOne({
      _id: value,
      isActive: true,
    });
  }

  /* Custom productId */

  return Product.findOne({
    productId: value,
    isActive: true,
  });
};

/* =========================================================
   CREATE PAYMENT
========================================================= */

export const createPayment = async (
  req,
  res
) => {
  let createdOrder = null;

  try {
    const {
      items,
      customer,
      paymentType = "product",
    } = req.body;

    /* =====================================================
       CUSTOMER VALIDATION
    ===================================================== */

    if (!customer?.customerId) {
      return res.status(400).json({
        success: false,
        message:
          "Customer ID is required.",
      });
    }

    if (!customer?.name?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name is required.",
      });
    }

    if (!customer?.email?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Customer email is required.",
      });
    }

    if (paymentType !== "product") {
      return res.status(400).json({
        success: false,
        message:
          "Only product payments are currently supported.",
      });
    }

    /* =====================================================
       CART VALIDATION
    ===================================================== */

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Your cart is empty.",
      });
    }

    /* =====================================================
       NORMALIZE ITEMS
    ===================================================== */

    const normalizedItems =
      items.map((item) => ({
        productId:
          item?.productId ||
          item?.id ||
          "",

        quantity: Math.max(
          1,
          Math.floor(
            Number(
              item?.quantity || 1
            )
          )
        ),
      }));

    /* =====================================================
       VALIDATE ITEM IDs
    ===================================================== */

    for (
      const item of normalizedItems
    ) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message:
            "One or more cart items are invalid.",
        });
      }

      if (
        !Number.isFinite(
          item.quantity
        ) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product quantity.",
        });
      }
    }

    /* =====================================================
       LOAD PRODUCTS
    ===================================================== */

    const products = [];

    for (
      const item of normalizedItems
    ) {
      const product =
        await findProduct(
          item.productId
        );

      if (!product) {
        return res.status(400).json({
          success: false,
          message:
            `Product ${item.productId} is unavailable or could not be found.`,
        });
      }

      products.push(product);
    }

    /* =====================================================
       BUILD ORDER
    ===================================================== */

    const orderItems = [];

    let totalUSD = 0;

    for (
      let index = 0;
      index < normalizedItems.length;
      index++
    ) {
      const item =
        normalizedItems[index];

      const product =
        products[index];

      /* ===================================================
         STOCK CHECK
      =================================================== */

      if (
        !product.unlimitedStock &&
        Number(product.stock || 0) <
          item.quantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} does not have enough stock.`,
        });
      }

      /* ===================================================
         VERIFIED PRICE
      =================================================== */

      const priceUSD =
        Number(product.price);

      if (
        !Number.isFinite(
          priceUSD
        ) ||
        priceUSD <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} has an invalid price.`,
        });
      }

      /* ===================================================
         SUBTOTAL
      =================================================== */

      const subtotalUSD =
        Number(
          (
            priceUSD *
            item.quantity
          ).toFixed(2)
        );

      totalUSD +=
        subtotalUSD;

      /* ===================================================
         SNAPSHOT
      =================================================== */

      orderItems.push({
        productId:
          product._id,

        productCode:
          product.productId,

        name:
          product.name,

        priceUSD,

        quantity:
          item.quantity,

        subtotalUSD,
      });
    }

    totalUSD =
      Number(
        totalUSD.toFixed(2)
      );

    /* =====================================================
       CONVERT USD → KES
    ===================================================== */

    const totalKES =
      Number(
        (
          totalUSD *
          USD_TO_KES_RATE
        ).toFixed(2)
      );

    if (
      !Number.isFinite(
        totalKES
      ) ||
      totalKES <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment amount.",
      });
    }

    /* =====================================================
       REFERENCES
    ===================================================== */

    const orderId =
      generateOrderId();

    const txRef =
      generateReference();

    /* =====================================================
       CREATE PENDING ORDER
    ===================================================== */

    createdOrder =
      await Order.create({
        orderId,

        customerId:
          customer.customerId,

        customer: {
          name:
            customer.name.trim(),

          email:
            customer.email.trim(),

          phone:
            customer.phone?.trim() ||
            "",
        },

        items:
          orderItems,

        totalUSD,

        totalKES,

        exchangeRate:
          USD_TO_KES_RATE,

        currency:
          PAYMENT_CURRENCY,

        payment: {
          provider:
            "flutterwave",

          txRef,

          status:
            "pending",
        },

        status:
          "pending",

        stockProcessed:
          false,
      });

    /* =====================================================
       FLUTTERWAVE CHECKOUT
    ===================================================== */

    const checkout =
      await flutterwaveRequest(
        "/payments",
        {
          method: "POST",

          body: JSON.stringify({
            tx_ref:
              txRef,

            amount:
              totalKES,

            currency:
              PAYMENT_CURRENCY,

            redirect_url:
              process.env.PAYMENT_SUCCESS_URL,

            customer: {
              email:
                customer.email.trim(),

              name:
                customer.name.trim(),

              phonenumber:
                customer.phone?.trim() ||
                undefined,
            },

            customizations: {
              title:
                "Account Bazaar",

              description:
                `Order ${orderId} - $${totalUSD.toFixed(
                  2
                )} USD`,

              logo:
                process.env.FLW_LOGO_URL ||
                undefined,
            },

            meta: {
              orderId,

              customerId:
                customer.customerId,

              usdAmount:
                totalUSD,

              kesAmount:
                totalKES,

              exchangeRate:
                USD_TO_KES_RATE,
            },
          }),
        }
      );

    /* =====================================================
       CHECK CHECKOUT RESPONSE
    ===================================================== */

    if (
      !checkout ||
      checkout.status !==
        "success" ||
      !checkout.data?.link
    ) {
      await Order.findByIdAndUpdate(
        createdOrder._id,
        {
          $set: {
            status:
              "failed",

            "payment.status":
              "failed",
          },
        }
      );

      throw new Error(
        checkout?.message ||
          "Flutterwave did not return a checkout URL."
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.status(200).json({
      success: true,

      payment: {
        orderId,

        txRef,

        currency:
          PAYMENT_CURRENCY,

        usdAmount:
          totalUSD,

        kesAmount:
          totalKES,

        exchangeRate:
          USD_TO_KES_RATE,

        checkoutUrl:
          checkout.data.link,
      },
    });
  } catch (error) {
    console.error(
      "Create payment error:"
    );

    console.error(
      error?.response?.data ||
        error?.message ||
        error
    );

    /* =====================================================
       MARK ORDER FAILED
    ===================================================== */

    if (createdOrder?._id) {
      try {
        await Order.findByIdAndUpdate(
          createdOrder._id,
          {
            $set: {
              status:
                "failed",

              "payment.status":
                "failed",
            },
          }
        );
      } catch (updateError) {
        console.error(
          "Failed to update failed order:",
          updateError
        );
      }
    }

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to initialize payment.",
    });
  }
};

/* =========================================================
   VERIFY PAYMENT
========================================================= */

export const verifyPayment = async (
  req,
  res
) => {
  try {
    const {
      transactionId,
      txRef,
    } = req.body;

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "Flutterwave transaction ID is required.",
      });
    }

    /* =====================================================
       VERIFY TRANSACTION
    ===================================================== */

    const verification =
      await flutterwaveRequest(
        `/transactions/${encodeURIComponent(
          transactionId
        )}/verify`,
        {
          method: "GET",
        }
      );

    const verificationData =
      verification?.data;

    if (
      !verification ||
      verification.status !==
        "success" ||
      !verificationData
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Flutterwave could not verify this transaction.",
      });
    }

    /* =====================================================
       FIND ORDER
    ===================================================== */

    let order = null;

    const verifiedTxRef =
      verificationData.tx_ref;

    if (txRef) {
      order =
        await Order.findOne({
          "payment.txRef":
            txRef,
        });
    }

    if (
      !order &&
      verifiedTxRef
    ) {
      order =
        await Order.findOne({
          "payment.txRef":
            verifiedTxRef,
        });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order associated with this payment could not be found.",
      });
    }

    /* =====================================================
       ALREADY VERIFIED
    ===================================================== */

    if (
      order.payment.status ===
        "successful"
    ) {
      return res.status(200).json({
        success: true,

        message:
          "Payment has already been verified.",

        order: {
          orderId:
            order.orderId,

          customerId:
            order.customerId,

          totalUSD:
            order.totalUSD,

          totalKES:
            order.totalKES,

          currency:
            order.currency,

          paymentStatus:
            order.payment.status,

          status:
            order.status,

          transactionId:
            order.payment.transactionId,
        },
      });
    }

    /* =====================================================
       FLUTTERWAVE STATUS
    ===================================================== */

    const status =
      String(
        verificationData.status ||
          ""
      ).toLowerCase();

    if (
      status !==
      "successful"
    ) {
      await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            status:
              "failed",

            "payment.status":
              "failed",
          },
        }
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment was not successful.",
      });
    }

    /* =====================================================
       CURRENCY
    ===================================================== */

    const currency =
      String(
        verificationData.currency ||
          ""
      ).toUpperCase();

    if (
      currency !==
      PAYMENT_CURRENCY
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment currency does not match the order.",
      });
    }

    /* =====================================================
       TX REF
    ===================================================== */

    if (
      verifiedTxRef !==
      order.payment.txRef
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction reference does not match the order.",
      });
    }

    /* =====================================================
       AMOUNT
    ===================================================== */

    const paidAmount =
      Number(
        verificationData.amount
      );

    const expectedAmount =
      Number(
        order.totalKES
      );

    if (
      !Number.isFinite(
        paidAmount
      ) ||
      paidAmount <
        expectedAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match the order total.",
      });
    }

    /* =====================================================
       STOCK CHECK
    ===================================================== */

    if (
      !order.stockProcessed
    ) {
      for (
        const item of order.items
      ) {
        const product =
          await Product.findById(
            item.productId
          );

        if (!product) {
          return res.status(409).json({
            success: false,
            message:
              `${item.name} is no longer available.`,
          });
        }

        if (
          !product.isActive
        ) {
          return res.status(409).json({
            success: false,
            message:
              `${product.name} is no longer available.`,
          });
        }

        if (
          !product.unlimitedStock &&
          Number(
            product.stock || 0
          ) <
            Number(
              item.quantity
            )
        ) {
          return res.status(409).json({
            success: false,
            message:
              `${product.name} no longer has enough stock.`,
          });
        }
      }

      /* ===================================================
         DEDUCT STOCK
      =================================================== */

      for (
        const item of order.items
      ) {
        if (!item.productId) {
          continue;
        }

        const product =
          await Product.findById(
            item.productId
          );

        if (
          product &&
          !product.unlimitedStock
        ) {
          product.stock =
            Math.max(
              0,
              Number(
                product.stock || 0
              ) -
                Number(
                  item.quantity
                )
            );

          await product.save();
        }
      }
    }

    /* =====================================================
       PAYMENT DETAILS
    ===================================================== */

    const paidAt =
      verificationData.created_at
        ? new Date(
            verificationData.created_at
          )
        : new Date();

    order.payment.status =
      "successful";

    order.payment.transactionId =
      String(
        verificationData.id ||
          transactionId
      );

    order.payment.flutterwaveRef =
      verificationData.flw_ref ||
      "";

    order.payment.method =
      verificationData.payment_type ||
      "";

    order.payment.paidAt =
      paidAt;

    order.status =
      "paid";

    order.stockProcessed =
      true;

    await order.save();

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.status(200).json({
      success: true,

      message:
        "Payment verified successfully.",

      order: {
        orderId:
          order.orderId,

        customerId:
          order.customerId,

        totalUSD:
          order.totalUSD,

        totalKES:
          order.totalKES,

        currency:
          order.currency,

        paymentStatus:
          order.payment.status,

        status:
          order.status,

        transactionId:
          order.payment.transactionId,

        paidAt:
          order.payment.paidAt,
      },
    });
  } catch (error) {
    console.error(
      "Verify payment error:"
    );

    console.error(
      error?.response?.data ||
        error?.message ||
        error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to verify payment.",
    });
  }
};