# Day 106 Morning: RabbitMQ with Node.js — Producer & Consumer Setup

> **Aaj ka plan:** Aaj hum Node.js se RabbitMQ ko connect karenge. `amqplib` package use karke producer banayenge jo message bhejega, aur consumer banayenge jo message receive karega. Real code likhenge!

---

## amqplib Package — Node.js Ka RabbitMQ Driver

RabbitMQ ke saath Node.js mein baat karne ke liye `amqplib` package use hota hai. Ye official AMQP 0-9-1 protocol ka client hai.

> **Terminal Command:**
> ```bash
> # Project setup karo
> mkdir rabbitmq-nodejs && cd rabbitmq-nodejs
> npm init -y
> npm install amqplib
> ```

---

## RabbitMQ Se Connect Karna

```javascript
// connection.js — RabbitMQ se connection banana
const amqp = require('amqplib');

async function connectRabbitMQ() {
  try {
    // RabbitMQ server se connect ho raha hai
    const connection = await amqp.connect('amqp://localhost:5672');
    console.log('RabbitMQ se connection ho gaya!');

    // Channel banao — saara kaam channel ke through hota hai
    const channel = await connection.createChannel();
    console.log('Channel ban gaya!');

    return { connection, channel };
  } catch (error) {
    console.error('Connection fail hua:', error.message);
    // 5 second baad retry karo
    setTimeout(() => connectRabbitMQ(), 5000);
  }
}

module.exports = { connectRabbitMQ };
```

> **Socho Aise:** Connection ek telephone line hai, aur channel us line pe hone wali call. Ek connection pe multiple channels (calls) ho sakti hain.

---

## Producer Banana — Message Bhejne Wala

```javascript
// producer.js — Message queue mein bhejne wala
const amqp = require('amqplib');

async function sendMessage() {
  // Step 1: Connect karo
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  // Step 2: Queue declare karo (agar nahi hai to ban jayegi)
  const queueName = 'order_queue';
  await channel.assertQueue(queueName, {
    durable: true  // Server restart pe bhi queue rahegi
  });

  // Step 3: Message bhejo
  const orderData = {
    orderId: 'ORD-1001',
    product: 'Laptop',
    price: 75000,
    timestamp: new Date().toISOString()
  };

  channel.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(orderData)),  // Message hamesha Buffer mein jaata hai
    { persistent: true }  // Message disk pe save hoga
  );

  console.log(`Message bhej diya: ${JSON.stringify(orderData)}`);

  // Thodi der baad connection band karo
  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
}

sendMessage();
```

> **Yaad Rakho:** `durable: true` queue ko persistent banata hai (server restart pe survive karega), aur `persistent: true` message ko disk pe likhta hai. Dono lagao production mein!

---

## Consumer Banana — Message Padhne Wala

```javascript
// consumer.js — Queue se message padhne wala
const amqp = require('amqplib');

async function consumeMessages() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  const queueName = 'order_queue';
  await channel.assertQueue(queueName, {
    durable: true
  });

  console.log(`${queueName} se messages sun raha hai...`);

  // Messages consume karo
  channel.consume(queueName, (msg) => {
    if (msg !== null) {
      // Buffer se JSON mein convert karo
      const order = JSON.parse(msg.content.toString());
      console.log('Order mila:', order);

      // Kaam ho gaya, acknowledge karo
      channel.ack(msg);
      console.log('Message acknowledge ho gaya!');
    }
  });
}

consumeMessages();
```

> **Warning:** Agar `channel.ack(msg)` nahi likhoge to message wapas queue mein chala jayega. Ye infinite loop bana sakta hai!

---

## Acknowledgement (ACK) Samjho

```
Producer ──msg──> [Queue] ──msg──> Consumer
                                      |
                          Process karta hai...
                                      |
                          ──ACK──> [Queue] (msg delete)
                          ──NACK──> [Queue] (msg wapas)
```

| ACK Type | Matlab | Kab Use Karo |
|----------|--------|-------------|
| `channel.ack(msg)` | Kaam ho gaya, delete karo | Successfully process hone pe |
| `channel.nack(msg, false, true)` | Nahi hua, wapas daalo | Temporary error pe |
| `channel.nack(msg, false, false)` | Nahi hua, discard karo | Invalid message pe |

> **Tip:** `noAck: true` option deke auto-ack on kar sakte ho, lekin production mein manual ACK hi use karo — kyunki agar consumer crash ho jaye beech mein to message lost ho jayega.

---

## Chalao Aur Dekho

> **Terminal Command:**
> ```bash
> # Terminal 1 — pehle consumer start karo
> node consumer.js
>
> # Terminal 2 — phir producer se message bhejo
> node producer.js
> ```

> **Expected Output:**
> ```
> # Consumer Terminal:
> order_queue se messages sun raha hai...
> Order mila: { orderId: 'ORD-1001', product: 'Laptop', price: 75000, ... }
> Message acknowledge ho gaya!
>
> # Producer Terminal:
> Message bhej diya: {"orderId":"ORD-1001","product":"Laptop",...}
> ```

---

## Multiple Messages Bhejo (Loop)

```javascript
// bulk-producer.js — Bahut saare messages ek saath
const amqp = require('amqplib');

async function sendBulkMessages() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  await channel.assertQueue('order_queue', { durable: true });

  // 10 orders bhejo
  for (let i = 1; i <= 10; i++) {
    const order = {
      orderId: `ORD-${1000 + i}`,
      product: `Product-${i}`,
      price: Math.floor(Math.random() * 10000) + 500
    };

    channel.sendToQueue(
      'order_queue',
      Buffer.from(JSON.stringify(order)),
      { persistent: true }
    );
    console.log(`Order #${i} bhej diya`);
  }

  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
}

sendBulkMessages();
```

---

## Quick Revision Table

| Concept | Kya Hai | Code |
|---------|---------|------|
| amqplib | Node.js RabbitMQ client | `require('amqplib')` |
| Connect | Server se judo | `amqp.connect('amqp://localhost')` |
| Channel | Kaam karne ka raasta | `connection.createChannel()` |
| assertQueue | Queue banao/check karo | `channel.assertQueue(name, opts)` |
| sendToQueue | Message bhejo | `channel.sendToQueue(name, Buffer)` |
| consume | Messages suno | `channel.consume(name, callback)` |
| ack | Message done mark karo | `channel.ack(msg)` |
| durable | Queue survive restart | `{ durable: true }` |
| persistent | Message disk pe save | `{ persistent: true }` |

---

## Aaj Kya Seekha?

1. **amqplib** se Node.js mein RabbitMQ se baat kar sakte hain
2. **Connection** banao, phir **Channel** banao — saara kaam channel pe hota hai
3. **Producer** `sendToQueue` se message bhejta hai Buffer format mein
4. **Consumer** `consume` se message sunta hai aur **ack** se confirm karta hai
5. **durable + persistent** production mein zaroori hai data loss se bachne ke liye
