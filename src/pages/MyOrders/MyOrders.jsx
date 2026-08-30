import {
  FiArrowLeft,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiShoppingBag,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import "./MyOrders.css";

/* =========================================================
   STORAGE KEYS
========================================================= */

const CUSTOMER_STORAGE_KEY =
  "accountBazaarCustomer";

const PURCHASES_STORAGE_KEY =
  "purchases";

/* =========================================================
   SAFE JSON READER
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
   CUSTOMER ID NORMALIZER
========================================================= */

const normalizeCustomerId = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

/* =========================================================
   DATE FORMATTER
========================================================= */

const formatDate = (date) => {
  if (!date) {
    return "Unknown date";
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return "Unknown date";
  }

  return value.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

/* =========================================================
   TIME FORMATTER
========================================================= */

const formatTime = (date) => {
  if (!date) {
    return "";
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return "";
  }

  return value.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
};

/* =========================================================
   STATUS CLASS
========================================================= */

const getStatusClass = (
  status
) => {
  return String(
    status || "Pending"
  )
    .toLowerCase()
    .replace(/\s+/g, "-");
};

/* =========================================================
   STATUS ICON
========================================================= */

const getStatusIcon = (
  status
) => {
  const normalized =
    String(status || "")
      .toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "delivered" ||
    normalized === "complete"
  ) {
    return <FiCheckCircle />;
  }

  if (
    normalized === "processing" ||
    normalized === "shipped"
  ) {
    return <FiPackage />;
  }

  return <FiClock />;
};

/* =========================================================
   ORDER TOTAL
========================================================= */

const getOrderTotal = (
  order
) => {
  const price =
    Number(
      order?.price || 0
    );

  const quantity =
    Math.max(
      1,
      Number(
        order?.quantity || 1
      )
    );

  return price * quantity;
};

/* =========================================================
   MY ORDERS
========================================================= */

function MyOrders() {
  const [customer, setCustomer] =
    useState(null);

  const [purchases, setPurchases] =
    useState([]);

  /* =======================================================
     LOAD CUSTOMER
  ======================================================= */

  const loadCustomerIdentity =
    () => {
      try {
        const savedCustomer =
          localStorage.getItem(
            CUSTOMER_STORAGE_KEY
          );

        if (!savedCustomer) {
          setCustomer(null);
          return;
        }

        const parsedCustomer =
          JSON.parse(
            savedCustomer
          );

        /*
         * Customer ID is mandatory.
         *
         * We intentionally do NOT use email as an
         * ownership fallback.
         */

        if (
          parsedCustomer &&
          typeof parsedCustomer ===
            "object" &&
          parsedCustomer.customerId
        ) {
          setCustomer(
            parsedCustomer
          );

          return;
        }

        setCustomer(null);
      } catch (error) {
        console.error(
          "Failed to load customer identity:",
          error
        );

        setCustomer(null);
      }
    };

  /* =======================================================
     LOAD PURCHASES
  ======================================================= */

  const loadPurchases =
    () => {
      const savedPurchases =
        readStorageArray(
          PURCHASES_STORAGE_KEY
        );

      setPurchases(
        savedPurchases
      );
    };

  /* =======================================================
     INITIAL LOAD + SYNC
  ======================================================= */

  useEffect(() => {
    loadCustomerIdentity();
    loadPurchases();

    const handleStorageChange =
      () => {
        loadCustomerIdentity();
        loadPurchases();
      };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    /*
     * LocalStorage does not fire the storage event
     * in the same browser tab that made the change.
     *
     * This small polling interval keeps My Orders
     * synchronized with payments/admin updates.
     */

    const interval =
      setInterval(() => {
        loadCustomerIdentity();
        loadPurchases();
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
     CURRENT CUSTOMER ID
  ======================================================= */

  const customerId =
    normalizeCustomerId(
      customer?.customerId
    );

  /* =======================================================
     CUSTOMER ORDERS
     
     IMPORTANT:
     Orders are ONLY considered owned by the customer
     when their customerId matches exactly.
     
     Email is intentionally NOT used as fallback.
  ======================================================= */

  const customerOrders =
    useMemo(() => {
      if (!customerId) {
        return [];
      }

      return purchases.filter(
        (order) => {
          const orderCustomerId =
            normalizeCustomerId(
              order?.customerId
            );

          return (
            orderCustomerId &&
            orderCustomerId ===
              customerId
          );
        }
      );
    }, [
      customerId,
      purchases,
    ]);

  /* =======================================================
     SORT ORDERS
     
     Newest purchases first.
  ======================================================= */

  const sortedOrders =
    useMemo(() => {
      return customerOrders
        .slice()
        .sort((a, b) => {
          const dateA =
            new Date(
              a?.purchasedAt ||
                a?.paidAt ||
                0
            ).getTime();

          const dateB =
            new Date(
              b?.purchasedAt ||
                b?.paidAt ||
                0
            ).getTime();

          return dateB - dateA;
        });
    }, [
      customerOrders,
    ]);

  /* =======================================================
     UNIQUE ORDERS
     
     Multiple products can belong to one orderId.
     Therefore Total Orders should count actual orders,
     not individual product lines.
  ======================================================= */

  const uniqueOrderIds =
    useMemo(() => {
      const ids =
        new Set();

      customerOrders.forEach(
        (order) => {
          const id =
            order?.orderId ||
            order?.purchaseId ||
            order?.id;

          if (id) {
            ids.add(
              String(id)
            );
          }
        }
      );

      return ids;
    }, [
      customerOrders,
    ]);

  /* =======================================================
     TOTAL ITEMS
  ======================================================= */

  const totalItems =
    useMemo(() => {
      return customerOrders.reduce(
        (count, order) =>
          count +
          Math.max(
            1,
            Number(
              order?.quantity || 1
            )
          ),
        0
      );
    }, [
      customerOrders,
    ]);

  /* =======================================================
     TOTAL SPENT
  ======================================================= */

  const totalSpent =
    useMemo(() => {
      return customerOrders.reduce(
        (sum, order) =>
          sum +
          getOrderTotal(order),
        0
      );
    }, [
      customerOrders,
    ]);

  /* =======================================================
     CUSTOMER DISPLAY NAME
  ======================================================= */

  const customerName =
    customer?.name ||
    customer?.fullName ||
    customer?.customerName ||
    "Customer";

  /* =======================================================
     NO CUSTOMER IDENTITY
  ======================================================= */

  if (!customerId) {
    return (
      <div className="my-orders-page">

        <section className="my-orders-header">
          <div className="container">

            <Link
              to="/"
              className="my-orders-back"
            >
              <FiArrowLeft />
              Back to Marketplace
            </Link>

            <span>
              ORDER HISTORY
            </span>

            <h1>
              My Orders
            </h1>

            <p>
              Your purchases are linked
              to your unique customer
              identity for privacy and
              security.
            </p>

          </div>
        </section>

        <section className="my-orders-content">

          <div className="container">

            <div className="no-orders">

              <div className="no-orders-icon">
                <FiUser />
              </div>

              <span>
                CUSTOMER IDENTITY REQUIRED
              </span>

              <h2>
                We couldn't identify
                your customer account
              </h2>

              <p>
                Your orders are protected
                and can only be displayed
                after a valid customer
                identity has been established.
              </p>

              <Link
                to="/accounts"
                className="browse-orders-button"
              >
                <FiShoppingBag />
                Browse Marketplace
              </Link>

            </div>

          </div>

        </section>

      </div>
    );
  }

  /* =======================================================
     NO ORDERS FOR CURRENT CUSTOMER
  ======================================================= */

  if (
    customerOrders.length === 0
  ) {
    return (
      <div className="my-orders-page">

        <section className="my-orders-header">

          <div className="container">

            <Link
              to="/"
              className="my-orders-back"
            >
              <FiArrowLeft />
              Back to Marketplace
            </Link>

            <span>
              ORDER HISTORY
            </span>

            <h1>
              My Orders
            </h1>

            <p>
              View your purchases,
              order status, and
              transaction history.
            </p>

          </div>

        </section>

        <section className="my-orders-content">

          <div className="container">

            {/* CUSTOMER IDENTITY */}

            <div className="customer-identity-bar">

              <div className="customer-identity-icon">
                <FiShield />
              </div>

              <div className="customer-identity-info">

                <small>
                  CUSTOMER
                </small>

                <strong>
                  {customerName}
                </strong>

                {(
                  customer?.email ||
                  customer?.customerEmail
                ) && (
                  <span>
                    {customer.email ||
                      customer.customerEmail}
                  </span>
                )}

              </div>

              {customer?.customerId && (
                <div className="customer-id">

                  <small>
                    CUSTOMER ID
                  </small>

                  <strong>
                    {customer.customerId}
                  </strong>

                </div>
              )}

            </div>

            <div className="no-orders">

              <div className="no-orders-icon">
                <FiShoppingBag />
              </div>

              <span>
                NO ORDERS YET
              </span>

              <h2>
                Your order history
                is empty
              </h2>

              <p>
                You haven't purchased
                anything from Account
                Bazaar yet.
              </p>

              <Link
                to="/accounts"
                className="browse-orders-button"
              >
                <FiShoppingBag />
                Browse Marketplace
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
    <div className="my-orders-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="my-orders-header">

        <div className="container">

          <Link
            to="/"
            className="my-orders-back"
          >
            <FiArrowLeft />
            Back to Marketplace
          </Link>

          <span>
            ORDER HISTORY
          </span>

          <h1>
            My Orders
          </h1>

          <p>
            View your purchases,
            order status, and
            transaction history.
          </p>

        </div>

      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="my-orders-content">

        <div className="container">

          {/* =================================================
              CUSTOMER IDENTITY
          ================================================= */}

          <div className="customer-identity-bar">

            <div className="customer-identity-icon">
              <FiShield />
            </div>

            <div className="customer-identity-info">

              <small>
                ORDERS SECURED FOR
              </small>

              <strong>
                {customerName}
              </strong>

              {(
                customer?.email ||
                customer?.customerEmail
              ) && (
                <span>
                  {customer.email ||
                    customer.customerEmail}
                </span>
              )}

            </div>

            <div className="customer-id">

              <small>
                CUSTOMER ID
              </small>

              <strong>
                {customer.customerId}
              </strong>

            </div>

          </div>

          {/* =================================================
              ORDER OVERVIEW
          ================================================= */}

          <div className="orders-overview">

            {/* TOTAL ORDERS */}

            <div className="orders-overview-card">

              <div className="orders-overview-icon">
                <FiShoppingBag />
              </div>

              <div>

                <small>
                  Total Orders
                </small>

                <strong>
                  {uniqueOrderIds.size}
                </strong>

              </div>

            </div>

            {/* ITEMS PURCHASED */}

            <div className="orders-overview-card">

              <div className="orders-overview-icon">
                <FiBox />
              </div>

              <div>

                <small>
                  Items Purchased
                </small>

                <strong>
                  {totalItems}
                </strong>

              </div>

            </div>

            {/* TOTAL SPENT */}

            <div className="orders-overview-card">

              <div className="orders-overview-icon">
                <FiCheckCircle />
              </div>

              <div>

                <small>
                  Total Spent
                </small>

                <strong>
                  $
                  {totalSpent.toFixed(
                    2
                  )}
                </strong>

              </div>

            </div>

          </div>

          {/* =================================================
              ORDERS SECTION
          ================================================= */}

          <div className="orders-section">

            <div className="orders-section-header">

              <div>

                <span>
                  YOUR PURCHASES
                </span>

                <h2>
                  Order History
                </h2>

                <p>
                  Your recently purchased
                  products are listed
                  below.
                </p>

              </div>

              <strong>
                {uniqueOrderIds.size}{" "}
                {uniqueOrderIds.size ===
                1
                  ? "Order"
                  : "Orders"}
              </strong>

            </div>

            {/* =================================================
                ORDER LIST
            ================================================= */}

            <div className="orders-list">

              {sortedOrders.map(
                (order, index) => {

                  const quantity =
                    Math.max(
                      1,
                      Number(
                        order?.quantity ||
                          1
                      )
                    );

                  const orderTotal =
                    getOrderTotal(
                      order
                    );

                  const status =
                    order?.status ||
                    "Pending";

                  const paymentStatus =
                    order?.paymentStatus ||
                    "Paid";

                  const orderId =
                    order?.purchaseId ||
                    order?.orderId ||
                    order?.id ||
                    `ORDER-${index + 1}`;

                  const displayOrderId =
                    order?.orderId ||
                    orderId;

                  return (
                    <article
                      className="order-card"
                      key={orderId}
                    >

                      {/* =====================================
                          PRODUCT IMAGE
                      ===================================== */}

                      <div className="order-product-image">

                        {order?.image ? (

                          <img
                            src={order.image}
                            alt={
                              order?.name ||
                              "Purchased product"
                            }
                          />

                        ) : (

                          <div className="order-image-placeholder">
                            <FiShoppingBag />
                          </div>

                        )}

                      </div>

                      {/* =====================================
                          ORDER INFORMATION
                      ===================================== */}

                      <div className="order-main">

                        <div className="order-top">

                          <div>

                            <span className="order-category">
                              {order?.category ||
                                "Marketplace"}
                            </span>

                            <h3>
                              {order?.name ||
                                "Product"}
                            </h3>

                          </div>

                          <span
                            className={`order-status ${getStatusClass(
                              status
                            )}`}
                          >
                            {getStatusIcon(
                              status
                            )}

                            {status}
                          </span>

                        </div>

                        <div className="order-details">

                          <span>
                            <FiPackage />

                            Quantity:{" "}
                            {quantity}
                          </span>

                          <span>
                            <FiCheckCircle />

                            Payment:{" "}
                            {paymentStatus}
                          </span>

                          <span>
                            <FiClock />

                            {formatDate(
                              order?.purchasedAt ||
                                order?.paidAt
                            )}

                            {(
                              order?.purchasedAt ||
                              order?.paidAt
                            ) && (
                              <>
                                {" • "}
                                {formatTime(
                                  order?.purchasedAt ||
                                    order?.paidAt
                                )}
                              </>
                            )}
                          </span>

                        </div>

                        {/* ORDER ID */}

                        <p className="order-id">

                          Order ID:{" "}

                          <strong>
                            #
                            {String(
                              displayOrderId
                            ).split(".")[0]}
                          </strong>

                        </p>

                        {/* CUSTOMER ID */}

                        <p className="order-customer-id">

                          Customer ID:{" "}

                          <strong>
                            {order.customerId}
                          </strong>

                        </p>

                      </div>

                      {/* =====================================
                          PRICE
                      ===================================== */}

                      <div className="order-price">

                        <small>
                          Order Total
                        </small>

                        <strong>
                          $
                          {orderTotal.toFixed(
                            2
                          )}
                        </strong>

                        <span>
                          $
                          {Number(
                            order?.price ||
                              0
                          ).toFixed(
                            2
                          )}{" "}
                          × {quantity}
                        </span>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default MyOrders;