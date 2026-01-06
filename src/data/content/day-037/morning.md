# Day 37 - Morning Session: Week 6 Revision (REVISION DAY)

> **Aaj ka plan:**
> Aaj pura Week 6 revise karenge — Express.js, REST API Design, Mongoose CRUD, SQL in Node.js, aur Database Design. Common mistakes, best practices, aur ek complete checklist taaki tumhara foundation pakka ho!

---

## Week 6 Recap — Kya Kya Seekha?

| Day | Topic | Key Takeaway |
|-----|-------|-------------|
| Day 31 | Express.js Introduction | Express se fast, clean web servers bante hain |
| Day 32 | Routing & Middleware | Router modules + middleware chain = organized code |
| Day 33 | REST API Design | Resources, HTTP methods, status codes, URL conventions |
| Day 34 | CRUD with Mongoose | Schema → Model → create/find/update/delete |
| Day 35 | CRUD with SQL | Connection pool, parameterized queries, SQL injection prevention |
| Day 36 | Database Design | ER diagrams, normalization, relationships, indexing |

---

## Express.js Revision

### App Setup Pattern
```javascript
// Har Express app ka basic structure
const express = require('express');
const app = express();

// 1. Middleware lagao
app.use(express.json());          // JSON body parse
app.use(express.static('public')); // Static files

// 2. Routes mount karo
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// 3. 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 4. Error handler (4 params!)
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// 5. Server start
app.listen(3000);
```

### Middleware Chain — Order Yaad Rakho!
```
Request aaya
  ↓
[1] express.json()         → Body parse karo
  ↓
[2] Logger middleware       → Request log karo
  ↓
[3] Auth middleware         → Token check karo
  ↓
[4] Route handler          → Actual kaam karo
  ↓
[5] Error handler          → Agar error aaya toh
  ↓
Response gaya
```

> **Yaad Rakho:**
> - Middleware **upar se neeche** chalta hai
> - `next()` call karna zaroori hai (warna request stuck)
> - Error handler mein **4 parameters** hone chahiye: `(err, req, res, next)`
> - `app.use()` = sabhi routes pe, specific route pe = route mein dalo

---

## REST API Design Revision

### Golden Rules

```
✅ SAHI (RESTful):
GET    /api/v1/users          → List users
GET    /api/v1/users/5        → Get user #5
POST   /api/v1/users          → Create user
PUT    /api/v1/users/5        → Update user #5
DELETE /api/v1/users/5        → Delete user #5

❌ GALAT:
GET    /api/getUsers           → Verb URL mein!
POST   /api/createUser         → HTTP method hi verb hai
GET    /api/user               → Singular!
DELETE /api/deleteUser/5       → Redundant verb
```

### Status Code Quick Reference

```
2xx — SUCCESS
  200 OK            → GET, PUT successful
  201 Created       → POST successful
  204 No Content    → DELETE successful (no body)

4xx — CLIENT ERROR
  400 Bad Request   → Validation fail, wrong data
  401 Unauthorized  → Token missing / invalid
  403 Forbidden     → Token valid but no permission
  404 Not Found     → Resource doesn't exist
  409 Conflict      → Duplicate (email already exists)

5xx — SERVER ERROR
  500 Internal Error → Bug in code
  503 Unavailable   → Server down / maintenance
```

### Response Format — Consistent Rakhlo!

```javascript
// SUCCESS format
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

// ERROR format
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Kya galat hua",
    "details": ["Field-level errors"]
  }
}
```

---

## Mongoose (MongoDB) Revision

### Schema → Model → CRUD

```javascript
// 1. SCHEMA — blueprint
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, min: 0 },
  category: { type: String, enum: ['grain', 'vegetable'] },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// 2. MODEL — interface
const Product = mongoose.model('Product', productSchema);

// 3. CRUD operations
await Product.create(data);                              // CREATE
await Product.find({ category: 'grain' });               // READ all
await Product.findById(id);                              // READ one
await Product.findByIdAndUpdate(id, data, { new: true }); // UPDATE
await Product.findByIdAndDelete(id);                      // DELETE
await Product.find().populate('seller', 'name email');   // Relations
```

### Common Mongoose Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `findByIdAndUpdate` bina `new: true` | Purana document milega | `{ new: true }` add karo |
| `findByIdAndUpdate` bina `runValidators` | Validation skip hogi | `{ runValidators: true }` |
| Schema mein `required` bhool gaye | Bad data database mein | Required fields mark karo |
| `populate` mein saare fields | Extra data transfer | Select specific fields |
| `.connect()` bina error handling | App crash if DB down | try/catch lagao |

---

## SQL in Node.js Revision

### Connection Pool Pattern

```javascript
const mysql = require('mysql2/promise'); // /promise zaroori!

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});
```

### Parameterized Queries — MUST USE!

```javascript
// ✅ SAFE — hamesha ? use karo
const [rows] = await pool.query(
  'SELECT * FROM products WHERE category = ? AND price >= ?',
  [category, minPrice]
);

// ❌ DANGER — kabhi nahi karo!
const query = `SELECT * FROM products WHERE name = '${userInput}'`;
// SQL Injection ka raasta khul jaata hai!
```

### SQL vs Mongoose Quick Comparison

| Operation | Mongoose | SQL |
|-----------|----------|-----|
| All items | `Model.find()` | `SELECT * FROM table` |
| Filter | `Model.find({ key: val })` | `WHERE key = ?` |
| Sort | `.sort({ price: 1 })` | `ORDER BY price ASC` |
| Paginate | `.skip(10).limit(5)` | `LIMIT 5 OFFSET 10` |
| Count | `Model.countDocuments()` | `SELECT COUNT(*)` |
| Join | `.populate()` | `JOIN ... ON` |

---

## Database Design Revision

### Relationships Quick Reference

```
ONE-TO-ONE:    User ↔ Profile
               FK + UNIQUE constraint in child table
               MongoDB: embed ya reference

ONE-TO-MANY:   User → Orders (ek user, bahut orders)
               FK in child table (orders.user_id)
               MongoDB: reference (ObjectId)

MANY-TO-MANY:  Orders ↔ Products
               Junction table (order_items)
               MongoDB: array of ObjectIds
```

### Normalization Checklist

```
□ 1NF: Kya har cell mein ek hi value hai? (no arrays in cells)
□ 2NF: Kya non-key columns poori PK pe depend karti hain?
□ 3NF: Kya non-key columns doosri non-key pe depend NAHI karti?
```

### When to Embed vs Reference (MongoDB)

```
EMBED karo jab:
  ✅ Data hamesha saath dikhta hai (order + items)
  ✅ Data chhota hai (< few hundred items)
  ✅ Data rarely update hota hai independently

REFERENCE karo jab:
  ✅ Data independently access hota hai (users)
  ✅ Data bahut bada ho sakta hai
  ✅ Data frequently update hota hai
  ✅ Same data multiple jagah use hota hai
```

---

## Common API Mistakes — Avoid Karo!

### Mistake 1: Async/Await bhool jaana

```javascript
// ❌ GALAT — await bhool gaye!
router.get('/', (req, res) => {          // async missing!
  const products = Product.find();        // await missing!
  res.json({ data: products });           // Promise milega, data nahi!
});

// ✅ SAHI
router.get('/', async (req, res) => {     // async lagao
  const products = await Product.find();  // await lagao
  res.json({ data: products });           // Ab sahi data milega
});
```

### Mistake 2: Error handling bhool jaana

```javascript
// ❌ GALAT — agar DB down hai toh app crash!
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});

// ✅ SAHI — try/catch lagao
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

### Mistake 3: Response double bhej dena

```javascript
// ❌ GALAT — Error: Cannot set headers after they are sent
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Not found' });
    // return BHOOL GAYE! Neeche wala code bhi chalega!
  }
  res.json(product); // Yeh bhi chalega — ERROR!
});

// ��� SAHI — return lagao!
if (!product) {
  return res.status(404).json({ error: 'Not found' });
}
```

### Mistake 4: .env mein secrets, commit mein push

```bash
# .gitignore mein ZAROORI add karo:
node_modules/
.env
```

---

## Best Practices Checklist

```
EXPRESS:
□ express.json() sabse pehle
□ Routes alag files mein (routes/ folder)
□ Middleware alag files mein (middleware/ folder)
□ Error handler 4 params ke saath, sabse last
□ 404 catch-all routes ke baad

REST API:
□ Plural nouns for resources (/users, /products)
□ Proper HTTP methods (GET, POST, PUT, DELETE)
□ Correct status codes (201 create, 404 not found)
□ Consistent response format ({ success, data/error })
□ API versioning (/api/v1/)

DATABASE:
□ Environment variables for credentials (.env)
□ Connection pool (not individual connections)
□ Parameterized queries (SQL injection prevention)
□ Schema validation (Mongoose) / constraints (SQL)
□ Indexes on frequently searched columns
□ Foreign keys for relationships

CODE:
□ async/await with try/catch
□ return after sending error response
□ Input validation before database operations
□ Proper .gitignore (node_modules, .env)
```

---

## Quick Revision Table

| Topic | Key Point | Remember |
|-------|-----------|----------|
| Express | Middleware chain | Order matters! Parse → Log → Routes → Error |
| Router | Organize routes | `app.use('/api/users', userRoutes)` |
| REST | Resource-based URLs | Plural nouns, no verbs, proper methods |
| Status Codes | 2xx/4xx/5xx | 200 OK, 201 Created, 404 Not Found |
| Mongoose | Schema → Model → CRUD | `{ new: true, runValidators: true }` |
| SQL | Parameterized queries | Always use `?` — never template literals |
| DB Design | ER → Normalize → Index | 1:N = FK in child, N:M = junction table |
| Security | No secrets in code | `.env` + `.gitignore` |

---

## Aaj Kya Seekha?

1. **Express** ka middleware chain aur order bahut important hai
2. **REST API** mein resources, HTTP methods, aur status codes sahi use karo
3. **Mongoose** mein `new: true` aur `runValidators` bhoolna common mistake hai
4. **SQL** mein **hamesha** parameterized queries (`?`) use karo — security first
5. **Database design** pehle karo, code baad mein — ER diagram banakar sochna asaan hai
6. **Error handling** (try/catch) aur **return** keyword bhoolna = bugs
7. **Checklist follow** karo har project mein — professional code likho

> **Practice Time!**
> Evening mein "Kisan Market API" mini project banayenge — saara knowledge ek project mein! Ready raho!
