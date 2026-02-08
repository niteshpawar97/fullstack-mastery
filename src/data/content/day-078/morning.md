# Day 78 — Debugging Techniques + Monitoring + Health Checks (Morning Session)

> **Aaj ka plan:**
> Aaj hum seekhenge debugging ka sahi tareeqa, Node.js inspector use karna, VS Code debugger setup, common bug patterns, health check endpoints banana, aur basic monitoring concepts.

---

## Debugging Mindset — Sochne Ka Tareeqa

Bug dhundhna ek skill hai — randomly `console.log` lagana debugging nahi hai, yeh guessing hai!

> **Socho Aise:**
> Socho tum doctor ho. Patient bola "pet mein dard hai." Tum seedha operation nahi karoge — pehle diagnose karoge, reports dekhoge, phir treatment decide karoge. Debugging bhi aise hi hai.

### Debugging Steps:

1. **Reproduce** — Bug ko consistently reproduce karo
2. **Isolate** — Kaunsa part broken hai? Route? Controller? Model? Database?
3. **Inspect** — Variable values dekho, flow trace karo
4. **Fix** — Root cause fix karo (sirf symptom nahi)
5. **Verify** — Fix ke baad test karo ki sach mein theek hua
6. **Prevent** — Test likho taaki dobara na aaye

> **Warning:**
> Sabse badi galti — symptom fix karna, root cause nahi. Jaise bukhar mein sirf paracetamol khana — infection theek nahi hoga!

---

## Node.js --inspect — Built-in Debugger

Node.js ka apna built-in debugger hai. Chrome DevTools se connect hota hai.

> **Terminal Command:**
> ```bash
> # Debug mode mein server start karo
> node --inspect server.js
>
> # Ya specific port pe
> node --inspect=9229 server.js
>
> # Pehle line pe hi ruko (break on start)
> node --inspect-brk server.js
> ```

> **Expected Output:**
> ```
> Debugger listening on ws://127.0.0.1:9229/abc123-def456
> For help, see: https://nodejs.org/en/docs/inspector
> Server running on port 3000
> ```

### Chrome DevTools Se Connect Karo:

1. Chrome browser kholo
2. Address bar mein type karo: `chrome://inspect`
3. "Remote Target" section mein apna Node.js process dikhega
4. "inspect" pe click karo
5. DevTools khul jaayega — Sources tab mein code dikhega

> **Tip:**
> Chrome DevTools mein breakpoints laga sakte ho, variables inspect kar sakte ho, step-by-step code execute kar sakte ho — bilkul frontend debugging jaisa!

---

## VS Code Debugger — Best Developer Experience

VS Code ka built-in debugger sabse convenient hai. `.vscode/launch.json` file banao:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/server.js",
      "envFile": "${workspaceFolder}/.env",
      "restart": true,
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Process",
      "port": 9229,
      "restart": true
    }
  ]
}
```

### VS Code Debugging Shortcuts:

| Shortcut | Kya Karta Hai |
|----------|--------------|
| `F5` | Debug start karo |
| `F9` | Breakpoint toggle (line pe laal dot) |
| `F10` | Step Over — next line pe jao |
| `F11` | Step Into — function ke andar jao |
| `Shift+F11` | Step Out — function se bahar aao |
| `F5` (again) | Continue — next breakpoint tak chalo |

### Breakpoint Types:

```javascript
// 1. Line Breakpoint — F9 se lagao kisi bhi line pe

// 2. Conditional Breakpoint — right click -> "Add Conditional Breakpoint"
// Condition: userId === 'abc123'
// Sirf specific condition pe ruke

// 3. Logpoint — right click -> "Add Logpoint"
// Message: "User value: {user.name}"
// console.log ki jagah — code change nahi karna padta

// 4. debugger statement — code mein likho
function processOrder(order) {
  debugger;  // yahan ruk jaayega jab debugger attached ho
  const total = calculateTotal(order.items);
  return total;
}
```

---

## Common Bug Patterns — Pehchano Aur Fix Karo

### 1. Async/Await Missing

```javascript
// BUG — await bhool gaye
const getUser = async (req, res) => {
  const user = User.findById(req.params.id); // await nahi lagaya!
  console.log(user); // Promise dikhega, data nahi
  res.json(user);    // empty/wrong response
};

// FIX
const getUser = async (req, res) => {
  const user = await User.findById(req.params.id); // await lagao
  res.json(user);
};
```

### 2. Middleware Order Wrong

```javascript
// BUG — body parser BAAD mein lagaya
app.post('/api/data', (req, res) => {
  console.log(req.body); // undefined! Body parse nahi hua
});
app.use(express.json()); // yeh PEHLE hona chahiye

// FIX — middleware pehle lagao
app.use(express.json());  // PEHLE
app.post('/api/data', (req, res) => {
  console.log(req.body);  // ab sahi aayega
});
```

### 3. Error Not Caught

```javascript
// BUG — try-catch nahi hai
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id); // agar invalid id toh crash!
  res.json(user);
});

// FIX — try-catch lagao
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (error) {
    next(error); // error handler ko bhejo
  }
});
```

### 4. Environment Variable Missing

```javascript
// BUG — .env file nahi load hui
const dbUri = process.env.MONGODB_URI; // undefined!
mongoose.connect(dbUri); // crash!

// FIX — dotenv load karo sabse pehle
require('dotenv').config(); // app ki pehli line mein
const dbUri = process.env.MONGODB_URI;
if (!dbUri) throw new Error('MONGODB_URI not set!'); // validate bhi karo
```

---

## Health Check Endpoints

Health check ek simple endpoint hai jo batata hai ki server alive hai ya nahi. Load balancers aur monitoring tools ise use karte hain.

```javascript
// routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Basic health check — server alive hai?
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),           // kitne seconds se chalu hai
    environment: process.env.NODE_ENV,
  });
});

// Detailed health check — dependencies bhi check karo
router.get('/health/detailed', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  // Database check
  try {
    const dbState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    healthCheck.checks.database = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      responseTime: null,
    };

    const start = Date.now();
    await mongoose.connection.db.admin().ping();   // DB ko ping karo
    healthCheck.checks.database.responseTime = `${Date.now() - start}ms`;
  } catch (error) {
    healthCheck.status = 'DEGRADED';
    healthCheck.checks.database = { status: 'unhealthy', error: error.message };
    logger.error('Health check: Database unhealthy', { error: error.message });
  }

  // Memory check
  const memUsage = process.memoryUsage();
  healthCheck.checks.memory = {
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
  };

  const statusCode = healthCheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

module.exports = router;
```

> **Expected Output:**
> ```json
> {
>   "status": "OK",
>   "timestamp": "2026-04-04T10:30:00.000Z",
>   "uptime": 3600.5,
>   "checks": {
>     "database": { "status": "healthy", "responseTime": "5ms" },
>     "memory": { "heapUsed": "45 MB", "heapTotal": "65 MB", "rss": "80 MB" }
>   }
> }
> ```

---

## Readiness vs Liveness Probes

| Probe | Kya Check Karta Hai | Kab Use Hota Hai |
|-------|-------------------|-----------------|
| **Liveness** | Server alive hai? | Restart karna hai ya nahi |
| **Readiness** | Server requests handle kar sakta? | Traffic bhejni chahiye ya nahi |

```javascript
// Liveness — server alive hai
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });   // haan, zinda hoon
});

// Readiness — sab dependencies ready hain?
app.get('/health/ready', async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;

  if (dbReady) {
    res.status(200).json({ status: 'ready' });   // haan, tayyar hoon
  } else {
    res.status(503).json({ status: 'not ready', reason: 'Database not connected' });
  }
});
```

---

## Basic Monitoring with PM2

PM2 Node.js process manager hai — production mein server manage karta hai.

> **Terminal Command:**
> ```bash
> # PM2 install karo globally
> npm install -g pm2
>
> # Server start karo PM2 se
> pm2 start server.js --name "farmer-api"
>
> # Status dekho
> pm2 status
>
> # Logs dekho
> pm2 logs farmer-api
>
> # Monitoring dashboard
> pm2 monit
>
> # Auto-restart on crash
> pm2 start server.js --name "farmer-api" --max-restarts 10
> ```

> **Tip:**
> PM2 process crash hone pe automatically restart karta hai. Memory limit set kar sakte ho — `--max-memory-restart 300M`. Production mein PM2 zaroori hai!

---

## Quick Revision Table

| Concept | Kya Hai | Key Takeaway |
|---------|---------|--------------|
| --inspect | Node.js debugger | Chrome DevTools se connect |
| VS Code Debug | Built-in debugger | F9 breakpoint, F10 step |
| Common Bugs | Async, middleware, env | Patterns pehchano |
| /health | Basic health check | Status + uptime |
| /health/detailed | Deep health check | DB + memory check |
| Liveness | Server alive? | Restart decision |
| Readiness | Server ready? | Traffic routing |
| PM2 | Process manager | Auto-restart, monitoring |

---

## Aaj Kya Seekha?

1. Debugging mindset — reproduce, isolate, inspect, fix, verify, prevent
2. Node.js --inspect aur Chrome DevTools ka use
3. VS Code debugger setup aur breakpoints
4. Common bug patterns — async, middleware order, error handling, env vars
5. Health check endpoints — basic aur detailed
6. Liveness vs readiness probes ka concept
7. PM2 se process management aur basic monitoring

> **Practice Time!**
> Evening session mein hum ek broken Express app debug karenge aur health checks implement karenge!
