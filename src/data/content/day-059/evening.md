# Day 59 - Evening: Phase 2 Project — Testing, Postman Collection & Code Cleanup

> **Aaj ka plan:**
> Project finalize karenge — manual testing Postman se, complete Postman collection banayenge, code cleanup karenge, git best practices follow karenge, aur project documentation likhenge.

---

## Task 1: Manual Testing Checklist

> **Practice Time!**
> Har endpoint ko Postman mein test karo. Yeh checklist follow karo.

### Auth Testing

```
[ ] POST /api/auth/register — Valid data se register karo
  - Check: 201 status, token milna chahiye
  - Check: Password response mein nahi aana chahiye

[ ] POST /api/auth/register — Duplicate email se try karo
  - Check: 409 Conflict error

[ ] POST /api/auth/register — Bina name/email/password ke
  - Check: 400 Validation error with details

[ ] POST /api/auth/login — Sahi credentials
  - Check: 200 status, token milna chahiye

[ ] POST /api/auth/login — Galat password
  - Check: 401 Unauthorized

[ ] GET /api/auth/me — With valid token
  - Check: User profile aana chahiye

[ ] GET /api/auth/me — Without token
  - Check: 401 error
```

### Product Testing

```
[ ] GET /api/products — Bina auth ke (public endpoint)
  - Check: 200, paginated response

[ ] GET /api/products?category=seeds&page=1&limit=5
  - Check: Filtered results, correct pagination

[ ] GET /api/products?search=urea
  - Check: Search results

[ ] POST /api/products — As seller (with token)
  - Check: 201, product created

[ ] POST /api/products — As customer (wrong role)
  - Check: 403 Forbidden

[ ] PUT /api/products/:id — Owner update
  - Check: 200, updated data

[ ] PUT /api/products/:id — Non-owner update
  - Check: 403 Forbidden

[ ] DELETE /api/products/:id — Soft delete
  - Check: isActive = false, GET pe nahi dikhna chahiye
```

### Order Testing

```
[ ] POST /api/orders — Valid order
  - Check: 201, stock reduce hua

[ ] POST /api/orders — Product out of stock
  - Check: 400 error

[ ] GET /api/orders/my — My orders
  - Check: Sirf meri orders dikhein

[ ] PUT /api/orders/:id/status — confirmed
  - Check: Status update, notification emit

[ ] PUT /api/orders/:id/status — cancelled
  - Check: Stock restore hua
```

> **Warning:**
> Har endpoint ke liye happy path (sab sahi ho) aur sad path (galat data, missing token, wrong role) dono test karo. Real users galat data bhejte hain — tumhara API usse gracefully handle kare.

---

## Task 2: Complete Postman Collection

### Collection Structure

```
Farmer E-Commerce API
│
├── Auth
│   ├── Register (POST)
│   │   Body: { name, email, password, phone, role }
│   │   Tests: Save token to env
│   │
│   ├── Login (POST)
│   │   Body: { email, password }
│   │   Tests: Save token to env
│   │
��   ├── Get Profile (GET)
│   │   Auth: Bearer {{token}}
���   │
│   └── Update Profile (PUT)
│       Auth: Bearer {{token}}
│       Body: { name, phone, address }
│
├── Products
│   ├── Get All Products (GET)
│   │   Params: page, limit, category, search, sort
│   │
│   ├── Get Product (GET)
│   │   URL: /api/products/{{product_id}}
│   │
│   ├── Create Product (POST)
│   │   Auth: Bearer {{token}} (seller)
│   │   Body: { name, description, price, category, stock }
│   │   Tests: Save product_id to env
│   │
│   ├── Update Product (PUT)
│   │   Auth: Bearer {{token}}
│   │   Body: { price, stock }
│   │
│   ├── Delete Product (DELETE)
│   │   Auth: Bearer {{token}}
│   │
│   └── Upload Images (POST)
│       Auth: Bearer {{token}}
│       Body: form-data, key=images, type=file
│
├── Orders
│   ├── Create Order (POST)
│   │   Auth: Bearer {{token}} (customer)
│   │   Body: { items, shippingAddress, paymentMethod }
│   │   Tests: Save order_id to env
│   │
│   ├── My Orders (GET)
│   │   Auth: Bearer {{token}}
│   │
│   └── Update Status (PUT)
│       Auth: Bearer {{token}} (seller/admin)
│       Body: { status, note }
│
└── Notifications
    ├── Get Notifications (GET)
    │   Auth: Bearer {{token}}
    │
    ├── Mark as Read (PUT)
    │   URL: /api/notifications/{{notif_id}}/read
    │
    └── Mark All Read (PUT)
```

### Postman Test Scripts

```javascript
// Register request ke Tests tab mein
pm.test("Registration successful", () => {
  pm.response.to.have.status(201);
  const response = pm.response.json();
  pm.expect(response.success).to.be.true;
  pm.expect(response.data.token).to.be.a("string");

  // Token save karo
  pm.environment.set("token", response.data.token);
  pm.environment.set("user_id", response.data.user.id);
});

// Create Product ke Tests tab mein
pm.test("Product created", () => {
  pm.response.to.have.status(201);
  const response = pm.response.json();
  pm.expect(response.data.product).to.have.property("_id");

  // Product ID save karo
  pm.environment.set("product_id", response.data.product._id);
});

// Create Order ke Tests tab mein
pm.test("Order placed", () => {
  pm.response.to.have.status(201);
  const response = pm.response.json();

  pm.environment.set("order_id", response.data.order._id);
});
```

> **Tip:**
> Postman Test scripts mein environment variables auto-save karo. Register --> token save --> baaki requests mein auto use. Create Product --> product_id save --> order mein use. Chain ban jaata hai!

---

## Task 3: Code Cleanup

### Checklist

```
[ ] Console.log hatao (debug wale)
[ ] Unused imports hatao
[ ] Comments clean karo (sirf useful wale rakho)
[ ] Magic numbers ko constants mein daalo
[ ] Error messages consistent rakho
[ ] .env.example update karo
[ ] package.json scripts check karo
```

### Constants File

```javascript
// src/utils/constants.js
// Magic numbers aur repeated strings yahan rakho

module.exports = {
  ROLES: {
    CUSTOMER: "customer",
    SELLER: "seller",
    ADMIN: "admin",
  },

  ORDER_STATUS: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  },

  PRODUCT_CATEGORIES: [
    "fertilizer",
    "seeds",
    "pesticide",
    "equipment",
    "organic",
  ],

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
  },

  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 5,
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  },
};
```

### .env.example Update

```bash
# .env.example — updated with all variables
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/farmer_ecommerce

# JWT
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=5242880

# (Optional) SMTP for emails
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## Task 4: Git Best Practices

```bash
# Branch strategy
git checkout -b develop    # main development branch

# Feature complete — merge to develop
git add .
git commit -m "feat: complete Phase 2 project - farmer e-commerce API"

# Git history check
git log --oneline --graph
```

### Good Commit Messages

```bash
# Commit message format: type: description
git commit -m "feat: add user authentication with JWT"
git commit -m "feat: add product CRUD with pagination"
git commit -m "feat: add order system with stock management"
git commit -m "feat: add WebSocket notifications"
git commit -m "feat: add Joi validation to all endpoints"
git commit -m "docs: add Swagger API documentation"
git commit -m "fix: handle duplicate email error in register"
git commit -m "refactor: extract pagination utility"
```

> **Yaad Rakho:**
> Commit message types: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `refactor` (code restructure), `test` (tests), `chore` (maintenance). Chhote focused commits karo — ek commit = ek kaam.

---

## Task 5: Project Documentation

```javascript
// README.md structure (reference — khud likho)

/*
# Farmer E-Commerce API

## Features
- User Authentication (JWT, Role-based)
- Product CRUD with search/filter/pagination
- Order System with stock management
- Real-time notifications (Socket.io)
- File Upload (product images)
- Input Validation (Joi)
- API Documentation (Swagger)
- Security (Helmet, CORS, Rate Limiting)

## Tech Stack
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.io (WebSocket)
- Joi Validation
- Swagger Documentation
- Multer (File Upload)

## Setup
1. Clone repository
2. Copy .env.example to .env
3. npm install
4. npm run dev

## API Documentation
- Swagger UI: http://localhost:3000/api-docs
- Postman Collection: docs/postman/collection.json

## Folder Structure
- src/models/ — Database schemas
- src/controllers/ — Business logic
- src/routes/ — API endpoints
- src/middleware/ — Auth, validation, security
- src/validators/ — Joi schemas
- src/utils/ — Helper functions
- src/config/ — App configuration
*/
```

---

## Task 6: Final Project Structure

```
farmer-ecommerce-api/
├── .env.example
├── .gitignore
├── package.json
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   │   ├── index.js
│   │   ├── database.js
│   │   ├── swagger.js
│   │   └── socket.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── Notification.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── reviewController.js
│   │   └── notificationController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   └── notificationRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validate.js
│   │   ├── upload.js
│   │   ├── security.js
│   │   └── errorHandler.js
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── productValidator.js
│   │   └── orderValidator.js
│   └── utils/
│       ├── apiResponse.js
│       ├── apiError.js
│       ├── pagination.js
│       ├── notify.js
│       └── constants.js
├── uploads/
├── docs/
│   └── postman/
│       ├── collection.json
│       └── environment-dev.json
└── .github/
    └── workflows/
        └── ci.yml
```

> **Expected Output:**
> Ek complete, production-ready API project — authentication, CRUD, pagination, WebSocket, file upload, validation, documentation, security — sab kuch!

---

## Quick Revision

| Task | Kya Kiya |
|---|---|
| Manual Testing | Checklist follow karke har endpoint test |
| Postman Collection | Organized with auto-token scripts |
| Code Cleanup | Console.log hatao, constants extract |
| Git Best Practices | Meaningful commits, branch strategy |
| Documentation | README, .env.example, Swagger |
| Final Structure | Clean MVC folder organization |

---

## Aaj Kya Seekha?

1. Systematic manual testing — happy + sad paths
2. Postman collection with auto-save scripts
3. Code cleanup — constants, unused code removal
4. Git best practices — commit message format
5. Project documentation — README, .env.example
6. Complete project structure — production-ready
