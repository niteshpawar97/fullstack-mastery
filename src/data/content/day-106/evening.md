# Day 106 Evening: Work Queues, Prefetch & Dead Letter Queue

> **Aaj ka plan:** Evening session mein seekhenge work queues (multiple consumers), prefetch count se load balancing, aur dead letter queue — jab message fail ho jaye to uska kya karna hai.

---

## Work Queue Pattern — Multiple Workers

Ek queue pe multiple consumers lagao — RabbitMQ automatically messages distribute karega (round-robin).

```
                         ┌──> Consumer 1 (Worker)
Producer ──> [Queue] ────┤
                         └──> Consumer 2 (Worker)
```

> **Socho Aise:** Ek restaurant mein kitchen (queue) hai. 2 chefs (consumers) hain. Order aate hain to ek chef ko ek order milta hai, doosre chef ko doosra. Koi idle nahi baithta!

---

## Worker Consumer Banao

```javascript
// worker.js — Kaam karne wala consumer (slow processing simulate)
const amqp = require('amqplib');

async function startWorker(workerName) {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  const queueName = 'task_queue';
  await channel.assertQueue(queueName, { durable: true });

  // Prefetch — ek baar mein sirf 1 message do
  channel.prefetch(1);

  console.log(`${workerName} ready hai, kaam ka intezaar...`);

  channel.consume(queueName, async (msg) => {
    const task = JSON.parse(msg.content.toString());
    console.log(`${workerName}: Task mila — ${task.name}`);

    // Heavy kaam simulate karo (2-5 seconds)
    const processingTime = task.difficulty * 1000;
    console.log(`${workerName}: ${processingTime}ms lagenge...`);

    setTimeout(() => {
      console.log(`${workerName}: Task complete — ${task.name}`);
      channel.ack(msg);  // Kaam hone pe hi ACK bhejo
    }, processingTime);
  });
}

// Worker ka naam CLI argument se lo
const name = process.argv[2] || 'Worker-1';
startWorker(name);
```

---

## Prefetch Count — Fair Dispatch

> **Yaad Rakho:** Bina prefetch ke RabbitMQ round-robin karega — agar ek worker slow hai to bhi use utne hi messages milenge. `prefetch(1)` lagao to sirf free worker ko message milega!

```javascript
// Prefetch ka comparison dekho

// BAD — Round Robin (unfair hota hai)
// Worker 1: task1, task3, task5 (sab heavy!)
// Worker 2: task2, task4, task6 (sab light!)

// GOOD — Prefetch(1) se fair dispatch
channel.prefetch(1);
// Worker 1: task1 (heavy, abhi busy hai)
// Worker 2: task2, task3, task4 (light, jaldi free ho gaya)
```

| Prefetch Value | Behavior | Use Case |
|---------------|----------|----------|
| `prefetch(0)` | No limit (sab de do) | Testing, simple tasks |
| `prefetch(1)` | Ek ek karke do | Heavy/variable tasks |
| `prefetch(5)` | 5 ek saath do | Medium tasks, throughput chahiye |
| `prefetch(10)` | 10 ek saath do | Light tasks, speed chahiye |

---

## Task Producer

```javascript
// task-producer.js — Tasks bhejne wala
const amqp = require('amqplib');

async function sendTasks() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  await channel.assertQueue('task_queue', { durable: true });

  // Alag alag difficulty ke tasks
  const tasks = [
    { name: 'Email bhejo', difficulty: 1 },
    { name: 'PDF generate karo', difficulty: 4 },
    { name: 'Image resize karo', difficulty: 3 },
    { name: 'SMS bhejo', difficulty: 1 },
    { name: 'Video transcode karo', difficulty: 5 },
    { name: 'Report banao', difficulty: 3 },
  ];

  tasks.forEach((task, i) => {
    channel.sendToQueue(
      'task_queue',
      Buffer.from(JSON.stringify(task)),
      { persistent: true }
    );
    console.log(`Task #${i + 1} bheja: ${task.name} (difficulty: ${task.difficulty})`);
  });

  setTimeout(() => { connection.close(); process.exit(0); }, 500);
}

sendTasks();
```

> **Practice Time!**
> ```bash
> # 3 terminals kholo:
> # Terminal 1:
> node worker.js "Chef-Ramu"
> # Terminal 2:
> node worker.js "Chef-Shamu"
> # Terminal 3:
> node task-producer.js
> ```
> Dekho kaise tasks fairly distribute hote hain!

---

## Dead Letter Queue (DLQ) — Fail Hone Pe Kya Kare?

Jab koi message baar baar fail hota hai, to use "dead letter queue" mein bhej do — taaki baad mein investigate kar sako.

```
Main Queue ──fail──> Dead Letter Exchange ──> Dead Letter Queue
   |                                              |
   |                                     (Investigate karo)
  ACK (success)
```

> **Socho Aise:** Post office mein agar letter ka address galat hai to wo "return to sender" pile mein jaata hai. DLQ bhi wahi concept hai — fail messages ko alag jagah rakho.

---

## DLQ Setup Code

```javascript
// dlq-setup.js — Dead Letter Queue ka poora setup
const amqp = require('amqplib');

async function setupDLQ() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  // Step 1: Dead Letter Queue banao (yahan fail messages aayenge)
  await channel.assertQueue('dead_letter_queue', {
    durable: true
  });

  // Step 2: Dead Letter Exchange banao
  await channel.assertExchange('dlx_exchange', 'direct', {
    durable: true
  });

  // Step 3: DLQ ko exchange se bind karo
  await channel.bindQueue('dead_letter_queue', 'dlx_exchange', 'dead');

  // Step 4: Main queue banao — fail hone pe DLX pe bhejo
  await channel.assertQueue('main_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx_exchange',     // Fail pe yahan bhejo
      'x-dead-letter-routing-key': 'dead',           // Is routing key se
      'x-message-ttl': 30000                          // 30 sec baad expire
    }
  });

  console.log('DLQ setup complete!');
  console.log('main_queue -> fail -> dlx_exchange -> dead_letter_queue');

  setTimeout(() => { connection.close(); process.exit(0); }, 500);
}

setupDLQ();
```

---

## DLQ Consumer — Fail Messages Dekhna

```javascript
// dlq-consumer.js — Dead letter messages padho
const amqp = require('amqplib');

async function consumeDeadLetters() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  await channel.assertQueue('dead_letter_queue', { durable: true });

  console.log('Dead Letter Queue sun raha hai...');

  channel.consume('dead_letter_queue', (msg) => {
    const data = JSON.parse(msg.content.toString());
    console.log('DEAD LETTER mila:', data);
    console.log('Headers:', msg.properties.headers);

    // Yahan pe alert bhej sakte ho — Slack, email, etc.
    // alertAdmin(`Message fail hua: ${JSON.stringify(data)}`);

    channel.ack(msg);  // DLQ se bhi ACK karna padega
  });
}

consumeDeadLetters();
```

---

## Consumer Jo Message Reject Karta Hai

```javascript
// rejecting-consumer.js — Kuch messages fail honge
const amqp = require('amqplib');

async function startConsumer() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();

  await channel.assertQueue('main_queue', { durable: true });
  channel.prefetch(1);

  console.log('Consumer ready... kuch messages reject honge!');

  channel.consume('main_queue', (msg) => {
    const data = JSON.parse(msg.content.toString());

    if (data.price < 0) {
      // Invalid data — reject karo, DLQ mein jayega
      console.log('REJECT:', data, '(negative price!)');
      channel.nack(msg, false, false);  // requeue: false = DLQ mein jayega
    } else {
      console.log('SUCCESS:', data);
      channel.ack(msg);
    }
  });
}

startConsumer();
```

> **Warning:** `channel.nack(msg, false, true)` wapas same queue mein daalta hai (infinite loop ka risk!). DLQ use karo to `nack(msg, false, false)` — requeue false, DLQ mein jayega.

---

## Message Flow Summary

```
Producer
   |
   v
[main_queue] ──> Consumer
   |                |
   |          Success? ──ACK──> Message delete
   |                |
   |          Fail? ──NACK(requeue:false)──> [DLX Exchange]
   |                                              |
   |                                              v
   |                                    [dead_letter_queue]
   |                                              |
   TTL expire? ─────────────────────────> [DLX Exchange]
```

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| Work Queue | Multiple consumers ek queue pe | Load distribute hota hai |
| prefetch(1) | Ek message ek baar | Fair dispatch, slow worker block nahi karega |
| Round Robin | Default distribution | Unfair ho sakta hai bina prefetch ke |
| Dead Letter Queue | Fail messages ki jagah | Investigate aur retry ke liye |
| DLX Exchange | DLQ ka exchange | Main queue se DLQ tak route karta hai |
| nack(msg,false,false) | Reject + no requeue | DLQ mein jayega |
| nack(msg,false,true) | Reject + requeue | Wapas same queue (danger!) |
| x-message-ttl | Queue mein max time | Expire hone pe DLQ mein |

---

## Aaj Kya Seekha?

1. **Work Queues** se multiple workers pe load distribute hota hai
2. **prefetch(1)** lagao taaki fair dispatch ho — slow worker ko zyada kaam na mile
3. **Dead Letter Queue** fail/reject messages ko capture karta hai
4. **DLX Exchange** main queue se DLQ tak messages route karta hai
5. **nack(msg, false, false)** se message DLQ mein jaata hai — requeue mat karo blindly
6. Production mein hamesha DLQ setup karo — debugging ke liye lifesaver hai!
