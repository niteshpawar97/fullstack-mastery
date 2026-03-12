# Day 114 Morning: Advanced Redis — Pub/Sub & Streams

> **Aaj ka plan:** Aaj hum Redis ke advanced features sikhenge — Pub/Sub for real-time messaging aur Streams for event sourcing. Redis sirf cache nahi hai, ye ek powerful message broker bhi hai!

---

## Redis Sirf Cache Nahi Hai!

### Redis Ke Multiple Avatars

| Feature | Use Case | Example |
|---------|----------|---------|
| Cache | Data fast access | Product prices cache |
| Pub/Sub | Real-time messaging | Live notifications |
| Streams | Event log/sourcing | Order history, audit log |
| Sorted Sets | Rankings/leaderboards | Top farmers by sales |
| Geospatial | Location queries | Nearby farmers dhundho |

> **Socho Aise:** Redis ek Swiss Army knife hai — chhuri bhi hai, scissors bhi hain, bottle opener bhi hai. Tum bus chhuri use kar rahe the (caching), aaj baaki tools bhi sikhenge!

---

## Redis Pub/Sub — Real-Time Messaging

### Pub/Sub Kya Hai?

```
Publisher → Channel → Subscriber(s)

Jaise Radio Station:
- Radio Station (Publisher) broadcast karta hai
- Channel (FM 93.5) pe
- Sunne wale (Subscribers) tune karte hain

Multiple subscribers ek hi channel sun sakte hain!
```

### Basic Pub/Sub Example

```typescript
// publisher.ts — Messages broadcast karne wala
import Redis from 'ioredis';

const publisher = new Redis();

// Har 2 second pe price update broadcast karo
setInterval(async () => {
  const priceUpdate = {
    product: 'Wheat',
    price: Math.floor(Math.random() * 500) + 1500,
    timestamp: new Date().toISOString(),
    market: 'Delhi Mandi',
  };
  
  // "price-updates" channel pe message publish karo
  await publisher.publish('price-updates', JSON.stringify(priceUpdate));
  console.log(`Published: Wheat price ₹${priceUpdate.price}`);
}, 2000);

// Specific farmer ko notification bhejo
async function notifyFarmer(farmerId: string, message: string) {
  // Farmer-specific channel pe publish
  await publisher.publish(`farmer:${farmerId}:notifications`, JSON.stringify({
    message,
    time: new Date().toISOString(),
  }));
}
```

```typescript
// subscriber.ts — Messages receive karne wala
import Redis from 'ioredis';

const subscriber = new Redis();

// Channel subscribe karo
subscriber.subscribe('price-updates', (err, count) => {
  if (err) {
    console.error('Subscribe failed:', err);
    return;
  }
  console.log(`${count} channel(s) pe subscribe ho gaye!`);
});

// Messages receive karo
subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  console.log(`[${channel}] Wheat ka naya price: ₹${data.price} at ${data.market}`);
});

// Pattern subscribe — multiple channels ek saath
subscriber.psubscribe('farmer:*:notifications', (err) => {
  if (err) console.error(err);
  console.log('Sab farmers ke notifications sun rahe hain!');
});

subscriber.on('pmessage', (pattern, channel, message) => {
  console.log(`Pattern: ${pattern}, Channel: ${channel}`);
  console.log(`Message: ${message}`);
});
```

> **Warning:** Pub/Sub mein messages persist nahi hote! Agar subscriber offline hai toh message miss ho jaayega. Persistence chahiye toh Redis Streams use karo (aage padhenge).

---

## Real-World Pub/Sub: Live Dashboard

```typescript
// Express + WebSocket + Redis Pub/Sub = Live Dashboard
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import Redis from 'ioredis';

const app = express();
const httpServer = createServer(app);
const io = new SocketIO(httpServer);
const redisSubscriber = new Redis();
const redisPublisher = new Redis();

// Redis se messages aayenge → WebSocket se browser tak jayenge
redisSubscriber.subscribe('order-updates', 'price-updates');

redisSubscriber.on('message', (channel, message) => {
  // Redis message → Socket.IO se broadcast → Browser dashboard
  io.emit(channel, JSON.parse(message));
  console.log(`Broadcast kiya: ${channel}`);
});

// Jab naya order aaye → Redis mein publish karo
app.post('/api/orders', async (req, res) => {
  const order = { ...req.body, id: Date.now(), status: 'NEW' };
  
  // Database mein save karo (yahan simulated)
  // ...
  
  // Pub/Sub se broadcast — sab dashboards ko real-time update
  await redisPublisher.publish('order-updates', JSON.stringify(order));
  
  res.status(201).json(order);
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Dashboard connected!');
  
  // Client specific channel pe subscribe karna chahe toh
  socket.on('subscribe-farmer', (farmerId) => {
    socket.join(`farmer:${farmerId}`);
    console.log(`Dashboard farmer ${farmerId} ke updates dekhega`);
  });
});

httpServer.listen(3000);
```

> **Tip:** Pub/Sub + WebSocket = Real-time features ka best combo. Chat apps, live dashboards, stock prices, delivery tracking — sab aise bante hain!

---

## Redis Streams — Persistent Event Log

### Pub/Sub vs Streams

| Feature | Pub/Sub | Streams |
|---------|---------|---------|
| Persistence | Nahi — fire & forget | Haan — disk pe save hota hai |
| Consumer Groups | Nahi | Haan — work distribute hota hai |
| Replay | Nahi — miss hua toh gaya | Haan — purane messages padh sakte ho |
| Acknowledgment | Nahi | Haan — confirm hota ki process hua |
| Best For | Real-time broadcasts | Event sourcing, reliable processing |

> **Yaad Rakho:** Pub/Sub = Live TV (miss kiya toh gaya). Streams = YouTube (kab bhi dekh sakte ho, replay kar sakte ho)!

### Stream Basics

```typescript
import Redis from 'ioredis';

const redis = new Redis();

// === PRODUCER — Events add karo stream mein ===

async function addOrderEvent(order: any) {
  // XADD — stream mein naya event daalo
  // '*' matlab Redis auto-generate karega unique ID (timestamp-based)
  const eventId = await redis.xadd(
    'orders-stream',         // Stream ka naam
    '*',                     // Auto-generated ID
    'orderId', order.id,     // Key-value pairs (flat structure)
    'farmer', order.farmerName,
    'product', order.product,
    'amount', String(order.amount),
    'status', 'CREATED',
    'timestamp', new Date().toISOString()
  );
  
  console.log(`Event added: ${eventId}`);
  // Output: Event added: 1704067200000-0
}

// === CONSUMER — Events padho stream se ===

async function readRecentOrders() {
  // XRANGE — time range mein events padho
  const events = await redis.xrange(
    'orders-stream',
    '-',        // Start se (-) ya specific timestamp
    '+',        // End tak (+) ya specific timestamp
    'COUNT', 10 // Max 10 events
  );
  
  console.log('Recent orders:');
  for (const [id, fields] of events) {
    console.log(`  ID: ${id}`);
    // fields = ['orderId', 'ORD-1', 'farmer', 'Ramesh', ...]
    // Pairs mein aata hai — [key, value, key, value, ...]
    for (let i = 0; i < fields.length; i += 2) {
      console.log(`    ${fields[i]}: ${fields[i + 1]}`);
    }
  }
}

// === REAL-TIME LISTEN — Naye events ka wait karo ===

async function listenForNewOrders() {
  let lastId = '$'; // $ matlab sirf naye messages
  
  while (true) {
    // XREAD — block hokay wait karo naye messages ka
    const result = await redis.xread(
      'BLOCK', 5000,          // 5 second tak wait karo
      'STREAMS', 'orders-stream',
      lastId                   // Is ID ke baad ke messages do
    );
    
    if (result) {
      for (const [stream, messages] of result) {
        for (const [id, fields] of messages) {
          console.log(`Naya order aaya! ID: ${id}`);
          lastId = id; // Agla read is ke baad se
        }
      }
    }
  }
}
```

---

## Consumer Groups — Work Distribute Karo

```typescript
// Consumer Group — multiple workers mein kaam divide karo
// Jaise factory mein assembly line — har worker ek part karta hai

async function setupConsumerGroup() {
  try {
    // Group banao — "order-processors" naam ka
    await redis.xgroup(
      'CREATE', 'orders-stream', 'order-processors',
      '0',      // Starting position — 0 matlab sab purane messages bhi
      'MKSTREAM' // Stream nahi hai toh bana do
    );
    console.log('Consumer group ban gaya!');
  } catch (err: any) {
    if (err.message.includes('BUSYGROUP')) {
      console.log('Group pehle se hai — OK!');
    }
  }
}

// Worker function — ye multiple instances mein chalega
async function orderWorker(workerName: string) {
  while (true) {
    // XREADGROUP — group ke through messages padho
    const result = await redis.xreadgroup(
      'GROUP', 'order-processors', // Group naam
      workerName,                   // Consumer naam (unique per worker)
      'BLOCK', 5000,
      'COUNT', 1,                   // Ek ek message process karo
      'STREAMS', 'orders-stream',
      '>'                           // Sirf naye unprocessed messages
    );
    
    if (result) {
      for (const [stream, messages] of result) {
        for (const [id, fields] of messages) {
          console.log(`[${workerName}] Processing: ${id}`);
          
          // Order process karo (payment, notification, etc.)
          await processOrder(fields);
          
          // ACK — confirm karo ki process ho gaya
          await redis.xack('orders-stream', 'order-processors', id);
          console.log(`[${workerName}] Done: ${id}`);
        }
      }
    }
  }
}

// 3 workers start karo — kaam automatically divide hoga
orderWorker('worker-1');
orderWorker('worker-2');
orderWorker('worker-3');
```

> **Yaad Rakho:** Consumer Group mein ek message sirf EK consumer ko milta hai. Ye kaam distribute karta hai, duplicate nahi karta. XACK se confirm karo ki processing done — nahi toh Redis retry karega!

---

## Quick Revision Table

| Feature | Command | Use Case |
|---------|---------|----------|
| Publish | `PUBLISH channel msg` | Broadcast message |
| Subscribe | `SUBSCRIBE channel` | Listen to channel |
| Pattern Sub | `PSUBSCRIBE pattern` | Multiple channels listen |
| Stream Add | `XADD stream * key val` | Event log mein add |
| Stream Read | `XRANGE stream - +` | Events padho |
| Block Read | `XREAD BLOCK ms STREAMS` | Real-time listen |
| Consumer Group | `XREADGROUP GROUP name` | Distributed processing |
| Acknowledge | `XACK stream group id` | Processing confirm |

---

## Aaj Kya Seekha?

1. **Pub/Sub** real-time broadcasting ke liye hai — live dashboards, notifications, chat
2. **Pub/Sub mein messages persist nahi hote** — subscriber offline toh message miss
3. **Streams** persistent event log hai — messages disk pe save hote hain, replay kar sakte ho
4. **Consumer Groups** se kaam multiple workers mein distribute hota hai
5. **XACK** se confirm karo ki message process ho gaya — reliability ke liye zaroori

> **Practice Time!** Redis Pub/Sub se ek simple chat system banao. 2 terminals kholo — ek publisher, ek subscriber. Alag-alag channels pe messages bhejo aur receive karo!
