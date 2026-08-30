import express from "express";

import {
  createPayment,
  verifyPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

/* =========================================================
   CREATE FLUTTERWAVE CHECKOUT
   POST /api/payments/create
========================================================= */

router.post(
  "/create",
  createPayment
);

/* =========================================================
   VERIFY FLUTTERWAVE PAYMENT
   POST /api/payments/verify
========================================================= */

router.post(
  "/verify",
  verifyPayment
);

export default router;