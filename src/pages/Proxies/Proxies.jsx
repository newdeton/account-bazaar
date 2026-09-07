import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";

import ProductCard from "../../components/ProductCard/ProductCard";
import SectionTitle from "../../components/SectionTitle/SectionTitle";

import "./Proxies.css";

/* =========================================================
   API
   ========================================================= */

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

function Proxies() {
  const [proxies, setProxies] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     STOCK AVAILABILITY
     STOCK IS THE SINGLE SOURCE OF TRUTH
     ========================================================= */

  const isAvailable = (product) => {
    return Number(product?.stock || 0) > 0;
  };

  /* =========================================================
     LOAD PROXIES FROM MONGODB
     ========================================================= */

  const fetchProxies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/products?category=proxies&active=true`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load proxies."
        );
      }

      /*
       * Only proxies with stock greater than 0
       * are shown to customers.
       */
      const availableProxies = (
        Array.isArray(data.products)
          ? data.products
          : []
      ).filter(isAvailable);

      setProxies(availableProxies);
    } catch (err) {
      console.error("Proxies loading error:", err);

      setError(
        "Unable to load proxies right now. Please try again."
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
     PROXY TYPES
     ========================================================= */

  const types = useMemo(() => {
    const uniqueTypes = proxies
      .map(
        (product) =>
          product.type ||
          product.metadata?.type ||
          product.deliveryType
      )
      .filter(Boolean);

    return ["All", ...new Set(uniqueTypes)];
  }, [proxies]);

  /* =========================================================
     FILTER PROXIES
     ========================================================= */

  const filteredProducts = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return proxies.filter((product) => {
      /*
       * Never display products with no stock.
       */
      if (!isAvailable(product)) {
        return false;
      }

      const productType =
        product.type ||
        product.metadata?.type ||
        product.deliveryType ||
        "";

      const productName =
        product.name?.toLowerCase() || "";

      const productDescription =
        product.description?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        productName.includes(searchValue) ||
        productDescription.includes(searchValue);

      const matchesType =
        type === "All" ||
        productType === type;

      return matchesSearch && matchesType;
    });
  }, [proxies, search, type]);

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="proxies-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <section className="page-header">
        <div className="container">

          <h1>Premium Proxies</h1>

          <p>
            Browse our available proxy solutions and
            choose the option that fits your online
            projects and activities.
          </p>

        </div>
      </section>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <section className="proxies-content">
        <div className="container">

          <SectionTitle
            eyebrow="Proxy Marketplace"
            title="Available Proxies"
            description="Browse, compare and choose from the proxy packages currently available."
          />

          {/* =================================================
              TOOLBAR
              ================================================= */}

          <div className="proxies-toolbar">

            {/* SEARCH */}

            <div className="search-box">

              <FiSearch />

              <input
                type="text"
                placeholder="Search proxies..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            {/* FILTER */}

            <div className="filter-box">

              <FiFilter />

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
              >
                {types.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

            </div>

            {/* REFRESH */}

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
                    ? "refresh-spinning"
                    : ""
                }
              />
            </button>

          </div>

          {/* =================================================
              LOADING
              ================================================= */}

          {loading && (
            <div className="no-proxies">

              <h3>
                Loading proxies...
              </h3>

              <p>
                Please wait while we load the
                available proxy packages.
              </p>

            </div>
          )}

          {/* =================================================
              ERROR
              ================================================= */}

          {!loading && error && (
            <div className="no-proxies">

              <h3>
                Unable to load proxies
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={fetchProxies}
              >
                <FiRefreshCw />
                Try Again
              </button>

            </div>
          )}

          {/* =================================================
              PRODUCTS
              ================================================= */}

          {!loading &&
            !error &&
            filteredProducts.length > 0 && (

              <div className="proxies-grid">

                {filteredProducts.map(
                  (product) => {

                    /*
                     * Normalize MongoDB product
                     * before passing it to ProductCard.
                     */
                    const normalizedProduct = {
                      ...product,

                      id:
                        product.productId ||
                        product._id,

                      category:
                        product.category
                          ? product.category
                              .charAt(0)
                              .toUpperCase() +
                            product.category.slice(1)
                          : "Proxies",

                      type:
                        product.type ||
                        product.metadata?.type ||
                        product.deliveryType ||
                        "Proxy",

                      /*
                       * Explicit stock value.
                       */
                      stock:
                        Number(
                          product.stock || 0
                        ),

                      /*
                       * Explicit availability.
                       */
                      available:
                        isAvailable(product),
                    };

                    return (
                      <ProductCard
                        key={
                          product.productId ||
                          product._id
                        }
                        product={
                          normalizedProduct
                        }
                      />
                    );
                  }
                )}

              </div>
            )}

          {/* =================================================
              EMPTY
              ================================================= */}

          {!loading &&
            !error &&
            filteredProducts.length === 0 && (

              <div className="no-proxies">

                <h3>
                  {proxies.length === 0
                    ? "No proxies available"
                    : "No proxies found"}
                </h3>

                <p>
                  {proxies.length === 0
                    ? "There are currently no proxy packages available for purchase."
                    : "Try changing your search or proxy type filter."}
                </p>

                {proxies.length === 0 && (
                  <button
                    type="button"
                    onClick={fetchProxies}
                  >
                    <FiRefreshCw />
                    Refresh
                  </button>
                )}

              </div>
            )}

        </div>
      </section>

    </div>
  );
}

export default Proxies;