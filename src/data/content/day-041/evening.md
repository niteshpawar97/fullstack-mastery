# Day 41 Evening: Practice — Joi Validation + Global Error Handler

> **Aaj ka plan:** Ab hum Joi validation apne auth aur product routes pe lagayenge, custom error messages likhenge, aur ek solid global error handler build karenge. Har cheez test karke dekhenge.

---

## Project Structure Update

Existing project mein schemas folder add karo:

```
auth-system/
├── schemas/                  ← NEW
│   ├── auth.js               ← NEW
│   └── product.js            ← NEW
├── middleware/
│   ├── auth.js
│   ├── roleCheck.js
│   ├── validate.js           ← NEW
│   └── errorHandler.js       ← NEW
└── ... (baaki same)
```

> **Terminal Command:**
```bash
npm install joi
mkdir schemas
touch schemas/auth.js schemas/product.js middleware/validate.js middleware/errorHandler.js
```

---

## Step 1: Auth Schemas Banao

```javascript
// schemas/auth.js
const Joi = require('joi');

// ---- Register Schema ----
const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Naam khali nahi ho sakta',
      'string.min': 'Naam kam se kam 2 characters ka ho',
      'string.max': 'Naam 50 characters se zyada nahi ho sakta',
      'any.required': 'Naam dena zaroori hai'
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.email': 'Valid email address do (example: user@gmail.com)',
      'string.empty': 'Email khali nahi ho sakta',
      'any.required': 'Email dena zaroori hai'
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password kam se kam 6 characters ka ho',
      'string.max': 'Password 128 characters se zyada nahi ho sakta',
      'string.pattern.base': 'Password mein ek uppercase (A-Z), ek lowercase (a-z) aur ek number (0-9) zaroori hai',
      'string.empty': 'Password khali nahi ho sakta',
      'any.required': 'Password dena zaroori hai'
    }),

  role: Joi.string()
    .valid('user', 'admin', 'moderator')
    .default('user')
    .messages({
      'any.only': 'Role sirf user, admin ya moderator ho sakta hai'
    })
});

// ---- Login Schema ----
const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.email': 'Valid email do',
      'any.required': 'Email dena zaroori hai'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password dena zaroori hai'
    })
});

module.exports = { registerSchema, loginSchema };
```

---

## Step 2: Product Schema Banao

```javascript
// schemas/product.js
const Joi = require('joi');

// ---- Create Product Schema ----
const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Product naam 2+ characters ka ho',
      'any.required': 'Product ka naam do'
    }),

  price: Joi.number()
    .min(0)
    .max(1000000)
    .precision(2)                // Maximum 2 decimal places
    .required()
    .messages({
      'number.base': 'Price ek number hona chahiye',
      'number.min': 'Price 0 se kam nahi ho sakta',
      'number.max': 'Price 10 lakh se zyada nahi ho sakta',
      'any.required': 'Price dena zaroori hai'
    }),

  category: Joi.string()
    .valid('seeds', 'fertilizer', 'equipment', 'pesticide')
    .required()
    .messages({
      'any.only': 'Category sirf seeds, fertilizer, equipment ya pesticide ho sakta hai',
      'any.required': 'Category dena zaroori hai'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')     // Khali string bhi allowed
    .messages({
      'string.max': 'Description 500 characters se zyada nahi ho sakta'
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Stock ek number hona chahiye',
      'number.integer': 'Stock mein decimal nahi aa sakta',
      'number.min': 'Stock 0 se kam nahi ho sakta'
    })
});

// ---- Update Product Schema (sab optional — partial update) ----
const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  price: Joi.number().min(0).max(1000000).precision(2),
  category: Joi.string().valid('seeds', 'fertilizer', 'equipment', 'pesticide'),
  description: Joi.string().trim().max(500).allow(''),
  stock: Joi.number().integer().min(0)
}).min(1).messages({
  'object.min': 'Kam se kam ek field do update ke liye!'  // Khali body nahi chalega
});

module.exports = { createProductSchema, updateProductSchema };
```

---

## Step 3: Validate Middleware

```javascript
// middleware/validate.js
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,     // Sab errors ek saath batao
      stripUnknown: true      // Unknown fields hatao (security)
    });

    if (error) {
      // Sab errors ka structured format banao
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed! Data check karo.',
        errors
      });
    }

    // Cleaned + validated data set karo
    req.body = value;
    next();
  };
};

module.exports = validate;
```

---

## Step 4: Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Default values set karo
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Kuch galat ho gaya server mein!';
  let errors = null;

  // ---- Mongoose Validation Error ----
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    message = 'Validation failed!';
  }

  // ---- Mongoose Duplicate Key (unique field) ----
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} pehle se exist karta hai! Doosra use karo.`;
  }

  // ---- Mongoose CastError (invalid ObjectId) ----
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `ID format galat hai: ${err.value}. Valid MongoDB ID do.`;
  }

  // ---- JWT Errors ----
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalid hai! Sahi token bhejo.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expire ho gaya! Dubara login karo.';
  }

  // ---- Syntax Error (malformed JSON body) ----
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body ka JSON format galat hai!';
  }

  // Console pe log karo — debugging ke liye
  console.error(`[${new Date().toISOString()}] Error:`, {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Response bhejo
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),   // Validation errors ho toh bhejo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

---

## Step 5: Routes Mein Validation Lagao

```javascript
// routes/auth.js — updated
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/auth');

// Register — validation middleware add karo
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    // req.body ab validated + cleaned hai!
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ye email already registered hai!'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);  // Global error handler ko bhejo!
  }
});

// Login — validation middleware add karo
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ya password galat!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email ya password galat!' });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});
```

### Server Mein Error Handler Lagao

```javascript
// server.js — bottom mein add karo
const errorHandler = require('./middleware/errorHandler');

// ... routes

// 404 handler — koi route match nahi hua
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} exist nahi karta!`
  });
});

// Global Error Handler — SABSE LAST MEIN
app.use(errorHandler);
```

---

## Postman Se Test Karo

### Test 1: Register Without Name
```
POST /api/auth/register
Body: { "email": "test@test.com", "password": "Test@123" }
→ 400: { errors: [{ field: "name", message: "Naam dena zaroori hai" }] }
```

### Test 2: Weak Password
```
POST /api/auth/register
Body: { "name": "Test", "email": "test@test.com", "password": "123" }
→ 400: Errors — password min 6, uppercase/lowercase/number required
```

### Test 3: Invalid Email Format
```
POST /api/auth/register
Body: { "name": "Test", "email": "not-an-email", "password": "Test@123" }
→ 400: { errors: [{ field: "email", message: "Valid email address do" }] }
```

### Test 4: Invalid Product Category
```
POST /api/products
Body: { "name": "ABC", "price": 100, "category": "random" }
→ 400: "Category sirf seeds, fertilizer, equipment ya pesticide ho sakta hai"
```

### Test 5: Negative Price
```
POST /api/products
Body: { "name": "Seeds", "price": -50, "category": "seeds" }
→ 400: "Price 0 se kam nahi ho sakta"
```

### Test 6: Invalid MongoDB ID
```
GET /api/products/invalid-id-here
→ 400: "ID format galat hai: invalid-id-here"
```

> **Practice Time!** Ye exercises try karo:
> 1. Ek `changePasswordSchema` banao — oldPassword, newPassword, confirmPassword (match hone chahiye)
> 2. Product update mein khali body bhejo — kya error aata hai?
> 3. Extra unknown fields bhejo — `stripUnknown` kya karta hai?
> 4. Malformed JSON body bhejo — global error handler kya karta hai?

---

## Quick Revision Table

| Concept | Code | Kya karta hai |
|---------|------|---------------|
| Schema define | `Joi.object({...})` | Rules set karta hai |
| Validate | `schema.validate(data)` | Data check karta hai |
| Custom message | `.messages({...})` | User-friendly errors |
| Required field | `.required()` | Field zaroori hai |
| Valid values | `.valid('a', 'b')` | Specific values only |
| Default value | `.default('user')` | Na diya toh ye use hoga |
| Strip unknown | `stripUnknown: true` | Extra fields hatao |
| Validate middleware | `validate(schema)` | Reusable validation |
| Error handler | `(err, req, res, next)` | 4 params = error handler |
| next(error) | `next(error)` | Error ko handler ko bhejo |

---

## Aaj Kya Seekha?

1. **Joi schemas** se data validation clean aur reusable hoti hai
2. **Custom messages** se user ko samajh aata hai kya galat hai
3. **validate() middleware** ek baar likho, har route pe lagao
4. **stripUnknown** extra/malicious fields hata deta hai
5. **Global error handler** sab errors ek jagah handle karta hai
6. **next(error)** se error global handler tak pahunchta hai

> **Kal ka preview:** Kal hum pagination, filtering aur search APIs banayenge — real-world APIs mein ye features must-have hain!
