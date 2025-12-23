# Day 8 Morning: SQL Basics — CREATE, INSERT, SELECT

> **Aaj ka plan:** Ab databases ki duniya mein entry! SQL (Structured Query Language) — duniya ka sabse important database language. Aaj seekhenge relational databases kya hain, tables kaise banate hain, data kaise daale aur kaise nikalte hain!

---

## Database Kya Hai?

Database ek organized collection of data hai. Jaise ek register jismein systematic tarike se data likha ho.

| Type | Example | Use Case |
|------|---------|----------|
| Relational (SQL) | MySQL, PostgreSQL, SQLite | Structured data — users, orders, products |
| NoSQL (Document) | MongoDB, CouchDB | Flexible data — blogs, IoT, real-time apps |
| Key-Value | Redis, DynamoDB | Caching, sessions |
| Graph | Neo4j | Social networks, recommendations |

> **Socho Aise:** SQL database ek Excel spreadsheet jaisa hai — rows aur columns mein data. Lekin bahut powerful — lakho rows mein se milliseconds mein data nikal sakta hai!

---

## SQL Kya Hai?

SQL = Structured Query Language. Database se baat karne ki language hai.

```
Tum (Developer) --> SQL Query --> Database --> Result
```

### SQL ke 4 Types of Commands

| Category | Commands | Kya Karta Hai |
|----------|----------|--------------|
| DDL (Data Definition) | CREATE, ALTER, DROP | Table structure banao/badlo/hatao |
| DML (Data Manipulation) | INSERT, UPDATE, DELETE | Data daalo/badlo/hatao |
| DQL (Data Query) | SELECT | Data nikalo/dhundho |
| DCL (Data Control) | GRANT, REVOKE | Permissions manage karo |

---

## MySQL/PostgreSQL Setup

> **Terminal Command:**
> ```bash
> # MySQL check karo
> mysql --version
> 
> # MySQL mein login karo
> mysql -u root -p
> 
> # Ya PostgreSQL
> psql --version
> psql -U postgres
> 
> # SQLite (simplest — file-based, no server needed)
> sqlite3 test.db
> ```

> **Tip:** Beginners ke liye SQLite sabse easy hai — koi server nahi chahiye. Production mein MySQL ya PostgreSQL use hota hai. Hum SQL syntax seekhenge jo sab mein kaam karega!

---

## CREATE DATABASE & TABLE

```sql
-- Database banao
CREATE DATABASE kisan_market;

-- Database use karo
USE kisan_market;

-- Table banao — students
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    age INT,
    email VARCHAR(150) UNIQUE,
    course VARCHAR(50) DEFAULT 'BCA',
    city VARCHAR(50),
    marks DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SQL Data Types

| Data Type | Kya Hai | Example |
|-----------|---------|---------|
| `INT` | Integer number | 1, 42, 1000 |
| `DECIMAL(5,2)` | Decimal number (5 digits, 2 after point) | 99.99 |
| `VARCHAR(100)` | Variable length string (max 100 chars) | "Ramesh Kumar" |
| `TEXT` | Long text (no limit practically) | Blog post content |
| `BOOLEAN` | True/False | TRUE, FALSE |
| `DATE` | Date only | '2026-04-04' |
| `DATETIME` | Date + Time | '2026-04-04 10:30:00' |
| `TIMESTAMP` | Auto timestamp | CURRENT_TIMESTAMP |

### Constraints — Rules for Data

| Constraint | Kya Karta Hai |
|-----------|--------------|
| `PRIMARY KEY` | Unique identifier — har row ke liye alag |
| `NOT NULL` | Empty nahi ho sakta |
| `UNIQUE` | Duplicate nahi ho sakta |
| `DEFAULT` | Agar value na do to default lagega |
| `AUTO_INCREMENT` | Apne aap badhta hai (1, 2, 3...) |
| `FOREIGN KEY` | Doosri table se link |
| `CHECK` | Custom condition lagao |

> **Yaad Rakho:** `PRIMARY KEY` = har row ka Aadhaar number. Duplicate nahi ho sakta, NULL nahi ho sakta. Ye table ka identity hai!

---

## INSERT INTO — Data Daalo

```sql
-- Ek row daalo (sab columns specify karo)
INSERT INTO students (name, age, email, course, city, marks)
VALUES ('Priya Sharma', 21, 'priya@gmail.com', 'BCA', 'Jaipur', 85.50);

-- Another student
INSERT INTO students (name, age, email, course, city, marks)
VALUES ('Rahul Verma', 22, 'rahul@gmail.com', 'BCA', 'Delhi', 72.00);

-- Default values use karo (course = 'BCA', is_active = TRUE)
INSERT INTO students (name, age, email, city, marks)
VALUES ('Amit Singh', 20, 'amit@gmail.com', 'Lucknow', 90.25);

-- Multiple rows ek saath daalo
INSERT INTO students (name, age, email, course, city, marks) VALUES
('Sneha Gupta', 21, 'sneha@gmail.com', 'MCA', 'Mumbai', 88.00),
('Vikram Yadav', 23, 'vikram@gmail.com', 'BCA', 'Jaipur', 65.75),
('Pooja Devi', 20, 'pooja@gmail.com', 'BSc', 'Patna', 78.50),
('Ravi Kumar', 22, 'ravi@gmail.com', 'BCA', 'Delhi', 82.00),
('Anita Kumari', 21, 'anita@gmail.com', 'MCA', 'Lucknow', 91.50),
('Suresh Patel', 24, 'suresh@gmail.com', 'BSc', 'Ahmedabad', 55.00),
('Meena Sharma', 20, 'meena@gmail.com', 'BCA', 'Jaipur', 76.25);
```

> **Warning:** `NOT NULL` column mein value dena zaruri hai. `UNIQUE` column mein duplicate value doge to error aayega. `AUTO_INCREMENT` column mein value mat do — database khud number dega.

---

## SELECT — Data Nikalo

### Basic SELECT

```sql
-- Sab data nikalo
SELECT * FROM students;

-- Specific columns
SELECT name, age, city FROM students;

-- Column rename (alias)
SELECT name AS student_name, marks AS percentage FROM students;
```

### WHERE — Condition Lagao

```sql
-- City filter
SELECT * FROM students WHERE city = 'Jaipur';

-- Age filter
SELECT * FROM students WHERE age > 21;

-- Marks filter
SELECT name, marks FROM students WHERE marks >= 80;

-- Course filter
SELECT * FROM students WHERE course = 'BCA';

-- Active students
SELECT * FROM students WHERE is_active = TRUE;
```

### Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equal | `WHERE age = 21` |
| `!=` ya `<>` | Not equal | `WHERE city != 'Delhi'` |
| `>` | Greater than | `WHERE marks > 80` |
| `<` | Less than | `WHERE age < 22` |
| `>=` | Greater or equal | `WHERE marks >= 75` |
| `<=` | Less or equal | `WHERE age <= 20` |

### AND, OR, NOT

```sql
-- AND — dono conditions true chahiye
SELECT * FROM students
WHERE city = 'Jaipur' AND marks > 80;

-- OR — koi ek condition true
SELECT * FROM students
WHERE city = 'Delhi' OR city = 'Mumbai';

-- NOT — ulta karo
SELECT * FROM students
WHERE NOT course = 'BSc';

-- Combined
SELECT * FROM students
WHERE (city = 'Jaipur' OR city = 'Delhi') AND marks > 70;
```

### BETWEEN, IN, LIKE

```sql
-- BETWEEN — range mein
SELECT * FROM students WHERE marks BETWEEN 70 AND 90;
-- Same as: WHERE marks >= 70 AND marks <= 90

-- IN — multiple values mein se koi bhi
SELECT * FROM students WHERE city IN ('Jaipur', 'Delhi', 'Mumbai');
-- Same as: WHERE city = 'Jaipur' OR city = 'Delhi' OR city = 'Mumbai'

-- LIKE — pattern matching
SELECT * FROM students WHERE name LIKE 'P%';     -- P se start hone wale
SELECT * FROM students WHERE name LIKE '%kumar';  -- kumar pe end hone wale
SELECT * FROM students WHERE email LIKE '%gmail%'; -- gmail wale
SELECT * FROM students WHERE name LIKE '_a%';     -- Doosra letter 'a' ho
-- % = koi bhi characters (0 ya zyada)
-- _ = exactly ek character
```

### IS NULL

```sql
-- NULL check — = se nahi hota, IS NULL use karo
SELECT * FROM students WHERE email IS NULL;
SELECT * FROM students WHERE email IS NOT NULL;
```

> **Yaad Rakho:** SQL mein NULL ka comparison `=` se nahi hota! `WHERE email = NULL` galat hai. Hamesha `IS NULL` ya `IS NOT NULL` use karo.

---

## Real-World Example: Kisan Table

```sql
-- Kisan table banao
CREATE TABLE kisans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(50),
    phone VARCHAR(15) UNIQUE NOT NULL,
    land_area DECIMAL(6, 2),
    main_crop VARCHAR(50),
    annual_income DECIMAL(12, 2),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data daalo
INSERT INTO kisans (name, village, district, state, phone, land_area, main_crop, annual_income) VALUES
('Ramesh Kumar', 'Kheda', 'Aligarh', 'UP', '9876543210', 5.00, 'Wheat', 350000.00),
('Suresh Yadav', 'Govindpur', 'Mathura', 'UP', '9876543211', 8.50, 'Cotton', 520000.00),
('Priya Devi', 'Barmer', 'Barmer', 'Rajasthan', '9876543212', 3.00, 'Bajra', 180000.00),
('Mahesh Patel', 'Anand', 'Anand', 'Gujarat', '9876543213', 12.00, 'Sugarcane', 780000.00),
('Geeta Kumari', 'Darbhanga', 'Darbhanga', 'Bihar', '9876543214', 2.50, 'Rice', 150000.00);

-- Queries
SELECT name, main_crop, annual_income FROM kisans WHERE state = 'UP';
SELECT * FROM kisans WHERE land_area > 5;
SELECT name, annual_income FROM kisans WHERE annual_income BETWEEN 200000 AND 600000;
SELECT * FROM kisans WHERE main_crop IN ('Wheat', 'Rice', 'Cotton');
```

---

## Quick Revision

| SQL Command | Kya Karta Hai | Example |
|-------------|--------------|---------|
| `CREATE TABLE` | Nayi table banao | `CREATE TABLE students (...)` |
| `INSERT INTO` | Data daalo | `INSERT INTO students VALUES (...)` |
| `SELECT *` | Sab data nikalo | `SELECT * FROM students` |
| `WHERE` | Condition lagao | `WHERE age > 21` |
| `AND / OR` | Multiple conditions | `WHERE a = 1 AND b = 2` |
| `BETWEEN` | Range check | `WHERE marks BETWEEN 70 AND 90` |
| `IN` | Multiple values | `WHERE city IN ('A', 'B')` |
| `LIKE` | Pattern match | `WHERE name LIKE 'P%'` |
| `IS NULL` | NULL check | `WHERE email IS NULL` |

---

## Aaj Kya Seekha?

- Relational databases kya hain — tables, rows, columns
- SQL ke 4 categories: DDL, DML, DQL, DCL
- CREATE TABLE with data types aur constraints
- INSERT INTO — single aur multiple rows
- SELECT with WHERE — data filter karna
- AND, OR, BETWEEN, IN, LIKE operators
- NULL handling — IS NULL / IS NOT NULL
