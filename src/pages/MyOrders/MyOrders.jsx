import {
  FiArrowLeft,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { Link } from "react-router-dom";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./MyOrders.css";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================================================
   STORAGE
========================================================= */

const CUSTOMER_STORAGE_KEY =
  "accountBazaarCustomer";

/* =========================================================
   DATE FORMATTER
========================================================= */

const formatDate = (date) => {
  if (!date) {
    return "Unknown date";
  }

  const value = new Date(date);

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

  const value = new Date(date);

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
    status || "pending"
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
    normalized === "complete" ||
    normalized === "delivered"
  ) {
    return <FiCheckCircle />;
  }

  if (
    normalized === "processing" ||
    normalized === "shipped" ||
    normalized === "paid"
  ) {
    return <FiPackage />;
  }

  return <FiClock />;
};

/* =========================================================
   PAYMENT STATUS
========================================================= */

const getPaymentStatus = (
  order
) => {
  const paymentStatus =
    order?.payment?.status ||
    order?.paymentStatus ||
    "pending";

  switch (
    String(paymentStatus).toLowerCase()
  ) {
    case "successful":
      return "Successful";

    case "failed":
      return "Failed";

    case "cancelled":
      return "Cancelled";

    default:
      return "Pending Payment";
  }
};

/* =========================================================
   ORDER TOTAL
========================================================= */

const getOrderTotal = (
  order
) => {
  /* -------------------------------------------------------
     New MongoDB order structure
  ------------------------------------------------------- */

  if (
    typeof order?.totalUSD ===
    "number"
  ) {
    return order.totalUSD;
  }

  /* -------------------------------------------------------
     Fallback for existing legacy orders
  ------------------------------------------------------- */

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
   ORDER ITEMS COUNT
========================================================= */

const getOrderItemsCount = (
  order
) => {
  /* New order structure */

  if (
    Array.isArray(
      order?.items
    )
  ) {
    return order.items.reduce(
      (total, item) =>
        total +
        Math.max(
          1,
          Number(
            item?.quantity || 1
          )
        ),
      0
    );
  }

  /* Legacy order structure */

  return Math.max(
    1,
    Number(
      order?.quantity || 1
    )
  );
};

/* =========================================================
   MY ORDERS
========================================================= */

function MyOrders() {
  const [customer, setCustomer] =
    useState(null);

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD CUSTOMER IDENTITY
  ======================================================= */

  const loadCustomerIdentity =
    useCallback(() => {
      try {
        const savedCustomer =
          localStorage.getItem(
            CUSTOMER_STORAGE_KEY
          );

        if (!savedCustomer) {
          setCustomer(null);
          return null;
        }

        const parsedCustomer =
          JSON.parse(
            savedCustomer
          );

        if (
          parsedCustomer &&
          typeof parsedCustomer ===
            "object" &&
          parsedCustomer.customerId
        ) {
          setCustomer(
            parsedCustomer
          );

          return parsedCustomer;
        }

        setCustomer(null);

        return null;
      } catch (identityError) {
        console.error(
          "Failed to load customer identity:",
          identityError
        );

        setCustomer(null);

        return null;
      }
    }, []);

  /* =======================================================
     CURRENT CUSTOMER ID
  ======================================================= */

  const customerId =
    customer?.customerId || "";

  /* =======================================================
     FETCH ORDERS FROM MONGODB
  ======================================================= */

  const fetchOrders = useCallback(
    async (
      showFullLoader = true
    ) => {
      if (!customerId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/api/payments/orders/customer/${encodeURIComponent(
              customerId
            )}`
          );

        let data;

        try {
          data =
            await response.json();
        } catch {
          throw new Error(
            "Invalid response received from the order server."
          );
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load your orders."
          );
        }

        setOrders(
          Array.isArray(
            data.orders
          )
            ? data.orders
            : []
        );
      } catch (fetchError) {
        console.error(
          "Failed to fetch customer orders:",
          fetchError
        );

        setError(
          fetchError.message ||
            "Unable to load your orders. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customerId]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const identity =
      loadCustomerIdentity();

    if (!identity?.customerId) {
      setLoading(false);
    }
  }, [
    loadCustomerIdentity,
  ]);

  /* =======================================================
     LOAD CUSTOMER ORDERS
  ======================================================= */

  useEffect(() => {
    if (!customerId) {
      return;
    }

    fetchOrders(true);
  }, [
    customerId,
    fetchOrders,
  ]);

  /* =======================================================
     REFRESH ORDERS

     This allows the page to reflect an admin payment
     confirmation without requiring the customer to
     manually reload the browser.
  ======================================================= */

  useEffect(() => {
    if (!customerId) {
      return undefined;
    }

    const interval =
      setInterval(() => {
        fetchOrders(false);
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [
    customerId,
    fetchOrders,
  ]);

  /* =======================================================
     STORAGE SYNC

     If the customer information changes in another tab,
     refresh the customer identity and orders.
  ======================================================= */

  useEffect(() => {
    const handleStorageChange =
      () => {
        const identity =
          loadCustomerIdentity();

        if (
          identity?.customerId
        ) {
          fetchOrders(false);
        }
      };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, [
    loadCustomerIdentity,
    fetchOrders,
  ]);

  /* =======================================================
     SORT ORDERS

     Newest orders first.
  ======================================================= */

  const sortedOrders =
    useMemo(() => {
      return orders
        .slice()
        .sort((a, b) => {
          const dateA =
            new Date(
              a?.createdAt ||
                a?.purchasedAt ||
                a?.paidAt ||
                0
            ).getTime();

          const dateB =
            new Date(
              b?.createdAt ||
                b?.purchasedAt ||
                b?.paidAt ||
                0
            ).getTime();

          return dateB - dateA;
        });
    }, [orders]);

  /* =======================================================
     TOTAL ITEMS
  ======================================================= */

  const totalItems =
    useMemo(() => {
      return orders.reduce(
        (count, order) =>
          count +
          getOrderItemsCount(
            order
          ),
        0
      );
    }, [orders]);

  /* =======================================================
     TOTAL SPENT
  ======================================================= */

  const totalSpent =
    useMemo(() => {
      return orders.reduce(
        (sum, order) =>
          sum +
          getOrderTotal(order),
        0
      );
    }, [orders]);

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
              identity.
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
                your customer reference
              </h2>

              <p>
                Please return to the
                marketplace and complete
                checkout to create your
                customer reference.
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
     LOADING
  ======================================================= */

  if (loading) {
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
              Loading your orders...
            </p>

          </div>
        </section>

        <section className="my-orders-content">
          <div className="container">

            <div className="no-orders">

              <div className="no-orders-icon">
                <FiClock />
              </div>

              <h2>
                Loading orders
              </h2>

              <p>
                Please wait while we
                retrieve your order history.
              </p>

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
            View your orders, payment
            status, and order progress.
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

              {customer?.email && (
                <span>
                  {customer.email}
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
                  {orders.length}
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

            {/* TOTAL VALUE */}

            <div className="orders-overview-card">

              <div className="orders-overview-icon">
                <FiCheckCircle />
              </div>

              <div>

                <small>
                  Order Value
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
                  Your orders are retrieved
                  directly from our server.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  fetchOrders(false)
                }
                className="payment-secondary-button"
                disabled={refreshing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: refreshing
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <FiRefreshCw
                  style={{
                    animation: refreshing
                      ? "spin 1s linear infinite"
                      : "none",
                  }}
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

            </div>

            {/* =================================================
                NO ORDERS
            ================================================= */}

            {sortedOrders.length === 0 ? (

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
                  You haven't placed
                  any orders from Account
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

            ) : (

              /* =================================================
                  ORDER LIST
              ================================================= */

              <div className="orders-list">

                {sortedOrders.map(
                  (order) => {

                    const orderId =
                      order?.orderId ||
                      order?._id;

                    const status =
                      order?.status ||
                      "pending";

                    const paymentStatus =
                      getPaymentStatus(
                        order
                      );

                    const orderTotal =
                      getOrderTotal(
                        order
                      );

                    const itemCount =
                      getOrderItemsCount(
                        order
                      );

                    const orderDate =
                      order?.createdAt ||
                      order?.purchasedAt ||
                      order?.paidAt;

                    /* =================================================
                       PRODUCT ITEMS
                    ================================================= */

                    const items =
                      Array.isArray(
                        order?.items
                      )
                        ? order.items
                        : [];

                    return (
                      <article
                        className="order-card"
                        key={
                          orderId
                        }
                      >

                        {/* =====================================
                            PRODUCT IMAGE
                        ===================================== */}

                        <div className="order-product-image">

                          {items[0]?.image ? (

                            <img
                              src={
                                items[0]
                                  .image
                              }
                              alt={
                                items[0]
                                  ?.name ||
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
                                Marketplace
                              </span>

                              <h3>
                                {items.length ===
                                1
                                  ? items[0]
                                      ?.name ||
                                    "Product"
                                  : `${items.length} Products`}
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

                              {String(
                                status
                              )
                                .charAt(0)
                                .toUpperCase() +
                                String(
                                  status
                                ).slice(1)}

                            </span>

                          </div>

                          {/* =================================
                              MULTIPLE ITEMS
                          ================================= */}

                          {items.length >
                            1 && (
                            <div
                              style={{
                                marginTop:
                                  "8px",
                                fontSize:
                                  "0.9rem",
                                opacity:
                                  0.8,
                              }}
                            >
                              {items.map(
                                (
                                  item,
                                  itemIndex
                                ) => (
                                  <div
                                    key={`${orderId}-${itemIndex}`}
                                  >
                                    {item?.name ||
                                      "Product"}{" "}
                                    ×{" "}
                                    {Math.max(
                                      1,
                                      Number(
                                        item?.quantity ||
                                          1
                                      )
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          <div className="order-details">

                            <span>
                              <FiPackage />

                              Items:{" "}
                              {itemCount}
                            </span>

                            <span>
                              <FiCheckCircle />

                              Payment:{" "}
                              {paymentStatus}
                            </span>

                            <span>
                              <FiClock />

                              {formatDate(
                                orderDate
                              )}

                              {orderDate && (
                                <>
                                  {" • "}
                                  {formatTime(
                                    orderDate
                                  )}
                                </>
                              )}

                            </span>

                          </div>

                          {/* =================================
                              ORDER ID
                          ================================= */}

                          <p className="order-id">

                            Order ID:{" "}

                            <strong>
                              #
                              {String(
                                orderId ||
                                  ""
                              ).split(
                                "."
                              )[0]}
                            </strong>

                          </p>

                          {/* =================================
                              CUSTOMER ID
                          ================================= */}

                          <p className="order-customer-id">

                            Customer ID:{" "}

                            <strong>
                              {
                                order.customerId
                              }
                            </strong>

                          </p>

                          {/* =================================
                              PAYMENT INFORMATION
                          ================================= */}

                          {order?.payment
                            ?.method && (
                            <p className="order-customer-id">
                              Payment Method:{" "}
                              <strong>
                                {
                                  order
                                    .payment
                                    .method
                                }
                              </strong>
                            </p>
                          )}

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

                          {order?.totalKES && (
                            <span>
                              KES{" "}
                              {Number(
                                order.totalKES
                              ).toFixed(
                                2
                              )}
                            </span>
                          )}

                          <span>
                            {paymentStatus}
                          </span>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>

      </section>

    </div>
  );
}

export default MyOrders;