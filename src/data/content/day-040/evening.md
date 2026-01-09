# Day 40 Evening: Practice — Auth Middleware + Protected CRUD Routes

> **Aaj ka plan:** Ab hum apne existing auth system mein reusable auth middleware add karenge, CRUD routes protect karenge, role-based access test karenge, aur har scenario Postman se verify karenge.

---

## Project Structure Update

Kal ka project continue karo. Naye files add karo:

```
auth-system/
├── .env
├── server.js
├── config/
│   └── db.js
├── models/
│   ├── User.js
│   └── Product.js          ← NEW
├── routes/
│   ├── auth.js
│   └── product.js          ← NEW
└── middleware/
    ├── auth.js              ← NEW
    └── roleCheck.js
```

> **Terminal Command:**
```bash
touch models/Product.js routes/product.js middleware/auth.js
```

---

## Step 1: Auth Middleware File

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Header se token nikalo
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token nahi mila! Login karke token lo.'
      });
    }

    // "Bearer xyz..." se sirf "xyz..." nikalo
    const token = authHeader.split(' ')[1];

    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User database se nikalo (fresh data + password hatao)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token ka user exist nahi karta!'
      });
    }

    // User ko request mein attach karo
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expire ho gaya! Dubara login karo.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalid hai! Sahi token do.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Auth error!',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
```

---

## Step 2: Product Model

```javascript
// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product ka naam do'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price do'],
    min: [0, 'Price negative nahi ho sakta']
  },
  category: {
    type: String,
    required: [true, 'Category do'],
    enum: ['seeds', 'fertilizer', 'equipment', 'pesticide']
  },
  description: {
    type: String,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',           // Kis user ne banaya — reference
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

---

## Step 3: Protected Product Routes

```javascript
// routes/product.js
const express = require('express');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleCheck');

const router = express.Router();

// ---- GET ALL PRODUCTS (PUBLIC — koi bhi dekh sakta hai) ----
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('createdBy', 'name email')  // Sirf naam aur email laao creator ka
      .sort('-createdAt');

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---- GET SINGLE PRODUCT (PUBLIC) ----
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product nahi mila!'
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---- CREATE PRODUCT (Login zaroori — admin/moderator only) ----
router.post('/',
  authMiddleware,                              // Pehle: kaun hai?
  authorizeRoles('admin', 'moderator'),        // Phir: permission hai?
  async (req, res) => {
    try {
      const { name, price, category, description } = req.body;

      const product = await Product.create({
        name,
        price,
        category,
        description,
        createdBy: req.user._id  // Logged-in user ki ID — middleware se aati hai
      });

      res.status(201).json({
        success: true,
        message: 'Product created!',
        product
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ---- UPDATE PRODUCT (admin/moderator only) ----
router.put('/:id',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product nahi mila!' });
      }

      res.json({
        success: true,
        message: 'Product updated!',
        product
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ---- DELETE PRODUCT (admin ONLY) ----
router.delete('/:id',
  authMiddleware,
  authorizeRoles('admin'),  // Sirf admin delete kar sakta hai
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product nahi mila!' });
      }

      res.json({
        success: true,
        message: 'Product deleted!'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ---- MY PRODUCTS (logged-in user ke products) ----
router.get('/my/products',
  authMiddleware,  // Koi bhi logged-in user
  async (req, res) => {
    try {
      const products = await Product.find({ createdBy: req.user._id });
      res.json({
        success: true,
        count: products.length,
        products
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
```

---

## Step 4: Server Mein Routes Add Karo

```javascript
// server.js — update karo
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');  // NEW

const app = express();
app.use(express.json());

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);  // NEW

app.get('/', (req, res) => {
  res.json({ message: 'Auth + Products API chal rahi hai!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Postman Se Test — Har Scenario

### Test 1: Public Route (No Token Needed)
```
GET http://localhost:3000/api/products
→ 200 OK — sab products dikhenge (chahe login ho ya nahi)
```

### Test 2: Create Product Without Login
```
POST http://localhost:3000/api/products
Body: { "name": "Urea", "price": 500, "category": "fertilizer" }
→ 401: "Token nahi mila! Login karke token lo."
```

### Test 3: Create Product as Normal User
```
POST http://localhost:3000/api/products
Headers: Authorization: Bearer <user-ka-token>
Body: { "name": "Urea", "price": 500, "category": "fertilizer" }
→ 403: "Role 'user' ko ye access nahi hai."
```

### Test 4: Create Product as Admin
```
POST http://localhost:3000/api/products
Headers: Authorization: Bearer <admin-ka-token>
Body: { "name": "Urea", "price": 500, "category": "fertilizer" }
→ 201: Product created!
```

### Test 5: Delete Product as Moderator
```
DELETE http://localhost:3000/api/products/<product-id>
Headers: Authorization: Bearer <moderator-ka-token>
→ 403: "Role 'moderator' ko ye access nahi hai."
(Sirf admin delete kar sakta hai!)
```

### Test 6: Expired Token
```
(1 second expiry ka token banao aur 2 sec baad use karo)
→ 401: "Token expire ho gaya! Dubara login karo."
```

### Test 7: Tampered Token
```
(Token mein kuch characters change karo)
→ 401: "Token invalid hai! Sahi token do."
```

> **Practice Time!** Ye exercises try karo:
> 1. Ek naya role `seller` add karo jo products create kar sake lekin delete na kar sake
> 2. User apna khud ka product hi update/delete kar sake (ownership check)
> 3. Ek route banao `/api/auth/change-password` (old + new password)
> 4. Token ke expiry ko 10 seconds rakh ke test karo

---

## Access Control Summary

| Route | Method | Auth? | Roles |
|-------|--------|-------|-------|
| `/api/products` | GET | No | Public |
| `/api/products/:id` | GET | No | Public |
| `/api/products` | POST | Yes | admin, moderator |
| `/api/products/:id` | PUT | Yes | admin, moderator |
| `/api/products/:id` | DELETE | Yes | admin only |
| `/api/products/my/products` | GET | Yes | Any logged-in |
| `/api/auth/register` | POST | No | Public |
| `/api/auth/login` | POST | No | Public |
| `/api/auth/users` | GET | Yes | admin only |

---

## Quick Revision Table

| Concept | Implementation |
|---------|---------------|
| Auth middleware | Token extract → verify → find user → req.user |
| Role middleware | Check req.user.role against allowed roles |
| Middleware order | authMiddleware → authorizeRoles → handler |
| Public routes | No middleware needed |
| Protected routes | authMiddleware required |
| Admin routes | authMiddleware + authorizeRoles('admin') |
| createdBy field | req.user._id se automatic set hota hai |
| populate() | Related user ki info laata hai |

---

## Aaj Kya Seekha?

1. **Auth middleware** ek baar likho — har route pe reuse karo
2. **Middleware chain** ka order important hai — auth pehle, role baad mein
3. **Public routes** pe koi middleware nahi lagta
4. **Protected routes** pe `authMiddleware` lagao
5. **Admin routes** pe `authMiddleware` + `authorizeRoles('admin')` lagao
6. **req.user** se logged-in user ki info milti hai middleware ke baad

> **Kal ka preview:** Kal hum API validation seekhenge Joi library ke saath — input data ko validate karna aur global error handler banana!
