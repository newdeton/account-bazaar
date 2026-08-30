import mongoose from "mongoose";

/* =========================================================
   ORDER ITEM SCHEMA
========================================================= */

const orderItemSchema = new mongoose.Schema(
  {
    /* =======================================================
       MONGODB PRODUCT REFERENCE
    ======================================================= */

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    /* =======================================================
       PUBLIC PRODUCT CODE
       Example: PRD-175...
    ======================================================= */

    productCode: {
      type: String,
      required: true,
      trim: true,
    },

    /* =======================================================
       PRODUCT NAME SNAPSHOT
       Stored so old orders remain readable even if the
       product is later renamed.
    ======================================================= */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    /* =======================================================
       PRICE SNAPSHOT — USD
       Never rely on the current Product price after checkout.
    ======================================================= */

    priceUSD: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       QUANTITY
    ======================================================= */

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number.",
      },
    },

    /* =======================================================
       ITEM SUBTOTAL — USD
    ======================================================= */

    subtotalUSD: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   ORDER SCHEMA
========================================================= */

const orderSchema = new mongoose.Schema(
  {
    /* =======================================================
       ORDER ID
       Example: ORD-175...
    ======================================================= */

    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /* =======================================================
       CUSTOMER ID
    ======================================================= */

    customerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    /* =======================================================
       CUSTOMER INFORMATION SNAPSHOT
    ======================================================= */

    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 254,
      },

      phone: {
        type: String,
        trim: true,
        default: "",
        maxlength: 50,
      },
    },

    /* =======================================================
       ORDER ITEMS
    ======================================================= */

    items: {
      type: [orderItemSchema],
      default: [],
      validate: {
        validator: (items) =>
          Array.isArray(items) && items.length > 0,
        message: "An order must contain at least one item.",
      },
    },

    /* =======================================================
       TOTAL — USD
       This is the price displayed to the customer.
    ======================================================= */

    totalUSD: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       TOTAL — KES
       This is the amount actually sent to Flutterwave.
    ======================================================= */

    totalKES: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       EXCHANGE RATE
       1 USD = 129 KES
    ======================================================= */

    exchangeRate: {
      type: Number,
      required: true,
      default: 129,
      min: 0.01,
    },

    /* =======================================================
       PAYMENT CURRENCY
    ======================================================= */

    currency: {
      type: String,
      required: true,
      default: "KES",
      uppercase: true,
      trim: true,
    },

    /* =======================================================
       PAYMENT INFORMATION
    ======================================================= */

    payment: {
      /* =====================================================
         PAYMENT PROVIDER
      ===================================================== */

      provider: {
        type: String,
        required: true,
        default: "flutterwave",
        lowercase: true,
        trim: true,
      },

      /* =====================================================
         UNIQUE TRANSACTION REFERENCE
         Generated by our backend.
      ===================================================== */

      txRef: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
        trim: true,
      },

      /* =====================================================
         FLUTTERWAVE TRANSACTION ID
      ===================================================== */

      transactionId: {
        type: String,
        default: "",
        trim: true,
      },

      /* =====================================================
         FLUTTERWAVE REFERENCE
      ===================================================== */

      flutterwaveRef: {
        type: String,
        default: "",
        trim: true,
      },

      /* =====================================================
         PAYMENT STATUS
      ===================================================== */

      status: {
        type: String,
        enum: [
          "pending",
          "successful",
          "failed",
          "cancelled",
        ],
        default: "pending",
        index: true,
      },

      /* =====================================================
         PAYMENT METHOD
         Example:
         card
         mobilemoney
         banktransfer
      ===================================================== */

      method: {
        type: String,
        default: "",
        trim: true,
      },

      /* =====================================================
         PAYMENT DATE
      ===================================================== */

      paidAt: {
        type: Date,
        default: null,
      },
    },

    /* =======================================================
       ORDER STATUS
    ======================================================= */

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "processing",
        "completed",
        "cancelled",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    /* =======================================================
       STOCK PROCESSING
       
       Prevents the same successful payment/webhook from
       deducting inventory twice.
    ======================================================= */

    stockProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* =======================================================
       PAYMENT VERIFICATION
       
       Useful for tracking whether the server has verified
       the transaction with Flutterwave.
    ======================================================= */

    paymentVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* =======================================================
       PAYMENT VERIFICATION DATE
    ======================================================= */

    paymentVerifiedAt: {
      type: Date,
      default: null,
    },

    /* =======================================================
       FLUTTERWAVE RAW RESPONSE SNAPSHOT
       
       Optional server-side record useful for reconciliation.
       We deliberately don't require this field.
    ======================================================= */

    paymentMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },

  {
    timestamps: true,
  }
);

/* =========================================================
   INDEXES
========================================================= */

orderSchema.index({
  customerId: 1,
  createdAt: -1,
});

orderSchema.index({
  "payment.status": 1,
  createdAt: -1,
});

orderSchema.index({
  status: 1,
  createdAt: -1,
});

/* =========================================================
   MODEL
========================================================= */

const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

export default Order;