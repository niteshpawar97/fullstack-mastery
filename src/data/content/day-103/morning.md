# Day 103 Morning: API Gateway Pattern + Service Discovery

> **Aaj ka plan:** Aaj hum do important microservices patterns samjhenge — API Gateway (single entry point) aur Service Discovery (services ek doosre ko kaise dhundhti hain). Ye dono production microservices mein must-have hain.

---

## Problem: Multiple Services, Multiple URLs

Abhi tak humne direct service URLs use kiye:

```
Client → http://localhost:3001/kisans        (Kisan Service)
Client → http://localhost:3002/orders        (Order Service)
Client → http://localhost:3003/payments      (Payment Service)
Client → http://localhost:3004/notifications (Notification Service)
```

### Isme Kya Problems Hain?

1. **Client ko saare service URLs yaad rakhne padte hain**
2. **CORS issues** — har service alag origin hai
3. **Authentication** har service mein repeat karna padta hai
4. **Rate limiting** centrally nahi ho pata
5. **Service add/remove** hone pe client code change karna padta hai

> **Socho Aise:** Socho ek hospital hai jahan har department ka alag gate hai. Patient ko pata hona chahiye ki X-Ray ka gate 3, Blood Test ka gate 7, Doctor ka gate 12. Kitna confusing! Ek hi reception counter hona chahiye jo sabko route kare.

---

## API Gateway — Single Entry Point

### Kya Hai API Gateway?

API Gateway ek single door hai jisse saari client requests aati hain. Gateway decide karta hai ki kaunsi request kaunsi service ko jaayegi.

```
                        ┌─────────────────┐
                        │   API Gateway    │
   Client ─────────────>│   (Port 3000)    │
                        │                  │
                        └─────┬───┬───┬────┘
                              │   │   │
                    ┌─────────┘   │   └─────────┐
                    ▼             ▼              ▼
              ┌──────────┐ ┌──────────┐  ┌──────────────┐
              │  Kisan   │ │  Order   │  │  Payment     │
              │  Service │ │  Service │  │  Service     │
              │  :3001   │ │  :3002   │  │  :3003       │
              └──────────┘ └──────────┘  └──────────────┘
```

### Gateway Kya Kya Karta Hai?

| Feature | Description |
|---------|------------|
| **Routing** | `/api/kisans` → Kisan Service, `/api/orders` → Order Service |
| **Authentication** | Ek jagah pe JWT verify — har service mein repeat nahi |
| **Rate Limiting** | Ek IP se kitni requests allowed — centrally control |
| **Load Balancing** | Ek service ke multiple instances mein traffic distribute |
| **Logging** | Saari requests ka centralized log |
| **Response Caching** | Frequently requested data cache karo |
| **Request Transform** | Request/Response modify karo before forwarding |

> **Yaad Rakho:** API Gateway ko "reverse proxy on steroids" samjho. Ye sirf route nahi karta, authentication, rate limiting, caching sab handle karta hai.

---

## API Gateway Implementation with Express

### Basic Gateway Code

```javascript
// api-gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Service URLs — production mein environment variables se aayenge
const SERVICES = {
  kisan: process.env.KISAN_URL || 'http://localhost:3001',
  order: process.env.ORDER_URL || 'http://localhost:3002',
  payment: process.env.PAYMENT_URL || 'http://localhost:3003',
  notification: process.env.NOTIFICATION_URL || 'http://localhost:3004',
};

// Rate limiting — ek IP se max 100 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 100,                 // 100 requests per minute
  message: { error: 'Bahut zyada requests! Thoda ruko.' }
});
app.use(limiter);

// Logging middleware — har request log karo
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.url} → ${new Date().toISOString()}`);
  next();
});

// Authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Token nahi mila — login karo!' });
  }
  // Real mein yahan JWT verify hoga
  // const decoded = jwt.verify(token, SECRET);
  // req.user = decoded;
  next();
}

// Health check — gateway ka apna
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    services: Object.keys(SERVICES)
  });
});

// Route: /api/kisans → Kisan Service
app.use('/api/kisans', authenticate, createProxyMiddleware({
  target: SERVICES.kisan,
  changeOrigin: true,
  pathRewrite: { '^/api/kisans': '/kisans' },
  // /api/kisans/123 → http://localhost:3001/kisans/123
}));

// Route: /api/orders → Order Service
app.use('/api/orders', authenticate, createProxyMiddleware({
  target: SERVICES.order,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/orders' },
}));

// Route: /api/payments → Payment Service
app.use('/api/payments', authenticate, createProxyMiddleware({
  target: SERVICES.payment,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '/payments' },
}));

// 404 — koi route match nahi hua
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ye route exist nahi karta' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API Gateway chalu hai port ${PORT} pe`);
  console.log('Routes:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`  /api/${name}s → ${url}`);
  });
});
```

> **Tip:** `http-proxy-middleware` package Express mein reverse proxy set karne ka easy tarika hai. Production mein Nginx ya Kong jaise dedicated gateway use hota hai.

---

## Service Discovery — Services Ek Doosre Ko Kaise Dhundhti Hain?

### Problem

```
// Hardcoded URLs — BAD ❌
const PAYMENT_URL = 'http://localhost:3003';
// Agar payment service ka IP/port change ho to?
// Agar 3 payment service instances hain to kaunsa call karna hai?
```

### Service Discovery Kya Hai?

Ek central registry jahan har service register hoti hai aur doosri services wahan se URL dhundh sakti hain.

```
┌─────────────────────────────────────┐
│        Service Registry              │
│  (Consul / etcd / Eureka)            │
│                                      │
│  kisan-service → 192.168.1.10:3001   │
│  order-service → 192.168.1.11:3002   │
│  payment-service → 192.168.1.12:3003 │
│  payment-service → 192.168.1.13:3003 │ ← multiple instances!
└─────────────────────────────────────┘
        ↑               ↑
   Register         Discover
        │               │
   ┌────┴───┐    ┌──────┴──────┐
   │Service │    │ API Gateway  │
   │ starts │    │ "payment     │
   │        │    │  kidhar hai?"|
   └────────┘    └─────────────┘
```

### Two Types of Discovery

#### 1. Client-Side Discovery
```
Client → Registry se poochho "payment kidhar hai?"
      → Registry bole "192.168.1.12:3003"  
      → Client directly call kare payment service ko
```

#### 2. Server-Side Discovery
```
Client → Load Balancer/Gateway ko request do
      → Gateway registry se poochhe "payment kidhar hai?"
      → Gateway forward kare correct service ko
```

> **Yaad Rakho:** Kubernetes mein service discovery built-in hai! Kube-DNS automatically services ko naam se resolve karta hai. Isliye Kubernetes mein alag service registry ki zarurat nahi padti.

---

## Simple Service Registry (Demo)

```javascript
// service-registry/registry.js
const express = require('express');
const app = express();
app.use(express.json());

// Registry — services ka record
const registry = {};

// Service register karo
app.post('/register', (req, res) => {
  const { name, host, port } = req.body;
  if (!registry[name]) {
    registry[name] = [];
  }

  const instance = { host, port, registeredAt: new Date().toISOString() };
  registry[name].push(instance);

  console.log(`[Registry] ${name} registered → ${host}:${port}`);
  res.json({ message: `${name} registered successfully` });
});

// Service discover karo
app.get('/discover/:serviceName', (req, res) => {
  const instances = registry[req.params.serviceName];
  if (!instances || instances.length === 0) {
    return res.status(404).json({ error: 'Service nahi mili' });
  }

  // Simple round-robin load balancing
  const index = Math.floor(Math.random() * instances.length);
  const instance = instances[index];

  console.log(`[Registry] ${req.params.serviceName} → ${instance.host}:${instance.port}`);
  res.json({ service: req.params.serviceName, instance });
});

// Saari registered services dekho
app.get('/services', (req, res) => {
  res.json(registry);
});

app.listen(3010, () => {
  console.log('Service Registry chalu hai port 3010 pe');
});
```

---

## Popular API Gateway Solutions

| Tool | Type | Best For |
|------|------|----------|
| **Nginx** | Open source | Simple reverse proxy + gateway |
| **Kong** | Open source | Full-featured API gateway |
| **Express Gateway** | Node.js based | Node.js microservices |
| **AWS API Gateway** | Managed service | AWS-based apps |
| **Traefik** | Cloud native | Docker/Kubernetes environments |

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| API Gateway | Single entry point — sab requests yahan se jaati hain |
| Routing | URL path ke basis pe correct service ko forward karo |
| Rate Limiting | Ek IP se kitni requests allow — abuse se bachao |
| Service Discovery | Services ek doosre ko dynamically dhundhti hain |
| Service Registry | Central database jahan services apna address register karti hain |
| Client-Side Discovery | Client khud registry se pooch ke service call kare |
| Server-Side Discovery | Gateway/LB registry se pooch ke forward kare |

---

## Aaj Kya Seekha?

- API Gateway pattern — kyun zaruri hai aur kya karta hai
- Express mein basic API Gateway implement kiya
- Routing, rate limiting, authentication gateway pe handle hota hai
- Service Discovery ka concept — hardcoded URLs ki jagah dynamic discovery
- Client-side vs Server-side discovery
- Popular gateway tools — Nginx, Kong, Traefik
