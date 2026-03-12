# Day 115 Evening: Event-Driven Architecture (EDA)

> **Aaj ka plan:** Ab hum Event-Driven Architecture samjhenge — modern microservices ka backbone. Events kaise design karte hain, event bus kaise banate hain, aur eventual consistency kaise handle karte hain.

---

## Event-Driven Architecture Kya Hai?

### Traditional vs Event-Driven

**Traditional (Request-Response):**
```
Order Service → [Direct Call] → Payment Service → [Direct Call] → Notification Service
// Sab tightly coupled — ek fail toh sab fail!
```

**Event-Driven:**
```
Order Service → [Event: OrderCreated] → Event Bus
                                           ├→ Payment Service (listens)
                                           ├→ Notification Service (listens)
                                           ├→ Analytics Service (listens)
                                           └→ Inventory Service (listens)
// Loosely coupled — services independently react karte hain
```

> **Socho Aise:** Traditional = Ek teacher har student ko individually jaake bolta hai "exam hai kal." Event-driven = Teacher notice board pe likh deta hai "exam hai kal" — jo dekhega wo tayyari karega. Teacher ko pata bhi nahi hona chahiye kitne students ne padha!

---

## Core EDA Concepts

### Event Kya Hai?

```typescript
// Event = "Kuch hua" ka record — past tense mein naam hota hai
interface DomainEvent {
  eventId: string;        // Unique identifier
  eventType: string;      // Kya hua — "OrderCreated", "PaymentReceived"
  aggregateId: string;    // Kis entity se related — orderId
  timestamp: Date;        // Kab hua
  version: number;        // Event schema version
  data: any;              // Event ka data
  metadata: {
    correlationId: string; // Request tracing ke liye
    userId: string;        // Kisne trigger kiya
    source: string;        // Kaunsi service se aaya
  };
}

// Example Events
const orderCreated: DomainEvent = {
  eventId: 'evt_001',
  eventType: 'OrderCreated',
  aggregateId: 'order_123',
  timestamp: new Date(),
  version: 1,
  data: {
    farmerId: 'F001',
    products: [{ name: 'Wheat Seeds', qty: 50, price: 120 }],
    totalAmount: 6000,
  },
  metadata: {
    correlationId: 'req_abc123',
    userId: 'farmer_F001',
    source: 'order-service',
  },
};
```

> **Yaad Rakho:** Events hamesha past tense mein likhte hain — OrderCreated (not CreateOrder), PaymentReceived (not ReceivePayment). Kyunki event "kuch HO CHUKA hai" ka record hai!

---

## Event Bus Implementation

```typescript
// Simple in-memory event bus — learning ke liye
// Production mein RabbitMQ, Kafka, Redis Streams use karo

type EventHandler = (event: DomainEvent) => Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventStore: DomainEvent[] = []; // Event sourcing ke liye
  
  // Subscribe — kis event pe kya karna hai
  on(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
    console.log(`Handler registered for: ${eventType}`);
  }
  
  // Publish — event broadcast karo
  async emit(event: DomainEvent): Promise<void> {
    // Event store mein save karo (audit trail)
    this.eventStore.push(event);
    console.log(`Event emitted: ${event.eventType} [${event.eventId}]`);
    
    // Sab registered handlers ko call karo
    const handlers = this.handlers.get(event.eventType) || [];
    
    // Parallel mein execute karo — ek fail ho toh baaki chale
    const results = await Promise.allSettled(
      handlers.map(handler => handler(event))
    );
    
    // Failed handlers log karo
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Handler ${index} failed for ${event.eventType}:`, result.reason);
        // Dead letter queue mein daalo — baad mein retry
      }
    });
  }
  
  // Event replay — debugging ya new service ke liye
  async replay(fromTimestamp?: Date): Promise<void> {
    const events = fromTimestamp
      ? this.eventStore.filter(e => e.timestamp >= fromTimestamp)
      : this.eventStore;
    
    console.log(`Replaying ${events.length} events...`);
    for (const event of events) {
      await this.emit(event);
    }
  }
}

// Singleton instance
export const eventBus = new EventBus();
```

---

## Services Ko Connect Karo

```typescript
// === Order Service — Events publish karta hai ===
import { eventBus } from './eventBus';

class OrderService {
  async createOrder(orderData: any) {
    // Step 1: Order save karo database mein
    const order = await db.orders.create({
      ...orderData,
      status: 'PENDING',
    });
    
    // Step 2: Event publish karo — "Order ban gaya!"
    await eventBus.emit({
      eventId: `evt_${Date.now()}`,
      eventType: 'OrderCreated',
      aggregateId: order.id,
      timestamp: new Date(),
      version: 1,
      data: {
        orderId: order.id,
        farmerId: order.farmerId,
        products: order.products,
        totalAmount: order.totalAmount,
      },
      metadata: {
        correlationId: `corr_${Date.now()}`,
        userId: order.farmerId,
        source: 'order-service',
      },
    });
    
    return order;
    // Order service ka kaam khatam — payment, notification
    // ki chinta nahi hai isko!
  }
}

// === Payment Service — OrderCreated event sun ke payment start karega ===
eventBus.on('OrderCreated', async (event) => {
  console.log(`Payment service: Order ${event.data.orderId} ka payment shuru`);
  
  // Payment process karo
  const payment = await processPayment({
    orderId: event.data.orderId,
    amount: event.data.totalAmount,
  });
  
  // Payment done ka event publish karo
  await eventBus.emit({
    eventId: `evt_${Date.now()}`,
    eventType: 'PaymentReceived',
    aggregateId: event.data.orderId,
    timestamp: new Date(),
    version: 1,
    data: {
      orderId: event.data.orderId,
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
    },
    metadata: {
      correlationId: event.metadata.correlationId, // Same correlation ID
      userId: event.metadata.userId,
      source: 'payment-service',
    },
  });
});

// === Notification Service — Multiple events sun ke notify karega ===
eventBus.on('OrderCreated', async (event) => {
  await sendSMS(event.data.farmerId, `Order #${event.data.orderId} received!`);
});

eventBus.on('PaymentReceived', async (event) => {
  await sendSMS(event.metadata.userId, `Payment ₹${event.data.amount} successful!`);
});

// === Inventory Service — Stock update karega ===
eventBus.on('OrderCreated', async (event) => {
  for (const product of event.data.products) {
    await updateStock(product.name, -product.qty);
    console.log(`Stock updated: ${product.name} — ${product.qty} units reserved`);
  }
});
```

> **Tip:** `correlationId` hamesha propagate karo events mein. Isse ek user request ka poora flow trace kar sakte ho across all services — debugging mein life saver hai!

---

## Eventual Consistency

```typescript
// EDA mein data EVENTUALLY consistent hota hai — immediately nahi

// Scenario: Farmer ne order diya
// Time 0ms:   Order Service — order saved ✅
// Time 100ms: Payment Service — payment processing... ⏳
// Time 200ms: User checks order — status: "PENDING" (payment abhi nahi hua)
// Time 500ms: Payment done! PaymentReceived event aaya
// Time 600ms: Order status updated to "PAID" ✅
// Time 700ms: User checks again — status: "PAID" ✅

// PROBLEM: 200ms pe user ko "PENDING" dikha — confusion!
// SOLUTION: UI mein clearly batao — "Processing..."

// API response mein status explanation do
app.get('/api/orders/:id', async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  
  res.json({
    ...order,
    statusMessage: getStatusMessage(order.status),
  });
});

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'PENDING': 'Aapka order process ho raha hai... 1-2 minute lagenge.',
    'PAYMENT_PROCESSING': 'Payment verify ho raha hai...',
    'PAID': 'Payment successful! Order prepare ho raha hai.',
    'SHIPPED': 'Order ship ho gaya! Jald deliver hoga.',
    'DELIVERED': 'Order deliver ho gaya! Dhanyavaad.',
  };
  return messages[status] || 'Status update soon...';
}
```

> **Yaad Rakho:** Eventual consistency = data EVENTUALLY sahi ho jaayega, lekin turant nahi. User ko clearly communicate karo ki process ho raha hai. "Loading..." ya "Processing..." dikhao — blank screen mat do!

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| Event | "Kuch hua" ka record | OrderCreated, PaymentReceived |
| Event Bus | Events route karta hai | RabbitMQ, Kafka, Redis Streams |
| Publisher | Event bhejne wala | Order Service |
| Subscriber | Event sunne wala | Payment, Notification Service |
| Correlation ID | Request flow tracking | Same ID across all services |
| Event Sourcing | Events se state rebuild | Replay events to rebuild data |
| Eventual Consistency | Data time ke saath consistent | Not immediate, but guaranteed |
| Dead Letter Queue | Failed events ka storage | Retry later |

---

## Aaj Kya Seekha?

1. **EDA** mein services events ke through communicate karte hain — loosely coupled
2. **Events past tense** mein name karo — OrderCreated, not CreateOrder
3. **Event Bus** events ko route karta hai — publishers aur subscribers ko connect karta hai
4. **Correlation ID** propagate karo — cross-service debugging ke liye essential
5. **Eventual consistency** real hai — UI mein processing states clearly dikhao

> **Practice Time!** EventBus class ko extend karo: (1) Dead Letter Queue add karo — failed events store karo, (2) Event filtering add karo — subscribers ko sirf specific data wale events mile, (3) Event replay feature test karo!
