# Day 86 Evening: Practice — Build Admin API Endpoints

> **Aaj ka plan:** Ab hum hands-on admin API endpoints build karenge aur test karenge. User list, product stats, order analytics, aur dashboard summary — sab APIs banayenge aur Postman se verify karenge.

---

## Task 1: Project Structure Setup

```
backend/
├── controllers/
│   ├── authController.js
│   └── adminController.js      ← NEW
├── middleware/
│   └── auth.js                 ← protect + authorize
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   └── admin.js                ← NEW
├── server.js
└── .env
```

---

## Task 2: Complete Admin Controller

### `controllers/adminController.js`

```javascript
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ============================================
// GET /api/admin/dashboard — Dashboard Summary
// ============================================
exports.getDashboardStats = async (req, res) => {
  try {
    // Sab queries parallel mein — Promise.all se fast!
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      activeUsers,
      newUsersToday,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
    ]);

    // Revenue calculate karo
    const revenueData = await Order.aggregate([
      { $match: { status: { $in: ['completed', 'delivered'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
        }
      },
    ]);

    // Recent 5 users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    // Recent 5 orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('totalAmount status createdAt');

    // Low stock alert — 10 se kam stock wale products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .select('name stock category');

    res.status(200).json({
      success: true,
      data: {
        // Summary cards ke liye
        cards: {
          totalUsers,
          totalProducts,
          totalOrders,
          activeUsers,
          newUsersToday,
          totalRevenue: revenueData[0]?.totalRevenue || 0,
          avgOrderValue: Math.round(revenueData[0]?.avgOrderValue || 0),
        },
        // Tables aur lists ke liye
        recentUsers,
        recentOrders,
        lowStockProducts,
      }
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Dashboard data load nahi hua!' });
  }
};

// ============================================
// GET /api/admin/users — User List + Search
// ============================================
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role,
      isActive,
      sort = '-createdAt',
    } = req.query;

    // Dynamic filter banao
    const filter = {};

    // Search — name ya email mein
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Role filter
    if (role && ['user', 'admin', 'moderator'].includes(role)) {
      filter.role = role;
    }

    // Active filter
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Count + fetch parallel
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password')   // Password KABHI mat bhejo!
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// PUT /api/admin/users/:id/status — User Active/Inactive
// ============================================
exports.toggleUserStatus = async (req, res) => {
  try {
    // Apne aap ko deactivate nahi kar sakte
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Apne aap ko deactivate nahi kar sakte!'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nahi mila!' });
    }

    // Toggle — active tha toh inactive, inactive tha toh active
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully!`,
      data: { _id: user._id, name: user.name, isActive: user.isActive },
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// GET /api/admin/products/stats — Product Statistics
// ============================================
exports.getProductStats = async (req, res) => {
  try {
    // Category wise breakdown
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
        }
      },
      { $sort: { count: -1 } },
    ]);

    // Overall summary
    const overall = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
          cheapest: { $min: '$price' },
          mostExpensive: { $max: '$price' },
        }
      }
    ]);

    // Out of stock products
    const outOfStock = await Product.find({ stock: 0 })
      .select('name category price');

    // Top 5 expensive products
    const topExpensive = await Product.find()
      .sort({ price: -1 })
      .limit(5)
      .select('name price category');

    res.status(200).json({
      success: true,
      data: {
        categoryStats,
        overall: overall[0] || {},
        outOfStock,
        topExpensive,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// GET /api/admin/orders/analytics — Order Analytics
// ============================================
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Daily revenue trend — chart ke liye
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // Status wise breakdown — pie chart ke liye
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        }
      },
    ]);

    // Month wise comparison
    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgValue: { $avg: '$totalAmount' },
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },  // Last 12 months
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyRevenue,
        statusBreakdown,
        monthlyStats,
        period: `Last ${days} days`,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

---

## Task 3: Admin Routes File

### `routes/admin.js`

```javascript
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getProductStats,
  getOrderAnalytics,
} = require('../controllers/adminController');

// Sab admin routes ke liye — pehle login, phir admin check
router.use(protect);
router.use(authorize('admin'));

// Dashboard summary
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/status', toggleUserStatus);

// Product statistics
router.get('/products/stats', getProductStats);

// Order analytics
router.get('/orders/analytics', getOrderAnalytics);

module.exports = router;
```

### `server.js` mein mount karo

```javascript
// Routes mount karo
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));  // ← ADD THIS
```

---

## Task 4: Postman Se Test Karo

> **Tip:** Pehle login karo admin user se, token lo, phir admin routes test karo.

### Test Sequence:

```
1. POST /api/auth/login
   Body: { "email": "admin@test.com", "password": "admin123" }
   → Token copy karo

2. GET /api/admin/dashboard
   Headers: Authorization: Bearer <token>
   → Dashboard stats aayenge

3. GET /api/admin/users?page=1&limit=5&search=arjun
   Headers: Authorization: Bearer <token>
   → Filtered user list aayegi

4. GET /api/admin/products/stats
   Headers: Authorization: Bearer <token>
   → Category wise product stats aayenge

5. GET /api/admin/orders/analytics?days=30
   Headers: Authorization: Bearer <token>
   → Revenue trends aur order analytics aayenge
```

> **Warning:** Normal user (role: 'user') se admin routes access karne ki koshish karo — 403 Forbidden aana chahiye! Ye RBAC ka test hai.

### Admin User Create Karna (Agar Nahi Hai)

```javascript
// Ek baar manually admin user banao — ya seed script likhho
// MongoDB Shell ya Compass mein:
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "admin" } }
);
```

---

## Task 5: Error Handling Verify Karo

```
Test Cases:
 [x] Bina token ke admin route hit karo → 401 Unauthorized
 [x] Normal user token se admin route hit karo → 403 Forbidden
 [x] Expired token se hit karo → 401 Token expired
 [x] Wrong route hit karo → 404 Not Found
 [x] Invalid user ID se status toggle → 404 User nahi mila
 [x] Apna khud ka status toggle → 400 Bad Request
```

> **Example:** API Response jab normal user admin route access kare:
```json
{
  "success": false,
  "message": "user role ko ye access nahi hai! Sirf admin kar sakte hain."
}
```

---

## Quick Revision Table

| Endpoint | Test With | Expected Response |
|----------|-----------|-------------------|
| `GET /dashboard` | Admin token | Stats + recent data |
| `GET /users?search=arjun` | Admin token | Filtered users + pagination |
| `PUT /users/:id/status` | Admin token | Toggle active/inactive |
| `GET /products/stats` | Admin token | Category stats + overall |
| `GET /orders/analytics` | Admin token | Daily revenue + breakdown |
| Any admin route | No token | 401 Unauthorized |
| Any admin route | User token | 403 Forbidden |

---

## Aaj Kya Seekha?

1. **RBAC middleware** properly implement kiya — protect + authorize
2. **Dashboard API** mein Promise.all() se parallel queries — fast response
3. **User management** with search, pagination, status toggle
4. **Product stats** with MongoDB aggregation — $group, $sort
5. **Order analytics** — daily revenue trends, status breakdown, monthly comparison
6. **Security testing** — 401/403 errors properly check kiye

> **Practice Time!** Apne APIs ko Postman collection mein save karo. Ek "delete user" endpoint add karo (soft delete — sirf isActive false karo). Kal hum ye sab data **React admin dashboard** mein display karenge!
