import {
  FiMonitor,
  FiSettings,
  FiTrendingUp,
  FiCode,
  FiShield,
  FiHeadphones,
  FiArrowRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import SectionTitle from "../../components/SectionTitle/SectionTitle";

import "./Services.css";

function Services() {
  const services = [
    {
      icon: <FiMonitor />,
      title: "Digital Account Services",
      description:
        "Solutions for customers looking for specific online account-related services.",
    },
    {
      icon: <FiSettings />,
      title: "Account Setup",
      description:
        "Assistance with setting up and configuring online digital services.",
    },
    {
      icon: <FiTrendingUp />,
      title: "Digital Growth",
      description:
        "Practical services and guidance designed to help improve your online presence.",
    },
    {
      icon: <FiCode />,
      title: "Web & Digital Services",
      description:
        "Additional digital solutions for individuals and businesses.",
    },
    {
      icon: <FiShield />,
      title: "Online Security Guidance",
      description:
        "General guidance for improving account security and protecting your online presence.",
    },
    {
      icon: <FiHeadphones />,
      title: "Technical Support",
      description:
        "Get assistance when you need help understanding or using our services.",
    },
  ];

  return (
    <div className="services-page">

      <section className="page-header services-header">
        <div className="container">
          <span className="services-eyebrow">
            More Than A Marketplace
          </span>

          <h1>Our Services</h1>

          <p>
            Explore additional digital services designed to
            help individuals and businesses with their online
            needs.
          </p>
        </div>
      </section>

      <section className="services-content">
        <div className="container">

          <SectionTitle
            eyebrow="What We Offer"
            title="Digital services built around your needs"
            description="Browse our available services or contact us if you need something specific."
            centered
          />

          <div className="services-grid">

            {services.map((service, index) => (
              <div className="service-card" key={index}>

                <div className="service-icon">
                  {service.icon}
                </div>

                <h3>{service.title}</h3>

                <p>{service.description}</p>

                <Link to="/contact">
                  Learn More
                  <FiArrowRight />
                </Link>

              </div>
            ))}

          </div>

        </div>
      </section>

      <section className="services-cta">
        <div className="container">

          <div className="services-cta-content">

            <div>
              <span>Need Something Specific?</span>

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