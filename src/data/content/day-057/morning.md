# Day 57 - Morning: Phase 2 Project — E-Commerce API Design

> **Aaj ka plan:**
> Phase 2 project start! Aaj hum plan banayenge — E-Commerce API design karenge. Database schema, API endpoints list, folder structure (MVC pattern) — sab decide karenge building start karne se pehle.

---

## Project Overview

> **Socho Aise:**
> Socho tum ek Farmer E-Commerce platform bana rahe ho. Farmers products bech sakte hain, customers order kar sakte hain, reviews de sakte hain. Real-world project — sab kuch jo humne Phase 2 mein seekha hai woh use hoga.

### Features:
- User Authentication (Register, Login, Roles)
- Product CRUD (with categories, images)
- Order System (cart to checkout)
- Review System (ratings, comments)
- File Upload (product images)
- Real-time Updates (WebSocket for order status)
- API Documentation (Swagger)
- Security (Helmet, CORS, Rate Limiting)

---

## Database Schema Design

### User Model

```javascript
// models/User.js
const userSchema = {
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String },
  role: { type: String, enum: ["customer", "seller", "admin"], default: "customer" },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  avatar: { type: String, default: "default-avatar.png" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
};

// Relationships:
// User --> Products (seller ke products)
// User --> Orders (customer ke orders)
// User --> Reviews (user ke reviews)
```

### Product Model

```javascript
// models/Product.js
const productSchema = {
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number },
  category: {
    type: String,
    required: true,
    enum: ["fertilizer", "seeds", "pesticide", "equipment", "organic"],
  },
  stock: { type: Number, required: true, default: 0 },
  images: [{ type: String }],       // multiple images
  seller: { type: ObjectId, ref: "User", required: true },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
};

// Indexes for search/filter performance
// productSchema.index({ name: "text", description: "text" })
// productSchema.index({ category: 1, price: 1 })
```

### Order Model

```javascript
// models/Order.js
const orderSchema = {
  customer: { type: ObjectId, ref: "User", required: true },
  items: [{
    product: { type: ObjectId, ref: "Product", required: true },
    name: String,           // snapshot — product change ho toh bhi order same rahe
    price: Number,          // order time ki price
    quantity: { type: Number, required: true, min: 1 },
  }],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "online", "upi"],
    default: "cod",
  },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],
  createdAt: { type: Date, default: Date.now },
};
```

### Review Model

```javascript
// models/Review.js
const reviewSchema = {
  user: { type: ObjectId, ref: "User", required: true },
  product: { type: ObjectId, ref: "Product", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
};

// Ek user ek product pe sirf ek review de sake
// reviewSchema.index({ user: 1, product: 1 }, { unique: true })
```

> **Yaad Rakho:**
> Order items mein product name aur price ka snapshot rakho. Agar seller baad mein price change kare toh purane orders mein original price dikhni chahiye. Yeh real e-commerce mein zaroori hai.

---

## API Endpoints List

### Auth Endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login, get JWT token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/update-profile` | Update profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### Product Endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/api/products` | List all products (pagination, filter, search) | No |
| GET | `/api/products/:id` | Get single product | No |
| POST | `/api/products` | Create product | Seller/Admin |
| PUT | `/api/products/:id` | Update product | Seller(own)/Admin |
| DELETE | `/api/products/:id` | Delete product | Seller(own)/Admin |
| POST | `/api/products/:id/images` | Upload product images | Seller/Admin |

### Order Endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/orders` | Create new order | Customer |
| GET | `/api/orders/my` | Get my orders | Customer |
| GET | `/api/orders/:id` | Get order detail | Owner/Admin |
| PUT | `/api/orders/:id/status` | Update order status | Seller/Admin |
| PUT | `/api/orders/:id/cancel` | Cancel order | Customer |
| GET | `/api/orders` | All orders (admin) | Admin |

### Review Endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/products/:id/reviews` | Add review | Customer |
| GET | `/api/products/:id/reviews` | Get product reviews | No |
| PUT | `/api/reviews/:id` | Update my review | Owner |
| DELETE | `/api/reviews/:id` | Delete review | Owner/Admin |

> **Tip:**
> Endpoints design karte waqt REST conventions follow karo — nouns use karo (products, orders), verbs nahi (getProducts). HTTP methods se action pata chale (GET=read, POST=create, PUT=update, DELETE=delete).

---

## Folder Structure — MVC Pattern

```
farmer-ecommerce-api/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js                  # Entry point
├── app.js                     # Express app setup
│
├── config/
│   ├── index.js               # Centralized config
│   ├── database.js            # MongoDB connection
│   └── swagger.js             # Swagger setup
│
├── models/                    # M - Model (data layer)
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   └── Review.js
│
├── controllers/               # C - Controller (business logic)
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   └── reviewController.js
│
├── routes/                    # Route definitions
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   └── reviewRoutes.js
│
├── middleware/                 # Custom middleware
│   ├── auth.js                # JWT verification
│   ├── authorize.js           # Role-based access
│   ├── validate.js            # Joi validation
│   ├── errorHandler.js        # Global error handler
│   ├── upload.js              # Multer file upload
│   └── security.js            # Helmet, CORS, Rate limit
│
├── validators/                # Joi schemas
│   ├── authValidator.js
│   ├── productValidator.js
│   └── orderValidator.js
│
├── utils/                     # Helper functions
│   ├── apiResponse.js         # Standardized responses
│   ├── apiError.js            # Custom error class
│   └── pagination.js          # Pagination helper
│
├── uploads/                   # Uploaded files
│
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions
│
└── docs/
    └── postman/
        ├── collection.json
        └── environment-dev.json
```

> **Socho Aise:**
> MVC = Restaurant. **Model** = Kitchen (data prepare karta hai). **Controller** = Waiter (customer aur kitchen ke beech communication). **Routes** = Menu (kaunse options available hain). **Middleware** = Security guard + quality check.

---

## Project Timeline Plan

| Day | Kya Karenge |
|---|---|
| Day 57 Morning | Planning + Design (yeh ho gaya!) |
| Day 57 Evening | Setup + Models + Auth System |
| Day 58 Morning | Product/Order CRUD + Pagination |
| Day 58 Evening | WebSocket + Real-time Features |
| Day 59 Morning | Validation (Joi) + Swagger Docs |
| Day 59 Evening | Testing + Postman + Code Cleanup |

---

## Quick Revision

| Concept | Key Point |
|---|---|
| User Model | name, email, password, role, address |
| Product Model | name, price, category, seller ref, images |
| Order Model | customer, items (snapshot), status, history |
| Review Model | user, product, rating, comment |
| MVC Pattern | Model, Controller, Routes + Middleware |
| Auth Endpoints | Register, Login, Profile, Change Password |
| Product Endpoints | CRUD + image upload + filter/search |
| Order Endpoints | Create, My Orders, Status Update, Cancel |

---

## Aaj Kya Seekha?

1. Project planning karna — pehle design, phir build
2. Database schema design — 4 models with relationships
3. API endpoints list — RESTful conventions
4. MVC folder structure — organized, scalable
5. Order items mein snapshot rakhna — real e-commerce pattern
6. Timeline plan — 3 din mein complete project
