# Day 39 Morning: Auth System — Register/Login + Role-Based Access

> **Aaj ka plan:** Aaj hum real-world authentication system banayenge — password hashing with bcrypt, user registration, login flow, aur role-based access control. Kal JWT seekha tha, aaj usse real system mein lagayenge.

---

## Password Hashing — Kyun Zaroori Hai?

### Plain Text Password = Disaster

Agar tum database mein password seedha store karo (`password: "123456"`), toh:
- Agar database hack ho gaya → sab passwords leak!
- Database admin bhi passwords padh sakta hai
- Ye **sabse badi security galti** hai

> **Socho Aise:** Ek farmer apne locker ki chaabi seedha drawer mein rakh de bina cover ke — koi bhi le sakta hai. Lekin agar chaabi ek puzzle box mein ho jise sirf farmer khol sake, toh safe hai. Password hashing wahi puzzle box hai.

### Hashing Kya Hai?

Hashing = ek one-way function jo password ko **unreadable string** mein convert karta hai.

```
"123456" → "$2b$10$N9qo8uLOickgx2ZMRZoMye.IjqQBrkHx7.qYKtY..."
```

> **Yaad Rakho:** Hashing **one-way** hai — hashed password se original password nikalna practically impossible hai. Ye encryption se alag hai (encryption reverse ho sakta hai, hashing nahi).

---

## bcrypt Package — Industry Standard

### Kyun bcrypt?

| Feature | MD5/SHA | bcrypt |
|---------|---------|--------|
| Speed | Bohot fast | Intentionally slow |
| Salt | Manually add karna padta | Built-in salt |
| Security | Weak (rainbow table attack) | Strong |
| Industry use | Purana, avoid karo | Standard hai |

> **Tip:** bcrypt **intentionally slow** hai — ye feature hai, bug nahi! Slow hashing ka matlab hai hacker ko brute-force mein zyada time lagega.

### Installation

> **Terminal Command:**
```bash
npm install bcrypt
```

### Password Hash Karna

```javascript
const bcrypt = require('bcrypt');

// Salt rounds — kitni baar hash hoga (10-12 recommended)
const SALT_ROUNDS = 10;

// ---- Password hash karna ----
async function hashPassword(plainPassword) {
  // bcrypt apna salt generate karta hai
  const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hashedPassword;
}

// Test karo
async function test() {
  const password = 'Ramesh@123';
  const hashed = await hashPassword(password);
  
  console.log('Original:', password);
  console.log('Hashed:', hashed);
  // $2b$10$N9qo8uLOickgx2ZMRZoMyeIjqQBrkHx7qYKtY...
  console.log('Hash length:', hashed.length); // Hamesha 60 characters
}

test();
```

### Password Compare Karna

```javascript
// ---- Password compare karna (login ke waqt) ----
async function checkPassword(plainPassword, hashedPassword) {
  // bcrypt khud compare karta hai
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
}

async function testCompare() {
  const hashed = await bcrypt.hash('Ramesh@123', 10);
  
  // Sahi password
  const result1 = await bcrypt.compare('Ramesh@123', hashed);
  console.log('Sahi password:', result1);   // true
  
  // Galat password
  const result2 = await bcrypt.compare('WrongPass', hashed);
  console.log('Galat password:', result2);  // false
}

testCompare();
```

> **Warning:** Kabhi `===` se hashed passwords compare mat karo! Hamesha `bcrypt.compare()` use karo. Same password har baar alag hash deta hai (salt ki wajah se).

---

## User Registration Flow

### Step-by-Step Process

```
1. User bhejta hai → { name, email, password }
2. Server check karta hai → Kya email already exists?
3. Agar nahi → Password ko hash karo (bcrypt)
4. Database mein save karo → { name, email, hashedPassword, role }
5. Response bhejo → "Registration successful!"
```

### User Model (MongoDB/Mongoose)

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Naam dena zaroori hai'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email dena zaroori hai'],
    unique: true,           // Duplicate email nahi chalega
    lowercase: true,        // Automatically lowercase
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password dena zaroori hai'],
    minlength: [6, 'Password kam se kam 6 characters ka ho']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],  // Sirf ye 3 roles allowed
    default: 'user'                         // Default role: user
  }
}, { timestamps: true });  // createdAt, updatedAt automatic

module.exports = mongoose.model('User', userSchema);
```

### Register Route

```javascript
// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'mera-secret-key';

// ---- REGISTER ----
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Step 1: Check — kya email already exist karti hai?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ye email already registered hai!'
      });
    }

    // Step 2: Password hash karo
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: User create karo
    const user = await User.create({
      name,
      email,
      password: hashedPassword  // Hashed password save karo, plain nahi!
    });

    // Step 4: Token banao (optional — auto login after register)
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    // Step 5: Response bhejo
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
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
```

> **Yaad Rakho:** Response mein **kabhi password mat bhejo** — na plain, na hashed. Sirf safe fields bhejo (name, email, role).

---

## Login Flow

```javascript
// ---- LOGIN ----
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: User dhoondho email se
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ya password galat hai!'  // Specific mat batao ki kya galat hai!
      });
    }

    // Step 2: Password compare karo
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Email ya password galat hai!'  // Same message dono case mein
      });
    }

    // Step 3: Token banao
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    // Step 4: Response
    res.json({
      success: true,
      message: 'Login successful!',
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

module.exports = router;
```

> **Warning:** Login fail hone pe hamesha **generic message** do: "Email ya password galat hai." Kabhi mat batao ki "Email exist nahi karta" ya "Password galat hai" — isse hacker ko pata chal jaata hai ki email registered hai ya nahi.

---

## Role-Based Access Control (RBAC)

### Roles Kya Hote Hain?

| Role | Permissions |
|------|------------|
| `user` | Apna data dekh sakta hai, edit kar sakta hai |
| `moderator` | User wala + doosron ka content manage kar sakta hai |
| `admin` | Sab kuch kar sakta hai — users manage, delete, settings |

> **Socho Aise:** Ek farming cooperative mein: **Member** (user) sirf apni fasal ka data dekh sakta hai. **Supervisor** (moderator) poore village ka data dekh sakta hai. **Director** (admin) poore system ko manage karta hai.

### Role-Check Middleware

```javascript
// middleware/roleCheck.js

// Ye function ek middleware return karta hai jo specific roles check kare
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // req.user auth middleware se aata hai (kal banayenge)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Pehle login karo!'
      });
    }

    // Kya user ka role allowed roles mein hai?
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Tumhare paas permission nahi hai!'
      });
    }

    next();  // Role match hua — aage jaao
  };
}

module.exports = authorizeRoles;
```

### Routes Mein Use Karo

```javascript
const authorizeRoles = require('../middleware/roleCheck');

// Sabhi users ke liye
router.get('/products', getAllProducts);

// Sirf admin ke liye
router.delete('/products/:id', authorizeRoles('admin'), deleteProduct);

// Admin aur moderator ke liye
router.put('/products/:id', authorizeRoles('admin', 'moderator'), updateProduct);

// Sirf logged-in user ke liye (koi bhi role)
router.get('/profile', authorizeRoles('user', 'admin', 'moderator'), getProfile);
```

---

## Quick Revision Table

| Topic | Key Point |
|-------|-----------|
| Plain text password | Kabhi store mat karo — biggest mistake |
| bcrypt.hash() | Password ko hash karta hai (one-way) |
| bcrypt.compare() | Hash ke saath plain password match karta hai |
| Salt rounds | 10-12 recommended — zyada = slow but safer |
| Register flow | Check duplicate → Hash password → Save → Token |
| Login flow | Find user → Compare password → Token |
| Generic error | "Email ya password galat" — specific mat batao |
| RBAC | user, moderator, admin roles |
| authorizeRoles() | Middleware jo check kare ki role allowed hai ya nahi |
| Token mein role | JWT payload mein role rakho permission check ke liye |

---

## Aaj Kya Seekha?

1. **bcrypt** se password hashing karo — `hash()` se banao, `compare()` se check karo
2. Registration mein **duplicate email check** zaroori hai
3. Login mein **generic error messages** do — specific mat batao
4. **Role-based access** se alag users ko alag permissions milti hain
5. `authorizeRoles()` middleware se routes protect hote hain
6. Response mein **kabhi password mat bhejo**

> **Practice Time!** Evening mein hum complete register/login API build karenge bcrypt + JWT ke saath, roles add karenge, aur Postman se test karenge!
