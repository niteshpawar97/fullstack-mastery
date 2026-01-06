# Day 37 - Evening Session: Mini Project — "Kisan Market API"

> **Aaj ka plan:**
> Saara Week 6 ka knowledge ek project mein lagayenge! "Kisan Market API" — CRUD for crops, prices, farmers with MongoDB, proper REST design, middleware, validation — sab kuch!

---

## Project Overview

**Kisan Market API** — Ek mandi (agricultural market) system jahan:
- **Farmers** register hote hain
- Farmers apni **crops** list karte hain with prices
- **Traders** crops search aur filter kar sakte hain
- Har crop ki **price history** maintain hoti hai

### Endpoints Design

```
FARMERS:
  POST   /api/v1/farmers              → Register farmer
  GET    /api/v1/farmers              → List all farmers
  GET    /api/v1/farmers/:id          → Get farmer details
  PUT    /api/v1/farmers/:id          → Update farmer
  DELETE /api/v1/farmers/:id          → Delete farmer

CROPS:
  POST   /api/v1/crops                → List new crop (farmer adds)
  GET    /api/v1/crops                → All crops (filter: season, minPrice, farmer)
  GET    /api/v1/crops/:id            → Single crop details
  PUT    /api/v1/crops/:id            → Update crop/price
  DELETE /api/v1/crops/:id            → Remove crop listing

FARMER'S CROPS:
  GET    /api/v1/farmers/:id/crops    → Ek farmer ki saari crops
```

---

## Project Setup

> **Terminal Command:**
> ```bash
> mkdir kisan-market-api && cd kisan-market-api
> npm init -y
> npm install express mongoose dotenv nodemon
> mkdir config models routes middleware
> touch server.js .env .gitignore
> touch config/db.js
> touch models/Farmer.js models/Crop.js
> touch routes/farmerRoutes.js routes/cropRoutes.js
> touch middleware/logger.js middleware/errorHandler.js middleware/asyncHandler.js
> ```

```bash
# .env
MONGODB_URI=mongodb://localhost:27017/kisanMarketDB
PORT=3000
NODE_ENV=development
```

```bash
# .gitignore
node_modules/
.env
```

---

## Step 1: Database Config

```javascript
// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.name}`);
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## Step 2: Async Handler (DRY — try/catch baar baar nahi!)

```javascript
// middleware/asyncHandler.js
// Har route mein try/catch likhne ki jagah yeh wrapper use karo

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
  // Agar error aaya toh automatic error handler pe jayega
};

module.exports = asyncHandler;
```

> **Socho Aise:**
> Bina asyncHandler ke har route mein try/catch likhna padta. Yeh ek wrapper hai jo automatically errors pakad ke error handler ko de deta hai. DRY principle!

---

## Step 3: Middleware

```javascript
// middleware/logger.js
const logger = (req, res, next) => {
  const time = new Date().toLocaleTimeString('hi-IN');
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
};

module.exports = logger;
```

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err.message}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid ID format: ${err.value}`
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: `${field} pehle se exist karta hai`
    });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server error'
  });
};

module.exports = errorHandler;
```

---

## Step 4: Models

### Farmer Model

```javascript
// models/Farmer.js
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kisan ka naam zaroori hai'],
    trim: true,
    minlength: [2, 'Naam kam se kam 2 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number zaroori hai'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Valid 10-digit Indian phone number do']
  },
  village: {
    type: String,
    required: [true, 'Village/city zaroori hai'],
    trim: true
  },
  district: { type: String, trim: true },
  state: {
    type: String,
    required: [true, 'State zaroori hai'],
    trim: true
  },
  aadharLast4: {
    type: String,
    match: [/^\d{4}$/, 'Aadhar ke last 4 digits do']
  },
  isActive: { type: Boolean, default: true },
  totalCrops: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual — farmer ki crops (populate ke liye)
farmerSchema.virtual('crops', {
  ref: 'Crop',
  localField: '_id',
  foreignField: 'farmer',
  justOne: false
});

module.exports = mongoose.model('Farmer', farmerSchema);
```

### Crop Model

```javascript
// models/Crop.js
const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fasal ka naam zaroori hai'],
    trim: true
  },
  localName: {
    type: String,   // Hindi/local naam
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['grain', 'vegetable', 'fruit', 'pulse', 'spice', 'oilseed', 'other'],
      message: '{VALUE} valid category nahi hai'
    }
  },
  season: {
    type: String,
    required: true,
    enum: {
      values: ['kharif', 'rabi', 'zaid', 'perennial'],
      message: '{VALUE} valid season nahi hai'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price zaroori hai'],
    min: [0, 'Price negative nahi ho sakta']
  },
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'dozen', 'piece'],
    default: 'kg'
  },
  mspPrice: {
    type: Number,    // Minimum Support Price (sarkari rate)
    default: null
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity zaroori hai'],
    min: [0, 'Quantity negative nahi ho sakti']
  },
  quality: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'B'
  },
  isOrganic: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer ID zaroori hai']
  },
  priceHistory: [{
    price: Number,
    date: { type: Date, default: Date.now }
  }],
  location: {
    mandi: String,      // Mandi ka naam
    district: String,
    state: String
  }
}, {
  timestamps: true
});

// Indexes — search fast karne ke liye
cropSchema.index({ category: 1, season: 1 });
cropSchema.index({ price: 1 });
cropSchema.index({ farmer: 1 });

module.exports = mongoose.model('Crop', cropSchema);
```

---

## Step 5: Routes

### Farmer Routes

```javascript
// routes/farmerRoutes.js
const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');
const Crop = require('../models/Crop');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/v1/farmers — Saare farmers
router.get('/', asyncHandler(async (req, res) => {
  let query = {};

  // State se filter
  if (req.query.state) query.state = new RegExp(req.query.state, 'i');

  // Search by name
  if (req.query.search) query.name = new RegExp(req.query.search, 'i');

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const farmers = await Farmer.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Farmer.countDocuments(query);

  res.status(200).json({
    success: true,
    count: farmers.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: farmers
  });
}));

// GET /api/v1/farmers/:id — Ek farmer with crops
router.get('/:id', asyncHandler(async (req, res) => {
  const farmer = await Farmer.findById(req.params.id)
    .populate('crops');

  if (!farmer) {
    const error = new Error('Farmer nahi mila');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({ success: true, data: farmer });
}));

// POST /api/v1/farmers — Register farmer
router.post('/', asyncHandler(async (req, res) => {
  const farmer = await Farmer.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Kisan register ho gaya!',
    data: farmer
  });
}));

// PUT /api/v1/farmers/:id — Update farmer
router.put('/:id', asyncHandler(async (req, res) => {
  const farmer = await Farmer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!farmer) {
    const error = new Error('Farmer nahi mila');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Farmer details update ho gayi!',
    data: farmer
  });
}));

// DELETE /api/v1/farmers/:id — Delete farmer + uski crops
router.delete('/:id', asyncHandler(async (req, res) => {
  const farmer = await Farmer.findById(req.params.id);

  if (!farmer) {
    const error = new Error('Farmer nahi mila');
    error.statusCode = 404;
    throw error;
  }

  // Farmer ki saari crops bhi delete karo
  await Crop.deleteMany({ farmer: req.params.id });
  await Farmer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: `Kisan "${farmer.name}" aur unki saari crops delete ho gayi`
  });
}));

// GET /api/v1/farmers/:id/crops — Farmer ki crops
router.get('/:id/crops', asyncHandler(async (req, res) => {
  const crops = await Crop.find({ farmer: req.params.id })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: crops.length,
    data: crops
  });
}));

module.exports = router;
```

### Crop Routes

```javascript
// routes/cropRoutes.js
const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');
const Farmer = require('../models/Farmer');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/v1/crops — Saari crops with filters
router.get('/', asyncHandler(async (req, res) => {
  let query = {};

  // Filters
  if (req.query.category) query.category = req.query.category;
  if (req.query.season) query.season = req.query.season;
  if (req.query.organic === 'true') query.isOrganic = true;
  if (req.query.available !== 'false') query.isAvailable = true;

  // Price range
  if (req.query.min_price || req.query.max_price) {
    query.price = {};
    if (req.query.min_price) query.price.$gte = Number(req.query.min_price);
    if (req.query.max_price) query.price.$lte = Number(req.query.max_price);
  }

  // Search by name
  if (req.query.search) {
    query.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { localName: new RegExp(req.query.search, 'i') }
    ];
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = req.query.sort || '-createdAt';

  const crops = await Crop.find(query)
    .populate('farmer', 'name phone village state')
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Crop.countDocuments(query);

  res.status(200).json({
    success: true,
    count: crops.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: crops
  });
}));

// GET /api/v1/crops/:id — Ek crop details
router.get('/:id', asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id)
    .populate('farmer', 'name phone village state');

  if (!crop) {
    const error = new Error('Crop nahi mili');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({ success: true, data: crop });
}));

// POST /api/v1/crops — Nayi crop add karo
router.post('/', asyncHandler(async (req, res) => {
  // Check ki farmer exist karta hai
  const farmer = await Farmer.findById(req.body.farmer);
  if (!farmer) {
    const error = new Error('Farmer ID galat hai — farmer nahi mila');
    error.statusCode = 404;
    throw error;
  }

  // Crop banao
  const crop = await Crop.create({
    ...req.body,
    priceHistory: [{ price: req.body.price, date: new Date() }],
    location: {
      mandi: req.body.mandi || farmer.village,
      district: req.body.district || farmer.district,
      state: req.body.state || farmer.state
    }
  });

  // Farmer ka totalCrops update karo
  await Farmer.findByIdAndUpdate(req.body.farmer, {
    $inc: { totalCrops: 1 }
  });

  res.status(201).json({
    success: true,
    message: 'Crop listing ban gayi!',
    data: crop
  });
}));

// PUT /api/v1/crops/:id — Crop update (with price history)
router.put('/:id', asyncHandler(async (req, res) => {
  const existingCrop = await Crop.findById(req.params.id);

  if (!existingCrop) {
    const error = new Error('Crop nahi mili');
    error.statusCode = 404;
    throw error;
  }

  // Agar price change hua toh history mein add karo
  const updateData = { ...req.body };
  if (req.body.price && req.body.price !== existingCrop.price) {
    updateData.$push = {
      priceHistory: { price: req.body.price, date: new Date() }
    };
  }

  const crop = await Crop.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Crop update ho gayi!',
    data: crop
  });
}));

// DELETE /api/v1/crops/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);

  if (!crop) {
    const error = new Error('Crop nahi mili');
    error.statusCode = 404;
    throw error;
  }

  // Farmer ka count update karo
  await Farmer.findByIdAndUpdate(crop.farmer, {
    $inc: { totalCrops: -1 }
  });

  await Crop.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: `"${crop.name}" crop delete ho gayi`
  });
}));

module.exports = router;
```

---

## Step 6: Main Server

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// DB Connect
connectDB();

// Middleware
app.use(express.json());
app.use(logger);

// Routes
const farmerRoutes = require('./routes/farmerRoutes');
const cropRoutes = require('./routes/cropRoutes');

app.get('/', (req, res) => {
  res.json({
    name: 'Kisan Market API',
    version: 'v1',
    endpoints: {
      farmers: '/api/v1/farmers',
      crops: '/api/v1/crops',
      farmerCrops: '/api/v1/farmers/:id/crops'
    }
  });
});

app.use('/api/v1/farmers', farmerRoutes);
app.use('/api/v1/crops', cropRoutes);

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `${req.originalUrl} route nahi mila`
  });
});

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Kisan Market API: http://localhost:${PORT}`);
});
```

---

## Testing — curl Commands

> **Terminal Command:**
> ```bash
> # 1. Register farmers
> curl -X POST http://localhost:3000/api/v1/farmers \
>   -H "Content-Type: application/json" \
>   -d '{"name":"Ramesh Kumar","phone":"9876543210","village":"Sultanpur","state":"UP"}'
>
> curl -X POST http://localhost:3000/api/v1/farmers \
>   -H "Content-Type: application/json" \
>   -d '{"name":"Suresh Yadav","phone":"9876543211","village":"Barabanki","state":"UP"}'
>
> # 2. Add crops (farmer ID copy karo response se)
> curl -X POST http://localhost:3000/api/v1/crops \
>   -H "Content-Type: application/json" \
>   -d '{"name":"Wheat","localName":"Gehun","category":"grain","season":"rabi","price":2200,"unit":"quintal","quantity":100,"farmer":"FARMER_ID_YAHAN"}'
>
> # 3. List crops with filters
> curl "http://localhost:3000/api/v1/crops?season=rabi&sort=-price"
>
> # 4. Update crop price
> curl -X PUT http://localhost:3000/api/v1/crops/CROP_ID \
>   -H "Content-Type: application/json" \
>   -d '{"price":2500}'
>
> # 5. Farmer ki crops dekho
> curl http://localhost:3000/api/v1/farmers/FARMER_ID/crops
> ```

---

## Quick Revision Table

| Component | File | Kya Karta Hai |
|-----------|------|---------------|
| DB Config | `config/db.js` | MongoDB connect |
| Farmer Model | `models/Farmer.js` | Farmer schema + validation |
| Crop Model | `models/Crop.js` | Crop schema + price history |
| Farmer Routes | `routes/farmerRoutes.js` | CRUD + farmer's crops |
| Crop Routes | `routes/cropRoutes.js` | CRUD + search/filter |
| Async Handler | `middleware/asyncHandler.js` | DRY error catching |
| Error Handler | `middleware/errorHandler.js` | Central error response |
| Logger | `middleware/logger.js` | Request logging |

---

## Aaj Kya Seekha?

1. **Complete project structure** — config, models, routes, middleware folders
2. **asyncHandler** wrapper se try/catch DRY rehta hai — ek jagah likhte hain, har jagah kaam karta hai
3. **Central error handler** se saare errors ek format mein jaate hain — Mongoose errors bhi
4. **Price history** track karna smart design hai — `$push` se array mein add hota hai
5. **Virtual populate** se farmer ki crops bina extra field ke dikha sakte hain
6. **Proper REST design** — versioned URLs, correct status codes, consistent response format
7. **Filtering, sorting, pagination** — production-ready API ke zaroori features
8. Week 6 ka saara knowledge ek project mein apply hua — Express, REST, Mongoose, DB Design!

> **Yaad Rakho:**
> Yeh project tumhara **portfolio piece** ban sakta hai. Isko aur expand karo — authentication add karo, image upload karo, dashboard banao. Building Phase ka yeh sirf start hai!
