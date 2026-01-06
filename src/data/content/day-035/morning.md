# Day 35 - Morning Session: CRUD API with Express + SQL

> **Aaj ka plan:**
> Aaj wohi Products API banayenge jo kal Mongoose se banayi thi — par ab **SQL database** (MySQL/PostgreSQL) ke saath. mysql2/pg package, connection pool, parameterized queries, aur SQL injection protection seekhenge. End mein dono approaches compare karenge!

---

## SQL in Node.js — Overview

Node.js mein SQL databases ke liye alag packages hain:

| Database | Package | Install |
|----------|---------|---------|
| MySQL | `mysql2` | `npm install mysql2` |
| PostgreSQL | `pg` | `npm install pg` |
| SQLite | `better-sqlite3` | `npm install better-sqlite3` |

> **Tip:**
> Hum `mysql2` use karenge (sabse popular). PostgreSQL ke liye syntax almost same hai — sirf `$1, $2` placeholders hote hain `?` ki jagah.

---

## Setup

> **Terminal Command:**
> ```bash
> mkdir product-api-sql && cd product-api-sql
> npm init -y
> npm install express mysql2 dotenv nodemon
> mkdir config models routes
> touch server.js .env
> touch config/db.js routes/productRoutes.js
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

## Connection Pool — Kya aur Kyun?

Har query ke liye naya connection banana expensive hai. Pool ek set of connections maintain karta hai jo reuse hote hain.

> **Socho Aise:**
> Socho ek mandi mein 10 counters hain. Jab koi kisan aata hai, khaali counter pe jaata hai. Kaam hone ke baad counter free ho jaata hai doosre ke liye. Yeh hai connection pool — fixed connections, multiple users!

```javascript
// config/db.js — Connection Pool
const mysql = require('mysql2/promise');

// Pool banao — yeh connections manage karega
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,    // Max 10 connections
  queueLimit: 0           // Unlimited queue
});

// Connection test karo
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Connected Successfully!');
    connection.release(); // Connection pool mein wapas do
  } catch (error) {
    console.error('MySQL Connection Failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
```

> **Warning:**
> `mysql2/promise` import karo — yeh promise-based API deta hai. Bina `/promise` ke callback style hoga jo async/await ke saath kaam nahi karega.

---

## Table Create Karo (SQL)

```sql
-- MySQL mein yeh command run karo
CREATE DATABASE IF NOT EXISTS kisan_products;
USE kisan_products;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10, 2) NOT NULL,
  category ENUM('grain', 'vegetable', 'fruit', 'dairy', 'spice', 'other') NOT NULL,
  unit ENUM('kg', 'quintal', 'litre', 'piece', 'dozen') DEFAULT 'kg',
  stock INT DEFAULT 0,
  farmer VARCHAR(255) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

> **Yaad Rakho:**
> SQL mein `snake_case` convention hai (`is_available`), jabki JavaScript mein `camelCase` (`isAvailable`). Dono mein convert karna padta hai!

---

## SQL Queries in Node.js

### Basic Query Pattern

```javascript
// Simple query
const [rows] = await pool.query('SELECT * FROM products');
// rows = array of objects [{id: 1, name: 'Gehun', ...}, ...]

// pool.query() ek array return karta hai: [rows, fields]
// Hum sirf rows chahte hain, isliye destructuring [rows]
```

### Parameterized Queries — SQL Injection Prevention

```javascript
// ❌ GALAT — SQL Injection vulnerable!
const name = req.body.name; // Agar user ne "'; DROP TABLE products; --" diya toh?
const query = `SELECT * FROM products WHERE name = '${name}'`;
// Yeh query: SELECT * FROM products WHERE name = ''; DROP TABLE products; --'
// TABLE DELETE HO JAYEGA!

// ✅ SAHI — Parameterized query
const [rows] = await pool.query(
  'SELECT * FROM products WHERE name = ?',
  [name]
);
// mysql2 automatically escape karega — safe!
```

> **Warning:**
> **KABHI** user input ko seedha SQL query mein mat daalo! Hamesha `?` placeholder use karo. Yeh SQL Injection se bachata hai — security ka Rule #1!

> **Example:**
> ```javascript
> // Multiple parameters
> const [rows] = await pool.query(
>   'SELECT * FROM products WHERE category = ? AND price >= ?',
>   [category, minPrice]   // Array mein saare values do
> );
> 
> // INSERT mein
> const [result] = await pool.query(
>   'INSERT INTO products (name, price, category, farmer) VALUES (?, ?, ?, ?)',
>   [name, price, category, farmer]
> );
> // result.insertId = naye row ka ID
> ```

---

## CRUD Operations — SQL Style

### 1. CREATE

```javascript
// Naya product insert karo
const createProduct = async (data) => {
  const { name, description, price, category, unit, stock, farmer } = data;

  const [result] = await pool.query(
    `INSERT INTO products (name, description, price, category, unit, stock, farmer) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description || '', price, category, unit || 'kg', stock || 0, farmer]
  );

  // Naya insert hua row fetch karo
  const [newProduct] = await pool.query(
    'SELECT * FROM products WHERE id = ?',
    [result.insertId]
  );

  return newProduct[0]; // Ek object return karo
};
```

### 2. READ

```javascript
// Saare products
const getAllProducts = async (filters = {}) => {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  // Dynamic filtering
  if (filters.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters.minPrice) {
    query += ' AND price >= ?';
    params.push(Number(filters.minPrice));
  }

  if (filters.maxPrice) {
    query += ' AND price <= ?';
    params.push(Number(filters.maxPrice));
  }

  // Sorting
  query += ' ORDER BY created_at DESC';

  // Pagination
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const [rows] = await pool.query(query, params);
  return rows;
};

// Ek product by ID
const getProductById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
  return rows[0] || null; // null agar nahi mila
};
```

### 3. UPDATE

```javascript
const updateProduct = async (id, data) => {
  const { name, description, price, category, unit, stock, farmer } = data;

  const [result] = await pool.query(
    `UPDATE products SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      category = COALESCE(?, category),
      unit = COALESCE(?, unit),
      stock = COALESCE(?, stock),
      farmer = COALESCE(?, farmer)
    WHERE id = ?`,
    [name, description, price, category, unit, stock, farmer, id]
  );

  if (result.affectedRows === 0) return null;

  // Updated product fetch karo
  return getProductById(id);
};
```

### 4. DELETE

```javascript
const deleteProduct = async (id) => {
  // Pehle product fetch karo (response mein dikhane ke liye)
  const product = await getProductById(id);
  if (!product) return null;

  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return product;
};
```

> **Tip:**
> `COALESCE(?, name)` ka matlab hai — agar naya value diya hai toh woh use karo, warna purani value rakhlo. Yeh partial updates ke liye useful hai.

---

## SQL vs Mongoose — Comparison

| Feature | Mongoose (MongoDB) | mysql2 (SQL) |
|---------|-------------------|--------------|
| Schema | Code mein define | Database mein (CREATE TABLE) |
| Validation | Schema level | Manual + DB constraints |
| Create | `Model.create(data)` | `INSERT INTO ... VALUES (?)` |
| Read All | `Model.find({})` | `SELECT * FROM products` |
| Read One | `Model.findById(id)` | `SELECT * WHERE id = ?` |
| Update | `Model.findByIdAndUpdate()` | `UPDATE ... SET ... WHERE id = ?` |
| Delete | `Model.findByIdAndDelete()` | `DELETE FROM ... WHERE id = ?` |
| Filter | `Model.find({ category })` | `WHERE category = ?` |
| Sort | `.sort({ price: 1 })` | `ORDER BY price ASC` |
| Pagination | `.skip(10).limit(5)` | `LIMIT 5 OFFSET 10` |
| Relations | `populate()` | `JOIN` queries |
| ID Type | ObjectId (string) | Integer (auto-increment) |

> **Socho Aise:**
> Mongoose = automatic car (bahut kuch handle karta hai)
> SQL = manual car (zyada control par zyada likho)
> Dono acchi hain — project ki zaroorat pe depend karta hai!

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| Connection Pool | Reusable connections ka set | `mysql.createPool({...})` |
| `mysql2/promise` | Async/await support | `require('mysql2/promise')` |
| Parameterized Query | Safe query with `?` | `WHERE id = ?`, `[id]` |
| SQL Injection | Malicious SQL input | `?` placeholder se roktay hain |
| `result.insertId` | Naye row ka ID | After INSERT query |
| `result.affectedRows` | Kitne rows change hue | After UPDATE/DELETE |
| `COALESCE` | NULL check in SQL | Partial updates ke liye |
| `[rows]` destructuring | Query result se data nikalo | `const [rows] = await pool.query()` |

---

## Aaj Kya Seekha?

1. **mysql2/promise** se Node.js mein SQL queries async/await ke saath likhte hain
2. **Connection Pool** performance ke liye zaroori hai — connections reuse hote hain
3. **Parameterized queries** (`?`) SQL Injection se bachati hain — security must-have
4. **CRUD operations** SQL mein INSERT, SELECT, UPDATE, DELETE ke through hote hain
5. **Dynamic queries** build karke filtering, sorting, pagination implement hoti hai
6. SQL mein schema **database level** pe define hota hai, Mongoose mein **code level** pe
7. Dono approaches ke apne pros/cons hain — project requirement pe depend karta hai

> **Practice Time!**
> Evening mein complete SQL-based Products API implement karenge aur MongoDB version ke saath compare karenge!
