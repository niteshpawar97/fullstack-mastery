# Day 8 Evening: SQL Practice + Linux Basics

> **Practice Time!** SQL queries likhke database se baat karo. Saath mein Linux file permissions ka intro!

---

## Setup

> **Terminal Command:**
> ```bash
> # MySQL mein login karo
> mysql -u root -p
> 
> # Ya SQLite use karo (no server needed)
> sqlite3 practice.db
> 
> # Ya online tool use karo: https://sqliteonline.com/
> ```

> **Tip:** Agar local database setup nahi hai to https://sqliteonline.com ya https://www.db-fiddle.com use karo. Browser mein hi SQL practice ho jayegi!

---

## Task 1: Students Table — Complete CRUD

```sql
-- ===== STEP 1: Database aur Table banao =====
CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;

CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    age INT CHECK (age >= 15 AND age <= 30),
    email VARCHAR(150) UNIQUE,
    course VARCHAR(50) DEFAULT 'BCA',
    semester INT DEFAULT 1,
    city VARCHAR(50),
    marks DECIMAL(5, 2),
    fee_paid BOOLEAN DEFAULT FALSE,
    admitted_on DATE DEFAULT (CURRENT_DATE)
);


-- ===== STEP 2: Data Insert karo =====
INSERT INTO students (name, age, email, course, semester, city, marks, fee_paid) VALUES
('Priya Sharma', 21, 'priya@email.com', 'BCA', 4, 'Jaipur', 85.50, TRUE),
('Rahul Verma', 22, 'rahul@email.com', 'BCA', 6, 'Delhi', 72.00, TRUE),
('Amit Singh', 20, 'amit@email.com', 'BCA', 2, 'Lucknow', 90.25, TRUE),
('Sneha Gupta', 21, 'sneha@email.com', 'MCA', 2, 'Mumbai', 88.00, FALSE),
('Vikram Yadav', 23, 'vikram@email.com', 'BCA', 6, 'Jaipur', 65.75, TRUE),
('Pooja Devi', 20, 'pooja@email.com', 'BSc', 4, 'Patna', 78.50, TRUE),
('Ravi Kumar', 22, 'ravi@email.com', 'BCA', 4, 'Delhi', 82.00, FALSE),
('Anita Kumari', 21, 'anita@email.com', 'MCA', 2, 'Lucknow', 91.50, TRUE),
('Suresh Patel', 24, 'suresh@email.com', 'BSc', 6, 'Ahmedabad', 55.00, FALSE),
('Meena Sharma', 20, 'meena@email.com', 'BCA', 2, 'Jaipur', 76.25, TRUE);


-- ===== STEP 3: SELECT Queries Practice =====

-- Sab students
SELECT * FROM students;

-- Specific columns
SELECT name, course, marks FROM students;

-- BCA students only
SELECT name, semester, marks FROM students WHERE course = 'BCA';

-- High scorers
SELECT name, marks FROM students WHERE marks > 80;

-- Jaipur ke students
SELECT name, course, marks FROM students WHERE city = 'Jaipur';

-- Fee pending
SELECT name, course, city FROM students WHERE fee_paid = FALSE;

-- Semester 4 ya 6
SELECT name, semester FROM students WHERE semester IN (4, 6);

-- Marks range
SELECT name, marks FROM students WHERE marks BETWEEN 70 AND 90;

-- Name starts with 'S'
SELECT * FROM students WHERE name LIKE 'S%';

-- Email domain search
SELECT name, email FROM students WHERE email LIKE '%email.com';

-- Multiple conditions
SELECT name, marks, city FROM students
WHERE course = 'BCA' AND marks > 75 AND city != 'Delhi';

-- Complex query
SELECT name, course, marks, city FROM students
WHERE (course = 'BCA' OR course = 'MCA')
AND marks >= 80
AND fee_paid = TRUE;
```

> **Expected Output (last query):**
> ```
> +---------------+--------+-------+---------+
> | name          | course | marks | city    |
> +---------------+--------+-------+---------+
> | Priya Sharma  | BCA    | 85.50 | Jaipur  |
> | Amit Singh    | BCA    | 90.25 | Lucknow |
> | Anita Kumari  | MCA    | 91.50 | Lucknow |
> +---------------+--------+-------+---------+
> ```

---

## Task 2: UPDATE & DELETE

```sql
-- ===== UPDATE =====

-- Ek student ka marks update karo
UPDATE students SET marks = 95.00 WHERE id = 3;

-- Fee paid status update
UPDATE students SET fee_paid = TRUE WHERE id = 4;

-- Multiple columns update
UPDATE students SET city = 'Noida', semester = 5 WHERE id = 2;

-- Sab BCA students ka semester +1 karo
UPDATE students SET semester = semester + 1 WHERE course = 'BCA';

-- Verify
SELECT name, course, semester FROM students WHERE course = 'BCA';


-- ===== DELETE =====

-- Ek student delete
DELETE FROM students WHERE id = 9;

-- Condition se delete (low marks wale inactive students)
DELETE FROM students WHERE marks < 60 AND fee_paid = FALSE;

-- Verify
SELECT COUNT(*) AS total_students FROM students;
```

> **Warning:** `UPDATE` aur `DELETE` mein `WHERE` clause bhoolna sabse dangerous mistake hai! `DELETE FROM students;` bina WHERE ke — SAARI rows delete ho jaengi! Hamesha WHERE lagao!

---

## Task 3: Kisan Market Database

```sql
-- Kisan Market Database
CREATE TABLE crops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30),
    price_per_kg DECIMAL(8, 2) NOT NULL,
    stock_kg DECIMAL(10, 2) DEFAULT 0,
    season VARCHAR(20),
    origin_state VARCHAR(50),
    added_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO crops (name, category, price_per_kg, stock_kg, season, origin_state) VALUES
('Wheat', 'Grain', 22.00, 5000.00, 'Rabi', 'Punjab'),
('Rice', 'Grain', 35.00, 3000.00, 'Kharif', 'UP'),
('Cotton', 'Cash Crop', 65.00, 800.00, 'Kharif', 'Gujarat'),
('Sugarcane', 'Cash Crop', 3.50, 15000.00, 'Annual', 'UP'),
('Tomato', 'Vegetable', 45.00, 500.00, 'Rabi', 'Maharashtra'),
('Onion', 'Vegetable', 32.00, 1200.00, 'Rabi', 'Maharashtra'),
('Potato', 'Vegetable', 18.00, 2000.00, 'Rabi', 'UP'),
('Mustard', 'Oilseed', 55.00, 600.00, 'Rabi', 'Rajasthan'),
('Soybean', 'Oilseed', 48.00, 900.00, 'Kharif', 'MP'),
('Bajra', 'Millet', 20.00, 400.00, 'Kharif', 'Rajasthan');

-- ===== QUERIES =====

-- 1. Sab crops price ke saath
SELECT name, price_per_kg, stock_kg FROM crops;

-- 2. Vegetables only
SELECT name, price_per_kg FROM crops WHERE category = 'Vegetable';

-- 3. Expensive crops (>Rs.40/kg)
SELECT name, price_per_kg, category FROM crops WHERE price_per_kg > 40;

-- 4. Rabi season crops
SELECT name, category FROM crops WHERE season = 'Rabi';

-- 5. Total stock value
SELECT name, price_per_kg, stock_kg,
       (price_per_kg * stock_kg) AS total_value
FROM crops;

-- 6. UP ke crops
SELECT name, category, price_per_kg FROM crops WHERE origin_state = 'UP';

-- 7. High stock items (1000kg se zyada)
SELECT name, stock_kg FROM crops WHERE stock_kg > 1000;

-- 8. Price range
SELECT name, price_per_kg FROM crops
WHERE price_per_kg BETWEEN 20 AND 50;

-- 9. Grain ya Vegetable category
SELECT name, category, price_per_kg FROM crops
WHERE category IN ('Grain', 'Vegetable');

-- 10. Search by name
SELECT * FROM crops WHERE name LIKE '%at%';  -- Wheat, Potato mein 'at' hai
```

---

## Task 4: Linux File Permissions Basics

```bash
# ===== FILE PERMISSIONS =====

# File details dekho
ls -la

# Output example:
# -rw-r--r-- 1 user group 1234 Apr 4 10:00 index.js
# drwxr-xr-x 2 user group 4096 Apr 4 10:00 src/

# Permission format: -rwxrwxrwx
# Position:          |---|---|---|
#                    User Group Others

# r = read (4)
# w = write (2)
# x = execute (1)

# Common permissions:
# 755 = rwxr-xr-x (owner: sab, group/others: read+execute)
# 644 = rw-r--r-- (owner: read+write, group/others: read only)
# 700 = rwx------ (owner only: sab)
# 777 = rwxrwxrwx (sab ko sab — NOT recommended!)

# Permissions change karo
chmod 755 script.sh    # Number style
chmod +x script.sh     # Execute permission add karo
chmod u+w file.txt     # User ko write permission do
chmod go-r file.txt    # Group aur Others se read hatao

# File owner change karo
# chown user:group file.txt

# New file banao aur permission check karo
touch test-file.txt
ls -la test-file.txt
chmod 644 test-file.txt
ls -la test-file.txt
```

> **Yaad Rakho:** Permission numbers yaad karo: `r=4, w=2, x=1`. Add karo — `rwx = 4+2+1 = 7`, `rw- = 4+2 = 6`, `r-- = 4`. Isliye `755` matlab owner ko sab (7), group ko read+execute (5), others ko bhi read+execute (5).

### Permission Quick Reference

| Number | Permission | Meaning |
|--------|-----------|---------|
| 7 | rwx | Read + Write + Execute |
| 6 | rw- | Read + Write |
| 5 | r-x | Read + Execute |
| 4 | r-- | Read only |
| 0 | --- | No permission |

---

## Homework Challenges

### SQL Challenges

1. Ek `orders` table banao (id, customer_name, product, quantity, total_amount, order_date)
2. 10 sample orders INSERT karo
3. Ye queries likho:
   - Top 5 highest amount orders
   - Orders from last 7 days
   - Customer wise total spending
   - Products ordered more than once

### Linux Challenge

```bash
# Ek script banao
echo '#!/bin/bash
echo "Hello from Day 8!"
echo "Date: $(date)"
echo "User: $(whoami)"' > day8-script.sh

# Permission do aur run karo
chmod +x day8-script.sh
./day8-script.sh
```

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| `CREATE TABLE` | Table structure define karo |
| `INSERT INTO` | Data rows add karo |
| `SELECT` | Data query karo |
| `WHERE` | Conditions lagao |
| `UPDATE` | Data modify karo (WHERE zaruri!) |
| `DELETE` | Data hatao (WHERE zaruri!) |
| `BETWEEN` | Range query |
| `IN` | Multiple values check |
| `LIKE` | Pattern matching (% aur _) |
| File Permissions | rwx = 421, chmod se change |

---

## Aaj Kya Seekha?

- Students table create kiya with proper data types aur constraints
- INSERT se data daala — single aur multiple rows
- SELECT queries likhe — WHERE, AND, OR, BETWEEN, IN, LIKE
- UPDATE aur DELETE operations practice kiye
- Kisan Market database banaya with real-world queries
- Linux file permissions samjhe — rwx, chmod, numeric format
