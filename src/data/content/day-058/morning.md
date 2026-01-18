# Day 58 - Morning: Phase 2 Project — CRUD APIs + Pagination + File Upload

> **Aaj ka plan:**
> Project continue! Aaj Product aur Order CRUD APIs banayenge, pagination/filtering/search add karenge, aur product images ke liye file upload implement karenge.

---

## Task 1: Product Model

```javascript
// src/models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name zaroori hai"],
      trim: true,
      maxlength: [100, "Name 100 chars se zyada nahi"],
    },
    description: {
      type: String,
      required: [true, "Description zaroori hai"],
      maxlength: [1000, "Description 1000 chars se zyada nahi"],
    },
    price: {
      type: Number,
      required: [true, "Price zaroori hai"],
      min: [0, "Price negative nahi ho sakta"],
    },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (val) {
          // Discount price actual price se kam hona chahiye
          return val < this.price;
        },
        message: "Discount price ({VALUE}) actual price se kam hona chahiye",
      },
    },
    category: {
      type: String,
      required: [true, "Category zaroori hai"],
      enum: {
        values: ["fertilizer", "seeds", "pesticide", "equipment", "organic"],
        message: "Invalid category: {VALUE}",
      },
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock negative nahi ho sakta"],
    },
    images: [{ type: String }],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text search ke liye index
productSchema.index({ name: "text", description: "text" });
// Filter performance ke liye indexes
productSchema.index({ category: 1, price: 1 });
productSchema.index({ seller: 1 });

module.exports = mongoose.model("Product", productSchema);
```

---

## Task 2: Pagination Helper

```javascript
// src/utils/pagination.js
// Reusable pagination + filter + sort helper

const paginate = async (model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    populate = "",
    select = "",
  } = options;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 per page
  const skip = (pageNum - 1) * limitNum;

  // Total count (filter ke saath)
  const total = await model.countDocuments(query);
  const totalPages = Math.ceil(total / limitNum);

  // Data fetch karo
  let dbQuery = model.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  if (populate) dbQuery = dbQuery.populate(populate);
  if (select) dbQuery = dbQuery.select(select);

  const data = await dbQuery;

  return {
    data,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  };
};

module.exports = paginate;
```

> **Yaad Rakho:**
> Pagination har list API mein zaroori hai. Bina pagination ke 10,000 products ek saath bhejna = slow response + memory issue. Max limit rakho (50) taaki koi `?limit=10000` na kar sake.

---

## Task 3: Product Controller

```javascript
// src/controllers/productController.js
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const paginate = require("../utils/pagination");

// GET /api/products — saare products (filter, search, sort, pagination)
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page, limit } = req.query;

    // Filter query build karo
    const query = { isActive: true };

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search }; // text index pe search
    }

    const result = await paginate(Product, query, {
      page,
      limit,
      sort: sort || "-createdAt",
      populate: { path: "seller", select: "name email" },
    });

    res.json({
      success: true,
      count: result.data.length,
      ...result.pagination,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id — ek product
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name email phone");

    if (!product || !product.isActive) {
      throw ApiError.notFound("Product nahi mila");
    }

    ApiResponse.success(res, { product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products — naya product banao (seller/admin)
exports.createProduct = async (req, res, next) => {
  try {
    // Seller automatically set karo
    req.body.seller = req.user._id;

    const product = await Product.create(req.body);
    ApiResponse.created(res, { product }, "Product created!");
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id — product update karo
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) throw ApiError.notFound("Product nahi mila");

    // Check: seller apna hi product update kare (admin kuch bhi kare)
    if (product.seller.toString() !== req.user._id.toString() &&
        req.user.role !== "admin") {
      throw ApiError.forbidden("Yeh tumhara product nahi hai");
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    ApiResponse.success(res, { product }, "Product updated!");
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id — soft delete
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw ApiError.notFound("Product nahi mila");

    if (product.seller.toString() !== req.user._id.toString() &&
        req.user.role !== "admin") {
      throw ApiError.forbidden("Yeh tumhara product nahi hai");
    }

    // Soft delete — isActive false karo
    product.isActive = false;
    await product.save();

    ApiResponse.success(res, null, "Product deleted!");
  } catch (error) {
    next(error);
  }
};
```

> **Tip:**
> Soft delete use karo (isActive = false) instead of actually deleting. Orders mein product reference hai — agar hard delete karo toh orders mein error aayega. Soft delete se data safe rehta hai.

---

## Task 4: File Upload Setup (Multer)

```javascript
// src/middleware/upload.js
const multer = require("multer");
const path = require("path");
const ApiError = require("../utils/apiError");
const config = require("../config");

// Storage config — kahan aur kaise save hoga
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // uploads folder mein
  },
  filename: (req, file, cb) => {
    // Unique filename: product-userId-timestamp.ext
    const uniqueName = `product-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter — sirf images allow karo
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    cb(new ApiError("Sirf JPEG, PNG, WebP images allowed hain", 400), false);
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize, // 5MB max
    files: 5,                     // Max 5 files at once
  },
});

module.exports = upload;
```

### Image Upload Endpoint

```javascript
// Product Controller mein add karo
// POST /api/products/:id/images
exports.uploadImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw ApiError.notFound("Product nahi mila");

    // Owner check
    if (product.seller.toString() !== req.user._id.toString() &&
        req.user.role !== "admin") {
      throw ApiError.forbidden("Yeh tumhara product nahi hai");
    }

    if (!req.files || req.files.length === 0) {
      throw ApiError.badRequest("Koi image upload nahi ki");
    }

    // Image paths add karo
    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
    product.images.push(...imagePaths);
    await product.save();

    ApiResponse.success(res, { images: product.images }, "Images uploaded!");
  } catch (error) {
    next(error);
  }
};
```

---

## Task 5: Order Controller

```javascript
// src/controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const paginate = require("../utils/pagination");

// POST /api/orders — naya order banao
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      throw ApiError.badRequest("Order mein kuch toh items daalo");
    }

    // Products verify karo aur total calculate karo
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        throw ApiError.notFound(`Product ${item.product} nahi mila`);
      }
      if (product.stock < item.quantity) {
        throw ApiError.badRequest(
          `${product.name} mein sirf ${product.stock} stock hai`
        );
      }

      // Snapshot save karo (price lock)
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      totalAmount += product.price * item.quantity;

      // Stock reduce karo
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      statusHistory: [{ status: "pending", note: "Order placed" }],
    });

    ApiResponse.created(res, { order }, "Order placed successfully!");
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/my — meri orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const result = await paginate(
      Order,
      { customer: req.user._id },
      {
        page: req.query.page,
        limit: req.query.limit,
        sort: "-createdAt",
        populate: { path: "items.product", select: "name images" },
      }
    );

    res.json({ success: true, ...result.pagination, data: result.data });
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/status — status update karo (seller/admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["confirmed", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Allowed: ${validStatuses.join(", ")}`);
    }

    const order = await Order.findById(req.params.id);
    if (!order) throw ApiError.notFound("Order nahi mila");

    // Already delivered/cancelled toh change mat karo
    if (["delivered", "cancelled"].includes(order.status)) {
      throw ApiError.badRequest(`Order already ${order.status} hai`);
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status changed to ${status}`,
    });

    // Cancel hone pe stock wapas karo
    if (status === "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await order.save();
    ApiResponse.success(res, { order }, "Order status updated!");
  } catch (error) {
    next(error);
  }
};
```

> **Warning:**
> Order cancel hone pe stock wapas karna mat bhoolo! Nahi toh products out-of-stock dikhenge jabki actually available hain. `$inc` operator atomic hai — race condition nahi hoga.

---

## Task 6: Routes Setup

```javascript
// src/routes/productRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getProducts, getProduct, createProduct,
  updateProduct, deleteProduct, uploadImages,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", authenticate, authorize("seller", "admin"), createProduct);
router.put("/:id", authenticate, authorize("seller", "admin"), updateProduct);
router.delete("/:id", authenticate, authorize("seller", "admin"), deleteProduct);
router.post("/:id/images", authenticate, authorize("seller", "admin"),
  upload.array("images", 5), uploadImages);

module.exports = router;
```

```javascript
// src/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  createOrder, getMyOrders, updateOrderStatus,
} = require("../controllers/orderController");

router.post("/", authenticate, createOrder);
router.get("/my", authenticate, getMyOrders);
router.put("/:id/status", authenticate, authorize("seller", "admin"), updateOrderStatus);

module.exports = router;
```

```javascript
// app.js mein add karo
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
```

> **Terminal Command:**
> ```bash
> npm run dev
> # Test: POST /api/products with Bearer token
> ```

---

## Quick Revision

| Task | Kya Banaya |
|---|---|
| Product Model | Schema with text index, category enum |
| Pagination Helper | Reusable paginate() function |
| Product CRUD | Get all, get one, create, update, soft delete |
| Filter/Search | Category, price range, text search |
| File Upload | Multer setup, image validation, 5MB limit |
| Order System | Create order, stock check, price snapshot |
| Order Status | Status update with history, cancel + restock |
| Routes | Auth + role middleware on protected routes |

---

## Aaj Kya Seekha?

1. Product model with text indexes for search
2. Reusable pagination helper — page, limit, sort, filter
3. Product CRUD APIs — with owner verification
4. Multer file upload — images only, size limit
5. Order system — stock check, price snapshot, status history
6. Order cancellation — stock restore with atomic operations
