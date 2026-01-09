# Day 39 Evening: Practice — Complete Register/Login API with Roles

> **Aaj ka plan:** Ab hum ek complete authentication system build karenge — register, login, bcrypt password hashing, JWT tokens, aur role-based access control. Sab kuch ek project mein lagayenge aur Postman se test karenge.

---

## Project Setup

> **Terminal Command:**
```bash
mkdir auth-system && cd auth-system
npm init -y
npm install express mongoose bcrypt jsonwebtoken dotenv
```

### Folder Structure

```
auth-system/
├── .env
├── server.js
├── config/
│   └── db.js
├── models/
│   └── User.js
├── routes/
│   └── auth.js
└── middleware/
    └── roleCheck.js
```

> **Terminal Command:**
```bash
mkdir config models routes middleware
touch .env server.js config/db.js models/User.js routes/auth.js middleware/roleCheck.js
```

---

## Step 1: Environment Variables

```env
# .env
PORT=3000
MONGO_URI=mongodb://localhost:27017/auth-system
JWT_SECRET=mera-bohot-lamba-aur-secure-secret-key-2024
JWT_EXPIRE=7d
```

> **Warning:** `.env` file ko `.gitignore` mein dalna mat bhoolo! Secret keys kabhi GitHub pe nahi jaani chahiye.

---

## Step 2: Database Connection

```javascript
// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1); // Server band karo agar DB nahi connect hua
  }
};

module.exports = connectDB;
```

---

## Step 3: User Model

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Naam dena zaroori hai'],
    trim: true,
    maxlength: [50, 'Naam 50 characters se zyada nahi ho sakta']
  },
  email: {
    type: String,
    required: [true, 'Email dena zaroori hai'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Valid email do please']  // Simple email regex
  },
  password: {
    type: String,
    required: [true, 'Password dena zaroori hai'],
    minlength: [6, 'Password kam se kam 6 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'moderator'],
      message: 'Role sirf user, admin ya moderator ho sakta hai'
    },
    default: 'user'
  }
}, {
  timestamps: true  // createdAt aur updatedAt automatic
});

module.exports = mongoose.model('User', userSchema);
```

---

## Step 4: Role Check Middleware

```javascript
// middleware/roleCheck.js

// Factory function — roles accept karta hai, middleware return karta hai
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Pehle login karo!'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' ko ye access nahi hai. Allowed: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
```

---

## Step 5: Auth Routes (Register + Login)

```javascript
// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authorizeRoles = require('../middleware/roleCheck');

const router = express.Router();

// ---- REGISTER ----
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Kya email pehle se registered hai?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ye email already registered hai! Login karo.'
      });
    }

    // Password hash karo
    const salt = await bcrypt.genSalt(10);  // Salt generate
    const hashedPassword = await bcrypt.hash(password, salt);

    // User create karo
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'  // Default role: user
    });

    // JWT token banao
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome aboard!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
      // Password NAHI bhej rahe — security!
    });
  } catch (error) {
    // Mongoose validation errors handle karo
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error!',
      error: error.message
    });
  }
});

// ---- LOGIN ----
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email aur password dono do!'
      });
    }

    // User dhoondho
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ya password galat hai!'  // Generic message — security!
      });
    }

    // Password compare karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ya password galat hai!'  // Same generic message
      });
    }

    // Token banao
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error!',
      error: error.message
    });
  }
});

// ---- GET ALL USERS (Admin only) ----
// Ye auth middleware kal banayenge, abhi simple version
router.get('/users', async (req, res) => {
  try {
    // Token check (temporary — kal middleware banayenge)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token do!' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Sirf admin dekh sakta hai
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Sirf admin ye dekh sakta hai!'
      });
    }

    // Sab users (password hide karke)
    const users = await User.find().select('-password');
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Token invalid hai!'
    });
  }
});

module.exports = router;
```

---

## Step 6: Server Setup

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();

// Body parser
app.use(express.json());

// Database connect karo
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Auth System API chal rahi hai!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

> **Terminal Command:**
```bash
node server.js
```

---

## Postman Se Test Karo

### Test 1: Register a User
```
POST http://localhost:3000/api/auth/register
Body (JSON):
{
  "name": "Ramesh Kumar",
  "email": "ramesh@farm.com",
  "password": "Ramesh@123"
}
→ 201 Created + token milega
```

### Test 2: Register an Admin
```
POST http://localhost:3000/api/auth/register
Body (JSON):
{
  "name": "Admin Sahab",
  "email": "admin@farm.com",
  "password": "Admin@123",
  "role": "admin"
}
→ 201 Created with role: "admin"
```

### Test 3: Duplicate Email
```
POST http://localhost:3000/api/auth/register
Body (JSON):
{
  "name": "Ramesh Duplicate",
  "email": "ramesh@farm.com",
  "password": "kuchbhi"
}
→ 400 Error: "Ye email already registered hai!"
```

### Test 4: Login
```
POST http://localhost:3000/api/auth/login
Body (JSON):
{
  "email": "ramesh@farm.com",
  "password": "Ramesh@123"
}
→ 200 OK + token milega
```

### Test 5: Get All Users (Admin Only)
```
GET http://localhost:3000/api/auth/users
Headers: Authorization: Bearer <admin-ka-token>
→ Sab users dikhenge (password ke bina)
```

### Test 6: Get All Users (Normal User — should fail)
```
GET http://localhost:3000/api/auth/users
Headers: Authorization: Bearer <ramesh-ka-token>
→ 403: "Sirf admin ye dekh sakta hai!"
```

> **Practice Time!** Ye extra exercises karo:
> 1. Ek "moderator" role ka user register karo
> 2. Galat password se login try karo
> 3. Bina password ke register karo — kya error aata hai?
> 4. Ek `/api/auth/me` route banao jo current user ki info de (token se)

---

## Quick Revision Table

| Step | Kya Kiya | Code |
|------|----------|------|
| Hash password | `bcrypt.hash(password, 10)` | Register mein |
| Compare password | `bcrypt.compare(plain, hashed)` | Login mein |
| Check duplicate | `User.findOne({ email })` | Register mein |
| Generate token | `jwt.sign(payload, secret, options)` | Register + Login |
| Hide password | `User.find().select('-password')` | API responses mein |
| Role check | `decoded.role !== 'admin'` | Protected routes mein |
| Generic errors | Same message for email/password wrong | Login mein |

---

## Aaj Kya Seekha?

1. **bcrypt.genSalt()** + **bcrypt.hash()** se password securely store hota hai
2. **Registration flow**: duplicate check → hash → save → token
3. **Login flow**: find user → compare → token
4. **Generic error messages** se hackers ko hint nahi milta
5. **Role-based access** se admin-only routes protect hote hain
6. **`.select('-password')`** se response mein password nahi aata

> **Kal ka preview:** Kal hum reusable auth middleware banayenge jo har protected route pe token verify kare, aur refresh tokens ka concept samjhenge!
