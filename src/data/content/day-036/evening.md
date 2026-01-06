# Day 36 - Evening Session: E-Commerce Schema Design Practice

> **Aaj ka plan:**
> Aaj hum ek complete e-commerce system ka database design karenge — SQL mein tables aur MongoDB mein schemas. Users, products, orders, reviews — sab kuch proper relations ke saath!

---

## E-Commerce System — Requirements

Socho ek "Kisan Market" app hai jahan:
- **Users** register kar sakte hain (buyer ya seller)
- **Sellers** products list karte hain
- **Buyers** products ko order karte hain
- Ek order mein **multiple products** ho sakte hain
- Users **reviews** de sakte hain products pe

```
ENTITIES:
1. Users      → Register, login, buyer/seller
2. Products   → Listed by sellers
3. Orders     → Placed by buyers
4. OrderItems → Products inside an order (junction table)
5. Reviews    → Product reviews by buyers
6. Categories → Product categories
```

---

## SQL Schema Design

### Table 1: Users

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index: email pe search hota hai login mein
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Table 2: Categories

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id INT DEFAULT NULL,  -- Sub-categories ke liye (self-reference)
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Sample data
INSERT INTO categories (name, description) VALUES
('Grains', 'Gehun, Chawal, Daalein'),
('Vegetables', 'Sabziyan'),
('Fruits', 'Phal'),
('Dairy', 'Doodh, Ghee, Paneer'),
('Spices', 'Masaale');
```

### Table 3: Products

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  unit ENUM('kg', 'quintal', 'litre', 'piece', 'dozen') DEFAULT 'kg',
  stock INT DEFAULT 0 CHECK (stock >= 0),
  category_id INT,
  seller_id INT NOT NULL,           -- Kis seller ka product hai
  image_url VARCHAR(500),
  is_organic BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  avg_rating DECIMAL(2, 1) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_price ON products(price);
```

> **Yaad Rakho:**
> `seller_id` ek **foreign key** hai jo `users` table se link karti hai. Yeh **One-to-Many** relationship hai — ek seller ke bahut saare products.

### Table 4: Orders

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  buyer_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  payment_method ENUM('cod', 'upi', 'card', 'netbanking') DEFAULT 'cod',
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  notes TEXT,
  ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP NULL,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### Table 5: Order Items (Junction Table)

```sql
-- Yeh MANY-TO-MANY solve karti hai: Orders <-> Products
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_at_order DECIMAL(10, 2) NOT NULL,  -- Order time ka price freeze karo
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

> **Warning:**
> `price_at_order` mein order ke time ka price rakhte hain, product ka current price nahi. Kyunki agar seller ne price badhaya, toh purane orders ki total galat ho jayegi!

### Table 6: Reviews

```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  -- Ek user ek product pe ek hi review de sakta hai
  UNIQUE KEY unique_review (product_id, user_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
```

---

## SQL Queries — Relationships Use Karo

### User ke saare orders with items

```sql
-- Ramesh ke saare orders with products
SELECT 
  o.id AS order_id,
  o.status,
  o.total_amount,
  p.name AS product_name,
  oi.quantity,
  oi.price_at_order
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.buyer_id = 1
ORDER BY o.ordered_at DESC;
```

### Product with average rating

```sql
-- Product details with reviews
SELECT 
  p.name,
  p.price,
  COUNT(r.id) AS total_reviews,
  AVG(r.rating) AS avg_rating
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id
ORDER BY avg_rating DESC;
```

---

## MongoDB Schema Design

Ab wohi system MongoDB (Mongoose) mein design karenge:

### User Model

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

### Product Model (Reference approach)

```javascript
// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['kg', 'quintal', 'litre', 'piece', 'dozen'], default: 'kg' },
  stock: { type: Number, default: 0, min: 0 },
  // REFERENCE — seller ki ID store karo
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',        // Users collection ka reference
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  imageUrl: String,
  isOrganic: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

### Order Model (Hybrid — embed items, reference user)

```javascript
// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // REFERENCE — buyer ki ID
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // EMBEDDED — order items embed karo (hamesha order ke saath aate hain)
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    priceAtOrder: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: { type: String, required: true },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'card', 'netbanking'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  deliveredAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
```

> **Tip:**
> Order mein `items` ko **embed** kiya kyunki:
> - Items hamesha order ke saath dikhte hain
> - Order place hone ke baad items change nahi hote
> - Ek extra query bachti hai
>
> Par `buyer` ko **reference** kiya kyunki user data independently bhi chahiye hota hai.

### Review Model

```javascript
// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String
}, { timestamps: true });

// Ek user ek product pe ek hi review — compound unique index
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
```

---

## MongoDB Populate — Relations Fetch Karo

```javascript
// Product with seller details
const product = await Product.findById(productId)
  .populate('seller', 'name email phone')    // Seller ki selected fields
  .populate('category', 'name');              // Category naam

// Order with buyer + product details
const order = await Order.findById(orderId)
  .populate('buyer', 'name email phone')
  .populate('items.product', 'name price imageUrl');
```

> **Yaad Rakho:**
> `populate()` internally multiple queries run karta hai. Bahut deep nesting se performance issues aa sakti hain. Sirf zaroori fields select karo.

---

## Quick Revision Table

| Concept | SQL | MongoDB |
|---------|-----|---------|
| One-to-One | FK + UNIQUE | Embed ya separate collection |
| One-to-Many | FK in child table | Reference (ObjectId) ya embed |
| Many-to-Many | Junction table | Array of references |
| Relations fetch | JOIN queries | `populate()` method |
| Schema define | CREATE TABLE (DB level) | mongoose.Schema (code level) |
| Unique constraint | `UNIQUE KEY` | `unique: true` ya compound index |
| Indexing | `CREATE INDEX` | `schema.index()` |
| Price freeze | `price_at_order` column | Embedded in order items |

---

## Aaj Kya Seekha?

1. **Database design** pehle karo — ER diagram bana ke entities aur relationships map karo
2. **Normalization** (1NF, 2NF, 3NF) se data clean aur consistent rehta hai
3. **Foreign keys** relationships enforce karti hain — ON DELETE CASCADE/SET NULL/RESTRICT
4. **Junction table** Many-to-Many ke liye zaroori hai (order_items)
5. **Indexing** frequently searched columns pe karo — queries fast hongi
6. MongoDB mein **embedding** fast reads deta hai, **referencing** flexible hai
7. **Price at order time** store karna zaroori hai — current price change ho sakta hai
8. `populate()` MongoDB mein SQL ke JOIN jaisa kaam karta hai

> **Practice Time!**
> Kal Week 6 Revision hai! Saare concepts revise karenge aur "Kisan Market API" mini project banayenge. Aaj ke schemas ko ek baar khud se banakar dekho!
