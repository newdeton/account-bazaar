import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiShoppingCart,
  FiCheckCircle,
} from "react-icons/fi";

import products from "../../data/products";
import { useCart } from "../../context/CartContext";

import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const product = products.find(
    (item) => item.id === Number(id)
  );

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="container">
          <h1>Product Not Found</h1>
          <p>
            The product you're looking for doesn't exist
            or is no longer available.
          </p>

          <Link to="/" className="back-button">
            <FiArrowLeft />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-page">

      <div className="container">

        <Link to="/" className="details-back">
          <FiArrowLeft />
          Back to Marketplace
        </Link>

        <div className="product-details-layout">

          <div className="details-image">
            <img
              src={product.image}
              alt={product.name}
            />

            <span>{product.category}</span>
          </div>

          <div className="details-info">

            <div className="details-type">
              {product.type}
            </div>

            <h1>{product.name}</h1>

            <div className="details-price">
              ${product.price}
            </div>

            <p className="details-description">
              {product.description}
            </p>

            <div className="details-features">

              <div>
                <FiCheckCircle />
                <span>Ready to purchase</span>
              </div>

              <div>
                <FiCheckCircle />
                <span>Fast processing</span>
              </div>

              <div>
                <FiCheckCircle />
                <span>Customer support available</span>
              </div>

            </div>

            <button
              className="details-cart-button"
              onClick={() => addToCart(product)}
            >
              <FiShoppingCart />
              Add to Cart
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ProductDetails;