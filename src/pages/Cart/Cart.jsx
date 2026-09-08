import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
} from "react-icons/fi";

import { useCart } from "../../context/CartContext";

import "./Cart.css";

/* =========================================================
   MONEY FORMATTER
========================================================= */

const formatMoney = (amount) => {
  return Number(amount || 0).toFixed(2);
};

/* =========================================================
   CART
========================================================= */

function Cart() {
  const {
    cart,
    addToCart,
    removeFromCart,
    deleteFromCart,
    total,
  } = useCart();

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (!cart.length) {
    return (
      <div className="cart-page empty-cart">
        <div className="container">
          <div className="empty-cart-content">
            <div className="empty-cart-icon">
              <FiShoppingBag />
            </div>

            <h1>Your cart is empty</h1>

            <p>
              You haven't added any products to your cart yet.
            </p>

            <Link
              to="/accounts"
              className="continue-shopping"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ITEM COUNT
  ======================================================= */

  const itemCount = cart.reduce(
    (count, item) =>
      count +
      Math.max(
        1,
        Math.floor(Number(item.quantity || 1))
      ),
    0
  );

  /* =======================================================
     CART PAGE
  ======================================================= */

  return (
    <div className="cart-page">
      <div className="container">
        {/* BACK LINK */}

        <Link
          to="/"
          className="cart-back"
        >
          <FiArrowLeft />
          Continue Shopping
        </Link>

        {/* HEADER */}

        <div className="cart-header">
          <h1>Your Cart</h1>

          <p>
            Review your selected products before checkout.
          </p>
        </div>

        <div className="cart-layout">
          {/* =================================================
              CART ITEMS
          ================================================= */}

          <div className="cart-items">
            {cart.map((product) => {
              const quantity = Math.max(
                1,
                Math.floor(
                  Number(product.quantity || 1)
                )
              );

              const price = Number(
                product.price || 0
              );

              const itemTotal = price * quantity;

              const productId =
                product.id ||
                product.productId;

              return (
                <div
                  className="cart-item"
                  key={productId}
                >
                  {/* PRODUCT IMAGE */}

                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name || "Product"}
                    />
                  ) : (
                    <div className="cart-item-image-placeholder">
                      <FiShoppingBag />
                    </div>
                  )}

                  {/* PRODUCT INFORMATION */}

                  <div className="cart-item-info">
                    <span>
                      {product.category || "Product"}
                    </span>

                    <h3>
                      {product.name || "Unnamed Product"}
                    </h3>

                    <p>
                      ${formatMoney(price)} each
                    </p>
                  </div>

                  {/* ACTIONS */}

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(productId)
                        }
                        aria-label={`Decrease ${product.name || "product"} quantity`}
                        disabled={quantity <= 1}
                      >
                        <FiMinus />
                      </button>

                      <span>
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          addToCart(product)
                        }
                        aria-label={`Increase ${product.name || "product"} quantity`}
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <strong className="cart-item-total">
                      ${formatMoney(itemTotal)}
                    </strong>

                    <button
                      type="button"
                      className="remove-item"
                      onClick={() =>
                        deleteFromCart(productId)
                      }
                      aria-label={`Remove ${product.name || "product"} from cart`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <aside className="cart-summary">
            <h2>
              Order Summary
            </h2>

            <div className="summary-row">
              <span>
                Items
              </span>

              <span>
                {itemCount}
              </span>
            </div>

            <div className="summary-row">
              <span>
                Subtotal
              </span>

              <strong>
                ${formatMoney(total)}
              </strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>
                Total
              </span>

              <strong>
                ${formatMoney(total)}
              </strong>
            </div>

            {/* CHECKOUT */}

            <Link
              to="/payment"
              className="checkout-button"
            >
              Proceed to Checkout
            </Link>

            <p className="checkout-note">
              Your order will be created in the system before
              payment is confirmed.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Cart;