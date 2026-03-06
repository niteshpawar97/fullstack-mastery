# Day 103 Evening: Hands-On — Build API Gateway + Service Registry

> **Practice Time!** Ab hum ek working API Gateway banaayenge jo multiple services ko route karega, authentication handle karega, aur ek simple service registry bhi implement karenge.

---

## Setup: Full Microservices Project

> **Terminal Command:**
> ```bash
> mkdir day103-gateway-project && cd day103-gateway-project
> mkdir api-gateway kisan-service order-service
> ```

---

## Task 1: Services Banao (Quick Setup)

### Kisan Service

> **Terminal Command:**
> ```bash
> cd kisan-service && npm init -y && npm install express cors
> ```

```javascript
// kisan-service/server.js
const express = require('express');
const app = express();
app.use(express.json());

let kisans = [
  { id: '1', naam: 'Ramesh', gaon: 'Nashik', crop: 'Tomato' },
  { id: '2', naam: 'Suresh', gaon: 'Pune', crop: 'Onion' },
  { id: '3', naam: 'Mahesh', gaon: 'Nagpur', crop: 'Orange' },
];

app.get('/health', (req, res) => {
  res.json({ service: 'kisan-service', status: 'UP', port: 3001 });
});

app.get('/kisans', (req, res) => {
  console.log('[Kisan] GET /kisans — list request aayi');
  // Gateway se aaya user info header mein hoga
  const userId = req.headers['x-user-id'] || 'unknown';
  console.log(`[Kisan] Request user: ${userId}`);
  res.json({ success: true, data: kisans });
});

app.get('/kisans/:id', (req, res) => {
  const kisan = kisans.find(k => k.id === req.params.id);
  if (!kisan) return res.status(404).json({ error: 'Kisan nahi mila' });
  res.json({ success: true, data: kisan });
});

app.post('/kisans', (req, res) => {
  const newKisan = { id: String(kisans.length + 1), ...req.body };
  kisans.push(newKisan);
  res.status(201).json({ success: true, data: newKisan });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Kisan Service: port ${PORT}`));
```

### Order Service

> **Terminal Command:**
> ```bash
> cd ../order-service && npm init -y && npm install express cors
> ```

```javascript
// order-service/server.js
const express = require('express');
const app = express();
app.use(express.json());

let orders = [];
let counter = 0;

app.get('/health', (req, res) => {
  res.json({ service: 'order-service', status: 'UP', port: 3002 });
});

app.get('/orders', (req, res) => {
  const userId = req.headers['x-user-id'] || 'unknown';
  console.log(`[Order] GET /orders — user: ${userId}`);
  res.json({ success: true, data: orders });
});

app.post('/orders', (req, res) => {
  counter++;
  const order = {
    id: `ORD-${String(counter).padStart(4, '0')}`,
    ...req.body,
    status: 'CREATED',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  console.log(`[Order] Naya order: ${order.id}`);
  res.status(201).json({ success: true, data: order });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Order Service: port ${PORT}`));
```

---

## Task 2: API Gateway Banao

> **Terminal Command:**
> ```bash
> cd ../api-gateway && npm init -y
> npm install express http-proxy-middleware express-rate-limit jsonwebtoken cors morgan
> ```

### Full Gateway Code

```javascript
// api-gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(morgan('short')); // Request logging

const JWT_SECRET = 'mera-secret-key-production-mein-env-se-aayega';

// Service configuration
const services = {
  kisan: { url: 'http://localhost:3001', path: '/api/kisans' },
  order: { url: 'http://localhost:3002', path: '/api/orders' },
};

// Rate limiting — 50 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { error: 'Rate limit exceed — thoda ruko bhai!' },
  standardHeaders: true,
});
app.use(limiter);

// JWT Authentication middleware
function authMiddleware(req, res, next) {
  // Health check bina auth ke
  if (req.path === '/health' || req.path === '/auth/login') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token do — Bearer <token> format mein'
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    // User info forward karo services ko
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Invalid Token',
      message: 'Token galat ya expire ho gaya — dobara login karo'
    });
  }
}

// Demo login endpoint — token generate karo
app.post('/auth/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  // Demo ke liye simple check
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { userId: 'USR-001', username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ success: true, token });
  }
  res.status(401).json({ error: 'Username ya password galat hai' });
});

// Gateway health + service health aggregation
app.get('/health', async (req, res) => {
  const axios = require('axios') || null;
  res.json({
    service: 'api-gateway',
    status: 'UP',
    routes: Object.entries(services).map(([name, cfg]) => ({
      name,
      path: cfg.path,
      target: cfg.url,
    })),
    timestamp: new Date().toISOString()
  });
});

// Apply auth middleware
app.use(authMiddleware);

// Proxy: /api/kisans → Kisan Service
app.use(services.kisan.path, createProxyMiddleware({
  target: services.kisan.url,
  changeOrigin: true,
  pathRewrite: { '^/api/kisans': '/kisans' },
  onProxyReq: (proxyReq, req) => {
    console.log(`[Gateway] ${req.method} ${req.url} → ${services.kisan.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[Gateway] Kisan service down:`, err.message);
    res.status(503).json({ error: 'Kisan Service abhi available nahi hai' });
  }
}));

// Proxy: /api/orders → Order Service
app.use(services.order.path, createProxyMiddleware({
  target: services.order.url,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/orders' },
  onProxyReq: (proxyReq, req) => {
    console.log(`[Gateway] ${req.method} ${req.url} → ${services.order.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[Gateway] Order service down:`, err.message);
    res.status(503).json({ error: 'Order Service abhi available nahi hai' });
  }
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route nahi mila',
    availableRoutes: ['/api/kisans', '/api/orders', '/auth/login', '/health']
  });
});

app.listen(3000, () => {
  console.log('API Gateway chalu hai port 3000 pe');
  console.log('Routes:');
  Object.entries(services).forEach(([name, cfg]) => {
    console.log(`  ${cfg.path} → ${cfg.url}`);
  });
});
```

---

## Task 3: System Test Karo

### Sab services start karo (3 terminals):

> **Terminal Command:**
> ```bash
> # Terminal 1: cd kisan-service && node server.js
> # Terminal 2: cd order-service && node server.js
> # Terminal 3: cd api-gateway && node server.js
> ```

### Test Requests:

```bash
# 1. Health check (bina token ke chalega)
curl http://localhost:3000/health

# 2. Bina token ke request — 401 error aayega
curl http://localhost:3000/api/kisans

# 3. Login karke token lo
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')
echo "Token: $TOKEN"

# 4. Token ke saath kisans fetch karo
curl http://localhost:3000/api/kisans \
  -H "Authorization: Bearer $TOKEN"

# 5. Token ke saath order create karo
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kisanId":"1","items":["Urea"],"amount":1500}'

# 6. Galat token se try karo — 403 aayega
curl http://localhost:3000/api/kisans \
  -H "Authorization: Bearer galat-token-hai-ye"
```

> **Expected Output:**
> ```json
> // Bina token:
> { "error": "Unauthorized", "message": "Token do — Bearer <token> format mein" }
>
> // Sahi token ke saath:
> { "success": true, "data": [{"id":"1","naam":"Ramesh"}, ...] }
>
> // Galat token:
> { "error": "Invalid Token", "message": "Token galat ya expire ho gaya" }
> ```

---

## Task 4: Service Down Scenario Test

```bash
# Kisan service band karo (Terminal 1 mein Ctrl+C)
# Ab gateway se kisan request karo
curl http://localhost:3000/api/kisans \
  -H "Authorization: Bearer $TOKEN"

# Gateway gracefully error dega:
# { "error": "Kisan Service abhi available nahi hai" }
```

> **Yaad Rakho:** Gateway ka `onError` handler ensure karta hai ki service down hone pe bhi client ko proper error message mile — raw connection error nahi.

---

## Mini Challenge

1. Ek **Payment Service** add karo gateway mein (port 3003, route `/api/payments`)
2. **Request logging** ko file mein save karo (`morgan` ka file stream use karo)
3. **Admin-only routes** banao — sirf `role: 'admin'` wale users access kar sakein

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| API Gateway | Single entry point — routing + auth + rate limiting |
| `http-proxy-middleware` | Express mein reverse proxy set karna |
| JWT at Gateway | Token verify ek jagah — services ko repeat nahi karna |
| Rate Limiting | `express-rate-limit` se abuse prevent karo |
| Service Error | `onError` handler — service down pe graceful response |
| `x-user-id` header | Gateway verified user info services ko forward karta hai |

---

## Aaj Kya Seekha?

- Full API Gateway banaya — routing, auth, rate limiting sab ke saath
- JWT authentication gateway level pe implement ki
- Service down hone pe graceful error handling
- Multiple services ko ek endpoint se access kiya
- Gateway ke through user info (headers) forward kiya services ko
