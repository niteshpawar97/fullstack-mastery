# Day 61 Evening: Practice — Monolithic E-Commerce System Design

> **Aaj ka plan:** Ab theory ko practice mein badlenge! Ek monolithic e-commerce system design karenge — components identify karenge, architecture diagram samjhenge, aur folder structure plan karenge.

---

## Challenge: Design a Monolithic E-Commerce System

### Business Requirements

Socho tumhe ek **"KisanBazaar"** app banana hai — jahan farmers apni fasal online bech sakte hain aur buyers seedha kisan se khareed sakte hain.

> **Socho Aise:** Ye ek real-world problem hai. India mein farmers ko sahi price nahi milta kyunki beech mein bahut middlemen hote hain. Tumhara app ye problem solve karega!

### Features List:

| Feature | Description |
|---------|------------|
| User Management | Farmer aur Buyer register/login kar sakte hain |
| Product Listing | Farmer apni fasal list kar sakta hai (naam, price, photo) |
| Search & Filter | Buyer crop type, location, price se search kar sake |
| Cart & Order | Buyer cart mein add kare, order place kare |
| Payment | Online payment (UPI, card) |
| Reviews | Buyer farmer ko review de sake |
| Notifications | Order status updates (SMS/Email) |
| Admin Panel | Admin sab manage kar sake |

---

## Step 1: Components Identify Karo

### Core Components of KisanBazaar Monolith

```
KisanBazaar Monolith Components:

1. AUTH MODULE
   - User registration (Farmer/Buyer)
   - Login / Logout
   - JWT token management
   - Password reset

2. USER MODULE
   - Profile management
   - Farmer profile (farm location, crops)
   - Buyer profile (delivery address)

3. PRODUCT MODULE
   - Crop listing (CRUD)
   - Image upload
   - Categories (Grains, Vegetables, Fruits)
   - Stock management

4. SEARCH MODULE
   - Search by crop name
   - Filter by price, location, category
   - Sort by price, rating, date

5. ORDER MODULE
   - Cart management
   - Order placement
   - Order tracking
   - Order history

6. PAYMENT MODULE
   - Payment gateway integration
   - Transaction records
   - Refund management

7. REVIEW MODULE
   - Farmer ratings
   - Product reviews
   - Average rating calculation

8. NOTIFICATION MODULE
   - Email notifications
   - SMS notifications (order updates)
   - In-app notifications

9. ADMIN MODULE
   - User management
   - Product approval
   - Reports & analytics
```

> **Yaad Rakho:** Monolith mein ye sab modules ek hi codebase mein hain. Ek hi `package.json`, ek hi database, ek hi server. Lekin code ko logically separate rakhna important hai!

---

## Step 2: Architecture Diagram (Text)

```
                    ┌─────────────┐
                    │   CLIENTS   │
                    │ (Browser /  │
                    │  Mobile)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   NGINX     │
                    │ (Reverse    │
                    │  Proxy)     │
                    └──────┬──────┘
                           │
         ┌─────────────────▼─────────────────┐
         │      KisanBazaar MONOLITH          │
         │                                     │
         │  ┌──────┐ ┌────────┐ ┌──────────┐ │
         │  │ Auth │ │Products│ │  Search   │ │
         │  └──────┘ └────────┘ └──────────┘ │
         │                                     │
         │  ┌──────┐ ┌────────┐ ┌──────────┐ │
         │  │Orders│ │Payment │ │  Reviews  │ │
         │  └──────┘ └────────┘ └──────────┘ │
         │                                     │
         │  ┌──────┐ ┌────────┐ ┌──────────┐ │
         │  │Users │ │Notific.│ │  Admin    │ │
         │  └──────┘ └────────┘ └──────────┘ │
         │                                     │
         └──────────┬──────────┬──────────────┘
                    │          │
            ┌───────▼───┐  ┌──▼──────────┐
            │  MongoDB  │  │ File Storage │
            │ (Database)│  │ (Uploads)    │
            └───────────┘  └─────────────┘
```

> **Tip:** Real projects mein Nginx reverse proxy use hota hai client aur app ke beech — ye load balancing aur SSL handle karta hai.

---

## Step 3: Database Schema Plan

```javascript
// models/User.js
const userSchema = {
  name: String,
  email: String,
  password: String,        // hashed
  role: String,            // 'farmer' ya 'buyer' ya 'admin'
  phone: String,
  address: {
    village: String,
    district: String,
    state: String,
    pincode: String
  },
  // Farmer specific
  farmDetails: {
    farmSize: String,      // "5 acres"
    crops: [String],       // ["Wheat", "Rice"]
    location: {
      lat: Number,
      lng: Number
    }
  },
  createdAt: Date
};

// models/Product.js
const productSchema = {
  farmer: ObjectId,        // ref: 'User' — kis farmer ka hai
  name: String,            // "Organic Wheat"
  category: String,        // "Grains"
  description: String,
  price: Number,           // per kg price
  quantity: Number,         // available stock in kg
  images: [String],        // photo URLs
  isApproved: Boolean,     // admin approval
  rating: Number,          // average rating
  createdAt: Date
};

// models/Order.js
const orderSchema = {
  buyer: ObjectId,         // ref: 'User'
  items: [{
    product: ObjectId,     // ref: 'Product'
    quantity: Number,      // kitna kg
    price: Number          // us waqt ka price
  }],
  totalAmount: Number,
  status: String,          // 'pending', 'confirmed', 'shipped', 'delivered'
  paymentStatus: String,   // 'pending', 'paid', 'refunded'
  deliveryAddress: Object,
  createdAt: Date
};
```

---

## Step 4: Folder Structure Plan

```
kisanbazaar/
├── src/
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   ├── cloudinary.js      # Image upload config
│   │   └── constants.js       # App constants
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── Transaction.js
│   │
│   ├── controllers/
│   │   ├── authController.js       # login, register, logout
│   │   ├── userController.js       # profile CRUD
│   │   ├── productController.js    # crop listing CRUD
│   │   ├── orderController.js      # cart, orders
│   │   ├── paymentController.js    # payment processing
│   │   ├── reviewController.js     # ratings & reviews
│   │   ├── searchController.js     # search & filter
│   │   └── adminController.js      # admin operations
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── searchRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── roleCheck.js       # farmer/buyer/admin check
│   │   ├── upload.js          # multer image upload
│   │   ├── validate.js        # input validation
│   │   └── errorHandler.js    # global error handler
│   │
│   ├── services/
│   │   ├── emailService.js    # email bhejne ka logic
│   │   ├── smsService.js      # SMS notification
│   │   └── paymentService.js  # payment gateway logic
│   │
│   ├── utils/
│   │   ├── helpers.js
│   │   └── apiResponse.js     # standard response format
│   │
│   └── app.js                 # Express app setup — sab yahan connect
│
├── tests/
│   ├── auth.test.js
│   ├── product.test.js
│   └── order.test.js
│
├── .env                       # environment variables
├── .gitignore
├── package.json
└── server.js                  # entry point — server start
```

> **Practice Time!** Apne system mein ek aur module add karo — **"Logistics Module"** jo delivery tracking handle kare. Socho iske kaunse routes, controllers, aur models honge?

---

## Step 5: API Routes Plan

```javascript
// Sab routes ka overview — monolith mein sab ek jagah register hote hain

// Auth Routes
// POST /api/auth/register    — naya user register
// POST /api/auth/login       — login karo
// POST /api/auth/logout      — logout karo
// POST /api/auth/forgot-password

// Product Routes
// GET    /api/products        — sab products dekho
// POST   /api/products        — naya product add (farmer only)
// GET    /api/products/:id    — ek product ki detail
// PUT    /api/products/:id    — product update (farmer only)
// DELETE /api/products/:id    — product delete (farmer only)

// Order Routes
// POST   /api/orders          — naya order place karo
// GET    /api/orders          — meri orders dekho
// GET    /api/orders/:id      — order detail
// PUT    /api/orders/:id      — order status update

// Search Routes
// GET    /api/search?q=wheat&category=grains&minPrice=50&maxPrice=200
```

> **Warning:** Monolith mein sab routes ek hi Express app mein register hote hain. Jab routes 100+ ho jaayein — app.js file bahut badi ho jaati hai. Tab modular approach chahiye (kal dekhenge!).

---

## Quick Revision Table

| Step | Kya Kiya |
|------|----------|
| Requirements | Business features list banaya — 8 major features |
| Components | 9 modules identify kiye (Auth, User, Product, etc.) |
| Architecture | Single monolith + MongoDB + Nginx diagram |
| Database | User, Product, Order schemas design kiye |
| Folder Structure | Organized folders — controllers, routes, models alag |
| API Routes | REST endpoints plan kiye har module ke liye |

---

## Aaj Kya Seekha?

1. **System Design pehle karo**, code baad mein — ye approach professional hai
2. Monolith mein sab modules **ek codebase** mein hain lekin **logically separate** rakhte hain
3. **Folder structure** sahi rakhna bahut important hai — maintainability ke liye
4. **Database schema** pehle plan karo — baad mein change karna mushkil hota hai
5. Monolith **real-world apps** ke liye valid architecture hai — KisanBazaar jaise app ke liye perfect start
6. Kal dekhenge kaise is monolith ko **modules mein todh sakte hain**!
