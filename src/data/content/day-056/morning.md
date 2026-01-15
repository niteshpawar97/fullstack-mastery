# Day 56 - Morning: API Documentation — Swagger + Postman

> **Aaj ka plan:**
> Aaj seekhenge API documentation kyun zaroori hai, Swagger/OpenAPI kya hai, swagger-jsdoc se docs kaise generate karein, aur Postman collections kaise banayein. Good docs = happy developers.

---

## API Documentation Kyun Zaroori Hai?

> **Socho Aise:**
> Tum ek restaurant chalaate ho. Menu card nahi hai. Customer aaye aur bole "kya kya milta hai?" — tum har baar explain karoge? Nahi! Menu card bana do. API docs tumhare API ka menu card hai.

### Bina Docs Ke Problems:
- Frontend developer ko har API samjhane mein time lagta hai
- New team member ko onboard karna mushkil
- Bugs aate hain kyunki galat parameters bheje
- Customer/client ko API use karna mushkil lagta hai

### Docs Se Fayde:
- Self-service — developer khud padh ke samajh jaaye
- Testing easy — Swagger UI se seedha test kar sakte hain
- Consistency — sab ek standard format mein
- Auto-generation — code se docs ban jaayein

---

## Swagger / OpenAPI Specification

**OpenAPI** ek standard hai API describe karne ka. **Swagger** tools ka collection hai jo OpenAPI spec use karta hai.

### OpenAPI Spec Structure

```yaml
openapi: 3.0.0
info:
  title: Farmer App API
  version: 1.0.0
  description: API for managing farmer orders and products

servers:
  - url: http://localhost:3000/api
    description: Development server

paths:
  /users:
    get:
      summary: Get all users
      responses:
        200:
          description: List of users
    post:
      summary: Create new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                email:
                  type: string
```

> **Yaad Rakho:**
> OpenAPI spec ek JSON/YAML file hai jo batati hai: kaunse endpoints hain, kya request body chahiye, kya response aayega, authentication kaise hai. Swagger UI is spec ko interactive documentation mein convert karta hai.

---

## Swagger Setup in Express

### Step 1: Packages Install

```bash
npm install swagger-jsdoc swagger-ui-express
```

### Step 2: Swagger Config

```javascript
// config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "Complete E-Commerce REST API with authentication",
      contact: {
        name: "API Support",
        email: "support@myapp.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development Server",
      },
      {
        url: "https://api.myapp.com",
        description: "Production Server",
      },
    ],
    // Authentication define karo
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token daalo — Login se milega",
        },
      },
    },
  },
  // Kahan annotations dhundhni hain
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  // Swagger UI route
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "E-Commerce API Docs",
  }));

  // Raw JSON spec (Postman import ke liye)
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("Swagger docs available at /api-docs");
};

module.exports = setupSwagger;
```

### Step 3: App mein use karo

```javascript
// app.js
const setupSwagger = require("./config/swagger");

const app = express();
// ... middleware ...

// Swagger docs setup
setupSwagger(app);

// ... routes ...
```

> **Terminal Command:**
> ```bash
> npm start
> # Browser mein jaao: http://localhost:3000/api-docs
> ```

---

## @swagger Annotations Likhna

### GET Endpoint

```javascript
// routes/userRoutes.js

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Saare users ki list lao
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Users ki list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized — token nahi hai
 */
router.get("/", authMiddleware, getUsers);
```

### POST Endpoint

```javascript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Naya user register karo
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ramesh Kumar"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ramesh@farmer.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "secure123"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post("/", createUser);
```

### Schema Definition

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a1b2c3d4e5f6g7h8i9j0"
 *         name:
 *           type: string
 *           example: "Ramesh Kumar"
 *         email:
 *           type: string
 *           example: "ramesh@farmer.com"
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: "user"
 *         createdAt:
 *           type: string
 *           format: date-time
 */
```

> **Tip:**
> Schemas alag define karo aur `$ref` se reference do. Isse duplicate nahi hoga. `example` field zaroor dalo — Swagger UI mein dikhta hai aur developer ko samajh aata hai.

---

## Postman Collections

### Postman Kya Hai?

Postman ek tool hai API test karne ka. Collections = organized group of API requests.

### Collection Structure

```
E-Commerce API/
├── Auth/
│   ├── Register
│   ├── Login
│   └── Get Profile
├── Users/
│   ├── Get All Users
│   ├── Get User by ID
│   ├── Update User
│   └── Delete User
├── Products/
│   ├── Get All Products
│   ├── Create Product
│   ├── Update Product
│   └── Delete Product
└── Orders/
    ├── Create Order
    ├── Get My Orders
    └── Update Order Status
```

### Postman Environments

```json
// Development Environment
{
  "name": "Development",
  "values": [
    { "key": "base_url", "value": "http://localhost:3000" },
    { "key": "token", "value": "" }
  ]
}

// Production Environment
{
  "name": "Production",
  "values": [
    { "key": "base_url", "value": "https://api.myapp.com" },
    { "key": "token", "value": "" }
  ]
}
```

> **Socho Aise:**
> Environment = preset values. Jab development test karna hai toh Dev environment select karo, production test karna hai toh Prod. `{{base_url}}/api/users` likhte ho — environment ke hisaab se URL change ho jaata hai.

### Auto-save Token (Postman Script)

```javascript
// Login request ke Tests tab mein likho
// Yeh auto token save karega
const response = pm.response.json();
if (response.token) {
  pm.environment.set("token", response.token);
  console.log("Token saved successfully!");
}
```

---

## Auto-Generating Docs

### Swagger se Postman Collection

```bash
# Swagger JSON se Postman collection generate karo
# Browser mein jaao: http://localhost:3000/api-docs.json
# Copy karo JSON

# Postman mein:
# Import --> Raw Text --> Paste JSON --> Import
# Auto collection ban jaayegi!
```

### Or use swagger2postman tool

```bash
npx swagger2openapi http://localhost:3000/api-docs.json -o api-spec.json
# Postman mein import karo
```

> **Yaad Rakho:**
> Swagger docs likhne ka fayda — Postman collection auto-generate ho jaati hai. Double kaam nahi karna padta. Ek jagah docs likho, dono jagah use karo.

---

## Quick Revision

| Concept | Key Point |
|---|---|
| OpenAPI | API describe karne ka standard format |
| Swagger UI | Interactive API documentation |
| swagger-jsdoc | JSDoc comments se spec generate |
| swagger-ui-express | Express mein Swagger UI serve |
| @swagger | Route ke upar annotation likho |
| $ref | Schema reference — duplicate avoid |
| Postman Collection | Organized API request groups |
| Postman Environment | Variable presets (dev/prod) |
| Auto-generate | Swagger JSON --> Postman import |

---

## Aaj Kya Seekha?

1. API documentation kyun zaroori hai — menu card analogy
2. OpenAPI/Swagger spec kya hai aur kaise kaam karta hai
3. swagger-jsdoc + swagger-ui-express setup kiya
4. @swagger annotations likha — GET, POST, schemas
5. Postman collections aur environments samjhe
6. Auto-generation — Swagger se Postman collection banai
