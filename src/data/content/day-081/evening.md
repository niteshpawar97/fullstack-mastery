# Day 81 — Week 12 Revision + Production Setup (Evening Session — Mini Project)

> **Aaj ka plan:**
> Aaj ka mini project — ek existing basic API lenge aur use production-ready banayenge. Tests add karenge, logging setup karenge, health checks lagayenge, clean folder structure mein organize karenge. Poore week ka practical implementation!

---

## Mini Project: Production-Ready Farmer API

Ek basic farmer marketplace API hai — ise production-ready banate hain step by step.

### Starting Point — Basic (Messy) API:

```javascript
// Yeh humara starting code hai — sab kuch ek file mein
// app-basic.js (BEFORE)
const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/farmdb');

// User model
const User = mongoose.model('User', new mongoose.Schema({
  name: String, email: String, password: String, role: String
}));

// Product model
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String, price: Number, farmer: String, stock: Number
}));

app.post('/register', async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});

app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/products', async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

app.listen(3000, () => console.log('running'));
```

> **Warning:**
> Upar wala code production ke liye bilkul ready nahi hai — no error handling, no validation, no logging, no tests, hardcoded values, no security. Ab ise fix karte hain!

---

## Step 1: Folder Structure Setup

```
farmer-api/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── productController.js
│   ├── models/
│   │   ├── User.js
│   │   └── Product.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── healthRoutes.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── authenticate.js
│   │   └── morganMiddleware.js
│   ├── services/
│   │   └── authService.js
│   ├── utils/
│   │   ├── AppError.js
│   │   ├── asyncHandler.js
│   │   └── constants.js
│   └── app.js
├── tests/
│   ├── unit/
│   │   └── utils.test.js
│   ├── integration/
│   │   ├── auth.test.js
│   │   └── product.test.js
│   └── setup.js
├── logs/
├── .env
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── server.js
```

---

## Step 2: Config Files

```javascript
// src/config/env.js — Environment validation
require('dotenv').config();

const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}. Check .env.example`);
  }
}

module.exports = { validateEnv };
```

```javascript
// src/config/database.js — Singleton DB
const mongoose = require('mongoose');
const logger = require('./logger');

class Database {
  constructor() {
    if (Database.instance) return Database.instance;
    this.isConnected = false;
    Database.instance = this;
  }

  async connect(uri) {
    if (this.isConnected) return;

    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    this.isConnected = false;
    logger.info('Database disconnected');
  }

  getStatus() {
    return {
      connected: this.isConnected,
      readyState: mongoose.connection.readyState,
    };
  }
}

module.exports = new Database();
```

```javascript
// src/config/logger.js — Winston Logger
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'farmer-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Tests mein silent karo
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach(t => { t.silent = true; });
}

module.exports = logger;
```

---

## Step 3: Models (Clean)

```javascript
// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,  // query mein password default include na ho
  },
  role: {
    type: String,
    enum: ['admin', 'farmer', 'buyer'],
    default: 'buyer',
  },
}, { timestamps: true });

// Password hash karo save se pehle
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password compare method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

```javascript
// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  category: {
    type: String,
    enum: ['grain', 'vegetable', 'fruit', 'dairy', 'spice'],
    required: true,
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

---

## Step 4: Middleware

```javascript
// src/middleware/errorHandler.js — Global Error Handler
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    statusCode: err.statusCode || 500,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate value — resource already exists',
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal Server Error',
  });
};

module.exports = errorHandler;
```

```javascript
// src/utils/asyncHandler.js — No more try-catch everywhere
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

---

## Step 5: Health Check Routes

```javascript
// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

router.get('/ready', async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const status = dbReady ? 200 : 503;
  res.status(status).json({
    status: dbReady ? 'ready' : 'not ready',
    database: dbReady ? 'connected' : 'disconnected',
  });
});

router.get('/detailed', async (req, res) => {
  const mem = process.memoryUsage();
  const health = {
    status: 'OK',
    uptime: `${Math.floor(process.uptime())}s`,
    memory: { heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB` },
    database: { state: mongoose.connection.readyState === 1 ? 'connected' : 'error' },
    timestamp: new Date().toISOString(),
  };

  if (health.database.state !== 'connected') health.status = 'DEGRADED';
  res.status(health.status === 'OK' ? 200 : 503).json(health);
});

module.exports = router;
```

---

## Step 6: Tests Likho

```javascript
// tests/setup.js
const mongoose = require('mongoose');

beforeAll(async () => {
  const testUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/farmer_test';
  await mongoose.connect(testUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
```

```javascript
// tests/integration/product.test.js
const request = require('supertest');
const app = require('../../src/app');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');

describe('Product API', () => {
  let farmerToken;
  let farmerId;

  beforeEach(async () => {
    // Test farmer register karo
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Farmer', email: 'farmer@test.com', password: 'Test@123', role: 'farmer' });
    farmerToken = res.body.token;
    farmerId = res.body.user._id;
  });

  describe('GET /api/products', () => {
    it('should return empty array initially', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/products', () => {
    it('should create product with valid data', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ name: 'Gehun', price: 2500, stock: 100, category: 'grain' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe('Gehun');
    });

    it('should reject product without auth', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Gehun', price: 2500 });

      expect(res.statusCode).toBe(401);
    });

    it('should reject product with missing fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ name: 'Gehun' }); // price missing

      expect(res.statusCode).toBe(400);
    });
  });
});
```

```javascript
// tests/integration/health.test.js — Health check tests
const request = require('supertest');
const app = require('../../src/app');

describe('Health Check Endpoints', () => {
  it('GET /health/live — should return alive', async () => {
    const res = await request(app).get('/health/live');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('alive');
  });

  it('GET /health/ready — should return ready when DB connected', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('GET /health/detailed — should return system info', async () => {
    const res = await request(app).get('/health/detailed');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('memory');
    expect(res.body).toHaveProperty('database');
  });
});
```

---

## Step 7: App Assembly

```javascript
// src/app.js — Clean Express Setup
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Security Middleware ---
app.use(helmet());
app.use(cors());

// --- Body Parser ---
app.use(express.json({ limit: '10kb' }));

// --- HTTP Logging ---
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// --- Routes ---
app.use('/health', require('./routes/healthRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));

// --- 404 Handler ---
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// --- Global Error Handler ---
app.use(errorHandler);

module.exports = app;
```

```javascript
// server.js — Entry Point
require('dotenv').config();
const { validateEnv } = require('./src/config/env');
const logger = require('./src/config/logger');
const database = require('./src/config/database');
const app = require('./src/app');

validateEnv();

const PORT = process.env.PORT || 3000;

database.connect(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM — graceful shutdown');
  await database.disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', { error: err.message });
  process.exit(1);
});
```

---

## Final Checklist — Kya Kya Add Kiya?

| Feature | Status | File |
|---------|--------|------|
| Clean folder structure | Done | MVC + services |
| Winston logging | Done | src/config/logger.js |
| Morgan HTTP logs | Done | src/app.js |
| Health checks | Done | src/routes/healthRoutes.js |
| Error handler | Done | src/middleware/errorHandler.js |
| Input validation | Done | Models + middleware |
| Unit tests | Done | tests/unit/ |
| API tests | Done | tests/integration/ |
| Security (helmet, cors) | Done | src/app.js |
| Env validation | Done | src/config/env.js |
| Graceful shutdown | Done | server.js |
| Singleton DB | Done | src/config/database.js |

---

## Quick Revision Table

| Step | Kya Kiya | Key Files |
|------|---------|-----------|
| Structure | MVC folders | src/config, controllers, models, routes |
| Logging | Winston + Morgan | config/logger.js, app.js |
| Health | /live, /ready, /detailed | routes/healthRoutes.js |
| Errors | Global handler + AppError | middleware/errorHandler.js |
| Tests | Jest + Supertest | tests/integration/*.test.js |
| Security | Helmet, CORS, validation | app.js, models |
| Deploy | Env validation, graceful shutdown | server.js, config/env.js |

---

## Aaj Kya Seekha?

1. Basic messy API ko production-ready banana — step by step
2. Clean folder structure mein organize karna
3. Logging, health checks, error handling add karna
4. Tests likhna — unit + integration
5. Security middleware lagana — helmet, cors
6. Graceful shutdown implement karna
7. Poore Week 12 ke concepts ek project mein combine karna

> **Yaad Rakho:**
> Production-ready matlab sirf code nahi — security, logging, monitoring, testing, error handling, documentation — sab milke ek professional API banti hai. Ab tum production-ready developer ho!

> **Practice Time!**
> Apne kisi bhi purane project ko upar ki checklist se check karo. Jo missing hai woh add karo. Target: sab checkboxes green!
