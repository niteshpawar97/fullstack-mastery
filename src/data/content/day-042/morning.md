# Day 42 Morning: Pagination, Filtering & Search APIs

> **Aaj ka plan:** Aaj hum seekhenge ki real-world APIs mein pagination kyun zaroori hai, skip/limit approach, cursor-based pagination, query params se filtering, regex se search, sorting, aur ek reusable pagination helper function banayenge.

---

## Pagination — Kyun Zaroori Hai?

### Problem: Sab Data Ek Baar Mein?

```javascript
// ❌ Galat approach — sab 10,000 products ek response mein!
const products = await Product.find();
res.json(products); // 10,000 items = slow response, high memory usage
```

### Kya Problems Aati Hain?
1. **Server slow** — bohot saara data process karna padta hai
2. **Network slow** — bada response transfer mein time lagta hai
3. **Client crash** — mobile pe 10,000 items render karna = hang
4. **Bandwidth waste** — user ko sirf 10-20 items dikhne hain

> **Socho Aise:** Ek farmer cooperative mein 5000 members hain. Agar poori list ek page pe dikhao toh koi padh nahi paayega. Isliye 20-20 members ka page banate hain — page 1 pe pehle 20, page 2 pe agle 20. Yahi pagination hai.

### Solution: Data Ko Pages Mein Baanto

```
Page 1: Items 1-20
Page 2: Items 21-40
Page 3: Items 41-60
...
```

---

## Skip/Limit Approach (Offset Pagination)

### Concept

| Term | Matlab | Example |
|------|--------|---------|
| `page` | Kaunsa page chahiye | page=2 |
| `limit` | Ek page pe kitne items | limit=10 |
| `skip` | Kitne items chhodne hain | skip = (page-1) * limit |

### Formula:

```
skip = (page - 1) * limit

Page 1: skip = (1-1) * 10 = 0  → pehle 10 items
Page 2: skip = (2-1) * 10 = 10 → 11-20 items
Page 3: skip = (3-1) * 10 = 20 → 21-30 items
```

### MongoDB Mein Implementation

```javascript
// Query params se page aur limit lo
const page = parseInt(req.query.page) || 1;    // Default: page 1
const limit = parseInt(req.query.limit) || 10;  // Default: 10 items per page
const skip = (page - 1) * limit;

// Database query
const products = await Product.find()
  .skip(skip)       // Itne items chhood do
  .limit(limit)     // Itne items lo
  .sort('-createdAt');  // Newest pehle

// Total count bhi chahiye (total pages calculate karne ke liye)
const total = await Product.countDocuments();

res.json({
  success: true,
  page,
  limit,
  totalItems: total,
  totalPages: Math.ceil(total / limit),  // Upar round karo
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
  products
});
```

> **Example:**
```
GET /api/products?page=2&limit=5

Response:
{
  "page": 2,
  "limit": 5,
  "totalItems": 47,
  "totalPages": 10,
  "hasNextPage": true,
  "hasPrevPage": true,
  "products": [ ... 5 items ... ]
}
```

> **Yaad Rakho:** `Math.ceil(47 / 5) = 10` — 47 items, 5 per page = 10 pages (last page mein sirf 2 items honge).

---

## Cursor-Based Pagination (Advanced)

### Problem with Skip/Limit

Jab data bohot zyada ho (lakhs of rows), `skip(10000)` slow hota hai kyunki MongoDB ko 10,000 documents skip karne padte hain.

### Cursor-Based Approach

Last item ki ID ya timestamp use karo as cursor — "is ID ke baad ke items do."

```javascript
// First request — koi cursor nahi
// GET /api/products?limit=10

// Next requests — last item ki ID cursor ke roop mein
// GET /api/products?limit=10&cursor=65abc123def456

const limit = parseInt(req.query.limit) || 10;
const cursor = req.query.cursor;  // Last item ki ID

let query = {};
if (cursor) {
  // Cursor ke baad ke items do (ID se compare)
  query._id = { $gt: cursor };
}

const products = await Product.find(query)
  .sort('_id')    // ID ke order mein
  .limit(limit + 1);  // 1 extra lo — next page hai ya nahi check karne ke liye

// Next page hai ya nahi?
const hasMore = products.length > limit;
if (hasMore) {
  products.pop();  // Extra item hatao
}

res.json({
  success: true,
  products,
  nextCursor: hasMore ? products[products.length - 1]._id : null,
  hasMore
});
```

| Feature | Skip/Limit | Cursor-Based |
|---------|-----------|--------------|
| Simple | Haan | Thoda complex |
| Jump to page | Haan (page=5) | Nahi (sequential) |
| Performance | Large offset pe slow | Consistently fast |
| Use case | Small-medium data | Large datasets |
| Real-time data | Issues (items shift) | Better |

> **Tip:** Chhotey projects ke liye skip/limit kaafi hai. Cursor-based tab use karo jab data lakhs mein ho ya real-time updates ho rahe hon.

---

## Filtering with Query Params

### Concept

User query params se filter kar sakta hai — "Sirf fertilizer category ke products dikhao jinka price 500 se kam ho."

```
GET /api/products?category=fertilizer&maxPrice=500&minPrice=100
```

### Implementation

```javascript
router.get('/', async (req, res) => {
  // Filter object banao
  const filter = {};

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category;
    // { category: 'fertilizer' }
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) {
      filter.price.$gte = parseFloat(req.query.minPrice);  // Greater than or equal
    }
    if (req.query.maxPrice) {
      filter.price.$lte = parseFloat(req.query.maxPrice);  // Less than or equal
    }
    // { price: { $gte: 100, $lte: 500 } }
  }

  // Stock filter — sirf in-stock items
  if (req.query.inStock === 'true') {
    filter.stock = { $gt: 0 };  // Stock > 0
  }

  // Database query with filters
  const products = await Product.find(filter);

  res.json({
    success: true,
    count: products.length,
    filters: req.query,  // Kaunse filters lage hain
    products
  });
});
```

> **Example:**
```
GET /api/products?category=seeds&minPrice=50&maxPrice=200&inStock=true

MongoDB query ban jayega:
{ category: 'seeds', price: { $gte: 50, $lte: 200 }, stock: { $gt: 0 } }
```

---

## Search with Regex

### Name/Description Se Search

```javascript
// GET /api/products?search=urea

if (req.query.search) {
  // Regex se search karo — case insensitive
  filter.$or = [
    { name: { $regex: req.query.search, $options: 'i' } },        // Naam mein search
    { description: { $regex: req.query.search, $options: 'i' } }   // Description mein search
  ];
}

// "urea" search karega toh milega:
// "Urea Fertilizer", "Best UREA for wheat", "urea 46%"
```

> **Yaad Rakho:** `$options: 'i'` ka matlab hai **case-insensitive** — "urea", "Urea", "UREA" sab match karenge.

> **Warning:** Regex search chhotey datasets pe theek hai. Bade datasets ke liye MongoDB **text index** ya **Atlas Search** use karo — bahut faster hota hai.

```javascript
// Text index approach (better for large data)
// Schema mein text index add karo:
productSchema.index({ name: 'text', description: 'text' });

// Query mein text search use karo:
if (req.query.search) {
  filter.$text = { $search: req.query.search };
}
```

---

## Sorting

```javascript
// GET /api/products?sortBy=price&order=asc

// Sort options
let sortOption = '-createdAt';  // Default: newest first

if (req.query.sortBy) {
  const sortField = req.query.sortBy;          // price, name, createdAt
  const sortOrder = req.query.order === 'asc' ? '' : '-';  // asc ya desc
  sortOption = `${sortOrder}${sortField}`;
  // "price" (ascending) ya "-price" (descending)
}

const products = await Product.find(filter)
  .sort(sortOption)
  .skip(skip)
  .limit(limit);
```

| URL Param | Sort | Matlab |
|-----------|------|--------|
| `?sortBy=price&order=asc` | `price` | Sasta pehle |
| `?sortBy=price&order=desc` | `-price` | Mehnga pehle |
| `?sortBy=name&order=asc` | `name` | A-Z |
| `?sortBy=createdAt&order=desc` | `-createdAt` | Newest first |

---

## Reusable Pagination Helper

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

  const skip = (page - 1) * limit;

  // Parallel mein data aur count lo — faster!
  const [data, total] = await Promise.all([
    Model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .select(select),
    Model.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
};

module.exports = paginate;
```

### Helper Use Karna

```javascript
// routes/product.js
const paginate = require('../utils/pagination');

router.get('/', async (req, res) => {
  const filter = {};
  // ... filters build karo (category, price, search)

  const result = await paginate(Product, filter, {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: req.query.sortBy ? `${req.query.order === 'asc' ? '' : '-'}${req.query.sortBy}` : '-createdAt',
    populate: 'createdBy'
  });

  res.json({
    success: true,
    ...result.pagination,
    products: result.data
  });
});
```

> **Tip:** `Promise.all()` se data aur count parallel mein fetch hota hai — 2x faster compared to sequential queries.

---

## Quick Revision Table

| Topic | Key Point |
|-------|-----------|
| Pagination | Data ko pages mein baanto — sab ek baar mat bhejo |
| skip/limit | `skip = (page-1) * limit` |
| Cursor-based | Last item ki ID use karo — large data ke liye |
| countDocuments() | Total items count ke liye |
| totalPages | `Math.ceil(total / limit)` |
| Filtering | Query params se filter object banao |
| Price range | `{ $gte: min, $lte: max }` |
| Search (regex) | `{ $regex: 'term', $options: 'i' }` |
| $or search | Multiple fields mein search |
| Sorting | `-field` descending, `field` ascending |
| Promise.all() | Parallel queries — faster |
| Reusable helper | `paginate(Model, filter, options)` |

---

## Aaj Kya Seekha?

1. **Pagination** se response fast aur manageable hota hai
2. **Skip/limit** simple hai — chhotey data ke liye perfect
3. **Cursor-based** pagination bade datasets ke liye better hai
4. **Filtering** query params se dynamic queries banti hain
5. **Regex search** case-insensitive naam/description search ke liye
6. **Reusable pagination helper** se code DRY rehta hai

> **Practice Time!** Evening mein hum products API mein pagination add karenge, search implement karenge, category/price filter lagayenge, aur sorting test karenge!
