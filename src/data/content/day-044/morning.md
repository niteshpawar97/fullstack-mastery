# Day 44 Morning: Week 7 Revision — Auth, Validation, Pagination, File Upload

> **Aaj ka plan:** Aaj revision day hai! Poore week ka recap karenge — JWT authentication, bcrypt password hashing, role-based access, Joi validation, pagination/filtering/search, aur Multer file upload. Plus ek security checklist banayenge jo har API project mein follow karni hai.

---

## Week 7 Ka Overview

Is week humne backend APIs ko **secure, validated, aur production-ready** banana seekha:

| Day | Topic | Key Concept |
|-----|-------|-------------|
| Day 38 | JWT Basics | Token structure, sign/verify |
| Day 39 | Register/Login | bcrypt hashing, role-based access |
| Day 40 | Auth Middleware | Protected routes, refresh tokens |
| Day 41 | Validation | Joi schemas, global error handler |
| Day 42 | Pagination | Skip/limit, filtering, search, sorting |
| Day 43 | File Upload | Multer, disk/memory storage, S3 |

> **Yaad Rakho:** Ye sab features har real-world API mein hote hain. Chahe ecommerce app ho, social media ho, ya farming app — authentication, validation, pagination, aur file upload sab jagah chahiye.

---

## Revision 1: JWT Authentication

### Quick Recap

```javascript
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

// Token banana
const token = jwt.sign(
  { userId: '123', role: 'admin' },  // Payload — public info only!
  SECRET,
  { expiresIn: '24h' }
);

// Token verify karna
try {
  const decoded = jwt.verify(token, SECRET);
  // decoded = { userId: '123', role: 'admin', iat: ..., exp: ... }
} catch (err) {
  // TokenExpiredError ya JsonWebTokenError
}
```

### Key Points:

| Point | Detail |
|-------|--------|
| JWT Structure | Header.Payload.Signature |
| Payload mein kya | userId, role, name (NOT password!) |
| Sign | `jwt.sign(payload, secret, options)` |
| Verify | `jwt.verify(token, secret)` |
| Decode only | `jwt.decode(token)` — verify nahi karta! |
| Header format | `Authorization: Bearer <token>` |
| Expiry | Hamesha set karo — `expiresIn: '24h'` |

> **Socho Aise:** JWT ek sealed postcard hai — koi bhi padh sakta hai (decode), lekin sirf server seal verify kar sakta hai (verify). Seal tooti toh invalid.

---

## Revision 2: bcrypt Password Hashing

### Quick Recap

```javascript
const bcrypt = require('bcrypt');

// Hash karna (register ke waqt)
const hashedPassword = await bcrypt.hash('MyPassword123', 10);
// $2b$10$N9qo8uLOickgx2ZMRZoMye...

// Compare karna (login ke waqt)
const isMatch = await bcrypt.compare('MyPassword123', hashedPassword);
// true ya false
```

### Key Points:

| Point | Detail |
|-------|--------|
| Plain text password | KABHI store mat karo |
| Salt rounds | 10-12 recommended |
| Same password, different hash | Haan — salt har baar alag hota hai |
| Compare kaise | `bcrypt.compare()` — NOT `===` |
| One-way | Hash se password reverse nahi hota |

---

## Revision 3: Auth Middleware + Roles

### Quick Recap

```javascript
// Auth Middleware — token check karo, user find karo
const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token do!' });
  
  const decoded = jwt.verify(token, SECRET);
  req.user = await User.findById(decoded.userId).select('-password');
  next();
};

// Role Middleware — permission check karo
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Permission nahi hai!' });
  }
  next();
};

// Route mein use karo
router.delete('/product/:id', authMiddleware, authorizeRoles('admin'), deleteProduct);
```

### Middleware Chain:

```
Request → authMiddleware → authorizeRoles → validate → handler → Response
              ↓                 ↓              ↓           ↓
         Token check       Role check    Input check    Business logic
```

### HTTP Status Codes — Auth:

| Code | Matlab | Kab use karo |
|------|--------|--------------|
| 401 Unauthorized | Pehchaan nahi hui | Token nahi, invalid, expired |
| 403 Forbidden | Pehchaan hui lekin permission nahi | Role allowed nahi |

---

## Revision 4: Joi Validation

### Quick Recap

```javascript
const Joi = require('joi');

// Schema define karo
const schema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('seeds', 'fertilizer').required()
});

// Validate karo
const { error, value } = schema.validate(data, { abortEarly: false });

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) return res.status(400).json({ errors: error.details });
  req.body = value;
  next();
};
```

### Common Validators:

| Validator | Kya karta hai |
|-----------|---------------|
| `.required()` | Field zaroori hai |
| `.min(2)` | Minimum value/length |
| `.max(100)` | Maximum value/length |
| `.email()` | Email format check |
| `.valid('a', 'b')` | Specific values only |
| `.default('user')` | Default value |
| `.pattern(/regex/)` | Regex match |
| `.integer()` | Sirf integers |

---

## Revision 5: Pagination, Filtering & Search

### Quick Recap

```javascript
// Pagination
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

// Filtering
const filter = {};
if (req.query.category) filter.category = req.query.category;
if (req.query.minPrice) filter.price = { $gte: parseFloat(req.query.minPrice) };

// Search
if (req.query.search) {
  filter.$or = [
    { name: { $regex: req.query.search, $options: 'i' } }
  ];
}

// Sorting
const sort = req.query.sortBy ? 
  `${req.query.order === 'asc' ? '' : '-'}${req.query.sortBy}` : '-createdAt';

// Query execute karo
const [data, total] = await Promise.all([
  Product.find(filter).sort(sort).skip(skip).limit(limit),
  Product.countDocuments(filter)
]);
```

### Formula:

```
skip = (page - 1) * limit
totalPages = Math.ceil(totalItems / limit)
```

---

## Revision 6: File Upload (Multer)

### Quick Recap

```javascript
const multer = require('multer');

// Disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Sirf images allowed!'), false);
};

// Multer instance
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Routes
router.post('/avatar', upload.single('avatar'), handler);      // Ek file
router.post('/photos', upload.array('photos', 5), handler);    // Multiple files
```

| Method | `req` mein kya | Use case |
|--------|----------------|----------|
| `single('field')` | `req.file` | Profile picture |
| `array('field', max)` | `req.files` (array) | Gallery photos |
| `fields([...])` | `req.files['field']` | Different file types |

---

## Security Checklist for APIs

Ye checklist har API project mein follow karo:

### Authentication & Authorization
- [ ] Passwords bcrypt se hashed hain
- [ ] JWT tokens mein sensitive data nahi hai
- [ ] Token expiry set hai (short-lived access tokens)
- [ ] Auth middleware sab protected routes pe laga hai
- [ ] Role-based access implement hai
- [ ] Login error messages generic hain ("Email ya password galat")

### Input Validation
- [ ] Sab input Joi/Zod se validated hai
- [ ] Unknown fields strip ho rahe hain
- [ ] File upload mein type + size validation hai
- [ ] MongoDB IDs validate hain (CastError handled)

### Error Handling
- [ ] Global error handler hai
- [ ] Production mein stack traces nahi dikhai dete
- [ ] Mongoose errors (Validation, Duplicate, CastError) handled hain
- [ ] JWT errors (Invalid, Expired) handled hain

### Environment & Config
- [ ] Secret keys `.env` mein hain (code mein nahi!)
- [ ] `.env` file `.gitignore` mein hai
- [ ] Different configs for development/production

### API Design
- [ ] Pagination implement hai (sab data ek baar nahi)
- [ ] Consistent response format hai (`{ success, message, data }`)
- [ ] HTTP status codes sahi use ho rahe hain
- [ ] CORS configured hai

### File Upload
- [ ] File size limit set hai
- [ ] File type validation hai (mimetype + extension)
- [ ] Purani files cleanup hoti hain
- [ ] Uploaded files serve hone ka raasta hai

> **Tip:** Ye checklist bookmark kar lo. Har naya project start karte waqt ek baar check karo ki sab points cover hain.

---

## Common Interview Questions — Week 7 Topics

| Question | Short Answer |
|----------|-------------|
| JWT mein kya store karte ho? | userId, role, name — sensitive data nahi |
| Session vs Token? | Session = server stores, Token = client stores (stateless) |
| bcrypt salt kya hai? | Random string jo hash mein add hota hai — same password, different hash |
| 401 vs 403? | 401 = login nahi hua, 403 = login hua lekin permission nahi |
| Why validate on server? | Client-side validation bypass ho sakta hai |
| Pagination kyun? | Performance + UX — sab data ek baar nahi bhejo |
| Multer kya hai? | Node.js middleware for handling multipart/form-data |
| S3 kyun use karte hain? | Scalable cloud storage, CDN se fast delivery |

---

## Poore Week Ka Code Structure

```
project/
├── .env                          # Secrets (JWT_SECRET, MONGO_URI, etc.)
├── .gitignore                    # .env, node_modules, uploads/
├── server.js                     # Express app setup
├── config/
│   ├── db.js                     # MongoDB connection
│   └── multer.js                 # Multer configuration
├── models/
│   ├── User.js                   # User schema (name, email, password, role, avatar)
│   └── Product.js                # Product schema (name, price, category, createdBy)
├── routes/
│   ├── auth.js                   # Register, Login routes
│   ├── product.js                # CRUD + Pagination + Filter + Search
│   └── upload.js                 # File upload routes
├── middleware/
│   ├── auth.js                   # JWT verification middleware
│   ├── roleCheck.js              # Role-based access middleware
│   ├── validate.js               # Joi validation middleware
│   └── errorHandler.js           # Global error handler
├── schemas/
│   ├── auth.js                   # Register + Login Joi schemas
│   └── product.js                # Product Joi schemas
├── utils/
│   └── pagination.js             # Reusable pagination helper
└── uploads/
    └── avatars/                  # Uploaded profile pictures
```

---

## Quick Revision Table — Complete Week

| Day | Topic | Main Package | Key Method |
|-----|-------|-------------|------------|
| 38 | JWT | jsonwebtoken | `sign()`, `verify()` |
| 39 | Password | bcrypt | `hash()`, `compare()` |
| 40 | Middleware | - | `req.user`, `next()` |
| 41 | Validation | joi | `schema.validate()` |
| 42 | Pagination | - | `skip()`, `limit()`, `sort()` |
| 43 | File Upload | multer | `single()`, `array()` |

---

## Aaj Kya Seekha? (Week Recap)

1. **JWT** se stateless authentication hoti hai — server ko kuch yaad nahi rakhna
2. **bcrypt** se passwords securely store hote hain — one-way hashing
3. **Auth middleware** ek baar likho — sab routes protect karo
4. **Role-based access** se admin/user/moderator ko alag permissions
5. **Joi validation** se input data clean aur safe hota hai
6. **Pagination** se API fast hoti hai — data pages mein aata hai
7. **Multer** se files upload hoti hain — type/size validation zaroori hai
8. **Security checklist** har project mein follow karo

> **Practice Time!** Evening mein hum ek complete **"Secure Blog API"** mini project banayenge jisme auth, validation, pagination, aur file upload sab ek saath use honge!
