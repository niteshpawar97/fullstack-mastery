# Day 41 Morning: API Validation — Joi/Zod + Global Error Handler

> **Aaj ka plan:** Aaj hum seekhenge ki API mein input validation kyun zaroori hai, Joi library se schema-based validation kaise karte hain, Zod ka introduction, validation middleware pattern, aur global error handler jo poore app ke errors ek jagah handle kare.

---

## Input Validation — Kyun Zaroori Hai?

### Bina Validation Ke Kya Hota Hai?

```javascript
// ❌ Bina validation — user kuch bhi bhej sakta hai!
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  // Agar email = "asdf"? Password = ""? Name = 12345?
  // Sab kuch database mein chala jaayega! 💥
});
```

### Problems:
1. **Invalid data** database mein aa jaata hai
2. **Security risk** — SQL injection, XSS attacks
3. **App crash** — unexpected data types se
4. **Bad user experience** — unclear error messages

> **Socho Aise:** Ek farmer cooperative mein form bharte waqt agar koi phone number ki jagah apna naam likh de toh records kharab ho jaayenge. Validation wahi form checking hai — "Ye field sirf numbers accept karega, 10 digits chahiye."

---

## Joi Library — Schema-Based Validation

### Joi Kya Hai?

Joi ek **powerful validation library** hai jo tumhe data ka schema define karne deti hai. Schema ke against incoming data check hota hai.

> **Terminal Command:**
```bash
npm install joi
```

### Basic Schema Banana

```javascript
const Joi = require('joi');

// Schema define karo — rules set karo
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)                    // Kam se kam 2 characters
    .max(50)                   // Zyada se zyada 50
    .required()                // Zaroori hai
    .messages({
      'string.min': 'Naam kam se kam 2 characters ka ho',
      'string.max': 'Naam 50 characters se zyada nahi ho sakta',
      'any.required': 'Naam dena zaroori hai'
    }),

  email: Joi.string()
    .email()                   // Valid email format
    .required()
    .messages({
      'string.email': 'Valid email address do',
      'any.required': 'Email dena zaroori hai'
    }),

  password: Joi.string()
    .min(6)                    // Minimum 6 characters
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // Lowercase, uppercase, number
    .required()
    .messages({
      'string.min': 'Password kam se kam 6 characters ka ho',
      'string.pattern.base': 'Password mein ek uppercase, ek lowercase aur ek number zaroori hai',
      'any.required': 'Password dena zaroori hai'
    }),

  role: Joi.string()
    .valid('user', 'admin', 'moderator')  // Sirf ye 3 allowed
    .default('user')                       // Default value
    .messages({
      'any.only': 'Role sirf user, admin ya moderator ho sakta hai'
    })
});
```

### Schema Se Validate Karna

```javascript
// ---- Validation karna ----
const testData = {
  name: 'Ramesh Kumar',
  email: 'ramesh@farm.com',
  password: 'Ramesh@123'
};

// validate() method se check karo
const { error, value } = registerSchema.validate(testData, {
  abortEarly: false  // Sab errors ek saath dikhao (pehla error pe mat ruko)
});

if (error) {
  console.log('Validation failed!');
  // Error details nikalo
  const messages = error.details.map(detail => detail.message);
  console.log('Errors:', messages);
} else {
  console.log('Validation passed!');
  console.log('Clean data:', value);
}
```

> **Tip:** `abortEarly: false` set karo taaki sab validation errors ek saath dikhe. Default mein Joi pehle error pe ruk jaata hai.

---

## Common Joi Validators

```javascript
// ---- String validators ----
Joi.string().min(2).max(50)           // Length limits
Joi.string().email()                   // Email format
Joi.string().uri()                     // URL format
Joi.string().pattern(/^[a-zA-Z]+$/)    // Regex pattern
Joi.string().valid('a', 'b', 'c')     // Specific values only
Joi.string().trim()                    // Whitespace hatao

// ---- Number validators ----
Joi.number().min(0).max(100000)        // Range
Joi.number().integer()                 // Sirf integers (no decimals)
Joi.number().positive()                // Sirf positive numbers

// ---- Boolean ----
Joi.boolean().default(false)           // true/false with default

// ---- Date ----
Joi.date().iso()                       // ISO format date
Joi.date().min('now')                  // Future dates only

// ---- Array ----
Joi.array().items(Joi.string())        // Array of strings
Joi.array().min(1).max(10)             // Array size limits

// ---- Object (nested) ----
Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  pincode: Joi.string().length(6)      // Exactly 6 characters
})
```

### Product Schema Example

```javascript
// schemas/product.js
const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string()
    .min(2).max(100).required()
    .messages({ 'any.required': 'Product ka naam do' }),

  price: Joi.number()
    .min(0).max(1000000).required()
    .messages({
      'number.min': 'Price 0 se kam nahi ho sakta',
      'any.required': 'Price dena zaroori hai'
    }),

  category: Joi.string()
    .valid('seeds', 'fertilizer', 'equipment', 'pesticide')
    .required()
    .messages({
      'any.only': 'Category sirf seeds, fertilizer, equipment ya pesticide ho sakta hai'
    }),

  description: Joi.string()
    .max(500)
    .optional(),                // Optional field — na dena bhi chalega

  stock: Joi.number()
    .integer().min(0).default(0)
});

module.exports = { createProductSchema };
```

---

## Validation Middleware Pattern

### Reusable Validation Middleware

```javascript
// middleware/validate.js

// Factory function — schema lo, middleware return karo
const validate = (schema) => {
  return (req, res, next) => {
    // req.body ko schema ke against validate karo
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,       // Sab errors dikhao
      stripUnknown: true        // Extra fields hatao (security ke liye)
    });

    if (error) {
      // Sab error messages nikalo
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),   // Kaunsa field
        message: detail.message          // Kya galat hai
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed!',
        errors: messages
      });
    }

    // Validated + cleaned data set karo
    req.body = value;  // Stripped unknown fields, defaults applied
    next();
  };
};

module.exports = validate;
```

### Routes Mein Use Karo

```javascript
// routes/auth.js
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/auth');

// Middleware chain: validate → handler
router.post('/register', validate(registerSchema), registerController);
router.post('/login', validate(loginSchema), loginController);

// routes/product.js
const { createProductSchema } = require('../schemas/product');

router.post('/',
  authMiddleware,                        // Pehle: login check
  authorizeRoles('admin', 'moderator'),  // Phir: role check
  validate(createProductSchema),          // Phir: input validation
  createProductController                 // Finally: kaam karo
);
```

> **Yaad Rakho:** Validation middleware chain mein auth ke **baad** aur handler ke **pehle** aata hai. Order: Auth → Role → Validate → Handler.

---

## Zod — Alternative Library

### Zod Kya Hai?

Zod ek **TypeScript-first** validation library hai. Agar tum TypeScript use karte ho, toh Zod better choice hai.

```javascript
// npm install zod
const { z } = require('zod');

// Zod schema — Joi se thoda different syntax
const registerSchema = z.object({
  name: z.string().min(2, 'Naam kam se kam 2 characters').max(50),
  email: z.string().email('Valid email do'),
  password: z.string().min(6, 'Password 6+ characters'),
  role: z.enum(['user', 'admin', 'moderator']).default('user')
});

// Validate karna
try {
  const validData = registerSchema.parse(inputData);
  console.log('Valid:', validData);
} catch (error) {
  console.log('Errors:', error.errors);
}

// Ya safe parse (error throw nahi karta)
const result = registerSchema.safeParse(inputData);
if (!result.success) {
  console.log('Errors:', result.error.errors);
} else {
  console.log('Valid:', result.data);
}
```

| Feature | Joi | Zod |
|---------|-----|-----|
| Language | JavaScript | TypeScript-first |
| Syntax | Method chaining | Method chaining |
| Custom messages | `.messages({})` | Inline strings |
| Size | Bigger | Smaller |
| Popularity | Older, more used | Newer, growing fast |
| Use when | Plain JS projects | TypeScript projects |

> **Tip:** Hum is course mein **Joi** use karenge kyunki ye JavaScript mein zyada popular hai. Lekin agar tum TypeScript seekho toh Zod try karo.

---

## Global Error Handler

### Problem: Try-Catch Har Jagah?

```javascript
// ❌ Har route mein try-catch — repetitive code!
router.get('/products', async (req, res) => {
  try {
    // ... code
  } catch (error) {
    res.status(500).json({ message: error.message }); // Same code bar bar
  }
});
```

### Solution: Global Error Handler Middleware

Express mein agar middleware ke **4 parameters** hain `(err, req, res, next)`, toh wo **error handler** hai.

```javascript
// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error!';

  // ---- Mongoose Validation Error ----
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(e => e.message);
    message = messages.join(', ');
  }

  // ---- Mongoose Duplicate Key Error ----
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists!`;
  }

  // ---- Mongoose Bad ObjectId ----
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // ---- JWT Errors ----
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalid hai!';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expire ho gaya!';
  }

  // Console pe log karo (debugging ke liye)
  console.error('Error:', {
    statusCode,
    message,
    stack: err.stack  // Development mein helpful
  });

  // Response bhejo
  res.status(statusCode).json({
    success: false,
    message,
    // Development mein stack trace dikhao, production mein nahi
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

### Server Mein Register Karo

```javascript
// server.js — sabse last mein add karo (routes ke BAAD)
const errorHandler = require('./middleware/errorHandler');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Global error handler — ROUTES KE BAAD aata hai!
app.use(errorHandler);
```

> **Warning:** Global error handler **hamesha routes ke baad** register karo. Agar pehle lagaoge toh kaam nahi karega!

### Routes Mein Use Karo

```javascript
// Ab try-catch mein error next() ko pass karo
router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (error) {
    next(error);  // Global error handler handle karega!
  }
});
```

---

## Quick Revision Table

| Topic | Key Point |
|-------|-----------|
| Input Validation | Client ka data trust mat karo — hamesha validate karo |
| Joi | Schema-based validation library for JavaScript |
| Joi.object({}) | Schema define karta hai |
| .validate() | Data ko schema ke against check karta hai |
| abortEarly: false | Sab errors ek saath dikhao |
| stripUnknown: true | Extra fields hatao |
| validate() middleware | Reusable — schema lo, middleware return karo |
| Zod | TypeScript-first alternative to Joi |
| Global Error Handler | (err, req, res, next) — 4 params = error handler |
| Error types | ValidationError, 11000, CastError, JWT errors |
| Routes ke baad | Error handler hamesha last mein register karo |
| next(error) | Error ko global handler ko bhejo |

---

## Aaj Kya Seekha?

1. **Input validation** zaroori hai — client ka data kabhi trust mat karo
2. **Joi** se schema define karo aur data validate karo
3. **Custom messages** se user-friendly errors do
4. **Validation middleware** ek baar likho, har route pe lagao
5. **Zod** TypeScript projects ke liye better option hai
6. **Global error handler** se sab errors ek jagah handle hote hain

> **Practice Time!** Evening mein hum Joi validation register/login routes pe lagayenge, product creation validate karenge, aur global error handler build karenge!
