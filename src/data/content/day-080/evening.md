# Day 80 — Clean Code & Folder Structure (Evening Session — Practice)

> **Aaj ka plan:**
> Ab hands-on practice — messy code examples refactor karenge, proper folder structure mein organize karenge, aur ek project template/boilerplate banayenge.

---

## Practice 1: Messy Code Refactor — Controller

### BEFORE (Messy):

```javascript
// BAD — sab kuch ek function mein, no error handling, magic numbers, bad names
app.post('/api/o', async (req, res) => {
  var d = req.body;
  if(!d.items) { res.json({err: 'no items'}); }
  if(!d.addr) { res.json({err: 'no addr'}); }
  var t = 0;
  for(var i=0; i<d.items.length; i++) {
    var p = await Product.findById(d.items[i].pid);
    t = t + (p.price * d.items[i].q);
    if(p.stock < d.items[i].q) { res.json({err: 'no stock'}); }
    await Product.updateOne({_id: d.items[i].pid}, {$inc: {stock: -d.items[i].q}});
  }
  if(t > 5000) { t = t - (t * 0.1); }
  if(t > 10000) { t = t - (t * 0.15); }
  var o = new Order({items: d.items, total: t, addr: d.addr, user: req.user._id, status: 1});
  await o.save();
  await sendEmail(req.user.email, 'done', '<h1>Order placed</h1>');
  res.json({ok: true, order: o});
});
```

### AFTER (Clean):

```javascript
// controllers/orderController.js — Clean, readable, maintainable

const Order = require('../models/Order');
const { validateOrderInput } = require('../utils/validators');
const { calculateOrderTotal, applyBestDiscount } = require('../services/pricingService');
const { checkAndUpdateInventory } = require('../services/inventoryService');
const eventBus = require('../events/eventBus');
const AppError = require('../utils/AppError');

/**
 * Place a new order
 * POST /api/orders
 */
exports.placeOrder = async (req, res, next) => {
  try {
    // Step 1: Validate input
    const { items, deliveryAddress } = validateOrderInput(req.body);

    // Step 2: Check inventory and reserve stock
    await checkAndUpdateInventory(items);

    // Step 3: Calculate total with best discount
    const subtotal = await calculateOrderTotal(items);
    const totalAmount = applyBestDiscount(subtotal);

    // Step 4: Create order
    const order = await Order.create({
      items,
      totalAmount,
      deliveryAddress,
      user: req.user._id,
      status: 'confirmed',
    });

    // Step 5: Emit event — listeners handle email, analytics, etc.
    eventBus.emit('order:placed', { order, user: req.user });

    // Step 6: Send response
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
```

```javascript
// services/pricingService.js — Pricing logic alag
const Product = require('../models/Product');

const DISCOUNT_TIERS = [
  { threshold: 10000, percent: 15 },  // 10K+ pe 15% off
  { threshold: 5000, percent: 10 },   // 5K+ pe 10% off
];

async function calculateOrderTotal(items) {
  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new AppError(`Product not found: ${item.productId}`, 404);
    }
    total += product.price * item.quantity;
  }
  return total;
}

function applyBestDiscount(total) {
  for (const tier of DISCOUNT_TIERS) {
    if (total >= tier.threshold) {
      const discount = total * (tier.percent / 100);
      return total - discount;
    }
  }
  return total;  // koi discount nahi
}

module.exports = { calculateOrderTotal, applyBestDiscount };
```

```javascript
// utils/validators.js — Validation alag
const AppError = require('./AppError');

function validateOrderInput(body) {
  const { items, deliveryAddress } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must contain at least one item', 400);
  }

  if (!deliveryAddress || !deliveryAddress.city) {
    throw new AppError('Delivery address with city is required', 400);
  }

  // Har item validate karo
  for (const item of items) {
    if (!item.productId) throw new AppError('Product ID is required for each item', 400);
    if (!item.quantity || item.quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }
  }

  return { items, deliveryAddress };
}

module.exports = { validateOrderInput };
```

> **Yaad Rakho:**
> Refactoring ka goal — code ka behavior same rahe, par structure better ho. Tests pehle likho, phir refactor karo — confidence rahega ki kuch toota nahi.

---

## Practice 2: Messy Utility Functions Refactor

### BEFORE:

```javascript
// BAD — ek file mein sab kuch
function fmt(d) {
  return d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
}
function chk(e) {
  var r = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return r.test(e);
}
function calc(a, b, t) {
  if(t == 'add') return a+b;
  if(t == 'sub') return a-b;
  if(t == 'mul') return a*b;
  if(t == 'div') { if(b==0) return 'error'; return a/b; }
}
function rnd(n) { return Math.floor(Math.random() * n) + 1; }
module.exports = { fmt, chk, calc, rnd };
```

### AFTER:

```javascript
// utils/dateUtils.js — Date related utilities
/**
 * Format date to DD/MM/YYYY string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('Invalid date provided');
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

module.exports = { formatDate };
```

```javascript
// utils/validationUtils.js — Validation utilities
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check if email format is valid
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

module.exports = { isValidEmail };
```

```javascript
// utils/mathUtils.js — Math utilities
const OPERATIONS = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => {
    if (b === 0) throw new Error('Division by zero is not allowed');
    return a / b;
  },
};

/**
 * Perform arithmetic operation
 * @param {number} a — first operand
 * @param {number} b — second operand
 * @param {string} operation — 'add' | 'subtract' | 'multiply' | 'divide'
 * @returns {number}
 */
function calculate(a, b, operation) {
  const operationFn = OPERATIONS[operation];
  if (!operationFn) {
    throw new Error(`Unknown operation: ${operation}. Valid: ${Object.keys(OPERATIONS).join(', ')}`);
  }
  return operationFn(a, b);
}

/**
 * Generate random integer between 1 and max (inclusive)
 * @param {number} max
 * @returns {number}
 */
function randomInteger(max) {
  if (max < 1) throw new Error('Max must be at least 1');
  return Math.floor(Math.random() * max) + 1;
}

module.exports = { calculate, randomInteger };
```

```javascript
// utils/index.js — Barrel export
const { formatDate } = require('./dateUtils');
const { isValidEmail } = require('./validationUtils');
const { calculate, randomInteger } = require('./mathUtils');

module.exports = {
  formatDate,
  isValidEmail,
  calculate,
  randomInteger,
};
```

---

## Practice 3: Project Boilerplate Template

Production-ready project structure banate hain:

```
farmer-api/
├── src/
│   ├── config/
│   │   ├── database.js           # Singleton DB connection
│   │   ├── logger.js             # Winston logger
│   │   ├── env.js                # Environment validation
│   │   └── index.js              # Barrel export
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── healthController.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── healthRoutes.js
│   │   └── index.js              # Route combiner
│   │
│   ├── middleware/
│   │   ├── authenticate.js       # JWT auth check
│   │   ├── authorize.js          # Role-based access
│   │   ├── errorHandler.js       # Global error handler
│   │   ├── validate.js           # Request validation
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── morganMiddleware.js   # HTTP logging
│   │
│   ├── services/
│   │   ├── authService.js        # Auth business logic
│   │   ├── emailService.js       # Email sending
│   │   ├── pricingService.js     # Price calculation
│   │   └── inventoryService.js   # Stock management
│   │
│   ├── utils/
│   │   ├── AppError.js           # Custom error class
│   │   ├── asyncHandler.js       # Try-catch wrapper
│   │   ├── validators.js         # Input validators
│   │   ├── constants.js          # App constants
│   │   └── index.js              # Barrel export
│   │
│   ├── events/
│   │   ├── eventBus.js           # Singleton event emitter
│   │   └── listeners/
│   │       ├── orderListeners.js
│   │       └── userListeners.js
│   │
│   ├── factories/
│   │   ├── userFactory.js
│   │   └── notificationFactory.js
│   │
│   └── app.js                    # Express app setup
│
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   └── validators.test.js
│   │   └── services/
│   │       └── pricingService.test.js
│   ├── integration/
│   │   ├── auth.test.js
│   │   └── product.test.js
│   ├── fixtures/
│   │   └── testData.js
│   └── setup.js                  # Test DB setup/teardown
│
├── logs/                          # Gitignored!
├── .env                           # Gitignored!
├── .env.example                   # Template — committed
├── .env.test                      # Test environment
├── .gitignore
├── .eslintrc.js                   # Code linting rules
├── jest.config.js                 # Test configuration
├── package.json
├── server.js                      # Entry point
└── README.md
```

### Key Files Content:

```javascript
// src/config/env.js — Environment validation
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'];

function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { validateEnv };
```

```javascript
// src/utils/asyncHandler.js — Try-catch wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

```javascript
// src/utils/AppError.js — Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;  // operational vs programming error
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

```javascript
// src/utils/constants.js — No magic numbers!
module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'admin',
    FARMER: 'farmer',
    BUYER: 'buyer',
  },

  // Order statuses
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // JWT
  JWT_EXPIRE: '7d',
  COOKIE_EXPIRE: 7,  // days
};
```

```javascript
// server.js — Entry point (simple!)
require('dotenv').config();
const { validateEnv } = require('./src/config/env');
const logger = require('./src/config/logger');
const database = require('./src/config/database');
const app = require('./src/app');

// Step 1: Validate environment
validateEnv();

// Step 2: Connect database
const PORT = process.env.PORT || 3000;

database.connect(process.env.MONGODB_URI)
  .then(() => {
    // Step 3: Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  })
  .catch((error) => {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});
```

---

## Practice 4: .gitignore Template

```
# Dependencies
node_modules/

# Environment files
.env
.env.local
.env.production

# Logs
logs/
*.log

# Coverage reports
coverage/

# Build output
dist/
build/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Temporary
tmp/
temp/
```

---

## Quick Revision Table

| Practice | Kya Kiya | Key Principle |
|----------|---------|---------------|
| Controller Refactor | 1 big fn -> 6 small fns | Single Responsibility |
| Utils Refactor | 1 file -> 4 focused files | Separation of Concerns |
| Folder Structure | Full project template | MVC + Services + Events |
| Config Files | env.js, constants.js | No magic, validate early |
| Entry Point | server.js | Simple, sequential start |

---

## Aaj Kya Seekha?

1. Messy controller ko clean functions mein todna
2. Utility functions ko alag files mein organize karna
3. Barrel exports se clean imports banana
4. Professional folder structure — MVC + services + events
5. Constants file se magic numbers hatana
6. AsyncHandler se try-catch duplication hatana
7. Graceful shutdown implement karna

> **Practice Time!**
> Apne existing project ko aaj ki folder structure mein reorganize karo. Constants file banao, barrel exports lagao, aur server.js clean karo!
