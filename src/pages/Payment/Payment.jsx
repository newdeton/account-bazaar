import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiCreditCard,
  FiLock,
  FiPackage,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";

import "./Payment.css";

/* =========================================================
   STORAGE KEYS
========================================================= */

const CUSTOMER_KEY = "accountBazaarCustomer";
const PURCHASES_KEY = "purchases";
const TRAINING_BOOKINGS_KEY = "trainingBookings";
const PENDING_TRAINING_KEY = "pendingTrainingBooking";

/* =========================================================
   CUSTOMER ID GENERATOR
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
   GET OR CREATE CUSTOMER IDENTITY
========================================================= */

const getCustomerIdentity = () => {
  try {
    const savedCustomer = localStorage.getItem(
      CUSTOMER_KEY
    );

    if (savedCustomer) {
      const customer = JSON.parse(savedCustomer);

      if (
        customer &&
        typeof customer === "object" &&
        customer.customerId
      ) {
        return customer;
      }
    }
  } catch (error) {
    console.error(
      "Failed to load customer identity:",
      error
    );
  }

  const customer = {
    customerId: generateCustomerId(),
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(
      CUSTOMER_KEY,
      JSON.stringify(customer)
    );
  } catch (error) {
    console.error(
      "Failed to save customer identity:",
      error
    );
  }

  return customer;
};

/* =========================================================
   SAFE STORAGE READER
========================================================= */

const readStorageArray = (key) => {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(
      `Failed to read ${key}:`,
      error
    );

    return [];
  }
};

/* =========================================================
   SAVE CUSTOMER IDENTITY
========================================================= */

const saveCustomerIdentity = (customer) => {
  try {
    localStorage.setItem(
      CUSTOMER_KEY,
      JSON.stringify(customer)
    );
  } catch (error) {
    console.error(
      "Failed to save customer identity:",
      error
    );
  }
};

/* =========================================================
   PAYMENT
========================================================= */

function Payment() {
  const navigate = useNavigate();

  const {
    cart,
    total,
    clearCart,
  } = useCart();

  const [trainingBooking, setTrainingBooking] =
    useState(null);

  const [customer, setCustomer] =
    useState(null);

  const [processing, setProcessing] =
    useState(false);

  /* =======================================================
     LOAD CUSTOMER IDENTITY
  ======================================================= */

  useEffect(() => {
    const identity = getCustomerIdentity();

    setCustomer(identity);

    /* ===============================================
       LOAD PENDING TRAINING BOOKING
    =============================================== */

    try {
      const pendingTraining =
        localStorage.getItem(
          PENDING_TRAINING_KEY
        );

      if (!pendingTraining) {
        return;
      }

      const parsed = JSON.parse(
        pendingTraining
      );

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        setTrainingBooking(parsed);
      }
    } catch (error) {
      console.error(
        "Failed to load pending training booking:",
        error
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
     FORMAT MONEY
  ======================================================= */

  const formatMoney = (amount) => {
    return Number(amount || 0).toFixed(2);
  };

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (
    !isTrainingPayment &&
    cart.length === 0
  ) {
    return (
      <div className="payment-page">
        <div className="container">

          <div className="payment-empty">

            <div className="payment-empty-icon">
              <FiPackage />
            </div>

            <h1>Your cart is empty</h1>

            <p>
              Add products before proceeding
              to payment.
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
     PAYMENT HANDLER
  ======================================================= */

  const handlePayment = () => {
    if (processing) {
      return;
    }

    setProcessing(true);

    try {
      /* ===============================================
         GET CUSTOMER IDENTITY
      =============================================== */

      const identity =
        customer || getCustomerIdentity();

      /*
       * Make absolutely sure the identity exists
       * before creating an order.
       */

      if (!identity?.customerId) {
        throw new Error(
          "Customer identity could not be created."
        );
      }

      saveCustomerIdentity(identity);

      const paidAt =
        new Date().toISOString();

      /* =================================================
         TRAINING PAYMENT
      ================================================= */

      if (isTrainingPayment) {
        const bookings =
          readStorageArray(
            TRAINING_BOOKINGS_KEY
          );

        /* ===============================================
           TRAINING BOOKING ID
        =============================================== */

        const trainingId =
          trainingBooking.bookingId ||
          trainingBooking.id ||
          `TRN-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()}`;

        /* ===============================================
           COMPLETED TRAINING BOOKING
        =============================================== */

        const completedBooking = {
          ...trainingBooking,

          /* CUSTOMER IDENTITY */
          customerId:
            identity.customerId,

          /* BOOKING IDENTITY */
          id: trainingBooking.id || trainingId,

          bookingId: trainingId,

          /* PAYMENT */
          paymentStatus: "Paid",
          paidAt,

          /* BOOKING STATUS */
          status: "Pending",

          /* DATES */
          bookedAt:
            trainingBooking.bookedAt ||
            paidAt,
        };

        /*
         * Prevent accidentally creating duplicate
         * copies of the same pending booking.
         */

        const existingBookingIndex =
          bookings.findIndex(
            (booking) =>
              booking.bookingId === trainingId ||
              (
                booking.id === trainingId &&
                booking.customerId ===
                  identity.customerId
              )
          );

        let updatedBookings;

        if (existingBookingIndex !== -1) {
          updatedBookings =
            bookings.map(
              (booking, index) =>
                index === existingBookingIndex
                  ? completedBooking
                  : booking
            );
        } else {
          updatedBookings = [
            ...bookings,
            completedBooking,
          ];
        }

        localStorage.setItem(
          TRAINING_BOOKINGS_KEY,
          JSON.stringify(
            updatedBookings
          )
        );

        /* REMOVE PENDING PAYMENT */
        localStorage.removeItem(
          PENDING_TRAINING_KEY
        );

        alert(
          "Payment successful! Your training booking has been submitted."
        );

        navigate("/my-bookings");

        return;
      }

      /* =================================================
         PRODUCT PAYMENT
      ================================================= */

      if (!cart.length) {
        alert(
          "Your cart is empty."
        );

        setProcessing(false);

        return;
      }

      /* ===============================================
         LOAD EXISTING PURCHASES
      =============================================== */

      const purchases =
        readStorageArray(
          PURCHASES_KEY
        );

      /* ===============================================
         GENERATE ORDER ID
      =============================================== */

      const orderId =
        `ORD-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;

      /* ===============================================
         CREATE PURCHASE RECORDS
      =============================================== */

      const newPurchases =
        cart.map((product, index) => {

          const quantity =
            Math.max(
              1,
              Number(
                product.quantity || 1
              )
            );

          const productId =
            product.productId ||
            product.id;

          return {
            /* =========================================
               ORIGINAL PRODUCT DATA
            ========================================= */

            ...product,

            /* =========================================
               CUSTOMER IDENTITY
            ========================================= */

            customerId:
              identity.customerId,

            /* =========================================
               ORDER IDENTITY
            ========================================= */

            orderId,

            purchaseId:
              `${orderId}-${index + 1}`,

            productId,

            /* =========================================
               QUANTITY
            ========================================= */

            quantity,

            /* =========================================
               PAYMENT
            ========================================= */

            paymentStatus: "Paid",

            /* =========================================
               ORDER STATUS
            ========================================= */

            status: "Pending",

            /* =========================================
               TIMESTAMPS
            ========================================= */

            purchasedAt: paidAt,

            paidAt,

            /* =========================================
               CUSTOMER SNAPSHOT
               
               This keeps useful customer information
               attached to the transaction.
            ========================================= */

            customerSnapshot: {
              customerId:
                identity.customerId,

              createdAt:
                identity.createdAt,
            },
          };
        });

      /* ===============================================
         SAVE PURCHASES
      =============================================== */

      localStorage.setItem(
        PURCHASES_KEY,
        JSON.stringify([
          ...purchases,
          ...newPurchases,
        ])
      );

      /* ===============================================
         CLEAR CART
      =============================================== */

      clearCart();

      alert(
        "Payment successful! Your order has been submitted."
      );

      navigate("/my-orders");

    } catch (error) {
      console.error(
        "Payment processing failed:",
        error
      );

      alert(
        "Something went wrong while processing your payment. Please try again."
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
            {isTrainingPayment
              ? "TRAINING PAYMENT"
              : "ORDER PAYMENT"}
          </span>

          <h1>
            Complete Payment
          </h1>

          <p>
            {isTrainingPayment
              ? "Complete your payment to confirm your training booking."
              : "Complete payment to submit your order."}
          </p>

        </div>

        {/* =================================================
            CUSTOMER IDENTITY
        ================================================= */}

        {customer && (
          <div className="payment-customer">

            <div className="payment-customer-icon">
              <FiUser />
            </div>

            <div>
              <span>
                CUSTOMER ID
              </span>

              <strong>
                {customer.customerId}
              </strong>
            </div>

            <FiCheckCircle />
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
                  Payment Details
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
                  Payment Method
                </strong>

                <p>
                  Secure payment integration
                  will be connected here.
                </p>

              </div>

            </div>

            {/* CUSTOMER REFERENCE */}

            {customer && (
              <div className="payment-customer-reference">

                <span>
                  Customer Reference
                </span>

                <strong>
                  {customer.customerId}
                </strong>

              </div>
            )}

            {/* PAYMENT TOTAL */}

            <div className="payment-card-total">

              <span>
                Amount Due
              </span>

              <strong>
                ${formatMoney(paymentTotal)}
              </strong>

            </div>

            {/* PAYMENT BUTTON */}

            <button
              type="button"
              className="payment-button"
              onClick={handlePayment}
              disabled={processing}
            >
              <FiLock />

              {processing
                ? "Processing..."
                : `Pay $${formatMoney(
                    paymentTotal
                  )}`}
            </button>

            <p className="payment-security-note">
              <FiLock />

              Your payment and order information
              is securely processed.
            </p>

          </div>

          {/* ===============================================
              SUMMARY
          =============================================== */}

          <aside className="payment-summary">

            <div className="payment-summary-header">

              <span>
                {isTrainingPayment
                  ? "BOOKING"
                  : "YOUR ORDER"}
              </span>

              <h2>
                {isTrainingPayment
                  ? "Training"
                  : "Order Summary"}
              </h2>

            </div>

            {/* =============================================
                TRAINING SUMMARY
            ============================================= */}

            {isTrainingPayment ? (

              <div className="payment-training-summary">

                <div className="payment-training-icon">
                  <FiPackage />
                </div>

                <h3>
                  {trainingBooking.training ||
                    "Training Program"}
                </h3>

                {trainingBooking.date && (
                  <p>
                    <strong>
                      Date:
                    </strong>{" "}
                    {trainingBooking.date}
                  </p>
                )}

                {trainingBooking.time && (
                  <p>
                    <strong>
                      Time:
                    </strong>{" "}
                    {trainingBooking.time}
                  </p>
                )}

                {trainingBooking.level && (
                  <p>
                    <strong>
                      Level:
                    </strong>{" "}
                    {trainingBooking.level}
                  </p>
                )}

                <div className="payment-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    $
                    {formatMoney(
                      trainingBooking.price
                    )}
                  </strong>

                </div>

              </div>

            ) : (

              /* ===========================================
                 PRODUCT SUMMARY
              =========================================== */

              <div className="payment-products">

                {cart.map((item) => {

                  const quantity =
                    Math.max(
                      1,
                      Number(
                        item.quantity || 1
                      )
                    );

                  const itemTotal =
                    Number(
                      item.price || 0
                    ) * quantity;

                  return (
                    <div
                      className="payment-item"
                      key={item.id}
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

                <div className="payment-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    $
                    {formatMoney(total)}
                  </strong>

                </div>

              </div>
            )}

          </aside>

        </div>

      </div>

    </div>
  );
}

export default Payment;