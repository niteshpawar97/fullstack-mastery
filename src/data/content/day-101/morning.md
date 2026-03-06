# Day 101 Morning: Microservices Deep Dive — Service Design

> **Aaj ka plan:** Aaj hum microservices architecture ko deep dive karenge. Samjhenge ki monolith se microservices mein kaise migrate karte hain, service boundaries kaise decide karte hain, aur ek real-world system ko microservices mein kaise todte hain.

---

## Monolith vs Microservices — Recap + Deep Dive

### Monolith Kya Hai?

Ek hi codebase mein saara code — auth, orders, payments, notifications — sab ek saath.

```
monolith-app/
├── controllers/
│   ├── authController.js
│   ├── orderController.js
│   ├── paymentController.js
│   └── notificationController.js
├── models/
│   ├── User.js
│   ├── Order.js
│   └── Payment.js
└── server.js   // Ek hi server sab handle karta hai
```

> **Socho Aise:** Monolith ek bada general store hai — kirana, dawai, kapde sab ek hi dukaan mein. Agar kapde ka section renovate karna ho, to poori dukaan band karni padti hai!

### Microservices Kya Hai?

Har feature ek alag chhota application hai — apna database, apna server, apna deployment.

```
system/
├── auth-service/        // Port 3001
├── order-service/       // Port 3002
├── payment-service/     // Port 3003
├── notification-service/ // Port 3004
└── api-gateway/         // Port 3000 (entry point)
```

> **Socho Aise:** Microservices ek mall hai — har dukaan independent hai. Ek dukaan band bhi ho to baaki sab chalu rahti hain!

---

## Kab Microservices Use Karna Chahiye?

### Monolith Theek Hai Jab:

- Team chhoti hai (2-5 developers)
- Product abhi early stage mein hai
- Traffic kam hai
- Fast prototyping chahiye

### Microservices Chahiye Jab:

- Team badi hai (10+ developers)
- Alag-alag features ko independently deploy karna hai
- Different parts ko different technologies mein banana hai
- High availability chahiye (ek part fail ho to baaki chale)

> **Warning:** Bahut log bina zaroorat ke microservices adopt kar lete hain. Ye "premature optimization" hai. Pehle monolith banao, jab pain points aayein tab split karo!

---

## Domain-Driven Design (DDD) — Service Boundaries

### Bounded Context Kya Hai?

Har microservice ka ek "bounded context" hota hai — ek clear domain jiska wo maalik hai.

```
E-commerce System:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   User       │  │   Order      │  │   Payment    │
│   Service    │  │   Service    │  │   Service    │
│              │  │              │  │              │
│ - Register   │  │ - Create     │  │ - Process    │
│ - Login      │  │ - Track      │  │ - Refund     │
│ - Profile    │  │ - Cancel     │  │ - History    │
│              │  │              │  │              │
│ [User DB]    │  │ [Order DB]   │  │ [Payment DB] │
└─────────────┘  └─────────────┘  └─────────────┘
```

> **Yaad Rakho:** Har microservice ka apna database hota hai. Ek service doosri service ka database directly access NAHI karti. Ye sabse important rule hai!

---

## Real-World Example: Kisan App Microservices

Socho ek "Kisan Mitra" app bana rahe ho:

```
Kisan Mitra App - Microservices Design:

1. Kisan Service       → Registration, profile, KYC
2. Crop Service        → Crop info, mausam data, advisory
3. Mandi Service       → Market prices, nearest mandi
4. Order Service       → Beej/khad order karna
5. Payment Service     → UPI, wallet, loan
6. Notification Service → SMS, push notification
7. Analytics Service   → Dashboard, reports
```

### Service Design Principles

```javascript
// GALAT approach - Order service mein payment logic ❌
app.post('/orders', async (req, res) => {
  const order = await Order.create(req.body);
  // Payment logic ORDER service mein nahi hona chahiye!
  const payment = await processPayment(order.amount);
  await sendSMS(req.body.phone); // Notification bhi yahan?
  res.json({ order, payment });
});

// SAHI approach - Har service apna kaam kare ✅
// order-service/routes/order.js
app.post('/orders', async (req, res) => {
  const order = await Order.create(req.body);
  // Payment service ko message bhejo
  await publishEvent('ORDER_CREATED', { orderId: order.id, amount: order.amount });
  res.json({ order });
});
```

> **Tip:** "Single Responsibility Principle" yaad rakho — har service ek hi kaam kare, lekin wo kaam acche se kare.

---

## Service Design Patterns

### 1. Database Per Service

```
// Har service ka apna DB
auth-service     → auth_db (MongoDB)
order-service    → order_db (PostgreSQL)
payment-service  → payment_db (PostgreSQL)
cache-service    → Redis
```

### 2. API First Design

```yaml
# order-service/api-spec.yaml
openapi: 3.0.0
info:
  title: Order Service API
  version: 1.0.0
paths:
  /orders:
    post:
      summary: Naya order banao
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                kisanId:
                  type: string
                items:
                  type: array
                amount:
                  type: number
```

### 3. Event-Driven Communication

```
Order Created → Payment Service listens → Process Payment
Payment Done  → Notification Service listens → Send SMS
Payment Failed → Order Service listens → Cancel Order
```

> **Yaad Rakho:** Microservices mein services ek doosre se directly baat nahi karti. Ya to API call karti hain ya events/messages ke through communicate karti hain.

---

## Hands-On: Basic Service Structure

```javascript
// order-service/server.js
const express = require('express');
const app = express();
app.use(express.json());

// Health check - har service mein hona chahiye
app.get('/health', (req, res) => {
  res.json({
    service: 'order-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Orders routes
app.get('/orders', async (req, res) => {
  // Sirf order related logic
  res.json({ orders: [] });
});

app.post('/orders', async (req, res) => {
  // Order create karo
  // Event publish karo (payment service ko batao)
  res.status(201).json({ message: 'Order created' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Order Service chal raha hai port ${PORT} pe`);
});
```

> **Tip:** Har microservice mein `/health` endpoint rakhna best practice hai. Kubernetes aur load balancers isse check karte hain ki service alive hai ya nahi.

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| Monolith | Sab kuch ek hi app mein — simple lekin tightly coupled |
| Microservices | Chhoti independent services — flexible lekin complex |
| Bounded Context | Har service ka apna clear domain/boundary |
| Database Per Service | Har service ka apna DB — doosri service directly access nahi karti |
| Event-Driven | Services events ke through communicate karti hain |
| Health Check | `/health` endpoint se service alive hai ya nahi check hota hai |
| DDD | Domain-Driven Design — business domain ke hisaab se services banao |

---

## Aaj Kya Seekha?

- Monolith vs Microservices ka detailed comparison
- Kab monolith rakhna chahiye aur kab microservices mein split karna chahiye
- Domain-Driven Design (DDD) aur Bounded Context
- Service design principles — single responsibility, database per service
- Event-driven communication ka basic idea
- Health check endpoints ki importance
