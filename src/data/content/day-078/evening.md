# Day 78 — Debugging Techniques + Monitoring + Health Checks (Evening Session — Practice)

> **Aaj ka plan:**
> Ab hands-on practice — ek broken Express app ko debug karenge (intentional bugs dhundhenge aur fix karenge), health check endpoint setup karenge, aur monitoring dashboard ka concept samjhenge.

---

## Practice 1: Debug a Broken Express App

Neeche ek Express app hai jismein **6 intentional bugs** hain. Dhundho aur fix karo!

```javascript
// BUGGY CODE — bugs.js (6 bugs hain isme!)
const express = require('express');
const app = express();

// Bug 1: ??? (body parser missing)
const users = [];

// Bug 2: ??? (route path wrong)
app.get('api/users', (req, res) => {
  res.json({ success: true, data: users });
});

// Bug 3: ??? (async issue)
app.get('/api/users/:id', (req, res) => {
  const user = User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ success: true, data: user });
});

// Bug 4: ??? (response sent twice)
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name) {
    res.status(400).json({ message: 'Name required' });
  }
  if (!email) {
    res.status(400).json({ message: 'Email required' });
  }
  users.push({ id: users.length + 1, name, email });
  res.status(201).json({ message: 'User created' });
});

// Bug 5: ??? (error handler signature wrong)
app.use((req, res) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

// Bug 6: ??? (PORT typo)
const PROT = process.env.PORT || 3000;
app.listen(PROT, () => {
  console.log(`Server on port ${PORT}`);
});
```

### Ab Bugs Dhundho Aur Fix Karo!

Ek ek karke dekhte hain:

```javascript
// === BUG 1 FIX: Body parser missing ===
// Problem: req.body undefined aayega POST requests mein
// Fix: express.json() middleware add karo ROUTES se pehle
app.use(express.json());  // yeh line add karo routes se pehle

// === BUG 2 FIX: Route path mein leading slash missing ===
// Problem: 'api/users' galat hai, '/api/users' chahiye
// Fix:
app.get('/api/users', (req, res) => {  // '/' lagao shuru mein
  res.json({ success: true, data: users });
});

// === BUG 3 FIX: await missing ===
// Problem: User.findById() ek Promise return karta hai, await nahi lagaya
// Fix:
app.get('/api/users/:id', async (req, res) => {  // async add karo
  try {
    const user = await User.findById(req.params.id);  // await lagao
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });  // error handle karo
  }
});

// === BUG 4 FIX: Response sent twice (return missing) ===
// Problem: Pehla res.json() ke baad bhi code chalta hai -> "headers already sent" error
// Fix: return lagao har early response mein
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name required' });  // return lagao!
  }
  if (!email) {
    return res.status(400).json({ message: 'Email required' });  // return lagao!
  }
  users.push({ id: users.length + 1, name, email });
  res.status(201).json({ message: 'User created' });
});

// === BUG 5 FIX: Error handler mein 4 parameters chahiye ===
// Problem: Error handler ko (err, req, res, next) chahiye — err missing tha
// Fix:
app.use((err, req, res, next) => {  // err parameter add karo
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

// === BUG 6 FIX: Variable name typo ===
// Problem: PROT define kiya par PORT use kiya console.log mein
// Fix:
const PORT = process.env.PORT || 3000;  // PROT -> PORT
app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);  // ab sahi variable hai
});
```

> **Yaad Rakho:**
> Real production mein bugs itne clear nahi hote. Debugging ka process follow karo: Reproduce -> Isolate -> Inspect -> Fix -> Verify.

---

## Practice 2: Health Check Endpoint Setup

Complete health check system banate hain:

```javascript
// routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const logger = require('../config/logger');

// Liveness probe — server zinda hai?
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: Date.now() });
});

// Readiness probe — server ready hai traffic ke liye?
router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    memory: false,
  };

  // Database check
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      checks.database = true;
    }
  } catch (err) {
    logger.warn('Readiness: DB ping failed', { error: err.message });
  }

  // Memory check — 90% se zyada use ho raha toh not ready
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.memory = heapPercent < 90;

  const isReady = Object.values(checks).every(Boolean);
  const status = isReady ? 200 : 503;

  res.status(status).json({
    status: isReady ? 'ready' : 'not ready',
    checks,
  });
});

// Detailed health — poori system ki sehat report
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'OK',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    checks: {},
  };

  // --- Database Health ---
  try {
    const dbStart = Date.now();
    await mongoose.connection.db.admin().ping();
    health.checks.database = {
      status: 'healthy',
      responseTime: `${Date.now() - dbStart}ms`,
      connections: mongoose.connection.readyState,
    };
  } catch (error) {
    health.status = 'DEGRADED';
    health.checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // --- Memory Health ---
  const mem = process.memoryUsage();
  health.checks.memory = {
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    external: `${Math.round(mem.external / 1024 / 1024)} MB`,
    rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
  };

  // --- System Info ---
  health.checks.system = {
    platform: os.platform(),
    cpuCount: os.cpus().length,
    freeMemory: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
    totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
    loadAvg: os.loadavg(),
  };

  // --- Response Time ---
  health.responseTime = `${Date.now() - startTime}ms`;

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

```javascript
// app.js mein add karo
app.use('/health', require('./routes/healthRoutes'));
```

> **Terminal Command:**
> ```bash
> # Health check test karo
> curl http://localhost:3000/health/live
> curl http://localhost:3000/health/ready
> curl http://localhost:3000/health/detailed
> ```

---

## Practice 3: Monitoring Dashboard Concept

Real monitoring dashboard kaise sochte hain:

```javascript
// middleware/metricsCollector.js
// Simple in-memory metrics collector (production mein Prometheus/Datadog use karo)

const metrics = {
  totalRequests: 0,
  totalErrors: 0,
  statusCodes: {},       // { 200: 150, 404: 5, 500: 2 }
  avgResponseTime: 0,
  responseTimes: [],
  startedAt: new Date().toISOString(),
};

// Middleware — har request ki metrics collect karo
const metricsCollector = (req, res, next) => {
  const startTime = Date.now();
  metrics.totalRequests++;

  // Response complete hone pe metrics update karo
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.responseTimes.push(duration);

    // Status code count karo
    const code = res.statusCode;
    metrics.statusCodes[code] = (metrics.statusCodes[code] || 0) + 1;

    // Error count
    if (code >= 400) metrics.totalErrors++;

    // Last 1000 response times rakho (memory limit)
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes = metrics.responseTimes.slice(-1000);
    }

    // Average response time calculate karo
    const sum = metrics.responseTimes.reduce((a, b) => a + b, 0);
    metrics.avgResponseTime = Math.round(sum / metrics.responseTimes.length);
  });

  next();
};

// Metrics endpoint — dashboard ke liye data
const getMetrics = (req, res) => {
  res.json({
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    errorRate: metrics.totalRequests > 0
      ? `${((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(2)}%`
      : '0%',
    avgResponseTime: `${metrics.avgResponseTime}ms`,
    statusCodes: metrics.statusCodes,
    uptime: `${Math.floor(process.uptime())} seconds`,
    startedAt: metrics.startedAt,
  });
};

module.exports = { metricsCollector, getMetrics };
```

```javascript
// app.js mein add karo
const { metricsCollector, getMetrics } = require('./middleware/metricsCollector');

app.use(metricsCollector);             // metrics collection middleware
app.get('/metrics', getMetrics);       // metrics endpoint
```

> **Expected Output:**
> ```json
> {
>   "totalRequests": 256,
>   "totalErrors": 12,
>   "errorRate": "4.69%",
>   "avgResponseTime": "45ms",
>   "statusCodes": { "200": 230, "201": 14, "404": 8, "500": 4 },
>   "uptime": "7200 seconds",
>   "startedAt": "2026-04-04T06:00:00.000Z"
> }
> ```

> **Tip:**
> Production mein in-memory metrics mat use karo — server restart pe sab gone. Prometheus, Datadog, ya CloudWatch jaise tools use karo. Yeh concept samajhne ke liye hai.

---

## Quick Revision Table

| Practice | Kya Kiya | Key Learning |
|----------|---------|--------------|
| Bug Hunting | 6 bugs dhundhe aur fix kiye | Common patterns: async, return, params |
| Health Checks | /live, /ready, /detailed | Liveness vs readiness |
| Metrics | Request counting, response time | Monitoring data collection |
| Dashboard | /metrics endpoint | Error rate, avg response time |

---

## Aaj Kya Seekha?

1. Common Express bugs pehchanna — body parser, async, return, error handler
2. Systematic debugging approach — reproduce, isolate, fix, verify
3. Health check endpoints — liveness, readiness, detailed
4. System info collect karna — memory, CPU, uptime
5. Basic metrics collection middleware banana
6. Error rate aur response time track karna
7. Monitoring dashboard ka concept

> **Practice Time!**
> Apne project mein `/health/live`, `/health/ready`, `/health/detailed` endpoints add karo. Postman se test karo!
