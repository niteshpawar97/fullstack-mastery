# Day 77 — Logging: Winston + Morgan (Evening Session — Practice)

> **Aaj ka plan:**
> Ab hands-on practice — Express app mein Winston setup karenge, file + console transports configure karenge, Morgan middleware add karenge, custom log formats banayenge, aur logs search karna seekhenge.

---

## Practice 1: Complete Winston Logger Setup

Ek production-ready logger module banate hain:

```javascript
// config/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Log levels define karo (custom bhi bana sakte ho)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colors define karo console ke liye
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(colors);

// Environment ke hisaab se level decide karo
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info'; // dev mein debug tak, prod mein info tak
};

// Custom format banao
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),     // error stack trace
  winston.format.metadata({                    // extra data metadata mein
    fillExcept: ['message', 'level', 'timestamp'],
  }),
  winston.format.json()
);

// Console ke liye readable format
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),      // rang birangi logs
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `[${timestamp}] ${level}: ${message} ${meta}`;
  })
);

// ===== TRANSPORTS =====

// Error logs — alag file mein, daily rotate
const errorTransport = new DailyRotateFile({
  filename: path.join('logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',              // sirf errors
  maxSize: '20m',
  maxFiles: '30d',             // 30 din tak rakho
  zippedArchive: true,
});

// Combined logs — sab kuch, daily rotate
const combinedTransport = new DailyRotateFile({
  filename: path.join('logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

// Console transport — development ke liye
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

// ===== LOGGER CREATE =====
const logger = winston.createLogger({
  level: level(),
  levels,
  format: customFormat,
  defaultMeta: { service: 'farmer-api' },
  transports: [errorTransport, combinedTransport],
});

// Development mein console bhi add karo
if (process.env.NODE_ENV !== 'production') {
  logger.add(consoleTransport);
}

module.exports = logger;
```

> **Terminal Command:**
> ```bash
> # Logs folder banao
> mkdir -p logs
> # .gitignore mein logs/ add karo
> echo "logs/" >> .gitignore
> ```

---

## Practice 2: Morgan Middleware Integration

```javascript
// middleware/morganMiddleware.js
const morgan = require('morgan');
const logger = require('../config/logger');

// Custom Morgan token — request body log karo (POST requests ke liye useful)
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    // Password filter karo — kabhi log mat karo!
    const body = { ...req.body };
    if (body.password) body.password = '***HIDDEN***';
    return JSON.stringify(body);
  }
  return '';
});

// Custom Morgan token — user ID (agar authenticated hai)
morgan.token('userId', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Morgan format define karo
const morganFormat = ':method :url :status :response-time ms - :userId - :body';

// Morgan middleware — output Winston ke stream mein bhejo
const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.http(message.trim());  // Winston http level pe log karo
    },
  },
  // 4xx aur 5xx errors ko alag level pe log karo
  skip: (req, res) => false, // koi request skip mat karo
});

module.exports = morganMiddleware;
```

> **Warning:**
> Password, token, credit card jaise sensitive data kabhi log mat karo! Upar dekho `body.password = '***HIDDEN***'` — hamesha filter karo.

---

## Practice 3: Express App Mein Integrate Karo

```javascript
// app.js
const express = require('express');
const logger = require('./config/logger');
const morganMiddleware = require('./middleware/morganMiddleware');

const app = express();

// Body parser
app.use(express.json());

// Morgan middleware — sabse pehle add karo (har request log hogi)
app.use(morganMiddleware);

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Health check route
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Error handling middleware — errors log karo
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user ? req.user.id : 'anonymous',
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
```

```javascript
// Controller mein logger use karo
// controllers/productController.js
const logger = require('../config/logger');
const Product = require('../models/Product');

exports.createProduct = async (req, res, next) => {
  try {
    logger.info('Creating new product', {
      name: req.body.name,
      userId: req.user.id,
    });

    const product = await Product.create(req.body);

    logger.info('Product created successfully', {
      productId: product._id,
      name: product.name,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('Failed to create product', {
      error: error.message,
      body: req.body,
      userId: req.user ? req.user.id : 'unknown',
    });
    next(error);
  }
};
```

---

## Practice 4: Custom Log Formats

```javascript
// Request-Response logger middleware — har request ka detail log
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Response finish hone pe log karo
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length'),
    };

    // Status code ke hisaab se level decide karo
    if (res.statusCode >= 500) {
      logger.error('Server Error Response', logData);    // 5xx = error
    } else if (res.statusCode >= 400) {
      logger.warn('Client Error Response', logData);     // 4xx = warning
    } else {
      logger.info('Successful Response', logData);       // 2xx/3xx = info
    }
  });

  next();
};

app.use(requestLogger);
```

> **Tip:**
> Status code based logging bahut useful hai — production mein sirf `error` aur `warn` filter karke quickly problems dhundh sakte ho.

---

## Practice 5: Logs Search Karna

Production mein logs search karna zaroori hai:

> **Terminal Command:**
> ```bash
> # Saare errors dhundho aaj ke log mein
> grep '"level":"error"' logs/combined-2026-04-04.log
>
> # Specific user ke logs dhundho
> grep '"userId":"abc123"' logs/combined-2026-04-04.log
>
> # 500 errors dhundho
> grep '"status":500' logs/combined-2026-04-04.log
>
> # Last 50 lines dekho
> tail -50 logs/combined-2026-04-04.log
>
> # Real-time logs dekho (live)
> tail -f logs/combined-2026-04-04.log
>
> # Specific time range dhundho
> grep '2026-04-04 14:' logs/combined-2026-04-04.log
> ```

> **Yaad Rakho:**
> JSON format logs isliye important hain — `grep` se specific fields easily filter kar sakte ho. Plain text mein yeh mushkil hota.

---

## Practice 6: Environment-Based Configuration

```javascript
// config/logger.js mein add karo

// Production mein external service pe bhi bhejo
if (process.env.NODE_ENV === 'production' && process.env.LOG_SERVICE_URL) {
  logger.add(new winston.transports.Http({
    host: process.env.LOG_SERVICE_URL,
    port: 443,
    ssl: true,
    path: '/logs',
  }));
}

// Test mein logging band karo (tests clean rahen)
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach(transport => {
    transport.silent = true;  // sab transports silent
  });
}
```

---

## Final Project Structure

```
project/
├── config/
│   └── logger.js              # Winston logger setup
├── middleware/
│   └── morganMiddleware.js    # Morgan + Winston integration
├── logs/                       # Log files (gitignore mein add karo!)
│   ├── error-2026-04-04.log   # Sirf errors
│   ├── combined-2026-04-04.log # Sab logs
│   └── .gitkeep               # Empty folder track karne ke liye
├── app.js                      # Morgan middleware add
└── .gitignore                  # logs/ included
```

---

## Quick Revision Table

| Practice | Kya Kiya | Key Takeaway |
|----------|---------|--------------|
| Winston Setup | Logger + transports + rotation | Production-ready config |
| Morgan Integration | HTTP logs -> Winston | Stream se connect karo |
| App Integration | Middleware + error handler | Har layer mein logging |
| Custom Formats | Status-based logging | 5xx=error, 4xx=warn |
| Log Search | grep commands | JSON logs search easy |
| Env Config | Test silent, prod external | Environment ke hisaab se |

---

## Aaj Kya Seekha?

1. Production-ready Winston logger setup karna — transports, formats, rotation
2. Morgan ko Winston ke saath integrate karna — HTTP logs file mein
3. Sensitive data filter karna logs se — password, tokens
4. Error handling middleware mein proper logging
5. Status code based log levels — smart logging
6. Logs search karna — grep commands
7. Environment-based logging configuration

> **Practice Time!**
> Apne Express project mein aaj ka logger setup implement karo. `npm start` karo aur Postman se requests bhejo — logs/combined.log check karo!
