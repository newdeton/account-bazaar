import { Link } from "react-router-dom";
import { FiArrowRight, FiShield, FiZap } from "react-icons/fi";
import "./Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-content">
          <span className="hero-badge">
            Your Digital Marketplace
          </span>

          <h1>
            Everything You Need,
            <span> In One Place.</span>
          </h1>

          <p>
            Shop online accounts, reliable proxies, practical
            training and other digital services — all from one
            marketplace.
          </p>

          <div className="hero-buttons">
            <Link to="/accounts" className="hero-primary">
              Explore Accounts
              <FiArrowRight />
            </Link>

            <Link to="/training" className="hero-secondary">
              View Training
            </Link>
          </div>

          <div className="hero-features">
            <div>
              <FiShield />
              <span>Reliable Services</span>
            </div>

            <div>
              <FiZap />
              <span>Fast Delivery</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card hero-card-main">
            <div className="hero-card-icon">🛒</div>

            <div>
              <strong>Account Bazaar</strong>
              <span>Digital Marketplace</span>
            </div>
          </div>

          <div className="hero-floating hero-floating-one">
            <strong>Accounts</strong>
            <span>Available Now</span>
          </div>

          <div className="hero-floating hero-floating-two">
            <strong>Proxies</strong>
            <span>Fast & Reliable</span>
          </div>

          <div className="hero-circle"></div>
        </div>
      </div>
    </section>
  );
}

export default Hero;