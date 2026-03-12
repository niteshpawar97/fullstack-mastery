# Day 115 Morning: Webhooks — Building & Consuming

> **Aaj ka plan:** Aaj hum Webhooks samjhenge — kaise kaam karte hain, kaise banate hain, aur kaise securely consume karte hain. Razorpay, GitHub, Stripe jaise services webhooks use karte hain!

---

## Webhooks Kya Hain?

### Polling vs Webhooks

**Polling (Purana Tarika):**
```
Tum: "Payment hua kya?" → Server: "Nahi"
(2 sec baad)
Tum: "Payment hua kya?" → Server: "Nahi"  
(2 sec baad)
Tum: "Payment hua kya?" → Server: "Nahi"
(2 sec baad)
Tum: "Payment hua kya?" → Server: "HAAN!"
// 4 unnecessary requests waste ho gayi!
```

**Webhook (Modern Tarika):**
```
Tum: "Jab payment ho, mujhe bata dena. Ye raha mera URL."
(Kuch time baad...)
Server → Tumhara URL: "Payment ho gaya! Ye raha details."
// Sirf 1 request — jab zaroorat thi tab!
```

> **Socho Aise:** Polling = Har 5 minute post office jaake poochna "mera parcel aaya kya?" Webhook = Post office ko bolna "parcel aaye toh mere ghar pe deliver kar dena." Smart hai na!

---

## Webhook Architecture

```
┌─────────────┐      Event hota hai       ┌──────────────┐
│  External    │  ─── HTTP POST ────────>  │  Tumhara     │
│  Service     │      (webhook URL pe)     │  Server      │
│  (Razorpay)  │                           │  /webhooks   │
└─────────────┘                            └──────────────┘
                                                  │
                                           Process event
                                           Update database
                                           Send notification
```

---

## Webhook Consumer Banana

### Step 1: Basic Webhook Endpoint

```typescript
// Razorpay payment webhook receive karo
import express from 'express';
import crypto from 'crypto';

const app = express();

// IMPORTANT: Webhook ke liye raw body chahiye signature verify karne ke liye
app.use('/webhooks', express.raw({ type: 'application/json' }));
// Baaki routes ke liye normal JSON parser
app.use(express.json());

// Webhook endpoint — Razorpay yahan POST karega
app.post('/webhooks/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = req.body; // Raw buffer
  
  // Step 1: Signature verify karo — authenticity check
  const isValid = verifyRazorpaySignature(body, signature);
  
  if (!isValid) {
    console.error('Invalid webhook signature! Fake request ho sakti hai.');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Step 2: Event parse karo
  const event = JSON.parse(body.toString());
  console.log(`Webhook received: ${event.event}`);
  
  // Step 3: Event type ke hisaab se handle karo
  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload.payment.entity);
      break;
    case 'payment.failed':
      await handlePaymentFailed(event.payload.payment.entity);
      break;
    case 'refund.created':
      await handleRefundCreated(event.payload.refund.entity);
      break;
    default:
      console.log(`Unhandled event: ${event.event}`);
  }
  
  // Step 4: 200 return karo JALDI — nahi toh service retry karega
  res.status(200).json({ received: true });
});

function verifyRazorpaySignature(body: Buffer, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  
  // HMAC-SHA256 se expected signature calculate karo
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  // Timing-safe comparison — timing attack prevent karo
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

> **Warning:** Webhook endpoint hamesha `200 OK` jaldi return karo. Agar 5+ seconds laga toh sender service timeout maan ke retry karega. Heavy processing background queue mein karo!

---

## Idempotency — Duplicate Webhooks Handle Karo

```typescript
// Problem: Razorpay same webhook 2-3 baar bhej sakta hai (retry)
// Solution: Idempotency — same event ko dobara process mat karo

async function handlePaymentCaptured(payment: any) {
  const eventId = payment.id; // Unique payment ID
  
  // Check karo — ye event pehle process ho chuka hai kya?
  const alreadyProcessed = await redis.get(`webhook:processed:${eventId}`);
  
  if (alreadyProcessed) {
    console.log(`Event ${eventId} already processed — skip kar rahe hain`);
    return; // Duplicate hai — kuch mat karo
  }
  
  // Process karo — order status update
  await db.orders.update(
    { paymentId: payment.id },
    { status: 'PAID', paidAt: new Date() }
  );
  
  // Mark as processed — 24 hours ke liye yaad rakho
  await redis.setex(`webhook:processed:${eventId}`, 86400, 'done');
  
  // Farmer ko notify karo
  await notifyFarmer(payment.notes.farmerId, 'Payment successful!');
  
  console.log(`Payment processed: ${payment.id}, Amount: ₹${payment.amount / 100}`);
}
```

> **Yaad Rakho:** Webhooks GUARANTEED ek hi baar nahi aate. Network issues, timeouts ki wajah se retry hota hai. Tumhara system idempotent hona chahiye — same event 10 baar aaye toh bhi result same ho!

---

## Webhook Provider Banana

### Dusro Ko Webhooks Bhejo

```typescript
// Tumhara system bhi webhooks bhej sakta hai — jab order status change ho
import axios from 'axios';
import crypto from 'crypto';

interface WebhookSubscription {
  id: string;
  url: string;          // Customer ka endpoint
  events: string[];     // Kaunse events chahiye
  secret: string;       // Signature ke liye
  active: boolean;
}

// Webhook bhejne ka function
async function sendWebhook(subscription: WebhookSubscription, event: string, data: any) {
  const payload = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
    webhookId: `wh_${Date.now()}`,
  });
  
  // Signature generate karo — receiver verify kar sake
  const signature = crypto
    .createHmac('sha256', subscription.secret)
    .update(payload)
    .digest('hex');
  
  try {
    const response = await axios.post(subscription.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
      },
      timeout: 10000, // 10 second timeout
    });
    
    console.log(`Webhook sent to ${subscription.url}: ${response.status}`);
    
    // Success log karo
    await logWebhookDelivery(subscription.id, event, 'SUCCESS', response.status);
    
  } catch (error: any) {
    console.error(`Webhook failed: ${subscription.url} — ${error.message}`);
    
    // Fail log karo — retry queue mein daalo
    await logWebhookDelivery(subscription.id, event, 'FAILED', error.response?.status);
    await retryQueue.add('retry-webhook', { subscription, event, data, attempt: 1 });
  }
}

// Retry logic — exponential backoff
async function retryWebhookDelivery(job: any) {
  const { subscription, event, data, attempt } = job.data;
  
  if (attempt > 5) {
    console.error(`Webhook permanently failed after 5 attempts: ${subscription.url}`);
    // Subscription disable karo ya admin ko alert bhejo
    await disableSubscription(subscription.id);
    return;
  }
  
  // Retry karo
  await sendWebhook(subscription, event, data);
}
```

> **Tip:** Webhook provider banate waqt hamesha retry mechanism rakho, signature bhejo, aur delivery logs maintain karo. Customer ko dashboard pe dikhao ki kaunse webhooks deliver hue aur kaunse fail!

---

## Webhook Registration API

```typescript
// Customers apne webhook URLs register karein
app.post('/api/webhooks/subscribe', authMiddleware, async (req, res) => {
  const { url, events } = req.body;
  
  // URL validate karo — HTTPS zaroori hai
  if (!url.startsWith('https://')) {
    return res.status(400).json({ error: 'HTTPS URL zaroori hai!' });
  }
  
  // Secret generate karo
  const secret = crypto.randomBytes(32).toString('hex');
  
  const subscription = {
    id: `sub_${Date.now()}`,
    userId: req.user.id,
    url,
    events,         // ['order.created', 'order.paid', 'order.shipped']
    secret,
    active: true,
    createdAt: new Date(),
  };
  
  await db.webhookSubscriptions.create(subscription);
  
  // Secret sirf ek baar dikhao — baad mein nahi milega
  res.status(201).json({
    message: 'Webhook registered!',
    subscriptionId: subscription.id,
    secret,  // Customer ko save karna hoga — verify ke liye
    warning: 'Secret save kar lo — dobara nahi milega!',
  });
});
```

---

## Quick Revision Table

| Concept | Kya Hai | Important Point |
|---------|---------|----------------|
| Webhook | HTTP callback on events | Event-driven, no polling |
| Signature | HMAC verification | Authenticity check |
| Idempotency | Duplicate safe processing | Same event = same result |
| Retry | Failed delivery dobara | Exponential backoff |
| Raw Body | Unparsed request body | Signature verify ke liye zaroori |
| 200 OK fast | Quick acknowledgment | Heavy work queue mein |

---

## Aaj Kya Seekha?

1. **Webhooks** polling se better hain — event-driven, efficient, real-time
2. **Signature verification** zaroori hai — nahi toh koi bhi fake request bhej sakta hai
3. **Idempotency** implement karo — webhooks duplicate aa sakte hain
4. **200 OK jaldi return karo** — heavy processing background queue mein daalo
5. **Webhook provider** banate waqt retry mechanism aur delivery logs zaroori hain

> **Practice Time!** Ek Express app banao jo GitHub webhook receive kare. GitHub repo mein Settings → Webhooks pe jaake apna ngrok URL set karo. Jab push event aaye toh console pe log karo!
