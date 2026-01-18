# Day 59 - Morning: Phase 2 Project — Validation (Joi) + Error Handling + Swagger Docs

> **Aaj ka plan:**
> Project ko production-ready banayenge — Joi se input validation add karenge saare endpoints pe, proper error handling lagayenge, aur Swagger documentation likhenge.

---

## Task 1: Joi Validation Schemas

```bash
npm install joi
```

### Auth Validators

```javascript
// src/validators/authValidator.js
const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({
      "string.empty": "Name zaroori hai",
      "string.min": "Name kam se kam 2 characters hona chahiye",
      "string.max": "Name 50 characters se zyada nahi ho sakta",
    }),
  email: Joi.string().email().required().lowercase()
    .messages({
      "string.email": "Valid email daalo",
      "any.required": "Email zaroori hai",
    }),
  password: Joi.string().min(6).max(30).required()
    .messages({
      "string.min": "Password kam se kam 6 characters",
    }),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/)
    .messages({
      "string.pattern.base": "Valid 10-digit Indian phone number daalo",
    }),
  role: Joi.string().valid("customer", "seller").default("customer")
    .messages({
      "any.only": "Role sirf customer ya seller ho sakta hai",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({ "any.required": "Email zaroori hai" }),
  password: Joi.string().required()
    .messages({ "any.required": "Password zaroori hai" }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/),
  address: Joi.object({
    street: Joi.string().max(200),
    city: Joi.string().max(50),
    state: Joi.string().max(50),
    pincode: Joi.string().pattern(/^\d{6}$/)
      .messages({ "string.pattern.base": "Valid 6-digit pincode daalo" }),
  }),
}).min(1).messages({
  "object.min": "Kam se kam ek field update karo",
});

module.exports = { registerSchema, loginSchema, updateProfileSchema };
```

### Product Validators

```javascript
// src/validators/productValidator.js
const Joi = require("joi");

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required()
    .messages({ "any.required": "Product name zaroori hai" }),
  description: Joi.string().trim().min(10).max(1000).required()
    .messages({ "any.required": "Description zaroori hai" }),
  price: Joi.number().positive().required()
    .messages({
      "number.positive": "Price positive hona chahiye",
      "any.required": "Price zaroori hai",
    }),
  discountPrice: Joi.number().positive().less(Joi.ref("price"))
    .messages({
      "number.less": "Discount price actual price se kam hona chahiye",
    }),
  category: Joi.string()
    .valid("fertilizer", "seeds", "pesticide", "equipment", "organic")
    .required()
    .messages({ "any.only": "Invalid category" }),
  stock: Joi.number().integer().min(0).default(0),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100),
  description: Joi.string().trim().min(10).max(1000),
  price: Joi.number().positive(),
  discountPrice: Joi.number().positive(),
  category: Joi.string().valid("fertilizer", "seeds", "pesticide", "equipment", "organic"),
  stock: Joi.number().integer().min(0),
}).min(1);

module.exports = { createProductSchema, updateProductSchema };
```

### Order Validators

```javascript
// src/validators/orderValidator.js
const Joi = require("joi");

const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product: Joi.string().required()
        .messages({ "any.required": "Product ID zaroori hai" }),
      quantity: Joi.number().integer().min(1).required()
        .messages({ "number.min": "Quantity kam se kam 1 honi chahiye" }),
    })
  ).min(1).required()
    .messages({ "array.min": "Order mein kam se kam 1 item hona chahiye" }),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
  }).required(),
  paymentMethod: Joi.string().valid("cod", "online", "upi").default("cod"),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("confirmed", "shipped", "delivered", "cancelled")
    .required(),
  note: Joi.string().max(200),
});

module.exports = { createOrderSchema, updateStatusSchema };
```

> **Yaad Rakho:**
> Joi messages Hinglish mein likho agar app Indian users ke liye hai. `.messages()` se custom error messages daal sakte ho. Default English messages confusing ho sakte hain end users ke liye.

---

## Task 2: Validation Middleware

```javascript
// src/middleware/validate.js
const ApiError = require("../utils/apiError");

// Generic validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,      // Saari errors ek saath dikhao
      stripUnknown: true,      // Unknown fields hata do
      allowUnknown: false,     // Unknown fields allow mat karo
    });

    if (error) {
      // Saari validation errors collect karo
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    // Validated + sanitized data use karo
    req.body = value;
    next();
  };
};

// Query params validate karna ho toh
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: errors,
      });
    }
    req.query = value;
    next();
  };
};

module.exports = { validate, validateQuery };
```

---

## Task 3: Routes Mein Validation Lagao

```javascript
// src/routes/authRoutes.js — updated
const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  registerSchema, loginSchema, updateProfileSchema,
} = require("../validators/authValidator");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, getMe);
router.put("/update-profile", authenticate, validate(updateProfileSchema), updateProfile);

module.exports = router;
```

```javascript
// src/routes/productRoutes.js — updated
const { validate } = require("../middleware/validate");
const { createProductSchema, updateProductSchema } = require("../validators/productValidator");

router.post("/", authenticate, authorize("seller", "admin"),
  validate(createProductSchema), createProduct);
router.put("/:id", authenticate, authorize("seller", "admin"),
  validate(updateProductSchema), updateProduct);
```

```javascript
// src/routes/orderRoutes.js — updated
const { validate } = require("../middleware/validate");
const { createOrderSchema, updateStatusSchema } = require("../validators/orderValidator");

router.post("/", authenticate, validate(createOrderSchema), createOrder);
router.put("/:id/status", authenticate, authorize("seller", "admin"),
  validate(updateStatusSchema), updateOrderStatus);
```

> **Tip:**
> Validation middleware route handler se pehle lagao. Agar validation fail hota hai toh controller tak request pahunchti hi nahi. Yeh pattern clean hai — controller mein validation code nahi likhna padta.

---

## Task 4: Global Error Handler

```javascript
// src/middleware/errorHandler.js
const config = require("../config");
const ApiError = require("../utils/apiError");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log karo (development mein full stack, production mein short)
  if (config.env === "development") {
    console.error("ERROR:", err);
  } else {
    console.error("ERROR:", err.message);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = ApiError.badRequest(`Invalid ID format: ${err.value}`);
  }

  // Mongoose duplicate key (unique field)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = ApiError.conflict(`${field} already exists: ${err.keyValue[field]}`);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest(messages.join(". "));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = ApiError.unauthorized("Invalid token");
  }
  if (err.name === "TokenExpiredError") {
    error = ApiError.unauthorized("Token expire ho gaya");
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    error = ApiError.badRequest("File size 5MB se zyada hai");
  }

  // Response bhejo
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: error.message || "Internal Server Error",
    ...(config.env === "development" && {
      stack: err.stack,
      originalError: err.name,
    }),
  });
};

module.exports = errorHandler;
```

> **Warning:**
> Production mein kabhi stack trace mat bhejo! Attackers ko internal code structure pata chal jaata hai. Development mein debugging ke liye dikhao, production mein sirf error message bhejo.

---

## Task 5: Swagger Documentation Add Karo

```javascript
// src/config/swagger.js — setup pehle se hai, ab annotations add karenge
// Routes files mein @swagger comments likhenge

// src/routes/authRoutes.js ke upar:

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & User management
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: "Ramesh Kumar"
 *         email:
 *           type: string
 *           example: "ramesh@farmer.com"
 *         role:
 *           type: string
 *           enum: [customer, seller, admin]
 *         phone:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ramesh Kumar"
 *               email:
 *                 type: string
 *                 example: "ramesh@farmer.com"
 *               password:
 *                 type: string
 *                 example: "secure123"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               role:
 *                 type: string
 *                 enum: [customer, seller]
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "ramesh@farmer.com"
 *               password:
 *                 type: string
 *                 example: "secure123"
 *     responses:
 *       200:
 *         description: Login successful — token milega
 *       401:
 *         description: Invalid credentials
 */
```

> **Yaad Rakho:**
> Swagger annotations code ke upar comment block mein likhte hain (`/** ... */`). Yeh code ka part nahi hai — swagger-jsdoc parse karke documentation generate karta hai. `$ref` se schemas reuse karo.

---

## Task 6: Product + Order Swagger Docs

```javascript
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products (with pagination, filter, search)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [fertilizer, seeds, pesticide, equipment, organic] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: "-createdAt" }
 *     responses:
 *       200:
 *         description: Paginated product list
 *
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, shippingAddress]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       example: "64abc123..."
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street: { type: string }
 *                   city: { type: string }
 *                   state: { type: string }
 *                   pincode: { type: string }
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, online, upi]
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Validation error or stock issue
 *       401:
 *         description: Not authenticated
 */
```

---

## Quick Revision

| Task | Kya Banaya |
|---|---|
| Auth Validators | register, login, updateProfile schemas |
| Product Validators | create, update schemas |
| Order Validators | createOrder, updateStatus schemas |
| Validate Middleware | Generic factory function |
| Error Handler | Mongoose, JWT, Multer errors handle |
| Swagger Docs | Auth, Products, Orders documentation |
| Error Schema | Standard error response format |

---

## Aaj Kya Seekha?

1. Joi validation schemas likhe — custom Hinglish messages
2. Generic validate middleware banaya — reusable factory pattern
3. Routes mein validation middleware lagaya
4. Global error handler — saare error types handle
5. Production mein stack trace nahi bhejni — security
6. Swagger annotations likhe — complete API documentation
