import { useEffect, useMemo, useState } from "react";

import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiMapPin,
  FiServer,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

import "./Proxies.css";

/* =========================================================
   API
   ========================================================= */

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim();

const API_URL = API_BASE_URL
  ? `${API_BASE_URL.replace(/\/$/, "")}/api`
  : null;

/* =========================================================
   PROXY CATEGORIES
   ========================================================= */

const PROXY_CATEGORIES = {
  "Residential Proxies": [
    "Rotating Residential",
    "Static Residential / ISP",
    "Dedicated Residential",
  ],

  "Datacenter Proxies": [
    "Shared Datacenter",
    "Dedicated Datacenter",
    "IPv4 Datacenter",
    "IPv6 Datacenter",
  ],

  "Mobile Proxies": [
    "4G Mobile",
    "5G Mobile",
    "Rotating Mobile",
    "Dedicated Mobile",
  ],

  "ISP Proxies": [
    "Static ISP",
    "Rotating ISP",
    "Dedicated ISP",
  ],

  "Rotating Proxies": [
    "Residential Rotation",
    "Datacenter Rotation",
    "Mobile Rotation",
    "Automatic IP Rotation",
  ],

  "Static Proxies": [
    "Static Residential",
    "Static ISP",
    "Static Datacenter",
    "Dedicated Static",
  ],

  "Sneaker Proxies": [
    "Residential Sneaker",
    "Datacenter Sneaker",
    "ISP Sneaker",
  ],

  "Social Media Proxies": [
    "Instagram",
    "Facebook",
    "TikTok",
    "X / Twitter",
    "LinkedIn",
  ],

  "Web Scraping Proxies": [
    "Residential Scraping",
    "Datacenter Scraping",
    "Rotating Scraping",
    "SERP Proxies",
  ],

  "Premium Proxies": [
    "Premium ISP",
    "Premium Residential",
    "Dedicated Premium",
  ],
};

/* =========================================================
   EMPTY FORM
   ========================================================= */

const emptyForm = {
  name: "",
  category: "Residential Proxies",
  type: "Rotating Residential",
  provider: "",
  location: "",
  host: "",
  port: "",
  username: "",
  password: "",
  price: "",
  stock: "",
  description: "",
};

/* =========================================================
   HELPERS
   ========================================================= */

function getProxyId(proxy) {
  return proxy?.productId || proxy?._id || proxy?.id;
}

function getProxyCategory(proxy) {
  return (
    proxy?.metadata?.proxyCategory ||
    proxy?.proxyCategory ||
    "Residential Proxies"
  );
}

function getProxyType(proxy) {
  return (
    proxy?.metadata?.type ||
    proxy?.type ||
    proxy?.deliveryType ||
    "Proxy"
  );
}

function getProxyProvider(proxy) {
  return (
    proxy?.metadata?.provider ||
    proxy?.provider ||
    ""
  );
}

function getProxyLocation(proxy) {
  return (
    proxy?.metadata?.location ||
    proxy?.location ||
    ""
  );
}

function getProxyHost(proxy) {
  return (
    proxy?.metadata?.host ||
    proxy?.host ||
    ""
  );
}

function getProxyPort(proxy) {
  return (
    proxy?.metadata?.port ||
    proxy?.port ||
    ""
  );
}

function getProxyStatus(stock) {
  const numericStock = Number(stock || 0);

  if (numericStock <= 0) {
    return "Out of Stock";
  }

  if (numericStock <= 5) {
    return "Low Stock";
  }

  return "Available";
}

function getProxyTypesForCategory(category) {
  return PROXY_CATEGORIES[category] || [];
}

function createSlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDescription(form) {
  if (form.description.trim()) {
    return form.description.trim();
  }

  const parts = [
    form.type,
    form.provider,
    form.location,
  ].filter(Boolean);

  if (parts.length > 0) {
    return `${parts.join(" ")} proxy for secure and reliable online connectivity.`;
  }

  return "Premium proxy service.";
}

/* =========================================================
   COMPONENT
   ========================================================= */

function Proxies() {
  const [proxies, setProxies] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingProxy, setEditingProxy] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  /* =========================================================
     API CONFIGURATION
     ========================================================= */

  const apiConfigured = Boolean(API_URL);

  /* =========================================================
     FETCH PROXIES
     ========================================================= */

  const fetchProxies = async () => {
    if (!API_URL) {
      setLoading(false);
      setError(
        "The production API URL is not configured. Add VITE_API_URL to the frontend environment variables."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/products?category=proxies`
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load proxies."
        );
      }

      const products = Array.isArray(data.products)
        ? data.products
        : [];

      setProxies(products);
    } catch (err) {
      console.error("Admin proxies loading error:", err);

      setError(
        err.message ||
          "Unable to load proxy inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    fetchProxies();
  }, []);

  /* =========================================================
     FILTER TYPES
     ========================================================= */

  const availableTypes = useMemo(() => {
    const types = proxies
      .map(getProxyType)
      .filter(Boolean);

    return [
      "all",
      ...Array.from(new Set(types)),
    ];
  }, [proxies]);

  /* =========================================================
     FILTER INVENTORY
     ========================================================= */

  const filteredProxies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return proxies.filter((proxy) => {
      const name = String(
        proxy.name || ""
      ).toLowerCase();

      const category = String(
        getProxyCategory(proxy)
      ).toLowerCase();

      const type = String(
        getProxyType(proxy)
      ).toLowerCase();

      const provider = String(
        getProxyProvider(proxy)
      ).toLowerCase();

      const location = String(
        getProxyLocation(proxy)
      ).toLowerCase();

      const host = String(
        getProxyHost(proxy)
      ).toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        category.includes(query) ||
        type.includes(query) ||
        provider.includes(query) ||
        location.includes(query) ||
        host.includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        getProxyCategory(proxy) === categoryFilter;

      const matchesType =
        typeFilter === "all" ||
        getProxyType(proxy) === typeFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType
      );
    });
  }, [
    proxies,
    search,
    categoryFilter,
    typeFilter,
  ]);

  /* =========================================================
     INVENTORY STATS
     ========================================================= */

  const inventoryStats = useMemo(() => {
    const total = proxies.length;

    const available = proxies.filter(
      (proxy) => Number(proxy.stock || 0) > 0
    ).length;

    const lowStock = proxies.filter((proxy) => {
      const stock = Number(proxy.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;

    const outOfStock = proxies.filter(
      (proxy) => Number(proxy.stock || 0) <= 0
    ).length;

    return {
      total,
      available,
      lowStock,
      outOfStock,
    };
  }, [proxies]);

  /* =========================================================
     FORM
     ========================================================= */

  const openAddForm = () => {
    setEditingProxy(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (proxy) => {
    const category = getProxyCategory(proxy);

    const availableTypes =
      getProxyTypesForCategory(category);

    const currentType = getProxyType(proxy);

    const type =
      availableTypes.includes(currentType)
        ? currentType
        : availableTypes[0] || currentType;

    setEditingProxy(proxy);

    setForm({
      name: proxy.name || "",

      category,

      type,

      provider: getProxyProvider(proxy),

      location: getProxyLocation(proxy),

      host: getProxyHost(proxy),

      port: getProxyPort(proxy),

      /*
       * Credentials are intentionally not loaded
       * into the public product object.
       *
       * Leave these blank unless the backend is later
       * changed to support secure credential storage/
       * fulfillment.
       */
      username: "",

      password: "",

      price: proxy.price ?? "",

      stock: proxy.stock ?? "",

      description: proxy.description || "",
    });

    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingProxy(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((currentForm) => {
      if (name === "category") {
        const nextTypes =
          getProxyTypesForCategory(value);

        return {
          ...currentForm,
          category: value,
          type: nextTypes[0] || "",
        };
      }

      return {
        ...currentForm,
        [name]: value,
      };
    });
  };

  /* =========================================================
     CREATE / UPDATE PROXY
     ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!API_URL) {
      setFormError(
        "The production API URL is not configured."
      );
      return;
    }

    setFormError("");

    const name = form.name.trim();
    const category = form.category.trim();
    const type = form.type.trim();
    const provider = form.provider.trim();
    const location = form.location.trim();
    const host = form.host.trim();
    const port = form.port.trim();
    const description = getDescription(form);

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      setFormError("Proxy name is required.");
      return;
    }

    if (!category) {
      setFormError("Proxy category is required.");
      return;
    }

    if (!type) {
      setFormError("Proxy type is required.");
      return;
    }

    if (!location) {
      setFormError("Proxy location is required.");
      return;
    }

    if (!host) {
      setFormError("Proxy host/IP is required.");
      return;
    }

    if (!port) {
      setFormError("Proxy port is required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setFormError(
        "Price must be a valid number greater than or equal to 0."
      );
      return;
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setFormError(
        "Stock must be a whole number greater than or equal to 0."
      );
      return;
    }

    const slugBase = createSlug(name);

    if (!slugBase) {
      setFormError(
        "Unable to generate a valid product slug from the proxy name."
      );
      return;
    }

    const metadata = {
      proxyCategory: category,
      type,
      provider,
      location,
      host,
      port,
    };

    const payload = {
      name,
      slug: editingProxy
        ? editingProxy.slug || slugBase
        : slugBase,
      description,

      /*
       * IMPORTANT:
       *
       * The customer Proxies.jsx requests:
       *
       * /products?category=proxies
       *
       * Therefore every proxy product must have:
       *
       * category: "proxies"
       *
       * The detailed category lives in metadata.
       */
      category: "proxies",

      price,
      currency: "USD",

      stock,

      unlimitedStock: false,

      featured: false,

      deliveryType: "digital",

      metadata,
    };

    try {
      setSaving(true);

      const productId = editingProxy
        ? getProxyId(editingProxy)
        : null;

      const endpoint = editingProxy
        ? `${API_URL}/products/${encodeURIComponent(
            productId
          )}`
        : `${API_URL}/products`;

      const method = editingProxy
        ? "PUT"
        : "POST";

      const response = await fetch(endpoint, {
        method,

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success) {
        const backendErrors = Array.isArray(
          data.errors
        )
          ? ` ${data.errors.join(" ")}`
          : "";

        throw new Error(
          (data.message ||
            "Unable to save proxy.") +
            backendErrors
        );
      }

      /*
       * Reload from MongoDB instead of manually
       * updating local state.
       *
       * This guarantees the admin page and customer
       * page use the same source of truth.
       */
      await fetchProxies();

      closeForm();
    } catch (err) {
      console.error(
        "Admin proxy save error:",
        err
      );

      setFormError(
        err.message ||
          "Unable to save proxy."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE PROXY
     ========================================================= */

  const deleteProxy = async (proxy) => {
    if (!API_URL) {
      setError(
        "The production API URL is not configured."
      );
      return;
    }

    const productId = getProxyId(proxy);

    if (!productId) {
      setError(
        "This proxy does not have a valid product identifier."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove "${proxy.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(productId);
      setError("");

      const response = await fetch(
        `${API_URL}/products/${encodeURIComponent(
          productId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete proxy."
        );
      }

      /*
       * Backend performs a soft delete by setting
       * isActive to false.
       *
       * Reload the inventory from MongoDB.
       */
      await fetchProxies();
    } catch (err) {
      console.error(
        "Admin proxy delete error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete proxy."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     DATE
     ========================================================= */

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="admin-proxies">

      {/* =====================================================
          API ERROR
      ===================================================== */}

      {!apiConfigured && (
        <div className="proxy-api-warning">
          <FiAlertCircle />

          <div>
            <strong>
              API URL not configured
            </strong>

            <span>
              Set VITE_API_URL to your production
              Render API URL before managing proxies.
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="proxies-heading">
        <div>
          <span>PROXY INVENTORY</span>

          <h1>Proxies</h1>

          <p>
            Manage residential, datacenter,
            mobile, ISP, rotating and specialized
            proxy inventory.
          </p>
        </div>

        <button
          type="button"
          className="add-proxy-button"
          onClick={openAddForm}
          disabled={!apiConfigured}
        >
          <FiPlus />
          Add Proxy
        </button>
      </div>

      {/* =====================================================
          INVENTORY SUMMARY
      ===================================================== */}

      <div className="proxy-purchase-summary">

        <div>
          <strong>
            {inventoryStats.total}
          </strong>

          <span>
            Total Proxies
          </span>
        </div>

        <div>
          <strong>
            {inventoryStats.available}
          </strong>

          <span>
            Available
          </span>
        </div>

        <div>
          <strong>
            {inventoryStats.lowStock}
          </strong>

          <span>
            Low Stock
          </span>
        </div>

        <div>
          <strong>
            {inventoryStats.outOfStock}
          </strong>

          <span>
            Out of Stock
          </span>
        </div>

      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="proxies-toolbar">

        <div className="proxies-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Search proxies, providers, locations or hosts..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
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
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
        >
          <option value="all">
            All Categories
          </option>

          {Object.keys(PROXY_CATEGORIES).map(
            (category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            )
          )}
        </select>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="all">
            All Types
          </option>

          {availableTypes
            .filter((type) => type !== "all")
            .map((type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}
        </select>

        <button
          type="button"
          className="proxies-refresh"
          onClick={fetchProxies}
          disabled={loading}
          title="Refresh proxies"
          aria-label="Refresh proxies"
        >
          <FiRefreshCw
            className={
              loading
                ? "proxy-refresh-spinning"
                : ""
            }
          />
        </button>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="proxy-api-warning">
          <FiAlertCircle />

          <div>
            <strong>
              Unable to load inventory
            </strong>

            <span>
              {error}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="proxies-empty">
          <FiRefreshCw className="proxy-refresh-spinning" />

          <strong>
            Loading proxy inventory...
          </strong>

          <span>
            Getting the latest inventory from MongoDB.
          </span>
        </div>
      ) : (
        <>
          {/* =================================================
              INVENTORY TABLE
          ================================================= */}

          <div className="proxies-table-wrapper">

            <table className="proxies-table">

              <thead>
                <tr>
                  <th>Proxy</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Provider</th>
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
                  filteredProxies.map((proxy) => {
                    const proxyId =
                      getProxyId(proxy);

                    const stock =
                      Number(proxy.stock || 0);

                    const status =
                      getProxyStatus(stock);

                    return (
                      <tr
                        key={proxyId}
                      >

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
                                ID #{proxy.productId || proxy._id}
                              </small>
                            </div>

                          </div>
                        </td>

                        {/* CATEGORY */}

                        <td>
                          <span className="proxy-category-badge">
                            {getProxyCategory(proxy)}
                          </span>
                        </td>

                        {/* TYPE */}

                        <td>
                          <span className="proxy-type-badge">
                            {getProxyType(proxy)}
                          </span>
                        </td>

                        {/* PROVIDER */}

                        <td>
                          <span className="proxy-provider">
                            {getProxyProvider(proxy) || "—"}
                          </span>
                        </td>

                        {/* LOCATION */}

                        <td>
                          <span className="proxy-location">
                            <FiMapPin />

                            {getProxyLocation(proxy) || "—"}
                          </span>
                        </td>

                        {/* HOST */}

                        <td>
                          <span className="proxy-host">
                            {getProxyHost(proxy) || "—"}

                            {getProxyPort(proxy) && (
                              <>
                                :
                                {getProxyPort(proxy)}
                              </>
                            )}
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
                              stock <= 5
                                ? "proxy-stock-low"
                                : ""
                            }
                          >
                            {stock}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`proxy-status ${status
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              )}`}
                          >
                            {status}
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
                              disabled={
                                deletingId ===
                                proxyId
                              }
                            >
                              <FiEdit2 />
                            </button>

                            <button
                              type="button"
                              title="Delete proxy"
                              onClick={() =>
                                deleteProxy(proxy)
                              }
                              disabled={
                                deletingId ===
                                proxyId
                              }
                            >
                              {deletingId ===
                              proxyId ? (
                                <FiRefreshCw className="proxy-refresh-spinning" />
                              ) : (
                                <FiTrash2 />
                              )}
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className="proxies-empty"
                    >
                      <FiSearch />

                      <strong>
                        No proxies found
                      </strong>

                      <span>
                        {proxies.length === 0
                          ? "No proxy products currently exist in MongoDB."
                          : "Try changing your search or filters."}
                      </span>

                      {proxies.length === 0 && (
                        <button
                          type="button"
                          onClick={openAddForm}
                          disabled={!apiConfigured}
                        >
                          <FiPlus />
                          Add Your First Proxy
                        </button>
                      )}
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>
        </>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showForm && (
        <div
          className="proxy-modal-overlay"
          onClick={closeForm}
        >

          <div
            className="proxy-modal"
            onClick={(event) =>
              event.stopPropagation()
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
                    ? "Update the proxy information stored in MongoDB."
                    : "Add a new proxy product to the marketplace."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
                disabled={saving}
              >
                <FiX />
              </button>

            </div>

            {/* FORM ERROR */}

            {formError && (
              <div className="proxy-api-warning">
                <FiAlertCircle />

                <div>
                  <strong>
                    Check the form
                  </strong>

                  <span>
                    {formError}
                  </span>
                </div>
              </div>
            )}

            {/* FORM */}

            <form
              className="proxy-form"
              onSubmit={handleSubmit}
            >

              {/* NAME + CATEGORY */}

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
                    placeholder="e.g. US Rotating Residential"
                    required
                  />
                </div>

                <div className="proxy-form-group">
                  <label>
                    Proxy Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    {Object.keys(
                      PROXY_CATEGORIES
                    ).map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* TYPE + PROVIDER */}

              <div className="proxy-form-row">

                <div className="proxy-form-group">
                  <label>
                    Proxy Type
                  </label>

                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                  >
                    {getProxyTypesForCategory(
                      form.category
                    ).map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="proxy-form-group">
                  <label>
                    Provider
                  </label>

                  <input
                    type="text"
                    name="provider"
                    value={form.provider}
                    onChange={handleChange}
                    placeholder="e.g. Bright Data"
                  />
                </div>

              </div>

              {/* LOCATION + HOST */}

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

              {/* PORT + PRICE */}

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

              {/* DESCRIPTION */}

              <div className="proxy-form-group">

                <label>
                  Description
                  <span className="optional-label">
                    Optional
                  </span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the proxy package..."
                  rows="4"
                />

                <small className="proxy-form-help">
                  If left blank, a description will
                  automatically be generated.
                </small>

              </div>

              {/* STOCK */}

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
                  step="1"
                  required
                />

                <small className="proxy-form-help">
                  Stock automatically determines
                  whether the proxy is available to
                  customers.
                </small>

              </div>

              {/* CREDENTIAL NOTICE */}

              <div className="proxy-api-warning">

                <FiAlertCircle />

                <div>
                  <strong>
                    Proxy credentials
                  </strong>

                  <span>
                    Username and password are not
                    stored in the public product
                    record. Secure proxy credential
                    delivery should be connected to
                    the order/fulfillment system after
                    payment.
                  </span>
                </div>

              </div>

              {/* ACTIONS */}

              <div className="proxy-form-actions">

                <button
                  type="button"
                  className="cancel-proxy"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-proxy"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <FiRefreshCw className="proxy-refresh-spinning" />
                      {editingProxy
                        ? "Saving..."
                        : "Adding..."}
                    </>
                  ) : editingProxy ? (
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