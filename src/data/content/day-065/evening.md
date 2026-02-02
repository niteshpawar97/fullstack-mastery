# Day 65 Evening: Practice — Docker Compose for Express + MongoDB + Redis

> **Aaj ka plan:** Ab hands-on Docker Compose project banayenge! Express app + MongoDB + Redis — teeno containers ek saath. Volumes ke saath data persistence aur development hot-reload setup bhi karenge.

---

## Project Structure

```
kisanbazaar-docker/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── redis.js          # Redis connection
│   ├── models/
│   │   └── Product.js        # Product model
│   ├── routes/
│   │   └── productRoutes.js  # Routes with caching
│   └── app.js                # Main Express app
├── Dockerfile                # App ka Dockerfile
├── docker-compose.yml        # Sab services define
├── docker-compose.dev.yml    # Development overrides
├── .dockerignore
├── .env
├── package.json
└── seed.js                   # Demo data
```

> **Terminal Command:**
> ```
> mkdir kisanbazaar-docker && cd kisanbazaar-docker
> npm init -y
> npm install express mongoose redis dotenv
> npm install -D nodemon
> ```

---

## Step 1: Application Code

```javascript
// src/config/database.js
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/kisanbazaar';
  
  // Retry logic — MongoDB container ko start hone mein time lagta hai
  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB se connect ho gaye!');
      return;
    } catch (err) {
      retries--;
      console.log(`MongoDB connect nahi hua. ${retries} retries left...`);
      await new Promise(res => setTimeout(res, 3000)); // 3 sec wait
    }
  }
  throw new Error('MongoDB se connect nahi ho paaya!');
}

module.exports = { connectDB };
```

```javascript
// src/config/redis.js
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('connect', () => console.log('Redis se connect ho gaye!'));
redisClient.on('error', (err) => console.error('Redis error:', err));

async function connectRedis() {
  let retries = 5;
  while (retries > 0) {
    try {
      await redisClient.connect();
      return;
    } catch (err) {
      retries--;
      console.log(`Redis connect nahi hua. ${retries} retries left...`);
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  throw new Error('Redis se connect nahi ho paaya!');
}

module.exports = { redisClient, connectRedis };
```

> **Yaad Rakho:** Retry logic bahut important hai Docker mein! `depends_on` sirf container START karta hai — MongoDB ko fully ready hone mein 2-5 seconds lagte hain. Bina retry ke app crash ho jaata.

```javascript
// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  farmer: { type: String, required: true },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

```javascript
// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { redisClient } = require('../config/redis');

// GET /api/products — Cache ke saath
router.get('/', async (req, res) => {
  try {
    // Cache check
    const cached = await redisClient.get('products:all');
    if (cached) {
      return res.json({
        source: 'redis-cache',
        count: JSON.parse(cached).length,
        data: JSON.parse(cached)
      });
    }

    // DB se laao
    const startTime = Date.now();
    const products = await Product.find().sort('-createdAt');
    const queryTime = Date.now() - startTime;

    // Cache mein store (5 min)
    await redisClient.set('products:all', JSON.stringify(products), { EX: 300 });

    res.json({
      source: 'mongodb',
      queryTime: `${queryTime}ms`,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products — Naya product + cache invalidate
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);

    // Cache clear karo — list purani ho gayi
    await redisClient.del('products:all');

    res.status(201).json({
      message: 'Product add ho gaya!',
      data: product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/stats — Redis mein stats cache
router.get('/stats', async (req, res) => {
  try {
    const cached = await redisClient.get('products:stats');
    if (cached) {
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    const totalProducts = await Product.countDocuments();
    const avgPrice = await Product.aggregate([
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);
    const categories = await Product.distinct('category');

    const stats = {
      totalProducts,
      averagePrice: Math.round(avgPrice[0]?.avgPrice || 0),
      totalCategories: categories.length,
      categories
    };

    await redisClient.set('products:stats', JSON.stringify(stats), { EX: 600 });

    res.json({ source: 'database', data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

```javascript
// src/app.js
require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    app: 'KisanBazaar API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: 'connected',
      redis: 'connected'
    }
  });
});

// Routes
app.use('/api/products', productRoutes);

// Start server
async function startServer() {
  await connectDB();
  await connectRedis();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KisanBazaar API chal raha hai port ${PORT} pe!`);
  });
}

startServer();
```

---

## Step 2: Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Package files pehle — layer caching
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

```
# .dockerignore
node_modules
npm-debug.log*
.env
.git
.gitignore
*.md
docker-compose*.yml
```

---

## Step 3: docker-compose.yml (Production)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Service 1: Express API
  app:
    build: .
    container_name: kb-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URI=mongodb://mongo:27017/kisanbazaar
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  # Service 2: MongoDB
  mongo:
    image: mongo:7
    container_name: kb-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db         # Data persist!
    restart: unless-stopped

  # Service 3: Redis
  redis:
    image: redis:alpine
    container_name: kb-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data             # Redis data persist
    restart: unless-stopped

# Named volumes — data safe rahega
volumes:
  mongo-data:
  redis-data:
```

> **Tip:** `restart: unless-stopped` se containers crash hone pe auto-restart hote hain. Production ke liye important hai!

---

## Step 4: docker-compose.dev.yml (Development Overrides)

```yaml
# docker-compose.dev.yml — Development ke liye extra settings
version: '3.8'

services:
  app:
    build: .
    container_name: kb-api-dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - MONGO_URI=mongodb://mongo:27017/kisanbazaar-dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./src:/app/src                # Hot reload ke liye source mount
      - ./package.json:/app/package.json
    command: npx nodemon src/app.js   # Auto-restart on changes!
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    container_name: kb-mongo-dev
    ports:
      - "27017:27017"
    volumes:
      - mongo-dev-data:/data/db

  redis:
    image: redis:alpine
    container_name: kb-redis-dev
    ports:
      - "6379:6379"

volumes:
  mongo-dev-data:
```

> **Socho Aise:** Production compose mein `node src/app.js` chalta hai. Development compose mein `nodemon` chalta hai — code save karo, auto-restart!

---

## Step 5: Chalao aur Test Karo!

```bash
# Development mode mein start karo
docker-compose -f docker-compose.dev.yml up -d --build

# Status check karo
docker-compose -f docker-compose.dev.yml ps
```

> **Expected Output:**
> ```
> NAME            STATUS         PORTS
> kb-api-dev      Up (healthy)   0.0.0.0:3000->3000/tcp
> kb-mongo-dev    Up             0.0.0.0:27017->27017/tcp
> kb-redis-dev    Up             0.0.0.0:6379->6379/tcp
> ```

```bash
# Logs dekho
docker-compose -f docker-compose.dev.yml logs app
# Output:
# MongoDB se connect ho gaye!
# Redis se connect ho gaye!
# KisanBazaar API chal raha hai port 3000 pe!

# Seed data daalo (container ke andar command chalao)
docker-compose -f docker-compose.dev.yml exec app node seed.js

# API test karo
curl http://localhost:3000/
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/stats

# Product add karo
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Organic Wheat","category":"Grains","price":2500,"stock":100,"farmer":"Ramesh"}'
```

### Hot Reload Test

```bash
# VS Code mein src/app.js kholke kuch change karo
# Jaise health check mein message change karo

# Container logs mein dikhega:
# [nodemon] restarting due to changes...
# [nodemon] starting `node src/app.js`
# KisanBazaar API chal raha hai port 3000 pe!

# Refresh karo — naya message dikhega!
```

> **Practice Time!** 
> 1. Production compose se start karo: `docker-compose up -d --build`
> 2. Seed data daalo
> 3. Products fetch karo — pehli baar "database", doosri baar "cache" dikhega
> 4. Naya product add karo — cache invalidate hoga
> 5. Dobaara products fetch karo — "database" dikhega (fresh cache)

---

## Cleanup Commands

```bash
# Development band karo
docker-compose -f docker-compose.dev.yml down

# Production band karo
docker-compose down

# Data bhi delete karo (careful!)
docker-compose down -v
```

---

## Quick Revision Table

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production configuration — sab services |
| `docker-compose.dev.yml` | Development — hot reload, dev database |
| `Dockerfile` | App image banane ki recipe |
| `.dockerignore` | COPY mein skip karne wali files |
| Named Volumes | Data persistence — container delete pe bhi safe |
| Bind Mount | Hot reload — host code changes turant reflect |

---

## Aaj Kya Seekha?

1. **Docker Compose** se Express + MongoDB + Redis ek command mein start hota hai
2. **Retry logic** zaroori hai — `depends_on` se service "ready" nahi hoti
3. **Named volumes** se database data persist hota hai container delete ke baad bhi
4. **Development compose** mein bind mount + nodemon = smooth hot reload
5. **Production** aur **development** ke liye alag compose files rakh sakte hain
6. `docker-compose exec` se container ke andar commands chala sakte hain
7. Kal **AWS EC2** pe deploy karna seekhenge!
