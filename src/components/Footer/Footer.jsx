import { Link } from "react-router-dom";
import {
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiMessageCircle,
} from "react-icons/fi";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span>Account</span> Bazaar
          </Link>

          <p>
            Your marketplace for digital accounts, proxies,
            training and other online services.
          </p>

          <div className="footer-socials">
            <a href="#" aria-label="Facebook">
              <FiFacebook />
            </a>

            <a href="#" aria-label="Instagram">
              <FiInstagram />
            </a>

            <a href="#" aria-label="Twitter">
              <FiTwitter />
            </a>

            <a href="#" aria-label="WhatsApp">
              <FiMessageCircle />
            </a>
          </div>
        </div>

        <div className="footer-column">
          <h3>Marketplace</h3>

          <Link to="/accounts">Accounts</Link>
          <Link to="/proxies">Proxies</Link>
          <Link to="/services">Services</Link>
        </div>

        <div className="footer-column">
          <h3>Learn</h3>

          <Link to="/training">Training</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        <div className="footer-column">
          <h3>Support</h3>

          <p>Need help with an order?</p>
          <p>We're here to assist.</p>

          <Link to="/contact" className="footer-support">
            Contact Support
          </Link>
        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Account Bazaar. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;