import { useEffect, useMemo, useState } from "react";
import {
  FiMonitor,
  FiSettings,
  FiTrendingUp,
  FiCode,
  FiShield,
  FiHeadphones,
  FiArrowRight,
  FiRefreshCw,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import SectionTitle from "../../components/SectionTitle/SectionTitle";

import "./Services.css";

const API_URL = "http://localhost:5000/api";

/*
 * Frontend icon mapping.
 * MongoDB stores the service information,
 * while the frontend decides which icon to display.
 */
const iconMap = {
  "Digital Account Services": <FiMonitor />,
  "Account Setup": <FiSettings />,
  "Digital Growth": <FiTrendingUp />,
  "Web & Digital Services": <FiCode />,
  "Online Security Guidance": <FiShield />,
  "Technical Support": <FiHeadphones />,
};

function Services() {
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =================================================
     LOAD SERVICES FROM MONGODB
  ================================================= */

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/products?category=services&active=true`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load services."
        );
      }

      /*
       * Services do not necessarily need stock
       * in the same way physical/digital products do.
       *
       * We therefore only rely on the backend
       * active=true filter here.
       */
      setServices(
        Array.isArray(data.products)
          ? data.products
          : []
      );
    } catch (err) {
      console.error("Services loading error:", err);

      setError(
        "Unable to load services right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* =================================================
     NORMALIZE SERVICES
  ================================================= */

  const normalizedServices = useMemo(() => {
    return services.map((service, index) => {
      const name =
        service.name ||
        service.title ||
        "Digital Service";

      return {
        ...service,

        id:
          service.productId ||
          service._id ||
          index,

        title:
          name,

        description:
          service.description ||
          "Professional digital services designed around your needs.",

        icon:
          iconMap[name] || <FiMonitor />,

        category:
          service.type ||
          service.metadata?.type ||
          "Digital Service",
      };
    });
  }, [services]);

  return (
    <div className="services-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section className="page-header services-header">
        <div className="container">

          <span className="services-eyebrow">
            More Than A Marketplace
          </span>

          <h1>
            Our Services
          </h1>

          <p>
            Explore additional digital services designed to
            help individuals and businesses with their online
            needs.
          </p>

        </div>
      </section>

      {/* =================================================
          SERVICES CONTENT
      ================================================= */}

      <section className="services-content">
        <div className="container">

          <SectionTitle
            eyebrow="What We Offer"
            title="Digital services built around your needs"
            description="Browse our available services or contact us if you need something specific."
            centered
          />

          {/* =================================================
              REFRESH
          ================================================= */}

          <div className="services-toolbar">

            <button
              type="button"
              className="services-refresh"
              onClick={fetchServices}
              disabled={loading}
              title="Refresh services"
              aria-label="Refresh services"
            >
              <FiRefreshCw
                className={
                  loading
                    ? "refresh-spinning"
                    : ""
                }
              />

              <span>
                Refresh
              </span>
            </button>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="no-products">

              <h3>
                Loading services...
              </h3>

              <p>
                Please wait while we load our available
                digital services.
              </p>

            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div className="no-products">

              <h3>
                Unable to load services
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={fetchServices}
              >
                <FiRefreshCw />
                Try Again
              </button>

            </div>
          )}

          {/* =================================================
              SERVICES GRID
          ================================================= */}

          {!loading &&
            !error &&
            normalizedServices.length > 0 && (

              <div className="services-grid">

                {normalizedServices.map(
                  (service) => (

                    <div
                      className="service-card"
                      key={service.id}
                    >

                      <div className="service-icon">
                        {service.icon}
                      </div>

                      <h3>
                        {service.title}
                      </h3>

                      <p>
                        {service.description}
                      </p>

                      <Link to="/contact">
                        Learn More
                        <FiArrowRight />
                      </Link>

                    </div>

                  )
                )}

              </div>
            )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            !error &&
            normalizedServices.length === 0 && (

              <div className="no-products">

                <h3>
                  No services available
                </h3>

                <p>
                  There are currently no digital services
                  available. Please check again later.
                </p>

                <button
                  type="button"
                  onClick={fetchServices}
                >
                  <FiRefreshCw />
                  Refresh
                </button>

              </div>
            )}

        </div>
      </section>

      {/* =================================================
          CTA
      ================================================= */}

      <section className="services-cta">
        <div className="container">

          <div className="services-cta-content">

            <div>

              <span>
                Need Something Specific?
              </span>

              <h2>
                Let's discuss your requirements.
              </h2>

              <p>
                If you don't see the service you're looking
                for, contact us and tell us what you need.
              </p>

            </div>

            <Link
              to="/contact"
              className="services-cta-button"
            >
              Contact Us
              <FiArrowRight />
            </Link>

          </div>

        </div>
      </section>

    </div>
  );
}

export default Services;