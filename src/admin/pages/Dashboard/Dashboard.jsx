import { useCallback, useEffect, useMemo, useState } from "react";
import { io as createSocket } from "socket.io-client";

import {
  FiAlertCircle,
  FiArrowDownRight,
  FiArrowUpRight,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiMessageSquare,
  FiMoreHorizontal,
  FiPackage,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import StatCard from "../../components/StatCard/StatCard";

import "./Dashboard.css";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================================================
   STORAGE KEYS

   These remain for the parts of the dashboard that have not
   yet been migrated to the backend.

   ORDERS ARE NO LONGER READ FROM PURCHASES.
========================================================= */

const CUSTOMER_KEY =
  "accountBazaarCustomer";

const ACCOUNTS_KEY =
  "accountBazaarAccounts";

const PROXIES_KEY =
  "accountBazaarProxies";

const MESSAGES_KEY =
  "accountBazaarMessages";

const TRAINING_KEY =
  "trainingBookings";

/* =========================================================
   SAFE STORAGE READER
========================================================= */

const readArray = (key) => {
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
   CUSTOMER READER
========================================================= */

const readCustomer = () => {
  try {
    const saved =
      localStorage.getItem(
        CUSTOMER_KEY
      );

    if (!saved) {
      return null;
    }

    const parsed =
      JSON.parse(saved);

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : null;
  } catch (error) {
    console.error(
      "Failed to read customer identity:",
      error
    );

    return null;
  }
};

/* =========================================================
   DATE HELPERS
========================================================= */

const getDate = (item) => {
  const value =
    item?.createdAt ||
    item?.date ||
    item?.purchasedAt ||
    item?.bookedAt ||
    item?.paidAt;

  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

/* =========================================================
   RELATIVE TIME
========================================================= */

const formatRelativeTime = (
  date
) => {
  if (!date) {
    return "Recently";
  }

  const now =
    Date.now();

  const difference =
    now - date.getTime();

  const minutes =
    Math.floor(
      difference / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
};

/* =========================================================
   ORDER TOTAL
========================================================= */

const getOrderTotal = (
  order
) => {
  if (
    typeof order?.totalUSD ===
    "number"
  ) {
    return order.totalUSD;
  }

  if (
    order?.totalUSD !==
    undefined
  ) {
    return Number(
      order.totalUSD || 0
    );
  }

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
   ORDER ITEM COUNT
========================================================= */

const getOrderItemCount = (
  order
) => {
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

  return Math.max(
    1,
    Number(
      order?.quantity || 1
    )
  );
};

/* =========================================================
   PAYMENT STATUS
========================================================= */

const getPaymentStatus = (
  order
) => {
  return String(
    order?.payment?.status ||
      order?.paymentStatus ||
      "pending"
  ).toLowerCase();
};

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const [customer, setCustomer] =
    useState(null);

  const [accounts, setAccounts] =
    useState([]);

  const [proxies, setProxies] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [trainingBookings, setTrainingBookings] =
    useState([]);

  const [ordersLoading, setOrdersLoading] =
    useState(true);

  const [ordersError, setOrdersError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [confirmingOrderId, setConfirmingOrderId] =
    useState(null);

  const [paymentMethod, setPaymentMethod] =
    useState("M-Pesa");

  const [transactionId, setTransactionId] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  /* =======================================================
     REAL-TIME NOTIFICATIONS
  ======================================================= */

  const [notifications, setNotifications] =
    useState([]);

  const [notificationCount, setNotificationCount] =
    useState(0);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const notificationAudioContextRef =
    useState(() => ({ current: null }))[0];

  const playNotificationSound =
    useCallback(() => {
      try {
        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContext) {
          return;
        }

        if (
          !notificationAudioContextRef.current
        ) {
          notificationAudioContextRef.current =
            new AudioContext();
        }

        const audioContext =
          notificationAudioContextRef.current;

        if (
          audioContext.state ===
          "suspended"
        ) {
          audioContext.resume().catch(() => {});
        }

        const oscillator =
          audioContext.createOscillator();

        const gain =
          audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
          880,
          audioContext.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
          1320,
          audioContext.currentTime + 0.12
        );

        gain.gain.setValueAtTime(
          0.0001,
          audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.18,
          audioContext.currentTime + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioContext.currentTime + 0.35
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(
          audioContext.currentTime + 0.35
        );
      } catch (error) {
        console.warn(
          "Notification sound could not play:",
          error
        );
      }
    }, [notificationAudioContextRef]);

  const showBrowserNotification =
    useCallback((notification) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window)
      ) {
        return;
      }

      if (
        Notification.permission !==
        "granted"
      ) {
        return;
      }

      try {
        const browserNotification =
          new Notification(
            notification.title ||
              "Account Bazaar",
            {
              body:
                notification.message ||
                "New activity requires your attention.",
              tag:
                notification.orderId ||
                notification.bookingId ||
                notification.type ||
                "account-bazaar",
            }
          );

        browserNotification.onclick =
          () => {
            window.focus();
            browserNotification.close();
          };
      } catch (error) {
        console.warn(
          "Browser notification could not be shown:",
          error
        );
      }
    }, []);

  const requestNotificationPermission =
    useCallback(async () => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window)
      ) {
        return;
      }

      if (
        Notification.permission ===
        "default"
      ) {
        try {
          await Notification.requestPermission();
        } catch (error) {
          console.warn(
            "Notification permission request failed:",
            error
          );
        }
      }
    }, []);

  const addRealtimeNotification =
    useCallback(
      (notification) => {
        setNotifications(
          (current) => [
            {
              ...notification,
              id:
                notification.id ||
                `${notification.type || "notification"}-${
                  notification.orderId ||
                  notification.bookingId ||
                  Date.now()
                }-${Math.random()
                  .toString(36)
                  .slice(2, 7)}`,
              receivedAt:
                notification.receivedAt ||
                new Date().toISOString(),
            },
            ...current,
          ].slice(0, 30)
        );

        setNotificationCount(
          (current) => current + 1
        );

        playNotificationSound();
        showBrowserNotification(
          notification
        );
      },
      [
        playNotificationSound,
        showBrowserNotification,
      ]
    );

  const markNotificationsRead =
    useCallback(() => {
      setNotificationCount(0);
    }, []);

  /* =======================================================
     LOAD LOCAL DASHBOARD DATA
     
     Orders are deliberately excluded because they now come
     from MongoDB.
  ======================================================= */

  const loadLocalDashboardData =
    useCallback(() => {
      setCustomer(
        readCustomer()
      );

      setAccounts(
        readArray(ACCOUNTS_KEY)
      );

      setProxies(
        readArray(PROXIES_KEY)
      );

      setMessages(
        readArray(MESSAGES_KEY)
      );

      setTrainingBookings(
        readArray(TRAINING_KEY)
      );
    }, []);

  /* =======================================================
     FETCH ORDERS FROM MONGODB
     
     GET /api/payments/orders
  ======================================================= */

  const fetchOrders =
    useCallback(
      async (
        showFullLoader = false
      ) => {
        if (showFullLoader) {
          setOrdersLoading(true);
        } else {
          setRefreshing(true);
        }

        setOrdersError("");

        try {
          const response =
            await fetch(
              `${API_URL}/api/payments/orders`
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
                "Unable to load orders."
            );
          }

          setOrders(
            Array.isArray(
              data.orders
            )
              ? data.orders
              : []
          );
        } catch (error) {
          console.error(
            "Failed to fetch orders:",
            error
          );

          setOrdersError(
            error.message ||
              "Unable to load orders."
          );
        } finally {
          setOrdersLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadLocalDashboardData();

    fetchOrders(true);

    const handleStorageChange =
      () => {
        loadLocalDashboardData();
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
    loadLocalDashboardData,
    fetchOrders,
  ]);

  /* =======================================================
     REAL-TIME SOCKET.IO CONNECTION

     Orders are delivered immediately to the admin dashboard.
     The 10-second refresh below remains as a fallback.
  ======================================================= */

  useEffect(() => {
    const socket =
      createSocket(API_URL, {
        withCredentials: true,
      });

    socket.on("connect", () => {
      console.log(
        "Real-time notification connection established."
      );

      socket.emit("join-admin");

      requestNotificationPermission();
    });

    socket.on(
      "new-order",
      (notification) => {
        addRealtimeNotification(
          notification
        );

        fetchOrders(false);
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.warn(
          "Real-time notification connection failed:",
          error?.message || error
        );
      }
    );

    return () => {
      socket.off("connect");
      socket.off("new-order");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [
    addRealtimeNotification,
    fetchOrders,
    requestNotificationPermission,
  ]);

  /* =======================================================
     AUTO REFRESH ORDERS
     
     New customer orders will appear in the admin dashboard
     without requiring a browser refresh.
  ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        fetchOrders(false);
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [
    fetchOrders,
  ]);

  /* =======================================================
     CUSTOMER IDENTITIES
  ======================================================= */

  const customerIdentities =
    useMemo(() => {
      const identities =
        new Map();

      const addIdentity =
        (item) => {
          if (!item) {
            return;
          }

          const customerId =
            String(
              item.customerId ||
                ""
            )
              .trim()
              .toLowerCase();

          const email =
            String(
              item.customerEmail ||
                item.customer?.email ||
                item.email ||
                ""
            )
              .trim()
              .toLowerCase();

          if (
            !customerId &&
            !email
          ) {
            return;
          }

          const key =
            customerId ||
            email;

          if (
            !identities.has(key)
          ) {
            identities.set(
              key,
              {
                customerId:
                  item.customerId ||
                  "",

                name:
                  item.customer?.name ||
                  item.customerName ||
                  item.name ||
                  item.fullName ||
                  "Customer",

                email:
                  item.customer?.email ||
                  item.customerEmail ||
                  item.email ||
                  "",
              }
            );
          }
        };

      addIdentity(customer);

      orders.forEach(
        addIdentity
      );

      messages.forEach(
        addIdentity
      );

      trainingBookings.forEach(
        addIdentity
      );

      return Array.from(
        identities.values()
      );
    }, [
      customer,
      orders,
      messages,
      trainingBookings,
    ]);

  /* =======================================================
     CUSTOMER COUNT
  ======================================================= */

  const totalCustomers =
    customerIdentities.length;

  /* =======================================================
     INVENTORY COUNTS
  ======================================================= */

  const availableAccounts =
    accounts.filter(
      (account) =>
        String(
          account.status || ""
        ).toLowerCase() ===
        "available"
    ).length;

  const availableProxies =
    proxies.filter(
      (proxy) =>
        String(
          proxy.status || ""
        ).toLowerCase() ===
        "available"
    ).length;

  /* =======================================================
     ORDER STATISTICS
  ======================================================= */

  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order) =>
        String(
          order?.status ||
            "pending"
        ).toLowerCase() ===
        "pending"
    ).length;

  const pendingPayments =
    orders.filter(
      (order) =>
        getPaymentStatus(
          order
        ) === "pending"
    ).length;

  const paidOrders =
    orders.filter(
      (order) =>
        getPaymentStatus(
          order
        ) === "successful"
    ).length;

  /* =======================================================
     TOTAL SALES
     
     Sales are counted from orders that have successfully
     received payment confirmation.
  ======================================================= */

  const totalSales =
    orders.reduce(
      (sum, order) => {
        if (
          getPaymentStatus(
            order
          ) !== "successful"
        ) {
          return sum;
        }

        return (
          sum +
          getOrderTotal(
            order
          )
        );
      },
      0
    );

  /* =======================================================
     MESSAGE STATISTICS
  ======================================================= */

  const unreadMessages =
    messages.filter(
      (message) => {
        const replies =
          message.replies || [];

        return replies.some(
          (reply) =>
            reply.sender ===
              "Customer" &&
            !reply.adminRead
        );
      }
    ).length;

  const totalMessages =
    messages.length;

  /* =======================================================
     TRAINING STATISTICS
  ======================================================= */

  const pendingTraining =
    trainingBookings.filter(
      (booking) =>
        String(
          booking.status ||
            "pending"
        ).toLowerCase() ===
        "pending"
    ).length;

  /* =======================================================
     RECENT ACTIVITY
  ======================================================= */

  const activities =
    useMemo(() => {
      const activityItems =
        [];

      /* -----------------------------------------------
         ACCOUNTS
      ----------------------------------------------- */

      accounts
        .slice(0, 10)
        .forEach(
          (account) => {
            const date =
              getDate(
                account
              );

            activityItems.push({
              id: `account-${
                account.id ||
                account._id ||
                Math.random()
              }`,

              title:
                "Account inventory updated",

              description:
                account.name ||
                "Account added",

              time:
                formatRelativeTime(
                  date
                ),

              date,

              type: "account",
            });
          }
        );

      /* -----------------------------------------------
         PROXIES
      ----------------------------------------------- */

      proxies
        .slice(0, 10)
        .forEach(
          (proxy) => {
            const date =
              getDate(
                proxy
              );

            activityItems.push({
              id: `proxy-${
                proxy.id ||
                proxy._id ||
                Math.random()
              }`,

              title:
                "Proxy inventory updated",

              description:
                proxy.name ||
                proxy.location ||
                "Proxy added",

              time:
                formatRelativeTime(
                  date
                ),

              date,

              type: "proxy",
            });
          }
        );

      /* -----------------------------------------------
         MESSAGES
      ----------------------------------------------- */

      messages
        .slice(0, 10)
        .forEach(
          (message) => {
            const date =
              getDate(
                message
              );

            activityItems.push({
              id: `message-${
                message.id ||
                message._id ||
                Math.random()
              }`,

              title:
                "Customer message received",

              description:
                message.subject ||
                "New customer communication",

              time:
                formatRelativeTime(
                  date
                ),

              date,

              type: "message",
            });
          }
        );

      /* -----------------------------------------------
         TRAINING
      ----------------------------------------------- */

      trainingBookings
        .slice(0, 10)
        .forEach(
          (booking) => {
            const date =
              getDate(
                booking
              );

            activityItems.push({
              id: `training-${
                booking.id ||
                booking._id ||
                Math.random()
              }`,

              title:
                "Training booking received",

              description:
                booking.training ||
                "New training booking",

              time:
                formatRelativeTime(
                  date
                ),

              date,

              type: "training",
            });
          }
        );

      /* -----------------------------------------------
         MONGODB ORDERS
      ----------------------------------------------- */

      orders
        .slice(0, 10)
        .forEach(
          (order) => {
            const date =
              getDate(
                order
              );

            const firstItem =
              Array.isArray(
                order.items
              )
                ? order.items[0]
                : null;

            const itemCount =
              Array.isArray(
                order.items
              )
                ? order.items.length
                : 1;

            activityItems.push({
              id: `order-${
                order.orderId ||
                order._id ||
                Math.random()
              }`,

              title:
                getPaymentStatus(
                  order
                ) === "pending"
                  ? "New order awaiting payment"
                  : "Customer order received",

              description:
                firstItem?.name
                  ? itemCount > 1
                    ? `${firstItem.name} + ${
                        itemCount - 1
                      } more`
                    : firstItem.name
                  : order.customer?.name ||
                    "New marketplace order",

              time:
                formatRelativeTime(
                  date
                ),

              date,

              type: "order",
            });
          }
        );

      return activityItems
        .sort(
          (a, b) => {
            const first =
              a.date?.getTime() ||
              0;

            const second =
              b.date?.getTime() ||
              0;

            return (
              second - first
            );
          }
        )
        .slice(0, 8);
    }, [
      accounts,
      proxies,
      messages,
      trainingBookings,
      orders,
    ]);

  /* =======================================================
     CUSTOMER DISTRIBUTION
  ======================================================= */

  const customerOrderCount =
    new Set(
      orders
        .map(
          (order) =>
            order.customerId ||
            order.customer?.email ||
            order.customerEmail ||
            order.email
        )
        .filter(Boolean)
    ).size;

  const customerMessageCount =
    new Set(
      messages
        .map(
          (message) =>
            message.customerId ||
            message.customerEmail ||
            message.email
        )
        .filter(Boolean)
    ).size;

  const customerTrainingCount =
    new Set(
      trainingBookings
        .map(
          (booking) =>
            booking.customerId ||
            booking.customerEmail ||
            booking.email
        )
        .filter(Boolean)
    ).size;

  const getPercentage =
    (
      value,
      total
    ) => {
      if (!total) {
        return 0;
      }

      return Math.min(
        100,
        Math.round(
          (value / total) *
            100
        )
      );
    };

  const customerBase =
    Math.max(
      totalCustomers,
      1
    );

  /* =======================================================
     RECENT ORDERS
  ======================================================= */

  const recentOrders =
    useMemo(() => {
      return orders
        .slice()
        .sort(
          (a, b) => {
            const dateA =
              getDate(
                a
              )?.getTime() || 0;

            const dateB =
              getDate(
                b
              )?.getTime() || 0;

            return (
              dateB - dateA
            );
          }
        )
        .slice(0, 6);
    }, [orders]);

  /* =======================================================
     OPEN PAYMENT CONFIRMATION
  ======================================================= */

  const openPaymentConfirmation =
    (order) => {
      setConfirmingOrderId(
        order.orderId
      );

      setPaymentMethod(
        "M-Pesa"
      );

      setTransactionId("");

      setActionError("");
    };

  /* =======================================================
     CLOSE PAYMENT CONFIRMATION
  ======================================================= */

  const closePaymentConfirmation =
    () => {
      if (
        confirmingOrderId
      ) {
        return;
      }

      setActionError("");

      setConfirmingOrderId(
        null
      );

      setTransactionId("");
    };

  /* =======================================================
     CONFIRM PAYMENT
     
     PATCH /api/payments/orders/:orderId/payment
  ======================================================= */

  const handleConfirmPayment =
    async () => {
      if (
        !confirmingOrderId
      ) {
        return;
      }

      setActionError("");

      const selectedOrder =
        orders.find(
          (order) =>
            order.orderId ===
            confirmingOrderId
        );

      if (!selectedOrder) {
        setActionError(
          "Order could not be found."
        );

        return;
      }

      if (
        getPaymentStatus(
          selectedOrder
        ) === "successful"
      ) {
        setActionError(
          "This payment has already been confirmed."
        );

        return;
      }

      try {
        setRefreshing(
          true
        );

        const response =
          await fetch(
            `${API_URL}/api/payments/orders/${encodeURIComponent(
              confirmingOrderId
            )}/payment`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                method:
                  paymentMethod,

                transactionId:
                  transactionId.trim(),

                confirmedBy:
                  "Admin",
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
              "Unable to confirm payment."
          );
        }

        /* -----------------------------------------------
           Update the order immediately in the UI.
        ----------------------------------------------- */

        if (data.order) {
          setOrders(
            (currentOrders) =>
              currentOrders.map(
                (order) =>
                  order.orderId ===
                  confirmingOrderId
                    ? data.order
                    : order
              )
          );
        } else {
          await fetchOrders(
            false
          );
        }

        setConfirmingOrderId(
          null
        );

        setTransactionId("");

        setActionError("");
      } catch (error) {
        console.error(
          "Payment confirmation failed:",
          error
        );

        setActionError(
          error.message ||
            "Unable to confirm payment."
        );
      } finally {
        setRefreshing(
          false
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="dashboard-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dashboard-heading">

        <div>

          <span>
            ADMIN OVERVIEW
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Monitor customers, orders,
            payments, communications,
            and marketplace activity.
          </p>

        </div>

        <div className="dashboard-heading-meta">

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >

            <button
              type="button"
              onClick={() => {
                setShowNotifications(
                  (current) => !current
                );
                markNotificationsRead();
                requestNotificationPermission();
              }}
              aria-label={
                notificationCount > 0
                  ? `${notificationCount} unread notifications`
                  : "Notifications"
              }
              title="Notifications"
              style={{
                position: "relative",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1.15rem",
              }}
            >
              <span aria-hidden="true">
                🔔
              </span>

              {notificationCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    minWidth: "20px",
                    height: "20px",
                    padding: "0 5px",
                    borderRadius: "999px",
                    background: "#d92d20",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    border: "2px solid #fff",
                  }}
                >
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "54px",
                  right: 0,
                  zIndex: 50,
                  width: "min(380px, calc(100vw - 40px))",
                  maxHeight: "420px",
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "14px",
                  boxShadow:
                    "0 18px 50px rgba(0,0,0,0.14)",
                  padding: "12px",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "6px 6px 12px",
                  }}
                >
                  <strong>
                    Notifications
                  </strong>

                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications([])
                      }
                      style={{
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "0.78rem",
                        opacity: 0.65,
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 12px",
                      textAlign: "center",
                      opacity: 0.65,
                      fontSize: "0.9rem",
                    }}
                  >
                    No new notifications
                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <div
                        key={notification.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          padding: "12px 8px",
                          borderTop:
                            "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            fontSize: "1.1rem",
                          }}
                        >
                          {notification.type ===
                          "order"
                            ? "🛒"
                            : "🔔"}
                        </span>

                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              fontSize: "0.88rem",
                            }}
                          >
                            {notification.title ||
                              "New notification"}
                          </strong>

                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: "0.8rem",
                              lineHeight: 1.4,
                              opacity: 0.72,
                            }}
                          >
                            {notification.message ||
                              "New activity received."}
                          </p>

                          {notification.orderId && (
                            <span
                              style={{
                                display: "block",
                                marginTop: "5px",
                                fontSize: "0.72rem",
                                opacity: 0.55,
                              }}
                            >
                              #{notification.orderId}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )
                )}

              </div>
            )}

            <div className="dashboard-identity-status">

              <FiShield />

              <span>
                Customer identity system
              </span>

              <strong>
                Active
              </strong>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          DATABASE ERROR
      ================================================= */}

      {ordersError && (
        <div
          className="payment-inline-error"
          style={{
            marginBottom:
              "20px",
          }}
        >
          <FiAlertCircle />

          <span>
            {ordersError}
          </span>
        </div>
      )}

      {/* =================================================
          PRIMARY STATS
      ================================================= */}

      <div className="stats-grid">

        <StatCard
          title="Customer Identities"
          value={
            totalCustomers
          }
          change="Live"
          trend="up"
          subtitle="Unique customer profiles"
          icon={
            <FiUserCheck />
          }
        />

        <StatCard
          title="Total Orders"
          value={
            ordersLoading
              ? "..."
              : totalOrders
          }
          change={
            pendingPayments >
            0
              ? `${pendingPayments} pending payment`
              : "All payments clear"
          }
          trend={
            pendingPayments >
            0
              ? "down"
              : "up"
          }
          subtitle="MongoDB customer orders"
          icon={
            <FiShoppingBag />
          }
        />

        <StatCard
          title="Customer Messages"
          value={
            totalMessages
          }
          change={
            unreadMessages >
            0
              ? `${unreadMessages} unread`
              : "No unread"
          }
          trend={
            unreadMessages >
            0
              ? "down"
              : "up"
          }
          subtitle="Support conversations"
          icon={
            <FiMessageSquare />
          }
        />

        <StatCard
          title="Training Bookings"
          value={
            trainingBookings.length
          }
          change={
            pendingTraining >
            0
              ? `${pendingTraining} pending`
              : "Up to date"
          }
          trend={
            pendingTraining >
            0
              ? "down"
              : "up"
          }
          subtitle="Customer training requests"
          icon={
            <FiBookOpen />
          }
        />

      </div>

      {/* =================================================
          PENDING PAYMENTS
      ================================================= */}

      <section
        className="dashboard-panel"
        style={{
          marginBottom:
            "24px",
        }}
      >

        <div className="panel-header">

          <div>

            <span className="panel-eyebrow">
              PAYMENT MANAGEMENT
            </span>

            <h2>
              Pending Payments
            </h2>

            <p>
              Orders created by customers
              that are waiting for manual
              payment confirmation.
            </p>

          </div>

          <button
            type="button"
            className="panel-more"
            onClick={() =>
              fetchOrders(
                false
              )
            }
            disabled={
              refreshing
            }
            aria-label="Refresh orders"
          >
            <FiRefreshCw
              style={{
                animation:
                  refreshing
                    ? "spin 1s linear infinite"
                    : "none",
              }}
            />
          </button>

        </div>

        {ordersLoading ? (

          <div className="dashboard-empty-state">

            <FiClock />

            <strong>
              Loading orders...
            </strong>

            <span>
              Retrieving orders from
              MongoDB.
            </span>

          </div>

        ) : pendingPayments ===
          0 ? (

          <div className="dashboard-empty-state">

            <FiCheckCircle />

            <strong>
              No pending payments
            </strong>

            <span>
              All current orders have
              been handled.
            </span>

          </div>

        ) : (

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: "12px",
            }}
          >

            {recentOrders
              .filter(
                (order) =>
                  getPaymentStatus(
                    order
                  ) ===
                  "pending"
              )
              .map(
                (order) => {

                  const itemCount =
                    getOrderItemCount(
                      order
                    );

                  const orderTotal =
                    getOrderTotal(
                      order
                    );

                  const isConfirming =
                    confirmingOrderId ===
                    order.orderId;

                  return (
                    <div
                      key={
                        order.orderId
                      }
                      style={{
                        border:
                          "1px solid rgba(0,0,0,0.08)",
                        borderRadius:
                          "12px",
                        padding:
                          "16px",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          gap:
                            "16px",
                          flexWrap:
                            "wrap",
                        }}
                      >

                        <div>

                          <span
                            style={{
                              fontSize:
                                "0.75rem",
                              opacity:
                                0.65,
                              display:
                                "block",
                            }}
                          >
                            ORDER
                          </span>

                          <strong>
                            #
                            {
                              order.orderId
                            }
                          </strong>

                          <p
                            style={{
                              margin:
                                "5px 0 0",
                            }}
                          >
                            {
                              order
                                .customer
                                ?.name ||
                              "Customer"
                            }

                            {" • "}

                            {
                              order
                                .customer
                                ?.phone ||
                              order
                                .customer
                                ?.email ||
                              "No contact"
                            }
                          </p>

                        </div>

                        <div>

                          <span
                            style={{
                              fontSize:
                                "0.75rem",
                              opacity:
                                0.65,
                              display:
                                "block",
                            }}
                          >
                            ITEMS
                          </span>

                          <strong>
                            {
                              itemCount
                            }
                          </strong>

                        </div>

                        <div>

                          <span
                            style={{
                              fontSize:
                                "0.75rem",
                              opacity:
                                0.65,
                              display:
                                "block",
                            }}
                          >
                            AMOUNT
                          </span>

                          <strong>
                            $
                            {Number(
                              orderTotal
                            ).toFixed(
                              2
                            )}
                          </strong>

                        </div>

                        <span
                          className="order-status pending"
                        >
                          <FiClock />
                          Pending Payment
                        </span>

                        <button
                          type="button"
                          className="payment-button"
                          onClick={() =>
                            openPaymentConfirmation(
                              order
                            )
                          }
                          disabled={
                            confirmingOrderId !==
                              null &&
                            !isConfirming
                          }
                          style={{
                            width:
                              "auto",
                            padding:
                              "10px 16px",
                          }}
                        >
                          <FiCheck />
                          Confirm Payment
                        </button>

                      </div>

                      {/* =================================
                          PAYMENT CONFIRMATION FORM
                      ================================= */}

                      {isConfirming && (
                        <div
                          style={{
                            marginTop:
                              "16px",
                            paddingTop:
                              "16px",
                            borderTop:
                              "1px solid rgba(0,0,0,0.08)",
                          }}
                        >

                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                              gap:
                                "12px",
                            }}
                          >

                            <div className="payment-form-group">

                              <label>
                                Payment Method
                              </label>

                              <select
                                value={
                                  paymentMethod
                                }
                                onChange={(
                                  event
                                ) =>
                                  setPaymentMethod(
                                    event
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  refreshing
                                }
                              >
                                <option>
                                  M-Pesa
                                </option>

                                <option>
                                  Bank Transfer
                                </option>

                                <option>
                                  Cash
                                </option>

                                <option>
                                  Other
                                </option>
                              </select>

                            </div>

                            <div className="payment-form-group">

                              <label>
                                Transaction ID
                                <span
                                  style={{
                                    opacity:
                                      0.6,
                                    marginLeft:
                                      "5px",
                                  }}
                                >
                                  (optional)
                                </span>
                              </label>

                              <input
                                type="text"
                                value={
                                  transactionId
                                }
                                onChange={(
                                  event
                                ) =>
                                  setTransactionId(
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="e.g. QWE123XYZ"
                                disabled={
                                  refreshing
                                }
                              />

                            </div>

                          </div>

                          {actionError && (
                            <div
                              className="payment-inline-error"
                              style={{
                                marginTop:
                                  "12px",
                              }}
                            >
                              <FiAlertCircle />

                              <span>
                                {
                                  actionError
                                }
                              </span>
                            </div>
                          )}

                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "10px",
                              marginTop:
                                "14px",
                              flexWrap:
                                "wrap",
                            }}
                          >

                            <button
                              type="button"
                              className="payment-button"
                              onClick={
                                handleConfirmPayment
                              }
                              disabled={
                                refreshing
                              }
                              style={{
                                width:
                                  "auto",
                              }}
                            >
                              <FiCheck />

                              {refreshing
                                ? "Confirming..."
                                : "Confirm Payment"}
                            </button>

                            <button
                              type="button"
                              className="payment-secondary-button"
                              onClick={
                                closePaymentConfirmation
                              }
                              disabled={
                                refreshing
                              }
                              style={{
                                width:
                                  "auto",
                              }}
                            >
                              <FiX />
                              Cancel
                            </button>

                          </div>

                          <p
                            style={{
                              marginTop:
                                "12px",
                              fontSize:
                                "0.85rem",
                              opacity:
                                0.7,
                            }}
                          >
                            Confirm only after
                            you have verified
                            that the customer
                            has actually paid.
                            Stock will be
                            deducted when
                            payment is confirmed.
                          </p>

                        </div>
                      )}

                    </div>
                  );
                }
              )}

          </div>
        )}

      </section>

      {/* =================================================
          DASHBOARD GRID
      ================================================= */}

      <div className="dashboard-grid">

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

        <section className="dashboard-panel recent-panel">

          <div className="panel-header">

            <div>

              <span className="panel-eyebrow">
                LIVE ACTIVITY
              </span>

              <h2>
                Recent Activity
              </h2>

              <p>
                Latest customer and
                marketplace events.
              </p>

            </div>

            <button
              type="button"
              className="panel-more"
              onClick={() =>
                fetchOrders(
                  false
                )
              }
              aria-label="Refresh activity"
            >
              <FiMoreHorizontal />
            </button>

          </div>

          <div className="activity-list">

            {activities.length >
            0 ? (

              activities.map(
                (activity) => (
                  <div
                    className="activity-item"
                    key={
                      activity.id
                    }
                  >

                    <div
                      className={`activity-icon ${activity.type}`}
                    >

                      {activity.type ===
                        "account" && (
                        <FiUsers />
                      )}

                      {activity.type ===
                        "proxy" && (
                        <FiGlobe />
                      )}

                      {activity.type ===
                        "message" && (
                        <FiMessageSquare />
                      )}

                      {activity.type ===
                        "training" && (
                        <FiBookOpen />
                      )}

                      {activity.type ===
                        "order" && (
                        <FiShoppingBag />
                      )}

                    </div>

                    <div className="activity-content">

                      <h3>
                        {
                          activity.title
                        }
                      </h3>

                      <p>
                        {
                          activity.description
                        }
                      </p>

                    </div>

                    <time>
                      {
                        activity.time
                      }
                    </time>

                  </div>
                )
              )

            ) : (

              <div className="dashboard-empty-state">

                <FiMessageSquare />

                <strong>
                  No recent activity
                </strong>

                <span>
                  New customer activity
                  will appear here.
                </span>

              </div>

            )}

          </div>

        </section>

        {/* =================================================
            CUSTOMER OVERVIEW
        ================================================= */}

        <section className="dashboard-panel quick-panel">

          <div className="panel-header">

            <div>

              <span className="panel-eyebrow">
                CUSTOMER INTELLIGENCE
              </span>

              <h2>
                Customer Overview
              </h2>

              <p>
                How identified customers
                are interacting with the
                marketplace.
              </p>

            </div>

          </div>

          <div className="overview-item">

            <div>

              <span>
                Identified Customers
              </span>

              <strong>
                {totalCustomers}
              </strong>

            </div>

            <div className="progress">

              <span
                style={{
                  width:
                    "100%",
                }}
              />

            </div>

          </div>

          <div className="overview-item">

            <div>

              <span>
                Customers with Orders
              </span>

              <strong>
                {
                  customerOrderCount
                }
              </strong>

            </div>

            <div className="progress">

              <span
                style={{
                  width: `${getPercentage(
                    customerOrderCount,
                    customerBase
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className="overview-item">

            <div>

              <span>
                Customers with Messages
              </span>

              <strong>
                {
                  customerMessageCount
                }
              </strong>

            </div>

            <div className="progress">

              <span
                style={{
                  width: `${getPercentage(
                    customerMessageCount,
                    customerBase
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className="overview-item">

            <div>

              <span>
                Customers in Training
              </span>

              <strong>
                {
                  customerTrainingCount
                }
              </strong>

            </div>

            <div className="progress">

              <span
                style={{
                  width: `${getPercentage(
                    customerTrainingCount,
                    customerBase
                  )}%`,
                }}
              />

            </div>

          </div>

        </section>

      </div>

      {/* =================================================
          PERFORMANCE
      ================================================= */}

      <section className="dashboard-panel performance-panel">

        <div className="panel-header">

          <div>

            <span className="panel-eyebrow">
              BUSINESS SNAPSHOT
            </span>

            <h2>
              Marketplace Performance
            </h2>

            <p>
              A real-time snapshot of
              customer activity, payments,
              and inventory.
            </p>

          </div>

        </div>

        <div className="performance-cards">

          {/* TOTAL SALES */}

          <div className="performance-card">

            <span>
              Confirmed Sales
            </span>

            <strong>
              $
              {totalSales.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits:
                    2,

                  maximumFractionDigits:
                    2,
                }
              )}
            </strong>

            <small className="positive">
              <FiArrowUpRight />
              Successful payments
            </small>

          </div>

          {/* PAID ORDERS */}

          <div className="performance-card">

            <span>
              Paid Orders
            </span>

            <strong>
              {paidOrders}
            </strong>

            <small className="positive">
              <FiCheckCircle />
              Payment confirmed
            </small>

          </div>

          {/* ACCOUNTS */}

          <div className="performance-card">

            <span>
              Available Accounts
            </span>

            <strong>
              {availableAccounts}
            </strong>

            <small className="positive">
              <FiArrowUpRight />
              Ready for customers
            </small>

          </div>

          {/* PENDING */}

          <div className="performance-card">

            <span>
              Pending Requests
            </span>

            <strong>
              {
                pendingPayments +
                pendingTraining
              }
            </strong>

            <small
              className={
                pendingPayments +
                  pendingTraining >
                0
                  ? "negative"
                  : "positive"
              }
            >

              {pendingPayments +
                pendingTraining >
              0 ? (
                <FiArrowDownRight />
              ) : (
                <FiArrowUpRight />
              )}

              {pendingPayments +
                pendingTraining >
              0
                ? "Requires attention"
                : "Everything is clear"}

            </small>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;