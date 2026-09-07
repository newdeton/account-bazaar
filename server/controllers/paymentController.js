import Product from "../models/Product.js";
import Order from "../models/Order.js";

/* =========================================================
   CONFIGURATION
========================================================= */

const USD_TO_KES_RATE = Number(
  process.env.USD_TO_KES_RATE || 129
);

const PAYMENT_CURRENCY = "KES";

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
   GENERATE PAYMENT REFERENCE
=========================================================

   This is no longer a Flutterwave transaction reference.

   It is simply an internal reference that can be used to
   identify the manual payment associated with the order.

========================================================= */

const generatePaymentReference = () => {
  return `MAN-${Date.now()}-${Math.random()
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
   NORMALIZE CUSTOMER ID
========================================================= */

const normalizeCustomerId = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

/* =========================================================
   FIND PRODUCT
========================================================= */

const findProduct = async (id) => {
  if (!id) {
    return null;
  }

  const value = String(id).trim();

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
   SAFE ORDER RESPONSE
========================================================= */

const formatOrder = (order) => {
  if (!order) {
    return null;
  }

  return {
    id: order._id,

    orderId: order.orderId,

    customerId: order.customerId,

    customer: {
      name:
        order.customer?.name || "",

      email:
        order.customer?.email || "",

      phone:
        order.customer?.phone || "",
    },

    items: Array.isArray(order.items)
      ? order.items
      : [],

    totalUSD:
      Number(order.totalUSD || 0),

    totalKES:
      Number(order.totalKES || 0),

    currency:
      order.currency || PAYMENT_CURRENCY,

    exchangeRate:
      Number(
        order.exchangeRate ||
          USD_TO_KES_RATE
      ),

    payment: {
      provider:
        order.payment?.provider ||
        "manual",

      txRef:
        order.payment?.txRef || "",

      status:
        order.payment?.status ||
        "pending",

      transactionId:
        order.payment?.transactionId ||
        "",

      method:
        order.payment?.method ||
        "",

      paidAt:
        order.payment?.paidAt || null,

      confirmedBy:
        order.payment?.confirmedBy ||
        "",

      confirmedAt:
        order.payment?.confirmedAt ||
        null,
    },

    paymentStatus:
      order.payment?.status ||
      "pending",

    status:
      order.status || "pending",

    stockProcessed:
      Boolean(order.stockProcessed),

    createdAt:
      order.createdAt || null,

    updatedAt:
      order.updatedAt || null,

    purchasedAt:
      order.purchasedAt ||
      order.createdAt ||
      null,
  };
};

/* =========================================================
   CREATE ORDER
=========================================================

   POST /api/payments/create

   NEW FLOW:

   Customer submits checkout
          ↓
   Validate customer/cart
          ↓
   Verify products/prices/stock
          ↓
   Create MongoDB order
          ↓
   payment.status = pending
          ↓
   order.status = pending
          ↓
   Return order information

   IMPORTANT:
   No Flutterwave request is made here.

========================================================= */

export const createPayment = async (
  req,
  res
) => {
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
          "Only product orders are currently supported.",
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
       BUILD ORDER ITEMS
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

         We still check stock when the order is created.

         However, we DO NOT deduct stock yet.

         Stock is deducted when the admin confirms payment.
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
         PRODUCT SNAPSHOT

         Store the product information as it existed
         when the order was submitted.
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

        image:
          product.image ||
          product.imageUrl ||
          "",

        category:
          product.category ||
          "Marketplace",
      });
    }

    /* =====================================================
       TOTAL USD
    ===================================================== */

    totalUSD =
      Number(
        totalUSD.toFixed(2)
      );

    if (
      !Number.isFinite(
        totalUSD
      ) ||
      totalUSD <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order total.",
      });
    }

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
          "Invalid order amount.",
      });
    }

    /* =====================================================
       REFERENCES
    ===================================================== */

    const orderId =
      generateOrderId();

    const paymentReference =
      generatePaymentReference();

    /* =====================================================
       CREATE ORDER
    ===================================================== */

    const order =
      await Order.create({
        orderId,

        customerId:
          String(
            customer.customerId
          ).trim(),

        customer: {
          name:
            customer.name.trim(),

          email:
            customer.email
              .trim()
              .toLowerCase(),

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
            "manual",

          txRef:
            paymentReference,

          status:
            "pending",

          transactionId:
            "",

          method:
            "",

          paidAt:
            null,

          confirmedBy:
            "",

          confirmedAt:
            null,
        },

        status:
          "pending",

        stockProcessed:
          false,

        purchasedAt:
          new Date(),
      });

    /* =====================================================
       SUCCESS

       The order now exists in MongoDB.

       Payment is NOT processed online.
    ===================================================== */

    return res.status(201).json({
      success: true,

      message:
        "Order submitted successfully. Online payment is temporarily unavailable. Please contact admin to arrange payment.",

      order: formatOrder(
        order
      ),

      payment: {
        orderId,

        reference:
          paymentReference,

        status:
          "pending",

        message:
          "Online payment is temporarily unavailable. Please contact admin.",
      },
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to create your order.",
    });
  }
};

/* =========================================================
   GET ALL ORDERS
=========================================================

   GET /api/payments/orders

   Used by the admin dashboard.

========================================================= */

export const getOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await Order.find({})
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,

      count:
        orders.length,

      orders:
        orders.map(
          formatOrder
        ),
    });
  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load orders.",
    });
  }
};

/* =========================================================
   GET CUSTOMER ORDERS
=========================================================

   GET /api/payments/orders/customer/:customerId

   Used by My Orders.

========================================================= */

export const getCustomerOrders =
  async (
    req,
    res
  ) => {
    try {
      const {
        customerId,
      } = req.params;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message:
            "Customer ID is required.",
        });
      }

      const normalizedId =
        normalizeCustomerId(
          customerId
        );

      const orders =
        await Order.find({
          customerId:
            normalizedId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      /* ===================================================
         FALLBACK

         Your existing customer IDs may contain different
         casing. If the exact query returns nothing, fetch
         and compare normalized values.
      =================================================== */

      let customerOrders =
        orders;

      if (
        customerOrders.length === 0
      ) {
        const allOrders =
          await Order.find({})
            .sort({
              createdAt: -1,
            })
            .lean();

        customerOrders =
          allOrders.filter(
            (order) =>
              normalizeCustomerId(
                order.customerId
              ) ===
              normalizedId
          );
      }

      return res.status(200).json({
        success: true,

        count:
          customerOrders.length,

        orders:
          customerOrders.map(
            formatOrder
          ),
      });
    } catch (error) {
      console.error(
        "Get customer orders error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load your orders.",
      });
    }
  };

/* =========================================================
   GET SINGLE ORDER
=========================================================

   GET /api/payments/orders/:orderId

========================================================= */

export const getOrder = async (
  req,
  res
) => {
  try {
    const {
      orderId,
    } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message:
          "Order ID is required.",
      });
    }

    const order =
      await Order.findOne({
        orderId:
          String(orderId).trim(),
      }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,

      order:
        formatOrder(order),
    });
  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load the order.",
    });
  }
};

/* =========================================================
   MARK PAYMENT AS PAID
=========================================================

   PATCH /api/payments/orders/:orderId/payment

   ADMIN ACTION.

   Request body can contain:

   {
     "method": "M-Pesa",
     "transactionId": "ABC123",
     "confirmedBy": "Admin"
   }

   When payment is confirmed:

   payment.status = successful
   order.status = paid
   stock is deducted
   payment details are saved

========================================================= */

export const markPaymentPaid =
  async (
    req,
    res
  ) => {
    try {
      const {
        orderId,
      } = req.params;

      const {
        method = "Manual Payment",
        transactionId = "",
        confirmedBy = "Admin",
      } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message:
            "Order ID is required.",
        });
      }

      const order =
        await Order.findOne({
          orderId:
            String(orderId).trim(),
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      /* ===================================================
         ALREADY PAID
      =================================================== */

      if (
        String(
          order.payment?.status ||
            ""
        ).toLowerCase() ===
        "successful"
      ) {
        return res.status(200).json({
          success: true,

          message:
            "This order has already been marked as paid.",

          order:
            formatOrder(order),
        });
      }

      /* ===================================================
         STOCK VALIDATION

         Stock must still be available before payment
         is confirmed.
      =================================================== */

      if (
        !order.stockProcessed
      ) {
        for (
          const item of order.items || []
        ) {
          if (!item.productId) {
            continue;
          }

          const product =
            await Product.findById(
              item.productId
            );

          if (!product) {
            return res.status(409).json({
              success: false,
              message:
                `${item.name || "A product"} is no longer available.`,
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
                item.quantity || 0
              )
          ) {
            return res.status(409).json({
              success: false,
              message:
                `${product.name} no longer has enough stock.`,
            });
          }
        }

        /* =================================================
           DEDUCT STOCK
        ================================================= */

        for (
          const item of order.items || []
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
                    item.quantity || 0
                  )
              );

            await product.save();
          }
        }

        order.stockProcessed =
          true;
      }

      /* ===================================================
         PAYMENT DETAILS
      =================================================== */

      const now =
        new Date();

      order.payment.status =
        "successful";

      order.payment.transactionId =
        String(
          transactionId || ""
        ).trim();

      order.payment.method =
        String(
          method ||
            "Manual Payment"
        ).trim();

      order.payment.paidAt =
        now;

      order.payment.confirmedBy =
        String(
          confirmedBy ||
            "Admin"
        ).trim();

      order.payment.confirmedAt =
        now;

      order.status =
        "paid";

      await order.save();

      return res.status(200).json({
        success: true,

        message:
          "Payment confirmed successfully. Order marked as paid.",

        order:
          formatOrder(order),
      });
    } catch (error) {
      console.error(
        "Mark payment paid error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Unable to confirm payment.",
      });
    }
  };

/* =========================================================
   UPDATE ORDER STATUS
=========================================================

   PATCH /api/payments/orders/:orderId/status

   ADMIN ACTION.

   Example:

   {
     "status": "processing"
   }

   Supported statuses:

   pending
   paid
   processing
   shipped
   completed
   cancelled
   failed

========================================================= */

export const updateOrderStatus =
  async (
    req,
    res
  ) => {
    try {
      const {
        orderId,
      } = req.params;

      const {
        status,
      } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message:
            "Order ID is required.",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "Order status is required.",
        });
      }

      const normalizedStatus =
        String(status)
          .trim()
          .toLowerCase();

      const allowedStatuses = [
        "pending",
        "paid",
        "processing",
        "shipped",
        "completed",
        "cancelled",
        "failed",
      ];

      if (
        !allowedStatuses.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            `Invalid order status. Allowed statuses: ${allowedStatuses.join(
              ", "
            )}.`,
        });
      }

      const order =
        await Order.findOne({
          orderId:
            String(orderId).trim(),
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      /* ===================================================
         PAYMENT SAFETY

         An order should not normally be changed to paid
         without payment confirmation.
      =================================================== */

      if (
        normalizedStatus ===
          "paid" &&
        String(
          order.payment?.status ||
            ""
        ).toLowerCase() !==
          "successful"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Confirm the payment before marking the order as paid.",
        });
      }

      order.status =
        normalizedStatus;

      await order.save();

      return res.status(200).json({
        success: true,

        message:
          "Order status updated successfully.",

        order:
          formatOrder(order),
      });
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to update order status.",
      });
    }
  };

/* =========================================================
   LEGACY VERIFY PAYMENT
=========================================================

   Flutterwave is no longer used.

   This endpoint is intentionally retained temporarily so
   an old frontend request does not crash unexpectedly.

   Once Payment.jsx has been updated, this route can be
   removed from paymentRoutes.js.

========================================================= */

export const verifyPayment =
  async (
    req,
    res
  ) => {
    return res.status(410).json({
      success: false,

      message:
        "Online payment verification is temporarily unavailable. Please contact admin to confirm payment.",
    });
  };