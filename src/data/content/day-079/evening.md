# Day 79 — Design Patterns: Singleton, Factory, Observer (Evening Session — Practice)

> **Aaj ka plan:**
> Ab hands-on practice — Singleton DB connection implement karenge, Factory se different user types banayenge, Observer se notification system banayenge, aur existing code ko patterns se refactor karenge.

---

## Practice 1: Singleton — Database Connection Manager

```javascript
// db/DatabaseManager.js

const mongoose = require('mongoose');
const logger = require('../config/logger');

class DatabaseManager {
  constructor() {
    // Singleton check — agar pehle se instance hai toh wahi return karo
    if (DatabaseManager.instance) {
      logger.debug('Returning existing DatabaseManager instance');
      return DatabaseManager.instance;
    }

    this.connection = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;

    DatabaseManager.instance = this;
    logger.info('New DatabaseManager instance created');
  }

  async connect(uri) {
    if (this.isConnected) {
      logger.info('Database already connected — reusing connection');
      return this.connection;
    }

    try {
      logger.info('Connecting to database...');

      this.connection = await mongoose.connect(uri, {
        maxPoolSize: 10,        // max 10 concurrent connections
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      this.retryCount = 0;
      logger.info('Database connected successfully');

      // Disconnect event pe auto-reconnect
      mongoose.connection.on('disconnected', () => {
        logger.warn('Database disconnected!');
        this.isConnected = false;
        this._autoReconnect(uri);
      });

      return this.connection;
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      this.retryCount++;

      if (this.retryCount < this.maxRetries) {
        logger.info(`Retrying connection... (${this.retryCount}/${this.maxRetries})`);
        // 3 second baad retry karo
        await new Promise(resolve => setTimeout(resolve, 3000));
        return this.connect(uri);
      }

      throw new Error(`Database connection failed after ${this.maxRetries} retries`);
    }
  }

  async _autoReconnect(uri) {
    if (this.retryCount < this.maxRetries) {
      logger.info('Auto-reconnecting to database...');
      await this.connect(uri);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Database disconnected');
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

// Singleton export — hamesha same instance milegi
module.exports = new DatabaseManager();
```

### Test karo ki Singleton kaam kar raha hai:

```javascript
// test-singleton.js
const db1 = require('./db/DatabaseManager');
const db2 = require('./db/DatabaseManager');

console.log(db1 === db2);  // true — dono same instance hain!

// Kisi bhi file mein import karo — same connection milegi
// routes/productRoutes.js mein: const db = require('../db/DatabaseManager');
// controllers/authController.js mein: const db = require('../db/DatabaseManager');
// Sab jagah SAME instance!
```

---

## Practice 2: Factory — User Types + Payment Processors

### User Factory:

```javascript
// factories/UserFactory.js

class BaseUser {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.createdAt = new Date();
    this.isActive = true;
  }

  toJSON() {
    return {
      name: this.name,
      email: this.email,
      role: this.role,
      permissions: this.getPermissions(),
      createdAt: this.createdAt,
    };
  }
}

class AdminUser extends BaseUser {
  constructor(data) {
    super({ ...data, role: 'admin' });
    this.department = data.department || 'general';
  }

  getPermissions() {
    return ['read', 'write', 'delete', 'manage_users', 'view_reports', 'system_settings'];
  }

  canManageUsers() { return true; }
}

class FarmerUser extends BaseUser {
  constructor(data) {
    super({ ...data, role: 'farmer' });
    this.farmSize = data.farmSize || 'small';
    this.crops = data.crops || [];
    this.location = data.location || '';
  }

  getPermissions() {
    return ['read', 'write', 'manage_products', 'view_orders', 'manage_farm'];
  }

  addCrop(crop) {
    this.crops.push(crop);
  }
}

class BuyerUser extends BaseUser {
  constructor(data) {
    super({ ...data, role: 'buyer' });
    this.cart = [];
    this.addresses = data.addresses || [];
  }

  getPermissions() {
    return ['read', 'place_order', 'view_orders', 'manage_cart'];
  }

  addToCart(item) {
    this.cart.push(item);
  }
}

// === FACTORY ===
class UserFactory {
  static create(type, data) {
    const factories = {
      admin: AdminUser,
      farmer: FarmerUser,
      buyer: BuyerUser,
    };

    const UserClass = factories[type.toLowerCase()];
    if (!UserClass) {
      throw new Error(`Unknown user type: "${type}". Valid types: ${Object.keys(factories).join(', ')}`);
    }

    return new UserClass(data);
  }

  // Bulk users banao
  static createBulk(usersData) {
    return usersData.map(({ type, ...data }) => UserFactory.create(type, data));
  }
}

module.exports = UserFactory;
```

```javascript
// Usage
const UserFactory = require('./factories/UserFactory');

// Individual users
const admin = UserFactory.create('admin', {
  name: 'Ravi',
  email: 'ravi@admin.com',
  department: 'operations',
});

const farmer = UserFactory.create('farmer', {
  name: 'Kisan Kumar',
  email: 'kisan@farm.com',
  farmSize: 'medium',
  crops: ['Gehun', 'Chawal'],
  location: 'Punjab',
});

console.log(admin.getPermissions());
// ['read','write','delete','manage_users','view_reports','system_settings']

console.log(farmer.crops);  // ['Gehun', 'Chawal']

// Bulk create
const users = UserFactory.createBulk([
  { type: 'farmer', name: 'Ram', email: 'ram@farm.com' },
  { type: 'buyer', name: 'Sita', email: 'sita@buy.com' },
  { type: 'admin', name: 'Boss', email: 'boss@admin.com' },
]);
```

### Payment Factory:

```javascript
// factories/PaymentFactory.js

class UPIPayment {
  process(amount, details) {
    console.log(`UPI Payment: Rs.${amount} via ${details.upiId}`);
    return { success: true, method: 'UPI', transactionId: `UPI-${Date.now()}` };
  }
}

class CardPayment {
  process(amount, details) {
    console.log(`Card Payment: Rs.${amount} via ****${details.cardNumber.slice(-4)}`);
    return { success: true, method: 'Card', transactionId: `CARD-${Date.now()}` };
  }
}

class NetBankingPayment {
  process(amount, details) {
    console.log(`NetBanking: Rs.${amount} via ${details.bankName}`);
    return { success: true, method: 'NetBanking', transactionId: `NB-${Date.now()}` };
  }
}

class CODPayment {
  process(amount, details) {
    console.log(`Cash on Delivery: Rs.${amount}`);
    return { success: true, method: 'COD', transactionId: `COD-${Date.now()}` };
  }
}

function createPaymentProcessor(method) {
  const processors = {
    upi: UPIPayment,
    card: CardPayment,
    netbanking: NetBankingPayment,
    cod: CODPayment,
  };

  const Processor = processors[method.toLowerCase()];
  if (!Processor) throw new Error(`Unsupported payment method: ${method}`);
  return new Processor();
}

module.exports = { createPaymentProcessor };
```

---

## Practice 3: Observer — Notification System

```javascript
// events/eventBus.js — Central Event Bus (Singleton + Observer)
const EventEmitter = require('events');

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    if (AppEventBus.instance) return AppEventBus.instance;
    this.setMaxListeners(20);  // max 20 listeners per event
    AppEventBus.instance = this;
  }
}

module.exports = new AppEventBus();
```

```javascript
// events/listeners/orderListeners.js — Order event handlers
const eventBus = require('../eventBus');
const logger = require('../../config/logger');

// Listener 1: Confirmation email bhejo
eventBus.on('order:placed', async (order) => {
  logger.info('Sending order confirmation email', { orderId: order.id });
  // await emailService.send(order.customer.email, 'Order Confirmed!', template);
  console.log(`Email sent to ${order.customer.email} for order #${order.id}`);
});

// Listener 2: Inventory update karo
eventBus.on('order:placed', async (order) => {
  logger.info('Updating inventory', { orderId: order.id });
  for (const item of order.items) {
    // await Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.qty } });
    console.log(`Inventory updated: ${item.name} -${item.qty}`);
  }
});

// Listener 3: Analytics track karo
eventBus.on('order:placed', (order) => {
  logger.info('Tracking order analytics', {
    orderId: order.id,
    amount: order.totalAmount,
  });
});

// Listener 4: Admin ko alert bhejo (agar high value order hai)
eventBus.on('order:placed', (order) => {
  if (order.totalAmount > 50000) {
    logger.warn('High value order alert!', {
      orderId: order.id,
      amount: order.totalAmount,
    });
    // notifyAdmin('High value order received!');
  }
});

// Order cancel hone pe
eventBus.on('order:cancelled', async (order) => {
  logger.info('Order cancelled — restoring inventory', { orderId: order.id });
  // Inventory wapas karo
  // Refund process shuru karo
  // Customer ko email bhejo
});

// User events
eventBus.on('user:registered', (user) => {
  logger.info('New user registered', { userId: user.id, role: user.role });
  // Welcome email bhejo
  // Analytics track karo
});
```

```javascript
// controllers/orderController.js — Events emit karo
const eventBus = require('../events/eventBus');

exports.placeOrder = async (req, res, next) => {
  try {
    // Order create karo
    const order = await Order.create({
      customer: req.user,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
    });

    // Event emit karo — sab listeners automatically fire honge!
    eventBus.emit('order:placed', {
      id: order._id,
      customer: { email: req.user.email, name: req.user.name },
      items: order.items,
      totalAmount: order.totalAmount,
    });

    // Controller ko nahi jaanna ki email kaise jaati hai ya inventory kaise update hota hai
    // Loosely coupled code!

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
```

---

## Practice 4: Refactor Existing Code with Patterns

### Before (Tightly Coupled):

```javascript
// BAD — sab kuch ek jagah hai
exports.placeOrder = async (req, res) => {
  const order = await Order.create(req.body);

  // Email bhej raha — controller mein!
  await sendEmail(req.user.email, 'Order placed!');

  // Inventory update — controller mein!
  for (const item of order.items) {
    await Product.updateOne({ _id: item.id }, { $inc: { stock: -item.qty } });
  }

  // SMS bhej raha — controller mein!
  await sendSMS(req.user.phone, 'Order confirmed!');

  // Analytics — controller mein!
  await trackEvent('order_placed', { amount: order.total });

  res.json(order);
};
```

### After (Patterns Applied):

```javascript
// GOOD — patterns se refactor kiya
const eventBus = require('../events/eventBus');
const { createNotification } = require('../factories/notificationFactory');

exports.placeOrder = async (req, res, next) => {
  try {
    const order = await Order.create(req.body);

    // Bas event emit karo — baaki listeners ka kaam
    eventBus.emit('order:placed', order);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Listeners alag file mein — Single Responsibility!
// Email, SMS, inventory, analytics — sab alag listeners
```

> **Yaad Rakho:**
> Design patterns ka goal hai — **separation of concerns**. Har component apna kaam kare, doosre ka kaam na kare.

---

## Quick Revision Table

| Practice | Pattern | Kya Banaya | Benefit |
|----------|---------|-----------|---------|
| DB Manager | Singleton | Auto-reconnect DB | Ek hi connection pool |
| User Types | Factory | Admin, Farmer, Buyer | Runtime pe type decide |
| Payment | Factory | UPI, Card, COD | Nayi payment easily add |
| Order Events | Observer | Email, Inventory, Analytics | Loosely coupled |
| Refactoring | All Three | Clean controller | Separation of concerns |

---

## Aaj Kya Seekha?

1. Singleton DB manager with auto-reconnect — ek hi connection poore app mein
2. Factory pattern se different user types aur payment processors banana
3. Observer pattern se event-driven notification system
4. Tightly coupled code ko patterns se refactor karna
5. EventBus as Singleton + Observer combination
6. Controller ko slim rakhna — logic events/factories mein

> **Practice Time!**
> Apne project mein ek eventBus banao aur kam se kam 3 events implement karo: user:registered, order:placed, error:occurred!
