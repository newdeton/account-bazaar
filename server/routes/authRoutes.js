import express from "express";

import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   PUBLIC AUTH ROUTES
========================================================= */

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

/* =========================================================
   PROTECTED AUTH ROUTES
========================================================= */

router.get("/me", protect, getMe);

export default router;