import { Link } from "react-router-dom";
import { FiShoppingCart, FiArrowRight } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import "./ProductCard.css";

function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <article className="product-card">
      <Link
        to={`/product/${product.id}`}
        className="product-image"
      >
        {product.image ? (
  <img
    src={product.image}
    alt={product.name}
  />
) : (
  <div className="product-image-placeholder">
    {product.name.charAt(0)}
  </div>
)}

        <span className="product-category">
          {product.category}
        </span>
      </Link>

      <div className="product-content">
        <span className="product-type">
          {product.type}
        </span>

        <h3>
          <Link to={`/product/${product.id}`}>
            {product.name}
          </Link>
        </h3>

        <p>{product.description}</p>

        <div className="product-bottom">
          <div className="product-price">
            ${product.price}
          </div>

          <div className="product-actions">
            <Link
              to={`/product/${product.id}`}
              className="product-details"
            >
              <FiArrowRight />
            </Link>

            <button
              className="product-cart"
              onClick={() => addToCart(product)}
              aria-label={`Add ${product.name} to cart`}
            >
              <FiShoppingCart />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;