# Day 76 — Testing: API Tests + Integration (Evening Session — Practice)

> **Aaj ka plan:**
> Ab hands-on practice — complete CRUD endpoints ke API tests likhenge, auth flow test karenge (register -> login -> protected route access), aur validation errors properly test karenge.

---

## Practice 1: Complete CRUD API Test Suite

Ek farmer product management API ka full test suite banate hain:

```javascript
// tests/integration/product.test.js
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const Product = require('../../models/Product');

// Test database setup
beforeAll(async () => {
  await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/farm_test');
});

// Har test ke baad products collection saaf karo
afterEach(async () => {
  await Product.deleteMany({});
});

// Tests ke baad DB close karo
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Product CRUD API', () => {

  // --- Test data helper ---
  const sampleProduct = {
    name: 'Organic Gehun',
    price: 2800,
    category: 'grain',
    quantity: 500,
    unit: 'kg',
  };

  // =====================
  // CREATE — POST tests
  // =====================
  describe('POST /api/products', () => {
    it('should create a new product successfully', async () => {
      const res = await request(app)
        .post('/api/products')
        .send(sampleProduct);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Organic Gehun');
      expect(res.body.data._id).toBeDefined();       // MongoDB ID generate hua
      expect(res.body.data.createdAt).toBeDefined();  // timestamp bhi hona chahiye
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Incomplete' });  // price nahi bheja

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/price/i);  // error mein "price" mention ho
    });

    it('should fail with negative price', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ ...sampleProduct, price: -100 });

      expect(res.statusCode).toBe(400);
    });

    it('should fail with duplicate product name', async () => {
      // Pehle ek product banao
      await request(app).post('/api/products').send(sampleProduct);

      // Same name se dobara try karo
      const res = await request(app).post('/api/products').send(sampleProduct);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/duplicate|already exists/i);
    });
  });

  // =====================
  // READ — GET tests
  // =====================
  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Kuch products daal do test ke liye
      await Product.create([
        { name: 'Gehun', price: 2500, category: 'grain', quantity: 100, unit: 'kg' },
        { name: 'Chawal', price: 3000, category: 'grain', quantity: 200, unit: 'kg' },
        { name: 'Tamatar', price: 40, category: 'vegetable', quantity: 50, unit: 'kg' },
      ]);
    });

    it('should return all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(3);  // 3 products hone chahiye
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/api/products?category=grain');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);  // sirf grain category
      res.body.data.forEach(product => {
        expect(product.category).toBe('grain');
      });
    });

    it('should return single product by ID', async () => {
      const product = await Product.findOne({ name: 'Gehun' });
      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Gehun');
    });

    it('should return 404 for invalid ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();  // random valid ObjectId
      const res = await request(app).get(`/api/products/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // =====================
  // UPDATE — PUT tests
  // =====================
  describe('PUT /api/products/:id', () => {
    it('should update product successfully', async () => {
      const product = await Product.create(sampleProduct);

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ price: 3200 });     // sirf price update karo

      expect(res.statusCode).toBe(200);
      expect(res.body.data.price).toBe(3200);         // naya price
      expect(res.body.data.name).toBe('Organic Gehun'); // name same rahe
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/products/${fakeId}`)
        .send({ price: 100 });

      expect(res.statusCode).toBe(404);
    });
  });

  // =====================
  // DELETE tests
  // =====================
  describe('DELETE /api/products/:id', () => {
    it('should delete product successfully', async () => {
      const product = await Product.create(sampleProduct);

      const res = await request(app).delete(`/api/products/${product._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);

      // Verify product actually deleted
      const check = await Product.findById(product._id);
      expect(check).toBeNull();       // database mein nahi hona chahiye
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/products/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
```

---

## Practice 2: Auth Flow Integration Test

Yeh sabse important test hai — poora auth flow test karo ek saath:

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const User = require('../../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/farm_test');
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Auth Flow — Register -> Login -> Access Protected Route', () => {
  const testUser = {
    name: 'Ravi Kisan',
    email: 'ravi@farmapp.com',
    password: 'Secure@123',
  };

  let authToken;  // yeh token store karenge login ke baad

  // Step 1: Register
  it('Step 1 — should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.name).toBe('Ravi Kisan');
    expect(res.body.user).not.toHaveProperty('password'); // password response mein nahi hona chahiye!
  });

  // Step 2: Login
  it('Step 2 — should login with registered credentials', async () => {
    // Pehle register karo
    await request(app).post('/api/auth/register').send(testUser);

    // Ab login karo
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;   // token save karo aage ke liye
  });

  // Step 3: Access protected route with token
  it('Step 3 — should access protected route with valid token', async () => {
    // Register + Login
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    authToken = loginRes.body.token;

    // Protected route access karo
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);  // token header mein bhejo

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('ravi@farmapp.com');
  });

  // Step 4: Protected route WITHOUT token
  it('Step 4 — should reject access without token', async () => {
    const res = await request(app).get('/api/auth/me');
    // Token nahi bheja — reject hona chahiye

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/unauthorized|not authenticated|no token/i);
  });

  // Step 5: Invalid token
  it('Step 5 — should reject access with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer fake.invalid.token');

    expect(res.statusCode).toBe(401);
  });
});
```

> **Yaad Rakho:**
> Auth flow test mein 5 cheezein check karo: (1) Register, (2) Login, (3) Token se access, (4) Bina token reject, (5) Invalid token reject.

---

## Practice 3: Validation Error Tests

```javascript
// tests/integration/validation.test.js
const request = require('supertest');
const app = require('../../app');

describe('Input Validation Errors', () => {

  describe('Registration Validation', () => {
    it('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: '', email: 'test@test.com', password: 'Test@1234' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors || res.body.message).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-email', password: 'Test@1234' });

      expect(res.statusCode).toBe(400);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/password/i);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});  // kuch nahi bheja

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Product Validation', () => {
    it('should reject product with string price', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Test', price: 'free', category: 'grain' });

      expect(res.statusCode).toBe(400);
    });

    it('should reject product with very long name', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'A'.repeat(300), price: 100 }); // 300 char name

      expect(res.statusCode).toBe(400);
    });
  });
});
```

---

## Test Scripts — package.json

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest --forceExit --detectOpenHandles",
    "test:unit": "jest tests/unit/ --verbose",
    "test:integration": "jest tests/integration/ --verbose",
    "test:auth": "jest tests/integration/auth.test.js --verbose",
    "test:coverage": "jest --coverage --forceExit"
  }
}
```

> **Tip:**
> `--forceExit` — Jest ko force exit karo (DB connections open reh jaate hain kabhi kabhi).
> `--detectOpenHandles` — open handles dikhata hai (debugging ke liye useful).

---

## Common Testing Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Production DB pe test | Real data delete ho sakta hai | TEST_DB_URI alag rakho |
| Tests ek dusre pe depend | Order change = tests fail | `afterEach` mein cleanup karo |
| Token hardcode karna | Token expire ho jaata hai | Har test mein fresh register+login |
| Status code ignore karna | Wrong status = wrong behavior | Hamesha status code check karo |
| Error messages check na karna | Galat error message user ko confuse kare | `toMatch(/expected/)` use karo |

---

## Quick Revision Table

| Practice | Kya Kiya | Key Pattern |
|----------|---------|-------------|
| CRUD Tests | GET/POST/PUT/DELETE | Status codes + body check |
| Auth Flow | Register->Login->Access | Token save karke agle request mein use |
| Validation | Missing/invalid fields | 400 status + error message |
| Setup/Teardown | DB connect/cleanup | beforeAll/afterEach/afterAll |

---

## Aaj Kya Seekha?

1. Supertest se complete CRUD API testing karna
2. Auth flow ka integration test — register se protected route tak
3. Validation errors test karna — missing fields, invalid data, edge cases
4. Test database setup aur teardown — data isolation
5. `--forceExit` aur `--detectOpenHandles` flags ka use
6. Testing mein common mistakes aur unka solution

> **Practice Time!**
> Apne existing API project mein Supertest install karo aur kam se kam 10 API tests likho — CRUD + Auth!
