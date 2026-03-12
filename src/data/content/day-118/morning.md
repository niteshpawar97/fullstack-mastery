# Day 118 Morning: Phase 4 Final Project — Microservices System Design

> **Aaj ka plan:** PROJECT DAY! Aaj hum ek complete microservices system design aur build karenge — User Service, Product Service, Order Service, aur Notification Service. TypeScript mein, RabbitMQ se inter-service communication, aur Express API Gateway. Full production-style architecture!

---

## Project Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser / App)                   │
└───────────────────────────┬────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  API GATEWAY   │ Port: 3000
                    │  (Express)     │ Authentication, Routing,
                    │                │ Rate Limiting
                    └──┬─────┬────┬─┘
                       │     │    │
          ┌────────────┘     │    └─────────────┐
          │                  │                   │
   ┌──────▼──────┐  ┌──────▼───────┐  ┌───────▼──────┐
   │ USER        │  │ PRODUCT      │  │ ORDER        │
   │ SERVICE     │  │ SERVICE      │  │ SERVICE      │
   │ Port: 3001  │  │ Port: 3002   │  │ Port: 3003   │
   │             │  │              │  │              │
   │ - Register  │  │ - CRUD       │  │ - Create     │
   │ - Login     │  │ - Search     │  │ - Status     │
   │ - Profile   │  │ - Categories │  │ - History    │
   └──────┬──────┘  └──────┬───────┘  └──────┬───────┘
          │                │                   │
          └────────────────┼───────────────────┘
                           │
                   ┌───────▼────────┐
                   │   RabbitMQ     │ Port: 5672
                   │   Message Bus  │ Events Flow
                   └───────┬────────┘
                           │
                   ┌───────▼────────┐
                   │ NOTIFICATION   │
                   │ SERVICE        │ Port: 3004
                   │ - Email        │
                   │ - SMS          │
                   │ - Push         │
                   └────────────────┘
```

> **Socho Aise:** Ye aise samjho — ek bada mall hai. Har dukaan (service) independent hai, apna staff, apna billing. Mall ka security guard (API Gateway) sab manage karta hai. Dukaans ke beech ek intercom system hai (RabbitMQ) — order aaya toh delivery department ko intercom pe bata dete hain!

---

## Step 1: Project Structure Setup

```
> **Terminal Command:**
```bash
# Root project folder banao
mkdir microservices-project && cd microservices-project

# Har service ka folder
mkdir -p gateway user-service product-service order-service notification-service shared

# Shared types — sab services use karenge
cd shared && npm init -y && npx tsc --init
cd ../gateway && npm init -y && npx tsc --init
cd ../user-service && npm init -y && npx tsc --init
cd ../product-service && npm init -y && npx tsc --init
cd ../order-service && npm init -y && npx tsc --init
cd ../notification-service && npm init -y && npx tsc --init
```

```
microservices-project/
├── shared/              # Shared types aur utilities
│   ├── src/
│   │   ├── types.ts     # Common interfaces
│   │   ├── events.ts    # Event definitions
│   │   └── rabbitmq.ts  # RabbitMQ helper
│   └── package.json
├── gateway/             # API Gateway
├── user-service/        # User management
├── product-service/     # Product CRUD
├── order-service/       # Order processing
├── notification-service/ # Notifications
└── docker-compose.yml   # Sab ek saath run karo
```

---

## Step 2: Shared Types — Common Language

```typescript
// shared/src/types.ts — Sab services ye types share karenge
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'vendor';
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;          // Paisa mein store karo (₹100 = 10000)
  category: string;
  stock: number;
  vendorId: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number; // Purchase time ka price freeze karo
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

// API Response standard format — sab services ye follow karein
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { page?: number; total?: number };
}
```

---

## Step 3: Event Definitions — Inter-Service Communication

```typescript
// shared/src/events.ts — Kaunse events flow karenge system mein
export enum EventType {
  // User events
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',

  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',

  // Product events
  PRODUCT_CREATED = 'product.created',
  STOCK_UPDATED = 'stock.updated',
  STOCK_LOW = 'stock.low',            // Alert jab stock kam ho
}

// Har event ka payload type-safe ho — galti se wrong data na jaaye
export interface EventPayloads {
  [EventType.USER_REGISTERED]: {
    userId: string;
    name: string;
    email: string;
  };
  [EventType.ORDER_CREATED]: {
    orderId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    totalAmount: number;
  };
  [EventType.ORDER_CONFIRMED]: {
    orderId: string;
    userId: string;
    userEmail: string;
  };
  [EventType.STOCK_UPDATED]: {
    productId: string;
    previousStock: number;
    newStock: number;
  };
  [EventType.STOCK_LOW]: {
    productId: string;
    productName: string;
    currentStock: number;
    vendorId: string;
  };
}

// Generic event wrapper — metadata ke saath
export interface DomainEvent<T extends EventType = EventType> {
  eventId: string;
  eventType: T;
  payload: EventPayloads[T];
  timestamp: string;
  source: string;        // Kaunse service ne bheja
  correlationId: string; // Request tracing ke liye
}
```

> **Yaad Rakho:** Events hamesha past tense mein naam do — `ORDER_CREATED` (not `CREATE_ORDER`). Event ka matlab hai "ye ho chuka hai" — not a command!

---

## Step 4: RabbitMQ Helper — Message Bus

```typescript
// shared/src/rabbitmq.ts — Reusable RabbitMQ connection
import amqp, { Connection, Channel } from 'amqplib';
import { DomainEvent, EventType } from './events';
import { v4 as uuid } from 'uuid';

export class MessageBus {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private exchange = 'microservices_events'; // Sabhi events yahan jaayenge

  // Connect karo RabbitMQ se
  async connect(url: string = 'amqp://localhost:5672') {
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    // Topic exchange banao — routing pattern ke saath
    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true, // RabbitMQ restart pe bhi exchange rahe
    });

    console.log('RabbitMQ connected!');
  }

  // Event publish karo — koi bhi service sun sakta hai
  async publish<T extends EventType>(
    eventType: T,
    payload: any,
    source: string,
    correlationId?: string
  ) {
    if (!this.channel) throw new Error('RabbitMQ not connected!');

    const event: DomainEvent<T> = {
      eventId: uuid(),
      eventType,
      payload,
      timestamp: new Date().toISOString(),
      source,
      correlationId: correlationId || uuid(),
    };

    // Publish to exchange — routing key = event type
    this.channel.publish(
      this.exchange,
      eventType,                              // Routing key
      Buffer.from(JSON.stringify(event)),
      { persistent: true }                    // Message disk pe save ho
    );

    console.log(`Event published: ${eventType}`, event.eventId);
  }

  // Event subscribe karo — specific events suno
  async subscribe(
    queueName: string,
    routingPatterns: string[],    // "order.*" ya "user.registered"
    handler: (event: DomainEvent) => Promise<void>
  ) {
    if (!this.channel) throw new Error('RabbitMQ not connected!');

    // Queue banao — service-specific
    const queue = await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: 'dead_letters', // Failed messages yahan jaayenge
    });

    // Queue ko exchange se bind karo — routing patterns ke saath
    for (const pattern of routingPatterns) {
      await this.channel.bindQueue(queue.queue, this.exchange, pattern);
    }

    // Messages consume karo
    this.channel.consume(queue.queue, async (msg) => {
      if (!msg) return;

      try {
        const event: DomainEvent = JSON.parse(msg.content.toString());
        console.log(`Event received: ${event.eventType}`, event.eventId);

        await handler(event); // Process karo

        this.channel!.ack(msg); // Success — acknowledge karo
      } catch (error) {
        console.error('Event processing failed:', error);
        this.channel!.nack(msg, false, false); // Fail — dead letter mein jaayega
      }
    });

    console.log(`Subscribed: ${queueName} → ${routingPatterns.join(', ')}`);
  }

  // Gracefully disconnect karo
  async disconnect() {
    await this.channel?.close();
    await this.connection?.close();
    console.log('RabbitMQ disconnected');
  }
}

// Singleton export — ek hi instance sab jagah
export const messageBus = new MessageBus();
```

> **Tip:** `persistent: true` se messages disk pe save hoti hain. RabbitMQ crash hoke restart ho toh bhi messages safe rehti hain. Production mein HAMESHA persistent use karo!

---

## Step 5: API Gateway — Entry Point

```typescript
// gateway/src/index.ts — Sab requests yahan se guzarenge
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

// Rate limiting — gateway level pe
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// JWT verify middleware
function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Routes → Services proxy karo
// /api/users/* → User Service
app.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:3001',
  pathRewrite: { '^/api/users': '/users' },
  changeOrigin: true,
}));

// /api/products/* → Product Service
app.use('/api/products', createProxyMiddleware({
  target: 'http://localhost:3002',
  pathRewrite: { '^/api/products': '/products' },
  changeOrigin: true,
}));

// /api/orders/* → Order Service (auth required)
app.use('/api/orders', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3003',
  pathRewrite: { '^/api/orders': '/orders' },
  changeOrigin: true,
  onProxyReq: (proxyReq, req: any) => {
    // User info header mein forward karo
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  },
}));

// Health check — sab services ka status
app.get('/health', async (req, res) => {
  const services = ['3001', '3002', '3003', '3004'];
  const checks = await Promise.allSettled(
    services.map(port =>
      fetch(`http://localhost:${port}/health`).then(r => r.json())
    )
  );
  res.json({
    gateway: 'healthy',
    services: checks.map((c, i) => ({
      port: services[i],
      status: c.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    })),
  });
});

app.listen(3000, () => console.log('API Gateway running on :3000'));
```

---

## Quick Revision Table

| Component | Role | Port | Key Feature |
|-----------|------|------|-------------|
| API Gateway | Entry point, auth, routing | 3000 | Proxy + Rate limit |
| User Service | Registration, login, profiles | 3001 | JWT tokens issue |
| Product Service | CRUD products, search | 3002 | Stock management |
| Order Service | Order lifecycle | 3003 | Event publishing |
| Notification Service | Email, SMS, Push | 3004 | Event consuming |
| RabbitMQ | Message bus | 5672 | Topic exchange |
| Shared Types | Common interfaces | N/A | Type safety across services |

---

## Aaj Kya Seekha?

1. **Microservices architecture** mein har service independent hai — apna DB, apna deployment
2. **API Gateway** single entry point hai — authentication, routing, rate limiting sab yahan
3. **RabbitMQ topic exchange** se services events publish/subscribe karte hain — loosely coupled
4. **Shared types** se TypeScript type safety maintain hoti hai across services
5. **Domain Events** hamesha past tense mein naam do — `ORDER_CREATED` not `CREATE_ORDER`

> **Practice Time!** Ye project setup karo. Pehle `docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management` se RabbitMQ chalao. Phir shared types banao, RabbitMQ helper banao, aur Gateway setup karo. Evening session mein individual services build karenge!
