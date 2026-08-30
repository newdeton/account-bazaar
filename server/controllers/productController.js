import mongoose from "mongoose";
import Product from "../models/Product.js";

/* =========================================================
   HELPERS
========================================================= */

/**
 * Build a safe product lookup query.
 *
 * Supports:
 * - Custom productId
 * - slug
 * - MongoDB _id
 */
const buildProductLookup = (identifier) => {
  const value = String(identifier || "").trim();

  const conditions = [
    {
      productId: value,
    },
    {
      slug: value.toLowerCase(),
    },
  ];

  if (mongoose.Types.ObjectId.isValid(value)) {
    conditions.push({
      _id: value,
    });
  }

  return {
    $or: conditions,
  };
};

/**
 * Normalize boolean values.
 */
const toBoolean = (value) => {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
};

/**
 * Normalize image arrays.
 */
const normalizeImages = (images) => {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter(
      (image) =>
        typeof image === "string" &&
        image.trim()
    )
    .map((image) => image.trim());
};

/* =========================================================
   GET ALL PRODUCTS
   PUBLIC
========================================================= */

export const getProducts = async (req, res) => {
  try {
    const {
      category,
      featured,
      active,
      search,
    } = req.query;

    const filter = {};

    /* -------------------------------------------------------
       CATEGORY
    ------------------------------------------------------- */

    if (category && category.trim()) {
      filter.category = category
        .trim()
        .toLowerCase();
    }

    /* -------------------------------------------------------
       FEATURED
    ------------------------------------------------------- */

    if (featured !== undefined) {
      filter.featured = toBoolean(featured);
    }

    /* -------------------------------------------------------
       ACTIVE FILTER
       
       IMPORTANT:
       Stock controls availability.
       
       isActive is only used when the caller explicitly
       asks for active/inactive products.
       
       Normal public requests DO NOT filter by isActive.
    ------------------------------------------------------- */

    if (active !== undefined) {
      filter.isActive = toBoolean(active);
    }

    /* -------------------------------------------------------
       SEARCH
    ------------------------------------------------------- */

    if (search && search.trim()) {
      const searchTerm = search.trim();

      filter.$or = [
        {
          name: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          description: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          productId: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ];
    }

    const products = await Product.find(filter)
      .sort({
        featured: -1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve products.",
    });
  }
};

/* =========================================================
   GET SINGLE PRODUCT
   PUBLIC
========================================================= */

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Product identifier is required.",
      });
    }

    const identifier = id.trim();

    const lookup =
      buildProductLookup(identifier);

    /*
     * IMPORTANT:
     *
     * Do NOT require isActive === true here.
     *
     * Stock is the source of truth for availability.
     */

    const product =
      await Product.findOne(lookup).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve product.",
    });
  }
};

/* =========================================================
   CREATE PRODUCT
   ADMIN
========================================================= */

export const createProduct = async (
  req,
  res
) => {
  try {
    const {
      name,
      slug,
      description,
      category,
      price,
      currency,
      image,
      images,
      stock,
      unlimitedStock,
      featured,
      deliveryType,
      metadata,
    } = req.body;

    /* -------------------------------------------------------
       REQUIRED FIELDS
    ------------------------------------------------------- */

    if (
      !name ||
      !slug ||
      !description ||
      !category ||
      price === undefined ||
      price === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, slug, description, category and price are required.",
      });
    }

    /* -------------------------------------------------------
       NORMALIZE TEXT
    ------------------------------------------------------- */

    const normalizedName =
      String(name).trim();

    const normalizedSlug =
      String(slug)
        .trim()
        .toLowerCase();

    const normalizedDescription =
      String(description).trim();

    const normalizedCategory =
      String(category)
        .trim()
        .toLowerCase();

    const normalizedCurrency =
      String(currency || "USD")
        .trim()
        .toUpperCase();

    /* -------------------------------------------------------
       VALIDATE TEXT
    ------------------------------------------------------- */

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message:
          "Product name is required.",
      });
    }

    if (!normalizedSlug) {
      return res.status(400).json({
        success: false,
        message:
          "Product slug is required.",
      });
    }

    if (!normalizedDescription) {
      return res.status(400).json({
        success: false,
        message:
          "Product description is required.",
      });
    }

    if (!normalizedCategory) {
      return res.status(400).json({
        success: false,
        message:
          "Product category is required.",
      });
    }

    /* -------------------------------------------------------
       PRICE
    ------------------------------------------------------- */

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Price must be a valid number greater than or equal to 0.",
      });
    }

    /* -------------------------------------------------------
       CHECK SLUG
    ------------------------------------------------------- */

    const existingProduct =
      await Product.findOne({
        slug: normalizedSlug,
      });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this slug already exists.",
      });
    }

    /* -------------------------------------------------------
       STOCK
       
       STOCK IS THE SOURCE OF TRUTH.
    ------------------------------------------------------- */

    let normalizedStock = 0;

    if (
      stock !== undefined &&
      stock !== null &&
      stock !== ""
    ) {
      normalizedStock = Number(stock);

      if (
        !Number.isFinite(normalizedStock) ||
        normalizedStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid number greater than or equal to 0.",
        });
      }
    }

    /* -------------------------------------------------------
       IMAGES
    ------------------------------------------------------- */

    const normalizedImage =
      typeof image === "string"
        ? image.trim()
        : "";

    const normalizedImages =
      normalizeImages(images);

    /* -------------------------------------------------------
       CREATE PRODUCT
    ------------------------------------------------------- */

    const product =
      await Product.create({
        name: normalizedName,

        slug: normalizedSlug,

        description:
          normalizedDescription,

        category:
          normalizedCategory,

        price: numericPrice,

        currency:
          normalizedCurrency,

        image:
          normalizedImage,

        images:
          normalizedImages,

        stock:
          normalizedStock,

        /*
         * Kept for backwards compatibility.
         * It does NOT control availability.
         */
        unlimitedStock:
          toBoolean(unlimitedStock),

        featured:
          toBoolean(featured),

        deliveryType:
          deliveryType
            ? String(
                deliveryType
              ).trim()
            : "digital",

        metadata:
          metadata &&
          typeof metadata === "object" &&
          !Array.isArray(metadata)
            ? metadata
            : {},
      });

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this identifier already exists.",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product information.",
        errors: Object.values(
          error.errors
        ).map(
          (item) => item.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create product.",
    });
  }
};

/* =========================================================
   UPDATE PRODUCT
   ADMIN
========================================================= */

export const updateProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Product identifier is required.",
      });
    }

    const identifier = id.trim();

    const product =
      await Product.findOne(
        buildProductLookup(
          identifier
        )
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    /* -------------------------------------------------------
       TEXT FIELDS
    ------------------------------------------------------- */

    if (
      req.body.name !== undefined
    ) {
      product.name =
        String(
          req.body.name
        ).trim();
    }

    if (
      req.body.slug !== undefined
    ) {
      product.slug =
        String(
          req.body.slug
        )
          .trim()
          .toLowerCase();
    }

    if (
      req.body.description !==
      undefined
    ) {
      product.description =
        String(
          req.body.description
        ).trim();
    }

    if (
      req.body.category !==
      undefined
    ) {
      product.category =
        String(
          req.body.category
        )
          .trim()
          .toLowerCase();
    }

    if (
      req.body.currency !==
      undefined
    ) {
      product.currency =
        String(
          req.body.currency
        )
          .trim()
          .toUpperCase();
    }

    if (
      req.body.deliveryType !==
      undefined
    ) {
      product.deliveryType =
        String(
          req.body.deliveryType
        ).trim();
    }

    /* -------------------------------------------------------
       PRICE
    ------------------------------------------------------- */

    if (
      req.body.price !== undefined
    ) {
      const numericPrice =
        Number(
          req.body.price
        );

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Price must be a valid number greater than or equal to 0.",
        });
      }

      product.price =
        numericPrice;
    }

    /* -------------------------------------------------------
       STOCK
       
       THIS IS THE AVAILABILITY VALUE.
    ------------------------------------------------------- */

    if (
      req.body.stock !==
      undefined
    ) {
      const numericStock =
        Number(
          req.body.stock
        );

      if (
        !Number.isFinite(
          numericStock
        ) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid number greater than or equal to 0.",
        });
      }

      product.stock =
        numericStock;
    }

    /* -------------------------------------------------------
       BOOLEAN FIELDS
    ------------------------------------------------------- */

    if (
      req.body.unlimitedStock !==
      undefined
    ) {
      product.unlimitedStock =
        toBoolean(
          req.body.unlimitedStock
        );
    }

    if (
      req.body.featured !==
      undefined
    ) {
      product.featured =
        toBoolean(
          req.body.featured
        );
    }

    /*
     * isActive is still allowed for admin
     * soft-delete / restoration.
     *
     * It does NOT control stock availability.
     */

    if (
      req.body.isActive !==
      undefined
    ) {
      product.isActive =
        toBoolean(
          req.body.isActive
        );
    }

    /* -------------------------------------------------------
       MAIN IMAGE
    ------------------------------------------------------- */

    if (
      req.body.image !==
      undefined
    ) {
      product.image =
        typeof req.body.image ===
        "string"
          ? req.body.image.trim()
          : "";
    }

    /* -------------------------------------------------------
       IMAGE ARRAY
    ------------------------------------------------------- */

    if (
      req.body.images !==
      undefined
    ) {
      product.images =
        normalizeImages(
          req.body.images
        );
    }

    /* -------------------------------------------------------
       METADATA
    ------------------------------------------------------- */

    if (
      req.body.metadata !==
      undefined
    ) {
      product.metadata =
        req.body.metadata &&
        typeof req.body.metadata ===
          "object" &&
        !Array.isArray(
          req.body.metadata
        )
          ? req.body.metadata
          : {};
    }

    /* -------------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------------- */

    if (!product.name) {
      return res.status(400).json({
        success: false,
        message:
          "Product name cannot be empty.",
      });
    }

    if (!product.slug) {
      return res.status(400).json({
        success: false,
        message:
          "Product slug cannot be empty.",
      });
    }

    if (!product.description) {
      return res.status(400).json({
        success: false,
        message:
          "Product description cannot be empty.",
      });
    }

    if (!product.category) {
      return res.status(400).json({
        success: false,
        message:
          "Product category cannot be empty.",
      });
    }

    /* -------------------------------------------------------
       CHECK SLUG CONFLICT
    ------------------------------------------------------- */

    const duplicateSlug =
      await Product.findOne({
        slug: product.slug,
        _id: {
          $ne: product._id,
        },
      });

    if (duplicateSlug) {
      return res.status(409).json({
        success: false,
        message:
          "Another product already uses this slug.",
      });
    }

    /* -------------------------------------------------------
       SAVE
    ------------------------------------------------------- */

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this identifier already exists.",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product information.",
        errors: Object.values(
          error.errors
        ).map(
          (item) => item.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to update product.",
    });
  }
};

/* =========================================================
   DELETE PRODUCT
   ADMIN

   Soft delete:
   isActive = false

   NOTE:
   This does not modify stock.
========================================================= */

export const deleteProduct = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Product identifier is required.",
      });
    }

    const identifier = id.trim();

    const product =
      await Product.findOne(
        buildProductLookup(
          identifier
        )
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    /* -------------------------------------------------------
       SOFT DELETE
    ------------------------------------------------------- */

    product.isActive = false;

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Product removed successfully.",
    });
  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to remove product.",
    });
  }
};