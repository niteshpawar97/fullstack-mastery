# Day 88 Evening: Start Building — Project Setup, Models, Auth & Core APIs

> **Aaj ka plan:** Ab coding shuru! Project setup karenge (Express + MongoDB + React), database models banayenge, auth system complete karenge, aur core product APIs likhenge. Let's build KisanMart!

---

## Task 1: Backend Setup

> **Terminal Command:**
```bash
# Backend folder mein jao
cd kisanmart/backend

# package.json init (agar nahi kiya toh)
npm init -y

# Dependencies install karo
npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer cloudinary express-rate-limit helmet morgan socket.io
npm install -D nodemon
```

### `backend/.env`

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kisanmart
JWT_SECRET=kisanmart_super_secret_key_2026
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

### `backend/server.js`

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);  // Socket.io ke liye HTTP server

// Middleware
app.use(helmet());                           // Security headers
app.use(cors({ origin: 'http://localhost:5173' }));  // React dev server
app.use(express.json({ limit: '10mb' }));    // JSON body parse
app.use(morgan('dev'));                       // Request logging

// MongoDB connect karo
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('MongoDB error:', err));

// Routes mount karo
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KisanMart API is running!' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`KisanMart server running on port ${PORT}`);
});

module.exports = { app, server };  // Export for Socket.io setup
```

---

## Task 2: Database Models

### `backend/models/User.js`

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Naam zaroori hai!'],
    trim: true,
    maxlength: [50, 'Naam 50 characters se zyada nahi ho sakta'],
  },
  email: {
    type: String,
    required: [true, 'Email zaroori hai!'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Valid email daalo!'],
  },
  password: {
    type: String,
    required: [true, 'Password zaroori hai!'],
    minlength: [6, 'Password minimum 6 characters!'],
    select: false,  // Default mein password nahi aayega queries mein
  },
  role: {
    type: String,
    enum: ['user', 'seller', 'admin'],
    default: 'user',
  },
  phone: { type: String },
  avatar: { type: String, default: '' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Password hash karo save se pehle
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password match check karo
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JWT token generate karo
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', userSchema);
```

### `backend/models/Product.js`

```javascript
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product ka naam zaroori hai!'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description zaroori hai!'],
    maxlength: [1000, 'Description 1000 characters tak!'],
  },
  price: {
    type: Number,
    required: [true, 'Price zaroori hai!'],
    min: [0, 'Price negative nahi ho sakta!'],
  },
  category: {
    type: String,
    required: [true, 'Category zaroori hai!'],
    enum: ['Grains', 'Fruits', 'Vegetables', 'Dairy', 'Spices', 'Other'],
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock negative nahi ho sakta!'],
    default: 0,
  },
  images: [{
    type: String,  // Cloudinary URLs
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Text index for search
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
```

### `backend/models/Order.js`

```javascript
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
    image: String,
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    default: 'cod',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
```

> **Yaad Rakho:** Models mein validation rules dalo — required, minlength, enum, custom messages. Ye first line of defense hai — galat data database mein nahi jaana chahiye!

---

## Task 3: Auth System

### `backend/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect — token verify karo
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Login zaroori hai!' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User nahi mila!' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid ya expired!' });
  }
};

// Authorize — role check karo
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `${req.user.role} role allowed nahi hai!`
    });
  }
  next();
};
```

### `backend/controllers/authController.js`

```javascript
const User = require('../models/User');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered!' });
    }

    // User create karo
    const user = await User.create({ name, email, password, phone, role: role || 'user' });

    // Token generate karo
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email aur password dono daalo!' });
    }

    // User dhundho + password include karo
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ya password galat hai!' });
    }

    // Password match karo
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email ya password galat hai!' });
    }

    // Active check
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated hai!' });
    }

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me — Current user profile
exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};
```

### `backend/routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
```

---

## Task 4: Product CRUD APIs

### `backend/controllers/productController.js`

```javascript
const Product = require('../models/Product');

// GET /api/products — List + Search + Filter + Sort + Pagination
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, sort = '-createdAt', minPrice, maxPrice } = req.query;

    const filter = { isActive: true };
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('seller', 'name')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products — Create product (seller/admin)
exports.createProduct = async (req, res) => {
  try {
    req.body.seller = req.user._id;  // Logged in user = seller
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id — Update product
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product nahi mila!' });

    // Owner ya admin hi update kar sakta hai
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Ye tumhara product nahi hai!' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product nahi mila!' });

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied!' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

### `backend/routes/products.js`

```javascript
const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/:id', async (req, res) => {
  const product = await require('../models/Product').findById(req.params.id).populate('seller', 'name');
  if (!product) return res.status(404).json({ success: false, message: 'Product nahi mila!' });
  res.json({ success: true, data: product });
});
router.post('/', protect, authorize('seller', 'admin'), createProduct);
router.put('/:id', protect, authorize('seller', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
```

---

## Task 5: Test Karo

> **Terminal Command:**
```bash
# Backend start karo
cd backend
npx nodemon server.js

# Doosra terminal — frontend start karo
cd frontend
npm run dev
```

### Postman Tests:

```
1. POST /api/auth/register → User create karo
2. POST /api/auth/login → Token lo
3. GET /api/auth/me → Profile check karo
4. POST /api/products → Product create karo (with token)
5. GET /api/products → Products list dekho
6. PUT /api/products/:id → Product update karo
7. DELETE /api/products/:id → Product delete karo
```

---

## Quick Revision Table

| Task | Files Created | Status |
|------|--------------|--------|
| Server setup | `server.js`, `.env` | Done |
| User model | `models/User.js` | Done |
| Product model | `models/Product.js` | Done |
| Order model | `models/Order.js` | Done |
| Auth middleware | `middleware/auth.js` | Done |
| Auth APIs | `controllers/authController.js`, `routes/auth.js` | Done |
| Product APIs | `controllers/productController.js`, `routes/products.js` | Done |

---

## Aaj Kya Seekha?

1. **Project setup** — Express + MongoDB + React properly configure kiya
2. **Database models** — User, Product, Order with validations aur methods
3. **Auth system** — Register, Login, JWT, protect middleware, role-based access
4. **Product CRUD** — Create, Read (with search/filter/pagination), Update, Delete
5. **Owner check** — Sirf product owner ya admin hi update/delete kar sakta hai
6. **Git workflow** — Proper branch strategy aur commit messages

> **Practice Time!** Sab APIs Postman se test karo. Kal hum orders, file upload, WebSocket, frontend, Docker, aur deployment karenge. Final push!
