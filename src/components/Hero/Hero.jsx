import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiShield,
  FiZap,
  FiShoppingBag,
  FiCheck,
  FiGlobe,
  FiBookOpen,
} from "react-icons/fi";

import "./Hero.css";

function Hero() {
  return (
    <section className="hero">
      {/* BACKGROUND EFFECTS */}
      <div className="hero-background">
        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>
        <div className="hero-grid"></div>
      </div>

      <div className="container hero-container">
        {/* =====================================================
            HERO CONTENT
        ===================================================== */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            <span>Your Digital Marketplace</span>
          </div>

          <h1>
            Everything You Need
            <span> In One Place.</span>
          </h1>

          <p className="hero-description">
            Shop online accounts, reliable proxies, practical
            training and digital services — all brought together
            in one convenient marketplace.
          </p>

          {/* CTA BUTTONS */}
          <div className="hero-buttons">
            <Link
              to="/accounts"
              className="hero-primary"
            >
              <span>Explore Marketplace</span>
              <FiArrowRight />
            </Link>

            <Link
              to="/training"
              className="hero-secondary"
            >
              <FiBookOpen />
              <span>View Training</span>
            </Link>
          </div>

          {/* TRUST FEATURES */}
          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <FiShield />
              </div>

              <div>
                <strong>Reliable</strong>
                <span>Quality services</span>
              </div>
            </div>

            <div className="hero-feature">
              <div className="hero-feature-icon">
                <FiZap />
              </div>

              <div>
                <strong>Fast</strong>
                <span>Quick delivery</span>
              </div>
            </div>

            <div className="hero-feature">
              <div className="hero-feature-icon">
                <FiCheck />
              </div>

              <div>
                <strong>Trusted</strong>
                <span>Customer focused</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            HERO VISUAL
        ===================================================== */}
        <div className="hero-visual">

          {/* Decorative rings */}
          <div className="hero-ring hero-ring-one"></div>
          <div className="hero-ring hero-ring-two"></div>

          {/* Main circle */}
          <div className="hero-circle-inner">
  <img
    src="/account-bazaar-logo.png"
    alt="Account Bazaar"
    className="hero-logo-image"
  />

  <div className="hero-circle-status">
    <span></span>
    Available online
  </div>
</div>

          {/* =================================================
              FLOATING CARD — ACCOUNTS
          ================================================= */}
          <div className="hero-floating hero-floating-one">
            <div className="hero-floating-icon">
              <FiShoppingBag />
            </div>

            <div className="hero-floating-content">
              <strong>Online Accounts</strong>
              <span>Available Now</span>
            </div>

            <div className="hero-floating-check">
              <FiCheck />
            </div>
          </div>

          {/* =================================================
              FLOATING CARD — PROXIES
          ================================================= */}
          <div className="hero-floating hero-floating-two">
            <div className="hero-floating-icon">
              <FiGlobe />
            </div>

            <div className="hero-floating-content">
              <strong>Premium Proxies</strong>
              <span>Fast & Reliable</span>
            </div>

            <div className="hero-floating-check">
              <FiCheck />
            </div>
          </div>

          {/* =================================================
              SMALL STAT CARD
          ================================================= */}
          <div className="hero-stat-card">
            <span className="hero-stat-icon">
              <FiZap />
            </span>

            <div>
              <strong>Fast Delivery</strong>
              <span>Ready when you are</span>
            </div>
          </div>

          {/* Decorative dots */}
          <span className="hero-dot hero-dot-one"></span>
          <span className="hero-dot hero-dot-two"></span>
          <span className="hero-dot hero-dot-three"></span>
        </div>
      </div>
    </section>
  );
}

export default Hero;