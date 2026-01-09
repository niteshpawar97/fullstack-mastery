# Day 42 Evening: Practice — Pagination, Search, Filter & Sort API

> **Aaj ka plan:** Ab hum apne products API mein pagination add karenge, naam se search karenge, category aur price range se filter karenge, aur sorting implement karenge. Sab kuch ek endpoint mein combine karke test karenge.

---

## Project Setup — Seed Data Add Karo

Pehle kuch dummy products add karo testing ke liye:

```javascript
// seed.js — dummy data daalne ke liye
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Urea Fertilizer 50kg', price: 450, category: 'fertilizer', stock: 100, description: 'Best urea for wheat and rice' },
  { name: 'DAP Fertilizer 50kg', price: 1350, category: 'fertilizer', stock: 50, description: 'Phosphate rich fertilizer' },
  { name: 'NPK 20-20-20', price: 800, category: 'fertilizer', stock: 75, description: 'Balanced NPK fertilizer' },
  { name: 'Wheat Seeds HD-2967', price: 250, category: 'seeds', stock: 200, description: 'High yield wheat variety' },
  { name: 'Rice Seeds Pusa Basmati', price: 350, category: 'seeds', stock: 150, description: 'Premium basmati rice seeds' },
  { name: 'Mustard Seeds', price: 180, category: 'seeds', stock: 300, description: 'Yellow mustard seeds' },
  { name: 'Corn Seeds DKC-9108', price: 420, category: 'seeds', stock: 80, description: 'Hybrid corn seeds' },
  { name: 'Tractor Mini Cultivator', price: 45000, category: 'equipment', stock: 5, description: 'Mini tractor attachment' },
  { name: 'Spray Pump 16L', price: 2500, category: 'equipment', stock: 30, description: 'Manual spray pump' },
  { name: 'Drip Irrigation Kit', price: 8000, category: 'equipment', stock: 15, description: 'Complete drip system for 1 acre' },
  { name: 'Neem Oil Pesticide', price: 350, category: 'pesticide', stock: 120, description: 'Organic neem oil spray' },
  { name: 'Chlorpyrifos 20EC', price: 280, category: 'pesticide', stock: 90, description: 'For sucking pests' },
  { name: 'Imidacloprid 17.8SL', price: 450, category: 'pesticide', stock: 60, description: 'Systemic insecticide' },
  { name: 'Mancozeb Fungicide', price: 320, category: 'pesticide', stock: 100, description: 'For fungal diseases' },
  { name: 'Rotavator Heavy Duty', price: 75000, category: 'equipment', stock: 3, description: 'Heavy duty rotavator' },
  { name: 'Paddy Seeds IR-64', price: 200, category: 'seeds', stock: 180, description: 'Short duration rice variety' },
  { name: 'Vermicompost 50kg', price: 600, category: 'fertilizer', stock: 40, description: 'Organic vermicompost' },
  { name: 'Power Weeder', price: 35000, category: 'equipment', stock: 8, description: 'Petrol powered weeder' },
  { name: 'Carbendazim 50WP', price: 220, category: 'pesticide', stock: 110, description: 'Broad spectrum fungicide' },
  { name: 'Zinc Sulphate 21%', price: 150, category: 'fertilizer', stock: 200, description: 'Micronutrient fertilizer' }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Pehle purana data hatao
    await Product.deleteMany({});
    console.log('Purana data delete ho gaya');

    // Naya data add karo (createdBy set karo — ek dummy admin ID)
    // Production mein ye zaroori nahi hai — seed data ke liye hai
    const seeded = await Product.insertMany(
      products.map(p => ({ ...p, createdBy: new mongoose.Types.ObjectId() }))
    );
    
    console.log(`${seeded.length} products add ho gaye!`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDB();
```

> **Terminal Command:**
```bash
node seed.js
# 20 products add ho gaye!
```

---

## Step 1: Reusable Pagination Helper

```javascript
// utils/pagination.js
const paginate = async (Model, filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    populate = '',
    select = ''
  } = options;

  // Page aur limit ko safe range mein rakho
  const safePage = Math.max(1, page);            // Minimum 1
  const safeLimit = Math.min(Math.max(1, limit), 100);  // 1-100 ke beech
  const skip = (safePage - 1) * safeLimit;

  // Data aur count parallel mein lo — faster!
  const [data, total] = await Promise.all([
    Model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .populate(populate)
      .select(select)
      .lean(),          // Plain JS objects — faster (Mongoose methods nahi chahiye)
    Model.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / safeLimit);

  return {
    data,
    pagination: {
      currentPage: safePage,
      itemsPerPage: safeLimit,
      totalItems: total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
      nextPage: safePage < totalPages ? safePage + 1 : null,
      prevPage: safePage > 1 ? safePage - 1 : null
    }
  };
};

module.exports = paginate;
```

> **Terminal Command:**
```bash
mkdir utils
touch utils/pagination.js
```

---

## Step 2: Complete Products Route with Everything

```javascript
// routes/product.js — GET route updated
const paginate = require('../utils/pagination');

router.get('/', async (req, res, next) => {
  try {
    // ========== FILTER OBJECT BUILD KARO ==========
    const filter = {};

    // --- Category filter ---
    if (req.query.category) {
      filter.category = req.query.category.toLowerCase();
    }

    // --- Price range filter ---
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // --- In-stock filter ---
    if (req.query.inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    // --- Search (naam aur description mein) ---
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');  // Case insensitive
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // ========== SORT OPTION ==========
    let sort = '-createdAt';  // Default: newest first
    if (req.query.sortBy) {
      const validSortFields = ['price', 'name', 'createdAt', 'stock'];
      if (validSortFields.includes(req.query.sortBy)) {
        const order = req.query.order === 'asc' ? '' : '-';
        sort = `${order}${req.query.sortBy}`;
      }
    }

    // ========== PAGINATE ==========
    const result = await paginate(Product, filter, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort,
      populate: { path: 'createdBy', select: 'name email' }
    });

    res.json({
      success: true,
      ...result.pagination,
      appliedFilters: {
        category: req.query.category || 'all',
        priceRange: {
          min: req.query.minPrice || 'none',
          max: req.query.maxPrice || 'none'
        },
        search: req.query.search || 'none',
        sortBy: req.query.sortBy || 'createdAt',
        order: req.query.order || 'desc'
      },
      products: result.data
    });
  } catch (error) {
    next(error);
  }
});
```

---

## Postman Se Test Karo — Sab Scenarios

### Test 1: Basic Pagination
```
GET http://localhost:3000/api/products?page=1&limit=5
→ Pehle 5 products, totalPages, hasNextPage: true

GET http://localhost:3000/api/products?page=2&limit=5
→ Agle 5 products

GET http://localhost:3000/api/products?page=100&limit=5
→ Khali array (page exist nahi karta)
```

> **Expected Output:**
```json
{
  "success": true,
  "currentPage": 1,
  "itemsPerPage": 5,
  "totalItems": 20,
  "totalPages": 4,
  "hasNextPage": true,
  "hasPrevPage": false,
  "products": [ ... 5 items ... ]
}
```

### Test 2: Category Filter
```
GET http://localhost:3000/api/products?category=seeds
→ Sirf seeds category ke products (6 items)

GET http://localhost:3000/api/products?category=equipment
→ Sirf equipment (4 items)
```

### Test 3: Price Range Filter
```
GET http://localhost:3000/api/products?minPrice=100&maxPrice=500
→ 100-500 ke beech ke products

GET http://localhost:3000/api/products?maxPrice=300
→ 300 se kam ke sab products
```

### Test 4: Search
```
GET http://localhost:3000/api/products?search=urea
→ "Urea Fertilizer 50kg" milega

GET http://localhost:3000/api/products?search=rice
→ "Rice Seeds Pusa Basmati" + "Paddy Seeds IR-64" (description mein "rice" hai)

GET http://localhost:3000/api/products?search=organic
→ "Neem Oil Pesticide" + "Vermicompost 50kg" (description mein "organic")
```

### Test 5: Sorting
```
GET http://localhost:3000/api/products?sortBy=price&order=asc
→ Sasta pehle (Zinc Sulphate 150 → ... → Rotavator 75000)

GET http://localhost:3000/api/products?sortBy=price&order=desc
→ Mehnga pehle (Rotavator 75000 → ... → Zinc Sulphate 150)

GET http://localhost:3000/api/products?sortBy=name&order=asc
→ A-Z alphabetical order
```

### Test 6: Combined Filters (Real-World Scenario)
```
GET http://localhost:3000/api/products?category=fertilizer&minPrice=200&maxPrice=1000&sortBy=price&order=asc&page=1&limit=5

→ Fertilizer category, 200-1000 price range, sasta pehle, page 1, 5 items per page
→ Urea (450), Vermicompost (600), NPK (800)
```

### Test 7: Search + Filter
```
GET http://localhost:3000/api/products?search=seeds&category=seeds&sortBy=price&order=asc

→ Seeds category mein "seeds" word search, sasta pehle
→ Mustard Seeds (180), Paddy Seeds (200), Wheat Seeds (250), Corn Seeds (420)
```

---

## Bonus: Query Params Validation

```javascript
// schemas/query.js — query params bhi validate karo!
const Joi = require('joi');

const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category: Joi.string().valid('seeds', 'fertilizer', 'equipment', 'pesticide'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  search: Joi.string().max(100).trim(),
  sortBy: Joi.string().valid('price', 'name', 'createdAt', 'stock'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  inStock: Joi.string().valid('true', 'false')
}).with('maxPrice', [])  // maxPrice independently allowed
  .custom((value, helpers) => {
    // minPrice should be less than maxPrice
    if (value.minPrice && value.maxPrice && value.minPrice > value.maxPrice) {
      return helpers.error('custom.priceRange');
    }
    return value;
  })
  .messages({
    'custom.priceRange': 'minPrice maxPrice se kam hona chahiye!'
  });

// Query validation middleware (req.query validate karo, req.body nahi)
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      return res.status(400).json({ success: false, message: 'Invalid query params!', errors });
    }

    req.query = value;  // Cleaned query params
    next();
  };
};
```

> **Practice Time!** Ye exercises try karo:
> 1. `stock` ke basis pe sort karo — `?sortBy=stock&order=desc`
> 2. Pagination ke saath category filter lagao — seeds page 1
> 3. Ek aisa search karo jo koi result na de — empty response check
> 4. `limit=0` ya `limit=-5` bhejo — kya hota hai?
> 5. Cursor-based pagination implement karo `_id` ke basis pe

---

## Quick Revision Table

| Feature | URL Example | MongoDB Query |
|---------|-------------|---------------|
| Pagination | `?page=2&limit=10` | `.skip(10).limit(10)` |
| Category filter | `?category=seeds` | `{ category: 'seeds' }` |
| Price range | `?minPrice=100&maxPrice=500` | `{ price: { $gte: 100, $lte: 500 } }` |
| Search | `?search=urea` | `{ name: { $regex: /urea/i } }` |
| Sort ascending | `?sortBy=price&order=asc` | `.sort('price')` |
| Sort descending | `?sortBy=price&order=desc` | `.sort('-price')` |
| In-stock only | `?inStock=true` | `{ stock: { $gt: 0 } }` |
| Combined | All together | Filter → Sort → Skip → Limit |

---

## Aaj Kya Seekha?

1. **Pagination** se API response fast aur manageable hota hai
2. **skip/limit** formula: `skip = (page-1) * limit`
3. **Filtering** query params se dynamic filter object banate hain
4. **Regex search** case-insensitive text search ke liye
5. **Sorting** client choose kar sakta hai kaise data aaye
6. **Reusable helper** se sab models mein pagination lagta hai
7. **Promise.all()** se data + count parallel fetch hota hai

> **Kal ka preview:** Kal hum file upload seekhenge — Multer package se images upload karenge aur S3 ka introduction hoga!
