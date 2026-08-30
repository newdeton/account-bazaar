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

function Cart() {
  const {
    cart,
    addToCart,
    removeFromCart,
    deleteFromCart,
    total,
  } = useCart();

  if (cart.length === 0) {
    return (
      <div className="cart-page empty-cart">
        <div className="container">
          <div className="empty-cart-content">
            <div className="empty-cart-icon">
              <FiShoppingBag />
            </div>

            <h1>Your cart is empty</h1>

            <p>
              You haven't added any products to your
              cart yet.
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

  return (
    <div className="cart-page">
      <div className="container">

        <Link
          to="/"
          className="cart-back"
        >
          <FiArrowLeft />
          Continue Shopping
        </Link>

        <div className="cart-header">
          <h1>Your Cart</h1>

          <p>
            Review your selected products before checkout.
          </p>
        </div>

        <div className="cart-layout">

          {/* CART ITEMS */}

          <div className="cart-items">

            {cart.map((product) => {
              const itemTotal =
                Number(product.price) *
                Number(product.quantity);

              return (
                <div
                  className="cart-item"
                  key={product.id}
                >

                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                  ) : (
                    <div className="cart-item-image-placeholder">
                      <FiShoppingBag />
                    </div>
                  )}

                  <div className="cart-item-info">

                    <span>
                      {product.category}
                    </span>

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      ${product.price} each
                    </p>

                  </div>

                  <div className="cart-item-actions">

                    <div className="quantity-controls">

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(product.id)
                        }
                        aria-label={`Decrease ${product.name} quantity`}
                      >
                        <FiMinus />
                      </button>

                      <span>
                        {product.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          addToCart(product)
                        }
                        aria-label={`Increase ${product.name} quantity`}
                      >
                        <FiPlus />
                      </button>

                    </div>

                    <strong className="cart-item-total">
                      ${itemTotal}
                    </strong>

                    <button
                      type="button"
                      className="remove-item"
                      onClick={() =>
                        deleteFromCart(product.id)
                      }
                      aria-label={`Remove ${product.name}`}
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

          {/* ORDER SUMMARY */}

          <aside className="cart-summary">

            <h2>
              Order Summary
            </h2>

            <div className="summary-row">

              <span>
                Items
              </span>

              <span>
                {cart.reduce(
                  (count, item) =>
                    count + Number(item.quantity),
                  0
                )}
              </span>

            </div>

            <div className="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ${total}
              </strong>

            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                ${total}
              </strong>

            </div>

            {/* PAYMENT PAGE */}

            <Link
              to="/payment"
              className="checkout-button"
            >
              Proceed to Checkout
            </Link>

            <p className="checkout-note">
              You will be redirected to payment
              before your order is submitted.
            </p>

          </aside>

        </div>

      </div>
    </div>
  );
}

export default Cart;