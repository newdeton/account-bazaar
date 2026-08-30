import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiShoppingCart,
  FiArrowRight,
  FiPackage,
} from "react-icons/fi";

import { useCart } from "../../context/CartContext";

import "./ProductCard.css";

/* =========================================================
   IMAGE NORMALIZER
========================================================= */

const getProductImage = (product) => {
  if (typeof product?.image === "string" && product.image.trim()) {
    return product.image.trim();
  }

  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    const firstImage = product.images.find(
      (image) =>
        typeof image === "string" && image.trim()
    );

    if (firstImage) {
      return firstImage.trim();
    }
  }

  return "";
};

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({ product }) {
  const { addToCart } = useCart();

  const [imageFailed, setImageFailed] =
    useState(false);

  /* =======================================================
     SAFETY
  ======================================================= */

  if (!product) {
    return null;
  }

  /* =======================================================
     PRODUCT ID
  ======================================================= */

  const productId =
    product.productId ||
    product._id ||
    product.id ||
    product.slug;

  /* =======================================================
     PRODUCT TYPE
  ======================================================= */

  const productType =
    product.type ||
    product.metadata?.type ||
    product.deliveryType ||
    "Digital Product";

  /* =======================================================
     STOCK
  ======================================================= */

  const stock = Math.max(
    0,
    Number(product.stock ?? 0)
  );

  const isActive =
    product.isActive !== false;

  const isAvailable =
    isActive && stock > 0;

  /* =======================================================
     URL
  ======================================================= */

  const productUrl = productId
    ? `/product/${encodeURIComponent(productId)}`
    : "#";

  /* =======================================================
     DISPLAY VALUES
  ======================================================= */

  const category =
    product.category || "Product";

  const currency =
    product.currency || "USD";

  const price = Number(product.price ?? 0);

  const image =
    getProductImage(product);

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const handleAddToCart = () => {
    if (!isAvailable) {
      return;
    }

    addToCart({
      ...product,

      stock,

      available: true,
    });
  };

  /* =======================================================
     IMAGE ERROR
  ======================================================= */

  const handleImageError = () => {
    setImageFailed(true);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <article
      className={`product-card ${
        !isAvailable
          ? "product-card-out-of-stock"
          : ""
      }`}
    >
      {/* =================================================
          IMAGE
      ================================================= */}

      <Link
        to={productUrl}
        className="product-image"
        aria-label={`View ${product.name || "product"}`}
      >
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.name || "Product"}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        ) : (
          <div
            className="product-image-placeholder"
            aria-hidden="true"
          >
            <FiPackage />
          </div>
        )}

        {/* CATEGORY */}

        <span className="product-category">
          {category}
        </span>

        {/* STOCK */}

        <span
          className={`product-stock-badge ${
            isAvailable
              ? "available"
              : "out-of-stock"
          }`}
        >
          {isAvailable
            ? `${stock} Available`
            : isActive
            ? "Out of Stock"
            : "Unavailable"}
        </span>
      </Link>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="product-content">

        <span className="product-type">
          {productType}
        </span>

        <h3>
          <Link to={productUrl}>
            {product.name || "Untitled Product"}
          </Link>
        </h3>

        <p>
          {product.description ||
            "No product description available."}
        </p>

        {/* =================================================
            BOTTOM
        ================================================= */}

        <div className="product-bottom">

          <div className="product-price">
            {currency}{" "}
            {Number.isFinite(price)
              ? price.toFixed(2)
              : "0.00"}
          </div>

          <div className="product-actions">

            {/* VIEW */}

            <Link
              to={productUrl}
              className="product-details"
              aria-label={`View ${
                product.name || "product"
              }`}
              title="View product"
            >
              <FiArrowRight />
            </Link>

            {/* CART */}

            <button
              type="button"
              className="product-cart"
              onClick={handleAddToCart}
              disabled={!isAvailable}
              aria-label={
                isAvailable
                  ? `Add ${
                      product.name || "product"
                    } to cart`
                  : `${
                      product.name || "Product"
                    } is unavailable`
              }
              title={
                isAvailable
                  ? "Add to cart"
                  : "Unavailable"
              }
            >
              {isAvailable ? (
                <FiShoppingCart />
              ) : (
                <FiPackage />
              )}
            </button>

          </div>

        </div>

      </div>
    </article>
  );
}

export default ProductCard;