# Day 80 — Clean Code & Folder Structure (Morning Session)

> **Aaj ka plan:**
> Aaj hum seekhenge clean code kaise likhte hain — meaningful names, small functions, DRY principle, code smells pehchanana, refactoring techniques, aur professional project folder structure.

---

## Clean Code Kyu Zaroori Hai?

Socho tumne 6 mahine pehle code likha tha. Aaj wapas dekhte ho — kuch samajh nahi aa raha. Variable names `x`, `temp`, `data` hain. Functions 200 lines ke hain. Koi comments nahi. Yeh "dirty code" hai.

> **Socho Aise:**
> Code ek baar likhte ho, par 100 baar padhte ho. Jaise ghar saaf rakhoge toh cheezein dhundhna aasan. Ganda ghar = sab kuch khoye mein. Ganda code = sab kuch debug mein.

### Clean Code Ka Rule:
> "Code aise likho jaise ise woh padhega jo tumhare baad aayega — aur woh ek gusse wala developer hai jo tumhara address jaanta hai." — Robert C. Martin

---

## Principle 1: Meaningful Names

### Bad Names vs Good Names:

```javascript
// BAD — kya hai 'd'? 'temp'? 'data'?
const d = new Date();
const temp = users.filter(u => u.a === true);
function process(data) { /* kya process? */ }
const arr = [];
const flag = true;

// GOOD — naam se pata chale kya hai
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive === true);
function calculateOrderTotal(orderItems) { /* clear! */ }
const pendingOrders = [];
const isUserAuthenticated = true;
```

### Naming Rules:

| Rule | Bad | Good |
|------|-----|------|
| **Variables** — nouns use karo | `d`, `x` | `currentDate`, `totalPrice` |
| **Booleans** — is/has/can se shuru | `flag`, `check` | `isActive`, `hasPermission` |
| **Functions** — verbs use karo | `data()`, `user()` | `fetchData()`, `createUser()` |
| **Constants** — UPPER_CASE | `maxRetry` | `MAX_RETRY_COUNT` |
| **Classes** — PascalCase | `user_factory` | `UserFactory` |

> **Yaad Rakho:**
> Naam lamba hone se daro mat. `calculateMonthlyRevenue()` bahut behtar hai `calc()` se. IDE auto-complete kar dega!

---

## Principle 2: Small Functions — Ek Kaam, Ek Function

```javascript
// BAD — ek function mein sab kuch (200+ lines)
async function handleOrder(req, res) {
  // validate input
  if (!req.body.items) return res.status(400).json({error: 'Items required'});
  if (!req.body.address) return res.status(400).json({error: 'Address required'});

  // calculate total
  let total = 0;
  for (const item of req.body.items) {
    const product = await Product.findById(item.id);
    total += product.price * item.quantity;
  }

  // apply discount
  if (total > 5000) total = total * 0.9;

  // check inventory
  for (const item of req.body.items) {
    const product = await Product.findById(item.id);
    if (product.stock < item.quantity) {
      return res.status(400).json({error: `${product.name} out of stock`});
    }
  }

  // create order
  const order = await Order.create({ ...req.body, total });

  // send email
  await sendEmail(req.user.email, 'Order placed!');

  // update inventory
  for (const item of req.body.items) {
    await Product.updateOne({_id: item.id}, {$inc: {stock: -item.quantity}});
  }

  res.json(order);
}
```

```javascript
// GOOD — chhote focused functions
async function handleOrder(req, res, next) {
  try {
    validateOrderInput(req.body);                          // Step 1: Validate
    const total = await calculateOrderTotal(req.body.items); // Step 2: Calculate
    const discountedTotal = applyDiscount(total);           // Step 3: Discount
    await checkInventory(req.body.items);                   // Step 4: Check stock
    const order = await createOrder(req.body, discountedTotal); // Step 5: Create
    await processPostOrderTasks(order, req.user);          // Step 6: Post tasks
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

// Har function ek kaam karta hai — easy to read, test, debug!
function validateOrderInput(body) {
  if (!body.items || body.items.length === 0) {
    throw new AppError('Items are required', 400);
  }
  if (!body.address) {
    throw new AppError('Delivery address is required', 400);
  }
}

async function calculateOrderTotal(items) {
  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.id);
    total += product.price * item.quantity;
  }
  return total;
}

function applyDiscount(total) {
  const DISCOUNT_THRESHOLD = 5000;
  const DISCOUNT_PERCENT = 10;
  if (total > DISCOUNT_THRESHOLD) {
    return total * (1 - DISCOUNT_PERCENT / 100);
  }
  return total;
}
```

> **Tip:**
> Ek function 20-30 lines se zyada nahi hona chahiye. Agar zyada hai toh chhote functions mein todo.

---

## Principle 3: DRY, KISS, YAGNI

### DRY — Don't Repeat Yourself

```javascript
// BAD — same logic 3 jagah repeat ho raha
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

app.get('/api/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// GOOD — common logic extract karo
const findByIdOr404 = (Model, modelName) => async (req, res, next) => {
  const doc = await Model.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: `${modelName} not found` });
  req.doc = doc;
  next();
};

app.get('/api/users/:id', findByIdOr404(User, 'User'), (req, res) => res.json(req.doc));
app.get('/api/products/:id', findByIdOr404(Product, 'Product'), (req, res) => res.json(req.doc));
```

### KISS — Keep It Simple, Stupid

```javascript
// BAD — over-engineered
function isEven(num) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(num % 2 === 0 ? true : false);
    }, 0);
  });
}

// GOOD — simple!
function isEven(num) {
  return num % 2 === 0;
}
```

### YAGNI — You Aren't Gonna Need It

```javascript
// BAD — features jo abhi chahiye hi nahi
class User {
  constructor(name) {
    this.name = name;
    this.socialMediaLinks = {};      // abhi nahi chahiye
    this.blogPosts = [];             // abhi nahi chahiye
    this.followers = [];             // abhi nahi chahiye
    this.achievements = [];          // abhi nahi chahiye
    this.virtualCurrency = 0;       // abhi nahi chahiye
  }
}

// GOOD — sirf jo chahiye wahi likho
class User {
  constructor(name, email, role) {
    this.name = name;
    this.email = email;
    this.role = role;
  }
}
// Baad mein zaroorat pade toh add karo
```

---

## Code Smells — Bure Code Ki Pehchaan

| Smell | Sign | Fix |
|-------|------|-----|
| **Long Function** | 50+ lines | Chhote functions mein todo |
| **God Object** | Ek class sab kuch karti | Responsibilities alag karo |
| **Magic Numbers** | `if (role === 3)` | Constants use karo: `ROLE_ADMIN = 3` |
| **Deep Nesting** | 4+ levels of if/for | Early return, extract functions |
| **Duplicate Code** | Same code 2+ jagah | DRY — extract karo |
| **Long Parameter List** | 5+ parameters | Object pass karo |
| **Dead Code** | Commented/unused code | Delete karo (git mein hai) |

### Deep Nesting Fix:

```javascript
// BAD — 4 levels deep
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.role === 'admin') {
        if (user.permissions.includes('delete')) {
          // actual logic yahan hai — 4 levels andar!
          return deleteUser(user);
        }
      }
    }
  }
  return null;
}

// GOOD — early return (Guard Clauses)
function processUser(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (user.role !== 'admin') return null;
  if (!user.permissions.includes('delete')) return null;

  return deleteUser(user);  // flat code — easy to read!
}
```

---

## Project Folder Structure

### MVC Pattern (Traditional):

```
project/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # DB connection
│   │   ├── logger.js        # Winston logger
│   │   └── index.js         # All config export
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   └── orderController.js
│   ├── models/              # Database schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/              # Route definitions
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── index.js         # All routes combine
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── services/            # Business logic
│   │   ├── authService.js
│   │   └── orderService.js
│   ├── utils/               # Helper functions
│   │   ├── apiError.js
│   │   ├── sendEmail.js
│   │   └── validators.js
│   ├── events/              # Event listeners
│   │   └── orderEvents.js
│   └── app.js               # Express app setup
├── tests/                   # All tests
│   ├── unit/
│   └── integration/
├── logs/                    # Log files (gitignored)
├── .env                     # Environment variables
├── .env.example             # Example env (committed)
├── .gitignore
├── package.json
├── jest.config.js
└── server.js                # Entry point
```

### Barrel Exports — Clean Imports:

```javascript
// routes/index.js — sab routes ek jagah se export
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');

module.exports = { authRoutes, productRoutes, orderRoutes };

// app.js mein clean import
const { authRoutes, productRoutes, orderRoutes } = require('./routes');
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
```

---

## Environment Separation

```javascript
// .env.example (commit karo — template hai)
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/myapp
JWT_SECRET=your-secret-here
LOG_LEVEL=info

// .env (NEVER commit — .gitignore mein daalo)
// .env.test (test environment)
// .env.production (production environment)
```

> **Warning:**
> `.env` file kabhi git mein push mat karo! `.env.example` commit karo taaki doosre developers ko pata chale kya variables chahiye.

---

## Quick Revision Table

| Principle | Kya Hai | Rule |
|-----------|---------|------|
| Meaningful Names | Naam se kaam pata chale | `isActive` not `flag` |
| Small Functions | Ek kaam, ek function | Max 20-30 lines |
| DRY | Repeat mat karo | Extract common logic |
| KISS | Simple rakho | Over-engineer mat karo |
| YAGNI | Zaroorat nahi toh mat likho | Features tab banao jab chahiye |
| Guard Clauses | Early return | Deep nesting hatao |
| Barrel Exports | Ek file se sab export | Clean imports |

---

## Aaj Kya Seekha?

1. Meaningful variable aur function names likhna
2. Bade functions ko chhote mein todna — separation of concerns
3. DRY, KISS, YAGNI principles follow karna
4. Code smells pehchanna aur fix karna
5. Guard clauses se deep nesting hatana
6. Professional project folder structure (MVC pattern)
7. Barrel exports aur environment separation

> **Practice Time!**
> Evening session mein hum messy code refactor karenge aur proper project structure banayenge!
