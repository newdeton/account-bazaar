import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
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
      localStorage.getItem(
        CUSTOMER_KEY
      );

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
    customerId:
      generateCustomerId(),

    createdAt:
      new Date().toISOString(),

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
   SAFE STORAGE ARRAY
========================================================= */

const readStorageArray = (key) => {
  try {
    const saved =
      localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      `Failed to read ${key}:`,
      error
    );

    return [];
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
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

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

  const [verifying, setVerifying] =
    useState(false);

  const [error, setError] =
    useState("");

  const [paymentResult, setPaymentResult] =
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
     FLUTTERWAVE RETURN PARAMETERS
  ======================================================= */

  const transactionId =
    searchParams.get(
      "transaction_id"
    );

  const txRef =
    searchParams.get("tx_ref");

  const transactionStatus =
    searchParams.get(
      "status"
    );

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
     VERIFY FLUTTERWAVE PAYMENT
     
     IMPORTANT:
     The frontend NEVER decides whether payment succeeded.
     The backend verifies directly with Flutterwave.
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!transactionId) {
        return;
      }

      if (verifying || paymentResult) {
        return;
      }

      setVerifying(true);
      setProcessing(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/api/payments/verify`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                transactionId,

                txRef:
                  txRef || undefined,
              }),
            }
          );

        let data;

        try {
          data =
            await response.json();
        } catch {
          throw new Error(
            "Invalid response received from payment server."
          );
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Payment verification failed."
          );
        }

        if (cancelled) {
          return;
        }

        /* ===============================================
           PAYMENT VERIFIED
        =============================================== */

        setPaymentResult(
          data.order
        );

        /* ===============================================
           CLEAR PRODUCT CART ONLY AFTER VERIFIED PAYMENT
        =============================================== */

        if (!isTrainingPayment) {
          clearCart();
        }

        /* ===============================================
           CLEAR TRAINING PAYMENT ONLY AFTER VERIFIED PAYMENT
        =============================================== */

        if (isTrainingPayment) {
          localStorage.removeItem(
            PENDING_TRAINING_KEY
          );
        }
      } catch (verificationError) {
        if (cancelled) {
          return;
        }

        console.error(
          "Payment verification failed:",
          verificationError
        );

        setError(
          verificationError.message ||
            "Unable to verify payment."
        );
      } finally {
        if (!cancelled) {
          setVerifying(false);
          setProcessing(false);
        }
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [
    transactionId,
    txRef,
    isTrainingPayment,
    clearCart,
  ]);

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (
    !isTrainingPayment &&
    cart.length === 0 &&
    !transactionId &&
    !paymentResult
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
              proceeding to payment.
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
     SUCCESS
  ======================================================= */

  if (paymentResult) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-success">
            <div className="payment-success-icon">
              <FiCheckCircle />
            </div>

            <span>
              PAYMENT SUCCESSFUL
            </span>

            <h1>
              Payment Confirmed
            </h1>

            <p>
              Your payment has been
              verified successfully and
              your order has been
              received.
            </p>

            <div className="payment-success-order">
              <span>
                ORDER ID
              </span>

              <strong>
                {paymentResult.orderId}
              </strong>
            </div>

            {paymentResult.transactionId && (
              <div className="payment-success-order">
                <span>
                  TRANSACTION ID
                </span>

                <strong>
                  {
                    paymentResult.transactionId
                  }
                </strong>
              </div>
            )}

            <div className="payment-success-amount">
              <span>
                Amount Paid
              </span>

              <strong>
                $
                {formatMoney(
                  paymentResult.totalUSD
                )}
              </strong>
            </div>

            {paymentResult.totalKES && (
              <div className="payment-success-order">
                <span>
                  AMOUNT PROCESSED
                </span>

                <strong>
                  KES{" "}
                  {formatMoney(
                    paymentResult.totalKES
                  )}
                </strong>
              </div>
            )}

            <div className="payment-success-actions">
              <Link
                to="/my-orders"
                className="payment-button"
              >
                View My Orders
              </Link>

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
     PAYMENT VERIFICATION ERROR
  ======================================================= */

  if (
    error &&
    transactionId
  ) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-error">
            <div className="payment-error-icon">
              <FiAlertCircle />
            </div>

            <span>
              PAYMENT VERIFICATION
            </span>

            <h1>
              Payment Verification Failed
            </h1>

            <p>
              {error}
            </p>

            {transactionStatus && (
              <p>
                Flutterwave returned
                payment status:{" "}
                <strong>
                  {transactionStatus}
                </strong>
              </p>
            )}

            <div className="payment-error-actions">
              <Link
                to="/accounts"
                className="payment-secondary-button"
              >
                Return to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     START PAYMENT
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

    setProcessing(true);

    try {
      /* ===================================================
         SAVE GUEST CUSTOMER DETAILS
         
         This does NOT create an account.
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
         TRAINING PAYMENT
      =================================================== */

      if (isTrainingPayment) {
        setError(
          "Training payments are not connected yet."
        );

        setProcessing(false);

        return;
      }

      /* ===================================================
         CREATE PRODUCT PAYMENT
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
              paymentType:
                "product",

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

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid response received from the payment server."
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to initialize payment."
        );
      }

      /* ===================================================
         FLUTTERWAVE CHECKOUT URL
      =================================================== */

      const checkoutUrl =
        data.payment?.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error(
          "Flutterwave checkout URL was not returned."
        );
      }

      /* ===================================================
         REDIRECT TO FLUTTERWAVE
      =================================================== */

      window.location.href =
        checkoutUrl;
    } catch (paymentError) {
      console.error(
        "Payment initialization failed:",
        paymentError
      );

      setError(
        paymentError.message ||
          "Unable to initialize payment."
      );

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
            Complete Your Payment
          </h1>

          <p>
            No account or signup required.
            Enter your details below to
            continue securely.
          </p>
        </div>

        {/* =================================================
            GUEST CUSTOMER INFORMATION
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
            PAYMENT LAYOUT
        ================================================= */}

        <div className="payment-layout">

          {/* ===============================================
              PAYMENT CARD
          =============================================== */}

          <div className="payment-card">

            <div className="payment-card-header">

              <div>
                <span>
                  SECURE CHECKOUT
                </span>

                <h2>
                  Payment Method
                </h2>
              </div>

              <div className="payment-secure-icon">
                <FiLock />
              </div>

            </div>

            {/* PAYMENT METHOD */}

            <div className="payment-method">

              <div className="payment-method-icon">
                <FiCreditCard />
              </div>

              <div>
                <strong>
                  Flutterwave
                </strong>

                <p>
                  You will be redirected
                  to Flutterwave's secure
                  checkout to complete
                  your payment.
                </p>
              </div>

            </div>

            {/* AMOUNT */}

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

            {/* PAY BUTTON */}

            <button
              type="button"
              className="payment-button"
              onClick={handlePayment}
              disabled={processing}
            >
              <FiLock />

              {processing
                ? "Connecting to Flutterwave..."
                : `Pay $${formatMoney(
                    paymentTotal
                  )}`}
            </button>

            <p className="payment-security-note">
              <FiLock />

              Secure guest checkout. Your
              cart is cleared only after
              Flutterwave payment verification
              succeeds.
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

              {/* TOTAL */}

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