import { useEffect, useState } from "react";

import {
  FiUserCheck,
  FiGlobe,
  FiBookOpen,
  FiGrid,
  FiShield,
  FiHeadphones,
} from "react-icons/fi";

import Hero from "../../components/Hero/Hero";
import CategoryCard from "../../components/CategoryCard/CategoryCard";
import ProductCard from "../../components/ProductCard/ProductCard";
import SectionTitle from "../../components/SectionTitle/SectionTitle";

import "./Home.css";

const API_URL = "http://localhost:5000/api";

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductsError("");

        const response = await fetch(
          `${API_URL}/products?featured=true`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load products."
          );
        }

        setFeaturedProducts(
          Array.isArray(data.products)
            ? data.products
            : []
        );
      } catch (error) {
        console.error(
          "Featured products error:",
          error
        );

        setProductsError(
          "Unable to load featured products."
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="home">

      <Hero />

      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section className="home-section categories-section">
        <div className="container">

          <SectionTitle
            eyebrow="Marketplace"
            title="What are you looking for?"
            description="Choose from our range of digital products and services."
          />

          <div className="categories-grid">

            <CategoryCard
              icon={<FiUserCheck />}
              title="Online Accounts"
              description="Browse available digital accounts for different online platforms."
              to="/accounts"
            />

            <CategoryCard
              icon={<FiGlobe />}
              title="Proxies"
              description="Choose reliable proxy solutions for your online needs."
              to="/proxies"
            />

            <CategoryCard
              icon={<FiBookOpen />}
              title="Training"
              description="Learn practical online skills through our training programs."
              to="/training"
            />

            <CategoryCard
              icon={<FiGrid />}
              title="Other Services"
              description="Explore additional digital services offered by Account Bazaar."
              to="/services"
            />

          </div>

        </div>
      </section>

      {/* =================================================
          FEATURED PRODUCTS
      ================================================= */}

      <section className="home-section featured-section">
        <div className="container">

          <SectionTitle
            eyebrow="Featured"
            title="Popular Products"
            description="Check out some of the products currently available in our marketplace."
          />

          {loadingProducts && (
            <div className="products-loading">
              Loading products...
            </div>
          )}

          {!loadingProducts && productsError && (
            <div className="products-error">
              {productsError}
            </div>
          )}

          {!loadingProducts &&
            !productsError &&
            featuredProducts.length === 0 && (
              <div className="products-empty">
                No featured products are currently available.
              </div>
            )}

          {!loadingProducts &&
            !productsError &&
            featuredProducts.length > 0 && (
              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={
                      product.productId ||
                      product._id
                    }
                    product={{
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
                          : "Product",

                      type:
                        product.type ||
                        product.deliveryType ||
                        "Digital Product",
                    }}
                  />
                ))}
              </div>
            )}

        </div>
      </section>

      {/* =================================================
          WHY US
      ================================================= */}

      <section className="home-section why-section">
        <div className="container">

          <SectionTitle
            eyebrow="Why Account Bazaar"
            title="A marketplace built around convenience"
            description="We make it easier to find the digital products, resources and training you need."
            centered
          />

          <div className="why-grid">

            <div className="why-card">
              <FiShield />

              <h3>Reliable</h3>

              <p>
                We focus on providing dependable products
                and services.
              </p>
            </div>

            <div className="why-card">
              <FiGlobe />

              <h3>Wide Selection</h3>

              <p>
                Explore accounts, proxies, training and
                other services.
              </p>
            </div>

            <div className="why-card">
              <FiHeadphones />

              <h3>Customer Support</h3>

              <p>
                Get assistance when you need help with
                your purchase.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =================================================
          CTA
      ================================================= */}

      <section className="home-cta">
        <div className="container">

          <div className="cta-content">

            <h2>
              Ready to get started?
            </h2>

            <p>
              Explore the marketplace and find what
              you need today.
            </p>

            <a
              href="/accounts"
              className="cta-button"
            >
              Browse Marketplace
            </a>

          </div>

        </div>
      </section>

    </div>
  );
}

export default Home;