# Day 63 Evening: Practice — Redis Caching in Express API

> **Aaj ka plan:** Ab Redis ko practically use karenge! Redis install karenge, basic commands try karenge, Express API mein caching implement karenge, aur performance improvement measure karenge.

---

## Step 1: Redis Install Karo

### Windows Pe (WSL ya Docker se)

```bash
# Option 1: WSL (Windows Subsystem for Linux) mein
sudo apt update
sudo apt install redis-server
sudo service redis-server start

# Option 2: Docker se (recommended — zyada easy)
docker run -d --name redis-local -p 6379:6379 redis:alpine

# Verify — Redis chal raha hai?
redis-cli ping
# Output: PONG  ← Ye aaye to Redis ready hai!
```

> **Terminal Command:**
> ```
> redis-cli
> ```
> Ye Redis CLI open karega — yahan se directly commands run kar sakte ho.

### Redis CLI Practice

```bash
# Redis CLI mein jaao
redis-cli

# Basic commands try karo
127.0.0.1:6379> SET greeting "Namaste Kisan!"
OK

127.0.0.1:6379> GET greeting
"Namaste Kisan!"

127.0.0.1:6379> SET price 2500 EX 60
OK

127.0.0.1:6379> TTL price
(integer) 57

127.0.0.1:6379> HSET farmer:1 name "Ramesh" crop "Wheat" rating 4.8
(integer) 3

127.0.0.1:6379> HGETALL farmer:1
1) "name"
2) "Ramesh"
3) "crop"
4) "Wheat"
5) "rating"
6) "4.8"

# Exit CLI
127.0.0.1:6379> EXIT
```

> **Practice Time!** Redis CLI mein ye commands try karo:
> 1. Ek list banao `recent_crops` mein 5 crops push karo
> 2. Ek set banao `online_users` mein 3 users add karo
> 3. TTL check karo kisi key ka

---

## Step 2: Project Setup

### Node.js Project mein Redis Add Karo

```bash
# Naya project banao ya existing mein jaao
mkdir redis-cache-demo && cd redis-cache-demo
npm init -y

# Dependencies install karo
npm install express mongoose redis dotenv
```

> **Terminal Command:**
> ```
> npm install express mongoose redis dotenv
> ```

### Folder Structure

```
redis-cache-demo/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── redis.js          # Redis connection
│   ├── models/
│   │   └── Product.js        # Product model
│   ├── routes/
│   │   └── productRoutes.js  # Product routes
│   ├── middleware/
│   │   └── cache.js          # Cache middleware
│   └── app.js                # Express app
├── .env
├── seed.js                   # Demo data seed karne ke liye
└── package.json
```

---

## Step 3: Redis Connection Setup

```javascript
// src/config/redis.js
// Redis se connect karna

const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connection events
redisClient.on('connect', () => {
  console.log('Redis se connect ho gaye!');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

// Connect karo
async function connectRedis() {
  await redisClient.connect();
}

module.exports = { redisClient, connectRedis };
```

```javascript
// src/config/database.js
// MongoDB connection

const mongoose = require('mongoose');

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/redis-demo');
  console.log('MongoDB se connect ho gaye!');
}

module.exports = { connectDB };
```

---

## Step 4: Product Model + Seed Data

```javascript
// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  farmer: { type: String, required: true },
  description: String,
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

```javascript
// seed.js — Demo data seed karo
// Ek baar chalao: node seed.js

const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/redis-demo');
  
  // Pehle purana data delete karo
  await Product.deleteMany({});
  
  // 100 products banao — taaki caching ka fark dikhe
  const products = [];
  const crops = ['Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Potato', 'Tomato', 'Onion', 'Mango'];
  const farmers = ['Ramesh', 'Suresh', 'Mahesh', 'Dinesh', 'Rajesh'];
  
  for (let i = 1; i <= 100; i++) {
    products.push({
      name: `${crops[i % crops.length]} Grade ${String.fromCharCode(65 + (i % 3))}`,
      category: crops[i % crops.length],
      price: Math.floor(Math.random() * 5000) + 500,
      stock: Math.floor(Math.random() * 1000) + 10,
      farmer: farmers[i % farmers.length],
      description: `High quality ${crops[i % crops.length]} from Punjab`,
      rating: (Math.random() * 2 + 3).toFixed(1)   // 3.0 to 5.0
    });
  }
  
  await Product.insertMany(products);
  console.log('100 products seed ho gaye!');
  process.exit(0);
}

seed();
```

> **Terminal Command:**
> ```
> node seed.js
> ```

---

## Step 5: Express API with Caching

```javascript
// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { redisClient } = require('../config/redis');

// GET /api/products — Sab products (WITH CACHE)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'products:all';
    
    // Step 1: Cache check karo
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      console.log('CACHE HIT — products cache se aa rahe hain');
      return res.json({
        source: 'cache',           // batao ki cache se aaya hai
        count: JSON.parse(cached).length,
        data: JSON.parse(cached)
      });
    }
    
    // Step 2: Cache miss — DB se laao
    console.log('CACHE MISS — DB se la rahe hain...');
    const startTime = Date.now();
    const products = await Product.find();
    const dbTime = Date.now() - startTime;
    
    // Step 3: Cache mein store karo (5 minutes ke liye)
    await redisClient.set(cacheKey, JSON.stringify(products), {
      EX: 300   // 5 minutes = 300 seconds
    });
    
    res.json({
      source: 'database',
      dbQueryTime: `${dbTime}ms`,
      count: products.length,
      data: products
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id — Ek product (WITH CACHE)
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `product:${req.params.id}`;
    
    // Cache check karo
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      console.log(`CACHE HIT — product ${req.params.id}`);
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }
    
    // DB se laao
    console.log(`CACHE MISS — product ${req.params.id}`);
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product nahi mila!' });
    }
    
    // Cache mein store karo (10 minutes)
    await redisClient.set(cacheKey, JSON.stringify(product), { EX: 600 });
    
    res.json({ source: 'database', data: product });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products — Naya product add (CACHE INVALIDATE)
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    // Cache invalidate karo — product list ab purani hai
    await redisClient.del('products:all');
    console.log('Cache invalidated — products:all deleted');
    
    res.status(201).json({ data: product });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id — Product update (CACHE INVALIDATE)
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    // Dono caches invalidate karo
    await redisClient.del(`product:${req.params.id}`);  // single product cache
    await redisClient.del('products:all');                // list cache
    console.log('Cache invalidated for updated product');
    
    res.json({ data: product });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## Step 6: Main App

```javascript
// src/app.js
require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server chal raha hai!' });
});

// Server start
async function startServer() {
  await connectDB();       // MongoDB connect
  await connectRedis();    // Redis connect
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  });
}

startServer();
```

---

## Step 7: Performance Test Karo

```bash
# Terminal mein ye commands try karo:

# Pehli baar — CACHE MISS (slow — DB se aayega)
curl http://localhost:3000/api/products
# Response: { "source": "database", "dbQueryTime": "45ms", ... }

# Doosri baar — CACHE HIT (fast — Redis se aayega)
curl http://localhost:3000/api/products
# Response: { "source": "cache", ... }
```

> **Expected Output:**
> ```
> Pehli request:  source: "database", dbQueryTime: "45ms"
> Doosri request: source: "cache"   (< 5ms!)
>
> Performance improvement: ~10x faster!
> ```

> **Tip:** Real production mein jab database remote server pe hota hai (50-100ms latency), tab caching ka fark aur bhi dramatic hota hai — 100ms vs 2ms!

---

## Quick Revision Table

| Step | Kya Kiya |
|------|----------|
| Redis Install | Docker ya WSL se Redis run kiya |
| Redis CLI | Basic commands practice kiye — SET, GET, HSET, TTL |
| Project Setup | Express + MongoDB + Redis project banaya |
| Cache-Aside | GET routes mein pehle cache check, phir DB |
| Cache Invalidation | POST/PUT pe cache delete kiya |
| Performance | Pehli request DB se (slow), baaki cache se (fast) |

---

## Aaj Kya Seekha?

1. Redis **practically install** karna aur CLI use karna seekh gaye
2. Express API mein **Cache-Aside pattern** implement kiya
3. Data update pe **cache invalidation** karna zaroori hai
4. Response mein `source: cache/database` bhejna **debugging** mein help karta hai
5. Caching se **10-100x performance improvement** milta hai
6. TTL hamesha set karo — **stale data** serve hona sabse bada bug hai!
