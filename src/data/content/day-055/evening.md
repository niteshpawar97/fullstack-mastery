# Day 55 - Evening: Practice — Env Config + Security Implementation

> **Aaj ka plan:**
> Hands-on time! Existing API mein .env config add karenge, Helmet + CORS + Rate Limiting implement karenge, aur security headers test karenge.

---

## Task 1: .env Config Setup

> **Practice Time!**
> Apne existing Express API mein proper environment config add karo.

### Step 1: Packages install karo

```bash
npm install dotenv helmet cors express-rate-limit cookie-parser
```

### Step 2: .env file banao

```bash
# .env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/myapp_dev

# JWT
JWT_SECRET=dev_secret_key_change_in_production_123
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### Step 3: .env.example banao

```bash
# .env.example — yeh git mein jaayega
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/your_db
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### Step 4: Centralized Config

```javascript
// config/index.js
require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT) || 3000,

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  cors: {
    origins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")  // comma se split karo
      : ["http://localhost:3000"],
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    dir: process.env.UPLOAD_DIR || "./uploads",
  },
};

// Zaroori variables check karo
const required = ["DATABASE_URL", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`FATAL ERROR: Missing env variables: ${missing.join(", ")}`);
  console.error("Check your .env file!");
  process.exit(1);
}

module.exports = config;
```

> **Terminal Command:**
> ```bash
> node -e "const config = require('./config'); console.log(config);"
> ```

> **Expected Output:**
> ```
> {
>   env: 'development',
>   port: 3000,
>   db: { url: 'mongodb://localhost:27017/myapp_dev' },
>   jwt: { secret: 'dev_secret_key...', expiresIn: '7d' },
>   cors: { origins: ['http://localhost:3000', 'http://localhost:5173'] },
>   ...
> }
> ```

---

## Task 2: Security Middleware Implement Karo

> **Practice Time!**
> Helmet, CORS, Rate Limiting sab ek saath lagao.

```javascript
// middleware/security.js
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const config = require("../config");

// Helmet — security headers
const helmetMiddleware = helmet({
  contentSecurityPolicy: config.env === "production" ? undefined : false,
  // Dev mein CSP off rakhte hain (Swagger UI ke liye)
  crossOriginEmbedderPolicy: false,
});

// CORS — cross origin access
const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Postman/curl se origin nahi aata
    if (!origin) return callback(null, true);

    if (config.cors.origins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error("CORS policy ne block kar diya!"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
});

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: "Bahut zyada requests! Thodi der baad try karo.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip karo agar trusted IP hai
  skip: (req) => {
    const trustedIPs = ["127.0.0.1", "::1"];
    return config.env === "development" && trustedIPs.includes(req.ip);
  },
});

// Auth Route Limiter — strict
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts
  message: {
    success: false,
    error: "Bahut zyada login attempts! 15 minute baad try karo.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File Upload Limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,                   // 20 uploads per hour
  message: {
    success: false,
    error: "Upload limit reach ho gayi! 1 ghante baad try karo.",
  },
});

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  globalLimiter,
  authLimiter,
  uploadLimiter,
};
```

---

## Task 3: App.js Mein Lagao

```javascript
// app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const config = require("./config");
const {
  helmetMiddleware,
  corsMiddleware,
  globalLimiter,
  authLimiter,
  uploadLimiter,
} = require("./middleware/security");

const app = express();

// --- Security Middleware (sabse pehle lagao) ---
app.use(helmetMiddleware);       // Security headers
app.use(corsMiddleware);         // CORS policy
app.use(globalLimiter);          // Rate limiting

// --- Body Parsing ---
app.use(express.json({ limit: "10kb" }));  // Body size limit — DoS se bachao
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// --- Routes ---

// Auth routes pe strict rate limit
app.use("/api/auth", authLimiter);
app.use("/api/auth", require("./routes/authRoutes"));

// Upload routes pe upload limit
app.use("/api/upload", uploadLimiter);
app.use("/api/upload", require("./routes/uploadRoutes"));

// Normal routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

// Health check (rate limit se bahar)
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  // CORS error handle karo
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ success: false, error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: config.env === "production" ? "Server error" : err.message,
  });
});

module.exports = app;
```

> **Yaad Rakho:**
> Security middleware sabse pehle lagao — `helmet()`, `cors()`, `rateLimit()`. Body parse size limit lagao (`10kb`) toh badi payloads reject ho jaayengi. Error mein production pe stack trace mat bhejo.

---

## Task 4: Security Headers Test Karo

```bash
# Server start karo
npm start

# Security headers check karo
curl -I http://localhost:3000/health
```

> **Expected Output:**
> ```
> HTTP/1.1 200 OK
> Content-Security-Policy: default-src 'none'
> Cross-Origin-Opener-Policy: same-origin
> X-Content-Type-Options: nosniff
> X-DNS-Prefetch-Control: off
> X-Download-Options: noopen
> X-Frame-Options: SAMEORIGIN
> X-Permitted-Cross-Domain-Policies: none
> X-XSS-Protection: 0
> RateLimit-Limit: 100
> RateLimit-Remaining: 99
> RateLimit-Reset: 900
> ```

### Rate Limiting Test

```bash
# Bahut saari requests bhejo
for i in $(seq 1 10); do
  echo "Request $i:"
  curl -s http://localhost:3000/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    | head -1
  echo ""
done
# 6th request se "Bahut zyada login attempts!" message aayega
```

### CORS Test

```bash
# Allowed origin se
curl -H "Origin: http://localhost:3000" \
     -I http://localhost:3000/api/users
# Access-Control-Allow-Origin: http://localhost:3000

# Blocked origin se
curl -H "Origin: http://evil-site.com" \
     -I http://localhost:3000/api/users
# 403 Forbidden — CORS blocked
```

> **Tip:**
> Browser DevTools mein Network tab check karo — response headers mein Helmet ke saare headers dikhne chahiye. Console mein CORS errors bhi dikhte hain agar origin allowed nahi hai.

---

## Task 5: Secure Cookie Implementation

```javascript
// Kisi bhi auth route mein (jahan JWT set karte ho)
const setAuthCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,      // JS access nahi — XSS safe
    secure: config.env === "production",  // Prod mein sirf HTTPS
    sameSite: "strict",  // CSRF safe
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 din
    path: "/",
  };

  res.cookie("accessToken", token, cookieOptions);
};

// Login route mein use karo
app.post("/api/auth/login", authLimiter, async (req, res) => {
  // ... validation, password check ...
  const token = jwt.sign({ id: user._id }, config.jwt.secret);
  setAuthCookie(res, token);
  res.json({ success: true, message: "Login successful" });
});

// Logout mein cookie clear karo
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.json({ success: true, message: "Logged out" });
});
```

---

## Quick Revision

| Task | Kya Kiya |
|---|---|
| `.env` setup | Secrets alag file mein, validation added |
| Config | Centralized config with env check |
| Helmet | Security headers with one line |
| CORS | Origin whitelist, credentials, methods |
| Rate Limit | Global (100/15min), Auth (5/15min) |
| Body Limit | `express.json({ limit: "10kb" })` |
| Cookies | httpOnly, secure, sameSite strict |
| Testing | curl se headers aur rate limit verify |

---

## Aaj Kya Seekha?

1. .env file se config manage kiya — centralized config pattern
2. Helmet.js lagaya — ek line se 10+ security headers
3. CORS properly configure kiya — origin whitelist
4. Rate limiting lagaya — global + route-specific limits
5. Security headers test kiye curl se
6. Secure cookies implement kiye — httpOnly + sameSite
