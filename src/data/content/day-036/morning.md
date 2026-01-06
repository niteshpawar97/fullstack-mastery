# Day 36 - Morning Session: Database Design & Relations

> **Aaj ka plan:**
> Aaj sabse important topic — **Database Design**! ER diagrams, normalization, relationships (one-to-one, one-to-many, many-to-many), foreign keys, indexing, aur MongoDB mein embedding vs referencing seekhenge. Yeh sab kuch real e-commerce example ke saath!

---

## Database Design Kyun Zaroori Hai?

> **Socho Aise:**
> Ghar banane se pehle naqsha (blueprint) banate hain. Bina naqshe ke ghar banaya toh dikkat aayegi — ek kamra chhota, ek bada, darwaza galat jagah. Database bhi aise hi hai — pehle design karo, phir code karo!

Galat database design ke problems:
- **Data duplication** — ek hi cheez baar baar stored
- **Update anomalies** — ek jagah update kiya, doosri jagah purana
- **Slow queries** — bade tables mein search slow
- **Data inconsistency** — alag jagah alag data

---

## ER Diagrams (Entity-Relationship)

ER Diagram ek visual representation hai database ka — entities (tables), unke attributes (columns), aur relationships dikhata hai.

```
┌─────────────┐         ┌─────────────┐
│   USERS     │         │  PRODUCTS   │
├─────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)     │
│ name        │    1:N  │ name        │
│ email       │────────>│ price       │
│ phone       │         │ category    │
│ role        │         │ seller_id(FK)│
│ created_at  │         │ created_at  │
└─────────────┘         └─────────────┘
        │                       │
        │ 1:N                   │ 1:N
        ▼                       ▼
┌─────────────┐         ┌─────────────┐
│   ORDERS    │         │  REVIEWS    │
├─────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)     │
│ user_id(FK) │         │ product_id  │
│ total       │         │ user_id(FK) │
│ status      │         │ rating      │
│ created_at  │         │ comment     │
└─────────────┘         └─────────────┘
        │
        │ N:M (through order_items)
        ▼
┌──────────────────┐
│   ORDER_ITEMS    │
├──────────────────┤
│ id (PK)          │
│ order_id (FK)    │
│ product_id (FK)  │
│ quantity         │
│ price_at_time    │
└──────────────────┘
```

> **Yaad Rakho:**
> - **PK** = Primary Key (unique identifier)
> - **FK** = Foreign Key (doosri table ka reference)
> - **1:N** = One to Many
> - **N:M** = Many to Many

---

## Normalization — Data Ko Organize Karna

Normalization rules hain jo data duplication aur inconsistency reduce karte hain.

### 1NF (First Normal Form) — Atomic Values

```
❌ GALAT (1NF violate):
| id | name   | phones                    |
|----|--------|---------------------------|
| 1  | Ramesh | 9876543210, 9876543211    |  ← ek cell mein do values!

✅ SAHI (1NF follow):
| id | name   | phone       |
|----|--------|-------------|
| 1  | Ramesh | 9876543210  |
| 1  | Ramesh | 9876543211  |

Ya better — alag table:
USERS: | 1 | Ramesh |
PHONES: | 1 | 1 | 9876543210 |
        | 2 | 1 | 9876543211 |
```

> **Rule:** Ek cell mein ek hi value honi chahiye. Lists, arrays ya comma-separated values mat rakhlo.

### 2NF (Second Normal Form) — No Partial Dependency

```
❌ GALAT (2NF violate):
ORDER_ITEMS:
| order_id | product_id | quantity | product_name | product_price |
                                     ↑ product_name sirf product_id pe depend karta hai,
                                       order_id pe nahi — partial dependency!

✅ SAHI (2NF follow):
ORDER_ITEMS: | order_id | product_id | quantity |
PRODUCTS:    | product_id | product_name | product_price |
```

> **Rule:** Non-key columns sirf poori primary key pe depend karein, kisi ek part pe nahi.

### 3NF (Third Normal Form) — No Transitive Dependency

```
❌ GALAT (3NF violate):
USERS:
| id | name   | city     | state | pincode |
                            ↑ state pincode se pata chal sakta hai — transitive dependency!

✅ SAHI (3NF follow):
USERS:    | id | name | pincode_id (FK) |
PINCODES: | id | pincode | city | state |
```

> **Rule:** Non-key column kisi aur non-key column pe depend nahi karni chahiye.

> **Tip:**
> Real projects mein 3NF tak normalization kaafi hota hai. Zyada normalize karne se queries complex ho jaati hain. Balance rakhna padta hai — **normalize for write, denormalize for read**.

---

## Relationships — Tables Kaise Jude Hain

### 1. One-to-One (1:1)

Ek user ka ek profile. Ek profile ka ek user.

```sql
-- SQL Implementation
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,     -- UNIQUE = ek user ka ek hi profile
  full_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(500),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> **Socho Aise:**
> Aadhaar card aur insaan — ek insaan ka ek hi Aadhaar, ek Aadhaar ka ek hi insaan.

### 2. One-to-Many (1:N) — Sabse Common!

Ek user ke bahut saare orders. Ek order ka ek user.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,           -- Foreign key
  total DECIMAL(10, 2),
  status ENUM('pending', 'shipped', 'delivered'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> **Socho Aise:**
> Ek kisan ke bahut saare fasal (crops) ho sakti hain, par ek fasal ka ek hi kisan owner hota hai.

### 3. Many-to-Many (N:M)

Ek order mein bahut saare products. Ek product bahut saare orders mein.

```sql
-- Junction table / Bridge table chahiye
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  price DECIMAL(10, 2)
);

-- JUNCTION TABLE — yeh dono ko jodti hai
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  price_at_time DECIMAL(10, 2),   -- Order time ka price store karo
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

> **Yaad Rakho:**
> Many-to-Many relationship ke liye hamesha ek **junction/bridge table** chahiye. Is table mein dono tables ke foreign keys hoti hain.

---

## Foreign Keys & ON DELETE

```sql
-- ON DELETE options:
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- CASCADE: User delete → uske saare orders bhi delete

FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
-- SET NULL: User delete → orders mein user_id = NULL

FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
-- RESTRICT: User delete NAHI hoga jab tak orders hain
```

| Option | Kya Hota Hai | Kab Use Karein |
|--------|-------------|----------------|
| CASCADE | Related data bhi delete | Orders, comments (parent ke saath jaayein) |
| SET NULL | FK null ho jaata hai | Optional references |
| RESTRICT | Delete block ho jaata hai | Critical data (payment records) |

---

## Indexing Basics

Index ek "shortcut" hai database mein — search fast karta hai.

```sql
-- Index banao — jis column pe zyada search hota hai
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user ON orders(user_id);

-- Composite index — do columns pe
CREATE INDEX idx_products_cat_price ON products(category, price);
```

> **Socho Aise:**
> Socho ek kitab hai 500 pages ki. Index (table of contents) ke bina topic dhundna = har page padho. Index ke saath = seedha page number pe jaao. Database index bhi same kaam karta hai!

| Index Karein | Index Mat Karein |
|-------------|-----------------|
| Primary keys (auto) | Chhote tables (< 1000 rows) |
| Foreign keys | Rarely searched columns |
| WHERE clause mein aane wale columns | Frequently updated columns |
| JOIN conditions | Boolean columns (true/false) |

---

## MongoDB — Embedding vs Referencing

MongoDB mein relationships do tarike se handle hoti hain:

### Embedding (Data andar rakh do)

```javascript
// Ek document mein sab kuch — EMBEDDED
const orderSchema = {
  user: {
    name: 'Ramesh',
    email: 'ramesh@mail.com'
  },
  items: [
    { product: 'Gehun', price: 2200, quantity: 5 },
    { product: 'Chana', price: 5230, quantity: 2 }
  ],
  total: 21460,
  status: 'pending'
};
```

### Referencing (ID se link karo)

```javascript
// Alag collections — REFERENCED
const orderSchema = {
  userId: ObjectId('660abc...'),       // Users collection ka reference
  items: [
    { productId: ObjectId('660def...'), quantity: 5 },
    { productId: ObjectId('660ghi...'), quantity: 2 }
  ],
  total: 21460,
  status: 'pending'
};
```

| Factor | Embedding | Referencing |
|--------|-----------|-------------|
| Data size | Chhota (< 16MB) | Bada data |
| Read speed | Fast (ek query) | Slow (multiple queries) |
| Write speed | Slow (document bada) | Fast |
| Data duplication | Ho sakta hai | Nahi hota |
| Use case | Comments, addresses | Users, products |

> **Tip:**
> - **Embed** karo jab data ek saath hamesha dikhna hai aur frequently change nahi hota
> - **Reference** karo jab data independently access hota hai ya bahut bada hai

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| ER Diagram | Visual database design | Tables aur relationships |
| 1NF | Atomic values | Ek cell = ek value |
| 2NF | No partial dependency | Non-key → full PK |
| 3NF | No transitive dependency | Non-key → non-key nahi |
| One-to-One | 1:1 relationship | User ↔ Profile |
| One-to-Many | 1:N relationship | User → Orders |
| Many-to-Many | N:M + junction table | Orders ↔ Products |
| Foreign Key | Doosri table ka reference | `user_id REFERENCES users(id)` |
| Index | Search speed booster | `CREATE INDEX idx ON table(col)` |
| Embedding (Mongo) | Data andar rakh do | Comments inside Post |
| Referencing (Mongo) | ID se link karo | userId: ObjectId |

---

## Aaj Kya Seekha?

1. **Database design** coding se pehle hona chahiye — blueprint zaroori hai
2. **ER diagrams** se tables aur relationships visualize hote hain
3. **Normalization** (1NF, 2NF, 3NF) data duplication aur inconsistency reduce karta hai
4. **One-to-Many** sabse common relationship hai — FK child table mein hota hai
5. **Many-to-Many** ke liye junction table chahiye dono tables ke beech
6. **Indexing** se read queries fast hoti hain — par zyada indexes write slow karte hain
7. MongoDB mein **embedding vs referencing** ka choice data pattern pe depend karta hai

> **Practice Time!**
> Evening mein complete e-commerce schema design karenge — users, products, orders, reviews — SQL aur MongoDB dono mein!
