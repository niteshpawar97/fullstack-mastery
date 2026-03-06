# Day 101 Evening: Microservices Hands-On — Building Two Services

> **Practice Time!** Morning mein theory seekhi — ab do actual microservices banate hain jo ek doosre se communicate karengi!

---

## Setup: Project Structure Banao

> **Terminal Command:**
> ```bash
> mkdir kisan-microservices
> cd kisan-microservices
> mkdir kisan-service order-service
> ```

---

## Task 1: Kisan Service Banao

### Step 1: Initialize

> **Terminal Command:**
> ```bash
> cd kisan-service
> npm init -y
> npm install express mongoose dotenv cors
> ```

### Step 2: Server Code

```javascript
// kisan-service/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory database (demo ke liye)
let kisans = [
  { id: '1', naam: 'Ramesh Patil', gaon: 'Nashik', phone: '9876543210' },
  { id: '2', naam: 'Suresh Yadav', gaon: 'Pune', phone: '9876543211' },
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'kisan-service',
    status: 'healthy',
    kisanCount: kisans.length,
    uptime: process.uptime()
  });
});

// Saare kisans list karo
app.get('/kisans', (req, res) => {
  console.log('[Kisan Service] GET /kisans - saare kisans bhej rahe hain');
  res.json({ success: true, data: kisans });
});

// Ek kisan ki detail
app.get('/kisans/:id', (req, res) => {
  const kisan = kisans.find(k => k.id === req.params.id);
  if (!kisan) {
    return res.status(404).json({ success: false, message: 'Kisan nahi mila' });
  }
  console.log(`[Kisan Service] GET /kisans/${req.params.id} - ${kisan.naam}`);
  res.json({ success: true, data: kisan });
});

// Naya kisan register karo
app.post('/kisans', (req, res) => {
  const { naam, gaon, phone } = req.body;
  const newKisan = {
    id: String(kisans.length + 1),
    naam,
    gaon,
    phone
  };
  kisans.push(newKisan);
  console.log(`[Kisan Service] POST /kisans - ${naam} registered!`);
  res.status(201).json({ success: true, data: newKisan });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Kisan Service chalu hai port ${PORT} pe`);
});
```

---

## Task 2: Order Service Banao

### Step 1: Initialize

> **Terminal Command:**
> ```bash
> cd ../order-service
> npm init -y
> npm install express axios dotenv cors
> ```

### Step 2: Server Code — Doosri Service Ko Call Karna

```javascript
// order-service/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Kisan service ka URL (environment variable se aayega production mein)
const KISAN_SERVICE_URL = process.env.KISAN_SERVICE_URL || 'http://localhost:3001';

// In-memory orders
let orders = [];
let orderCounter = 0;

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'order-service',
    status: 'healthy',
    orderCount: orders.length,
    dependencies: { kisanService: KISAN_SERVICE_URL }
  });
});

// Naya order banao — pehle kisan verify karo doosri service se
app.post('/orders', async (req, res) => {
  try {
    const { kisanId, items, amount } = req.body;

    // Step 1: Kisan service se verify karo ki kisan exist karta hai
    console.log(`[Order Service] Kisan ${kisanId} ko verify kar rahe hain...`);
    const kisanResponse = await axios.get(`${KISAN_SERVICE_URL}/kisans/${kisanId}`);
    const kisan = kisanResponse.data.data;

    // Step 2: Order create karo
    orderCounter++;
    const newOrder = {
      id: `ORD-${String(orderCounter).padStart(4, '0')}`,
      kisanId,
      kisanNaam: kisan.naam,
      items,
      amount,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    console.log(`[Order Service] Order ${newOrder.id} bana diya ${kisan.naam} ke liye`);

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(400).json({
        success: false,
        message: 'Kisan nahi mila — pehle register karo!'
      });
    }
    console.error('[Order Service] Error:', error.message);
    res.status(500).json({ success: false, message: 'Kuch gadbad ho gayi' });
  }
});

// Saare orders dekho
app.get('/orders', (req, res) => {
  res.json({ success: true, data: orders });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Order Service chalu hai port ${PORT} pe`);
  console.log(`Kisan Service URL: ${KISAN_SERVICE_URL}`);
});
```

> **Yaad Rakho:** Order service `axios` use karke kisan service ko HTTP call karti hai. Ye "synchronous inter-service communication" hai. Iska matlab agar kisan service down hai to order service bhi fail hogi!

---

## Task 3: Dono Services Ek Saath Chalao

### Terminal 1 mein:

> **Terminal Command:**
> ```bash
> cd kisan-service && node server.js
> # Output: Kisan Service chalu hai port 3001 pe
> ```

### Terminal 2 mein:

> **Terminal Command:**
> ```bash
> cd order-service && node server.js
> # Output: Order Service chalu hai port 3002 pe
> ```

### Terminal 3 mein Test karo:

```bash
# 1. Health check - dono services
curl http://localhost:3001/health
curl http://localhost:3002/health

# 2. Saare kisans dekho
curl http://localhost:3001/kisans

# 3. Order banao (kisan id 1 ke liye)
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"kisanId": "1", "items": ["Urea 50kg", "DAP 25kg"], "amount": 2500}'

# 4. Invalid kisan ke liye order try karo
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"kisanId": "999", "items": ["Seeds"], "amount": 500}'
```

> **Expected Output:**
> ```json
> // Order success:
> {
>   "success": true,
>   "data": {
>     "id": "ORD-0001",
>     "kisanId": "1",
>     "kisanNaam": "Ramesh Patil",
>     "items": ["Urea 50kg", "DAP 25kg"],
>     "amount": 2500,
>     "status": "PENDING"
>   }
> }
>
> // Invalid kisan:
> { "success": false, "message": "Kisan nahi mila — pehle register karo!" }
> ```

---

## Task 4: Error Handling — Service Down Scenario

Order service chalu rakho lekin kisan service band karo. Phir order create karne ki koshish karo.

```bash
# Kisan service band karo (Terminal 1 mein Ctrl+C)
# Ab order try karo
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"kisanId": "1", "items": ["Seeds"], "amount": 500}'

# Error aayega: Kuch gadbad ho gayi
```

> **Yaad Rakho:** Ye microservices ka sabse bada challenge hai — agar ek service down hai to dependent services bhi fail ho sakti hain. Isko solve karne ke liye "Circuit Breaker" pattern use karte hain (aage seekhenge).

---

## Mini Challenge

1. Ek **Payment Service** banao (port 3003) jo order confirm hone pe payment process kare
2. Order service mein ek `PATCH /orders/:id/pay` endpoint add karo jo payment service ko call kare
3. Har service ke logs mein timestamp add karo

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| Service Independence | Har service ka apna server, apna port |
| Inter-service Call | `axios` se HTTP request doosri service ko |
| Health Check | `/health` endpoint — service alive hai check karo |
| Error Handling | Dependent service down ho to gracefully handle karo |
| In-Memory DB | Demo ke liye array use kiya, production mein real DB hoga |

---

## Aaj Kya Seekha?

- Do independent microservices banaye — Kisan Service aur Order Service
- Ek service se doosri service ko HTTP call kiya (axios)
- Health check endpoints implement kiye
- Service down hone pe error handling samjhi
- Microservices ka biggest challenge — service dependency
