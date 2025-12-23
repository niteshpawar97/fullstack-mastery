# Day 9 Morning: SQL Joins + WHERE + Sorting

> **Aaj ka plan:** Aaj SQL ka advanced part — multiple tables ko join karna, data sort karna, group karna, aur aggregate functions (COUNT, SUM, AVG). Real databases mein data ek table mein nahi hota — tables ek doosre se linked hote hain. Joins se hum ye linked data nikalte hain!

---

## ORDER BY — Data Sort Karo

```sql
-- Marks ke hisaab se sort (ascending — default)
SELECT name, marks FROM students ORDER BY marks;

-- Descending order (high to low)
SELECT name, marks FROM students ORDER BY marks DESC;

-- Multiple columns se sort
SELECT name, city, marks FROM students
ORDER BY city ASC, marks DESC;
-- Pehle city se sort (A-Z), phir same city mein marks se (high to low)

-- Top 5 students (highest marks)
SELECT name, marks FROM students
ORDER BY marks DESC
LIMIT 5;

-- Skip first 3, next 5 nikalo (pagination)
SELECT name, marks FROM students
ORDER BY marks DESC
LIMIT 5 OFFSET 3;
-- Ya: LIMIT 3, 5 (skip 3, take 5)
```

> **Socho Aise:** ORDER BY ek leaderboard jaisa hai — toppers upar, baaki neeche. LIMIT se page banao — pehle page pe 10 results, doosre page pe agle 10 (pagination).

---

## DISTINCT — Unique Values

```sql
-- Kitne unique cities hain?
SELECT DISTINCT city FROM students;

-- Unique courses
SELECT DISTINCT course FROM students;

-- Unique city + course combinations
SELECT DISTINCT city, course FROM students;
```

---

## Aggregate Functions — Data Summary

```sql
-- COUNT — kitne rows hain?
SELECT COUNT(*) AS total_students FROM students;
SELECT COUNT(*) AS bca_count FROM students WHERE course = 'BCA';

-- SUM — total nikalo
SELECT SUM(marks) AS total_marks FROM students;

-- AVG — average
SELECT AVG(marks) AS average_marks FROM students;

-- MIN / MAX
SELECT MIN(marks) AS lowest, MAX(marks) AS highest FROM students;

-- Sab ek saath
SELECT
    COUNT(*) AS total_students,
    AVG(marks) AS avg_marks,
    MIN(marks) AS min_marks,
    MAX(marks) AS max_marks,
    SUM(marks) AS total_marks
FROM students;
```

> **Yaad Rakho:** Aggregate functions poore column pe kaam karte hain aur ek value dete hain. `COUNT(*)` sab rows ginata hai, `COUNT(column)` sirf non-NULL rows ginata hai.

---

## GROUP BY — Category Wise Summary

```sql
-- Course wise student count
SELECT course, COUNT(*) AS student_count
FROM students
GROUP BY course;

-- City wise average marks
SELECT city, AVG(marks) AS avg_marks, COUNT(*) AS count
FROM students
GROUP BY city;

-- Course wise marks summary
SELECT
    course,
    COUNT(*) AS students,
    AVG(marks) AS avg_marks,
    MIN(marks) AS min_marks,
    MAX(marks) AS max_marks
FROM students
GROUP BY course;
```

> **Expected Output (Course wise):**
> ```
> +--------+----------+-----------+-----------+-----------+
> | course | students | avg_marks | min_marks | max_marks |
> +--------+----------+-----------+-----------+-----------+
> | BCA    |     5    |   77.90   |   65.75   |   90.25   |
> | MCA    |     2    |   89.75   |   88.00   |   91.50   |
> | BSc    |     2    |   66.75   |   55.00   |   78.50   |
> +--------+----------+-----------+-----------+-----------+
> ```

### HAVING — Group pe condition lagao

```sql
-- Sirf wo courses dikhao jahan average marks > 75
SELECT course, AVG(marks) AS avg_marks
FROM students
GROUP BY course
HAVING avg_marks > 75;

-- Cities jahan 2 se zyada students hain
SELECT city, COUNT(*) AS count
FROM students
GROUP BY city
HAVING count > 1;
```

> **Yaad Rakho:** `WHERE` individual rows pe filter karta hai (GROUP BY se pehle). `HAVING` groups pe filter karta hai (GROUP BY ke baad). Ye interview mein poochha jaata hai!

---

## SQL Query Execution Order

```
FROM     → Kaunsi table se?
WHERE    → Kaunsi rows? (filter)
GROUP BY → Kaise group karo?
HAVING   → Kaunse groups? (group filter)
SELECT   → Kya dikhao?
ORDER BY → Kis order mein?
LIMIT    → Kitne results?
```

> **Tip:** Ye order yaad karo — SQL ko samajhne aur debug karne mein bahut help karega!

---

## JOINS — Tables Ko Jodo

Real databases mein data alag-alag tables mein hota hai. Join se hum related data nikalte hain.

### Sample Tables Setup

```sql
-- Kisans table
CREATE TABLE kisans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    state VARCHAR(50),
    phone VARCHAR(15) UNIQUE
);

INSERT INTO kisans (name, village, state, phone) VALUES
('Ramesh Kumar', 'Kheda', 'UP', '9876543210'),
('Suresh Yadav', 'Govindpur', 'UP', '9876543211'),
('Priya Devi', 'Barmer', 'Rajasthan', '9876543212'),
('Mahesh Patel', 'Anand', 'Gujarat', '9876543213'),
('Geeta Kumari', 'Darbhanga', 'Bihar', '9876543214');

-- Crops table (linked to kisans)
CREATE TABLE kisan_crops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kisan_id INT,
    crop_name VARCHAR(50),
    area_acres DECIMAL(6, 2),
    season VARCHAR(20),
    yield_quintals DECIMAL(8, 2),
    FOREIGN KEY (kisan_id) REFERENCES kisans(id)
);

INSERT INTO kisan_crops (kisan_id, crop_name, area_acres, season, yield_quintals) VALUES
(1, 'Wheat', 3.00, 'Rabi', 45.00),
(1, 'Rice', 2.00, 'Kharif', 30.00),
(2, 'Cotton', 5.00, 'Kharif', 25.00),
(2, 'Mustard', 3.50, 'Rabi', 20.00),
(3, 'Bajra', 2.00, 'Kharif', 15.00),
(4, 'Sugarcane', 8.00, 'Annual', 120.00),
(4, 'Cotton', 4.00, 'Kharif', 18.00);
-- Note: Geeta (id=5) ka koi crop nahi hai

-- Orders table
CREATE TABLE market_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kisan_id INT,
    crop_name VARCHAR(50),
    quantity_kg DECIMAL(10, 2),
    price_per_kg DECIMAL(8, 2),
    order_date DATE,
    FOREIGN KEY (kisan_id) REFERENCES kisans(id)
);

INSERT INTO market_orders (kisan_id, crop_name, quantity_kg, price_per_kg, order_date) VALUES
(1, 'Wheat', 500, 22.00, '2026-03-15'),
(1, 'Rice', 300, 35.00, '2026-03-20'),
(2, 'Cotton', 200, 65.00, '2026-03-18'),
(3, 'Bajra', 100, 20.00, '2026-03-25'),
(4, 'Sugarcane', 5000, 3.50, '2026-04-01'),
(4, 'Cotton', 150, 65.00, '2026-04-02'),
(NULL, 'Tomato', 200, 45.00, '2026-04-03');  -- Unknown kisan
```

---

### INNER JOIN — Dono Tables Mein Match

```sql
-- Kisan ka naam + unke crops
SELECT k.name, k.village, kc.crop_name, kc.area_acres, kc.season
FROM kisans k
INNER JOIN kisan_crops kc ON k.id = kc.kisan_id;
```

```
Kisans:     [1, 2, 3, 4, 5]
Crops:      [1, 1, 2, 2, 3, 4, 4]
INNER JOIN: [1, 1, 2, 2, 3, 4, 4]  -- Sirf wo jo DONO mein hain
-- Geeta (5) nahi aayegi — uska koi crop nahi
```

> **Socho Aise:** INNER JOIN ek Venn diagram ka intersection hai — sirf wo rows aayengi jo DONO tables mein match hoti hain.

---

### LEFT JOIN — Left Table Ke Sab + Matching Right

```sql
-- Sab kisans dikhao — chahe unka crop ho ya na ho
SELECT k.name, k.village, kc.crop_name, kc.area_acres
FROM kisans k
LEFT JOIN kisan_crops kc ON k.id = kc.kisan_id;
```

```
LEFT JOIN result:
Ramesh  | Kheda     | Wheat    | 3.00
Ramesh  | Kheda     | Rice     | 2.00
Suresh  | Govindpur | Cotton   | 5.00
Suresh  | Govindpur | Mustard  | 3.50
Priya   | Barmer    | Bajra    | 2.00
Mahesh  | Anand     | Sugarcane| 8.00
Mahesh  | Anand     | Cotton   | 4.00
Geeta   | Darbhanga | NULL     | NULL    -- Geeta bhi aayegi! Crop NULL
```

> **Yaad Rakho:** LEFT JOIN = left table (FROM wali) ke SARE rows aayenge. Right table se match mila to data, nahi mila to NULL.

---

### RIGHT JOIN — Right Table Ke Sab + Matching Left

```sql
-- Sab orders dikhao — chahe kisan pata ho ya na ho
SELECT k.name, mo.crop_name, mo.quantity_kg, mo.price_per_kg
FROM kisans k
RIGHT JOIN market_orders mo ON k.id = mo.kisan_id;
```

```
-- Last row: NULL kisan wala Tomato order bhi dikhega
-- Geeta nahi dikhegi (uska koi order nahi)
```

---

### Joins with Aggregates

```sql
-- Kisan wise total crops area
SELECT k.name, COUNT(kc.id) AS total_crops, SUM(kc.area_acres) AS total_area
FROM kisans k
LEFT JOIN kisan_crops kc ON k.id = kc.kisan_id
GROUP BY k.id, k.name
ORDER BY total_area DESC;

-- Kisan wise total sales
SELECT k.name,
       COUNT(mo.id) AS total_orders,
       SUM(mo.quantity_kg * mo.price_per_kg) AS total_revenue
FROM kisans k
INNER JOIN market_orders mo ON k.id = mo.kisan_id
GROUP BY k.id, k.name
ORDER BY total_revenue DESC;

-- Kisan wise sales — sirf Rs.5000 se zyada wale
SELECT k.name,
       SUM(mo.quantity_kg * mo.price_per_kg) AS revenue
FROM kisans k
INNER JOIN market_orders mo ON k.id = mo.kisan_id
GROUP BY k.id, k.name
HAVING revenue > 5000
ORDER BY revenue DESC;
```

---

## Join Types Summary

```
             LEFT TABLE        RIGHT TABLE
               kisans          kisan_crops
INNER JOIN:    [ matched data only         ]
LEFT JOIN:     [ all kisans  + matched crops (NULL if no match) ]
RIGHT JOIN:    [ matched kisans + all crops ]
FULL OUTER:    [ all kisans  + all crops   ] (MySQL mein directly nahi hai)
```

| Join Type | Left Table | Right Table | Result |
|-----------|-----------|-------------|--------|
| INNER JOIN | Matched only | Matched only | Dono mein match |
| LEFT JOIN | ALL rows | Matched ya NULL | Left ka sab |
| RIGHT JOIN | Matched ya NULL | ALL rows | Right ka sab |

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| `ORDER BY` | Sort karo — ASC (default) ya DESC |
| `LIMIT` | Result count limit karo |
| `DISTINCT` | Unique values only |
| `COUNT()` | Rows gino |
| `SUM()` / `AVG()` | Total / Average nikalo |
| `GROUP BY` | Category wise summary |
| `HAVING` | Group pe condition (WHERE nahi!) |
| `INNER JOIN` | Dono tables mein match |
| `LEFT JOIN` | Left table ka sab + match |
| `RIGHT JOIN` | Right table ka sab + match |
| `FOREIGN KEY` | Doosri table se link |

---

## Aaj Kya Seekha?

- ORDER BY se data sort karna — ASC, DESC, multiple columns
- LIMIT aur OFFSET se pagination
- Aggregate functions — COUNT, SUM, AVG, MIN, MAX
- GROUP BY se category wise summary
- HAVING vs WHERE ka fark
- SQL query execution order
- INNER JOIN, LEFT JOIN, RIGHT JOIN — tables connect karna
- Joins with aggregates — real-world reporting queries
