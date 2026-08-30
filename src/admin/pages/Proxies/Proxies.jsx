import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUser,
  FiMail,
  FiShoppingBag,
  FiClock,
  FiMapPin,
  FiServer,
} from "react-icons/fi";

import "./Proxies.css";

const PROXY_STORAGE_KEY = "accountBazaarProxies";
const PURCHASE_STORAGE_KEY = "accountBazaarPurchases";

const defaultProxies = [
  {
    id: 1,
    name: "US Residential Proxy",
    type: "Residential",
    location: "United States",
    host: "us.proxy.example",
    port: "8001",
    price: 15,
    stock: 25,
    status: "Available",
  },
  {
    id: 2,
    name: "UK Datacenter Proxy",
    type: "Datacenter",
    location: "United Kingdom",
    host: "uk.proxy.example",
    port: "9001",
    price: 10,
    stock: 40,
    status: "Available",
  },
  {
    id: 3,
    name: "Germany Mobile Proxy",
    type: "Mobile",
    location: "Germany",
    host: "de.proxy.example",
    port: "7001",
    price: 25,
    stock: 5,
    status: "Low Stock",
  },
];

const emptyForm = {
  name: "",
  type: "Residential",
  location: "",
  host: "",
  port: "",
  username: "",
  password: "",
  price: "",
  stock: "",
};

function safeParse(value, fallback = []) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizePurchase(purchase, index) {
  return {
    ...purchase,

    id:
      purchase.id ||
      purchase.purchaseId ||
      `purchase-${index}-${Date.now()}`,

    orderId:
      purchase.orderId ||
      purchase.purchaseId ||
      purchase.id ||
      `ORD-${String(index + 1).padStart(5, "0")}`,

    customerName:
      purchase.customerName ||
      purchase.fullName ||
      purchase.name ||
      "Customer",

    customerEmail:
      purchase.customerEmail ||
      purchase.email ||
      "No email provided",

    productName:
      purchase.productName ||
      purchase.product ||
      purchase.name ||
      "Proxy",

    category:
      purchase.category || "Proxies",

    price:
      Number(purchase.price) || 0,

    status:
      purchase.status || "New",

    date:
      purchase.date ||
      purchase.createdAt ||
      purchase.created_at ||
      null,
  };
}

function Proxies() {
  const [showForm, setShowForm] = useState(false);
  const [editingProxy, setEditingProxy] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  /* =====================================================
     PROXY INVENTORY
  ===================================================== */

  const [proxies, setProxies] = useState(() => {
    const savedProxies = localStorage.getItem(
      PROXY_STORAGE_KEY
    );

    if (savedProxies) {
      try {
        const parsed = JSON.parse(savedProxies);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.error(
          "Failed to load saved proxies:",
          error
        );
      }
    }

    localStorage.setItem(
      PROXY_STORAGE_KEY,
      JSON.stringify(defaultProxies)
    );

    return defaultProxies;
  });

  /* =====================================================
     CUSTOMER PURCHASES
  ===================================================== */

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem(
      PURCHASE_STORAGE_KEY
    );

    return safeParse(saved, []);
  });

  /* =====================================================
     FORM
  ===================================================== */

  const [form, setForm] = useState(emptyForm);

  /* =====================================================
     SAVE INVENTORY
  ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      PROXY_STORAGE_KEY,
      JSON.stringify(proxies)
    );
  }, [proxies]);

  /* =====================================================
     LOAD CUSTOMER PURCHASES
  ===================================================== */

  useEffect(() => {
    const loadPurchases = () => {
      const saved = localStorage.getItem(
        PURCHASE_STORAGE_KEY
      );

      const parsed = safeParse(saved, []);

      setPurchases(parsed);
    };

    loadPurchases();

    window.addEventListener(
      "storage",
      loadPurchases
    );

    window.addEventListener(
      "accountBazaarPurchaseCreated",
      loadPurchases
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadPurchases
      );

      window.removeEventListener(
        "accountBazaarPurchaseCreated",
        loadPurchases
      );
    };
  }, []);

  /* =====================================================
     CUSTOMER PROXY ORDERS
  ===================================================== */

  const proxyPurchases = useMemo(() => {
    return purchases
      .filter((purchase) => {
        const category = String(
          purchase.category || ""
        ).toLowerCase();

        return (
          category === "proxy" ||
          category === "proxies"
        );
      })
      .map(normalizePurchase)
      .sort((a, b) => {
        const first = new Date(
          a.date || 0
        ).getTime();

        const second = new Date(
          b.date || 0
        ).getTime();

        return second - first;
      });
  }, [purchases]);

  /* =====================================================
     CUSTOMER ORDER STATS
  ===================================================== */

  const purchaseStats = useMemo(() => {
    const total = proxyPurchases.length;

    const pending = proxyPurchases.filter(
      (purchase) =>
        ["new", "pending", "processing"].includes(
          String(purchase.status).toLowerCase()
        )
    ).length;

    const completed = proxyPurchases.filter(
      (purchase) =>
        ["completed", "delivered", "fulfilled"].includes(
          String(purchase.status).toLowerCase()
        )
    ).length;

    return {
      total,
      pending,
      completed,
    };
  }, [proxyPurchases]);

  /* =====================================================
     FILTER INVENTORY
  ===================================================== */

  const filteredProxies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return proxies.filter((proxy) => {
      const matchesSearch =
        String(proxy.name || "")
          .toLowerCase()
          .includes(query) ||
        String(proxy.location || "")
          .toLowerCase()
          .includes(query) ||
        String(proxy.type || "")
          .toLowerCase()
          .includes(query) ||
        String(proxy.host || "")
          .toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === "all" ||
        String(proxy.type || "").toLowerCase() ===
          typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [proxies, search, typeFilter]);

  /* =====================================================
     FORM FUNCTIONS
  ===================================================== */

  const openAddForm = () => {
    setEditingProxy(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (proxy) => {
    setEditingProxy(proxy);

    setForm({
      name: proxy.name || "",
      type: proxy.type || "Residential",
      location: proxy.location || "",
      host: proxy.host || "",
      port: proxy.port || "",
      username: "",
      password: "",
      price: proxy.price ?? "",
      stock: proxy.stock ?? "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProxy(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  /* =====================================================
     SAVE PROXY
  ===================================================== */

  const handleSubmit = (e) => {
    e.preventDefault();

    const name = form.name.trim();
    const location = form.location.trim();
    const host = form.host.trim();
    const port = form.port.trim();

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name || !location || !host || !port) {
      return;
    }

    const updatedProxy = {
      id: editingProxy
        ? editingProxy.id
        : Date.now(),

      name,
      type: form.type,
      location,
      host,
      port,

      username: form.username.trim(),
      password: form.password,

      price,
      stock,

      status:
        stock === 0
          ? "Out of Stock"
          : stock <= 5
          ? "Low Stock"
          : "Available",
    };

    if (editingProxy) {
      setProxies((currentProxies) =>
        currentProxies.map((proxy) =>
          proxy.id === editingProxy.id
            ? {
                ...proxy,
                ...updatedProxy,

                username:
                  form.username.trim() ||
                  proxy.username ||
                  "",

                password:
                  form.password ||
                  proxy.password ||
                  "",
              }
            : proxy
        )
      );
    } else {
      setProxies((currentProxies) => [
        updatedProxy,
        ...currentProxies,
      ]);
    }

    closeForm();
  };

  /* =====================================================
     DELETE PROXY
  ===================================================== */

  const deleteProxy = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this proxy?"
    );

    if (!confirmed) return;

    setProxies((currentProxies) =>
      currentProxies.filter(
        (proxy) => proxy.id !== id
      )
    );
  };

  /* =====================================================
     DATE FORMATTERS
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-proxies">

      {/* =================================================
          CUSTOMER ORDER CENTER
      ================================================= */}

      <section className="proxy-purchases-section">

        <div className="proxy-purchases-heading">

          <div>
            <span>CUSTOMER IDENTITY & ORDERS</span>

            <h2>Proxy Purchases</h2>

            <p>
              Track customers, orders and proxy
              fulfillment from one place.
            </p>
          </div>

          <div className="proxy-purchase-summary">

            <div>
              <strong>
                {purchaseStats.total}
              </strong>

              <span>Total</span>
            </div>

            <div>
              <strong>
                {purchaseStats.pending}
              </strong>

              <span>Pending</span>
            </div>

            <div>
              <strong>
                {purchaseStats.completed}
              </strong>

              <span>Completed</span>
            </div>

          </div>

        </div>

        {proxyPurchases.length > 0 ? (

          <div className="proxy-purchases-table-wrapper">

            <table className="proxy-purchases-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Order</th>
                  <th>Proxy</th>
                  <th>Price</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {proxyPurchases.map(
                  (purchase, index) => (

                    <tr
                      key={
                        purchase.id ||
                        purchase.orderId ||
                        index
                      }
                    >

                      {/* CUSTOMER */}

                      <td>

                        <div className="proxy-customer">

                          <div className="proxy-customer-avatar">
                            {purchase.customerName
                              ?.charAt(0)
                              ?.toUpperCase() || "C"}
                          </div>

                          <div>

                            <strong>
                              {purchase.customerName}
                            </strong>

                            <small>
                              <FiMail />
                              {purchase.customerEmail}
                            </small>

                          </div>

                        </div>

                      </td>

                      {/* ORDER */}

                      <td>

                        <div className="proxy-order-info">

                          <strong>
                            {purchase.orderId}
                          </strong>

                          <small>
                            <FiShoppingBag />
                            Proxy order
                          </small>

                        </div>

                      </td>

                      {/* PRODUCT */}

                      <td>

                        <div className="proxy-product-info">

                          <strong>
                            {purchase.productName}
                          </strong>

                          {purchase.type && (
                            <small>
                              {purchase.type}
                            </small>
                          )}

                        </div>

                      </td>

                      {/* PRICE */}

                      <td>
                        <strong>
                          $
                          {Number(
                            purchase.price || 0
                          ).toFixed(2)}
                        </strong>
                      </td>

                      {/* DATE */}

                      <td>

                        <div className="proxy-date">

                          <span>
                            <FiClock />
                            {formatDate(
                              purchase.date
                            )}
                          </span>

                          <small>
                            {formatDateTime(
                              purchase.date
                            )}
                          </small>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`proxy-purchase-status ${String(
                            purchase.status
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {purchase.status}
                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="proxy-purchases-empty">

            <FiShoppingBag />

            <strong>
              No proxy purchases yet
            </strong>

            <span>
              Customer proxy orders will appear
              here after checkout.
            </span>

          </div>

        )}

      </section>

      {/* =================================================
          INVENTORY HEADER
      ================================================= */}

      <div className="proxies-heading">

        <div>

          <span>PROXY INVENTORY</span>

          <h1>Proxies</h1>

          <p>
            Manage residential, datacenter and
            mobile proxy inventory.
          </p>

        </div>

        <button
          className="add-proxy-button"
          onClick={openAddForm}
        >
          <FiPlus />
          Add Proxy
        </button>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="proxies-toolbar">

        <div className="proxies-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search proxies, locations or hosts..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="proxy-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}

        </div>

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value)
          }
        >

          <option value="all">
            All Types
          </option>

          <option value="residential">
            Residential
          </option>

          <option value="datacenter">
            Datacenter
          </option>

          <option value="mobile">
            Mobile
          </option>

        </select>

      </div>

      {/* =================================================
          INVENTORY TABLE
      ================================================= */}

      <div className="proxies-table-wrapper">

        <table className="proxies-table">

          <thead>
            <tr>
              <th>Proxy</th>
              <th>Type</th>
              <th>Location</th>
              <th>Host</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {filteredProxies.length > 0 ? (

              filteredProxies.map((proxy) => (

                <tr key={proxy.id}>

                  {/* PROXY */}

                  <td>

                    <div className="proxy-name">

                      <div className="proxy-placeholder">
                        <FiServer />
                      </div>

                      <div>

                        <strong>
                          {proxy.name}
                        </strong>

                        <small>
                          ID #{proxy.id}
                        </small>

                      </div>

                    </div>

                  </td>

                  {/* TYPE */}

                  <td>

                    <span className="proxy-type-badge">
                      {proxy.type}
                    </span>

                  </td>

                  {/* LOCATION */}

                  <td>

                    <span className="proxy-location">
                      <FiMapPin />
                      {proxy.location}
                    </span>

                  </td>

                  {/* HOST */}

                  <td>

                    <span className="proxy-host">
                      {proxy.host}:{proxy.port}
                    </span>

                  </td>

                  {/* PRICE */}

                  <td>

                    <strong>
                      $
                      {Number(
                        proxy.price || 0
                      ).toFixed(2)}
                    </strong>

                  </td>

                  {/* STOCK */}

                  <td>

                    <span
                      className={
                        proxy.stock <= 5
                          ? "proxy-stock-low"
                          : ""
                      }
                    >
                      {proxy.stock}
                    </span>

                  </td>

                  {/* STATUS */}

                  <td>

                    <span
                      className={`proxy-status ${String(
                        proxy.status
                      )
                        .toLowerCase()
                        .replace(
                          /\s+/g,
                          "-"
                        )}`}
                    >
                      {proxy.status}
                    </span>

                  </td>

                  {/* ACTIONS */}

                  <td>

                    <div className="proxy-actions">

                      <button
                        type="button"
                        title="Edit proxy"
                        onClick={() =>
                          openEditForm(proxy)
                        }
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        title="Delete proxy"
                        onClick={() =>
                          deleteProxy(proxy.id)
                        }
                      >
                        <FiTrash2 />
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan="8"
                  className="proxies-empty"
                >
                  <FiSearch />

                  <strong>
                    No proxies found
                  </strong>

                  <span>
                    Try changing your search or
                    filter.
                  </span>

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showForm && (

        <div
          className="proxy-modal-overlay"
          onClick={closeForm}
        >

          <div
            className="proxy-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="proxy-modal-header">

              <div>

                <span>
                  PROXY INVENTORY
                </span>

                <h2>
                  {editingProxy
                    ? "Edit Proxy"
                    : "Add Proxy"}
                </h2>

                <p>
                  {editingProxy
                    ? "Update proxy inventory details."
                    : "Add a new proxy to your marketplace."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
              >
                <FiX />
              </button>

            </div>

            {/* FORM */}

            <form
              className="proxy-form"
              onSubmit={handleSubmit}
            >

              <div className="proxy-form-row">

                <div className="proxy-form-group">

                  <label>
                    Proxy Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. US Residential Proxy"
                    required
                  />

                </div>

                <div className="proxy-form-group">

                  <label>
                    Proxy Type
                  </label>

                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                  >

                    <option>
                      Residential
                    </option>

                    <option>
                      Datacenter
                    </option>

                    <option>
                      Mobile
                    </option>

                  </select>

                </div>

              </div>

              <div className="proxy-form-row">

                <div className="proxy-form-group">

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="United States"
                    required
                  />

                </div>

                <div className="proxy-form-group">

                  <label>
                    Host / IP
                  </label>

                  <input
                    type="text"
                    name="host"
                    value={form.host}
                    onChange={handleChange}
                    placeholder="proxy.example.com"
                    required
                  />

                </div>

              </div>

              <div className="proxy-form-row">

                <div className="proxy-form-group">

                  <label>
                    Port
                  </label>

                  <input
                    type="text"
                    name="port"
                    value={form.port}
                    onChange={handleChange}
                    placeholder="8001"
                    required
                  />

                </div>

                <div className="proxy-form-group">

                  <label>
                    Price ($)
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="15"
                    min="0"
                    step="0.01"
                    required
                  />

                </div>

              </div>

              <div className="proxy-form-row">

                <div className="proxy-form-group">

                  <label>
                    Username
                    <span className="optional-label">
                      Optional
                    </span>
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Proxy username"
                    autoComplete="off"
                  />

                </div>

                <div className="proxy-form-group">

                  <label>
                    Password
                    <span className="optional-label">
                      {editingProxy
                        ? "Leave blank to keep current"
                        : "Required"}
                    </span>
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={
                      editingProxy
                        ? "Leave blank to keep current"
                        : "Proxy password"
                    }
                    required={!editingProxy}
                    autoComplete="new-password"
                  />

                </div>

              </div>

              <div className="proxy-form-group">

                <label>
                  Stock
                </label>

                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="25"
                  min="0"
                  required
                />

                <small className="proxy-form-help">
                  Stock automatically determines the
                  inventory status.
                </small>

              </div>

              {/* ACTIONS */}

              <div className="proxy-form-actions">

                <button
                  type="button"
                  className="cancel-proxy"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-proxy"
                >

                  {editingProxy ? (
                    <>
                      <FiEdit2 />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      Add Proxy
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Proxies;