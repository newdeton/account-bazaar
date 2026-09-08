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
   PRODUCTION API
   API URL comes from the Vite environment variable.
   No localhost fallback.
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim();

const API_URL = API_BASE_URL
  ? `${API_BASE_URL.replace(/\/$/, "")}/api`
  : null;

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
     LOAD PROXIES FROM MONGODB THROUGH API
  ========================================================= */

  const fetchProxies = async () => {
    try {
      setLoading(true);
      setError("");

      /* -------------------------------------------------------
         API CONFIGURATION CHECK
      ------------------------------------------------------- */

      if (!API_URL) {
        throw new Error(
          "The production API URL is not configured."
        );
      }

      /* -------------------------------------------------------
         FETCH PROXY PRODUCTS
         Backend:
         GET /api/products?category=proxies&active=true
      ------------------------------------------------------- */

      const response = await fetch(
        `${API_URL}/products?category=proxies&active=true`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      /* -------------------------------------------------------
         SAFELY PARSE RESPONSE
      ------------------------------------------------------- */

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      /* -------------------------------------------------------
         API ERROR
      ------------------------------------------------------- */

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Failed to load proxy products."
        );
      }

      /* -------------------------------------------------------
         ONLY PRODUCTS WITH STOCK ARE AVAILABLE
      ------------------------------------------------------- */

      const products = Array.isArray(data.products)
        ? data.products
        : [];

      const availableProxies =
        products.filter(isAvailable);

      setProxies(availableProxies);
    } catch (err) {
      console.error(
        "Proxies loading error:",
        err
      );

      setProxies([]);

      setError(
        err?.message ||
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
     TYPES ARE GENERATED FROM MONGODB DATA
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

    return [
      "All",
      ...new Set(uniqueTypes),
    ];
  }, [proxies]);

  /* =========================================================
     FILTER PROXIES
  ========================================================= */

  const filteredProducts = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return proxies.filter((product) => {
      /* -------------------------------------------------------
         NEVER DISPLAY PRODUCTS WITHOUT STOCK
      ------------------------------------------------------- */

      if (!isAvailable(product)) {
        return false;
      }

      /* -------------------------------------------------------
         PRODUCT TYPE
      ------------------------------------------------------- */

      const productType =
        product.type ||
        product.metadata?.type ||
        product.deliveryType ||
        "";

      /* -------------------------------------------------------
         SEARCH FIELDS
      ------------------------------------------------------- */

      const productName =
        product.name?.toLowerCase() || "";

      const productDescription =
        product.description?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        productName.includes(searchValue) ||
        productDescription.includes(searchValue);

      /* -------------------------------------------------------
         TYPE FILTER
      ------------------------------------------------------- */

      const matchesType =
        type === "All" ||
        productType === type;

      return (
        matchesSearch &&
        matchesType
      );
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
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

            {/* FILTER */}

            <div className="filter-box">

              <FiFilter />

              <select
                value={type}
                onChange={(event) =>
                  setType(
                    event.target.value
                  )
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

                    /* -----------------------------------------
                       NORMALIZE MONGODB PRODUCT
                    ----------------------------------------- */

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

                      stock:
                        Number(
                          product.stock || 0
                        ),

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