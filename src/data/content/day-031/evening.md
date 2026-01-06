# Day 31 - Evening Session: Express.js Practice

> **Aaj ka plan:**
> Aaj morning mein Express ki theory seekhi, ab haath gande karte hain! Multiple routes, query params, aur JSON APIs ka practice karenge.

---

## Project Setup

> **Terminal Command:**
> ```bash
> mkdir express-practice && cd express-practice
> npm init -y
> npm install express nodemon
> ```

Package.json mein script add karo:

```json
{
  "scripts": {
    "dev": "nodemon server.js"
  }
}
```

---

## Task 1: Basic Express Server with Multiple Routes

```javascript
// server.js - Multiple routes wala server
const express = require('express');
const app = express();
const PORT = 3000;

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Kisan Market API mein swagat hai!',
    version: '1.0.0',
    endpoints: [
      'GET /api/hello',
      'GET /api/users',
      'GET /api/crops',
      'GET /api/weather'
    ]
  });
});

// Hello API
app.get('/api/hello', (req, res) => {
  res.json({
    greeting: 'Namaste!',
    time: new Date().toLocaleTimeString('hi-IN')
  });
});

// Users API - static data
app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'Ramesh', role: 'farmer', village: 'Sultanpur' },
    { id: 2, name: 'Suresh', role: 'trader', city: 'Lucknow' },
    { id: 3, name: 'Priya', role: 'farmer', village: 'Barabanki' },
    { id: 4, name: 'Amit', role: 'admin', city: 'Delhi' }
  ];

  res.json({
    count: users.length,
    users: users
  });
});

// Crops API
app.get('/api/crops', (req, res) => {
  const crops = [
    { id: 1, name: 'Gehun (Wheat)', season: 'rabi', price: 2200 },
    { id: 2, name: 'Dhan (Rice)', season: 'kharif', price: 1940 },
    { id: 3, name: 'Chana (Gram)', season: 'rabi', price: 5230 },
    { id: 4, name: 'Makka (Corn)', season: 'kharif', price: 1870 }
  ];

  res.json({
    count: crops.length,
    crops: crops
  });
});

// Weather API (dummy)
app.get('/api/weather', (req, res) => {
  res.json({
    city: 'Lucknow',
    temperature: '32°C',
    humidity: '65%',
    forecast: 'Aaj dhoop rahegi, kal baarish ho sakti hai'
  });
});

app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`);
});
```

> **Terminal Command:**
> ```bash
> npm run dev
> ```

> **Expected Output:**
> ```
> Server chal raha hai: http://localhost:3000
> ```

Browser mein test karo:
- `http://localhost:3000/` — Home info
- `http://localhost:3000/api/hello` — Greeting
- `http://localhost:3000/api/users` — Users list
- `http://localhost:3000/api/crops` — Crops list

---

## Task 2: Query Parameters Handle Karna

```javascript
// server.js mein add karo

// Users ko role se filter karo
// URL: /api/users/search?role=farmer&village=Sultanpur
app.get('/api/users/search', (req, res) => {
  const users = [
    { id: 1, name: 'Ramesh', role: 'farmer', location: 'Sultanpur' },
    { id: 2, name: 'Suresh', role: 'trader', location: 'Lucknow' },
    { id: 3, name: 'Priya', role: 'farmer', location: 'Barabanki' },
    { id: 4, name: 'Amit', role: 'admin', location: 'Delhi' }
  ];

  // Query params nikalo
  const { role, location } = req.query;
  let filtered = users;

  // Agar role diya hai toh filter karo
  if (role) {
    filtered = filtered.filter(u => u.role === role);
  }

  // Agar location diya hai toh filter karo
  if (location) {
    filtered = filtered.filter(u => u.location === location);
  }

  res.json({
    filters: { role, location },
    count: filtered.length,
    results: filtered
  });
});

// Crops ko season se filter karo
// URL: /api/crops/search?season=rabi&min_price=2000
app.get('/api/crops/search', (req, res) => {
  const crops = [
    { id: 1, name: 'Gehun', season: 'rabi', price: 2200 },
    { id: 2, name: 'Dhan', season: 'kharif', price: 1940 },
    { id: 3, name: 'Chana', season: 'rabi', price: 5230 },
    { id: 4, name: 'Makka', season: 'kharif', price: 1870 }
  ];

  const { season, min_price, max_price } = req.query;
  let filtered = crops;

  if (season) {
    filtered = filtered.filter(c => c.season === season);
  }

  // min_price string mein aata hai, number mein convert karo
  if (min_price) {
    filtered = filtered.filter(c => c.price >= Number(min_price));
  }

  if (max_price) {
    filtered = filtered.filter(c => c.price <= Number(max_price));
  }

  res.json({
    filters: { season, min_price, max_price },
    count: filtered.length,
    results: filtered
  });
});
```

> **Warning:**
> `req.query` se jo value aati hai woh hamesha **string** hoti hai. Number comparison ke liye `Number()` ya `parseInt()` use karo, warna bugs aayenge!

Test karo browser mein:
- `http://localhost:3000/api/users/search?role=farmer`
- `http://localhost:3000/api/crops/search?season=rabi&min_price=3000`

---

## Task 3: Route Parameters ( :id )

```javascript
// Ek specific user dhundho by ID
// URL: /api/users/2
app.get('/api/users/:id', (req, res) => {
  const users = [
    { id: 1, name: 'Ramesh', role: 'farmer' },
    { id: 2, name: 'Suresh', role: 'trader' },
    { id: 3, name: 'Priya', role: 'farmer' },
    { id: 4, name: 'Amit', role: 'admin' }
  ];

  // params se id nikalo (yeh bhi string hota hai!)
  const userId = Number(req.params.id);

  // User dhundho
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: 'User nahi mila!',
      requested_id: userId
    });
  }

  res.json({ user });
});
```

> **Yaad Rakho:**
> - `/api/users/search` (fixed route) ko `/api/users/:id` (dynamic route) se **pehle** likho.
> - Warna Express "search" ko bhi `:id` samjhega!

---

## Task 4: Status Codes Sahi Use Karo

```javascript
// Alag-alag status codes ka demo
app.get('/api/status-demo', (req, res) => {
  res.status(200).json({ message: 'Sab theek hai! (OK)' });
});

app.get('/api/not-found-demo', (req, res) => {
  res.status(404).json({ error: 'Yeh cheez nahi mili (Not Found)' });
});

app.get('/api/error-demo', (req, res) => {
  res.status(500).json({ error: 'Server mein gadbad (Internal Error)' });
});

// Sabse last mein - 404 catch-all route
// Jo bhi route match nahi hua, yahan aayega
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Yeh route exist nahi karta!',
    requested_url: req.originalUrl,
    tip: 'Available endpoints ke liye GET / try karo'
  });
});
```

> **Tip:**
> Catch-all `app.use('*', ...)` hamesha **sabse last** mein likho. Yeh un sabhi URLs ko handle karta hai jo kisi route se match nahi hue.

---

## Task 5: Complete Server File

Saara code ek clean file mein organize karo:

```javascript
// server.js — Complete Practice Server
const express = require('express');
const app = express();
const PORT = 3000;

// ---- DATA (baad mein database se aayega) ----
const users = [
  { id: 1, name: 'Ramesh', role: 'farmer', location: 'Sultanpur' },
  { id: 2, name: 'Suresh', role: 'trader', location: 'Lucknow' },
  { id: 3, name: 'Priya', role: 'farmer', location: 'Barabanki' },
  { id: 4, name: 'Amit', role: 'admin', location: 'Delhi' }
];

const crops = [
  { id: 1, name: 'Gehun', season: 'rabi', price: 2200 },
  { id: 2, name: 'Dhan', season: 'kharif', price: 1940 },
  { id: 3, name: 'Chana', season: 'rabi', price: 5230 },
  { id: 4, name: 'Makka', season: 'kharif', price: 1870 }
];

// ---- ROUTES ----
app.get('/', (req, res) => {
  res.json({ message: 'API Ready!', endpoints: ['/api/users', '/api/crops'] });
});

app.get('/api/users', (req, res) => res.json({ count: users.length, users }));
app.get('/api/crops', (req, res) => res.json({ count: crops.length, crops }));

// Search with query params
app.get('/api/users/search', (req, res) => {
  let result = users;
  if (req.query.role) result = result.filter(u => u.role === req.query.role);
  res.json({ count: result.length, results: result });
});

// Dynamic route param
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User nahi mila' });
  res.json({ user });
});

// 404 catch-all
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
```

---

## Quick Revision Table

| Concept | Code | Kya Karta Hai |
|---------|------|---------------|
| Multiple Routes | `app.get('/path', handler)` | Alag-alag URLs handle karo |
| Query Params | `req.query.name` | `?name=ravi` se value lo |
| Route Params | `req.params.id` | `/:id` se dynamic value lo |
| JSON Response | `res.json({...})` | API response bhejo |
| Status Code | `res.status(404)` | HTTP status set karo |
| 404 Catch-all | `app.use('*', handler)` | Unknown routes handle karo |
| Filter Data | `array.filter()` | Query ke basis pe data filter |
| Type Convert | `Number(req.params.id)` | String ko number banao |

---

## Aaj Kya Seekha?

1. **Multiple routes** banakar ek proper API server structure bana sakte hain
2. **Query parameters** (`req.query`) se data filter karna — jaise season, role, price range
3. **Route parameters** (`req.params`) se specific item fetch karna — jaise user by ID
4. **Status codes** sahi use karna — 200 success, 404 not found, 500 server error
5. **Route order matters** — fixed routes pehle, dynamic routes baad mein, catch-all sabse last
6. **Data type conversion** zaroori hai kyunki query/params hamesha string mein aate hain

> **Practice Time!**
> Apna server banao aur browser mein har route test karo. Kal hum Express Routing aur Middleware seekhenge — Express ki asli power wahan hai!
