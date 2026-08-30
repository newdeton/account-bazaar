import { useEffect, useMemo, useState } from "react";
import {
  FiShoppingBag,
  FiUsers,
  FiGlobe,
  FiMessageSquare,
  FiBookOpen,
  FiUserCheck,
  FiArrowUpRight,
  FiArrowDownRight,
  FiMoreHorizontal,
  FiShield,
} from "react-icons/fi";

import StatCard from "../../components/StatCard/StatCard";

import "./Dashboard.css";

/* =========================================================
   STORAGE KEYS
========================================================= */

const CUSTOMER_KEY = "accountBazaarCustomer";
const PURCHASES_KEY = "purchases";
const ACCOUNTS_KEY = "accountBazaarAccounts";
const PROXIES_KEY = "accountBazaarProxies";
const MESSAGES_KEY = "accountBazaarMessages";
const TRAINING_KEY = "trainingBookings";

/* =========================================================
   SAFE STORAGE READER
========================================================= */

const readArray = (key) => {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return [];
  }
};

const readCustomer = () => {
  try {
    const saved = localStorage.getItem(CUSTOMER_KEY);

    if (!saved) return null;

    const parsed = JSON.parse(saved);

    return parsed && typeof parsed === "object"
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
    item?.date ||
    item?.createdAt ||
    item?.purchasedAt ||
    item?.bookedAt ||
    item?.paidAt;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const formatRelativeTime = (date) => {
  if (!date) return "Recently";

  const now = Date.now();
  const difference =
    now - date.getTime();

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 1) return "Just now";

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(
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
   DASHBOARD
========================================================= */

function Dashboard() {
  const [customer, setCustomer] =
    useState(null);

  const [accounts, setAccounts] =
    useState([]);

  const [proxies, setProxies] =
    useState([]);

  const [purchases, setPurchases] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [trainingBookings, setTrainingBookings] =
    useState([]);

  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  const loadDashboardData = () => {
    setCustomer(readCustomer());
    setAccounts(readArray(ACCOUNTS_KEY));
    setProxies(readArray(PROXIES_KEY));
    setPurchases(readArray(PURCHASES_KEY));
    setMessages(readArray(MESSAGES_KEY));
    setTrainingBookings(
      readArray(TRAINING_KEY)
    );
  };

  useEffect(() => {
    loadDashboardData();

    window.addEventListener(
      "storage",
      loadDashboardData
    );

    const interval = setInterval(
      loadDashboardData,
      1500
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadDashboardData
      );

      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     CUSTOMER IDENTITIES
  ======================================================= */

  const customerIdentities = useMemo(() => {
    const identities = new Map();

    const addIdentity = (item) => {
      if (!item) return;

      const customerId = String(
        item.customerId || ""
      )
        .trim()
        .toLowerCase();

      const email = String(
        item.customerEmail ||
          item.email ||
          ""
      )
        .trim()
        .toLowerCase();

      if (!customerId && !email) {
        return;
      }

      const key =
        customerId ||
        email;

      if (!identities.has(key)) {
        identities.set(key, {
          customerId:
            item.customerId || "",
          name:
            item.customerName ||
            item.name ||
            item.fullName ||
            "Customer",
          email:
            item.customerEmail ||
            item.email ||
            "",
        });
      }
    };

    addIdentity(customer);

    purchases.forEach(addIdentity);
    messages.forEach(addIdentity);
    trainingBookings.forEach(addIdentity);

    return Array.from(
      identities.values()
    );
  }, [
    customer,
    purchases,
    messages,
    trainingBookings,
  ]);

  /* =======================================================
     UNIQUE CUSTOMER COUNT
  ======================================================= */

  const totalCustomers =
    customerIdentities.length;

  /* =======================================================
     ACCOUNT / PROXY COUNTS
  ======================================================= */

  const availableAccounts =
    accounts.filter(
      (account) =>
        String(account.status || "")
          .toLowerCase() === "available"
    ).length;

  const availableProxies =
    proxies.filter(
      (proxy) =>
        String(proxy.status || "")
          .toLowerCase() === "available"
    ).length;

  /* =======================================================
     ORDER STATISTICS
  ======================================================= */

  const totalOrders =
    purchases.length;

  const pendingOrders =
    purchases.filter(
      (order) =>
        String(order.status || "Pending")
          .toLowerCase() === "pending"
    ).length;

  const totalSales =
    purchases.reduce(
      (sum, order) =>
        sum +
        Number(order.price || 0) *
          Number(order.quantity || 1),
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
            reply.sender === "Customer" &&
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
          booking.status || "Pending"
        ).toLowerCase() === "pending"
    ).length;

  /* =======================================================
     RECENT ACTIVITY
  ======================================================= */

  const activities = useMemo(() => {
    const activityItems = [];

    accounts.slice(0, 10).forEach(
      (account) => {
        const date = getDate(account);

        activityItems.push({
          id: `account-${account.id}`,
          title: "Account inventory updated",
          description:
            account.name ||
            "Account added",
          time: formatRelativeTime(date),
          date,
          type: "account",
        });
      }
    );

    proxies.slice(0, 10).forEach(
      (proxy) => {
        const date = getDate(proxy);

        activityItems.push({
          id: `proxy-${proxy.id}`,
          title: "Proxy inventory updated",
          description:
            proxy.name ||
            proxy.location ||
            "Proxy added",
          time: formatRelativeTime(date),
          date,
          type: "proxy",
        });
      }
    );

    messages.slice(0, 10).forEach(
      (message) => {
        const date = getDate(message);

        activityItems.push({
          id: `message-${message.id}`,
          title: "Customer message received",
          description:
            message.subject ||
            "New customer communication",
          time: formatRelativeTime(date),
          date,
          type: "message",
        });
      }
    );

    trainingBookings.slice(0, 10).forEach(
      (booking) => {
        const date = getDate(booking);

        activityItems.push({
          id: `training-${booking.id}`,
          title: "Training booking received",
          description:
            booking.training ||
            "New training booking",
          time: formatRelativeTime(date),
          date,
          type: "training",
        });
      }
    );

    purchases.slice(0, 10).forEach(
      (purchase) => {
        const date = getDate(purchase);

        activityItems.push({
          id: `purchase-${
            purchase.purchaseId ||
            purchase.id
          }`,
          title: "Customer order received",
          description:
            purchase.name ||
            purchase.productName ||
            "New marketplace order",
          time: formatRelativeTime(date),
          date,
          type: "order",
        });
      }
    );

    return activityItems
      .sort((a, b) => {
        const first =
          a.date?.getTime() || 0;

        const second =
          b.date?.getTime() || 0;

        return second - first;
      })
      .slice(0, 8);
  }, [
    accounts,
    proxies,
    messages,
    trainingBookings,
    purchases,
  ]);

  /* =======================================================
     CUSTOMER DISTRIBUTION
  ======================================================= */

  const customerOrderCount =
    new Set(
      purchases
        .map(
          (purchase) =>
            purchase.customerId ||
            purchase.customerEmail ||
            purchase.email
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

  const getPercentage = (
    value,
    total
  ) => {
    if (!total) return 0;

    return Math.min(
      100,
      Math.round(
        (value / total) * 100
      )
    );
  };

  const customerBase =
    Math.max(
      totalCustomers,
      1
    );

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

          <span>ADMIN OVERVIEW</span>

          <h1>Dashboard</h1>

          <p>
            Monitor customers, identities,
            orders, communications, and
            marketplace activity.
          </p>

        </div>

        <div className="dashboard-heading-meta">

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

      {/* =================================================
          PRIMARY STATS
      ================================================= */}

      <div className="stats-grid">

        <StatCard
          title="Customer Identities"
          value={totalCustomers}
          change="Live"
          trend="up"
          subtitle="Unique customer profiles"
          icon={<FiUserCheck />}
        />

        <StatCard
          title="Total Orders"
          value={totalOrders}
          change={
            pendingOrders > 0
              ? `${pendingOrders} pending`
              : "All clear"
          }
          trend={
            pendingOrders > 0
              ? "down"
              : "up"
          }
          subtitle="Customer purchases"
          icon={<FiShoppingBag />}
        />

        <StatCard
          title="Customer Messages"
          value={totalMessages}
          change={
            unreadMessages > 0
              ? `${unreadMessages} unread`
              : "No unread"
          }
          trend={
            unreadMessages > 0
              ? "down"
              : "up"
          }
          subtitle="Support conversations"
          icon={<FiMessageSquare />}
        />

        <StatCard
          title="Training Bookings"
          value={trainingBookings.length}
          change={
            pendingTraining > 0
              ? `${pendingTraining} pending`
              : "Up to date"
          }
          trend={
            pendingTraining > 0
              ? "down"
              : "up"
          }
          subtitle="Customer training requests"
          icon={<FiBookOpen />}
        />

      </div>

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
                Latest customer and marketplace
                events.
              </p>

            </div>

            <button
              type="button"
              className="panel-more"
              aria-label="More activity options"
            >
              <FiMoreHorizontal />
            </button>

          </div>

          <div className="activity-list">

            {activities.length > 0 ? (
              activities.map(
                (activity) => (
                  <div
                    className="activity-item"
                    key={activity.id}
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
                        {activity.title}
                      </h3>

                      <p>
                        {activity.description}
                      </p>

                    </div>

                    <time>
                      {activity.time}
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
                How identified customers are
                interacting with the marketplace.
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
                  width: "100%",
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
                {customerOrderCount}
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
                {customerMessageCount}
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
                {customerTrainingCount}
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
              A real-time snapshot of customer
              activity and inventory.
            </p>

          </div>

        </div>

        <div className="performance-cards">

          <div className="performance-card">

            <span>
              Total Sales
            </span>

            <strong>
              $
              {totalSales.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </strong>

            <small className="positive">
              <FiArrowUpRight />
              Customer purchases
            </small>

          </div>

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

          <div className="performance-card">

            <span>
              Available Proxies
            </span>

            <strong>
              {availableProxies}
            </strong>

            <small className="positive">
              <FiArrowUpRight />
              Current inventory
            </small>

          </div>

          <div className="performance-card">

            <span>
              Pending Requests
            </span>

            <strong>
              {pendingOrders +
                pendingTraining}
            </strong>

            <small
              className={
                pendingOrders +
                  pendingTraining >
                0
                  ? "negative"
                  : "positive"
              }
            >
              {pendingOrders +
                pendingTraining >
              0 ? (
                <FiArrowDownRight />
              ) : (
                <FiArrowUpRight />
              )}

              {pendingOrders +
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