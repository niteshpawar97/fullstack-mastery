# Day 34 - Evening Session: Complete CRUD API Practice (Express + MongoDB)

> **Aaj ka plan:**
> Ab complete Products CRUD API banayenge — Express + Mongoose. Har endpoint properly coded, validated, aur tested hoga. Postman ya curl se test karenge!

---

## Project Structure

> **Terminal Command:**
> ```bash
> mkdir kisan-products-api && cd kisan-products-api
> npm init -y
> npm install express mongoose dotenv nodemon
> mkdir config models routes
> touch server.js .env
> touch config/db.js models/Product.js routes/productRoutes.js
> ```

```
kisan-products-api/
  |- server.js          → Main entry point
  |- .env               → Environment variables
  |- config/
  |    |- db.js         → Database connection
  |- models/
  |    |- Product.js    → Product schema & model
  |- routes/
  |    |- productRoutes.js → CRUD routes
```

---

## Step 1: Environment & Database Config

```bash
# .env
MONGODB_URI=mongodb://localhost:27017/kisanProductDB
PORT=3000
NODE_ENV=development
```

```javascript
// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## Step 2: Product Model

```javascript
// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product naam zaroori hai'],
    trim: true,
    minlength: [2, 'Naam kam se kam 2 characters ka ho']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price zaroori hai'],
    min: [0, 'Price negative nahi ho sakta']
  },
  category: {
    type: String,
    required: [true, 'Category zaroori hai'],
    enum: {
      values: ['grain', 'vegetable', 'fruit', 'dairy', 'spice', 'other'],
      message: '{VALUE} valid category nahi hai'
    }
  },
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'quintal', 'litre', 'piece', 'dozen']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock negative nahi ho sakta']
  },
  farmer: {
    type: String,
    required: [true, 'Farmer naam zaroori hai']
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
```

---

## Step 3: Product Routes — Full CRUD

```javascript
// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ============================================
// GET /api/products — Saare products lao
// Supports: ?category=grain&sort=price&page=1&limit=5
// ============================================
router.get('/', async (req, res) => {
  try {
    // Query object banao filtering ke liye
    const queryObj = {};

    // Category filter
    if (req.query.category) {
      queryObj.category = req.query.category;
    }

    // Availability filter
    if (req.query.available) {
      queryObj.isAvailable = req.query.available === 'true';
    }

    // Price range filter
    if (req.query.min_price || req.query.max_price) {
      queryObj.price = {};
      if (req.query.min_price) queryObj.price.$gte = Number(req.query.min_price);
      if (req.query.max_price) queryObj.price.$lte = Number(req.query.max_price);
    }

    // Pagination setup
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting — default by createdAt descending
    const sortBy = req.query.sort || '-createdAt';

    // Database query
    const products = await Product.find(queryObj)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    // Total count for pagination info
    const total = await Product.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Products fetch karne mein error aaya'
    });
  }
});

// ============================================
// GET /api/products/:id — Ek product by ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    // Product nahi mila
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product nahi mila is ID ke saath'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    // Invalid MongoDB ID format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'ID format galat hai'
      });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// POST /api/products — Naya product banao
// ============================================
router.post('/', async (req, res) => {
  try {
    // Mongoose validation automatically chalegi
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product ban gaya!',
      data: product
    });
  } catch (error) {
    // Validation error handle karo
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation fail hui',
        details: messages
      });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// PUT /api/products/:id — Product update karo
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,            // Updated document return karo
        runValidators: true   // Validation check karo
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product nahi mila update karne ke liye'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product update ho gaya!',
      data: product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation fail',
        details: messages
      });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// DELETE /api/products/:id — Product delete karo
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product nahi mila delete karne ke liye'
      });
    }

    res.status(200).json({
      success: true,
      message: `"${product.name}" delete ho gaya!`,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
```

---

## Step 4: Main Server File

```javascript
// server.js
require('dotenv').config(); // .env load karo — sabse pehle!
const express = require('express');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connect karo
connectDB();

// Middleware
app.use(express.json());

// Simple logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Kisan Products API',
    endpoints: {
      getAllProducts: 'GET /api/products',
      getOneProduct: 'GET /api/products/:id',
      createProduct: 'POST /api/products',
      updateProduct: 'PUT /api/products/:id',
      deleteProduct: 'DELETE /api/products/:id'
    }
  });
});

app.use('/api/products', productRoutes);

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route nahi mila' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## Step 5: Testing with curl

> **Terminal Command:**
> ```bash
> # 1. CREATE — Naya product
> curl -X POST http://localhost:3000/api/products \
>   -H "Content-Type: application/json" \
>   -d '{"name":"Organic Gehun","price":2200,"category":"grain","unit":"quintal","stock":100,"farmer":"Ramesh Kumar"}'
>
> # 2. READ — Saare products
> curl http://localhost:3000/api/products
>
> # 3. READ — Filter by category
> curl "http://localhost:3000/api/products?category=grain&sort=-price"
>
> # 4. READ — Ek product (ID copy karo create response se)
> curl http://localhost:3000/api/products/YAHAN_ID_DAALO
>
> # 5. UPDATE — Price change karo
> curl -X PUT http://localhost:3000/api/products/YAHAN_ID_DAALO \
>   -H "Content-Type: application/json" \
>   -d '{"price":2500,"stock":80}'
>
> # 6. DELETE — Product hatao
> curl -X DELETE http://localhost:3000/api/products/YAHAN_ID_DAALO
> ```

> **Tip:**
> Postman GUI tool bhi use kar sakte ho — HTTP requests bhejne ke liye bahut convenient hai. Download karo: https://www.postman.com/

---

## Quick Revision Table

| Operation | HTTP Method | Mongoose Method | Status Code |
|-----------|-------------|----------------|-------------|
| List all | GET | `Product.find()` | 200 |
| Get one | GET | `Product.findById(id)` | 200 / 404 |
| Create | POST | `Product.create(data)` | 201 / 400 |
| Update | PUT | `Product.findByIdAndUpdate()` | 200 / 404 |
| Delete | DELETE | `Product.findByIdAndDelete()` | 200 / 404 |
| Filter | GET + query | `Product.find({ category })` | 200 |
| Pagination | GET + query | `.skip().limit()` | 200 |
| Validation | Auto | Schema validators | 400 |

---

## Aaj Kya Seekha?

1. **Complete CRUD API** banayi Express + Mongoose ke saath — production-ready pattern
2. **Schema validation** se galat data database mein jaane se pehle ruk jaata hai
3. **Query filtering** (`find({ category })`) se users specific data maang sakte hain
4. **Pagination** (skip + limit) se bade datasets handle hote hain efficiently
5. **Error handling** — validation errors (400), not found (404), server errors (500) alag handle
6. **`findByIdAndUpdate` mein `new: true`** dena zaroori hai warna purana document milega
7. **curl / Postman** se API testing professional development ka part hai

> **Practice Time!**
> 5 aur products create karo, filter karo, update karo, delete karo. Kal yehi API SQL backend ke saath banayenge — comparison samjhne ke liye!
