# Day 35 - Evening Session: Products API with SQL Backend — Practice

> **Aaj ka plan:**
> Wohi Products API jo kal Mongoose se banayi thi, aaj SQL (MySQL) se banayenge. Phir dono ka code structure compare karenge — samajh aayega kab kya use karna hai.

---

## Project Setup

> **Terminal Command:**
> ```bash
> mkdir product-api-sql && cd product-api-sql
> npm init -y
> npm install express mysql2 dotenv nodemon
> mkdir config routes
> touch server.js .env config/db.js routes/productRoutes.js
> ```

```bash
# .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kisan_products
PORT=3000
```

---

## Step 1: Database aur Table Setup

MySQL mein pehle database aur table banao:

> **Terminal Command:**
> ```bash
> # MySQL CLI mein jaao
> mysql -u root -p
> ```

```sql
-- Database banao
CREATE DATABASE IF NOT EXISTS kisan_products;
USE kisan_products;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category ENUM('grain', 'vegetable', 'fruit', 'dairy', 'spice', 'other') NOT NULL,
  unit ENUM('kg', 'quintal', 'litre', 'piece', 'dozen') DEFAULT 'kg',
  stock INT DEFAULT 0 CHECK (stock >= 0),
  farmer VARCHAR(255) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kuch sample data daalo
INSERT INTO products (name, price, category, unit, stock, farmer) VALUES
('Organic Gehun', 2200.00, 'grain', 'quintal', 100, 'Ramesh Kumar'),
('Tamatar', 40.00, 'vegetable', 'kg', 500, 'Priya Singh'),
('Chana Dal', 5230.00, 'grain', 'quintal', 50, 'Suresh Yadav'),
('Aam (Mango)', 80.00, 'fruit', 'kg', 200, 'Amit Verma');
```

---

## Step 2: Database Connection

```javascript
// config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connection test
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`MySQL Connected: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    conn.release();
  } catch (err) {
    console.error('MySQL Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
```

---

## Step 3: Complete CRUD Routes

```javascript
// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// ============================================
// GET /api/products — Saare products lao
// ============================================
router.get('/', async (req, res) => {
  try {
    // Dynamic query building
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Category filter
    if (req.query.category) {
      query += ' AND category = ?';
      params.push(req.query.category);
    }

    // Availability filter
    if (req.query.available !== undefined) {
      query += ' AND is_available = ?';
      params.push(req.query.available === 'true' ? 1 : 0);
    }

    // Price range
    if (req.query.min_price) {
      query += ' AND price >= ?';
      params.push(Number(req.query.min_price));
    }
    if (req.query.max_price) {
      query += ' AND price <= ?';
      params.push(Number(req.query.max_price));
    }

    // Search by name
    if (req.query.search) {
      query += ' AND name LIKE ?';
      params.push(`%${req.query.search}%`);
    }

    // Count total (for pagination)
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Sorting
    const sortField = req.query.sort || 'created_at';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${pool.escapeId(sortField)} ${sortOrder}`;

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const [products] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    console.error('GET /products error:', error.message);
    res.status(500).json({ success: false, error: 'Products fetch error' });
  }
});

// ============================================
// GET /api/products/:id — Ek product by ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product nahi mila is ID ke saath'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// POST /api/products — Naya product banao
// ============================================
router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, unit, stock, farmer } = req.body;

    // Manual validation (SQL mein Mongoose jaisa auto nahi hai)
    const errors = [];
    if (!name || name.length < 2) errors.push('Name zaroori hai (min 2 chars)');
    if (price === undefined || price < 0) errors.push('Valid price zaroori hai');
    if (!category) errors.push('Category zaroori hai');
    if (!farmer) errors.push('Farmer naam zaroori hai');

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation fail',
        details: errors
      });
    }

    // Insert query
    const [result] = await pool.query(
      `INSERT INTO products (name, description, price, category, unit, stock, farmer) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description || '', price, category, unit || 'kg', stock || 0, farmer]
    );

    // Naya product fetch karo
    const [newProduct] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Product ban gaya!',
      data: newProduct[0]
    });
  } catch (error) {
    // MySQL specific errors
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ success: false, error: 'Data bahut lamba hai' });
    }
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
      return res.status(400).json({ success: false, error: 'Data type galat hai' });
    }
    console.error('POST error:', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// PUT /api/products/:id — Product update karo
// ============================================
router.put('/:id', async (req, res) => {
  try {
    // Pehle check karo ki product exist karta hai
    const [existing] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product nahi mila update karne ke liye'
      });
    }

    const { name, description, price, category, unit, stock, farmer } = req.body;

    // Dynamic update query banao — sirf jo diya hai woh update karo
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (unit !== undefined) { updates.push('unit = ?'); params.push(unit); }
    if (stock !== undefined) { updates.push('stock = ?'); params.push(stock); }
    if (farmer !== undefined) { updates.push('farmer = ?'); params.push(farmer); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Kuch toh update karo! Koi field nahi di'
      });
    }

    params.push(req.params.id); // WHERE id = ?

    await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Updated product fetch karo
    const [updated] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'Product update ho gaya!',
      data: updated[0]
    });
  } catch (error) {
    console.error('PUT error:', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// DELETE /api/products/:id — Product delete karo
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    // Pehle product fetch karo
    const [existing] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product nahi mila delete karne ke liye'
      });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      message: `"${existing[0].name}" delete ho gaya!`,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
```

---

## Step 4: Server File

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const { testConnection } = require('./config/db');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// DB connect
testConnection();

// Middleware
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route nahi mila' });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
```

---

## MongoDB vs SQL — Code Structure Comparison

### CREATE Operation

```javascript
// === MONGOOSE ===
const product = await Product.create(req.body);
// Ek line! Schema validation auto.

// === SQL ===
const [result] = await pool.query(
  'INSERT INTO products (name, price, ...) VALUES (?, ?, ...)',
  [name, price, ...]
);
const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
// Do queries! Manual validation bhi!
```

### READ with Filter

```javascript
// === MONGOOSE ===
const products = await Product.find({ category: 'grain' })
  .sort({ price: -1 })
  .skip(0).limit(10);

// === SQL ===
const [products] = await pool.query(
  'SELECT * FROM products WHERE category = ? ORDER BY price DESC LIMIT ? OFFSET ?',
  ['grain', 10, 0]
);
```

### UPDATE

```javascript
// === MONGOOSE ===
const updated = await Product.findByIdAndUpdate(id, { price: 2500 }, { new: true });

// === SQL ===
await pool.query('UPDATE products SET price = ? WHERE id = ?', [2500, id]);
const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
```

> **Yaad Rakho:**
> - **Mongoose** = Less code, auto validation, built-in helpers
> - **SQL** = More control, explicit queries, better for complex relations
> - Choose based on project needs, not personal preference!

---

## Quick Revision Table

| Task | Mongoose | SQL (mysql2) |
|------|----------|-------------|
| Connect | `mongoose.connect(uri)` | `mysql.createPool({...})` |
| Create | `Model.create(data)` | `INSERT INTO ... VALUES (?, ...)` |
| Read All | `Model.find({})` | `SELECT * FROM products` |
| Read One | `Model.findById(id)` | `SELECT * WHERE id = ?` |
| Update | `findByIdAndUpdate(id, data)` | `UPDATE ... SET ... WHERE id = ?` |
| Delete | `findByIdAndDelete(id)` | `DELETE FROM ... WHERE id = ?` |
| Validate | Schema validators | Manual + DB constraints |
| Prevent Injection | N/A (auto-safe) | Parameterized queries (`?`) |
| Relations | `populate()` | `JOIN` queries |

---

## Aaj Kya Seekha?

1. **mysql2/promise** se async/await ke saath SQL queries likhte hain
2. **Connection pool** har baar naya connection banane se bachata hai — performance boost
3. **Parameterized queries** (`?` placeholder) SQL injection se bachati hain
4. SQL mein **manual validation** likhna padta hai — Mongoose mein Schema se auto hota hai
5. SQL mein **dynamic query building** karna padta hai filtering/sorting ke liye
6. **Mongoose shorter code** deta hai, par **SQL zyada control** deta hai
7. Dono approaches **production mein use** hoti hain — situation ke hisaab se choose karo

> **Practice Time!**
> Dono APIs (MongoDB + SQL) ko ek saath run karo (alag ports pe) aur same curl commands se test karo. Kal Database Design aur Relations seekhenge!
