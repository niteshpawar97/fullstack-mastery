# Day 86 Morning: Admin Dashboard — Backend APIs

> **Aaj ka plan:** Aaj hum backend mein wapas aayenge! Admin dashboard ke liye specific APIs banayenge — user management, product management, analytics/stats, protected admin routes, aur RBAC (Role-Based Access Control) middleware. Backend hamara core hai — aaj usse power denge!

---

## Dashboard Requirements Samjho

### Admin Ko Kya Chahiye?

Ek admin dashboard mein ye features hote hain:

| Feature | API Endpoint | Description |
|---------|-------------|-------------|
| Dashboard Summary | `GET /api/admin/dashboard` | Total users, products, orders, revenue |
| User Management | `GET /api/admin/users` | List all users, search, filter |
| Product Stats | `GET /api/admin/products/stats` | Category-wise count, price range |
| Order Analytics | `GET /api/admin/orders/analytics` | Daily revenue, order trends |
| CRUD Operations | Various endpoints | Users, products manage karo |

> **Socho Aise:** Socho tum ek school ke principal ho. Tumhe ek dashboard chahiye jahan se dikhe — kitne students hain, kitne teachers, attendance kya hai, results kaisa raha. Admin dashboard exactly wahi hai — business ke liye!

---

## RBAC (Role-Based Access Control) Middleware

### User Roles

```javascript
// models/User.js mein role field add karo (agar pehle se nahi hai)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  phone: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

### Auth + Role Middleware

```javascript
// middleware/auth.js — Token verify karo
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Pehla middleware — authenticate (token check)
const protect = async (req, res, next) => {
  try {
    let token;

    // Token header se nikalo
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Login karo pehle! Token nahi mila.'
      });
    }

    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User nahi mila. Token invalid hai.'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token expired ya invalid!'
    });
  }
};

// Doosra middleware — authorize (role check)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `${req.user.role} role ko ye access nahi hai! Sirf ${roles.join(', ')} kar sakte hain.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
```

> **Yaad Rakho:** `protect` check karta hai user logged in hai ya nahi (401). `authorize` check karta hai user ka role allowed hai ya nahi (403). Dono alag responsibilities hain — pehle authenticate, phir authorize!

### Routes Mein Use Karo

```javascript
// routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Sab admin routes protected hain — pehle login, phir admin role check
router.use(protect);                    // Sabse pehle: logged in hai?
router.use(authorize('admin'));         // Phir: admin hai?

// Ab sab routes sirf admin ke liye hain
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/products/stats', getProductStats);
router.get('/orders/analytics', getOrderAnalytics);

module.exports = router;
```

> **Tip:** `router.use()` se middleware sab routes pe lag jata hai. Isse har route pe individually likhne ki zaroorat nahi. Clean aur DRY code!

---

## Dashboard Summary API

```javascript
// controllers/adminController.js

// GET /api/admin/dashboard — Dashboard ka summary data
const getDashboardStats = async (req, res) => {
  try {
    // Parallel mein sab queries chalaao — fast!
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      activeUsers,
      recentUsers,
      lowStockProducts,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Product.find({ stock: { $lt: 10 } }).select('name stock'),
    ]);

    // Total revenue calculate karo
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          activeUsers,
          totalRevenue,
        },
        recentUsers,
        lowStockProducts,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

> **Yaad Rakho:** `Promise.all()` se multiple database queries parallel mein chalti hain — bahut fast! Agar ek-ek karke chalate toh 6x slow hota. Real dashboards mein ye optimization bahut important hai.

---

## User Management API

```javascript
// GET /api/admin/users — Sab users ki list + search + pagination
const getAllUsers = async (req, res) => {
  try {
    // Query params se filters nikalo
    const { page = 1, limit = 10, search, role, isActive, sort = '-createdAt' } = req.query;

    // Filter object banao
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Total count (pagination ke liye)
    const total = await User.countDocuments(filter);

    // Users fetch karo — password chhod do
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id/role — User ka role change karo
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['user', 'admin', 'moderator'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role! Allowed: ${allowedRoles.join(', ')}`
      });
    }

    // Apna khud ka role change nahi kar sakte
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Apna role khud change nahi kar sakte!'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila!' });
    }

    res.status(200).json({ success: true, data: user });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

---

## Product Stats API (Aggregation)

```javascript
// GET /api/admin/products/stats — Products ki aggregated statistics
const getProductStats = async (req, res) => {
  try {
    // Category wise stats
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        }
      },
      { $sort: { count: -1 } },  // Sabse zyada products wali category pehle
    ]);

    // Price range distribution
    const priceDistribution = await Product.aggregate([
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 100, 500, 1000, 5000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            products: { $push: '$name' },
          }
        }
      }
    ]);

    // Overall stats
    const overallStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        categoryStats,
        priceDistribution,
        overall: overallStats[0] || {},
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

> **Socho Aise:** MongoDB aggregation aise hai jaise Excel ka pivot table — data ko group karke, count karke, average nikalke summary banata hai. Dashboard ke charts yehi data use karte hain!

---

## Order Analytics API

```javascript
// GET /api/admin/orders/analytics — Order trends aur revenue
const getOrderAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;  // Default last 30 days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily revenue trend
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        }
      },
      { $sort: { _id: 1 } },  // Date wise sort
    ]);

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        }
      }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          name: '$productInfo.name',
          totalSold: 1,
          totalRevenue: 1,
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyRevenue,
        statusDistribution,
        topProducts,
        period: `Last ${days} days`,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

---

## Routes File Complete

```javascript
// routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getProductStats,
  getOrderAnalytics,
} = require('../controllers/adminController');

// Sab routes protected + admin only
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

// Products
router.get('/products/stats', getProductStats);

// Orders
router.get('/orders/analytics', getOrderAnalytics);

module.exports = router;

// app.js / server.js mein mount karo
// app.use('/api/admin', require('./routes/admin'));
```

---

## Quick Revision Table

| API | Method | Route | Purpose |
|-----|--------|-------|---------|
| Dashboard Stats | GET | `/api/admin/dashboard` | Summary cards data |
| All Users | GET | `/api/admin/users` | User list + search + pagination |
| Update Role | PUT | `/api/admin/users/:id/role` | User ka role change karo |
| Product Stats | GET | `/api/admin/products/stats` | Category-wise statistics |
| Order Analytics | GET | `/api/admin/orders/analytics` | Revenue trends, top products |
| RBAC Middleware | — | `protect` + `authorize` | Auth + role check |

---

## Aaj Kya Seekha?

1. **RBAC middleware** — `protect` (authentication) + `authorize` (role check) — security layers
2. **Promise.all()** se parallel queries — dashboard data fast load hota hai
3. **MongoDB Aggregation** — $group, $bucket, $lookup — analytics data ke liye powerful
4. **Search + Pagination** — query params se dynamic filtering
5. **Admin-only routes** — `router.use(protect, authorize('admin'))` se sab routes protected
6. **Analytics APIs** — daily revenue, top products, status distribution

> **Practice Time!** Evening mein hum in APIs ko build aur test karenge Postman se. Sab endpoints banao aur verify karo!
