import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiPackage,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiImage,
  FiRefreshCw,
} from "react-icons/fi";

import "./Products.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

/* =========================================================
   DEFAULT FORM
========================================================= */

const emptyForm = {
  name: "",
  category: "Accounts",
  description: "",
  price: "",
  stock: "",
  image: "",
};

/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
  "Accounts",
  "Proxies",
  "Services",
  "Training",
];

/* =========================================================
   SLUG GENERATOR
========================================================= */

const generateSlug = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/* =========================================================
   PRODUCT IDENTIFIER
========================================================= */

const getProductIdentifier = (product) => {
  return (
    product?.productId ||
    product?._id ||
    product?.slug ||
    ""
  );
};

/* =========================================================
   IMAGE HELPER
========================================================= */

const getProductImage = (product) => {
  if (product?.image) {
    return product.image;
  }

  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return product.images[0];
  }

  return "";
};

/* =========================================================
   COMPONENT
========================================================= */

function Products() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [form, setForm] = useState({
    ...emptyForm,
  });

  const [previewProduct, setPreviewProduct] =
    useState(null);

  /* =========================================================
     STOCK
  ========================================================= */

  const getStock = (product) => {
    const stock = Number(product?.stock);

    return Number.isFinite(stock) && stock >= 0
      ? stock
      : 0;
  };

  /* =========================================================
     AVAILABILITY
  ========================================================= */

  const isAvailable = (product) => {
    return getStock(product) > 0;
  };

  /* =========================================================
     PRODUCT STATUS
  ========================================================= */

  const getProductStatus = (product) => {
    if (product?.isActive === false) {
      return "Inactive";
    }

    return isAvailable(product)
      ? "Available"
      : "Out of Stock";
  };

  /* =========================================================
     STATUS CLASS
  ========================================================= */

  const getStatusClass = (product) => {
    if (product?.isActive === false) {
      return "inactive";
    }

    return isAvailable(product)
      ? "active"
      : "out";
  };

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * IMPORTANT:
       *
       * Do NOT use ?active=false here.
       *
       * Admin needs to see:
       * - active products
       * - inactive products
       * - out-of-stock products
       */

      const response = await fetch(
        `${API_URL}/products`
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load products."
        );
      }

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      );
    } catch (err) {
      console.error(
        "Admin products load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load products from the server."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadProducts();
  }, []);

  /* =========================================================
     PRODUCT STATISTICS
  ========================================================= */

  const productStats = useMemo(() => {
    const total = products.length;

    const activeProducts = products.filter(
      (product) =>
        product?.isActive !== false
    );

    const available = activeProducts.filter(
      (product) => isAvailable(product)
    ).length;

    const outOfStock = activeProducts.filter(
      (product) => !isAvailable(product)
    ).length;

    const inactive = products.filter(
      (product) =>
        product?.isActive === false
    ).length;

    const totalStock = products.reduce(
      (totalStock, product) =>
        totalStock + getStock(product),
      0
    );

    return {
      total,
      available,
      outOfStock,
      inactive,
      totalStock,
    };
  }, [products]);

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product?.name
          ?.toLowerCase()
          .includes(query) ||
        product?.category
          ?.toLowerCase()
          .includes(query) ||
        product?.description
          ?.toLowerCase()
          .includes(query) ||
        product?.productId
          ?.toLowerCase()
          .includes(query) ||
        product?.slug
          ?.toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        product?.category?.toLowerCase() ===
          categoryFilter.toLowerCase();

      const available =
        isAvailable(product);

      const inactive =
        product?.isActive === false;

      let matchesStatus = true;

      if (statusFilter === "active") {
        matchesStatus =
          !inactive && available;
      }

      if (statusFilter === "out") {
        matchesStatus =
          !inactive && !available;
      }

      if (statusFilter === "inactive") {
        matchesStatus = inactive;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
  ]);

  /* =========================================================
     OPEN ADD FORM
  ========================================================= */

  const openAddForm = () => {
    setEditingProduct(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setShowForm(true);
  };

  /* =========================================================
     OPEN EDIT FORM
  ========================================================= */

  const openEditForm = (product) => {
    if (!product) return;

    setEditingProduct(product);

    setForm({
      name: product.name || "",

      category:
        product.category
          ? product.category
              .charAt(0)
              .toUpperCase() +
            product.category.slice(1)
          : "Accounts",

      description:
        product.description || "",

      price:
        product.price ?? "",

      stock:
        product.stock ?? 0,

      image:
        getProductImage(product),
    });

    setError("");
    setShowForm(true);
  };

  /* =========================================================
     CLOSE FORM
  ========================================================= */

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingProduct(null);

    setForm({
      ...emptyForm,
    });
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =========================================================
     CREATE / UPDATE PRODUCT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();

    const description =
      form.description.trim();

    const image = form.image.trim();

    const price = Number(form.price);

    const stock = Number(form.stock);

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!name) {
      window.alert(
        "Product name is required."
      );
      return;
    }

    if (!description) {
      window.alert(
        "Product description is required."
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      window.alert(
        "Price must be a valid number greater than or equal to 0."
      );
      return;
    }

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      window.alert(
        "Stock must be a valid number greater than or equal to 0."
      );
      return;
    }

    /* -------------------------------------------------------
       GENERATE SLUG
    ------------------------------------------------------- */

    const slug = generateSlug(name);

    if (!slug) {
      window.alert(
        "Unable to generate a valid product slug."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      /* -----------------------------------------------------
         PAYLOAD
      ----------------------------------------------------- */

      const payload = {
        name,

        slug,

        description,

        category:
          form.category.toLowerCase(),

        price,

        stock,

        image,

        images: image
          ? [image]
          : [],

        currency: "USD",

        deliveryType: "digital",

        /*
         * Stock is the source of truth
         * for availability.
         */
        unlimitedStock: false,

        /*
         * New products are active.
         *
         * Existing products preserve
         * their current active state.
         */
        ...(editingProduct
          ? {}
          : {
              isActive: true,
            }),
      };

      let response;

      /* =====================================================
         UPDATE
      ===================================================== */

      if (editingProduct) {
        const identifier =
          getProductIdentifier(
            editingProduct
          );

        if (!identifier) {
          throw new Error(
            "Unable to identify the product."
          );
        }

        response = await fetch(
          `${API_URL}/products/${encodeURIComponent(
            identifier
          )}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );
      }

      /* =====================================================
         CREATE
      ===================================================== */

      else {
        response = await fetch(
          `${API_URL}/products`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );
      }

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to save product."
        );
      }

      /* -----------------------------------------------------
         RELOAD FROM DATABASE
      ----------------------------------------------------- */

      await loadProducts();

      closeForm();
    } catch (err) {
      console.error(
        "Save product error:",
        err
      );

      setError(
        err.message ||
          "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE / SOFT DELETE
  ========================================================= */

  const deleteProduct = async (product) => {
    if (!product) return;

    const confirmed =
      window.confirm(
        `Remove "${product.name}"?\n\nThe product will no longer be available to customers.`
      );

    if (!confirmed) return;

    try {
      setError("");

      const identifier =
        getProductIdentifier(product);

      if (!identifier) {
        throw new Error(
          "Unable to identify the product."
        );
      }

      const response =
        await fetch(
          `${API_URL}/products/${encodeURIComponent(
            identifier
          )}`,
          {
            method: "DELETE",
          }
        );

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to remove product."
        );
      }

      /*
       * Remove from current admin list.
       *
       * Backend performs a soft delete.
       */
      setProducts(
        (currentProducts) =>
          currentProducts.filter(
            (item) =>
              getProductIdentifier(
                item
              ) !== identifier
          )
      );

      if (
        previewProduct &&
        getProductIdentifier(
          previewProduct
        ) === identifier
      ) {
        setPreviewProduct(null);
      }
    } catch (err) {
      console.error(
        "Delete product error:",
        err
      );

      setError(
        err.message ||
          "Unable to remove product."
      );
    }
  };

  /* =========================================================
     RESTORE PRODUCT
  ========================================================= */

  const restoreProduct = async (product) => {
    if (!product) return;

    try {
      setError("");

      const identifier =
        getProductIdentifier(product);

      if (!identifier) {
        throw new Error(
          "Unable to identify the product."
        );
      }

      const response =
        await fetch(
          `${API_URL}/products/${encodeURIComponent(
            identifier
          )}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              isActive: true,
            }),
          }
        );

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to restore product."
        );
      }

      await loadProducts();
    } catch (err) {
      console.error(
        "Restore product error:",
        err
      );

      setError(
        err.message ||
          "Unable to restore product."
      );
    }
  };

  /* =========================================================
     PREVIEW
  ========================================================= */

  const openPreview = (product) => {
    setPreviewProduct(product);
  };

  const closePreview = () => {
    setPreviewProduct(null);
  };

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (previewProduct) {
        closePreview();
      } else if (showForm) {
        closeForm();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    previewProduct,
    showForm,
    saving,
  ]);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (product) => {
    const date =
      product?.updatedAt ||
      product?.createdAt;

    if (!date) {
      return "—";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
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
    <div className="admin-products">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="products-heading">

        <div>
          <span>
            MARKETPLACE INVENTORY
          </span>

          <h1>
            Products
          </h1>

          <p>
            Manage your marketplace
            inventory, availability and
            customer-facing products.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            type="button"
            className="add-product-button"
            onClick={loadProducts}
            disabled={loading}
            title="Refresh products"
          >
            <FiRefreshCw
              className={
                loading
                  ? "products-refresh-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="add-product-button"
            onClick={openAddForm}
          >
            <FiPlus />

            Add Product
          </button>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="products-error">

          <FiAlertCircle />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={loadProducts}
          >
            Try Again
          </button>

        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="products-summary">

        <div className="product-summary-card">

          <div className="product-summary-icon">
            <FiPackage />
          </div>

          <div>
            <span>
              Total Products
            </span>

            <strong>
              {productStats.total}
            </strong>
          </div>

        </div>

        <div className="product-summary-card">

          <div className="product-summary-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>
              Available Products
            </span>

            <strong>
              {productStats.available}
            </strong>
          </div>

        </div>

        <div className="product-summary-card">

          <div className="product-summary-icon">
            <FiAlertCircle />
          </div>

          <div>
            <span>
              Out of Stock
            </span>

            <strong>
              {productStats.outOfStock}
            </strong>
          </div>

        </div>

        <div className="product-summary-card">

          <div className="product-summary-icon">
            <FiPackage />
          </div>

          <div>
            <span>
              Total Inventory
            </span>

            <strong>
              {productStats.totalStock}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="products-toolbar">

        <div className="products-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}

        </div>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Categories
          </option>

          {categories.map(
            (category) => (
              <option
                key={category}
                value={category.toLowerCase()}
              >
                {category}
              </option>
            )
          )}

        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Available
          </option>

          <option value="out">
            Out of Stock
          </option>

          <option value="inactive">
            Inactive
          </option>

        </select>

      </div>

      {/* =====================================================
          RESULT BAR
      ===================================================== */}

      <div className="products-result-bar">

        <span>
          Showing{" "}
          <strong>
            {filteredProducts.length}
          </strong>{" "}
          of{" "}
          <strong>
            {products.length}
          </strong>{" "}
          products
        </span>

        {(search ||
          categoryFilter !== "all" ||
          statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategoryFilter(
                "all"
              );
              setStatusFilter(
                "all"
              );
            }}
          >
            Clear filters
          </button>
        )}

      </div>

      {/* =====================================================
          LOADING / TABLE
      ===================================================== */}

      {loading ? (
        <div className="products-empty">

          <FiRefreshCw className="products-refresh-spin" />

          <strong>
            Loading products...
          </strong>

          <span>
            Retrieving inventory from
            the server.
          </span>

        </div>
      ) : (
        <div className="products-table-wrapper">

          <table className="products-table">

            <thead>

              <tr>
                <th>
                  Product
                </th>

                <th>
                  Category
                </th>

                <th>
                  Price
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Status
                </th>

                <th>
                  Updated
                </th>

                <th></th>
              </tr>

            </thead>

            <tbody>

              {filteredProducts.length > 0 ? (
                filteredProducts.map(
                  (product) => {
                    const stock =
                      getStock(product);

                    const image =
                      getProductImage(
                        product
                      );

                    const inactive =
                      product?.isActive ===
                      false;

                    return (
                      <tr
                        key={
                          getProductIdentifier(
                            product
                          )
                        }
                      >

                        {/* PRODUCT */}

                        <td>

                          <div className="product-name">

                            <div className="product-image">

                              {image ? (
                                <img
                                  src={image}
                                  alt={
                                    product.name ||
                                    "Product"
                                  }
                                  loading="lazy"
                                  onError={(
                                    event
                                  ) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <span>
                                  {product.name
                                    ?.charAt(
                                      0
                                    )
                                    ?.toUpperCase() ||
                                    "P"}
                                </span>
                              )}

                            </div>

                            <div>

                              <strong>
                                {
                                  product.name
                                }
                              </strong>

                              <small>
                                {product.description ||
                                  "No description"}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* CATEGORY */}

                        <td>

                          <span className="category-badge">
                            {product.category ||
                              "Product"}
                          </span>

                        </td>

                        {/* PRICE */}

                        <td>

                          <strong>
                            {product.currency ||
                              "USD"}{" "}
                            {Number(
                              product.price ||
                                0
                            ).toFixed(2)}
                          </strong>

                        </td>

                        {/* STOCK */}

                        <td>

                          <span
                            className={
                              stock === 0
                                ? "stock-empty"
                                : stock <= 5
                                ? "stock-low"
                                : "stock-normal"
                            }
                          >
                            {stock}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${getStatusClass(
                              product
                            )}`}
                          >
                            {getProductStatus(
                              product
                            )}
                          </span>

                        </td>

                        {/* UPDATED */}

                        <td>

                          <span className="product-date">
                            {formatDate(
                              product
                            )}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="product-actions">

                            <button
                              type="button"
                              title="View Product"
                              onClick={() =>
                                openPreview(
                                  product
                                )
                              }
                            >
                              <FiEye />
                            </button>

                            <button
                              type="button"
                              title="Edit Product"
                              onClick={() =>
                                openEditForm(
                                  product
                                )
                              }
                            >
                              <FiEdit2 />
                            </button>

                            {inactive ? (
                              <button
                                type="button"
                                title="Restore Product"
                                onClick={() =>
                                  restoreProduct(
                                    product
                                  )
                                }
                              >
                                <FiRefreshCw />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Delete Product"
                                onClick={() =>
                                  deleteProduct(
                                    product
                                  )
                                }
                              >
                                <FiTrash2 />
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>

                  <td
                    colSpan="7"
                    className="products-empty"
                  >

                    <FiPackage />

                    <strong>
                      No products found
                    </strong>

                    <span>
                      Try changing your
                      search or filters.
                    </span>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showForm && (
        <div
          className="product-modal-overlay"
          onClick={closeForm}
        >

          <div
            className="product-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="product-modal-header">

              <div>

                <span>
                  {editingProduct
                    ? "UPDATE INVENTORY"
                    : "NEW INVENTORY ITEM"}
                </span>

                <h2>
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  {editingProduct
                    ? "Update the product information and stock."
                    : "Create a new product for your marketplace."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                <FiX />
              </button>

            </div>

            <form
              className="product-form"
              onSubmit={handleSubmit}
            >

              {/* NAME / CATEGORY */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Premium Instagram Account"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >

                    {categories.map(
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

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={handleChange}
                  placeholder="Describe what the customer receives..."
                  rows="4"
                  required
                />

              </div>

              {/* PRICE / STOCK */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Price (USD)
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="25.00"
                    min="0"
                    step="0.01"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Stock
                  </label>

                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="10"
                    min="0"
                    step="1"
                    required
                  />

                  <small>
                    Stock greater than 0 =
                    Available. Stock 0 =
                    Out of Stock.
                  </small>

                </div>

              </div>

              {/* IMAGE */}

              <div className="form-group">

                <label>

                  Product Image URL{" "}

                  <span className="optional-label">
                    Optional
                  </span>

                </label>

                <div className="image-input-wrapper">

                  <FiImage />

                  <input
                    type="url"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />

                </div>

              </div>

              {/* IMAGE PREVIEW */}

              {form.image && (
                <div className="form-image-preview">

                  <img
                    src={form.image}
                    alt="Product preview"
                    onError={(
                      event
                    ) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                </div>
              )}

              {/* GENERATED SLUG */}

              {form.name && (
                <div className="product-slug-preview">

                  <span>
                    Product URL identifier
                  </span>

                  <strong>
                    {generateSlug(
                      form.name
                    ) || "—"}
                  </strong>

                </div>
              )}

              {/* ACTIONS */}

              <div className="product-form-actions">

                <button
                  type="button"
                  className="cancel-product"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-product"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <FiRefreshCw className="products-refresh-spin" />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    <>
                      <FiEdit2 />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      Add Product
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          PRODUCT PREVIEW
      ===================================================== */}

      {previewProduct && (
        <div
          className="product-preview-overlay"
          onClick={closePreview}
        >

          <div
            className="product-preview-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="product-preview-close"
              onClick={closePreview}
              aria-label="Close preview"
            >
              <FiX />
            </button>

            {/* IMAGE */}

            <div className="product-preview-image">

              {getProductImage(
                previewProduct
              ) ? (
                <img
                  src={getProductImage(
                    previewProduct
                  )}
                  alt={
                    previewProduct.name
                  }
                />
              ) : (
                <FiPackage />
              )}

            </div>

            {/* CONTENT */}

            <div className="product-preview-content">

              <span className="category-badge">
                {previewProduct.category ||
                  "Product"}
              </span>

              <h2>
                {previewProduct.name}
              </h2>

              <p>
                {previewProduct.description ||
                  "No product description available."}
              </p>

              <div className="product-preview-meta">

                <div>

                  <span>
                    Price
                  </span>

                  <strong>
                    {previewProduct.currency ||
                      "USD"}{" "}
                    {Number(
                      previewProduct.price ||
                        0
                    ).toFixed(2)}
                  </strong>

                </div>

                <div>

                  <span>
                    Stock
                  </span>

                  <strong>
                    {getStock(
                      previewProduct
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Status
                  </span>

                  <strong>
                    {getProductStatus(
                      previewProduct
                    )}
                  </strong>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="product-preview-actions">

                <button
                  type="button"
                  onClick={() => {
                    closePreview();
                    openEditForm(
                      previewProduct
                    );
                  }}
                >
                  <FiEdit2 />
                  Edit Product
                </button>

                {previewProduct.isActive ===
                false ? (
                  <button
                    type="button"
                    onClick={() => {
                      closePreview();
                      restoreProduct(
                        previewProduct
                      );
                    }}
                  >
                    <FiRefreshCw />
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      deleteProduct(
                        previewProduct
                      )
                    }
                  >
                    <FiTrash2 />
                    Delete
                  </button>
                )}

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Products;