# Day 81 — Week 12 Revision + Production Setup (Morning Session — REVISION DAY)

> **Aaj ka plan:**
> Aaj hum poore Week 12 ka revision karenge — Testing (Jest, Supertest), Logging (Winston, Morgan), Debugging, Design Patterns (Singleton, Factory, Observer), aur Clean Code. Plus production readiness checklist!

---

## Week 12 Revision Map

```
Week 12: Testing, Logging, Debugging, Design Patterns, Clean Code
│
├── Day 75: Unit Testing (Jest)
│   ├── describe / it / expect
│   ├── Matchers: toBe, toEqual, toThrow
│   ├── beforeEach / afterEach
│   └── Mocking: jest.mock()
│
├── Day 76: API Testing (Supertest)
│   ├── CRUD endpoint testing
│   ├── Auth flow testing
│   ├── Validation error testing
│   └── Test database setup/teardown
│
├── Day 77: Logging (Winston + Morgan)
│   ├── Log levels: error, warn, info, debug
│   ├── Winston transports: console, file
│   ├── Log rotation
│   └── Morgan HTTP logging
│
├── Day 78: Debugging + Monitoring
│   ├── Node --inspect, VS Code debugger
│   ├���─ Common bug patterns
│   ├── Health checks: /live, /ready, /detailed
│   └── Basic metrics collection
│
├── Day 79: Design Patterns
│   ��── Singleton: DB connection, logger
│   ���── Factory: user types, payments
│   └── Observer: event system, notifications
│
└── Day 80: Clean Code
    ├── Meaningful names, small functions
    ├── DRY, KISS, YAGNI
    ├── Code smells + refactoring
    └── Project folder structure
```

---

## Quick Revision: Testing (Day 75-76)

### Jest Essentials:

```javascript
// Test structure yaad karo
describe('Module Name', () => {      // group
  beforeEach(() => { /* setup */ });  // har test se pehle

  it('should do something', () => {  // individual test
    expect(result).toBe(expected);   // assertion
  });

  afterEach(() => { /* cleanup */ }); // har test ke baad
});
```

### Key Matchers:

| Matcher | Use Case | Example |
|---------|----------|---------|
| `toBe` | Primitives (===) | `expect(5).toBe(5)` |
| `toEqual` | Objects/Arrays (deep) | `expect({a:1}).toEqual({a:1})` |
| `toThrow` | Error check | `expect(() => fn()).toThrow('msg')` |
| `toBeTruthy` | Truthy check | `expect('hello').toBeTruthy()` |
| `toHaveLength` | Length check | `expect([1,2]).toHaveLength(2)` |
| `toHaveBeenCalledWith` | Mock verify | `expect(fn).toHaveBeenCalledWith(1)` |

### Supertest Pattern:

```javascript
const request = require('supertest');
const app = require('../app');

// GET test
const res = await request(app).get('/api/products');
expect(res.statusCode).toBe(200);

// POST test
const res = await request(app)
  .post('/api/products')
  .send({ name: 'Gehun', price: 2500 })  // body bhejo
  .set('Authorization', `Bearer ${token}`); // header set karo
expect(res.statusCode).toBe(201);
```

> **Yaad Rakho:**
> Testing pyramid — 70% unit, 20% integration, 10% e2e. Unit tests fast hain, zyada likho!

---

## Quick Revision: Logging (Day 77)

### Winston Setup Yaad Karo:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### Log Levels Priority:

```
error (0) > warn (1) > info (2) > http (3) > debug (4)
```

### Morgan + Winston:

```javascript
const morganMiddleware = morgan('combined', {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
});
```

> **Yaad Rakho:**
> Production mein: info level tak log karo, file transport use karo, log rotation lagao, sensitive data filter karo!

---

## Quick Revision: Debugging (Day 78)

### Debugging Steps:
1. **Reproduce** — bug ko consistently reproduce karo
2. **Isolate** — kaunsa component broken hai?
3. **Inspect** — variables/flow check karo
4. **Fix** — root cause fix karo
5. **Verify** — test se verify karo
6. **Prevent** — test likho taaki dobara na aaye

### Common Bugs:

| Bug | Symptom | Fix |
|-----|---------|-----|
| Missing `await` | Promise object return | `await` lagao |
| Missing `return` in middleware | Headers already sent | `return res.json()` |
| Body parser order | `req.body` undefined | `express.json()` routes se pehle |
| Missing `next(error)` | Request hangs | Error handler mein `next()` call |

### Health Check Endpoints:

```javascript
GET /health/live     — server alive hai? (200 OK)
GET /health/ready    — dependencies ready? (200 / 503)
GET /health/detailed — full system report
```

---

## Quick Revision: Design Patterns (Day 79)

### Singleton — Ek Hi Instance:

```javascript
class Database {
  constructor() {
    if (Database.instance) return Database.instance;
    Database.instance = this;
  }
}
module.exports = new Database(); // hamesha same instance
```

**Use:** DB connection, Logger, Config

### Factory — Object Creation:

```javascript
function createUser(type, data) {
  const factories = { admin: AdminUser, farmer: FarmerUser, buyer: BuyerUser };
  return new factories[type](data);
}
```

**Use:** User types, Payment processors, Notifications

### Observer — Event System:

```javascript
const eventBus = new EventEmitter();
eventBus.on('order:placed', (order) => sendEmail(order));   // listener
eventBus.emit('order:placed', orderData);                    // trigger
```

**Use:** Order events, User events, Notifications

---

## Quick Revision: Clean Code (Day 80)

### Principles Summary:

| Principle | Rule | Kab Todna Hai |
|-----------|------|---------------|
| **DRY** | Repeat mat karo | Jab abstraction zyada complex ho jaaye |
| **KISS** | Simple rakho | Kabhi mat todo — simple hamesha better |
| **YAGNI** | Zaroorat nahi toh mat banao | Jab 100% sure ho future mein chahiye |
| **SRP** | Ek function, ek kaam | Bahut chhote functions bhi problem hain |

### Folder Structure:

```
src/
├── config/       # Settings, DB, Logger
├── controllers/  # Request handlers
├── models/       # Database schemas
├── routes/       # Route definitions
├── middleware/    # Auth, validation, errors
├── services/     # Business logic
├── utils/        # Helpers, constants
├── events/       # Event bus + listeners
└── app.js        # Express setup
```

---

## Production Readiness Checklist

Yeh checklist follow karo API deploy karne se pehle:

### 1. Security

- [ ] Helmet.js middleware lagaya (HTTP headers)
- [ ] CORS properly configured
- [ ] Rate limiting (express-rate-limit)
- [ ] Input validation (express-validator / Joi)
- [ ] Password hashing (bcrypt)
- [ ] JWT token expiry set
- [ ] Sensitive data env variables mein
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection

### 2. Error Handling

- [ ] Global error handler middleware
- [ ] Custom AppError class
- [ ] Async handler (try-catch wrapper)
- [ ] 404 Not Found handler
- [ ] Unhandled rejection handler
- [ ] Uncaught exception handler

### 3. Logging

- [ ] Winston logger configured
- [ ] File + Console transports
- [ ] Log rotation enabled
- [ ] Morgan HTTP logging
- [ ] Error stack traces logged
- [ ] Sensitive data filtered from logs

### 4. Monitoring

- [ ] Health check endpoints (/health/live, /ready)
- [ ] Memory usage monitoring
- [ ] Database connection monitoring
- [ ] PM2 for process management

### 5. Testing

- [ ] Unit tests for utilities and services
- [ ] API/integration tests for routes
- [ ] Auth flow tested
- [ ] 80%+ test coverage
- [ ] Test database separate

### 6. Code Quality

- [ ] Clean folder structure (MVC)
- [ ] Meaningful variable names
- [ ] No magic numbers (constants file)
- [ ] No dead code or console.log
- [ ] .env.example committed
- [ ] .gitignore proper

### 7. Documentation

- [ ] API endpoints documented
- [ ] .env.example file
- [ ] README with setup instructions
- [ ] Error codes documented

> **Yaad Rakho:**
> Production readiness sirf code quality nahi — security, monitoring, logging, error handling — sab zaroori hai!

---

## Master Revision Table — Week 12

| Day | Topic | Key Tool/Concept | Must Remember |
|-----|-------|-----------------|---------------|
| 75 | Unit Tests | Jest | describe/it/expect, mock |
| 76 | API Tests | Supertest | Status codes, auth flow |
| 77 | Logging | Winston + Morgan | Levels, transports, rotation |
| 78 | Debugging | --inspect, VS Code | Reproduce, isolate, fix |
| 78 | Health Checks | /health endpoints | Live, ready, detailed |
| 79 | Patterns | Singleton, Factory, Observer | DB, user types, events |
| 80 | Clean Code | DRY, KISS, YAGNI | Names, small functions, structure |

---

## Aaj Kya Seekha?

1. Week 12 ke sab topics ka quick recap
2. Testing — Jest + Supertest patterns
3. Logging — Winston setup + Morgan integration
4. Debugging — systematic approach + common bugs
5. Design Patterns — Singleton, Factory, Observer use cases
6. Clean Code — principles + folder structure
7. Production readiness checklist — 7 categories, 30+ items

> **Practice Time!**
> Evening session mein hum ek existing API ko production-ready banayenge — tests, logging, health checks, clean structure sab add karenge!
