# Day 102 Evening: Hands-On — REST Communication + Simple Queue with BullMQ

> **Practice Time!** Ab do services banaate hain — ek REST se communicate karengi aur ek BullMQ (Redis-based queue) se. Dono patterns practically samjhenge!

---

## Setup: Redis Install Karo

BullMQ ke liye Redis chahiye. Docker se easiest hai:

> **Terminal Command:**
> ```bash
> # Docker se Redis start karo
> docker run -d --name redis-queue -p 6379:6379 redis:alpine
> 
> # Verify karo
> docker ps
> ```

> **Tip:** Agar Docker nahi hai to Redis directly install karo: https://redis.io/download

---

## Task 1: REST Communication — Service to Service

### Project Setup

> **Terminal Command:**
> ```bash
> mkdir day102-practice && cd day102-practice
> mkdir notification-service order-service-v2
> ```

### Notification Service (Port 3004)

```javascript
// notification-service/server.js
const express = require('express');
const app = express();
app.use(express.json());

// SMS log store (demo ke liye)
let smsLog = [];

app.get('/health', (req, res) => {
  res.json({ service: 'notification-service', status: 'healthy' });
});

// SMS bhejne ka endpoint
app.post('/sms', (req, res) => {
  const { phone, message, orderId } = req.body;

  // Real mein yahan Twilio/MSG91 API call hogi
  const sms = {
    id: `SMS-${Date.now()}`,
    phone,
    message,
    orderId,
    status: 'SENT',
    sentAt: new Date().toISOString()
  };

  smsLog.push(sms);
  console.log(`[Notification] SMS bheja: ${phone} → "${message}"`);

  res.status(201).json({ success: true, data: sms });
});

// SMS history
app.get('/sms', (req, res) => {
  res.json({ success: true, data: smsLog });
});

app.listen(3004, () => {
  console.log('Notification Service chalu hai port 3004 pe');
});
```

### Order Service (Port 3002) — REST Call to Notification

```javascript
// order-service-v2/server.js
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const NOTIFICATION_URL = 'http://localhost:3004';
let orders = [];
let counter = 0;

app.post('/orders', async (req, res) => {
  try {
    counter++;
    const order = {
      id: `ORD-${String(counter).padStart(4, '0')}`,
      ...req.body,
      status: 'CREATED',
      createdAt: new Date().toISOString()
    };
    orders.push(order);

    // SYNCHRONOUS: Notification service ko direct call
    console.log('[Order] Notification service ko SMS request bhej rahe hain...');
    const startTime = Date.now();

    await axios.post(`${NOTIFICATION_URL}/sms`, {
      phone: req.body.phone || '9876543210',
      message: `Order ${order.id} ban gaya hai. Amount: Rs ${order.amount}`,
      orderId: order.id
    });

    const timeTaken = Date.now() - startTime;
    console.log(`[Order] SMS request complete - ${timeTaken}ms laga`);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('[Order] Notification service down hai:', error.message);
    // ORDER to ban gaya lekin SMS nahi gaya — kya karna chahiye?
    res.status(201).json({
      success: true,
      data: orders[orders.length - 1],
      warning: 'SMS nahi bhej paaye — notification service down hai'
    });
  }
});

app.get('/orders', (req, res) => {
  res.json({ success: true, data: orders });
});

app.listen(3002, () => {
  console.log('Order Service chalu hai port 3002 pe');
});
```

> **Yaad Rakho:** Dekho problem — agar notification service down hai to order create hone mein extra time lagta hai (timeout wait). Async queue se ye problem solve hota hai.

---

## Task 2: Async Communication with BullMQ

### Setup

> **Terminal Command:**
> ```bash
> mkdir queue-demo && cd queue-demo
> npm init -y
> npm install bullmq ioredis express
> ```

### Producer — Order Service (Queue mein message daalo)

```javascript
// queue-demo/producer.js
const { Queue } = require('bullmq');
const express = require('express');
const app = express();
app.use(express.json());

// Redis connection config
const connection = { host: 'localhost', port: 6379 };

// Queue banao
const notificationQueue = new Queue('notifications', { connection });
const paymentQueue = new Queue('payments', { connection });

let counter = 0;

app.post('/orders', async (req, res) => {
  counter++;
  const order = {
    id: `ORD-${String(counter).padStart(4, '0')}`,
    kisanNaam: req.body.kisanNaam || 'Ramesh',
    amount: req.body.amount || 1000,
    status: 'CREATED'
  };

  // Queue mein messages daalo — WAIT NAHI KAREGA
  const startTime = Date.now();

  // Notification queue mein SMS job add karo
  await notificationQueue.add('send-sms', {
    phone: req.body.phone || '9876543210',
    message: `Namaste ${order.kisanNaam}! Order ${order.id} confirm hua. Amount: Rs ${order.amount}`,
    orderId: order.id
  });

  // Payment queue mein payment job add karo
  await paymentQueue.add('process-payment', {
    orderId: order.id,
    amount: order.amount,
    method: 'UPI'
  });

  const timeTaken = Date.now() - startTime;
  console.log(`[Producer] Order ${order.id} — dono queues mein daala (${timeTaken}ms)`);

  // Turant response — consumer baad mein process karega
  res.status(201).json({
    success: true,
    data: order,
    message: 'Order created! SMS aur Payment background mein process ho raha hai.'
  });
});

app.listen(3002, () => {
  console.log('Producer (Order Service) chalu hai port 3002 pe');
});
```

### Consumer — Notification Worker

```javascript
// queue-demo/notification-worker.js
const { Worker } = require('bullmq');

const connection = { host: 'localhost', port: 6379 };

// Notification queue ka worker
const worker = new Worker('notifications', async (job) => {
  console.log(`[SMS Worker] Job mila: ${job.name} — ${job.id}`);
  console.log(`[SMS Worker] Phone: ${job.data.phone}`);
  console.log(`[SMS Worker] Message: ${job.data.message}`);

  // Real mein yahan Twilio API call hogi
  // Simulate karte hain 2 second ki delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`[SMS Worker] SMS bhej diya ${job.data.phone} pe!`);
  return { status: 'sent', phone: job.data.phone };
}, { connection });

worker.on('completed', (job) => {
  console.log(`[SMS Worker] Job ${job.id} complete ho gaya!`);
});

worker.on('failed', (job, error) => {
  console.error(`[SMS Worker] Job ${job.id} fail hua:`, error.message);
});

console.log('Notification Worker chalu hai... messages ka wait kar raha hai');
```

### Consumer — Payment Worker

```javascript
// queue-demo/payment-worker.js
const { Worker } = require('bullmq');

const connection = { host: 'localhost', port: 6379 };

// Payment queue ka worker
const worker = new Worker('payments', async (job) => {
  console.log(`[Payment Worker] Job mila: ${job.name} — Order ${job.data.orderId}`);
  console.log(`[Payment Worker] Amount: Rs ${job.data.amount}, Method: ${job.data.method}`);

  // Payment processing simulate (3 second)
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log(`[Payment Worker] Payment process ho gaya — Rs ${job.data.amount}`);
  return { status: 'completed', transactionId: `TXN-${Date.now()}` };
}, { connection });

worker.on('completed', (job, result) => {
  console.log(`[Payment Worker] Job ${job.id} complete — TXN: ${result.transactionId}`);
});

worker.on('failed', (job, error) => {
  console.error(`[Payment Worker] Job ${job.id} fail hua:`, error.message);
});

console.log('Payment Worker chalu hai... payments ka wait kar raha hai');
```

---

## Task 3: Async System Test Karo

### Teen terminals kholo:

> **Terminal Command:**
> ```bash
> # Terminal 1 — Producer
> node producer.js
>
> # Terminal 2 — Notification Worker
> node notification-worker.js
>
> # Terminal 3 — Payment Worker
> node payment-worker.js
> ```

### Test karo:

```bash
# Order banao
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"kisanNaam": "Ramesh Patil", "amount": 5000, "phone": "9876543210"}'
```

> **Expected Output:**
> ```
> # Terminal 1 (Producer) — turant response
> [Producer] Order ORD-0001 — dono queues mein daala (5ms)
> 
> # Terminal 2 (SMS Worker) — 2 sec baad
> [SMS Worker] Job mila: send-sms — 1
> [SMS Worker] SMS bhej diya 9876543210 pe!
>
> # Terminal 3 (Payment Worker) — 3 sec baad  
> [Payment Worker] Payment process ho gaya — Rs 5000
> ```

> **Yaad Rakho:** Dekho fark — Producer ne 5ms mein response de diya! SMS aur Payment background mein process hua. User ko wait nahi karna pada.

---

## Mini Challenge

1. Ek **Email Worker** banao jo order confirmation email bheje (simulate karo)
2. Payment fail hone pe **retry mechanism** add karo (BullMQ mein built-in hai — `attempts: 3`)
3. Ek **dashboard endpoint** banao jo queue status dikhaye

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| REST Call | `axios.post()` se direct service call — simple lekin blocking |
| BullMQ | Redis-based queue — fast aur reliable |
| Producer | Queue mein job add karne wala |
| Worker/Consumer | Queue se job utha ke process karne wala |
| Fire & Forget | Producer message daal ke aage badh jaata hai |
| Background Job | Heavy kaam queue mein daalo, background mein ho jaayega |

---

## Aaj Kya Seekha?

- REST se synchronous inter-service communication implement ki
- BullMQ se asynchronous queue-based communication banaayi
- Producer-Consumer pattern practically samjha
- Sync vs Async ka time difference dekha (350ms vs 5ms response)
- Multiple workers ek saath kaise kaam karte hain
