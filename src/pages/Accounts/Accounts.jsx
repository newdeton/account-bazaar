import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiFilter, FiRefreshCw } from "react-icons/fi";

import ProductCard from "../../components/ProductCard/ProductCard";
import SectionTitle from "../../components/SectionTitle/SectionTitle";

import "./Accounts.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =================================================
     STOCK AVAILABILITY
     STOCK IS THE SINGLE SOURCE OF TRUTH
  ================================================= */

  const isAvailable = (product) => {
    return Number(product?.stock || 0) > 0;
  };

  /* =================================================
     LOAD ACCOUNTS FROM MONGODB
  ================================================= */

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/products?category=accounts&active=true`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load accounts."
        );
      }

      /*
       * Only accounts with stock greater than 0
       * are shown to customers.
       */
      const availableAccounts = (
        Array.isArray(data.products)
          ? data.products
          : []
      ).filter(isAvailable);

      setAccounts(availableAccounts);
    } catch (err) {
      console.error("Accounts loading error:", err);

      setError(
        "Unable to load accounts right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  /* =================================================
     ACCOUNT TYPES
  ================================================= */

  const types = useMemo(() => {
    const uniqueTypes = accounts
      .map(
        (product) =>
          product.type ||
          product.metadata?.type ||
          product.deliveryType
      )
      .filter(Boolean);

    return ["All", ...new Set(uniqueTypes)];
  }, [accounts]);

  /* =================================================
     FILTER ACCOUNTS
  ================================================= */

  const filteredProducts = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return accounts.filter((product) => {
      /*
       * Safety check:
       * Never show a product that has no stock.
       */
      if (!isAvailable(product)) {
        return false;
      }

      const productType =
        product.type ||
        product.metadata?.type ||
        product.deliveryType ||
        "";

      const matchesSearch =
        !searchValue ||
        product.name
          ?.toLowerCase()
          .includes(searchValue) ||
        product.description
          ?.toLowerCase()
          .includes(searchValue);

      const matchesType =
        type === "All" ||
        productType === type;

      return matchesSearch && matchesType;
    });
  }, [accounts, search, type]);

  /* =================================================
     RENDER
  ================================================= */

  return (
    <div className="accounts-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section className="page-header">
        <div className="container">

          <h1>Online Accounts</h1>

          <p>
            Browse our available online accounts
            and find the option that fits your needs.
          </p>

        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="accounts-content">
        <div className="container">

          <SectionTitle
            eyebrow="Marketplace"
            title="Available Accounts"
            description="Browse, compare and choose from the accounts currently available."
          />

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="accounts-toolbar">

            <div className="search-box">

              <FiSearch />

              <input
                type="text"
                placeholder="Search accounts..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

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

            <button
              type="button"
              className="accounts-refresh"
              onClick={fetchAccounts}
              disabled={loading}
              title="Refresh accounts"
              aria-label="Refresh accounts"
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
            <div className="no-products">

              <h3>
                Loading accounts...
              </h3>

              <p>
                Please wait while we load the
                available accounts.
              </p>

            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div className="no-products">

              <h3>
                Unable to load accounts
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={fetchAccounts}
              >
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

              <div className="accounts-grid">

                {filteredProducts.map(
                  (product) => {

                    /*
                     * Normalize the product before
                     * passing it to ProductCard.
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
                          : "Accounts",

                      type:
                        product.type ||
                        product.metadata?.type ||
                        product.deliveryType ||
                        "Digital Account",

                      /*
                       * Explicitly preserve stock.
                       */
                      stock:
                        Number(
                          product.stock || 0
                        ),

                      /*
                       * ProductCard can use this
                       * directly if needed.
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

              <div className="no-products">

                <h3>
                  {accounts.length === 0
                    ? "No accounts available"
                    : "No accounts found"}
                </h3>

                <p>
                  {accounts.length === 0
                    ? "There are currently no accounts available for purchase."
                    : "Try changing your search or account type filter."}
                </p>

                {accounts.length === 0 && (
                  <button
                    type="button"
                    onClick={fetchAccounts}
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

export default Accounts;