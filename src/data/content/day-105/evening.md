# Day 105 Evening: Hands-On — RabbitMQ First Steps (Queues & Exchanges)

> **Practice Time!** Ab RabbitMQ ko practically chalate hain! Pehle simple queue banaayenge, phir direct exchange, aur last mein fanout exchange. Sab Node.js ke `amqplib` package se.

---

## Setup: RabbitMQ Chalu Karo

> **Terminal Command:**
> ```bash
> # Agar pehle se nahi chala hai to:
> docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
>
> # Verify karo
> docker ps | grep rabbitmq
> ```

Management UI check karo: `http://localhost:15672` (guest/guest)

### Project Setup

> **Terminal Command:**
> ```bash
> mkdir day105-rabbitmq && cd day105-rabbitmq
> npm init -y
> npm install amqplib
> ```

---

## Task 1: Simple Queue — Hello World

### Producer (Message bhejo)

```javascript
// simple-producer.js
const amqp = require('amqplib');

async function sendMessage() {
  try {
    // Step 1: RabbitMQ se connect karo
    const connection = await amqp.connect('amqp://localhost');
    console.log('[Producer] RabbitMQ se connected!');

    // Step 2: Channel banao
    const channel = await connection.createChannel();

    // Step 3: Queue declare karo (agar nahi hai to ban jaayegi)
    const queueName = 'hello-queue';
    await channel.assertQueue(queueName, {
      durable: true  // Server restart pe bhi queue rahe
    });

    // Step 4: Message bhejo
    const message = 'Namaste RabbitMQ! Pehla message hai ye!';
    channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true  // Message disk pe save ho (restart pe bhi rahe)
    });
    console.log(`[Producer] Message bheja: "${message}"`);

    // Step 5: 500ms baad connection band karo
    setTimeout(() => {
      connection.close();
      console.log('[Producer] Connection band.');
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error('[Producer] Error:', error.message);
  }
}

sendMessage();
```

### Consumer (Message padho)

```javascript
// simple-consumer.js
const amqp = require('amqplib');

async function receiveMessages() {
  try {
    // Connect aur channel banao
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queueName = 'hello-queue';
    await channel.assertQueue(queueName, { durable: true });

    console.log('[Consumer] Messages ka wait kar raha hai... (Ctrl+C to exit)');

    // Messages consume karo
    channel.consume(queueName, (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        console.log(`[Consumer] Message mila: "${content}"`);

        // Manual ACK — process ho gaya to confirm karo
        channel.ack(msg);
        console.log('[Consumer] ACK bhej diya — message processed!');
      }
    });
  } catch (error) {
    console.error('[Consumer] Error:', error.message);
  }
}

receiveMessages();
```

### Test Karo:

> **Terminal Command:**
> ```bash
> # Terminal 1: Consumer start karo (pehle)
> node simple-consumer.js
>
> # Terminal 2: Producer se message bhejo
> node simple-producer.js
> ```

> **Expected Output:**
> ```
> # Terminal 1 (Consumer):
> [Consumer] Messages ka wait kar raha hai...
> [Consumer] Message mila: "Namaste RabbitMQ! Pehla message hai ye!"
> [Consumer] ACK bhej diya — message processed!
>
> # Terminal 2 (Producer):
> [Producer] RabbitMQ se connected!
> [Producer] Message bheja: "Namaste RabbitMQ! Pehla message hai ye!"
> ```

---

## Task 2: Work Queue — Multiple Workers

Ek producer bahut saare tasks bhejta hai, multiple workers process karte hain.

### Task Producer

```javascript
// task-producer.js
const amqp = require('amqplib');

async function sendTasks() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queue = 'task-queue';
  await channel.assertQueue(queue, { durable: true });

  // 10 tasks bhejo
  const tasks = [
    { type: 'SMS', phone: '9876543210', message: 'Order confirmed!' },
    { type: 'EMAIL', to: 'ramesh@gmail.com', subject: 'Order Receipt' },
    { type: 'SMS', phone: '9876543211', message: 'Payment received!' },
    { type: 'EMAIL', to: 'suresh@gmail.com', subject: 'Shipping Update' },
    { type: 'SMS', phone: '9876543212', message: 'Delivery tomorrow!' },
    { type: 'REPORT', kisanId: '1', type: 'monthly' },
    { type: 'SMS', phone: '9876543213', message: 'New offer available!' },
    { type: 'EMAIL', to: 'lakshmi@gmail.com', subject: 'Welcome' },
    { type: 'RESIZE', imageId: 'IMG-001', size: '800x600' },
    { type: 'SMS', phone: '9876543214', message: 'Happy farming!' },
  ];

  for (const task of tasks) {
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(task)), {
      persistent: true
    });
    console.log(`[Producer] Task bheja: ${task.type}`);
  }

  setTimeout(() => { connection.close(); process.exit(0); }, 500);
}

sendTasks();
```

### Task Worker (Multiple run karo)

```javascript
// task-worker.js
const amqp = require('amqplib');

async function startWorker() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queue = 'task-queue';
  await channel.assertQueue(queue, { durable: true });

  // Ek time pe sirf 1 message do (fair distribution ke liye)
  channel.prefetch(1);

  const workerId = `Worker-${process.pid}`;
  console.log(`[${workerId}] Ready! Tasks ka wait kar raha hai...`);

  channel.consume(queue, async (msg) => {
    const task = JSON.parse(msg.content.toString());
    console.log(`[${workerId}] Task mila: ${task.type}`);

    // Processing simulate karo (1-3 seconds random)
    const processTime = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, processTime));

    console.log(`[${workerId}] Task complete: ${task.type} (${Math.round(processTime)}ms)`);
    channel.ack(msg);
  });
}

startWorker();
```

### Test: 3 Terminals

> **Terminal Command:**
> ```bash
> # Terminal 1: Worker 1
> node task-worker.js
>
> # Terminal 2: Worker 2
> node task-worker.js
>
> # Terminal 3: Tasks bhejo
> node task-producer.js
> ```

> **Expected Output:**
> ```
> # Worker 1 kuch tasks process karega
> [Worker-1234] Task mila: SMS
> [Worker-1234] Task complete: SMS (1500ms)
> [Worker-1234] Task mila: EMAIL
>
> # Worker 2 kuch tasks process karega
> [Worker-5678] Task mila: EMAIL
> [Worker-5678] Task complete: EMAIL (2100ms)
>
> # Tasks dono workers mein distribute honge!
> ```

> **Yaad Rakho:** `prefetch(1)` bahut important hai — ye ensure karta hai ki ek worker ko ek time pe sirf ek message mile. Isse busy worker ko aur messages nahi jaate, free worker ko milte hain (fair distribution).

---

## Task 3: Direct Exchange — Routing by Key

```javascript
// direct-producer.js
const amqp = require('amqplib');

async function sendWithRouting() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  // Direct exchange declare karo
  const exchange = 'kisan-notifications';
  await channel.assertExchange(exchange, 'direct', { durable: true });

  // Alag-alag routing keys se messages bhejo
  const messages = [
    { key: 'sms', data: { phone: '9876543210', text: 'Order shipped!' } },
    { key: 'email', data: { to: 'ramesh@gmail.com', subject: 'Invoice' } },
    { key: 'sms', data: { phone: '9876543211', text: 'Payment done!' } },
    { key: 'push', data: { token: 'FCM-xxx', title: 'New offer!' } },
    { key: 'email', data: { to: 'suresh@gmail.com', subject: 'Welcome' } },
  ];

  for (const msg of messages) {
    channel.publish(exchange, msg.key, Buffer.from(JSON.stringify(msg.data)));
    console.log(`[Producer] ${msg.key.toUpperCase()} message bheja`);
  }

  setTimeout(() => { connection.close(); process.exit(0); }, 500);
}

sendWithRouting();
```

```javascript
// direct-consumer.js
const amqp = require('amqplib');

async function startConsumer(routingKey) {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchange = 'kisan-notifications';
  await channel.assertExchange(exchange, 'direct', { durable: true });

  // Temporary queue banao aur exchange se bind karo
  const { queue } = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(queue, exchange, routingKey);

  console.log(`[${routingKey.toUpperCase()} Consumer] Ready! "${routingKey}" messages ka wait...`);

  channel.consume(queue, (msg) => {
    const data = JSON.parse(msg.content.toString());
    console.log(`[${routingKey.toUpperCase()}] Message: ${JSON.stringify(data)}`);
    channel.ack(msg);
  });
}

// Command line se routing key lo
const key = process.argv[2] || 'sms';
startConsumer(key);
```

### Test:

> **Terminal Command:**
> ```bash
> # Terminal 1: SMS consumer
> node direct-consumer.js sms
>
> # Terminal 2: Email consumer  
> node direct-consumer.js email
>
> # Terminal 3: Messages bhejo
> node direct-producer.js
> ```

> **Yaad Rakho:** SMS consumer ko sirf SMS messages milenge, email consumer ko sirf email messages. Ye direct exchange ka power hai — routing key se precise delivery!

---

## Management UI Mein Dekho

Browser mein `http://localhost:15672` kholo:
1. **Queues** tab — saari queues dikhenge unke message count ke saath
2. **Exchanges** tab — `kisan-notifications` exchange dikhega
3. Queue pe click karo — messages peek kar sakte ho

---

## Mini Challenge

1. **Fanout exchange** banao — ek "order.created" event publish karo, SMS, Email, aur Push — teeno consumers ko milna chahiye
2. **Dead Letter Queue** banao — failed messages alag queue mein jaayein
3. **Message priority** add karo — urgent messages pehle process hon

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| `amqplib` | Node.js ka RabbitMQ client library |
| `assertQueue` | Queue banao (agar nahi hai to) |
| `sendToQueue` | Simple queue mein direct message bhejo |
| `assertExchange` | Exchange banao (direct/fanout/topic) |
| `publish` | Exchange ke through message bhejo with routing key |
| `bindQueue` | Queue ko exchange se connect karo |
| `prefetch(1)` | Ek time pe ek message — fair distribution |
| `ack(msg)` | Message processed confirm karo |

---

## Aaj Kya Seekha?

- RabbitMQ setup Docker se aur `amqplib` install kiya
- Simple queue — producer/consumer pattern
- Work queue — multiple workers mein task distribution
- Direct exchange — routing key se specific queue mein delivery
- ACK mechanism — message loss prevent kiya
- Management UI se queues aur exchanges monitor kiye
