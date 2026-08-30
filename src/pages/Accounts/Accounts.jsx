import { useEffect, useState } from "react";
import { FiSearch, FiFilter } from "react-icons/fi";

import ProductCard from "../../components/ProductCard/ProductCard";
import SectionTitle from "../../components/SectionTitle/SectionTitle";
import products from "../../data/products";

import "./Accounts.css";

function Accounts() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [adminAccounts, setAdminAccounts] = useState([]);

  /* =========================
     LOAD ADMIN ACCOUNTS
  ========================= */

  const loadAdminAccounts = () => {
    const savedAccounts =
      localStorage.getItem("accountBazaarAccounts");

    if (!savedAccounts) {
      setAdminAccounts([]);
      return;
    }

    try {
      const parsedAccounts =
        JSON.parse(savedAccounts);

      setAdminAccounts(
        parsedAccounts.filter(
          (account) =>
            account.status === "Available"
        )
      );
    } catch (error) {
      console.error(
        "Failed to load admin accounts:",
        error
      );

      setAdminAccounts([]);
    }
  };

  useEffect(() => {
    loadAdminAccounts();

    window.addEventListener(
      "storage",
      loadAdminAccounts
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadAdminAccounts
      );
    };
  }, []);

  /* =========================
     HARD-CODED ACCOUNTS
  ========================= */

  const hardcodedAccounts =
    products.filter(
      (product) =>
        product.category === "Accounts"
    );

  /* =========================
     CONVERT ADMIN ACCOUNTS
     TO CUSTOMER PRODUCTS
  ========================= */

  const customerAdminAccounts = adminAccounts.map((account) => ({
  id: `admin-account-${account.id}`,

  name: account.name,

  category: "Accounts",

  type: account.platform,

  description: `${account.platform} account available for purchase.`,

  price: Number(account.price) || 0,

  stock: 1,

  image: account.image || "",

  status: "Active",

  accountId: account.id,
}));

  /* =========================
     COMBINE BOTH SOURCES
  ========================= */

  const accountProducts = [
    ...hardcodedAccounts,
    ...customerAdminAccounts,
  ];

  /* =========================
     TYPES
  ========================= */

  const types = [
    "All",
    ...new Set(
      accountProducts
        .map((product) => product.type)
        .filter(Boolean)
    ),
  ];

  /* =========================
     FILTER
  ========================= */

  const filteredProducts =
    accountProducts.filter((product) => {
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesType =
        type === "All" ||
        product.type === type;

      return (
        matchesSearch &&
        matchesType
      );
    });

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="accounts-page">

      <section className="page-header">
        <div className="container">

          <h1>Online Accounts</h1>

          <p>
            Browse our available online accounts
            and find the option that fits your needs.
          </p>

        </div>
      </section>

      <section className="accounts-content">

        <div className="container">

          <SectionTitle
            eyebrow="Marketplace"
            title="Available Accounts"
            description="Browse, compare and choose from the accounts currently available."
          />

          <div className="accounts-toolbar">

            <div className="search-box">

              <FiSearch />

              <input
                type="text"
                placeholder="Search accounts..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <div className="filter-box">

              <FiFilter />

              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value)
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

          </div>

          {filteredProducts.length > 0 ? (

            <div className="accounts-grid">

              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}

            </div>

          ) : (

            <div className="no-products">

              <h3>No accounts found</h3>

              <p>
                Try changing your search or
                category filter.
              </p>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

export default Accounts;