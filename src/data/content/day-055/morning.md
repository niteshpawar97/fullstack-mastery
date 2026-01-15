# Day 55 - Morning: Env Config + Security Hardening (Helmet, CORS, Rate Limiting)

> **Aaj ka plan:**
> Aaj hum API ko secure karenge — .env files se config manage karenge, Helmet se security headers lagayenge, CORS samjhenge, rate limiting se abuse rokenge, aur common attacks se bachna seekhenge.

---

## .env Files — Config Management

Kabhi bhi secrets (passwords, API keys) code mein hardcode mat karo. `.env` file use karo.

```bash
# .env file (root folder mein)
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=mera_super_secret_key_2024
SMTP_HOST=smtp.gmail.com
SMTP_USER=myapp@gmail.com
SMTP_PASS=app_password_here
```

> **Warning:**
> `.env` file ko KABHI git mein push mat karo. `.gitignore` mein add karo. Agar galti se push ho gaya toh turant secrets rotate karo (change karo) kyunki git history mein hamesha rahega.

### .gitignore mein add karo

```
# .gitignore
.env
.env.local
.env.production
node_modules/
```

### .env.example banao (team ke liye)

```bash
# .env.example — yeh git mein push karo (bina actual values)
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your_jwt_secret_here
SMTP_HOST=your_smtp_host
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## dotenv Package

```bash
npm install dotenv
```

```javascript
// config/index.js — centralized config
require("dotenv").config(); // .env file load karo

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
  smtp: {
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Validation — zaroori variables check karo
const requiredVars = ["DATABASE_URL", "JWT_SECRET"];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`FATAL: ${varName} is not set in .env`);
    process.exit(1); // App start mat hone do
  }
}

module.exports = config;
```

> **Tip:**
> Config file centralized rakho. Har jagah `process.env.XYZ` mat likho — ek jagah se import karo. Isse change karna easy hota hai aur validation bhi ek jagah hoti hai.

---

## Dev / Staging / Prod Config

```javascript
// config/database.js — environment wise config
const config = require("./index");

const dbConfig = {
  development: {
    url: config.db.url,
    options: { 
      // Dev mein debug logging on
      debug: true 
    },
  },
  staging: {
    url: process.env.STAGING_DB_URL,
    options: { 
      debug: false 
    },
  },
  production: {
    url: process.env.PROD_DB_URL,
    options: {
      debug: false,
      // Production mein connection pooling
      maxPoolSize: 50,
      ssl: true,
    },
  },
};

module.exports = dbConfig[config.env];
```

> **Socho Aise:**
> Development = tumhara laptop (experiment karo). Staging = dress rehearsal (production jaisa but safe). Production = asli stage (customers use kar rahe). Har environment ki apni settings honi chahiye.

---

## Helmet.js — Security Headers

Helmet automatically security HTTP headers lagata hai.

```bash
npm install helmet
```

```javascript
const express = require("express");
const helmet = require("helmet");

const app = express();

// Helmet lagao — ek line se bahut saari security
app.use(helmet());

// Helmet yeh headers set karta hai:
// X-Content-Type-Options: nosniff     --> MIME sniffing rokta hai
// X-Frame-Options: SAMEORIGIN         --> Clickjacking rokta hai
// X-XSS-Protection: 0                 --> Browser XSS filter
// Strict-Transport-Security           --> HTTPS enforce karta hai
// Content-Security-Policy             --> Resource loading control
// X-Powered-By: REMOVED               --> Express fingerprint hatata hai
```

### Custom Helmet Config

```javascript
app.use(
  helmet({
    // Content Security Policy customize karo
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    // Cross Origin settings
    crossOriginEmbedderPolicy: false, // agar images external hain
  })
);
```

> **Yaad Rakho:**
> `app.use(helmet())` — bas yeh ek line production mein zaroori hai. Default settings bahut acchi hain. Customize tabhi karo jab specific need ho.

---

## CORS — Cross-Origin Resource Sharing

### CORS Kya Hai?

Browser ek security rule follow karta hai: **Same-Origin Policy**. Matlab `localhost:3000` se `localhost:5000` pe request nahi ja sakti by default.

> **Socho Aise:**
> Socho tumhara API ek building hai. CORS = security guard jo check karta hai: "Tum kaunsi website se aa rahe ho? Tumhe andar aane ki permission hai?" Bina CORS ke, koi bhi website tumhare API ko call kar sakti hai.

```bash
npm install cors
```

```javascript
const cors = require("cors");

// Option 1: Sab ko allow karo (development ke liye)
app.use(cors());

// Option 2: Specific origins allow karo (production ke liye)
app.use(cors({
  origin: [
    "https://myapp.com",
    "https://admin.myapp.com",
    "http://localhost:3000",  // dev ke liye
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,         // cookies bhejne ki permission
  maxAge: 86400,             // preflight cache 24 hours
}));

// Option 3: Dynamic origin (database se check karo)
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ["https://myapp.com", "https://admin.myapp.com"];
    // Postman/curl se origin undefined aata hai — allow karo
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy ne block kar diya!"));
    }
  }
}));
```

> **Warning:**
> Production mein kabhi `cors()` bina options ke mat use karo — yeh sabko allow karta hai. Specific origins list karo. `credentials: true` tabhi lagao jab cookies/sessions use ho.

---

## Rate Limiting — Abuse Se Bachao

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require("express-rate-limit");

// Global rate limiter — saare routes ke liye
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minute window
  max: 100,                   // 100 requests per window
  message: {
    error: "Bahut zyada requests! 15 minute baad try karo.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,      // RateLimit-* headers bhejo
  legacyHeaders: false,
});

app.use(globalLimiter);

// Auth routes ke liye strict limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // Sirf 5 login attempts
  message: {
    error: "Bahut zyada login attempts! 15 minute baad try karo.",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
```

> **Socho Aise:**
> Rate limiting = toll booth. Har gaadi (request) count hoti hai. Limit cross kari toh barrier band. Yeh brute force attacks, DDoS, aur API abuse se bachata hai. Login pe strict limit lagao — 5 attempts mein password guess karna mushkil ho jaaye.

---

## Common Attacks aur Prevention

### 1. XSS (Cross-Site Scripting)

```javascript
// PROBLEM: User input seedha HTML mein daalna
const name = req.body.name; // "<script>alert('hacked')</script>"

// SOLUTION: Input sanitize karo
const sanitizeHtml = require("sanitize-html");
const cleanName = sanitizeHtml(name); // script tag hata dega
```

### 2. CSRF (Cross-Site Request Forgery)

```javascript
// SOLUTION: CSRF token use karo
const csrf = require("csurf");
app.use(csrf({ cookie: true }));
// Har form mein hidden CSRF token hoga
```

### 3. Secure Cookie Settings

```javascript
app.use(require("cookie-parser")());

// Secure cookie settings
const cookieOptions = {
  httpOnly: true,      // JavaScript se access nahi (XSS se bachao)
  secure: true,        // Sirf HTTPS pe bhejo
  sameSite: "strict",  // CSRF se bachao
  maxAge: 24 * 60 * 60 * 1000, // 1 din
};

res.cookie("token", jwtToken, cookieOptions);
```

> **Yaad Rakho:**
> `httpOnly: true` sabse important hai — yeh JavaScript ko cookie read karne se rokta hai. XSS attack ho bhi jaaye toh bhi token safe hai. `secure: true` production mein zaroori — HTTPS enforce karta hai.

---

## Quick Revision

| Concept | Key Point |
|---|---|
| `.env` | Secrets store karo, git mein push mat karo |
| `dotenv` | `.env` file load karta hai |
| Config | Dev/Staging/Prod alag settings |
| Helmet | Security headers automatic lagata hai |
| CORS | Kaunsi websites API access kar sakti hain |
| Rate Limit | Requests per window limit karo |
| XSS | Input sanitize karo |
| Cookies | `httpOnly`, `secure`, `sameSite` lagao |

---

## Aaj Kya Seekha?

1. `.env` files se secrets manage karna — kabhi hardcode mat karo
2. Centralized config pattern — ek jagah se saari settings
3. Helmet.js se security headers — ek line, bahut saari security
4. CORS samjha — browser ki same-origin policy aur kaise allow karein
5. Rate limiting se brute force aur abuse se bachna
6. XSS, CSRF prevention aur secure cookie settings
