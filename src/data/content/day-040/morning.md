# Day 40 Morning: Auth Middleware + Protected Routes

> **Aaj ka plan:** Aaj hum reusable auth middleware banayenge jo har protected route pe automatically token check kare. Refresh tokens ka concept samjhenge, logout strategies, aur common security mistakes jinse bachna hai.

---

## Auth Middleware — Kyun Zaroori Hai?

### Problem: Har Route Mein Token Check?

Kal humne `/users` route mein directly token verify kiya tha. Lekin agar 50 protected routes hain, toh kya har ek mein same code likhoge?

```javascript
// ❌ Galat approach — har route mein copy-paste
router.get('/users', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token do!' });
  const decoded = jwt.verify(token, SECRET);
  // ... same code bar bar 😫
});
```

### Solution: Ek Middleware Banao — Sab Jagah Lagao

```javascript
// ✅ Sahi approach — middleware ek baar likho, har jagah use karo
router.get('/users', authMiddleware, authorizeRoles('admin'), getUsers);
router.get('/profile', authMiddleware, getProfile);
router.put('/settings', authMiddleware, updateSettings);
```

> **Socho Aise:** Ek factory mein ek security guard gate pe baitha hai — har employee ko check karta hai. Tumhe har room mein alag guard nahi rakhna padta. Auth middleware wahi gate ka guard hai — ek jagah likho, poore app ko protect karo.

---

## Auth Middleware Banana

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Step 1: Authorization header se token nikalo
    const authHeader = req.headers['authorization'];

    // Check karo — header hai bhi ya nahi?
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied! Token provide karo. Format: Bearer <token>'
      });
    }

    // "Bearer eyJhbGci..." → "eyJhbGci..."
    const token = authHeader.split(' ')[1];

    // Step 2: Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 3: User database se dhoondho (fresh data ke liye)
    const user = await User.findById(decoded.userId).select('-password');

    // Kya user ab bhi exist karta hai? (Account delete ho sakta hai)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User ab exist nahi karta! Dubara register karo.'
      });
    }

    // Step 4: User ko request object mein attach karo
    req.user = user;

    // Step 5: Aage jaao — next middleware ya route handler
    next();

  } catch (error) {
    // Token related errors handle karo
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalid hai! Sahi token do.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expire ho gaya! Dubara login karo.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Auth error!',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
```

> **Yaad Rakho:** Auth middleware ke baad `req.user` mein user ka data hota hai. Koi bhi route handler `req.user` se current user ki info le sakta hai — userId, name, role, sab kuch.

---

## Routes Mein Middleware Use Karna

### Protected Routes Setup

```javascript
// routes/user.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleCheck');

// ---- PUBLIC ROUTES (koi bhi access kar sakta hai) ----
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);

// ---- PROTECTED ROUTES (login zaroori hai) ----
router.get('/profile', authMiddleware, async (req, res) => {
  // req.user auth middleware ne set kiya hai
  res.json({
    success: true,
    user: req.user  // Password nahi aayega — select('-password') ki wajah se
  });
});

router.put('/profile', authMiddleware, async (req, res) => {
  // Sirf apna profile update kar sakta hai
  const user = await User.findByIdAndUpdate(
    req.user._id,           // Logged-in user ki ID
    { name: req.body.name }, // Sirf allowed fields update karo
    { new: true, runValidators: true }
  ).select('-password');

  res.json({ success: true, user });
});

// ---- ADMIN ONLY ROUTES ----
router.get('/admin/users', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ success: true, count: users.length, users });
});

router.delete('/admin/users/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted!' });
});

// ---- ADMIN + MODERATOR ROUTES ----
router.put('/moderate/users/:id/ban', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  async (req, res) => {
    // Admin ya moderator user ko ban kar sakta hai
    res.json({ success: true, message: 'User banned!' });
  }
);
```

### Middleware Chain Samjho

```
Request → authMiddleware → authorizeRoles('admin') → Route Handler → Response

Step 1: authMiddleware → Token valid hai? User exist karta hai? → req.user set karo
Step 2: authorizeRoles → User ka role allowed hai? 
Step 3: Route Handler → Kaam karo, response bhejo
```

> **Tip:** Middleware ka order matter karta hai! Pehle `authMiddleware` (verify kaun hai), phir `authorizeRoles` (permission check). Ulta karoge toh kaam nahi karega.

---

## Refresh Tokens — Concept Samjho

### Problem: Short-Lived Access Tokens

Access tokens 15-60 min mein expire hote hain. Toh user ko har ghante login karna padega?

### Solution: Access Token + Refresh Token

| Token | Expiry | Purpose |
|-------|--------|---------|
| Access Token | 15 min - 1 hour | API access ke liye |
| Refresh Token | 7 - 30 days | Naya access token lene ke liye |

### Flow:

```
1. Login → Server dono tokens deta hai (access + refresh)
2. Client access token se API call karta hai
3. Access token expire hua → 401 error
4. Client refresh token bhejta hai → POST /refresh-token
5. Server naya access token deta hai
6. Refresh token bhi expire hua → User ko dubara login karna padega
```

```javascript
// Refresh token route ka basic idea
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token do!' });
  }

  try {
    // Refresh token verify karo (alag secret use karo)
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Naya access token banao
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }  // Short lived
    );

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    res.status(403).json({ message: 'Refresh token invalid — login karo!' });
  }
});
```

> **Socho Aise:** Access token ek day pass hai jo roz expire hota hai. Refresh token ek monthly pass hai jisse tum roz naya day pass le sakte ho. Monthly pass expire hone pe counter pe jaake naya lena padega (login).

---

## Logout Strategies

### Strategy 1: Client-Side Logout (Simple)

```javascript
// Client pe token delete kar do — server ko kuch nahi karna
localStorage.removeItem('token');
// Ya cookie clear karo
```

**Problem:** Token abhi bhi valid hai! Agar kisine copy kar liya toh use kar sakta hai.

### Strategy 2: Token Blacklist (Better)

```javascript
// Server pe ek blacklist maintain karo
const tokenBlacklist = new Set(); // Ya Redis use karo

router.post('/logout', authMiddleware, (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  
  // Token ko blacklist mein daal do
  tokenBlacklist.add(token);
  
  res.json({ success: true, message: 'Logged out!' });
});

// Auth middleware mein check karo
if (tokenBlacklist.has(token)) {
  return res.status(401).json({ message: 'Token revoked! Login karo.' });
}
```

### Strategy 3: Short Expiry + Refresh Token (Best)

- Access token 15 min ka — expire hone do
- Refresh token database mein store karo — logout pe delete karo
- Sabse secure approach

> **Yaad Rakho:** JWT stateless hai — ek baar issue hone ke baad expire hone tak valid rehta hai. Isliye short expiry + refresh token pattern sabse popular hai.

---

## Common Security Mistakes

| Mistake | Kyun Galat | Sahi Approach |
|---------|-----------|---------------|
| Secret key code mein | GitHub pe leak ho jaayegi | `.env` file use karo |
| Weak secret key | Guess ho sakti hai | Lambi random string use karo |
| No expiry on token | Chori hone pe hamesha ke liye use | Hamesha expiry set karo |
| Sensitive data in payload | JWT decode karna aasan hai | Sirf userId + role rakho |
| Same error for all | Debug mushkil hota hai | Different errors internally, generic to user |
| No HTTPS | Token intercept ho sakta hai | Production mein hamesha HTTPS |
| Token in URL | Browser history mein dikh jaayega | Header mein bhejo, URL mein kabhi nahi |

> **Warning:** Production mein ye checklist follow karo:
> - Secret key .env mein ho
> - HTTPS enabled ho
> - Token expiry short ho
> - Passwords bcrypt se hashed ho
> - Error messages generic ho
> - CORS properly configured ho

---

## Quick Revision Table

| Topic | Key Point |
|-------|-----------|
| Auth Middleware | Token extract → verify → user find → req.user set |
| req.user | Middleware ke baad available hota hai |
| Middleware chain | authMiddleware → authorizeRoles → handler |
| 401 Unauthorized | Token nahi hai ya invalid hai |
| 403 Forbidden | Token valid lekin permission nahi hai |
| Refresh Token | Naya access token lene ke liye use hota hai |
| Token Blacklist | Logout pe token invalidate karna |
| Short expiry | Security ke liye — 15 min to 1 hour |
| HTTPS | Production mein mandatory |
| Error handling | JsonWebTokenError, TokenExpiredError alag handle karo |

---

## Aaj Kya Seekha?

1. **Auth middleware** ek baar likho — sab protected routes pe lagao
2. **req.user** se kisi bhi route mein current user ki info milti hai
3. **Middleware chain**: pehle auth, phir role check, phir handler
4. **Refresh tokens** se user ko baar baar login nahi karna padta
5. **Logout** ke liye token blacklist ya refresh token delete karo
6. **Security best practices** — HTTPS, short expiry, .env mein secrets

> **Practice Time!** Evening mein hum existing API mein auth middleware add karenge, CRUD routes protect karenge, role-based access test karenge!
