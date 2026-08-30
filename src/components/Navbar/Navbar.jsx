import { Link, NavLink } from "react-router-dom";
import {
  FiShoppingCart,
  FiBookOpen,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useEffect, useState } from "react";

import { useCart } from "../../context/CartContext";

import "./Navbar.css";

const STORAGE_KEY = "accountBazaarMessages";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const { cartCount } = useCart();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* =========================
     UNREAD MESSAGE COUNTER
  ========================= */

  useEffect(() => {
    const updateUnreadCount = () => {
      try {
        const messages = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        );

        const count = messages.filter(
          (message) =>
            message.adminReply && !message.customerRead
        ).length;

        setUnreadMessages(count);
      } catch (error) {
        console.error(
          "Failed to load message count:",
          error
        );

        setUnreadMessages(0);
      }
    };

    updateUnreadCount();

    window.addEventListener("storage", updateUnreadCount);

    const interval = setInterval(
      updateUnreadCount,
      1000
    );

    return () => {
      window.removeEventListener(
        "storage",
        updateUnreadCount
      );

      clearInterval(interval);
    };
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* LOGO */}

        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
        >
          Account <span>Bazaar</span>
        </Link>

        {/* NAVIGATION */}

        <nav
          className={`navbar-links ${
            menuOpen ? "open" : ""
          }`}
        >
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/accounts" onClick={closeMenu}>
            Accounts
          </NavLink>

          <NavLink to="/proxies" onClick={closeMenu}>
            Proxies
          </NavLink>

          <NavLink to="/training" onClick={closeMenu}>
            Training
          </NavLink>

          <NavLink to="/services" onClick={closeMenu}>
            Services
          </NavLink>

          <NavLink to="/contact" onClick={closeMenu}>
            <span className="navbar-contact-link">
              Contact

              {unreadMessages > 0 && (
                <small className="navbar-message-count">
                  {unreadMessages}
                </small>
              )}
            </span>
          </NavLink>
        </nav>

        {/* ACTIONS */}

        <div className="navbar-actions">

          {/* MY BOOKINGS */}

          <Link
            to="/my-bookings"
            className="bookings-button"
            onClick={closeMenu}
          >
            <FiBookOpen />
            <span>My Bookings</span>
          </Link>

          {/* CART */}

          <Link
            to="/cart"
            className="cart-button"
            onClick={closeMenu}
          >
            <FiShoppingCart />

            <span>Cart</span>

            {cartCount > 0 && (
              <small>{cartCount}</small>
            )}
          </Link>

          {/* MOBILE MENU */}

          <button
            type="button"
            className="menu-button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-label="Toggle menu"
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>

        </div>

      </div>
    </header>
  );
}

export default Navbar;