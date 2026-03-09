# Day 107 Morning: Kafka Basics — Topics, Partitions & Architecture

> **Aaj ka plan:** Aaj hum Apache Kafka seekhenge — duniya ka sabse powerful distributed event streaming platform. Samjhenge ki Kafka kya hai, RabbitMQ se kaise alag hai, topics, partitions aur producers kaise kaam karte hain.

---

## Apache Kafka Kya Hai?

Kafka ek **distributed event streaming platform** hai. Ye messages ko **permanently store** karta hai aur **bahut high throughput** pe kaam karta hai.

```
Producers ──events──> [Kafka Cluster] ──events──> Consumers
(Data bhejne wale)   (Distributed Log)            (Data padhne wale)
```

> **Socho Aise:** RabbitMQ ek post office hai (letter deliver ho gaya to khatam), lekin Kafka ek newspaper printing press hai — newspaper print hota hai, subscribe karo to milta hai, aur purane editions bhi archive mein hote hain.

---

## Kafka vs RabbitMQ — Kab Kya Use Kare?

| Feature | RabbitMQ | Kafka |
|---------|----------|-------|
| Message Model | Queue (message ek baar consume) | Log (message store rehta hai) |
| Throughput | Moderate (~50K/sec) | Very High (~1M+/sec) |
| Message Retention | Consume hone pe delete | Configure kar sakte ho (days/forever) |
| Use Case | Task queues, RPC | Event streaming, analytics, logs |
| Routing | Complex (exchanges, bindings) | Simple (topics, partitions) |
| Ordering | Queue level pe guaranteed | Partition level pe guaranteed |
| Consumer Model | Push (broker bhejta hai) | Pull (consumer khud padhta hai) |
| Replay | Nahi mil sakta (delete ho gaya) | Kafka mein purane messages phir padh sakte ho |

> **Yaad Rakho:** RabbitMQ = Task queue (kaam do, ho jaye to delete). Kafka = Event log (sab kuch record karo, jab chaaho padho).

---

## Kafka Architecture Samjho

```
                    ┌─────────────────────────────┐
                    │      Kafka Cluster           │
                    │                               │
                    │  ┌─────────┐  ┌─────────┐   │
                    │  │ Broker 1│  │ Broker 2│   │
                    │  │ (Server)│  │ (Server)│   │
                    │  └─────────┘  └─────────┘   │
                    │                               │
                    │  ┌─────────┐                 │
                    │  │ Broker 3│  (ZooKeeper/    │
                    │  │ (Server)│   KRaft)        │
                    │  └─────────┘                 │
                    └─────────────────────────────┘
```

| Component | Kya Hai | Role |
|-----------|---------|------|
| **Broker** | Kafka server | Messages store karta hai |
| **Cluster** | Multiple brokers | Fault tolerance + scalability |
| **ZooKeeper/KRaft** | Coordinator | Brokers manage karta hai |
| **Topic** | Category/channel | Messages ka group (like DB table) |
| **Partition** | Topic ka subdivision | Parallel processing ke liye |
| **Offset** | Message ka position | Har message ka unique number |

---

## Topics — Messages Ka Category

Topic ek logical channel hai — jaise database mein table.

```
Topic: "orders"         Topic: "payments"       Topic: "notifications"
┌──────────────┐       ┌──────────────┐        ┌──────────────┐
│ Order events │       │ Payment events│        │ Notification │
│ created      │       │ success      │        │ email        │
│ updated      │       │ failed       │        │ sms          │
│ cancelled    │       │ refunded     │        │ push         │
└──────────────┘       └──────────────┘        └──────────────┘
```

> **Tip:** Topic naming convention: `domain.entity.event` — jaise `ecommerce.orders.created`, `payment.transactions.completed`

---

## Partitions — Parallel Power

Ek topic ko multiple partitions mein tod sakte ho. Ye Kafka ki real power hai!

```
Topic: "orders" (3 partitions)

Partition 0: [msg0] [msg3] [msg6] [msg9]  ──> Consumer A
Partition 1: [msg1] [msg4] [msg7] [msg10] ──> Consumer B
Partition 2: [msg2] [msg5] [msg8] [msg11] ──> Consumer C
```

### Partition Key Ka Concept

```javascript
// Bina key ke — round-robin mein jayega (koi bhi partition)
producer.send({ topic: 'orders', messages: [{ value: 'order data' }] });

// Key ke saath — same key hamesha same partition mein jayegi
producer.send({
  topic: 'orders',
  messages: [{
    key: 'user-123',     // Is user ke sab orders ek partition mein
    value: 'order data'
  }]
});
```

> **Yaad Rakho:** Same key = same partition = guaranteed ordering. Agar tumhe user ke orders sequence mein chahiye, to userId ko key banao!

---

## Offsets — Message Ka Address

Har partition mein messages ko ek sequential number milta hai — **offset**.

```
Partition 0:
Offset:  0    1    2    3    4    5    6
       [msg] [msg] [msg] [msg] [msg] [msg] [msg]
                          ^
                    Consumer yahan tak padh chuka hai
                    (committed offset = 3)
```

| Offset Type | Matlab |
|------------|--------|
| **Current Offset** | Consumer abhi yahan tak padh raha hai |
| **Committed Offset** | Yahan tak successfully process ho gaya |
| **Latest Offset** | Queue mein last message |
| **Earliest Offset** | Sabse purana available message |

> **Socho Aise:** Offset ek bookmark hai kitaab mein. Tum jahan tak padhe ho wahan bookmark lagao. Kal phir usi jagah se shuru karo. Ya chahho to chapter 1 se phir padho — Kafka mein ye possible hai!

---

## Kafka Docker Se Chalao

> **Terminal Command:**
> ```bash
> # docker-compose.yml banao (neeche code hai)
> docker-compose up -d
> ```

```yaml
# docker-compose.yml — Kafka + Zookeeper setup
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

---

## KafkaJS — Node.js Client

```bash
# Project setup karo
mkdir kafka-nodejs && cd kafka-nodejs
npm init -y
npm install kafkajs
```

```javascript
// kafka-client.js — Reusable Kafka client
const { Kafka } = require('kafkajs');

// Kafka instance banao
const kafka = new Kafka({
  clientId: 'my-app',          // App ka naam
  brokers: ['localhost:9092'],  // Kafka broker addresses
});

module.exports = kafka;
```

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| Kafka | Event streaming platform | High throughput, persistent log |
| Broker | Kafka server instance | Multiple brokers = cluster |
| Topic | Message category | Jaise DB table — logical grouping |
| Partition | Topic ka subdivision | Parallel processing ka secret |
| Offset | Message position number | Bookmark — kahan tak padha |
| Partition Key | Messages route karne ka key | Same key = same partition = ordering |
| KafkaJS | Node.js Kafka client | `require('kafkajs')` |
| vs RabbitMQ | Queue vs Log | Task queue vs Event stream |

---

## Aaj Kya Seekha?

1. **Kafka** ek distributed event streaming platform hai — messages permanently store hote hain
2. **RabbitMQ** task queues ke liye best hai, **Kafka** event streaming/analytics ke liye
3. **Topics** messages ka category hain, **Partitions** parallel processing deti hain
4. **Offset** har message ka unique position hai — replay possible hai
5. **Partition key** se same entity ke messages ek partition mein jaate hain (ordering guaranteed)
6. **KafkaJS** Node.js ke liye official client hai
