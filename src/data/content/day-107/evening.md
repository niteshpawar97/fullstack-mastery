# Day 107 Evening: Kafka Producer, Consumer & Consumer Groups with KafkaJS

> **Aaj ka plan:** Evening mein hands-on karenge — KafkaJS se producer aur consumer likhenge, consumer groups samjhenge, offset management dekhenge, aur real decision framework banayenge ki Kafka kab use karo aur RabbitMQ kab.

---

## Kafka Producer — Messages Bhejo

```javascript
// producer.js — Kafka mein messages bhejne wala
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function sendOrderEvents() {
  // Producer ko connect karo
  await producer.connect();
  console.log('Producer connected!');

  // Multiple orders bhejo
  const orders = [
    { orderId: 'ORD-1001', userId: 'USER-A', amount: 5000, status: 'created' },
    { orderId: 'ORD-1002', userId: 'USER-B', amount: 3000, status: 'created' },
    { orderId: 'ORD-1003', userId: 'USER-A', amount: 8000, status: 'created' },
    { orderId: 'ORD-1004', userId: 'USER-C', amount: 1500, status: 'created' },
  ];

  // Ek ek karke bhejo (key ke saath)
  for (const order of orders) {
    await producer.send({
      topic: 'order-events',
      messages: [{
        key: order.userId,    // Same user ke orders same partition mein
        value: JSON.stringify(order),
        headers: {
          'event-type': 'order.created',   // Metadata headers mein
          'source': 'order-service',
        },
      }],
    });
    console.log(`Event bheja: ${order.orderId} (user: ${order.userId})`);
  }

  // Disconnect karo
  await producer.disconnect();
  console.log('Producer disconnect ho gaya');
}

sendOrderEvents().catch(console.error);
```

> **Tip:** `key: order.userId` dene se USER-A ke sab orders ek partition mein jayenge. Isse ordering guarantee milti hai per-user level pe.

---

## Kafka Consumer — Messages Padho

```javascript
// consumer.js — Kafka se messages padhne wala
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: ['localhost:9092'],
});

// Consumer banao — groupId zaroori hai!
const consumer = kafka.consumer({ groupId: 'notification-group' });

async function startConsumer() {
  await consumer.connect();
  console.log('Consumer connected!');

  // Topic subscribe karo
  await consumer.subscribe({
    topic: 'order-events',
    fromBeginning: true,  // Purane messages bhi padho (pehli baar)
  });

  // Messages process karo
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const order = JSON.parse(message.value.toString());
      const eventType = message.headers['event-type']?.toString();

      console.log({
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        eventType,
        order,
      });

      // Yahan pe notification bhejo (email, SMS, push)
      console.log(`Notification bhej raha: Order ${order.orderId} for ${order.userId}`);
    },
  });
}

startConsumer().catch(console.error);
```

---

## Consumer Groups — Kafka Ki Superpower

Consumer group ka matlab hai: multiple consumers milke ek topic ke messages baant lete hain.

```
Topic: order-events (3 partitions)

Consumer Group: "notification-group"
┌──────────────────────────────────────────────┐
│  Partition 0 ──> Consumer A                   │
│  Partition 1 ──> Consumer B                   │
│  Partition 2 ──> Consumer C                   │
└──────────────────────────────────────────────┘

Consumer Group: "analytics-group"
┌──────────────────────────────────────────────┐
│  Partition 0 ──> Consumer X                   │
│  Partition 1 ──> Consumer X  (2 partitions    │
│  Partition 2 ──> Consumer Y   2 consumers)    │
└──────────────────────────────────────────────┘
```

> **Yaad Rakho:** Ek partition sirf ek consumer ko milta hai (ek group mein). Agar 3 partitions hain aur 5 consumers, to 2 consumers idle rahenge!

| Scenario | Partitions | Consumers | Result |
|----------|-----------|-----------|--------|
| Perfect match | 3 | 3 | Har consumer ko 1 partition |
| Zyada consumers | 3 | 5 | 2 consumers idle baithenge |
| Kam consumers | 6 | 2 | Har consumer ko 3 partitions |
| Alag group | 3 | 3+3 (2 groups) | Dono groups ko sab messages milenge |

---

## Multiple Consumer Groups — Real World

```javascript
// analytics-consumer.js — Alag group, same topic, sab messages milenge
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: ['localhost:9092'],
});

// Alag groupId = alag group = independent consumption
const consumer = kafka.consumer({ groupId: 'analytics-group' });

async function startAnalyticsConsumer() {
  await consumer.connect();

  await consumer.subscribe({
    topic: 'order-events',
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const order = JSON.parse(message.value.toString());
      // Analytics process karo — revenue calculate, reports banao
      console.log(`[ANALYTICS] Order: ${order.orderId}, Amount: Rs.${order.amount}`);
    },
  });
}

startAnalyticsConsumer().catch(console.error);
```

> **Socho Aise:** Ek newspaper (topic) print hota hai. "Notification-group" wale padh ke SMS bhejte hain. "Analytics-group" wale padh ke reports banate hain. Dono ko same newspaper milta hai — independently!

---

## Offset Management — Kahan Tak Padha?

```javascript
// manual-offset.js — Manually offset manage karo
const consumer = kafka.consumer({
  groupId: 'careful-group',
  // Auto-commit band karo for manual control
});

await consumer.run({
  autoCommit: false,  // Khud commit karenge

  eachMessage: async ({ topic, partition, message }) => {
    try {
      const data = JSON.parse(message.value.toString());

      // Heavy processing karo...
      await processOrder(data);

      // Success hone pe manually commit karo
      await consumer.commitOffsets([{
        topic,
        partition,
        offset: (parseInt(message.offset) + 1).toString(),
      }]);
      console.log(`Offset committed: ${message.offset}`);

    } catch (error) {
      console.error('Processing fail hua, offset commit NAHI kiya:', error);
      // Restart pe wapas ye message milega (at-least-once delivery)
    }
  },
});
```

| Commit Strategy | Behavior | Risk |
|----------------|----------|------|
| Auto-commit (default) | Periodic commit (5 sec) | Message loss possible |
| Manual commit after process | Commit on success only | Duplicate possible on crash |
| Batch commit | Batch process then commit | Trade-off: throughput vs safety |

> **Warning:** Auto-commit mein agar consumer crash ho jaye process karne se pehle to message lost ho sakta hai. Critical data ke liye manual commit use karo!

---

## Kafka Admin — Topic Create Karo Programmatically

```javascript
// admin.js — Topics manage karo code se
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'admin-tool',
  brokers: ['localhost:9092'],
});

const admin = kafka.admin();

async function manageTopics() {
  await admin.connect();

  // Naya topic banao
  await admin.createTopics({
    topics: [{
      topic: 'order-events',
      numPartitions: 3,          // 3 partitions
      replicationFactor: 1,      // Local dev mein 1 kaafi hai
    }],
  });
  console.log('Topic ban gaya: order-events');

  // Sab topics dekho
  const topics = await admin.listTopics();
  console.log('Topics:', topics);

  // Topic ki details dekho
  const metadata = await admin.fetchTopicMetadata({ topics: ['order-events'] });
  console.log('Metadata:', JSON.stringify(metadata, null, 2));

  await admin.disconnect();
}

manageTopics().catch(console.error);
```

---

## Kafka vs RabbitMQ — Final Decision Framework

```
Tumhe kya chahiye?
│
├── Task queue? (do kaam, delete karo)
│   └── RabbitMQ ✅
│
├── Complex routing? (exchange patterns)
│   └── RabbitMQ ✅
│
├── Event replay chahiye? (purane events phir padho)
│   └── Kafka ✅
│
├── Multiple consumers independently padhe?
│   └── Kafka ✅ (consumer groups)
│
├── Very high throughput? (lakhs/sec)
│   └── Kafka ✅
│
├── Simple pub-sub, low latency?
│   └── RabbitMQ ✅
│
└── Event sourcing / audit trail?
    └── Kafka ✅
```

> **Tip:** Chhota project + task queue = RabbitMQ. Bada project + event-driven architecture + analytics = Kafka. Bahut bade systems mein dono use hote hain saath mein!

---

## Quick Revision Table

| Concept | Kya Hai | Code/Command |
|---------|---------|-------------|
| KafkaJS Producer | Messages bhejne wala | `kafka.producer()` |
| KafkaJS Consumer | Messages padhne wala | `kafka.consumer({ groupId })` |
| Consumer Group | Consumers ka team | Same groupId = ek group |
| fromBeginning | Purane messages bhi padho | `subscribe({ fromBeginning: true })` |
| Message Key | Partition decide karta hai | `key: userId` |
| Offset Commit | Kahan tak padha mark karo | `consumer.commitOffsets([...])` |
| Auto-commit | Automatic offset save | Default on, risky for critical data |
| Kafka Admin | Topics manage karo | `kafka.admin()` |
| Multiple Groups | Independent consumption | Different groupId = all messages |

---

## Aaj Kya Seekha?

1. **KafkaJS** se producer aur consumer easily bana sakte hain Node.js mein
2. **Consumer Groups** se multiple consumers milke load share karte hain
3. **Different groups** independently same topic padh sakte hain — powerful pattern!
4. **Offset management** critical hai — manual commit safer hai for important data
5. **Message key** se ordering guarantee milti hai partition level pe
6. **Kafka** event streaming ke liye, **RabbitMQ** task queues ke liye — use case pe depend karta hai
