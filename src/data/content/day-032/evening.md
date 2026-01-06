# Day 32 - Evening Session: Routing & Middleware Practice

> **Aaj ka plan:**
> Aaj hum haath se route modules banayenge, custom middleware likhenge — logger, request timer, aur error handler. Proper project structure follow karenge.

---

## Project Structure Banao

> **Terminal Command:**
> ```bash
> mkdir middleware-practice && cd middleware-practice
> npm init -y
> npm install express nodemon
> mkdir routes middleware
> touch server.js
> touch routes/userRoutes.js routes/cropRoutes.js
> touch middleware/logger.js middleware/requestTimer.js middleware/errorHandler.js
> ```

Folder structure:
```
middleware-practice/
  |- server.js
  |- routes/
  |    |- userRoutes.js
  |    |- cropRoutes.js
  |- middleware/
  |    |- logger.js
  |    |- requestTimer.js
  |    |- errorHandler.js
```

---

## Task 1: Logger Middleware Banao

```javascript
// middleware/logger.js
// Har request ki details log karta hai

const logger = (req, res, next) => {
  // Current time nikalo
  const now = new Date();
  const time = now.toLocaleTimeString('hi-IN');
  const date = now.toLocaleDateString('hi-IN');

  // Method ko color ke saath dikhao (terminal mein)
  const methodColors = {
    GET: '\x1b[32m',     // Green
    POST: '\x1b[33m',    // Yellow
    PUT: '\x1b[34m',     // Blue
    DELETE: '\x1b[31m',  // Red
  };
  const color = methodColors[req.method] || '\x1b[0m';
  const reset = '\x1b[0m';

  console.log(
    `[${date} ${time}] ${color}${req.method}${reset} ${req.url}`
  );

  // Agle middleware pe jaao
  next();
};

module.exports = logger;
```

> **Expected Output:**
> ```
> [4/4/2026 10:30:15 AM] GET /api/users
> [4/4/2026 10:30:16 AM] POST /api/crops
> [4/4/2026 10:30:17 AM] DELETE /api/users/3
> ```

---

## Task 2: Request Timer Middleware

```javascript
// middleware/requestTimer.js
// Har request kitni der leti hai — woh track karo

const requestTimer = (req, res, next) => {
  // Request start time note karo
  const start = Date.now();

  // Jab response bheje, tab time calculate karo
  // res.on('finish') tab fire hota hai jab response complete hota hai
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Slow requests ko highlight karo
    const warning = duration > 100 ? ' ⚠️ SLOW!' : '';
    console.log(
      `  -> Status: ${status} | Time: ${duration}ms${warning}`
    );
  });

  next();
};

module.exports = requestTimer;
```

> **Socho Aise:**
> Jaise doctor appointment mein entry time aur exit time likhi jaati hai — request timer bhi wahi karta hai. Slow APIs pakadne mein help karta hai!

---

## Task 3: User Routes Module

```javascript
// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Dummy data (baad mein database se aayega)
let users = [
  { id: 1, name: 'Ramesh Kumar', role: 'farmer', village: 'Sultanpur', phone: '9876543210' },
  { id: 2, name: 'Suresh Yadav', role: 'trader', village: 'Lucknow', phone: '9876543211' },
  { id: 3, name: 'Priya Singh', role: 'farmer', village: 'Barabanki', phone: '9876543212' },
  { id: 4, name: 'Amit Verma', role: 'admin', village: 'Delhi', phone: '9876543213' }
];

// GET /api/users — Saare users
router.get('/', (req, res) => {
  // Query params se filter karo
  let result = [...users];

  if (req.query.role) {
    result = result.filter(u => u.role === req.query.role);
  }

  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

// GET /api/users/:id — Ek user
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User nahi mila'
    });
  }

  res.json({ success: true, data: user });
});

// POST /api/users — Naya user banao
router.post('/', (req, res) => {
  const { name, role, village, phone } = req.body;

  // Validation check
  if (!name || !role) {
    return res.status(400).json({
      success: false,
      error: 'Name aur role dena zaroori hai!'
    });
  }

  const newUser = {
    id: users.length + 1,
    name,
    role,
    village: village || 'Unknown',
    phone: phone || 'N/A'
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    message: 'User ban gaya!',
    data: newUser
  });
});

// DELETE /api/users/:id — User hatao
router.delete('/:id', (req, res) => {
  const index = users.findIndex(u => u.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'User nahi mila delete karne ke liye'
    });
  }

  const deleted = users.splice(index, 1);
  res.json({
    success: true,
    message: 'User delete ho gaya',
    data: deleted[0]
  });
});

module.exports = router;
```

---

## Task 4: Crop Routes Module

```javascript
// routes/cropRoutes.js
const express = require('express');
const router = express.Router();

let crops = [
  { id: 1, name: 'Gehun (Wheat)', season: 'rabi', price: 2200, unit: 'quintal' },
  { id: 2, name: 'Dhan (Rice)', season: 'kharif', price: 1940, unit: 'quintal' },
  { id: 3, name: 'Chana (Gram)', season: 'rabi', price: 5230, unit: 'quintal' },
  { id: 4, name: 'Tamatar (Tomato)', season: 'both', price: 40, unit: 'kg' }
];

// GET /api/crops — Saari crops (filter support)
router.get('/', (req, res) => {
  let result = [...crops];

  // Season se filter
  if (req.query.season) {
    result = result.filter(c => c.season === req.query.season);
  }

  // Price range se filter
  if (req.query.min_price) {
    result = result.filter(c => c.price >= Number(req.query.min_price));
  }

  res.json({ success: true, count: result.length, data: result });
});

// GET /api/crops/:id — Ek crop
router.get('/:id', (req, res) => {
  const crop = crops.find(c => c.id === Number(req.params.id));
  if (!crop) {
    return res.status(404).json({ success: false, error: 'Crop nahi mili' });
  }
  res.json({ success: true, data: crop });
});

// POST /api/crops — Nayi crop add karo
router.post('/', (req, res) => {
  const { name, season, price, unit } = req.body;

  if (!name || !season || !price) {
    return res.status(400).json({
      success: false,
      error: 'name, season aur price zaroori hai!'
    });
  }

  const newCrop = {
    id: crops.length + 1,
    name,
    season,
    price: Number(price),
    unit: unit || 'kg'
  };

  crops.push(newCrop);
  res.status(201).json({ success: true, data: newCrop });
});

module.exports = router;
```

---

## Task 5: Error Handler Middleware

```javascript
// middleware/errorHandler.js
// Yeh special middleware hai — 4 parameters leta hai!

const errorHandler = (err, req, res, next) => {
  // Error log karo
  console.error('--- ERROR ---');
  console.error(`Route: ${req.method} ${req.url}`);
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  console.error('--- END ERROR ---');

  // Client ko clean error bhejo
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server mein kuch gadbad ho gayi!',
    // Production mein stack mat bhejo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

> **Yaad Rakho:**
> Error handling middleware mein **4 parameters** hote hain: `(err, req, res, next)`. Express isi se pehchanta hai ki yeh error handler hai. Agar 3 diye toh regular middleware samjhega!

---

## Task 6: Complete Server — Sab Jodo

```javascript
// server.js - Main file
const express = require('express');
const app = express();
const PORT = 3000;

// --- Middleware import ---
const logger = require('./middleware/logger');
const requestTimer = require('./middleware/requestTimer');
const errorHandler = require('./middleware/errorHandler');

// --- Route imports ---
const userRoutes = require('./routes/userRoutes');
const cropRoutes = require('./routes/cropRoutes');

// === MIDDLEWARE CHAIN (ORDER MATTERS!) ===

// 1. Body parsing — sabse pehle
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Logging — har request log ho
app.use(logger);
app.use(requestTimer);

// 3. Routes mount karo
app.get('/', (req, res) => {
  res.json({
    message: 'Kisan Market API v1.0',
    endpoints: {
      users: '/api/users',
      crops: '/api/crops'
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/crops', cropRoutes);

// 4. Error route test
app.get('/api/error-test', (req, res, next) => {
  // Deliberately error throw karo — error handler pakdega
  const err = new Error('Yeh test error hai!');
  err.statusCode = 500;
  next(err);
});

// 5. 404 handler — koi route match nahi hua
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} exist nahi karta`
  });
});

// 6. Error handler — sabse LAST mein
app.use(errorHandler);

// Server start
app.listen(PORT, () => {
  console.log(`Kisan Market API chal raha hai`);
  console.log(`http://localhost:${PORT}`);
  console.log('---');
});
```

> **Terminal Command:**
> ```bash
> npm run dev
> ```

Test karo ye URLs:
```
GET  http://localhost:3000/
GET  http://localhost:3000/api/users
GET  http://localhost:3000/api/users?role=farmer
GET  http://localhost:3000/api/users/1
GET  http://localhost:3000/api/crops?season=rabi
POST http://localhost:3000/api/users  (body: {"name":"Test","role":"farmer"})
GET  http://localhost:3000/api/unknown  (404 test)
GET  http://localhost:3000/api/error-test  (error test)
```

---

## Quick Revision Table

| Concept | File | Kya Karta Hai |
|---------|------|---------------|
| Router Module | `routes/userRoutes.js` | Routes alag file mein |
| Logger Middleware | `middleware/logger.js` | Har request log karo |
| Timer Middleware | `middleware/requestTimer.js` | Response time track karo |
| Error Handler | `middleware/errorHandler.js` | Errors cleanly handle karo |
| `app.use()` | `server.js` | Middleware/routes mount karo |
| 4-param middleware | `(err, req, res, next)` | Error catching middleware |
| Route order | Fixed > Dynamic > Catch-all | Pehle specific, phir generic |

---

## Aaj Kya Seekha?

1. **Route modules** se code clean aur organized rehta hai — har resource ki apni file
2. **Logger middleware** se har request track hoti hai — debugging mein bahut kaam aata hai
3. **Request timer** se slow APIs pakad sakte hain — performance monitoring
4. **Error handler** middleware (4 params) se errors gracefully handle hote hain
5. **Middleware order** bahut important hai — parse > log > routes > error
6. Project structure (`routes/`, `middleware/`) professional apps mein zaroori hai

> **Practice Time!**
> Ek nayi route file banao `routes/orderRoutes.js` aur ek custom middleware `middleware/apiKeyCheck.js` jo header mein API key check kare. Kal REST API Design Principles seekhenge!
