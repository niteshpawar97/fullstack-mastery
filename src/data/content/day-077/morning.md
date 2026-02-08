# Day 77 — Logging: Winston + Morgan (Morning Session)

> **Aaj ka plan:**
> Aaj hum samjhenge ki professional logging kya hoti hai, console.log kyu production mein kaam nahi karta, Winston logger kaise setup karte hain, Morgan se HTTP requests log kaise karte hain, aur structured logging kyu zaroori hai.

---

## console.log Se Aage Badho!

Socho tumne ek farmer marketplace API banaya. Production mein ek user ko error aa raha hai. Tum server pe jaate ho — par koi log nahi hai! Sirf `console.log('here')` aur `console.log('working')` dikhta hai. Kisko blame karoge? Khud ko!

> **Socho Aise:**
> `console.log` development mein theek hai — jaise ghar mein chappals pehenna. Par production mein proper logging chahiye — jaise office mein formal shoes. Professional environment, professional tools!

### console.log Ki Problems:

| Problem | Explanation |
|---------|-------------|
| Koi level nahi | Error aur info same dikhte hain |
| File mein save nahi hota | Server restart = logs gone |
| Search nahi kar sakte | Hazar logs mein specific dhundhna mushkil |
| Format nahi hai | Kabhi string, kabhi object — inconsistent |
| Performance | Sync operation — server slow ho sakta hai |

---

## Log Levels — Severity Samjho

Har log message ki ek severity hoti hai — kitna important hai:

| Level | Number | Kab Use Karo | Example |
|-------|--------|-------------|---------|
| **error** | 0 | Kuch crash/fail hua | Database down, payment failed |
| **warn** | 1 | Warning — abhi toh chala par risk hai | Memory 90% full, deprecated API |
| **info** | 2 | Normal important events | User registered, order placed |
| **http** | 3 | HTTP requests | GET /api/products 200 |
| **debug** | 4 | Debugging details | Variable values, function entry/exit |

> **Yaad Rakho:**
> Production mein sirf `error`, `warn`, `info` log karo. `debug` sirf development mein. Zyada logs = zyada disk space = zyada cost.

---

## Winston Logger — Setup

Winston Node.js ka sabse popular logging library hai. Multiple transports (destinations) support karta hai.

> **Terminal Command:**
> ```bash
> npm install winston
> ```

### Basic Winston Setup

```javascript
// config/logger.js
const winston = require('winston');

// Logger banao
const logger = winston.createLogger({
  level: 'info',    // minimum level — info aur usse upar (warn, error) log honge

  // Log format define karo
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),  // timestamp add karo
    winston.format.errors({ stack: true }),  // error stack trace include karo
    winston.format.json()                     // JSON format mein output
  ),

  // Default metadata har log mein add hoga
  defaultMeta: { service: 'farmer-api' },

  // Transports — log kahan jaayega
  transports: [
    // Error logs alag file mein
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',               // sirf errors yahan jaayenge
    }),

    // Sab logs ek combined file mein
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Development mein console mein bhi dikhaao
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),      // colors add karo console mein
      winston.format.simple()          // simple readable format
    ),
  }));
}

module.exports = logger;
```

### Logger Use Karo

```javascript
const logger = require('./config/logger');

// Different levels ke saath log karo
logger.info('Server started on port 3000');
logger.info('New user registered', { userId: 'abc123', email: 'ravi@farm.com' });
logger.warn('Database connection slow', { responseTime: '5000ms' });
logger.error('Payment failed', { orderId: 'ORD-456', error: 'Timeout' });
logger.debug('Function called with params', { params: { page: 1, limit: 10 } });
```

> **Expected Output:**
> ```
> // Console mein (development):
> info: Server started on port 3000
> info: New user registered {"userId":"abc123","email":"ravi@farm.com","service":"farmer-api"}
> warn: Database connection slow {"responseTime":"5000ms"}
> error: Payment failed {"orderId":"ORD-456","error":"Timeout"}
>
> // logs/combined.log file mein (JSON):
> {"level":"info","message":"Server started on port 3000","service":"farmer-api","timestamp":"2026-04-04 10:30:00"}
> ```

---

## Winston Transports — Log Kahan Jaaye

| Transport | Kya Karta Hai | Use Case |
|-----------|--------------|----------|
| `Console` | Terminal mein dikhata | Development debugging |
| `File` | File mein likhta | Production logs store |
| `Http` | HTTP endpoint pe bhejta | External service (Datadog, Logstash) |
| `Stream` | Custom stream pe likhta | Custom destinations |

### Multiple Transports Example:

```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    // Errors — error.log mein
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),

    // Sab logs — combined.log mein
    new winston.transports.File({ filename: 'logs/combined.log' }),

    // Console — development mein
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

---

## Log Rotation — Purane Logs Manage Karo

Agar ek hi file mein log hota rahe toh file bahut badi ho jaayegi. Log rotation se purane logs compress/delete hote hain.

> **Terminal Command:**
> ```bash
> npm install winston-daily-rotate-file
> ```

```javascript
const DailyRotateFile = require('winston-daily-rotate-file');

// Har din nayi file, 14 din purani delete
const rotateTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',   // file name mein date aayegi
  datePattern: 'YYYY-MM-DD',          // har din nayi file
  maxSize: '20m',                      // max 20 MB per file
  maxFiles: '14d',                     // 14 din se purani files delete
  zippedArchive: true,                 // purani files compress karo
});

const logger = winston.createLogger({
  transports: [rotateTransport],
});
```

> **Tip:**
> Production mein log rotation zaroori hai. Nahi toh disk full ho jaayegi aur server crash karega. Bahut common production issue hai!

---

## Morgan — HTTP Request Logging

Morgan Express ke liye HTTP request logger middleware hai. Har incoming request automatically log hota hai.

> **Terminal Command:**
> ```bash
> npm install morgan
> ```

```javascript
// app.js
const express = require('express');
const morgan = require('morgan');
const logger = require('./config/logger');

const app = express();

// Morgan middleware add karo
// 'combined' format — Apache style logs
app.use(morgan('combined'));

// Ya custom format banao
app.use(morgan(':method :url :status :response-time ms'));
```

> **Expected Output:**
> ```
> GET /api/products 200 45.678 ms
> POST /api/auth/login 200 123.456 ms
> GET /api/products/999 404 12.345 ms
> ```

### Morgan Formats:

| Format | Kya Dikhata Hai |
|--------|----------------|
| `'dev'` | Colored status + method + path (development) |
| `'combined'` | Apache combined format (production) |
| `'common'` | Apache common format |
| `'short'` | Short format |
| `'tiny'` | Minimal output |

---

## Morgan + Winston Integration

Morgan ko Winston ke saath jodo — HTTP logs bhi file mein jaayein:

```javascript
// Morgan ki output Winston ke stream mein bhejo
const morganMiddleware = morgan('combined', {
  stream: {
    write: (message) => {
      // Morgan ka output Winston info level pe log karo
      logger.http(message.trim());
    },
  },
});

app.use(morganMiddleware);
```

Ab HTTP request logs bhi `logs/combined.log` file mein jaayenge!

---

## Structured Logging — JSON Format

Production mein plain text logs dhundna mushkil hai. JSON format use karo — search/filter aasan ho jaata hai.

```javascript
// Plain text (BAD)
// "User Ravi registered at 2026-04-04 10:30"

// Structured JSON (GOOD)
logger.info('User registered', {
  userId: 'abc123',
  email: 'ravi@farm.com',
  role: 'farmer',
  ip: '192.168.1.1',
  timestamp: new Date().toISOString(),
});

// Output:
// {
//   "level": "info",
//   "message": "User registered",
//   "userId": "abc123",
//   "email": "ravi@farm.com",
//   "role": "farmer",
//   "ip": "192.168.1.1",
//   "timestamp": "2026-04-04T10:30:00.000Z",
//   "service": "farmer-api"
// }
```

> **Yaad Rakho:**
> Structured logs mein field names consistent rakho. Hamesha same key names use karo — `userId` (na `user_id`, na `uid`). Log aggregation tools (ELK, Datadog) tab sahi filter kar paayenge.

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| Log Levels | error > warn > info > debug | Production mein info tak |
| Winston | Logging library | Multiple transports, JSON format |
| Transports | Log destinations | Console, File, HTTP |
| Log Rotation | Purane logs manage | Daily rotate, 14 days max |
| Morgan | HTTP request logger | Express middleware |
| Structured Logging | JSON format logs | Search/filter easy |
| Morgan + Winston | Integration | HTTP logs bhi file mein |

---

## Aaj Kya Seekha?

1. console.log production ke liye enough nahi — proper logging chahiye
2. Log levels — error, warn, info, debug — severity ke hisaab se
3. Winston se professional logger setup karna
4. Multiple transports — console + file + external service
5. Log rotation se purane logs manage karna
6. Morgan se HTTP request logging
7. Structured JSON logging se search aasan hota hai

> **Practice Time!**
> Evening session mein hum apne Express app mein Winston + Morgan implement karenge!
