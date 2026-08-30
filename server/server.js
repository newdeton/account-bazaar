import dotenv from "dotenv";

/* =========================================================
   LOAD ENVIRONMENT VARIABLES FIRST
========================================================= */

dotenv.config({
  path: "./server/.env",
});

/* =========================================================
   IMPORTS AFTER ENVIRONMENT VARIABLES
========================================================= */

const { default: express } =
  await import("express");

const { default: cors } =
  await import("cors");

const { default: cookieParser } =
  await import("cookie-parser");

const { default: helmet } =
  await import("helmet");

const { default: rateLimit } =
  await import("express-rate-limit");

const { default: productRoutes } =
  await import("./routes/productRoutes.js");

const { default: paymentRoutes } =
  await import("./routes/paymentRoutes.js");

const { default: connectDB } =
  await import("./config/db.js");

const { default: authRoutes } =
  await import("./routes/authRoutes.js");

/* =========================================================
   APP
========================================================= */

const app = express();

const PORT =
  process.env.PORT || 5000;

/* =========================================================
   DATABASE
========================================================= */

await connectDB();

/* =========================================================
   SECURITY
========================================================= */

app.use(
  helmet()
);

app.use(
  cors({
    origin:
      process.env.CLIENT_URL,
    credentials: true,
  })
);

/* =========================================================
   BODY PARSING
========================================================= */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(cookieParser());

/* =========================================================
   PRODUCT ROUTES
========================================================= */

app.use(
  "/api/products",
  productRoutes
);

/* =========================================================
   AUTH RATE LIMIT
========================================================= */

const authLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 50,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      success: false,

      message:
        "Too many authentication attempts. Please try again later.",
    },
  });

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,

      message:
        "Account Bazaar API is running.",

      environment:
        process.env.NODE_ENV,
    });
  }
);

/* =========================================================
   AUTH ROUTES
========================================================= */

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

/* =========================================================
   PAYMENT ROUTES
========================================================= */

app.use(
  "/api/payments",
  paymentRoutes
);

/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "API route not found.",
    });
  }
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Internal server error.",
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `Account Bazaar API running on http://localhost:${PORT}`
    );
  }
);