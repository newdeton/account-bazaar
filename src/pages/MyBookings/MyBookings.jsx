import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import "./MyBookings.css";

/* =========================================================
   STORAGE KEYS
========================================================= */

const CUSTOMER_STORAGE_KEY = "accountBazaarCustomer";
const TRAINING_BOOKINGS_STORAGE_KEY = "trainingBookings";

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
    console.error(`Failed to read ${key}:`, error);
    return [];
  }
};

/* =========================================================
   MY BOOKINGS
========================================================= */

function MyBookings() {
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);

  /* =======================================================
     LOAD CUSTOMER IDENTITY
  ======================================================= */

  const loadCustomerIdentity = () => {
    try {
      const savedCustomer = localStorage.getItem(
        CUSTOMER_STORAGE_KEY
      );

      if (!savedCustomer) {
        setCustomer(null);
        return;
      }

      const parsedCustomer = JSON.parse(savedCustomer);

      if (
        parsedCustomer &&
        (
          parsedCustomer.customerId ||
          parsedCustomer.email ||
          parsedCustomer.customerEmail
        )
      ) {
        setCustomer(parsedCustomer);
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error(
        "Failed to load customer identity:",
        error
      );

      setCustomer(null);
    }
  };

  /* =======================================================
     LOAD TRAINING BOOKINGS
  ======================================================= */

  const loadBookings = () => {
    const savedBookings = readStorageArray(
      TRAINING_BOOKINGS_STORAGE_KEY
    );

    setBookings(savedBookings);
  };

  /* =======================================================
     INITIAL LOAD + SYNC
  ======================================================= */

  useEffect(() => {
    loadCustomerIdentity();
    loadBookings();

    const handleStorageChange = () => {
      loadCustomerIdentity();
      loadBookings();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    /*
     * LocalStorage changes made in the same browser tab
     * do not trigger the storage event, so we periodically
     * refresh the data as well.
     */

    const interval = setInterval(() => {
      loadCustomerIdentity();
      loadBookings();
    }, 1000);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     CUSTOMER-OWNED BOOKINGS
  ======================================================= */

  const customerBookings = useMemo(() => {
    if (!customer) {
      return [];
    }

    const customerId = String(
      customer.customerId || ""
    )
      .trim()
      .toLowerCase();

    const customerEmail = String(
      customer.email ||
        customer.customerEmail ||
        ""
    )
      .trim()
      .toLowerCase();

    if (!customerId && !customerEmail) {
      return [];
    }

    return bookings.filter((booking) => {
      const bookingCustomerId = String(
        booking.customerId || ""
      )
        .trim()
        .toLowerCase();

      const bookingEmail = String(
        booking.customerEmail ||
          booking.email ||
          ""
      )
        .trim()
        .toLowerCase();

      /*
       * PRIMARY OWNERSHIP CHECK
       *
       * Customer ID is the strongest identity match.
       */

      if (
        customerId &&
        bookingCustomerId &&
        bookingCustomerId === customerId
      ) {
        return true;
      }

      /*
       * SECONDARY OWNERSHIP CHECK
       *
       * Keeps older bookings working if they were
       * created before customerId was introduced.
       */

      if (
        customerEmail &&
        bookingEmail &&
        bookingEmail === customerEmail
      ) {
        return true;
      }

      return false;
    });
  }, [customer, bookings]);

  /* =======================================================
     STATUS CLASS
  ======================================================= */

  const getStatusClass = (status) => {
    return String(status || "Pending")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  /* =======================================================
     STATUS ICON
  ======================================================= */

  const getStatusIcon = (status) => {
    const normalized = String(
      status || ""
    ).toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "complete" ||
      normalized === "confirmed"
    ) {
      return <FiCheckCircle />;
    }

    return <FiClock />;
  };

  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "Unknown date";
    }

    return value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* =======================================================
     FORMAT TIME
  ======================================================= */

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return value.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /* =======================================================
     NO CUSTOMER IDENTITY
  ======================================================= */

  if (!customer) {
    return (
      <div className="my-bookings-page">

        <section className="my-bookings-header">
          <div className="container">

            <Link
              to="/"
              className="my-bookings-back"
            >
              <FiArrowLeft />
              Back to Marketplace
            </Link>

            <span>TRAINING BOOKINGS</span>

            <h1>My Bookings</h1>

            <p>
              Your training bookings are linked to
              your customer identity for privacy
              and security.
            </p>

          </div>
        </section>

        <section className="my-bookings-content">
          <div className="container">

            <div className="no-bookings">

              <div className="no-bookings-icon">
                <FiUser />
              </div>

              <span>
                CUSTOMER IDENTITY REQUIRED
              </span>

              <h2>
                We couldn't identify your account
              </h2>

              <p>
                Your training bookings are protected
                and can only be displayed after your
                customer identity has been established.
              </p>

              <Link
                to="/training"
                className="browse-bookings-button"
              >
                <FiBookOpen />
                Browse Training
              </Link>

            </div>

          </div>
        </section>

      </div>
    );
  }

  /* =======================================================
     NO BOOKINGS FOR CURRENT CUSTOMER
  ======================================================= */

  if (customerBookings.length === 0) {
    return (
      <div className="my-bookings-page">

        <section className="my-bookings-header">
          <div className="container">

            <Link
              to="/"
              className="my-bookings-back"
            >
              <FiArrowLeft />
              Back to Marketplace
            </Link>

            <span>TRAINING BOOKINGS</span>

            <h1>My Bookings</h1>

            <p>
              View and manage your Account Bazaar
              training bookings.
            </p>

          </div>
        </section>

        <section className="my-bookings-content">
          <div className="container">

            <div className="no-bookings">

              <div className="no-bookings-icon">
                <FiBookOpen />
              </div>

              <span>
                NO BOOKINGS YET
              </span>

              <h2>
                No Training Bookings
              </h2>

              <p>
                You haven't booked any training yet.
              </p>

              <Link
                to="/training"
                className="browse-bookings-button"
              >
                <FiBookOpen />
                Browse Training
              </Link>

            </div>

          </div>
        </section>

      </div>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <div className="my-bookings-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="my-bookings-header">

        <div className="container">

          <Link
            to="/"
            className="my-bookings-back"
          >
            <FiArrowLeft />
            Back to Marketplace
          </Link>

          <span>
            TRAINING BOOKINGS
          </span>

          <h1>
            My Bookings
          </h1>

          <p>
            View and manage your Account Bazaar
            training bookings.
          </p>

        </div>

      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="my-bookings-content">

        <div className="container">

          {/* =================================================
              CUSTOMER IDENTITY
          ================================================= */}

          <div className="booking-customer-identity">

            <div className="booking-customer-icon">
              <FiShield />
            </div>

            <div className="booking-customer-info">

              <small>
                BOOKINGS SECURED FOR
              </small>

              <strong>
                {customer.name ||
                  customer.fullName ||
                  "Customer"}
              </strong>

              {(
                customer.email ||
                customer.customerEmail
              ) && (
                <span>
                  {customer.email ||
                    customer.customerEmail}
                </span>
              )}

            </div>

            {customer.customerId && (
              <div className="booking-customer-id">

                <small>
                  CUSTOMER ID
                </small>

                <strong>
                  {customer.customerId}
                </strong>

              </div>
            )}

          </div>

          {/* =================================================
              BOOKING LIST
          ================================================= */}

          <div className="booking-list">

            <div className="booking-list-heading">

              <div>

                <span>
                  YOUR HISTORY
                </span>

                <h2>
                  Training Bookings
                </h2>

                <p>
                  Your confirmed and pending training
                  bookings are listed below.
                </p>

              </div>

              <strong>
                {customerBookings.length}{" "}
                {customerBookings.length === 1
                  ? "Booking"
                  : "Bookings"}
              </strong>

            </div>

            <div className="booking-list-items">

              {customerBookings
                .slice()
                .reverse()
                .map((booking) => {

                  const status =
                    booking.status || "Pending";

                  const paymentStatus =
                    booking.paymentStatus ||
                    "Paid";

                  const bookingId =
                    booking.bookingId ||
                    booking.id ||
                    "";

                  const price =
                    Number(
                      booking.price || 0
                    );

                  return (
                    <article
                      className="booking-card"
                      key={bookingId}
                    >

                      {/* =====================================
                          ICON
                      ===================================== */}

                      <div className="booking-card-icon">
                        <FiBookOpen />
                      </div>

                      {/* =====================================
                          MAIN INFORMATION
                      ===================================== */}

                      <div className="booking-main">

                        <div className="booking-title-row">

                          <div>

                            <span className="booking-category">
                              TRAINING PROGRAM
                            </span>

                            <h3>
                              {booking.training ||
                                "Training Program"}
                            </h3>

                          </div>

                          <span
                            className={`booking-status ${getStatusClass(
                              status
                            )}`}
                          >
                            {getStatusIcon(status)}
                            {status}
                          </span>

                        </div>

                        <div className="booking-details">

                          <span>
                            <FiCalendar />

                            {booking.date ||
                              "Date not selected"}
                          </span>

                          <span>
                            <FiClock />

                            {booking.time ||
                              "Flexible"}
                          </span>

                          <span>
                            <FiBookOpen />

                            {booking.level ||
                              "Beginner"}
                          </span>

                          <span>
                            <FiCheckCircle />

                            Payment:{" "}
                            {paymentStatus}
                          </span>

                        </div>

                        <div className="booking-meta">

                          <p>
                            Booking ID:{" "}
                            <strong>
                              #
                              {String(
                                bookingId
                              ).split(".")[0]}
                            </strong>
                          </p>

                          {booking.paidAt && (
                            <p>
                              Paid:{" "}
                              {formatDate(
                                booking.paidAt
                              )}
                              {" • "}
                              {formatTime(
                                booking.paidAt
                              )}
                            </p>
                          )}

                        </div>

                      </div>

                      {/* =====================================
                          PRICE
                      ===================================== */}

                      <div className="booking-price">

                        <small>
                          Training Fee
                        </small>

                        <strong>
                          $
                          {price.toFixed(2)}
                        </strong>

                        <span>
                          {paymentStatus}
                        </span>

                      </div>

                    </article>
                  );
                })}

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default MyBookings;