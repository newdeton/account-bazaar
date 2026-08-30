import { useState } from "react";
import { FiSearch, FiFilter } from "react-icons/fi";

import ProductCard from "../../components/ProductCard/ProductCard";
import SectionTitle from "../../components/SectionTitle/SectionTitle";
import products from "../../data/products";

import "./Proxies.css";

function Proxies() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const proxyProducts = products.filter(
    (product) => product.category === "Proxies"
  );

  const types = [
    "All",
    ...new Set(proxyProducts.map((product) => product.type)),
  ];

  const filteredProducts = proxyProducts.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesType =
      type === "All" || product.type === type;

    return matchesSearch && matchesType;
  });

  return (
    <div className="proxies-page">
      <section className="page-header">
        <div className="container">
          <h1>Proxies</h1>
          <p>
            Find reliable proxy solutions for your online
            projects and activities.
          </p>
        </div>
      </section>

      <section className="proxies-content">
        <div className="container">

          <SectionTitle
            eyebrow="Proxy Marketplace"
            title="Available Proxies"
            description="Choose from our available proxy packages."
          />

          <div className="proxies-toolbar">

            <div className="search-box">
              <FiSearch />

              <input
                type="text"
                placeholder="Search proxies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-box">
              <FiFilter />

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {types.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {filteredProducts.length > 0 ? (
            <div className="proxies-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="no-proxies">
              <h3>No proxies found</h3>
              <p>
                Try changing your search or proxy type.
              </p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}

export default Proxies;