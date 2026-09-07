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
    ======================================================= */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    /* =======================================================
       PRICE SNAPSHOT — USD

       The price is stored at the time the order is created.
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
    ======================================================= */

    totalUSD: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       TOTAL — KES

       Amount to be paid by the customer.
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

         The new system uses manual payment confirmation.
      ===================================================== */

      provider: {
        type: String,
        required: true,
        default: "manual",
        lowercase: true,
        trim: true,
        enum: ["manual", "flutterwave"],
      },

      /* =====================================================
         INTERNAL PAYMENT REFERENCE

         Generated by our backend.

         Example:
         MAN-175...
      ===================================================== */

      txRef: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
        trim: true,
      },

      /* =====================================================
         TRANSACTION ID

         Filled when admin confirms the payment.
      ===================================================== */

      transactionId: {
        type: String,
        default: "",
        trim: true,
      },

      /* =====================================================
         PAYMENT METHOD

         Examples:
         - M-Pesa
         - Bank Transfer
         - Cash
         - Other
      ===================================================== */

      method: {
        type: String,
        default: "",
        trim: true,
        maxlength: 100,
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
         PAYMENT DATE

         Set when admin confirms payment.
      ===================================================== */

      paidAt: {
        type: Date,
        default: null,
      },

      /* =====================================================
         PAYMENT CONFIRMED BY

         Stores the admin/user identifier that confirmed
         the payment.
      ===================================================== */

      confirmedBy: {
        type: String,
        default: "",
        trim: true,
        maxlength: 150,
      },

      /* =====================================================
         PAYMENT CONFIRMATION DATE
      ===================================================== */

      confirmedAt: {
        type: Date,
        default: null,
      },
    },

    /* =======================================================
       ORDER STATUS

       pending:
         Order created but payment not confirmed.

       paid:
         Admin has confirmed payment.

       processing:
         Order is being fulfilled.

       shipped:
         Order has been delivered/sent.

       completed:
         Order is complete.

       cancelled:
         Order was cancelled.

       failed:
         Order could not be fulfilled.
    ======================================================= */

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "completed",
        "cancelled",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    /* =======================================================
       STOCK PROCESSING

       Prevents stock from being deducted more than once.

       Stock remains untouched while payment is pending.
    ======================================================= */

    stockProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* =======================================================
       LEGACY PAYMENT VERIFICATION

       Kept for compatibility with older orders/data.

       New manual-payment orders do not require external
       payment verification.
    ======================================================= */

    paymentVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* =======================================================
       PAYMENT VERIFICATION DATE

       Kept for compatibility with existing orders.
    ======================================================= */

    paymentVerifiedAt: {
      type: Date,
      default: null,
    },

    /* =======================================================
       PAYMENT METADATA

       Optional additional payment information.

       This can be used by the admin system for notes or
       reconciliation details.
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

/* Customer order history */
orderSchema.index({
  customerId: 1,
  createdAt: -1,
});

/* Pending/successful payment lookup */
orderSchema.index({
  "payment.status": 1,
  createdAt: -1,
});

/* Order status lookup */
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