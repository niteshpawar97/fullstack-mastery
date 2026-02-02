# Day 62 Morning: Modular Architecture + Microservices Intro

> **Aaj ka plan:** Kal humne monolith seekha. Aaj usse aage badhenge — pehle Modular Monolith (monolith ko modules mein todna), phir Microservices ki duniya mein entry karenge. Teeno architectures ka comparison bhi karenge!

---

## Modular Monolith Kya Hai?

### Monolith + Organization = Modular Monolith

Modular Monolith mein app ek hi unit mein deploy hota hai (monolith jaisa), lekin code **clearly defined modules** mein divided hota hai. Har module ka apna boundary hai.

> **Socho Aise:** Socho ek badi dukaan hai — lekin andar alag-alag sections hain: Grocery section, Electronics section, Clothing section. Sab ek building mein hai, lekin har section ka apna staff aur counter hai. Ye hai Modular Monolith!

```
┌──────────────────────────────────────────┐
│           MODULAR MONOLITH               │
│                                          │
│  ┌────────────┐   ┌────────────┐        │
│  │ AUTH MODULE │   │ PRODUCT    │        │
│  │ ─────────  │   │ MODULE     │        │
│  │ routes     │   │ ─────────  │        │
│  │ controller │   │ routes     │        │
│  │ service    │   │ controller │        │
│  │ model      │   │ service    │        │
│  └────────────┘   │ model      │        │
│                    └────────────┘        │
│  ┌────────────┐   ┌────────────┐        │
│  │ ORDER      │   │ PAYMENT    │        │
│  │ MODULE     │   │ MODULE     │        │
│  │ ─────────  │   │ ─────────  │        │
│  │ routes     │   │ routes     │        │
│  │ controller │   │ controller │        │
│  │ service    │   │ service    │        │
│  │ model      │   │ model      │        │
│  └────────────┘   └────────────┘        │
│                                          │
│  ┌──────────────────────────────┐       │
│  │      SHARED DATABASE          │       │
│  └──────────────────────────────┘       │
└──────────────────────────────────────────┘
```

### Module Boundaries Kya Hain?

Module boundary matlab — ek module doosre module ko **directly access nahi karega**. Communication sirf defined interfaces (functions/APIs) se hogi.

```javascript
// BAD: Order module seedha Product model access kar raha hai
// orderService.js
const Product = require('../product/model/Product'); // NAHI!

// GOOD: Order module Product module ki service se baat karta hai
// orderService.js
const productService = require('../product/productService');

async function createOrder(buyerId, items) {
  // Product module ki service use karo — seedha model nahi
  for (const item of items) {
    const isAvailable = await productService.checkStock(item.productId, item.qty);
    if (!isAvailable) {
      throw new Error(`${item.productId} out of stock hai!`);
    }
  }
  // Order create karo...
}
```

> **Yaad Rakho:** Module boundary ka matlab hai ki agar kal tum Product module ko alag service mein todna chaho — to minimum changes lagein. Ye hai modular design ka power!

---

## Modular Monolith Folder Structure

```
kisanbazaar/
├── src/
│   ├── modules/
│   │   ├── auth/                    # Auth Module
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.model.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── product/                 # Product Module
│   │   │   ├── product.routes.js
│   │   │   ├── product.controller.js
│   │   │   ├── product.service.js
│   │   │   ├── product.model.js
│   │   │   └── product.validation.js
│   │   │
│   │   ├── order/                   # Order Module
│   │   │   ├── order.routes.js
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js
│   │   │   ├── order.model.js
│   │   │   └── order.validation.js
│   │   │
│   │   └── payment/                 # Payment Module
│   │       ├── payment.routes.js
│   │       ├── payment.controller.js
│   │       ├── payment.service.js
│   │       └── payment.model.js
│   │
│   ├── shared/                      # Shared utilities
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── database.js
│   │
│   └── app.js
├── package.json
└── .env
```

> **Tip:** Dhyan do — har module ka apna controller, service, model, routes hai. Module ke andar sab kuch self-contained hai. Ye **Separation of Concerns** ka best example hai!

---

## Microservices Architecture

### Har Module Ek Independent App

Microservices mein har module ek **alag application** hai — apna server, apna database, apna deployment. Modules ek doosre se **network calls** (REST API ya Message Queue) se baat karte hain.

> **Socho Aise:** Ab wo dukaan ke sections alag-alag dukaan ban gaye hain! Grocery ki alag dukaan, Electronics ki alag dukaan. Har dukaan ka apna staff, apna billing counter, apna godown. Lekin customer ek mall mein jaake sab access kar sakta hai.

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│ AUTH     │   │ PRODUCT  │   │  ORDER   │
│ SERVICE  │   │ SERVICE  │   │ SERVICE  │
│          │   │          │   │          │
│ Port 3001│   │ Port 3002│   │ Port 3003│
│ Own DB   │   │ Own DB   │   │ Own DB   │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
            ┌───────▼───────┐
            │  API GATEWAY  │
            │  (Port 80)    │
            └───────┬───────┘
                    │
            ┌───────▼───────┐
            │   CLIENT      │
            │  (Browser)    │
            └───────────────┘
```

### Service Communication

Microservices ek doosre se kaise baat karte hain? Do main tarike hain:

#### 1. REST API (Synchronous)

```javascript
// Order Service — Product Service se stock check karta hai
// HTTP call lagata hai doosri service ko

const axios = require('axios');

async function checkProductStock(productId, quantity) {
  // Product Service ko REST call
  const response = await axios.get(
    `http://product-service:3002/api/products/${productId}/stock`
  );
  
  return response.data.availableQty >= quantity;
}
```

#### 2. Message Queue (Asynchronous)

```javascript
// Order Service — payment complete hone pe message bhejta hai
// Payment Service wo message sunti hai aur process karti hai

// Order Service (Producer) — message bhej raha hai
const amqp = require('amqplib');

async function publishOrderCreated(orderData) {
  const connection = await amqp.connect('amqp://rabbitmq:5672');
  const channel = await connection.createChannel();
  
  // Queue mein message daalo
  channel.sendToQueue(
    'order_created',                            // queue naam
    Buffer.from(JSON.stringify(orderData))      // order data
  );
  
  console.log('Order created message bhej diya!');
}

// Payment Service (Consumer) — message sun rahi hai
async function listenForOrders() {
  const connection = await amqp.connect('amqp://rabbitmq:5672');
  const channel = await connection.createChannel();
  
  channel.consume('order_created', (msg) => {
    const order = JSON.parse(msg.content.toString());
    console.log('Naya order aaya! Processing payment...');
    // Payment process karo...
  });
}
```

> **Yaad Rakho:** REST = synchronous (turant response chahiye). Message Queue = asynchronous (baad mein process hoga, koi jaldi nahi). Dono ka apna use case hai!

---

## API Gateway Kya Hai?

API Gateway ek **single entry point** hai client ke liye. Client ko nahi pata ki backend mein kitni services hain — wo sirf gateway se baat karta hai.

```
Client request:  GET /api/products/123

API Gateway decides:
  → /api/products/*  → Product Service (port 3002)
  → /api/orders/*    → Order Service (port 3003)
  → /api/auth/*      → Auth Service (port 3001)
```

> **Socho Aise:** API Gateway mall ka main entrance hai. Customer andar jaake kisi bhi dukaan mein ja sakta hai, lekin enter sirf ek jagah se karta hai.

---

## Comparison: Monolith vs Modular vs Microservices

| Feature | Monolith | Modular Monolith | Microservices |
|---------|----------|-------------------|---------------|
| Codebase | Ek hi code | Ek code, modules mein | Har service ka alag code |
| Database | Ek shared DB | Ek shared DB | Har service ka apna DB |
| Deployment | Ek hi deploy | Ek hi deploy | Har service alag deploy |
| Scaling | Poora app scale | Poora app scale | Sirf needed service scale |
| Complexity | Low | Medium | High |
| Team Size | Small (2-10) | Medium (5-20) | Large (20+) |
| Communication | Function calls | Function calls | Network calls (REST/Queue) |
| Tech Stack | Ek hi language | Ek hi language | Har service alag ho sakti |
| Failure Impact | Ek crash = sab down | Ek crash = sab down | Ek service crash = sirf wo down |
| Best For | MVP, startup | Growing app | Large-scale, enterprise |

> **Warning:** Microservices simple lagta hai diagram mein, lekin manage karna bahut complex hai! Distributed systems mein network failures, data consistency, debugging — sab mushkil hota hai. Bina zaroorat ke microservices mat choose karo!

---

## Kab Kya Choose Karein?

```
Start here → Kya team chhoti hai (< 10)?
             │
             ├── Haan → MONOLITH se shuru karo
             │          │
             │          └── App grow hua? → MODULAR MONOLITH banao
             │                              │
             │                              └── Still scaling issues? → MICROSERVICES
             │
             └── Nahi, badi team hai (20+)?
                 │
                 └── Domain clear hai? → MICROSERVICES
                     │
                     └── Domain unclear? → MODULAR MONOLITH → phir split karo
```

> **Tip:** "Start with monolith, modularize, then microservices" — ye sabse safe path hai. Bahut saare experts (Martin Fowler bhi) ye recommend karte hain!

---

## Quick Revision Table

| Concept | Explanation |
|---------|------------|
| Modular Monolith | Ek deploy, lekin code modules mein organized |
| Module Boundary | Modules ek doosre ko sirf interfaces se access karein |
| Microservices | Har module alag app — apna server, apna DB |
| REST Communication | Synchronous — turant response (HTTP calls) |
| Message Queue | Asynchronous — baad mein process (RabbitMQ, Kafka) |
| API Gateway | Client ka single entry point — routes to correct service |
| Best Practice | Monolith → Modular → Microservices (gradually evolve) |

---

## Aaj Kya Seekha?

1. **Modular Monolith** = monolith + clear module boundaries — best of both worlds
2. **Module boundary** matlab modules sirf defined interfaces se communicate karein
3. **Microservices** mein har module ek independent app hai with own database
4. Services **REST API** (sync) ya **Message Queue** (async) se baat karte hain
5. **API Gateway** client ka single entry point hai
6. **Monolith bura nahi, Microservices magic nahi** — use case ke hisaab se choose karo
7. Safe path: **Monolith → Modular Monolith → Microservices**
