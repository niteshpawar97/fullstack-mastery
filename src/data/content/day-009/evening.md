# Day 9 Evening: SQL Practice + JS Review

> **Practice Time!** Multi-table SQL queries practice karo aur JavaScript ka quick review bhi!

---

## Task 1: Kisan Market Database — Complex Queries

```sql
-- Pehle se banaye tables use karo (Day 8 aur Day 9 morning se)
-- Ya fresh banao:

-- ===== SETUP =====
CREATE DATABASE IF NOT EXISTS kisan_market_db;
USE kisan_market_db;

-- Kisans table
CREATE TABLE IF NOT EXISTS kisans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    state VARCHAR(50),
    phone VARCHAR(15) UNIQUE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30),
    unit VARCHAR(20) DEFAULT 'kg'
);

-- Sales table (kisans + products linked)
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kisan_id INT,
    product_id INT,
    quantity DECIMAL(10, 2),
    price_per_unit DECIMAL(8, 2),
    sale_date DATE,
    market_name VARCHAR(100),
    FOREIGN KEY (kisan_id) REFERENCES kisans(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Data insert karo
INSERT INTO kisans (name, village, state, phone) VALUES
('Ramesh Kumar', 'Kheda', 'UP', '9876543210'),
('Suresh Yadav', 'Govindpur', 'UP', '9876543211'),
('Priya Devi', 'Barmer', 'Rajasthan', '9876543212'),
('Mahesh Patel', 'Anand', 'Gujarat', '9876543213'),
('Geeta Kumari', 'Darbhanga', 'Bihar', '9876543214'),
('Arun Sharma', 'Sikar', 'Rajasthan', '9876543215');

INSERT INTO products (name, category, unit) VALUES
('Wheat', 'Grain', 'quintal'),
('Rice', 'Grain', 'quintal'),
('Cotton', 'Cash Crop', 'quintal'),
('Tomato', 'Vegetable', 'kg'),
('Onion', 'Vegetable', 'kg'),
('Sugarcane', 'Cash Crop', 'ton'),
('Mustard', 'Oilseed', 'quintal'),
('Bajra', 'Millet', 'quintal');

INSERT INTO sales (kisan_id, product_id, quantity, price_per_unit, sale_date, market_name) VALUES
(1, 1, 50, 2200, '2026-03-10', 'Aligarh Mandi'),
(1, 2, 30, 3500, '2026-03-15', 'Aligarh Mandi'),
(2, 3, 25, 6500, '2026-03-12', 'Mathura Mandi'),
(2, 7, 20, 5500, '2026-03-20', 'Mathura Mandi'),
(3, 8, 15, 2000, '2026-03-18', 'Barmer Mandi'),
(4, 6, 100, 350, '2026-03-25', 'Anand Mandi'),
(4, 3, 18, 6500, '2026-04-01', 'Anand Mandi'),
(1, 4, 200, 45, '2026-04-02', 'Aligarh Mandi'),
(2, 5, 500, 32, '2026-04-03', 'Mathura Mandi'),
(3, 4, 150, 45, '2026-04-03', 'Barmer Mandi'),
(1, 1, 40, 2300, '2026-04-04', 'Aligarh Mandi'),
(4, 3, 30, 6800, '2026-04-04', 'Anand Mandi');
```

---

## Task 2: Multi-Table Query Practice

```sql
-- ===== QUERY 1: Kisan + Product details with sale =====
SELECT
    k.name AS kisan_name,
    k.state,
    p.name AS product,
    p.category,
    s.quantity,
    s.price_per_unit,
    (s.quantity * s.price_per_unit) AS total_amount,
    s.sale_date
FROM sales s
INNER JOIN kisans k ON s.kisan_id = k.id
INNER JOIN products p ON s.product_id = p.id
ORDER BY s.sale_date DESC;


-- ===== QUERY 2: Kisan wise total revenue =====
SELECT
    k.name,
    k.state,
    COUNT(s.id) AS total_sales,
    SUM(s.quantity * s.price_per_unit) AS total_revenue
FROM kisans k
LEFT JOIN sales s ON k.id = s.kisan_id
GROUP BY k.id, k.name, k.state
ORDER BY total_revenue DESC;

-- Note: Geeta aur Arun bhi dikhenge — unka revenue NULL/0 hoga


-- ===== QUERY 3: Product wise total sales =====
SELECT
    p.name AS product,
    p.category,
    COUNT(s.id) AS times_sold,
    SUM(s.quantity) AS total_quantity,
    AVG(s.price_per_unit) AS avg_price,
    SUM(s.quantity * s.price_per_unit) AS total_revenue
FROM products p
LEFT JOIN sales s ON p.id = s.product_id
GROUP BY p.id, p.name, p.category
ORDER BY total_revenue DESC;


-- ===== QUERY 4: State wise analysis =====
SELECT
    k.state,
    COUNT(DISTINCT k.id) AS kisan_count,
    COUNT(s.id) AS total_transactions,
    SUM(s.quantity * s.price_per_unit) AS total_revenue,
    AVG(s.quantity * s.price_per_unit) AS avg_transaction
FROM kisans k
LEFT JOIN sales s ON k.id = s.kisan_id
GROUP BY k.state
ORDER BY total_revenue DESC;


-- ===== QUERY 5: Top 3 highest single sales =====
SELECT
    k.name AS kisan,
    p.name AS product,
    s.quantity,
    s.price_per_unit,
    (s.quantity * s.price_per_unit) AS amount,
    s.sale_date
FROM sales s
INNER JOIN kisans k ON s.kisan_id = k.id
INNER JOIN products p ON s.product_id = p.id
ORDER BY amount DESC
LIMIT 3;


-- ===== QUERY 6: Category wise revenue =====
SELECT
    p.category,
    COUNT(s.id) AS sales_count,
    SUM(s.quantity * s.price_per_unit) AS revenue
FROM sales s
INNER JOIN products p ON s.product_id = p.id
GROUP BY p.category
ORDER BY revenue DESC;


-- ===== QUERY 7: Kisans with revenue > Rs.1,00,000 =====
SELECT
    k.name,
    SUM(s.quantity * s.price_per_unit) AS revenue
FROM kisans k
INNER JOIN sales s ON k.id = s.kisan_id
GROUP BY k.id, k.name
HAVING revenue > 100000
ORDER BY revenue DESC;


-- ===== QUERY 8: Monthly sales report =====
SELECT
    DATE_FORMAT(s.sale_date, '%Y-%m') AS month,
    COUNT(*) AS transactions,
    SUM(s.quantity * s.price_per_unit) AS revenue
FROM sales s
GROUP BY month
ORDER BY month;


-- ===== QUERY 9: Kisan jo koi sale nahi kiya (unregistered/inactive) =====
SELECT k.name, k.village, k.state
FROM kisans k
LEFT JOIN sales s ON k.id = s.kisan_id
WHERE s.id IS NULL;
-- Result: Geeta aur Arun


-- ===== QUERY 10: Product kabhi nahi bika =====
SELECT p.name, p.category
FROM products p
LEFT JOIN sales s ON p.id = s.product_id
WHERE s.id IS NULL;
-- Result: Rice (product id 2 ki koi sale nahi hai... wait, hai)
-- Depends on data
```

> **Tip:** Complex queries likhte waqt step-by-step socho: (1) Kaunsi tables chahiye? (2) Kaise join honge? (3) Kya filter karna hai? (4) Kaise group karna hai? (5) Kaise sort karna hai?

---

## Task 3: JavaScript Quick Review Exercises

File: `js-review.js`

```javascript
// ===== JS Revision — SQL ke saath compare karo =====

// Sample data — imagine ye SQL se aaya hai
const salesData = [
  { kisan: "Ramesh", product: "Wheat", qty: 50, price: 2200, date: "2026-03-10" },
  { kisan: "Ramesh", product: "Rice", qty: 30, price: 3500, date: "2026-03-15" },
  { kisan: "Suresh", product: "Cotton", qty: 25, price: 6500, date: "2026-03-12" },
  { kisan: "Priya", product: "Bajra", qty: 15, price: 2000, date: "2026-03-18" },
  { kisan: "Mahesh", product: "Sugarcane", qty: 100, price: 350, date: "2026-03-25" },
  { kisan: "Mahesh", product: "Cotton", qty: 18, price: 6500, date: "2026-04-01" },
  { kisan: "Ramesh", product: "Tomato", qty: 200, price: 45, date: "2026-04-02" },
  { kisan: "Suresh", product: "Onion", qty: 500, price: 32, date: "2026-04-03" },
];

// 1. SELECT * (sab data)
console.log("===== ALL SALES =====");
salesData.forEach(s => {
  const amount = s.qty * s.price;
  console.log(`${s.kisan} | ${s.product} | ${s.qty} x Rs.${s.price} = Rs.${amount.toLocaleString()}`);
});

// 2. WHERE (filter)
console.log("\n===== RAMESH KI SALES (WHERE kisan='Ramesh') =====");
const rameshSales = salesData.filter(s => s.kisan === "Ramesh");
rameshSales.forEach(s => console.log(`${s.product}: Rs.${(s.qty * s.price).toLocaleString()}`));

// 3. ORDER BY (sort)
console.log("\n===== SORT BY AMOUNT DESC =====");
const sorted = [...salesData]
  .map(s => ({ ...s, amount: s.qty * s.price }))
  .sort((a, b) => b.amount - a.amount);
sorted.forEach(s => console.log(`${s.kisan} - ${s.product}: Rs.${s.amount.toLocaleString()}`));

// 4. GROUP BY + SUM (kisan wise total)
console.log("\n===== KISAN WISE REVENUE (GROUP BY) =====");
const kisanRevenue = salesData.reduce((acc, s) => {
  const amount = s.qty * s.price;
  acc[s.kisan] = (acc[s.kisan] || 0) + amount;
  return acc;
}, {});

Object.entries(kisanRevenue)
  .sort(([,a], [,b]) => b - a)
  .forEach(([kisan, revenue]) => {
    console.log(`${kisan}: Rs.${revenue.toLocaleString()}`);
  });

// 5. COUNT + AVG
console.log("\n===== STATISTICS =====");
const totalSales = salesData.length;
const totalRevenue = salesData.reduce((sum, s) => sum + (s.qty * s.price), 0);
const avgRevenue = totalRevenue / totalSales;
console.log(`Total Transactions: ${totalSales}`);
console.log(`Total Revenue: Rs.${totalRevenue.toLocaleString()}`);
console.log(`Average per Transaction: Rs.${avgRevenue.toLocaleString()}`);

// 6. HAVING equivalent (group filter)
console.log("\n===== KISANS WITH REVENUE > 1,00,000 (HAVING) =====");
Object.entries(kisanRevenue)
  .filter(([, revenue]) => revenue > 100000)
  .forEach(([kisan, revenue]) => {
    console.log(`${kisan}: Rs.${revenue.toLocaleString()}`);
  });
```

> **Terminal Command:**
> ```bash
> node js-review.js
> ```

> **Yaad Rakho:** SQL aur JavaScript mein bahut concepts match karte hain:
> - `WHERE` = `.filter()`
> - `ORDER BY` = `.sort()`
> - `GROUP BY + SUM` = `.reduce()`
> - `SELECT columns` = `.map()`
> - `COUNT` = `.length`
> - `LIMIT` = `.slice(0, n)`

---

## Task 4: SQL vs JavaScript Comparison

| SQL | JavaScript | Purpose |
|-----|-----------|---------|
| `SELECT * FROM table` | `array.forEach()` | Sab data iterate |
| `SELECT col1, col2` | `array.map(item => ({col1, col2}))` | Specific fields |
| `WHERE condition` | `array.filter(item => condition)` | Filter rows |
| `ORDER BY col DESC` | `array.sort((a,b) => b.col - a.col)` | Sort data |
| `LIMIT 5` | `array.slice(0, 5)` | First N items |
| `COUNT(*)` | `array.length` | Row count |
| `SUM(col)` | `array.reduce((s, i) => s + i.col, 0)` | Total |
| `AVG(col)` | `sum / array.length` | Average |
| `GROUP BY` | `reduce to object` | Category wise |
| `DISTINCT` | `[...new Set(array.map(i => i.col))]` | Unique values |

---

## Task 5: Git Commit

> **Terminal Command:**
> ```bash
> git add .
> git commit -m "Day 9: SQL Joins practice + JS review — kisan market queries"
> git log --oneline
> ```

---

## Homework Challenges

### SQL Challenges

```sql
-- 1. Subquery — kisan with highest single sale
SELECT * FROM sales
WHERE (quantity * price_per_unit) = (
    SELECT MAX(quantity * price_per_unit) FROM sales
);

-- 2. Self-exercise: Ek 'expenses' table banao (kisan_id, type, amount, date)
-- Join karo sales se aur profit calculate karo

-- 3. Ek 'markets' table banao with location data
-- 3 tables join karo: kisans + sales + markets
```

### JS Challenge

```javascript
// Apna data ke saath ye implement karo:
// 1. Search function (LIKE equivalent)
// 2. Pagination (LIMIT + OFFSET equivalent)
// 3. Multiple field sort (ORDER BY col1, col2)
```

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| Multi-table JOIN | 2-3 tables join karke data nikala |
| LEFT JOIN + NULL check | Unmatched records find kiye |
| GROUP BY + HAVING | Category wise summary with filter |
| ORDER BY + LIMIT | Sort aur paginate |
| Aggregate Functions | COUNT, SUM, AVG, MIN, MAX |
| SQL vs JS | filter=WHERE, sort=ORDER BY, reduce=GROUP BY |
| Date functions | DATE_FORMAT for monthly reports |

---

## Aaj Kya Seekha?

- Multi-table queries likhe — 2 aur 3 table joins
- Kisan market database pe real-world queries practice ki
- LEFT JOIN se unmatched data find kiya
- GROUP BY + HAVING se complex reporting ki
- JavaScript mein SQL equivalent operations compare kiye
- SQL aur JS ke parallels samjhe — concepts same hain!
