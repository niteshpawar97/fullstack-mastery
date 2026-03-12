# Day 118 Evening: Microservices Project — Individual Services Build

> **Aaj ka plan:** Ab hum individual services build karenge — User Service (register/login), Product Service (CRUD + stock), Order Service (order lifecycle), aur Notification Service (event-based notifications). Sab TypeScript mein, RabbitMQ se connected!

---

## User Service — Registration & Authentication

```typescript
// user-service/src/index.ts
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { messageBus } from '../../shared/src/rabbitmq';
import { EventType } from '../../shared/src/events';

const app = express();
app.use(express.json());

// In-memory store (production mein MongoDB/PostgreSQL hoga)
const users = new Map<string, any>();

// Register — naya user banao
app.post('/users/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Email duplicate check karo
  const existing = [...users.values()].find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ success: false, error: { message: 'Email already exists' } });
  }

  // Password hash karo — plain text KABHI store mat karo
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: uuid(),
    name,
    email,
    password: hashedPassword,
    role: 'customer' as const,
    createdAt: new Date(),
  };

  users.set(user.id, user);

  // Event publish karo — Notification service sunega
  await messageBus.publish(
    EventType.USER_REGISTERED,
    { userId: user.id, name: user.name, email: user.email },
    'user-service'
  );

  // Response mein password mat bhejo!
  const { password: _, ...safeUser } = user;
  res.status(201).json({ success: true, data: safeUser });
});

// Login — JWT token do
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  const user = [...users.values()].find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
  }

  // Password verify karo
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
  }

  // JWT token banao — 24 hour expiry
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );

  res.json({ success: true, data: { token, user: { id: user.id, name: user.name } } });
});

// Profile fetch karo
app.get('/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });

  const { password: _, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

// Health check — Gateway isko call karega
app.get('/health', (_, res) => res.json({ service: 'user-service', status: 'healthy' }));

// Start
async function start() {
  await messageBus.connect();
  app.listen(3001, () => console.log('User Service running on :3001'));
}
start();
```

> **Yaad Rakho:** Password KABHI plain text store mat karo. Hamesha bcrypt ya argon2 se hash karo. Response mein bhi password field remove karo!

---

## Product Service — CRUD + Stock Management

```typescript
// product-service/src/index.ts
import express from 'express';
import { v4 as uuid } from 'uuid';
import { messageBus } from '../../shared/src/rabbitmq';
import { EventType } from '../../shared/src/events';

const app = express();
app.use(express.json());

// Products store
const products = new Map<string, any>();

// Create product — vendor ya admin
app.post('/products', (req, res) => {
  const { name, description, price, category, stock } = req.body;

  const product = {
    id: uuid(),
    name,
    description,
    price: Math.round(price * 100), // Paisa mein store karo — ₹99.50 = 9950
    category,
    stock: stock || 0,
    vendorId: req.headers['x-user-id'] as string || 'system',
    createdAt: new Date(),
  };

  products.set(product.id, product);
  res.status(201).json({ success: true, data: product });
});

// Sab products fetch karo — pagination ke saath
app.get('/products', (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const category = req.query.category as string;

  let allProducts = [...products.values()];

  // Category filter
  if (category) {
    allProducts = allProducts.filter(p => p.category === category);
  }

  // Pagination apply karo
  const start = (page - 1) * limit;
  const paginatedProducts = allProducts.slice(start, start + limit);

  res.json({
    success: true,
    data: paginatedProducts,
    meta: { page, limit, total: allProducts.length },
  });
});

// Single product fetch karo
app.get('/products/:id', (req, res) => {
  const product = products.get(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: { message: 'Product not found' } });
  res.json({ success: true, data: product });
});

// Stock update karo — Order Service se internal call aayegi
app.patch('/products/:id/stock', async (req, res) => {
  const product = products.get(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: { message: 'Product not found' } });

  const { quantity, operation } = req.body; // operation: 'decrease' | 'increase'
  const previousStock = product.stock;

  if (operation === 'decrease') {
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, error: { message: 'Insufficient stock' } });
    }
    product.stock -= quantity;
  } else {
    product.stock += quantity;
  }

  // Stock low alert — 10 se kam hai toh event bhejo
  if (product.stock < 10) {
    await messageBus.publish(
      EventType.STOCK_LOW,
      {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        vendorId: product.vendorId,
      },
      'product-service'
    );
  }

  // Stock update event
  await messageBus.publish(
    EventType.STOCK_UPDATED,
    { productId: product.id, previousStock, newStock: product.stock },
    'product-service'
  );

  res.json({ success: true, data: product });
});

app.get('/health', (_, res) => res.json({ service: 'product-service', status: 'healthy' }));

async function start() {
  await messageBus.connect();
  app.listen(3002, () => console.log('Product Service running on :3002'));
}
start();
```

> **Tip:** Price hamesha integer (paisa/cents) mein store karo. Floating point arithmetic se ₹99.10 + ₹0.20 = ₹99.30000000000001 aa sakta hai. Integer mein: 9910 + 20 = 9930 — accurate!

---

## Order Service — Order Lifecycle

```typescript
// order-service/src/index.ts
import express from 'express';
import { v4 as uuid } from 'uuid';
import { messageBus } from '../../shared/src/rabbitmq';
import { EventType } from '../../shared/src/events';
import axios from 'axios';

const app = express();
app.use(express.json());

const orders = new Map<string, any>();

// Order create karo — multi-step process
app.post('/orders', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { items, shippingAddress } = req.body;
  // items = [{ productId, quantity }]

  try {
    // Step 1: Products verify karo aur prices fetch karo
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Product Service se product details lo
      const { data } = await axios.get(
        `http://localhost:3002/products/${item.productId}`
      );
      const product = data.data;

      // Stock check karo
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: { message: `${product.name} mein sirf ${product.stock} available hai` },
        });
      }

      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        priceAtPurchase: product.price, // Price freeze karo
      });

      totalAmount += product.price * item.quantity;
    }

    // Step 2: Order create karo
    const order = {
      id: uuid(),
      userId,
      items: orderItems,
      totalAmount,
      status: 'PENDING',
      shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders.set(order.id, order);

    // Step 3: Stock decrease karo — har product ka
    for (const item of orderItems) {
      await axios.patch(
        `http://localhost:3002/products/${item.productId}/stock`,
        { quantity: item.quantity, operation: 'decrease' }
      );
    }

    // Step 4: Order created event publish karo
    await messageBus.publish(
      EventType.ORDER_CREATED,
      {
        orderId: order.id,
        userId,
        items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        totalAmount,
      },
      'order-service'
    );

    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    console.error('Order creation failed:', error.message);
    res.status(500).json({ success: false, error: { message: 'Order creation failed' } });
  }
});

// Order status update karo
app.patch('/orders/:id/status', async (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });

  const { status } = req.body;
  const validTransitions: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],     // Final state
    CANCELLED: [],     // Final state
  };

  // Status transition valid hai?
  if (!validTransitions[order.status]?.includes(status)) {
    return res.status(400).json({
      success: false,
      error: { message: `Cannot change from ${order.status} to ${status}` },
    });
  }

  order.status = status;
  order.updatedAt = new Date();

  // Status change event publish karo
  const eventMap: Record<string, EventType> = {
    CONFIRMED: EventType.ORDER_CONFIRMED,
    SHIPPED: EventType.ORDER_SHIPPED,
    DELIVERED: EventType.ORDER_DELIVERED,
    CANCELLED: EventType.ORDER_CANCELLED,
  };

  if (eventMap[status]) {
    await messageBus.publish(eventMap[status], {
      orderId: order.id, userId: order.userId,
    }, 'order-service');
  }

  res.json({ success: true, data: order });
});

// User ke orders fetch karo
app.get('/orders', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const userOrders = [...orders.values()].filter(o => o.userId === userId);
  res.json({ success: true, data: userOrders });
});

app.get('/health', (_, res) => res.json({ service: 'order-service', status: 'healthy' }));

async function start() {
  await messageBus.connect();
  app.listen(3003, () => console.log('Order Service running on :3003'));
}
start();
```

---

## Notification Service — Event Consumer

```typescript
// notification-service/src/index.ts — Sirf events sunta hai, koi REST API nahi
import express from 'express';
import { messageBus } from '../../shared/src/rabbitmq';
import { DomainEvent, EventType } from '../../shared/src/events';

const app = express();

// Event handlers — har event type ke liye alag handler
const eventHandlers: Record<string, (event: DomainEvent) => Promise<void>> = {
  [EventType.USER_REGISTERED]: async (event) => {
    const { name, email } = event.payload as any;
    console.log(`[EMAIL] Welcome email to ${email}: "Namaste ${name}! Welcome aboard!"`);
    // Production mein nodemailer/SendGrid se actual email bhejo
  },

  [EventType.ORDER_CREATED]: async (event) => {
    const { orderId, userId, totalAmount } = event.payload as any;
    console.log(`[EMAIL] Order confirmation to user ${userId}:`);
    console.log(`  Order #${orderId} — Total: ₹${totalAmount / 100}`);
    console.log(`[SMS] "Your order #${orderId.slice(0, 8)} has been placed!"`);
  },

  [EventType.ORDER_SHIPPED]: async (event) => {
    const { orderId, userId } = event.payload as any;
    console.log(`[PUSH] Order shipped notification to user ${userId}`);
    console.log(`  "Your order #${orderId.slice(0, 8)} has been shipped!"`);
  },

  [EventType.STOCK_LOW]: async (event) => {
    const { productName, currentStock, vendorId } = event.payload as any;
    console.log(`[ALERT] Low stock alert to vendor ${vendorId}:`);
    console.log(`  "${productName}" sirf ${currentStock} left!`);
  },
};

// Master event handler
async function handleEvent(event: DomainEvent) {
  const handler = eventHandlers[event.eventType];
  if (handler) {
    await handler(event);
  } else {
    console.log(`No handler for event: ${event.eventType}`);
  }
}

app.get('/health', (_, res) => res.json({ service: 'notification-service', status: 'healthy' }));

async function start() {
  await messageBus.connect();

  // Sab relevant events subscribe karo
  await messageBus.subscribe(
    'notification-queue',          // Queue name
    ['user.*', 'order.*', 'stock.low'], // Ye patterns sun raha hai
    handleEvent
  );

  app.listen(3004, () => console.log('Notification Service running on :3004'));
}
start();
```

> **Socho Aise:** Notification Service ek post office ki tarah hai — usko bas daak (events) milti rehti hai aur wo sahi jagah deliver karta hai. Usse sender se koi matlab nahi — bas message aaya, process karo, bhejo!

---

## Quick Revision Table

| Service | Port | Responsibility | Events |
|---------|------|---------------|--------|
| User | 3001 | Auth, profiles | Publishes USER_REGISTERED |
| Product | 3002 | CRUD, stock | Publishes STOCK_LOW, STOCK_UPDATED |
| Order | 3003 | Order lifecycle | Publishes ORDER_CREATED, ORDER_SHIPPED |
| Notification | 3004 | Email, SMS, Push | Subscribes to ALL events |
| Gateway | 3000 | Auth, routing, rate limit | Routes to services |
| RabbitMQ | 5672 | Message bus | Topic exchange |

---

## Aaj Kya Seekha?

1. **Har service independent hai** — apna port, apna data store, apna logic
2. **RabbitMQ events** se services loosely coupled hain — ek ko change karo doosre pe asar nahi
3. **Order Service** synchronous call karke stock check karta hai, phir asynchronous event publish karta hai
4. **Notification Service** sirf events consume karta hai — koi REST API expose nahi karta (sirf health check)
5. **Status transitions** validated hain — PENDING se seedha DELIVERED nahi ja sakta

> **Practice Time!** Sab 5 services start karo alag-alag terminals mein. Pehle user register karo, phir product banao, phir order place karo. Notification service ke console mein dekho — events aa rahe hain! RabbitMQ management UI bhi check karo: http://localhost:15672 (guest/guest)
