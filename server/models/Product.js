import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    /* =========================================================
       PRODUCT ID
    ========================================================= */

    productId: {
      type: String,
      unique: true,
      index: true,
      default: () =>
        `PRD-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`,
    },

    /* =========================================================
       BASIC INFORMATION
    ========================================================= */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "accounts",
        "proxies",
        "services",
        "training",
      ],
      lowercase: true,
      index: true,
    },

    /* =========================================================
       PRICING
    ========================================================= */

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },

    /* =========================================================
       IMAGES
    ========================================================= */

    image: {
      type: String,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    /* =========================================================
       INVENTORY
    ========================================================= */

    /*
     * Stock is used when the product has a limited quantity.
     *
     * IMPORTANT:
     * A stock value of 0 does NOT automatically mean the
     * product is unavailable if unlimitedStock is enabled.
     */

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * When true, the product is always considered available
     * regardless of the stock number.
     */

    unlimitedStock: {
      type: Boolean,
      default: false,
    },

    /* =========================================================
       PRODUCT STATUS
    ========================================================= */

    /*
     * Controls whether the product is active and visible
     * to customers.
     *
     * Admin:
     * Available   -> true
     * Disabled    -> false
     */

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* =========================================================
       FEATURED
    ========================================================= */

    featured: {
      type: Boolean,
      default: false,
    },

    /* =========================================================
       DELIVERY
    ========================================================= */

    deliveryType: {
      type: String,
      enum: [
        "digital",
        "manual",
        "training",
        "service",
      ],
      default: "digital",
    },

    /* =========================================================
       EXTRA DATA
    ========================================================= */

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },

  {
    timestamps: true,
  }
);

/* =========================================================
   VIRTUAL: IS AVAILABLE
========================================================= */

/*
 * This gives the frontend/backend a consistent way of
 * determining whether the product can currently be purchased.
 *
 * Rules:
 *
 * 1. Inactive product -> unavailable
 * 2. Unlimited stock -> available
 * 3. Limited stock > 0 -> available
 * 4. Limited stock = 0 -> unavailable
 */

productSchema.virtual("isAvailable").get(function () {
  if (!this.isActive) {
    return false;
  }

  if (this.unlimitedStock) {
    return true;
  }

  return Number(this.stock) > 0;
});

/* =========================================================
   JSON / OBJECT VIRTUALS
========================================================= */

productSchema.set("toJSON", {
  virtuals: true,
});

productSchema.set("toObject", {
  virtuals: true,
});

/* =========================================================
   MODEL
========================================================= */

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;