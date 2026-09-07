import express from "express";

import {
  createPayment,
  verifyPayment,
  getOrders,
  getCustomerOrders,
  getOrder,
  markPaymentPaid,
  updateOrderStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

/* =========================================================
   CREATE ORDER
   POST /api/payments/create

   Creates the order immediately with:
   - order.status = pending
   - payment.status = pending
   - payment.provider = manual

   No Flutterwave checkout is initiated.
========================================================= */

router.post("/create", createPayment);

/* =========================================================
   GET ALL ORDERS
   GET /api/payments/orders

   Used by the admin dashboard to retrieve orders from MongoDB.
========================================================= */

router.get("/orders", getOrders);

/* =========================================================
   GET CUSTOMER ORDERS
   GET /api/payments/orders/customer/:customerId

   Used by the customer's My Orders page.
========================================================= */

router.get(
  "/orders/customer/:customerId",
  getCustomerOrders
);

/* =========================================================
   GET SINGLE ORDER
   GET /api/payments/orders/:orderId
========================================================= */

router.get(
  "/orders/:orderId",
  getOrder
);

/* =========================================================
   CONFIRM PAYMENT MANUALLY
   PATCH /api/payments/orders/:orderId/payment

   Admin confirms that payment has been received.

   This will:
   - mark payment as successful
   - mark order as paid
   - deduct stock
   - record confirmation details
========================================================= */

router.patch(
  "/orders/:orderId/payment",
  markPaymentPaid
);

/* =========================================================
   UPDATE ORDER STATUS
   PATCH /api/payments/orders/:orderId/status

   Supported statuses:
   - pending
   - paid
   - processing
   - shipped
   - completed
   - cancelled
   - failed
========================================================= */

router.patch(
  "/orders/:orderId/status",
  updateOrderStatus
);

/* =========================================================
   LEGACY PAYMENT VERIFICATION
   POST /api/payments/verify

   Kept temporarily so existing frontend code does not cause
   a missing-route error while we update Payment.jsx.

   The new system does NOT use Flutterwave verification.
========================================================= */

router.post("/verify", verifyPayment);

export default router;