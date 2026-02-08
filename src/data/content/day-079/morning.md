# Day 79 — Design Patterns: Singleton, Factory, Observer (Morning Session)

> **Aaj ka plan:**
> Aaj hum teen important design patterns seekhenge — Singleton (ek hi instance), Factory (object creation), aur Observer (event system). Yeh patterns real backend projects mein bahut kaam aate hain.

---

## Design Patterns Kya Hain?

Design patterns coding ke proven solutions hain — jaise recipes. Kisi ne pehle problem face ki, solution dhundha, aur sab ke liye document kiya.

> **Socho Aise:**
> Jaise ghar banaate waqt architect proven floor plans use karta hai — har baar nayi design nahi banata. Waise hi programmers design patterns use karte hain tested solutions ke liye.

### Kyu Important Hain?
- **Reusable** — baar baar same problem solve nahi karna
- **Readable** — doosre developers samajh jaayenge
- **Maintainable** — code change karna aasan
- **Scalable** — bade projects mein bhi kaam kare

---

## Pattern 1: Singleton — Ek Hi Instance

Singleton pattern ensure karta hai ki ek class ka sirf EK instance bane — poore application mein.

> **Socho Aise:**
> Gaon mein ek hi Post Office hoti hai. Chahe koi bhi jaaye — wahi ek Post Office milegi. Do Post Office nahi ban sakti same gaon mein. Yahi Singleton hai!

### Real Use Cases:
- **Database Connection** — ek hi connection pool
- **Logger** — ek hi logger instance
- **Configuration** — ek hi config object
- **Cache** — ek hi cache store

### Singleton — Database Connection

```javascript
// db/connection.js — Singleton pattern

class Database {
  constructor() {
    // Agar pehle se instance hai, toh wahi return karo
    if (Database.instance) {
      return Database.instance;
    }

    // Pehli baar — connection banao
    this.connection = null;
    this.isConnected = false;

    // Instance save karo
    Database.instance = this;
  }

  async connect(uri) {
    if (this.isConnected) {
      console.log('Already connected — existing connection return kar rahe hain');
      return this.connection;
    }

    console.log('New database connection bana rahe hain...');
    // Mongoose ya koi bhi DB client
    const mongoose = require('mongoose');
    this.connection = await mongoose.connect(uri);
    this.isConnected = true;

    return this.connection;
  }

  getConnection() {
    if (!this.isConnected) {
      throw new Error('Database not connected! Pehle connect() call karo');
    }
    return this.connection;
  }
}

// Export — har baar new Database() karo, same instance milega
module.exports = new Database();
```

```javascript
// Usage — kahi bhi import karo, same instance milegi
const db = require('./db/connection');

// File 1 mein
await db.connect('mongodb://localhost:27017/farmdb');

// File 2 mein — nayi connection NAHI banegi, purani milegi
const connection = db.getConnection(); // wahi connection hai!
```

### Simpler Singleton — Module Caching

> **Yaad Rakho:**
> Node.js mein modules automatically cached hote hain. Jab `require()` karte ho, pehli baar execute hota hai, baad mein cached result milta hai. Yeh khud ek Singleton pattern hai!

```javascript
// config/settings.js — Node.js module = natural Singleton
const settings = {
  dbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Ek baar freeze karo — koi change na kar sake
Object.freeze(settings);

module.exports = settings;
// Har jagah require karo — same object milega!
```

---

## Pattern 2: Factory — Objects Banane Ka Tareeqa

Factory pattern objects banata hai bina directly `new` class kiye. Kaunsa object banana hai, yeh factory decide karti hai.

> **Socho Aise:**
> Pizza shop mein tum bolo "Margherita chahiye" — chef decide karega ki kaunsa base, sauce, cheese use karna hai. Tumhe details nahi jaanni — sirf order do. Yahi Factory pattern hai!

### Real Use Cases:
- **Different User Types** — Admin, Farmer, Buyer
- **Payment Processors** — UPI, Card, NetBanking
- **Notification Channels** — Email, SMS, Push
- **Database Adapters** — MongoDB, PostgreSQL, MySQL

### Factory — User Types

```javascript
// factories/userFactory.js

// Base User class
class User {
  constructor(name, email, role) {
    this.name = name;
    this.email = email;
    this.role = role;
    this.createdAt = new Date();
  }

  getPermissions() {
    return ['read'];  // basic permission
  }
}

// Admin — sab permissions
class AdminUser extends User {
  constructor(name, email) {
    super(name, email, 'admin');
  }

  getPermissions() {
    return ['read', 'write', 'delete', 'manage_users', 'view_reports'];
  }
}

// Farmer — farming related permissions
class FarmerUser extends User {
  constructor(name, email) {
    super(name, email, 'farmer');
    this.farmDetails = {};
  }

  getPermissions() {
    return ['read', 'write', 'manage_products', 'view_orders'];
  }
}

// Buyer — buying related permissions
class BuyerUser extends User {
  constructor(name, email) {
    super(name, email, 'buyer');
    this.cart = [];
  }

  getPermissions() {
    return ['read', 'place_order', 'view_orders'];
  }
}

// === FACTORY FUNCTION ===
function createUser(type, name, email) {
  switch (type.toLowerCase()) {
    case 'admin':
      return new AdminUser(name, email);
    case 'farmer':
      return new FarmerUser(name, email);
    case 'buyer':
      return new BuyerUser(name, email);
    default:
      throw new Error(`Unknown user type: ${type}`);
  }
}

module.exports = { createUser };
```

```javascript
// Usage
const { createUser } = require('./factories/userFactory');

// Factory se user banao — type bolo, baaki factory handle karegi
const admin = createUser('admin', 'Ravi', 'ravi@admin.com');
const farmer = createUser('farmer', 'Kisan', 'kisan@farm.com');
const buyer = createUser('buyer', 'Sita', 'sita@buyer.com');

console.log(admin.getPermissions());
// ['read', 'write', 'delete', 'manage_users', 'view_reports']

console.log(farmer.getPermissions());
// ['read', 'write', 'manage_products', 'view_orders']

console.log(buyer.role);  // 'buyer'
```

### Factory — Notification Service

```javascript
// factories/notificationFactory.js

class EmailNotification {
  send(to, message) {
    console.log(`Email bheji ${to} ko: ${message}`);
    // Real: nodemailer se email bhejo
  }
}

class SMSNotification {
  send(to, message) {
    console.log(`SMS bheja ${to} ko: ${message}`);
    // Real: Twilio API se SMS bhejo
  }
}

class PushNotification {
  send(to, message) {
    console.log(`Push notification bheji ${to} ko: ${message}`);
    // Real: Firebase se push notification bhejo
  }
}

// Factory
function createNotification(channel) {
  const channels = {
    email: EmailNotification,
    sms: SMSNotification,
    push: PushNotification,
  };

  const NotificationClass = channels[channel.toLowerCase()];
  if (!NotificationClass) {
    throw new Error(`Unknown notification channel: ${channel}`);
  }
  return new NotificationClass();
}

module.exports = { createNotification };
```

> **Tip:**
> Factory pattern tab use karo jab tumhe runtime pe decide karna ho ki kaunsa object banana hai. Agar fix pata hai toh directly `new` use karo.

---

## Pattern 3: Observer — Pub/Sub (Event System)

Observer pattern mein ek "Subject" hota hai aur kayi "Observers". Jab subject mein kuch change ho, sab observers ko automatically notify hota hai.

> **Socho Aise:**
> YouTube channel subscribe karo. Jab creator nayi video daale, sab subscribers ko notification jaaye. Creator ko har subscriber ko individually batana nahi padta — system automatically karta hai. Yahi Observer pattern hai!

### Node.js EventEmitter — Built-in Observer

```javascript
// Node.js mein EventEmitter already Observer pattern hai!
const EventEmitter = require('events');

// Event emitter banao (Subject)
const orderEvents = new EventEmitter();

// Observers register karo (Subscribers)

// Observer 1: Email notification bhejo
orderEvents.on('orderPlaced', (order) => {
  console.log(`Email: Order #${order.id} placed by ${order.customer}`);
  // sendEmail(order.customer.email, 'Order Confirmed!');
});

// Observer 2: Inventory update karo
orderEvents.on('orderPlaced', (order) => {
  console.log(`Inventory: ${order.product} ki quantity ghata do`);
  // updateInventory(order.product, -order.quantity);
});

// Observer 3: Analytics log karo
orderEvents.on('orderPlaced', (order) => {
  console.log(`Analytics: Order tracked — Rs.${order.amount}`);
  // trackEvent('order_placed', { amount: order.amount });
});

// Jab order place ho — emit karo (sab observers notify honge)
orderEvents.emit('orderPlaced', {
  id: 'ORD-001',
  customer: 'Ravi Kisan',
  product: 'Organic Gehun',
  quantity: 10,
  amount: 25000,
});
```

> **Expected Output:**
> ```
> Email: Order #ORD-001 placed by Ravi Kisan
> Inventory: Organic Gehun ki quantity ghata do
> Analytics: Order tracked — Rs.25000
> ```

### Custom Observer Pattern

```javascript
// patterns/observer.js

class EventBus {
  constructor() {
    this.listeners = {};  // { eventName: [callback1, callback2, ...] }
  }

  // Subscribe — event pe listener add karo
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this; // chaining ke liye
  }

  // Unsubscribe — listener hatao
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }

  // Emit — sab listeners ko notify karo
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Once — sirf ek baar suno, phir auto-remove
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);  // khud ko remove karo
    };
    this.on(event, wrapper);
  }
}

module.exports = new EventBus();  // Singleton export
```

> **Yaad Rakho:**
> Observer pattern code ko **loosely coupled** banata hai. Order controller ko nahi jaanna ki email kaise bhejni hai ya inventory kaise update hota hai — bas event emit karo, baaki observers ka kaam.

---

## Quick Revision Table

| Pattern | Kya Karta Hai | Use Case | Key Rule |
|---------|--------------|----------|----------|
| **Singleton** | Ek hi instance | DB connection, Logger | `if (instance) return instance` |
| **Factory** | Object creation decide | User types, Notifications | Switch/map se object banao |
| **Observer** | Event-based notify | Order events, Pub/Sub | emit -> sab listeners fire |

---

## Aaj Kya Seekha?

1. Design patterns tested solutions hain — bar bar use hote hain
2. Singleton — ek hi instance poore app mein (DB connection, logger)
3. Factory — runtime pe decide karo kaunsa object banana hai
4. Observer — event emit karo, sab listeners notify ho jaayenge
5. Node.js EventEmitter already Observer pattern hai
6. Loosely coupled code likhne mein patterns help karte hain

> **Practice Time!**
> Evening session mein hum teeno patterns implement karenge real code mein — Singleton DB, Factory users, Observer notifications!
