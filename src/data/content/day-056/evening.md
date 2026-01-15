# Day 56 - Evening: Practice — Swagger Docs + Postman Collection

> **Aaj ka plan:**
> Hands-on time! Existing API mein Swagger docs add karenge, complete annotations likhenge, Postman collection banayenge, aur documentation export karenge.

---

## Task 1: Swagger Setup Karo

> **Practice Time!**
> Apne Express API mein Swagger UI lagao.

### Step 1: Install Packages

```bash
npm install swagger-jsdoc swagger-ui-express
```

### Step 2: Swagger Config File

```javascript
// config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Farmer E-Commerce API",
      version: "1.0.0",
      description: "Complete REST API — Users, Products, Orders, Reviews",
      license: {
        name: "MIT",
      },
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {}, // route files mein define karenge
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User management" },
      { name: "Products", description: "Product CRUD" },
      { name: "Orders", description: "Order management" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Farmer E-Commerce API Docs",
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 20px }
    `,
    swaggerOptions: {
      persistAuthorization: true, // token reload pe bhi rahe
    },
  }));

  // JSON spec endpoint
  app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
  });
};

module.exports = setupSwagger;
```

### Step 3: App.js mein Lagao

```javascript
// app.js mein add karo
const setupSwagger = require("./config/swagger");

// Routes se pehle
setupSwagger(app);
```

> **Terminal Command:**
> ```bash
> npm start
> # Browser: http://localhost:3000/api-docs
> ```

---

## Task 2: Auth Routes Ke Annotations

```javascript
// routes/authRoutes.js
const express = require("express");
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *           example: "Ramesh Kumar"
 *         email:
 *           type: string
 *           format: email
 *           example: "ramesh@farmer.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "secure123"
 *         phone:
 *           type: string
 *           example: "9876543210"
 *
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           example: "ramesh@farmer.com"
 *         password:
 *           type: string
 *           example: "secure123"
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIs..."
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Naya user register karo
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error — name/email/password missing
 *       409:
 *         description: Email already registered
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login karo aur JWT token lo
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Current logged-in user ki profile lao
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not authenticated
 */
router.get("/me", authMiddleware, getMe);

module.exports = router;
```

---

## Task 3: Product Routes Ke Annotations

```javascript
// routes/productRoutes.js

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: "Organic Urea"
 *         description:
 *           type: string
 *           example: "High quality organic urea fertilizer"
 *         price:
 *           type: number
 *           example: 450
 *         category:
 *           type: string
 *           example: "fertilizer"
 *         stock:
 *           type: integer
 *           example: 100
 *         image:
 *           type: string
 *           example: "/uploads/urea.jpg"
 *
 *     ProductInput:
 *       type: object
 *       required: [name, price, category]
 *       properties:
 *         name:
 *           type: string
 *           example: "Organic Urea"
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           example: 450
 *         category:
 *           type: string
 *           enum: [fertilizer, seeds, pesticide, equipment]
 *         stock:
 *           type: integer
 *           example: 100
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Saare products lao (pagination + filter)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Products per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [fertilizer, seeds, pesticide, equipment]
 *         description: Category se filter karo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Name mein search karo
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *         description: Sort field (e.g., price, -price, name)
 *     responses:
 *       200:
 *         description: Products ki list with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get("/", getProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Naya product add karo (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin access required
 */
router.post("/", authMiddleware, adminOnly, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Ek product ki detail lao
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product detail
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Product update karo (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.put("/:id", authMiddleware, adminOnly, updateProduct);
```

> **Yaad Rakho:**
> Har route ke upar `@swagger` annotation likho. `tags` se endpoints group hote hain. `security: bearerAuth` se lock icon aata hai — Swagger UI mein token daal ke test kar sakte ho.

---

## Task 4: Postman Collection Banao

> **Practice Time!**
> Postman mein organized collection banao.

### Step 1: Collection Structure

```
Farmer E-Commerce API
│
├── Auth
│   ├── POST Register      {{base_url}}/api/auth/register
│   ├── POST Login          {{base_url}}/api/auth/login
│   └── GET My Profile      {{base_url}}/api/auth/me
│
├── Products
│   ├── GET All Products    {{base_url}}/api/products?page=1&limit=10
│   ├── GET Product by ID   {{base_url}}/api/products/{{product_id}}
│   ├── POST Create Product {{base_url}}/api/products
│   ├── PUT Update Product  {{base_url}}/api/products/{{product_id}}
│   └── DEL Delete Product  {{base_url}}/api/products/{{product_id}}
│
└── Orders
    ├── POST Create Order   {{base_url}}/api/orders
    ├── GET My Orders       {{base_url}}/api/orders/my
    └── PUT Update Status   {{base_url}}/api/orders/{{order_id}}/status
```

### Step 2: Postman Environment

```json
{
  "name": "Development",
  "values": [
    { "key": "base_url", "value": "http://localhost:3000", "enabled": true },
    { "key": "token", "value": "", "enabled": true },
    { "key": "product_id", "value": "", "enabled": true },
    { "key": "order_id", "value": "", "enabled": true }
  ]
}
```

### Step 3: Auto Token Save Script

```javascript
// Login request ke "Tests" tab mein:
const response = pm.response.json();

if (response.success && response.token) {
  pm.environment.set("token", response.token);
  console.log("Token saved to environment!");

  // User ID bhi save karo
  if (response.user && response.user.id) {
    pm.environment.set("user_id", response.user.id);
  }
}

// Status check
pm.test("Login successful", function () {
  pm.response.to.have.status(200);
  pm.expect(response.success).to.be.true;
  pm.expect(response.token).to.be.a("string");
});
```

### Step 4: Auth Header Auto-Set

```
// Collection level pe Authorization set karo:
// Type: Bearer Token
// Token: {{token}}
// Yeh saare requests mein auto apply hoga
```

> **Tip:**
> Collection level pe Authorization set karo, toh har request mein manually token nahi dalna padega. Login ke baad auto save hoga, baaki sab requests mein auto use hoga.

---

## Task 5: Swagger se Postman Import

```bash
# Step 1: Swagger JSON download karo
curl http://localhost:3000/api-docs.json -o api-spec.json

# Step 2: Postman mein Import
# Postman --> Import --> File --> api-spec.json
# Auto collection ban jaayegi!
```

> **Expected Output:**
> Postman mein automatically collection ban jaayegi — saare endpoints, request bodies, parameters sab set honge. Bas environment variables add karo aur test karo.

---

## Task 6: Documentation Export & Share

```bash
# Postman Collection export karo
# Collection --> ... --> Export --> Collection v2.1 --> Save

# Team ke saath share karo
# Option 1: JSON file git mein daalo (postman/ folder mein)
# Option 2: Postman workspace share karo
# Option 3: Public documentation link generate karo
```

### Project Structure

```
project/
├── docs/
│   ├── postman/
│   │   ├── collection.json      # Postman collection
│   │   └── environment-dev.json # Dev environment
│   └── api-spec.json            # OpenAPI spec
├── src/
│   ├── routes/        # @swagger annotations yahan
│   └── config/
│       └── swagger.js # Swagger setup
└── .env.example
```

> **Yaad Rakho:**
> Documentation code ka hissa hai. Postman collection aur .env.example git mein rakho. Jab naya developer join kare, usse clone karne ke baad seedha API test karne mein aasaani ho.

---

## Quick Revision

| Task | Kya Kiya |
|---|---|
| Swagger Setup | swagger-jsdoc + swagger-ui-express |
| Auth Docs | Register, Login, Profile annotations |
| Product Docs | CRUD with pagination, filter, auth |
| Schemas | $ref se reusable schemas |
| Postman Collection | Organized folders, auto-token |
| Environment | Variables (base_url, token) |
| Import | Swagger JSON --> Postman auto-import |
| Share | Export collection + environment |

---

## Aaj Kya Seekha?

1. Swagger setup kiya — swagger-jsdoc + swagger-ui-express
2. Complete annotations likhe — Auth, Products, Orders
3. Reusable schemas banaye — $ref pattern
4. Postman collection banaya — organized folders
5. Auto token save kiya — Test scripts mein
6. Documentation export aur sharing seekhi
