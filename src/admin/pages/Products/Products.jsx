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
} from "react-icons/fi";

import "./Products.css";

const STORAGE_KEY = "accountBazaarProducts";

const defaultProducts = [
  {
    id: 1,
    name: "Google Workspace Account",
    category: "Accounts",
    description: "Premium Google Workspace account.",
    price: 25,
    stock: 12,
    image: "",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "US Residential Proxy",
    category: "Proxies",
    description: "Reliable US residential proxy.",
    price: 15,
    stock: 35,
    image: "",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Instagram Account",
    category: "Accounts",
    description: "Ready-to-use Instagram account.",
    price: 20,
    stock: 8,
    image: "",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Social Media Management",
    category: "Services",
    description:
      "Professional social media management.",
    price: 100,
    stock: 0,
    image: "",
    status: "Out of Stock",
    createdAt: new Date().toISOString(),
  },
];

const emptyForm = {
  name: "",
  category: "Accounts",
  description: "",
  price: "",
  stock: "",
  image: "",
};

function Products() {
  const [products, setProducts] = useState(() => {
    try {
      const savedProducts =
        localStorage.getItem(STORAGE_KEY);

      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultProducts)
      );

      return defaultProducts;
    } catch (error) {
      console.error(
        "Failed to load products:",
        error
      );

      return defaultProducts;
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [form, setForm] = useState(emptyForm);

  const [previewProduct, setPreviewProduct] =
    useState(null);

  /* =====================================================
     SAVE PRODUCTS
  ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products)
    );
  }, [products]);

  /* =====================================================
     CROSS-TAB SYNC
  ===================================================== */

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;

      try {
        const updated =
          JSON.parse(event.newValue || "[]");

        if (Array.isArray(updated)) {
          setProducts(updated);
        }
      } catch (error) {
        console.error(
          "Failed to sync products:",
          error
        );
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =====================================================
     PRODUCT STATISTICS
  ===================================================== */

  const productStats = useMemo(() => {
    const total = products.length;

    const active = products.filter(
      (product) =>
        product.status === "Active" &&
        Number(product.stock) > 0
    ).length;

    const outOfStock = products.filter(
      (product) =>
        Number(product.stock) <= 0 ||
        product.status === "Out of Stock"
    ).length;

    const totalStock = products.reduce(
      (total, product) =>
        total + Number(product.stock || 0),
      0
    );

    return {
      total,
      active,
      outOfStock,
      totalStock,
    };
  }, [products]);

  /* =====================================================
     FILTER PRODUCTS
  ===================================================== */

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name
          ?.toLowerCase()
          .includes(query) ||
        product.category
          ?.toLowerCase()
          .includes(query) ||
        product.description
          ?.toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        product.category?.toLowerCase() ===
          categoryFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          product.status === "Active") ||
        (statusFilter === "out" &&
          product.status === "Out of Stock");

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

  /* =====================================================
     FORM
  ===================================================== */

  const openAddForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      category: product.category || "Accounts",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      image: product.image || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =====================================================
     SAVE PRODUCT
  ===================================================== */

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      return;
    }

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      return;
    }

    if (
      Number.isNaN(stock) ||
      stock < 0
    ) {
      return;
    }

    const updatedProduct = {
      id: editingProduct
        ? editingProduct.id
        : Date.now(),

      name,

      category: form.category,

      description,

      price,

      stock,

      image: form.image.trim(),

      status:
        stock > 0
          ? "Active"
          : "Out of Stock",

      createdAt:
        editingProduct?.createdAt ||
        new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    if (editingProduct) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProduct.id
            ? updatedProduct
            : product
        )
      );
    } else {
      setProducts((currentProducts) => [
        updatedProduct,
        ...currentProducts,
      ]);
    }

    closeForm();
  };

  /* =====================================================
     DELETE PRODUCT
  ===================================================== */

  const deleteProduct = (id) => {
    const product = products.find(
      (item) => item.id === id
    );

    if (!product) return;

    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setProducts((currentProducts) =>
      currentProducts.filter(
        (item) => item.id !== id
      )
    );

    if (previewProduct?.id === id) {
      setPreviewProduct(null);
    }
  };

  /* =====================================================
     PRODUCT PREVIEW
  ===================================================== */

  const openPreview = (product) => {
    setPreviewProduct(product);
  };

  const closePreview = () => {
    setPreviewProduct(null);
  };

  /* =====================================================
     ESCAPE KEY
  ===================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

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
  }, [previewProduct, showForm]);

  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (product) => {
    if (
      product.status === "Active" &&
      Number(product.stock) > 0
    ) {
      return "active";
    }

    return "out";
  };

  return (
    <div className="admin-products">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="products-heading">

        <div>
          <span>MARKETPLACE INVENTORY</span>

          <h1>Products</h1>

          <p>
            Manage your marketplace inventory,
            availability and customer-facing products.
          </p>
        </div>

        <button
          type="button"
          className="add-product-button"
          onClick={openAddForm}
        >
          <FiPlus />
          Add Product
        </button>

      </div>

      {/* =================================================
          INVENTORY SUMMARY
      ================================================= */}

      <div className="products-summary">

        <div className="product-summary-card">

          <div className="product-summary-icon">
            <FiPackage />
          </div>

          <div>
            <span>Total Products</span>
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
            <span>Active Products</span>
            <strong>
              {productStats.active}
            </strong>
          </div>

        </div>

        <div className="product-summary-card">

          <div className="product-summary-icon">
            <FiAlertCircle />
          </div>

          <div>
            <span>Out of Stock</span>
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
            <span>Total Inventory</span>
            <strong>
              {productStats.totalStock}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="products-toolbar">

        <div className="products-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
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

          <option value="accounts">
            Accounts
          </option>

          <option value="proxies">
            Proxies
          </option>

          <option value="services">
            Services
          </option>

          <option value="training">
            Training
          </option>
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
            Active
          </option>

          <option value="out">
            Out of Stock
          </option>
        </select>

      </div>

      {/* =================================================
          RESULT COUNT
      ================================================= */}

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
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear filters
          </button>
        )}

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="products-table-wrapper">

        <table className="products-table">

          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {filteredProducts.length > 0 ? (

              filteredProducts.map((product) => (

                <tr key={product.id}>

                  {/* PRODUCT */}

                  <td>

                    <div className="product-name">

                      <div className="product-image">

                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                          />
                        ) : (
                          <span>
                            {product.name
                              ?.charAt(0)
                              ?.toUpperCase() || "P"}
                          </span>
                        )}

                      </div>

                      <div>
                        <strong>
                          {product.name}
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
                      {product.category}
                    </span>

                  </td>

                  {/* PRICE */}

                  <td>

                    <strong>
                      $
                      {Number(
                        product.price || 0
                      ).toFixed(2)}
                    </strong>

                  </td>

                  {/* STOCK */}

                  <td>

                    <span
                      className={
                        Number(product.stock) === 0
                          ? "stock-empty"
                          : Number(product.stock) <= 5
                          ? "stock-low"
                          : "stock-normal"
                      }
                    >
                      {product.stock}
                    </span>

                  </td>

                  {/* STATUS */}

                  <td>

                    <span
                      className={`status-badge ${getStatusClass(
                        product
                      )}`}
                    >
                      {product.status}
                    </span>

                  </td>

                  {/* UPDATED */}

                  <td>

                    <span className="product-date">
                      {product.updatedAt
                        ? new Date(
                            product.updatedAt
                          ).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "—"}
                    </span>

                  </td>

                  {/* ACTIONS */}

                  <td>

                    <div className="product-actions">

                      <button
                        type="button"
                        title="View Product"
                        onClick={() =>
                          openPreview(product)
                        }
                      >
                        <FiEye />
                      </button>

                      <button
                        type="button"
                        title="Edit Product"
                        onClick={() =>
                          openEditForm(product)
                        }
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        title="Delete Product"
                        onClick={() =>
                          deleteProduct(product.id)
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
                  colSpan="7"
                  className="products-empty"
                >

                  <FiPackage />

                  <strong>
                    No products found
                  </strong>

                  <span>
                    Try changing your search or
                    filters.
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
                    ? "Update the product information shown across the marketplace."
                    : "Create a new product for your marketplace inventory."}
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
                    <option>
                      Accounts
                    </option>

                    <option>
                      Proxies
                    </option>

                    <option>
                      Services
                    </option>

                    <option>
                      Training
                    </option>
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
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what the customer receives..."
                  rows="4"
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

                </div>

              </div>

              {/* IMAGE */}

              <div className="form-group">

                <label>
                  Product Image URL
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
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                </div>

              )}

              {/* ACTIONS */}

              <div className="product-form-actions">

                <button
                  type="button"
                  className="cancel-product"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-product"
                >
                  {editingProduct ? (
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

      {/* =================================================
          PRODUCT PREVIEW
      ================================================= */}

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

            <div className="product-preview-image">

              {previewProduct.image ? (
                <img
                  src={previewProduct.image}
                  alt={previewProduct.name}
                />
              ) : (
                <FiPackage />
              )}

            </div>

            <div className="product-preview-content">

              <span className="category-badge">
                {previewProduct.category}
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
                  <span>Price</span>

                  <strong>
                    $
                    {Number(
                      previewProduct.price || 0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>Stock</span>

                  <strong>
                    {previewProduct.stock}
                  </strong>
                </div>

                <div>
                  <span>Status</span>

                  <strong>
                    {previewProduct.status}
                  </strong>
                </div>

              </div>

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

                <button
                  type="button"
                  onClick={() =>
                    deleteProduct(
                      previewProduct.id
                    )
                  }
                >
                  <FiTrash2 />
                  Delete
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Products;