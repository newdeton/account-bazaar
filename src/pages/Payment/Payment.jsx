import {
  Link,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiPackage,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";

import { useCart } from "../../context/CartContext";

import "./Payment.css";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================================================
   STORAGE
========================================================= */

const CUSTOMER_KEY =
  "accountBazaarCustomer";

const PENDING_TRAINING_KEY =
  "pendingTrainingBooking";

/* =========================================================
   CUSTOMER ID
   Guest customers receive a persistent reference.
   THIS IS NOT A LOGIN OR ACCOUNT.
========================================================= */

const generateCustomerId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `CUS-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .substring(0, 12)
      .toUpperCase()}`;
  }

  return `CUS-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()}`;
};

/* =========================================================
   GET / CREATE GUEST CUSTOMER
========================================================= */

const getCustomerIdentity = () => {
  try {
    const savedCustomer =
      localStorage.getItem(CUSTOMER_KEY);

    if (savedCustomer) {
      const parsed =
        JSON.parse(savedCustomer);

      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.customerId
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error(
      "Failed to load guest customer:",
      error
    );
  }

  const customer = {
    customerId: generateCustomerId(),
    createdAt: new Date().toISOString(),
    name: "",
    email: "",
    phone: "",
  };

  try {
    localStorage.setItem(
      CUSTOMER_KEY,
      JSON.stringify(customer)
    );
  } catch (error) {
    console.error(
      "Failed to save guest customer:",
      error
    );
  }

  return customer;
};

/* =========================================================
   SAVE GUEST CUSTOMER
========================================================= */

const saveCustomer = (customer) => {
  try {
    localStorage.setItem(
      CUSTOMER_KEY,
      JSON.stringify(customer)
    );
  } catch (error) {
    console.error(
      "Failed to save guest customer:",
      error
    );
  }
};

/* =========================================================
   MONEY
========================================================= */

const formatMoney = (amount) => {
  return Number(amount || 0).toFixed(2);
};

/* =========================================================
   PAYMENT PAGE
========================================================= */

function Payment() {
  const {
    cart,
    total,
    clearCart,
  } = useCart();

  /* =======================================================
     STATE
  ======================================================= */

  const [customer, setCustomer] =
    useState(null);

  const [trainingBooking, setTrainingBooking] =
    useState(null);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [order, setOrder] =
    useState(null);

  /* =======================================================
     GUEST CUSTOMER FORM
  ======================================================= */

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  /* =======================================================
     LOAD GUEST CUSTOMER + TRAINING
  ======================================================= */

  useEffect(() => {
    const identity =
      getCustomerIdentity();

    setCustomer(identity);

    setForm({
      name: identity.name || "",
      email: identity.email || "",
      phone: identity.phone || "",
    });

    /* =====================================================
       LOAD PENDING TRAINING BOOKING

       Training payments remain separate from the product
       order flow until the training backend is connected.
    ===================================================== */

    try {
      const pending =
        localStorage.getItem(
          PENDING_TRAINING_KEY
        );

      if (!pending) {
        return;
      }

      const parsed =
        JSON.parse(pending);

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        setTrainingBooking(parsed);
      }
    } catch (storageError) {
      console.error(
        "Failed to load pending training booking:",
        storageError
      );

      setTrainingBooking(null);
    }
  }, []);

  /* =======================================================
     PAYMENT TYPE
  ======================================================= */

  const isTrainingPayment =
    Boolean(trainingBooking);

  /* =======================================================
     PAYMENT TOTAL
  ======================================================= */

  const paymentTotal = useMemo(() => {
    if (isTrainingPayment) {
      return Number(
        trainingBooking?.price || 0
      );
    }

    return Number(total || 0);
  }, [
    isTrainingPayment,
    trainingBooking,
    total,
  ]);

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (
    !isTrainingPayment &&
    cart.length === 0 &&
    !order
  ) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-empty">
            <div className="payment-empty-icon">
              <FiPackage />
            </div>

            <h1>
              Your cart is empty
            </h1>

            <p>
              Add products before
              proceeding to checkout.
            </p>

            <Link to="/accounts">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ORDER CREATED / PAYMENT UNAVAILABLE
  ======================================================= */

  if (order) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-success">

            <div className="payment-success-icon">
              <FiClock />
            </div>

            <span>
              ORDER RECEIVED
            </span>

            <h1>
              Payment Temporarily Unavailable
            </h1>

            <p>
              Your order has been successfully
              received, but online payment is
              temporarily unavailable.
            </p>

            <p>
              Our online payment gateway is
              currently undergoing maintenance.
              Please contact the admin team to
              arrange and confirm payment for
              your order.
            </p>

            {/* =========================================
                ORDER REFERENCE
            ========================================= */}

            <div className="payment-success-order">
              <span>
                ORDER ID
              </span>

              <strong>
                {order.orderId}
              </strong>
            </div>

            {/* =========================================
                PAYMENT STATUS
            ========================================= */}

            <div className="payment-success-order">
              <span>
                PAYMENT STATUS
              </span>

              <strong>
                Pending Payment
              </strong>
            </div>

            {/* =========================================
                ORDER AMOUNT
            ========================================= */}

            <div className="payment-success-amount">
              <span>
                Amount Due
              </span>

              <strong>
                $
                {formatMoney(
                  order.totalUSD ??
                    paymentTotal
                )}
              </strong>
            </div>

            {order.totalKES && (
              <div className="payment-success-order">
                <span>
                  AMOUNT DUE
                </span>

                <strong>
                  KES{" "}
                  {formatMoney(
                    order.totalKES
                  )}
                </strong>
              </div>
            )}

            {/* =========================================
                NOTICE
            ========================================= */}

            <div
              className="payment-inline-error"
              style={{
                marginTop: "20px",
              }}
            >
              <FiAlertCircle />

              <span>
                Your order is saved. Stock will
                only be deducted after payment
                has been confirmed by an admin.
              </span>
            </div>

            {/* =========================================
                ACTIONS
            ========================================= */}

            <div className="payment-success-actions">

              <Link
                to="/contact"
                className="payment-button"
              >
                Contact Admin
              </Link>

              <Link
                to="/my-orders"
                className="payment-secondary-button"
              >
                View My Orders
              </Link>

            </div>

            <div
              className="payment-success-actions"
              style={{
                marginTop: "10px",
              }}
            >
              <Link
                to="/accounts"
                className="payment-secondary-button"
              >
                Continue Shopping
              </Link>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     CREATE ORDER
  ======================================================= */

  const handlePayment = async () => {
    if (processing) {
      return;
    }

    setError("");

    /* =====================================================
       CUSTOMER VALIDATION
    ===================================================== */

    const name =
      form.name.trim();

    const email =
      form.email.trim();

    const phone =
      form.phone.trim();

    if (!name) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (!email) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(email)
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!phone) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    /* =====================================================
       PRODUCT CART VALIDATION
    ===================================================== */

    if (
      !isTrainingPayment &&
      !cart.length
    ) {
      setError(
        "Your cart is empty."
      );
      return;
    }

    /* =====================================================
       CUSTOMER REFERENCE
    ===================================================== */

    if (!customer?.customerId) {
      setError(
        "Unable to create customer reference."
      );
      return;
    }

    /* =====================================================
       TRAINING PAYMENT

       Kept separate from the product order API.
    ===================================================== */

    if (isTrainingPayment) {
      setError(
        "Training payments are not connected yet. Please contact admin to complete your training booking."
      );

      return;
    }

    setProcessing(true);

    try {
      /* ===================================================
         SAVE CUSTOMER DETAILS
      =================================================== */

      const updatedCustomer = {
        ...customer,
        name,
        email,
        phone,
      };

      setCustomer(
        updatedCustomer
      );

      saveCustomer(
        updatedCustomer
      );

      /* ===================================================
         CREATE ORDER

         IMPORTANT:
         This does NOT start a payment.

         The backend creates:
           order.status = pending
           payment.status = pending
           payment.provider = manual
      =================================================== */

      const response =
        await fetch(
          `${API_URL}/api/payments/create`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              paymentType: "product",

              items: cart.map(
                (item) => ({
                  productId:
                    item.productId ||
                    item.id,

                  quantity:
                    Math.max(
                      1,
                      Math.floor(
                        Number(
                          item.quantity || 1
                        )
                      )
                    ),
                })
              ),

              customer: {
                customerId:
                  updatedCustomer.customerId,

                name,

                email,

                phone,
              },
            }),
          }
        );

      /* ===================================================
         PARSE RESPONSE
      =================================================== */

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid response received from the order server."
        );
      }

      /* ===================================================
         API ERROR
      =================================================== */

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to create your order."
        );
      }

      /* ===================================================
         ORDER CREATED SUCCESSFULLY
      =================================================== */

      const createdOrder =
        data.order;

      if (!createdOrder) {
        throw new Error(
          "The order was created but no order details were returned."
        );
      }

      setOrder(
        createdOrder
      );

      /* ===================================================
         CLEAR CART AFTER ORDER CREATION

         Payment is NOT required to clear the cart because
         the order has already been saved in MongoDB.

         Stock is NOT deducted here.
      =================================================== */

      clearCart();

    } catch (orderError) {
      console.error(
        "Order creation failed:",
        orderError
      );

      setError(
        orderError.message ||
          "Unable to create your order. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="payment-page">
      <div className="container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="payment-header">
          <span>
            SECURE GUEST CHECKOUT
          </span>

          <h1>
            Complete Your Order
          </h1>

          <p>
            Enter your details below to
            submit your order. Payment will
            be arranged and confirmed by our
            admin team.
          </p>
        </div>

        {/* =================================================
            CUSTOMER INFORMATION
        ================================================= */}

        <div className="payment-customer-form">

          <div className="payment-card-header">

            <div>
              <span>
                CUSTOMER INFORMATION
              </span>

              <h2>
                Your Details
              </h2>
            </div>

            <div className="payment-secure-icon">
              <FiUser />
            </div>

          </div>

          <div className="payment-form-grid">

            {/* FULL NAME */}

            <div className="payment-form-group">
              <label htmlFor="name">
                Full Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={processing}
              />
            </div>

            {/* EMAIL */}

            <div className="payment-form-group">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={processing}
              />
            </div>

            {/* PHONE */}

            <div className="payment-form-group">
              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+254 7XX XXX XXX"
                autoComplete="tel"
                disabled={processing}
              />
            </div>

          </div>

          {/* =================================================
              GUEST REFERENCE
          ================================================= */}

          {customer && (
            <div className="payment-customer">

              <div className="payment-customer-icon">
                <FiUser />
              </div>

              <div>
                <span>
                  GUEST CUSTOMER REFERENCE
                </span>

                <strong>
                  {customer.customerId}
                </strong>
              </div>

              <FiCheckCircle />

            </div>
          )}

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="payment-inline-error">
            <FiAlertCircle />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* =================================================
            PAYMENT / ORDER LAYOUT
        ================================================= */}

        <div className="payment-layout">

          {/* ===============================================
              ORDER / PAYMENT CARD
          =============================================== */}

          <div className="payment-card">

            <div className="payment-card-header">

              <div>
                <span>
                  ORDER CONFIRMATION
                </span>

                <h2>
                  Payment Arrangement
                </h2>
              </div>

              <div className="payment-secure-icon">
                <FiLock />
              </div>

            </div>

            {/* ===========================================
                PAYMENT UNAVAILABLE NOTICE
            =========================================== */}

            <div className="payment-method">

              <div className="payment-method-icon">
                <FiClock />
              </div>

              <div>
                <strong>
                  Online Payment Temporarily Unavailable
                </strong>

                <p>
                  Our online payment gateway is
                  currently undergoing maintenance.
                  Submit your order below and our
                  admin team will contact you to
                  arrange payment.
                </p>
              </div>

            </div>

            {/* ===========================================
                AMOUNT
            =========================================== */}

            <div className="payment-card-total">

              <span>
                Amount Due
              </span>

              <strong>
                $
                {formatMoney(
                  paymentTotal
                )}
              </strong>

            </div>

            {/* ===========================================
                SUBMIT ORDER BUTTON
            =========================================== */}

            <button
              type="button"
              className="payment-button"
              onClick={handlePayment}
              disabled={processing}
            >
              <FiPackage />

              {processing
                ? "Submitting Order..."
                : "Submit Order"}
            </button>

            {/* ===========================================
                SECURITY / PAYMENT NOTE
            =========================================== */}

            <p className="payment-security-note">
              <FiLock />

              Your order is saved before
              payment confirmation. Stock will
              only be deducted after an admin
              confirms payment.
            </p>

          </div>

          {/* ===============================================
              ORDER SUMMARY
          =============================================== */}

          <aside className="payment-summary">

            <div className="payment-summary-header">

              <span>
                YOUR ORDER
              </span>

              <h2>
                Order Summary
              </h2>

            </div>

            <div className="payment-products">

              {cart.map((item) => {

                const quantity =
                  Math.max(
                    1,
                    Math.floor(
                      Number(
                        item.quantity || 1
                      )
                    )
                  );

                const itemTotal =
                  Number(
                    item.price || 0
                  ) * quantity;

                return (
                  <div
                    className="payment-item"
                    key={
                      item.id ||
                      item.productId
                    }
                  >

                    <div className="payment-item-info">

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={
                            item.name ||
                            "Product"
                          }
                        />
                      ) : (
                        <div className="payment-item-placeholder">
                          <FiShoppingBag />
                        </div>
                      )}

                      <div>
                        <strong>
                          {item.name ||
                            "Product"}
                        </strong>

                        <span>
                          Qty: {quantity}
                        </span>
                      </div>

                    </div>

                    <strong>
                      $
                      {formatMoney(
                        itemTotal
                      )}
                    </strong>

                  </div>
                );
              })}

              {/* =========================================
                  TOTAL
              ========================================= */}

              <div className="payment-total">

                <span>
                  Total
                </span>

                <strong>
                  $
                  {formatMoney(
                    total
                  )}
                </strong>

              </div>

            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}

export default Payment;