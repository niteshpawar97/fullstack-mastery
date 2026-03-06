# Day 102 Morning: Inter-service Communication — REST + Message Queue

> **Aaj ka plan:** Aaj hum samjhenge ki microservices ek doosre se kaise baat karti hain. Do main tarike hain — Synchronous (REST API calls) aur Asynchronous (Message Queues). Dono ke fayde aur nuksan samjhenge.

---

## Communication Ke Do Tarike

### 1. Synchronous (REST) — Direct Call

```
Order Service ──HTTP Request──> Payment Service
     ↑                              │
     └──────HTTP Response───────────┘
     
# Order service WAIT karta hai jab tak payment service reply na de
```

### 2. Asynchronous (Message Queue) — Indirect via Queue

```
Order Service ──Message──> [Message Queue] ──Message──> Payment Service
     │                                              
     └── Turant aage badh jaata hai (wait nahi karta)
```

> **Socho Aise:** Synchronous matlab phone call — dono ko ek saath available hona padta hai. Asynchronous matlab WhatsApp message — bhej do, saamne wala jab free ho tab padh lega!

---

## Synchronous Communication — REST API Calls

### Kab Use Karna Hai?

- Jab turant response chahiye (user wait kar raha hai)
- Jab data real-time chahiye
- Simple request-response pattern

### Example: Order Service calls Payment Service

```javascript
// order-service/services/paymentClient.js
const axios = require('axios');

const PAYMENT_SERVICE = process.env.PAYMENT_URL || 'http://localhost:3003';

// Synchronous call — response ka wait karega
async function processPayment(orderId, amount, kisanId) {
  try {
    console.log(`[Order] Payment request bhej rahe hain: Rs ${amount}`);

    const response = await axios.post(`${PAYMENT_SERVICE}/payments`, {
      orderId,
      amount,
      kisanId,
      method: 'UPI'
    });

    console.log(`[Order] Payment response aaya: ${response.data.status}`);
    return response.data;
  } catch (error) {
    console.error(`[Order] Payment service se error: ${error.message}`);
    throw new Error('Payment process nahi ho paya');
  }
}

module.exports = { processPayment };
```

### Problems with Synchronous

```
Problem 1: TIGHT COUPLING
Order Service ──> Payment Service ──> Notification Service
   (agar payment down hai to order bhi fail)

Problem 2: LATENCY CHAIN
Total time = Order (50ms) + Payment (200ms) + Notification (100ms) = 350ms
   (har call ka time add hota jaata hai)

Problem 3: CASCADING FAILURE
Notification down → Payment timeout → Order timeout → User ko error
   (ek service ne sabko maaraa)
```

> **Warning:** Synchronous calls mein "cascading failure" ka bahut bada risk hota hai. Ek service slow ho to poori chain slow ho jaati hai!

---

## Asynchronous Communication — Message Queue

### Kaise Kaam Karta Hai?

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Producer │────>│ Message Queue│────>│   Consumer   │
│ (Sender)  │     │  (Broker)    │     │  (Receiver)  │
└──────────┘     └──────────────┘     └──────────────┘

Producer: Message bhejne wala (Order Service)
Queue: Messages store karne wala (RabbitMQ/Kafka)
Consumer: Message process karne wala (Payment Service)
```

### Real-Life Analogy

> **Socho Aise:** Message Queue ek post office jaisa hai:
> - Tum letter (message) likhte ho aur post office mein daal dete ho
> - Post office letter store karke rakhta hai
> - Jab receiver available ho, wo letter utha leta hai
> - Tumhe wait nahi karna padta receiver ke liye!

### Kab Use Karna Hai?

- Jab turant response zaruri nahi hai
- Heavy processing karna hai background mein
- Ek event ko multiple services ko batana hai
- Service down bhi ho to message queue mein safe rahe

---

## Popular Message Queue Systems

| Tool | Best For | Used By |
|------|----------|---------|
| **RabbitMQ** | Traditional message queuing, task distribution | Small-Medium apps |
| **Apache Kafka** | Event streaming, high throughput, log | Netflix, LinkedIn |
| **Redis Pub/Sub** | Simple pub/sub, caching ke saath | Real-time features |
| **AWS SQS** | Cloud-native, managed service | AWS apps |
| **Bull/BullMQ** | Node.js job queues (Redis based) | Node.js apps |

> **Tip:** Beginners ke liye RabbitMQ se start karo — simple hai aur samajhne mein easy hai. High-scale applications ke liye Kafka best hai.

---

## Event-Driven Architecture

### Event Kya Hai?

Event matlab "kuch hua" — ek fact jo past mein ho chuka hai.

```javascript
// Events ke examples:
const events = [
  'ORDER_CREATED',      // Order ban gaya
  'PAYMENT_COMPLETED',  // Payment ho gayi
  'PAYMENT_FAILED',     // Payment fail ho gayi
  'ORDER_SHIPPED',      // Order ship ho gaya
  'SMS_SENT',           // SMS bhej diya
];
```

### Event Flow Example

```
1. User order karta hai
   └─> Order Service creates order
       └─> Publishes: ORDER_CREATED event

2. Payment Service listens ORDER_CREATED
   └─> Process payment
       └─> Publishes: PAYMENT_COMPLETED event

3. Notification Service listens PAYMENT_COMPLETED
   └─> Sends SMS to kisan
       └─> Publishes: SMS_SENT event

4. Order Service listens PAYMENT_COMPLETED
   └─> Updates order status to "PAID"
```

> **Yaad Rakho:** Event-driven mein koi service doosri service ko directly nahi jaanti. Sab events ke through communicate karti hain. Isse "loose coupling" kehte hain.

---

## Simple Event System with Node.js EventEmitter

```javascript
// shared/eventBus.js
// Simple in-process event bus (demo ke liye)
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  publish(eventName, data) {
    console.log(`[EventBus] Event published: ${eventName}`);
    console.log(`[EventBus] Data:`, JSON.stringify(data));
    this.emit(eventName, data);
  }

  subscribe(eventName, handler) {
    console.log(`[EventBus] Subscribed to: ${eventName}`);
    this.on(eventName, handler);
  }
}

// Singleton — poori app mein ek hi instance
const eventBus = new EventBus();
module.exports = eventBus;
```

```javascript
// order-service/orderHandler.js
const eventBus = require('../shared/eventBus');

// Order create hone pe event publish karo
async function createOrder(orderData) {
  const order = {
    id: `ORD-${Date.now()}`,
    ...orderData,
    status: 'CREATED'
  };

  // Event publish — payment service ko batao
  eventBus.publish('ORDER_CREATED', {
    orderId: order.id,
    amount: order.amount,
    kisanId: order.kisanId
  });

  return order;
}

// Payment complete hone pe order update karo
eventBus.subscribe('PAYMENT_COMPLETED', (data) => {
  console.log(`[Order] Payment complete hua order ${data.orderId} ke liye`);
  // Order status update karo
});

module.exports = { createOrder };
```

---

## Sync vs Async — Comparison Table

| Feature | Synchronous (REST) | Asynchronous (Queue) |
|---------|-------------------|---------------------|
| Response | Turant milta hai | Baad mein milta hai |
| Coupling | Tight — dono ka chalu hona zaruri | Loose — independent |
| Failure | Cascading failure possible | Queue mein safe rahega |
| Speed | Slow (chain latency) | Fast (fire & forget) |
| Complexity | Simple to implement | Thoda complex setup |
| Use Case | Real-time data chahiye | Background processing |
| Example | Get user profile | Send email notification |

> **Yaad Rakho:** Real-world mein dono ka mix use hota hai. User-facing requests ke liye sync (REST), background tasks ke liye async (Queue).

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| Synchronous | Direct HTTP call — response ka wait karo |
| Asynchronous | Message queue mein daalo — wait mat karo |
| Message Queue | Beech ka buffer jo messages store karta hai |
| Producer | Message bhejne wala service |
| Consumer | Message padhne/process karne wala service |
| Event-Driven | Services events publish/subscribe karti hain |
| Cascading Failure | Ek service fail to chain mein sab fail |

---

## Aaj Kya Seekha?

- Synchronous (REST) vs Asynchronous (Message Queue) communication
- Dono ke fayde aur nuksan
- Event-driven architecture ka concept
- Popular message queue tools — RabbitMQ, Kafka, Redis
- Simple event bus implementation Node.js mein
- Real-world mein dono ka mix use hota hai
