# Day 62 Evening: Practice — Refactor Monolith to Modular + Microservices Design

> **Aaj ka plan:** Kal humne KisanBazaar ka monolith design kiya tha. Aaj usse pehle modular monolith mein refactor karenge, phir microservices design karenge. Hands-on folder structure aur code changes dekhenge!

---

## Task 1: Monolith Ko Modular Monolith Mein Refactor Karo

### Before (Monolith Structure)

```
kisanbazaar/
├── src/
│   ├── controllers/           # Sab controllers ek folder mein
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── paymentController.js
│   ├── models/                # Sab models ek folder mein
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/                # Sab routes ek folder mein
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── orderRoutes.js
│   └── app.js
```

### After (Modular Monolith Structure)

```
kisanbazaar/
├── src/
│   ├── modules/
│   │   ├── auth/              # AUTH module — self-contained
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.model.js
│   │   │   ├── auth.validation.js
│   │   │   └── index.js       # Module ka public API
│   │   │
│   │   ├── product/           # PRODUCT module — self-contained
│   │   │   ├── product.routes.js
│   │   │   ├── product.controller.js
│   │   │   ├── product.service.js
│   │   │   ├── product.model.js
│   │   │   ├── product.validation.js
│   │   │   └── index.js
│   │   │
│   │   ├── order/             # ORDER module — self-contained
│   │   │   ├── order.routes.js
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js
│   │   │   ├── order.model.js
│   │   │   └── index.js
│   │   │
│   │   └── payment/           # PAYMENT module — self-contained
│   │       ├── payment.routes.js
│   │       ├── payment.controller.js
│   │       ├── payment.service.js
│   │       ├── payment.model.js
│   │       └── index.js
│   │
│   ├── shared/                # Shared code — sab modules use karein
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   ├── apiResponse.js
│   │   │   └── logger.js
│   │   └── database.js
│   │
│   └── app.js                 # Main app — modules register karo
├── package.json
└── .env
```

> **Yaad Rakho:** Key difference — har module apne andar sab kuch rakhta hai. Controller, service, model, routes — sab ek folder mein. Module ka `index.js` uska "public API" hai — bahar se sirf index.js se access hoga.

---

## Module Index File — Public API

```javascript
// src/modules/product/index.js
// Ye file define karti hai ki bahar se kya accessible hai

const productRoutes = require('./product.routes');
const productService = require('./product.service');

module.exports = {
  routes: productRoutes,
  // Sirf wo functions expose karo jo doosre modules ko chahiye
  service: {
    checkStock: productService.checkStock,
    getProductById: productService.getProductById,
    updateStock: productService.updateStock,
  }
};
```

```javascript
// src/modules/order/order.service.js
// Order module Product module se SIRF index.js ke through baat karta hai

const productModule = require('../product'); // index.js load hota hai

async function createOrder(buyerId, items) {
  // Product module ki public service use karo
  for (const item of items) {
    const available = await productModule.service.checkStock(
      item.productId, 
      item.quantity
    );
    
    if (!available) {
      throw new Error('Stock nahi hai bhai!');
    }
  }
  
  // Order create karo
  const order = await Order.create({
    buyer: buyerId,
    items: items,
    status: 'pending'
  });
  
  // Stock update karo — product module ki service se
  for (const item of items) {
    await productModule.service.updateStock(item.productId, -item.quantity);
  }
  
  return order;
}
```

> **Tip:** Module boundary enforce karne ka simple rule: **Kabhi doosre module ka model directly import mat karo.** Hamesha uski service use karo.

---

## Main App — Modules Register Karo

```javascript
// src/app.js — Modular Monolith ka entry point
const express = require('express');
const app = express();
const { connectDB } = require('./shared/database');
const errorHandler = require('./shared/middleware/errorHandler');

// Middleware
app.use(express.json());

// Har module ke routes register karo
// Ek jagah se sab modules connect hote hain
const authModule = require('./modules/auth');
const productModule = require('./modules/product');
const orderModule = require('./modules/order');
const paymentModule = require('./modules/payment');

app.use('/api/auth', authModule.routes);
app.use('/api/products', productModule.routes);
app.use('/api/orders', orderModule.routes);
app.use('/api/payments', paymentModule.routes);

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();
  app.listen(3000, () => {
    console.log('KisanBazaar modular monolith chal raha hai port 3000 pe!');
  });
}

startServer();
```

---

## Task 2: Microservices Design for Same System

### Service Boundaries Identify Karo

> **Socho Aise:** Microservices mein sabse mushkil kaam hai — **kahan todna hai** ye decide karna. Har service ko ek **business capability** ke around design karo.

```
KisanBazaar Microservices:

┌─────────────────────────────────────────────────────┐
│                    API GATEWAY                       │
│              (nginx / Kong / Express)                │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
  ┌────▼────┐ ┌──▼─────┐ ┌─▼──────┐ ┌▼─────────┐
  │  AUTH   │ │PRODUCT │ │ ORDER  │ │ PAYMENT  │
  │ SERVICE │ │SERVICE │ │SERVICE │ │ SERVICE  │
  │         │ │        │ │        │ │          │
  │ Users   │ │Products│ │Orders  │ │Transact. │
  │ Tokens  │ │Reviews │ │Cart    │ │Refunds   │
  │         │ │Stock   │ │        │ │          │
  │ MongoDB │ │MongoDB │ │MongoDB │ │PostgreSQL│
  │ :3001   │ │:3002   │ │:3003   │ │:3004     │
  └─────────┘ └────────┘ └────────┘ └──────────┘
       │          │          │          │
       └──────────┼──────────┼──────────┘
                  │          │
          ┌───────▼──────────▼───────┐
          │     MESSAGE QUEUE        │
          │     (RabbitMQ)           │
          └──────────────────────────┘
```

### Service Boundaries

| Service | Responsibility | Database | Communication |
|---------|---------------|----------|---------------|
| Auth Service | User register/login, JWT, password reset | MongoDB (users) | REST (sync) |
| Product Service | Crop listing, stock, reviews, search | MongoDB (products) | REST (sync) |
| Order Service | Cart, order placement, order tracking | MongoDB (orders) | REST + Queue |
| Payment Service | Payment processing, transactions, refunds | PostgreSQL (transactions) | Queue (async) |
| Notification Service | Email, SMS, push notifications | Redis (queue) | Queue only (async) |

> **Warning:** Dekho Payment Service mein **PostgreSQL** use kiya — kyunki financial transactions ke liye ACID compliance chahiye. Microservices ka ye fayda hai — har service apne best-fit database use kar sakti hai! Isko **Polyglot Persistence** kehte hain.

---

## Inter-Service Communication Plan

```javascript
// Scenario: Buyer ne order place kiya
// Ye chain of events hoga:

// 1. Client → API Gateway → Order Service
//    POST /api/orders (buyer cart data bhejta hai)

// 2. Order Service → Product Service (REST - sync)
//    GET /product-service/api/products/:id/stock
//    Stock check karta hai — haan ya nahi turant pata chale

// 3. Order Service → Message Queue (async)
//    order.created event publish karta hai

// 4. Payment Service sunti hai order.created event
//    Payment process start karti hai

// 5. Payment Service → Message Queue (async)  
//    payment.completed event publish karti hai

// 6. Order Service sunti hai payment.completed event
//    Order status update karti hai: 'paid'

// 7. Notification Service sunti hai payment.completed event
//    Buyer ko SMS bhejti hai: "Payment successful! Order confirmed."
//    Farmer ko email: "Naya order aaya hai!"
```

> **Example:** Ye event-driven architecture hai. Services ek doosre se directly baat nahi karti — message queue ke through communicate karti hain. Isse **loose coupling** milta hai.

---

## Task 3: Compare Both Designs

### Refactoring Effort Analysis

```
Monolith → Modular Monolith:
- Effort: LOW (2-3 din)
- Risk: LOW (same app, sirf restructure)
- Benefit: Better organization, clear boundaries
- Deploy: Same as before — ek hi unit

Modular Monolith → Microservices:
- Effort: HIGH (2-4 hafte)
- Risk: HIGH (network issues, data sync, new infra)
- Benefit: Independent scaling, tech diversity
- Deploy: Complex — har service alag deploy

Seedha Monolith → Microservices:
- Effort: VERY HIGH
- Risk: VERY HIGH
- DO NOT DO THIS! Pehle modular banao!
```

> **Practice Time!** Apne KisanBazaar system ke liye ek **Notification Service** design karo. Socho:
> 1. Ye service kaunse events sunegi?
> 2. Kya database chahiye isko?
> 3. REST ya Message Queue se communicate karegi?
> 4. Iske folder structure kya hoga?

---

## Quick Revision Table

| Concept | Explanation |
|---------|------------|
| Module Index | index.js — module ka public API define karta hai |
| Module Boundary | Doosre module ka model directly import mat karo |
| Service Boundary | Har microservice ek business capability ke around |
| Polyglot Persistence | Har service apna best-fit DB use kar sakti hai |
| Event-Driven | Services events se communicate karti hain (loose coupling) |
| Refactoring Path | Monolith → Modular → Microservices (step by step) |

---

## Aaj Kya Seekha?

1. Monolith ko **modular monolith** mein refactor karna relatively easy hai
2. **Module index.js** public API define karta hai — boundary enforce hoti hai
3. Microservices mein har service ka **apna database** hota hai
4. **REST** for synchronous, **Message Queue** for asynchronous communication
5. **Polyglot Persistence** — har service best-fit technology use kar sakti hai
6. **Event-driven architecture** loose coupling deta hai services ke beech
7. Seedha monolith se microservices mein jaana **galti hai** — pehle modularize karo!
