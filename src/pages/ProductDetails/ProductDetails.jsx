import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiShoppingCart,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";

import { useCart } from "../../context/CartContext";

import "./ProductDetails.css";

const API_URL = "http://localhost:5000/api";

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     FETCH PRODUCT
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      if (!id) {
        setError("Product not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setProduct(null);

        const productIdentifier = encodeURIComponent(id);

        const response = await fetch(
          `${API_URL}/products/${productIdentifier}`
        );

        let data = null;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "The server returned an invalid response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load product (${response.status}).`
          );
        }

        if (!data?.success || !data?.product) {
          throw new Error(
            data?.message || "Product not found."
          );
        }

        if (!cancelled) {
          setProduct(data.product);
        }
      } catch (err) {
        console.error("Product details error:", err);

        if (!cancelled) {
          setError(
            err.message ||
              "The product you're looking for doesn't exist or is no longer available."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =====================================================
     LOADING STATE
  ===================================================== */

  if (loading) {
    return (
      <div className="product-details-loading">
        <div className="container">
          <FiLoader className="loading-icon" />

          <h2>Loading Product...</h2>

          <p>
            Please wait while we retrieve the product
            details.
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     NOT FOUND / ERROR
  ===================================================== */

  if (!product || error) {
    return (
      <div className="product-not-found">
        <div className="container">
          <h1>Product Not Found</h1>

          <p>
            {error ||
              "The product you're looking for doesn't exist or is no longer available."}
          </p>

          <Link
            to="/"
            className="back-button"
          >
            <FiArrowLeft />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  /* =====================================================
     NORMALIZE PRODUCT DATA
  ===================================================== */

  const productId =
    product.productId ||
    product._id ||
    product.slug ||
    id;

  const productType =
    product.type ||
    product.deliveryType ||
    "Digital Product";

  const category =
    product.category || "Product";

  const currency =
    product.currency || "USD";

  const price = Number(product.price || 0);

  /* =====================================================
     PRODUCT IMAGES
  ===================================================== */

  const images =
    Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images.filter(Boolean)
      : product.image
      ? [product.image]
      : [];

  const mainImage =
    images.length > 0
      ? images[0]
      : "";

  /* =====================================================
     STOCK
     
     STOCK IS THE ONLY SOURCE OF TRUTH.
     
     stock > 0  = Available
     stock <= 0 = Out of Stock
  ===================================================== */

  const stock = Number(product.stock || 0);

  const isAvailable = stock > 0;

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const handleAddToCart = () => {
    if (!isAvailable) {
      return;
    }

    addToCart({
      ...product,
      productId,
      id: productId,
    });
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="product-details-page">
      <div className="container">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          to="/"
          className="details-back"
        >
          <FiArrowLeft />
          Back to Marketplace
        </Link>

        {/* =================================================
            PRODUCT
        ================================================= */}

        <div className="product-details-layout">

          {/* =================================================
              IMAGE
          ================================================= */}

          <div className="details-image">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
              />
            ) : (
              <div className="details-image-placeholder">
                {product.name
                  ?.charAt(0)
                  ?.toUpperCase() || "P"}
              </div>
            )}

            <span>
              {category}
            </span>
          </div>

          {/* =================================================
              INFO
          ================================================= */}

          <div className="details-info">

            <div className="details-type">
              {productType}
            </div>

            <h1>
              {product.name}
            </h1>

            <div className="details-price">
              {currency}{" "}
              {price.toFixed(2)}
            </div>

            <p className="details-description">
              {product.description ||
                "No description available for this product."}
            </p>

            {/* =================================================
                FEATURES
            ================================================= */}

            <div className="details-features">

              <div>
                <FiCheckCircle />

                <span>
                  {isAvailable
                    ? "Ready to purchase"
                    : "Currently unavailable"}
                </span>
              </div>

              <div>
                <FiCheckCircle />

                <span>
                  Fast processing
                </span>
              </div>

              <div>
                <FiCheckCircle />

                <span>
                  Customer support available
                </span>
              </div>

              <div>
                <FiCheckCircle />

                <span>
                  {stock > 0
                    ? `${stock} available`
                    : "Currently out of stock"}
                </span>
              </div>

            </div>

            {/* =================================================
                CART
            ================================================= */}

            <button
              type="button"
              className="details-cart-button"
              onClick={handleAddToCart}
              disabled={!isAvailable}
            >
              <FiShoppingCart />

              {isAvailable
                ? "Add to Cart"
                : "Out of Stock"}
            </button>

          </div>
        </div>

        {/* =================================================
            ADDITIONAL IMAGES
        ================================================= */}

        {images.length > 1 && (
          <div className="details-gallery">

            {images.map(
              (image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  loading="lazy"
                />
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default ProductDetails;