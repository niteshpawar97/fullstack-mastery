# Day 116 Evening: Circuit Breaker, Bulkhead & Resilience Patterns

> **Aaj ka plan:** Ab hum production resilience patterns seekhenge — Circuit Breaker (opossum library), Bulkhead pattern, Timeout pattern, aur Fallback strategies. Ye patterns tumhare microservices ko bulletproof banate hain!

---

## Circuit Breaker Pattern Kya Hai?

### Real World Analogy

```
┌─────────── GHAR KA CIRCUIT BREAKER ──────────┐
│                                                │
│  Electricity normal → Switch ON → Bijli aati   │
│  Overload aaya → Switch TRIP → Bijli band      │
│  Kuch der baad → TEST karo → Theek hai?        │
│  Haan theek → Switch ON → Bijli phir se aati   │
│  Nahi theek → Switch TRIP → Aur wait karo      │
│                                                │
└────────────────────────────────────────────────┘
```

**Software mein bhi exactly same:**

```
┌─────────┐        ┌─────────┐        ┌─────────┐
│ CLOSED  │───────→│  OPEN   │───────→│HALF-OPEN│
│(Normal) │ Errors │(Block   │ Timer  │(Test    │
│         │ exceed │ all     │ expire │ 1-2     │
│ Sab     │ threshold│ requests)│        │ requests)│
│ requests│        │         │        │         │
│ jaate   │        │ Instant │        │ Success?│
│ hain    │        │ fail    │        │→ CLOSED │
│         │        │ return  │        │ Fail?   │
│         │←───────│         │←───────│→ OPEN   │
│         │ Success│         │        │         │
└─────────┘        └─────────┘        └─────────┘
```

> **Socho Aise:** Payment gateway down hai. Circuit breaker CLOSED hai toh har request jaake fail hoga — user ko 10 second wait, server pe load. Circuit breaker OPEN hai toh instantly "Service unavailable" bol dega — user ko fast response, server pe zero load. Smart!

---

## Opossum Library — Circuit Breaker in Node.js

```typescript
// services/paymentService.ts — Circuit breaker lagao
import CircuitBreaker from 'opossum';
import axios from 'axios';

// Actual function jo external API call karta hai
async function callPaymentGateway(orderId: string, amount: number) {
  const response = await axios.post('https://api.razorpay.com/v1/payments', {
    orderId,
    amount,
    currency: 'INR',
  }, {
    timeout: 5000, // 5 second timeout
  });
  return response.data;
}

// Circuit breaker options — behaviour configure karo
const breakerOptions = {
  timeout: 5000,          // 5 sec mein response nahi aaya toh fail
  errorThresholdPercentage: 50, // 50% requests fail → circuit OPEN
  resetTimeout: 30000,    // 30 sec baad HALF-OPEN mein jaao
  rollingCountTimeout: 10000, // 10 sec window mein count karo
  rollingCountBuckets: 10,    // Window ko 10 buckets mein divide karo
  volumeThreshold: 5,     // Minimum 5 requests hone chahiye judgement ke liye
};

// Circuit breaker banao — payment function wrap karo
const paymentBreaker = new CircuitBreaker(callPaymentGateway, breakerOptions);

// Events listen karo — logging ke liye
paymentBreaker.on('open', () => {
  console.log('⚡ Payment circuit OPEN — requests block ho rahe hain');
  alertOpsTeam('Payment gateway circuit opened!');
});

paymentBreaker.on('halfOpen', () => {
  console.log('🔄 Payment circuit HALF-OPEN — testing...');
});

paymentBreaker.on('close', () => {
  console.log('✅ Payment circuit CLOSED — normal operations resumed');
});

paymentBreaker.on('fallback', (result) => {
  console.log('🔙 Fallback triggered:', result);
});

// Fallback function — circuit open hone pe ye chalega
paymentBreaker.fallback(() => {
  return {
    success: false,
    message: 'Payment service temporarily unavailable. Queued for processing.',
    queued: true, // Payment queue mein daal do — baad mein process hoga
  };
});

// Usage — route mein use karo
export async function processPayment(orderId: string, amount: number) {
  // .fire() circuit breaker ke through call karta hai
  return paymentBreaker.fire(orderId, amount);
}
```

> **Yaad Rakho:** Circuit breaker ka `volumeThreshold` important hai. Agar sirf 1 request fail hui toh circuit open nahi hona chahiye. Minimum 5-10 requests ke baad hi judgement lo!

---

## Bulkhead Pattern — Isolation for Safety

```typescript
// patterns/bulkhead.ts — Har service ke liye alag pool
// Bulkhead = ship ke compartments — ek leak hone pe poora ship nahi doobta

interface BulkheadOptions {
  maxConcurrent: number;  // Kitne requests ek saath chal sakte hain
  maxQueue: number;       // Queue mein kitne wait kar sakte hain
}

class Bulkhead {
  private running = 0;
  private queue: Array<{ resolve: Function; reject: Function; fn: Function }> = [];

  constructor(
    private name: string,
    private options: BulkheadOptions
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Agar concurrent limit reach ho gayi
    if (this.running >= this.options.maxConcurrent) {
      // Queue mein jagah hai?
      if (this.queue.length >= this.options.maxQueue) {
        throw new Error(`Bulkhead "${this.name}" full — request rejected`);
      }
      // Queue mein wait karo
      return new Promise((resolve, reject) => {
        this.queue.push({ resolve, reject, fn });
      });
    }

    return this._run(fn);
  }

  private async _run<T>(fn: () => Promise<T>): Promise<T> {
    this.running++;
    try {
      const result = await fn();
      return result;
    } finally {
      this.running--;
      this._processQueue(); // Queue se next item uthao
    }
  }

  private _processQueue() {
    if (this.queue.length > 0 && this.running < this.options.maxConcurrent) {
      const next = this.queue.shift()!;
      this._run(next.fn).then(next.resolve).catch(next.reject);
    }
  }
}

// Har external service ke liye alag bulkhead — isolation!
const paymentBulkhead = new Bulkhead('payment', { maxConcurrent: 10, maxQueue: 50 });
const emailBulkhead = new Bulkhead('email', { maxConcurrent: 5, maxQueue: 100 });
const smsBulkhead = new Bulkhead('sms', { maxConcurrent: 3, maxQueue: 20 });

// Usage — payment slow hai toh bhi email aur SMS chalte rahenge
async function handleOrder(order: Order) {
  // Ye teeno isolated hain — ek fail toh doosre pe asar nahi
  const paymentResult = await paymentBulkhead.execute(() =>
    processPayment(order.id, order.amount)
  );
  await emailBulkhead.execute(() =>
    sendOrderConfirmation(order.userEmail, order)
  );
  await smsBulkhead.execute(() =>
    sendOrderSMS(order.userPhone, order.id)
  );
}
```

> **Socho Aise:** Bulkhead aise samjho — ek building mein aag lagi toh fire doors band ho jaate hain, aag ek floor pe ruk jaati hai. Waise hi agar payment service slow hai toh sirf payment ka pool full hoga, email aur SMS normally chalte rahenge!

---

## Timeout Pattern — Wait Mat Karo Forever

```typescript
// patterns/timeout.ts — Har call pe time limit lagao
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Timer lagao — agar promise time pe resolve nahi hua toh reject karo
    const timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    // Promise resolve ya reject hone pe timer cancel karo
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// Usage — har external call pe timeout lagao
async function getUserProfile(userId: string) {
  // DB call pe 2 second limit
  const user = await withTimeout(
    db.users.findById(userId),
    2000,
    'getUserProfile-DB'
  );

  // External API pe 5 second limit
  const preferences = await withTimeout(
    externalApi.getPreferences(userId),
    5000,
    'getUserPreferences-API'
  );

  return { ...user, preferences };
}
```

> **Warning:** Bina timeout ke ek slow service poore system ko freeze kar sakti hai. Hamesha timeout lagao — DB calls pe 2-3 sec, external APIs pe 5-10 sec, internal services pe 1-2 sec!

---

## Fallback Strategies — Plan B Hamesha Ready

```typescript
// strategies/fallback.ts — Multiple fallback options
async function getProductPrice(productId: string): Promise<number> {
  try {
    // Strategy 1: Primary database
    return await primaryDB.getPrice(productId);
  } catch {
    console.warn('Primary DB failed, trying cache...');
    try {
      // Strategy 2: Redis cache — stale data better than no data
      const cached = await redis.get(`price:${productId}`);
      if (cached) return JSON.parse(cached);
    } catch {
      console.warn('Cache bhi fail, trying local fallback...');
    }
    // Strategy 3: Local in-memory fallback — last resort
    const localPrice = localPriceMap.get(productId);
    if (localPrice) return localPrice;

    // Strategy 4: Default price — better than error
    console.error('All fallbacks failed, returning default');
    return 0; // Ya -1 return karo jo "price unavailable" indicate kare
  }
}
```

---

## Sab Patterns Ek Saath — Resilient Service Call

```typescript
// Combine: Circuit Breaker + Bulkhead + Timeout + Retry + Fallback
async function resilientServiceCall<T>(
  serviceName: string,
  fn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  // Bulkhead se isolate karo
  return bulkheads[serviceName].execute(async () => {
    // Circuit breaker se protect karo
    return circuitBreakers[serviceName].fire(async () => {
      // Timeout lagao
      return withTimeout(
        // Retry with backoff
        retryWithBackoff(fn, { maxRetries: 2, baseDelay: 500, maxDelay: 5000, backoffFactor: 2 }),
        10000, // 10 sec overall timeout
        serviceName
      );
    });
  }).catch(() => fallbackFn()); // Sab fail toh fallback
}
```

---

## Quick Revision Table

| Pattern | Kya Karta Hai | Real World Analogy |
|---------|--------------|-------------------|
| Circuit Breaker | Failed service ko block karo | Ghar ka electrical breaker |
| Bulkhead | Services isolate karo | Ship ke compartments |
| Timeout | Wait limit lagao | Restaurant mein 30 min max wait |
| Retry + Backoff | Thodi der baad dobara try | Busy phone pe redial |
| Fallback | Backup plan use karo | UPS jab bijli jaaye |
| Opossum | Node.js circuit breaker lib | Production-ready tool |

---

## Aaj Kya Seekha?

1. **Circuit Breaker** failed services ko block karta hai — cascading failure rokta hai
2. **Opossum** library se Node.js mein circuit breaker implement hota hai — events, fallback, metrics sab milta hai
3. **Bulkhead** pattern services ko isolate karta hai — ek fail toh doosre safe
4. **Timeout** har external call pe lagao — slow calls se system freeze nahi hoga
5. **Fallback** hamesha rakho — primary fail toh cache, cache fail toh default

> **Practice Time!** Opossum install karo (`npm i opossum`) aur ek Express route banao jo external API call kare circuit breaker ke saath. Manually API URL galat do — dekho circuit kaise open hota hai aur fallback kaise trigger hota hai!
