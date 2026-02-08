# Day 76 — Testing: API Tests + Integration (Morning Session)

> **Aaj ka plan:**
> Aaj hum seekhenge ki apne Express API endpoints ko kaise test karte hain Supertest se. Auth routes, CRUD operations, validation errors — sab ka testing karenge. Real world mein bina API tests ke deploy karna bahut risky hai!

---

## API Testing Kyu Zaroori Hai?

Kal humne unit tests sikhe — individual functions test kiye. Par socho, tumhara `add()` function sahi kaam karta hai, par jab API `/api/items` pe POST request aati hai toh 500 error aata hai. Kyun? Kyunki route, middleware, controller — sab milke kaam karte hain.

> **Socho Aise:**
> Unit test ek ek brick check karta hai. Integration/API test poori deewar check karta hai — ki bricks sahi se judi hain ya nahi.

---

## Supertest — HTTP Testing Library

Supertest ek library hai jo bina server start kiye API requests bhejti hai. Express app ko directly test karta hai.

> **Terminal Command:**
> ```bash
> npm install --save-dev supertest
> ```

### App ko Export Karo (Important!)

```javascript
// app.js — Express app ko export karo (server.listen alag file mein)
const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

module.exports = app;  // <-- yeh zaroori hai testing ke liye
```

```javascript
// server.js — sirf yahan listen karo
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

> **Yaad Rakho:**
> App aur server ko alag files mein rakho. Testing mein hum sirf `app` import karte hain — server start nahi karte. Supertest khud handle karta hai.

---

## Pehla API Test — GET Endpoint

```javascript
// routes/productRoutes.js
const express = require('express');
const router = express.Router();

let products = [
  { id: 1, name: 'Gehun', price: 2500, category: 'grain' },
  { id: 2, name: 'Chawal', price: 3000, category: 'grain' },
];

// GET all products
router.get('/', (req, res) => {
  res.status(200).json({ success: true, data: products });
});

// GET single product
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.status(200).json({ success: true, data: product });
});

module.exports = router;
```

```javascript
// tests/product.test.js
const request = require('supertest');
const app = require('../app');

describe('Product API Endpoints', () => {

  // --- GET /api/products ---
  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(200);                // status 200 aana chahiye
      expect(res.body.success).toBe(true);              // success: true
      expect(res.body.data).toBeInstanceOf(Array);      // data array hona chahiye
      expect(res.body.data.length).toBeGreaterThan(0);  // kuch products hone chahiye
    });
  });

  // --- GET /api/products/:id ---
  describe('GET /api/products/:id', () => {
    it('should return single product by ID', async () => {
      const res = await request(app).get('/api/products/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Gehun');   // ID 1 = Gehun
      expect(res.body.data.price).toBe(2500);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/999');

      expect(res.statusCode).toBe(404);                        // not found
      expect(res.body.message).toBe('Product not found');
    });
  });
});
```

> **Terminal Command:**
> ```bash
> npx jest tests/product.test.js --verbose
> ```

---

## POST Endpoint Testing

```javascript
// POST route (productRoutes.js mein add karo)
router.post('/', (req, res) => {
  const { name, price, category } = req.body;

  // Validation
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ success: false, message: 'Price must be a positive number' });
  }

  const newProduct = { id: products.length + 1, name, price, category };
  products.push(newProduct);
  res.status(201).json({ success: true, data: newProduct });
});
```

```javascript
// POST tests
describe('POST /api/products', () => {
  it('should create a new product', async () => {
    const newProduct = { name: 'Dal', price: 120, category: 'pulses' };

    const res = await request(app)
      .post('/api/products')
      .send(newProduct)                   // body bhejo
      .set('Content-Type', 'application/json');  // header set karo

    expect(res.statusCode).toBe(201);           // 201 Created
    expect(res.body.data.name).toBe('Dal');
    expect(res.body.data).toHaveProperty('id');  // id auto-generate hona chahiye
  });

  it('should return 400 if name is missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ price: 100 });            // name nahi bheja

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Name and price are required');
  });

  it('should return 400 for invalid price', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test', price: -50 });   // negative price

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Price must be a positive number');
  });
});
```

---

## PUT aur DELETE Tests

```javascript
// PUT aur DELETE tests
describe('PUT /api/products/:id', () => {
  it('should update an existing product', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .send({ name: 'Gehun Premium', price: 3000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Gehun Premium');
    expect(res.body.data.price).toBe(3000);
  });

  it('should return 404 for non-existent product', async () => {
    const res = await request(app)
      .put('/api/products/999')
      .send({ name: 'Ghost', price: 0 });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('should delete a product', async () => {
    const res = await request(app).delete('/api/products/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);  // "deleted" word hona chahiye
  });

  it('should return 404 for non-existent product', async () => {
    const res = await request(app).delete('/api/products/999');

    expect(res.statusCode).toBe(404);
  });
});
```

---

## Auth Routes Testing

Auth testing thoda alag hai — token generate hota hai, protected routes hote hain:

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../app');

describe('Auth API Endpoints', () => {

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Ravi Kisan',
          email: 'ravi@test.com',
          password: 'Test@1234',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');  // JWT token milna chahiye
      expect(res.body.user.email).toBe('ravi@test.com');
    });

    it('should not register with existing email', async () => {
      // Pehle register karo
      await request(app).post('/api/auth/register').send({
        name: 'Ravi', email: 'duplicate@test.com', password: 'Test@1234',
      });

      // Same email se dobara try karo
      const res = await request(app).post('/api/auth/register').send({
        name: 'Ravi 2', email: 'duplicate@test.com', password: 'Test@1234',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ravi@test.com', password: 'Test@1234' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ravi@test.com', password: 'WrongPass' });

      expect(res.statusCode).toBe(401);     // Unauthorized
    });
  });
});
```

---

## Test Database Setup/Teardown

Production database pe test mat chalao! Test database alag hona chahiye:

```javascript
// tests/setup.js
const mongoose = require('mongoose');

// Test shuru hone se pehle — test DB se connect karo
beforeAll(async () => {
  const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/testdb';
  await mongoose.connect(testDbUri);
});

// Har test ke baad — collections saaf karo
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});  // sab data delete karo
  }
});

// Sab tests ke baad — connection band karo
afterAll(async () => {
  await mongoose.connection.dropDatabase(); // poora test DB drop karo
  await mongoose.connection.close();
});
```

> **Warning:**
> Kabhi bhi production database URI test mein use mat karo! `.env.test` file banao alag se. `NODE_ENV=test` set karke tests chalao.

---

## Test Organization — Folder Structure

```
project/
├── src/
│   ├── routes/
│   ├── controllers/
│   └── models/
├── tests/
│   ├── unit/              # Unit tests
│   │   ├── utils.test.js
│   │   └── models.test.js
│   ├── integration/       # API / Integration tests
│   │   ├── product.test.js
│   │   └── auth.test.js
│   ├── fixtures/          # Test data
│   │   └── users.json
│   └── setup.js           # Global setup/teardown
├── jest.config.js
└── .env.test              # Test environment variables
```

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| Supertest | HTTP testing library | `request(app).get('/api/products')` |
| GET test | Endpoint response check | Status 200, data array |
| POST test | Create + validation check | 201 Created, 400 for invalid |
| Auth test | Register/Login flow | Token milna chahiye |
| Test DB | Alag database for tests | `mongodb://localhost/testdb` |
| beforeAll | Ek baar DB connect | Test suite shuru mein |
| afterEach | Har test ke baad cleanup | Collections saaf karo |
| afterAll | DB drop + disconnect | Suite end mein |

---

## Aaj Kya Seekha?

1. Supertest se bina server start kiye API test kar sakte hain
2. GET, POST, PUT, DELETE sab endpoints test karna
3. Status codes check karna — 200, 201, 400, 401, 404
4. Validation errors test karna — missing fields, invalid data
5. Auth flow testing — register, login, token check
6. Test database alag rakhna — setup/teardown pattern

> **Practice Time!**
> Evening session mein hum full CRUD + auth flow ka complete test suite likhenge!
