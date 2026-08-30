import express from "express";

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

/* =========================================================
   PUBLIC PRODUCT ROUTES
========================================================= */

router.get("/", getProducts);

router.get("/:id", getProduct);

/* =========================================================
   ADMIN PRODUCT ROUTES
========================================================= */

router.post("/", createProduct);

router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

export default router;