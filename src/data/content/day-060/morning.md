# Day 60 - Morning: Phase 2 Complete Review (REVISION DAY)

> **Aaj ka plan:**
> Phase 2 complete review! Express, REST API, Auth, Validation, Pagination, File Upload, WebSocket, MQTT, DB Design — sab kuch ek jagah revise karenge. Phase 3 ka preview bhi milega.

---

## Phase 2 Journey — Kya Kya Seekha?

> **Socho Aise:**
> Socho tum ek building bana rahe ho. Phase 1 mein foundation seekha (JavaScript, Node.js basics). Phase 2 mein poori building khadi ki — walls, rooms, doors, electricity, plumbing sab. Ab tum ek complete backend developer ho!

```
Phase 2 Modules:
├── Express.js Fundamentals
├── REST API Design
├── MongoDB + Mongoose
├── Authentication (JWT, Roles)
├── Input Validation (Joi)
├── Pagination, Filter, Search, Sort
├── File Upload (Multer)
├── WebSocket (Socket.io)
├── MQTT (IoT Protocol)
├── DSA (Stacks, Queues, LinkedList, Trees, Graphs)
├── Git Team Workflow
├── Security (Helmet, CORS, Rate Limiting)
├── API Documentation (Swagger)
└── Phase 2 Project (E-Commerce API)
```

---

## Module 1: Express.js Revision

```javascript
// Express app ka skeleton
const express = require("express");
const app = express();

// Middleware chain
app.use(express.json());        // Body parse
app.use(helmet());              // Security headers
app.use(cors());                // Cross-origin
app.use(rateLimit({ max: 100 })); // Rate limit

// Route
app.get("/api/users", authenticate, getUsers);

// Error handler (sabse last)
app.use(errorHandler);

app.listen(3000);
```

**Key Concepts:**
- Middleware chain — request top se bottom flow hoti hai
- `app.use()` = har request pe chale
- `app.get/post/put/delete()` = specific method + path
- Error middleware — 4 parameters `(err, req, res, next)`

---

## Module 2: REST API Design Revision

| HTTP Method | Use | Example |
|---|---|---|
| GET | Data lao | GET /api/products |
| POST | Naya banao | POST /api/products |
| PUT | Poora update | PUT /api/products/:id |
| PATCH | Partial update | PATCH /api/products/:id |
| DELETE | Hatao | DELETE /api/products/:id |

**REST Rules:**
- URLs mein nouns use karo (products, users), verbs nahi
- Plural nouns (/api/products not /api/product)
- HTTP status codes sahi use karo (200, 201, 400, 401, 403, 404, 500)
- Consistent response format `{ success, message, data }`

---

## Module 3: MongoDB + Mongoose Revision

```javascript
// Schema define karo
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, min: 0 },
  seller: { type: ObjectId, ref: "User" },  // relationship
}, { timestamps: true });

// CRUD operations
await Product.create(data);           // Create
await Product.find(query);            // Read (many)
await Product.findById(id);           // Read (one)
await Product.findByIdAndUpdate(id, data); // Update
await Product.findByIdAndDelete(id);  // Delete

// Population (join)
await Product.find().populate("seller", "name email");

// Indexes
productSchema.index({ name: "text" }); // text search
productSchema.index({ category: 1 });  // filter performance
```

> **Yaad Rakho:**
> Mongoose = MongoDB ka ODM. Schema = data ka structure define karo. Population = SQL ke JOIN jaisa. Indexes = queries fast karo.

---

## Module 4: Authentication Revision

```javascript
// Register flow
password --> bcrypt.hash(password, 12) --> save to DB

// Login flow
compare(inputPassword, hashedPassword) --> jwt.sign({ id, role }) --> send token

// Protected route flow
Request --> Extract token --> jwt.verify(token) --> Find user --> req.user = user

// Role authorization
if (!allowedRoles.includes(req.user.role)) --> 403 Forbidden
```

**Key Points:**
- Passwords hamesha hash karke store karo (bcrypt, salt rounds 12)
- JWT token mein sensitive data mat daalo (sirf id, role)
- Token expiry set karo (7d recommended)
- `select: false` password pe lagao

---

## Module 5: Validation Revision (Joi)

```javascript
const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(100),
  role: Joi.string().valid("customer", "seller"),
});

// Middleware pattern
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ errors: error.details });
  req.body = value; // sanitized data
  next();
};
```

> **Tip:**
> Validate at the gate — route handler se pehle. `abortEarly: false` se saari errors ek saath dikhao. `stripUnknown: true` se unwanted fields hata do.

---

## Module 6: Pagination + Filter + Search + Sort

```javascript
// Query building pattern
const query = { isActive: true };
if (category) query.category = category;
if (search) query.$text = { $search: search };
if (minPrice) query.price = { $gte: minPrice };

const data = await Product.find(query)
  .sort(sort || "-createdAt")
  .skip((page - 1) * limit)
  .limit(limit)
  .populate("seller", "name");

const total = await Product.countDocuments(query);
const totalPages = Math.ceil(total / limit);
```

---

## Module 7: File Upload Revision (Multer)

```javascript
const multer = require("multer");

const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  fileFilter: (req, file, cb) => {
    // Sirf images allow
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images!"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Route mein use
router.post("/upload", authenticate, upload.single("image"), handler);
router.post("/upload-many", authenticate, upload.array("images", 5), handler);
```

---

## Module 8: WebSocket Revision (Socket.io)

```javascript
// Server side
const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  socket.join(`user_${userId}`);       // Room join
  socket.emit("welcome", "Connected!"); // Client ko bhejo
  socket.on("message", (data) => { }); // Client se suno
});

// Kisi bhi controller se emit
const io = getIO();
io.to(`user_${userId}`).emit("notification", data); // Specific user
io.to("sellers").emit("new_order", data);            // Room broadcast
io.emit("announcement", data);                       // Sab ko
```

---

## Module 9: Security Revision

```javascript
app.use(helmet());              // Security headers
app.use(cors({ origin: [...] })); // Specific origins
app.use(rateLimit({ max: 100 })); // Request limit
app.use(express.json({ limit: "10kb" })); // Body size limit

// Cookie security
{ httpOnly: true, secure: true, sameSite: "strict" }

// Common attacks prevention:
// XSS --> sanitize input, httpOnly cookies
// CSRF --> sameSite cookies, CSRF tokens
// Injection --> Mongoose (no raw queries), Joi validation
// Brute Force --> Rate limiting on auth routes
```

---

## Module 10: DSA Revision

| Data Structure | Key Operations | Use Case |
|---|---|---|
| Stack | push, pop, peek | Undo history, bracket matching |
| Queue | enqueue, dequeue | Task processing, BFS |
| Linked List | insert, delete, reverse | Message queue, LRU cache |
| BST | insert, search, delete | Sorted data, search |
| Graph | addVertex, addEdge, BFS, DFS | Social networks, routes |

```javascript
// Interview favorites:
// 1. Reverse Linked List — 3 pointers
// 2. BST Inorder — sorted output
// 3. BFS shortest path — queue + visited
// 4. Stack bracket matching — push/pop
```

---

## Module 11: Git & API Docs Revision

```bash
# Git Workflow
git checkout -b feature/xyz    # Branch
git add . && git commit -m "feat: description"  # Commit
git push origin feature/xyz    # Push
gh pr create                   # PR banao
gh pr merge --squash           # Squash merge
```

```javascript
// Swagger annotation pattern
/**
 * @swagger
 * /api/resource:
 *   get:
 *     summary: Description
 *     tags: [Tag]
 *     parameters: [...]
 *     responses:
 *       200:
 *         description: Success
 */
```

---

## Phase 2 Scorecard — Self Assessment

Rate yourself (1-5) on each:

| Skill | Rating (1-5) |
|---|---|
| Express.js middleware & routing | ___ |
| REST API design principles | ___ |
| MongoDB CRUD + Mongoose | ___ |
| JWT Authentication + Role-based auth | ___ |
| Input validation (Joi) | ___ |
| Pagination, Filter, Search, Sort | ___ |
| File Upload (Multer) | ___ |
| WebSocket real-time features | ___ |
| Security (Helmet, CORS, Rate Limit) | ___ |
| Git team workflow (PR, review) | ___ |
| API Documentation (Swagger) | ___ |
| DSA basics (Stack, Queue, LL, Tree, Graph) | ___ |
| Error handling patterns | ___ |

> **Yaad Rakho:**
> Agar kisi topic mein 3 se kam rating hai toh woh topic dubara revise karo. Phase 3 mein hum advanced topics karenge — strong foundation zaroori hai.

---

## Quick Revision

| Phase 2 Topic | One-Line Summary |
|---|---|
| Express | Middleware chain + Route handlers |
| REST API | HTTP methods + Status codes + JSON |
| MongoDB | Document DB, Mongoose ODM, Population |
| Auth | bcrypt + JWT + Role middleware |
| Validation | Joi schemas + validate middleware |
| Pagination | skip/limit + countDocuments |
| File Upload | Multer storage + fileFilter |
| WebSocket | Socket.io rooms + events |
| Security | Helmet + CORS + Rate Limit |
| DSA | Stack, Queue, LL, BST, Graph |
| Git | Feature branch + PR + Squash merge |
| Swagger | @swagger annotations + UI |

---

## Aaj Kya Seekha?

1. Phase 2 ka poora syllabus ek jagah revise kiya
2. 12+ modules cover kiye — Express se Swagger tak
3. Key patterns yaad kiye — middleware chain, validation gate, MVC
4. Self assessment kiya — weak areas identify kiye
5. Ab tum ek capable backend developer ho!
6. Phase 3 mein system design, Docker, AWS seekhenge
