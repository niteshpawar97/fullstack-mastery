# Day 111 Evening: Queue Project — Order Processing System

> **Aaj ka plan:** Ab hum ek practical Queue-based Order Processing System banayenge. Farmer orders aayenge, queue mein jayenge, aur multiple workers independently process karenge. Real microservices pattern!

---

## Project Overview

### Kya Banayenge?

```
Farmer App → API Gateway → Order Queue → [Payment Worker]
                                       → [Notification Worker]
                                       → [Inventory Worker]
```

Ek farmer order place karega → API order ko queue mein daalega → Teen alag workers apna-apna kaam karenge independently.

> **Socho Aise:** Jaise kisi restaurant mein order slip counter pe aati hai, aur alag-alag chefs apna kaam karte hain — ek starter banata hai, ek main course, ek dessert. Sab parallel mein!

---

## Step 1: Project Setup

```bash
mkdir queue-order-system && cd queue-order-system
npm init -y
npm install express bullmq ioredis uuid
npm install -D typescript @types/express @types/node ts-node nodemon
npx tsc --init
```

> **Terminal Command:** Make sure Redis chal raha hai: `docker run -d --name redis -p 6379:6379 redis:alpine`

### Folder Structure

```
queue-order-system/
├── src/
│   ├── api/
│   │   └── orderRoutes.ts      # API endpoints
│   ├── queues/
│   │   └── orderQueue.ts       # Queue configuration
│   ├── workers/
│   │   ├── paymentWorker.ts    # Payment processing
│   │   ├── notificationWorker.ts # Email/SMS bhejega
│   │   └── inventoryWorker.ts  # Stock update karega
│   ├── types/
│   │   └── order.ts            # TypeScript types
│   └── server.ts               # Main server
├── docker-compose.yml
├── k8s/                        # Kubernetes configs
│   ├── deployment.yml
│   └── service.yml
└── package.json
```

---

## Step 2: Types Define Karo

```typescript
// src/types/order.ts
// Order ka structure — TypeScript se type-safe

export interface Order {
  id: string;
  farmerId: string;
  farmerName: string;
  product: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
}

export enum OrderStatus {
  PENDING = 'PENDING',       // Abhi queue mein hai
  PAYMENT_DONE = 'PAYMENT_DONE',  // Payment ho gaya
  NOTIFIED = 'NOTIFIED',     // Farmer ko notify kar diya
  INVENTORY_UPDATED = 'INVENTORY_UPDATED', // Stock update ho gaya
  COMPLETED = 'COMPLETED'    // Sab kuch complete
}
```

---

## Step 3: Queue Setup

```typescript
// src/queues/orderQueue.ts
import { Queue } from 'bullmq';

// Redis connection — sab queues ek hi Redis use karengi
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Teen alag queues — har kaam ke liye ek
export const paymentQueue = new Queue('payment-processing', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const inventoryQueue = new Queue('inventory-updates', { connection });

// Order aane pe teeno queues mein daalo
export async function enqueueOrder(order: any) {
  // Payment queue — sabse pehle payment hona chahiye
  await paymentQueue.add('process-payment', {
    orderId: order.id,
    amount: order.totalAmount,
    farmerId: order.farmerId,
  }, {
    attempts: 3,        // 3 baar try karega fail hone pe
    backoff: {
      type: 'exponential',
      delay: 2000,       // 2s, 4s, 8s — retry delay
    },
    priority: 1,         // High priority
  });

  // Notification queue — farmer ko batao
  await notificationQueue.add('send-confirmation', {
    orderId: order.id,
    farmerName: order.farmerName,
    product: order.product,
  }, {
    delay: 5000,  // 5 second baad bhejo — pehle payment confirm ho jaaye
    attempts: 2,
  });

  // Inventory queue — stock update karo
  await inventoryQueue.add('update-stock', {
    orderId: order.id,
    product: order.product,
    quantity: order.quantity,
  }, {
    attempts: 3,
  });

  console.log(`Order ${order.id} — teeno queues mein daal diya!`);
}
```

> **Yaad Rakho:** `attempts` aur `backoff` bahut important hain production mein. Agar payment gateway temporarily down hai, toh queue automatically retry karega — tumhe manually kuch nahi karna!

---

## Step 4: Workers Banao

```typescript
// src/workers/paymentWorker.ts
import { Worker } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const paymentWorker = new Worker('payment-processing', async (job) => {
  console.log(`💰 Payment process ho raha hai — Order: ${job.data.orderId}`);
  
  // Simulate payment processing — real mein Razorpay/Stripe call hogi
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Random failure simulate karo — retry test ke liye
  if (Math.random() < 0.1) {
    throw new Error('Payment gateway temporarily unavailable');
  }
  
  console.log(`Payment successful — Order: ${job.data.orderId}, Amount: ${job.data.amount}`);
  return { status: 'paid', transactionId: `TXN-${Date.now()}` };
  
}, { connection, concurrency: 5 }); // 5 payments ek saath process

// Events — monitoring ke liye
paymentWorker.on('completed', (job) => {
  console.log(`Payment complete: ${job.id}`);
});

paymentWorker.on('failed', (job, err) => {
  console.error(`Payment FAILED: ${job?.id} — ${err.message}`);
});

export default paymentWorker;
```

```typescript
// src/workers/notificationWorker.ts
import { Worker } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const notificationWorker = new Worker('notifications', async (job) => {
  console.log(`Notification bhej raha hai — ${job.data.farmerName}`);
  
  // Simulate SMS/Email — real mein Twilio/SendGrid call hogi
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`SMS bhej diya: "Dear ${job.data.farmerName}, Order ${job.data.orderId} confirmed!"`);
  return { sent: true, channel: 'sms' };
  
}, { connection, concurrency: 10 }); // Notifications fast bhejo

export default notificationWorker;
```

```typescript
// src/workers/inventoryWorker.ts
import { Worker } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const inventoryWorker = new Worker('inventory-updates', async (job) => {
  console.log(`Inventory update ho raha hai — ${job.data.product}`);
  
  // Simulate database update
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`Stock updated: ${job.data.product} — ${job.data.quantity} units deducted`);
  return { updated: true, remainingStock: Math.floor(Math.random() * 1000) };
  
}, { connection, concurrency: 3 });

export default inventoryWorker;
```

---

## Step 5: API + Server

```typescript
// src/api/orderRoutes.ts
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { enqueueOrder } from '../queues/orderQueue';

const router = Router();

// POST /orders — naya order create karo
router.post('/orders', async (req, res) => {
  const { farmerId, farmerName, product, quantity, pricePerUnit } = req.body;
  
  const order = {
    id: uuid(),
    farmerId,
    farmerName,
    product,
    quantity,
    pricePerUnit,
    totalAmount: quantity * pricePerUnit,
    status: 'PENDING',
    createdAt: new Date(),
  };
  
  // Queue mein daalo — API turant response de dega
  await enqueueOrder(order);
  
  res.status(202).json({
    message: 'Order accepted! Processing shuru ho gaya.',
    orderId: order.id,
    estimatedTime: '5-10 seconds',
  });
});

export default router;
```

> **Yaad Rakho:** HTTP 202 (Accepted) status use karo jab request accept ho gayi hai lekin processing abhi pending hai. 200 (OK) tab do jab sab kuch complete ho chuka ho.

---

## Step 6: Kubernetes Deployment (Bonus)

```yaml
# k8s/deployment.yml
# Har worker ka alag deployment — independently scale hoga
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-worker
spec:
  replicas: 2  # 2 payment workers
  selector:
    matchLabels:
      app: payment-worker
  template:
    metadata:
      labels:
        app: payment-worker
    spec:
      containers:
        - name: payment-worker
          image: queue-system:latest
          command: ["node", "dist/workers/paymentWorker.js"]
          env:
            - name: REDIS_HOST
              value: "redis-service"
```

> **Tip:** Kubernetes mein har worker type ka alag deployment hona chahiye. Payment zyada load pe hai? Sirf payment workers scale karo, baaki ko chhodo. Ye hai microservices ka asli fayda!

---

## Quick Revision Table

| Component | Role | Scale Independently? |
|-----------|------|---------------------|
| API Server | Orders receive karta hai | Haan — zyada traffic pe scale |
| Payment Worker | Payment process karta hai | Haan — slow gateway pe zyada workers |
| Notification Worker | SMS/Email bhejta hai | Haan — bulk notifications pe scale |
| Inventory Worker | Stock update karta hai | Haan — database load ke hisaab se |
| Redis | Queue storage | Haan — Redis Cluster use karo |

---

## Aaj Kya Seekha?

1. **Queue-based architecture** mein har service independently scale hoti hai
2. **BullMQ** mein `attempts` + `backoff` se automatic retry hota hai — resilient system banta hai
3. **HTTP 202** response pattern — accept karo aur background mein process karo
4. **Kubernetes** mein har worker ka alag deployment hona chahiye
5. **Concurrency** setting se control karo ki ek worker kitne jobs ek saath process kare

> **Practice Time!** Is project mein ek aur worker add karo — "Analytics Worker" jo har order ka data ek analytics database mein save kare. Queue naam rakho "order-analytics".
