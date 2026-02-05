# Day 73 Morning: AWS Lambda + Background Jobs (Bull/Redis)

> **Aaj ka plan:** Aaj hum do powerful concepts seekhenge — AWS Lambda (serverless computing, bina server manage kiye code chalao) aur Bull Queue with Redis (background jobs jaise email sending, image processing). Dono production apps mein bahut use hote hain.

---

## Serverless Computing Kya Hai?

### Traditional vs Serverless

```
Traditional (EC2):
- Server 24/7 chalta hai (busy ho ya idle)
- Tum manage karo: OS updates, scaling, security
- Pay: Har second ke liye (chahe use ho ya na ho)

Serverless (Lambda):
- Code sirf tab chalta hai jab zaroorat ho
- AWS manage kare: scaling, security, infra
- Pay: Sirf execution time ke liye (per millisecond)
```

> **Socho Aise:** EC2 = apna ghar (rent 24/7 dena padta hai, chahe ghar mein ho ya bahar). Lambda = hotel room (sirf jab use karo tab pay karo, baaki waqt free).

### Kab Lambda Use Karo?

| Use Case | Lambda? | Kyu? |
|----------|---------|------|
| Image resize on upload | Yes | Event-driven, occasional |
| Send welcome email | Yes | Short task, per-event |
| REST API (low traffic) | Yes | Cost-effective |
| REST API (high traffic) | Maybe | EC2 sasta pad sakta hai |
| WebSocket server | No | Long-running connection |
| Video processing (30 min) | No | Lambda max 15 min |

---

## AWS Lambda — Core Concepts

| Concept | Kya Hai | Limit |
|---------|---------|-------|
| **Function** | Tumhara code (ek function) | 250MB package, 15 min max |
| **Trigger** | Kya event function chalayega | API Gateway, S3, SQS, Schedule |
| **Runtime** | Language environment | Node.js, Python, Java, Go, etc. |
| **Cold Start** | Pehli baar invoke mein delay | 100ms-2s (runtime pe depend) |
| **Concurrency** | Kitne simultaneous executions | Default 1000 per region |
| **Layers** | Shared libraries | Dependencies alag rakh sakte ho |

### Cold Start Kya Hai?

```
First Request (Cold Start):
Request → [Container Setup (1-2s)] → [Code Load] → [Execute] → Response
Total: ~2-3 seconds

Subsequent Requests (Warm):
Request → [Execute] → Response
Total: ~50-100ms

After 15 min idle:
Container destroy ho jata hai → Next request = cold start again
```

> **Yaad Rakho:** Cold start Node.js mein ~300-500ms hota hai. Java mein 2-5 seconds. Agar low latency chahiye to Lambda ko "warm" rakhne ke liye Provisioned Concurrency use karo (paid).

---

## Lambda Function Banana

### AWS Console Se

```
Lambda Console → Create Function

1. Function name: kisan-crop-price
2. Runtime: Node.js 20.x
3. Architecture: arm64 (sasta + fast)
4. Execution role: Create new role with basic Lambda permissions
5. Create Function
```

### Lambda Handler Code

```javascript
// index.mjs (Lambda function)
// Crop price check karne wali serverless function

// Handler — ye function har request pe chalega
export const handler = async (event) => {
    console.log('Event received:', JSON.stringify(event));

    // Query parameters se crop name lo
    const crop = event.queryStringParameters?.crop || 'gehu';

    // Crop prices database (example)
    const prices = {
        gehu: { name: 'Gehu (Wheat)', price: 2275, unit: 'per quintal' },
        dhan: { name: 'Dhan (Rice)', price: 2183, unit: 'per quintal' },
        makka: { name: 'Makka (Corn)', price: 1962, unit: 'per quintal' },
        sarson: { name: 'Sarson (Mustard)', price: 5650, unit: 'per quintal' }
    };

    const cropData = prices[crop.toLowerCase()];

    if (!cropData) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: `Crop "${crop}" nahi mila`,
                available: Object.keys(prices)
            })
        };
    }

    // Successful response
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'   // CORS
        },
        body: JSON.stringify({
            success: true,
            data: {
                ...cropData,
                date: new Date().toISOString(),
                source: 'Kisan Lambda API'
            }
        })
    };
};
```

> **Yaad Rakho:** Lambda function hamesha ek `event` object receive karta hai aur response return karta hai. Response mein `statusCode`, `headers`, aur `body` (stringified) zaroori hai jab API Gateway use ho.

---

## API Gateway + Lambda

### REST API Banana

```
API Gateway Console → Create API → REST API → Build

1. API name: kisan-serverless-api
2. Create API

3. Create Resource: /crops
4. Create Method: GET → Lambda Function → kisan-crop-price

5. Deploy API:
   Stage name: prod
   Deploy

6. URL milega: https://abc123.execute-api.ap-south-1.amazonaws.com/prod/crops
```

### Test Karo

```bash
# API Gateway URL se test
curl "https://abc123.execute-api.ap-south-1.amazonaws.com/prod/crops?crop=gehu"
```

> **Expected Output:**
```json
{
    "success": true,
    "data": {
        "name": "Gehu (Wheat)",
        "price": 2275,
        "unit": "per quintal",
        "date": "2026-04-04T10:00:00.000Z",
        "source": "Kisan Lambda API"
    }
}
```

---

## Lambda + S3 Trigger — Image Resize

```javascript
// image-resizer/index.mjs
// S3 pe image upload hone pe automatically resize karo

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';  // Image processing library (Lambda layer mein add karo)

const s3 = new S3Client({});

export const handler = async (event) => {
    // S3 event se file info nikalo
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    console.log(`Nayi image aayi: ${key} in bucket ${bucket}`);

    // Skip agar already thumbnail hai
    if (key.startsWith('thumbnails/')) return;

    try {
        // Original image download karo
        const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
        const original = await s3.send(getCommand);
        const imageBuffer = Buffer.from(await original.Body.transformToByteArray());

        // Resize karo (300x300 thumbnail)
        const thumbnail = await sharp(imageBuffer)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Thumbnail save karo
        const thumbnailKey = `thumbnails/${key}`;
        const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: thumbnailKey,
            Body: thumbnail,
            ContentType: 'image/jpeg'
        });
        await s3.send(putCommand);

        console.log(`Thumbnail ban gaya: ${thumbnailKey}`);
        return { statusCode: 200, body: 'Thumbnail created' };
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
};
```

> **Tip:** S3 trigger se Lambda ko invoke karo — koi image upload ho to automatically thumbnail ban jaye. Ye serverless event-driven architecture ka classic example hai!

---

## Background Jobs — Bull Queue + Redis

### Background Jobs Kyu Chahiye?

```
Problem: User ne "Send Email" button click kiya
→ Email bhejne mein 3-5 seconds lagte hain
→ User ko 3-5 seconds wait karna padega
→ BAD User Experience!

Solution: Background Job
→ User clicks "Send Email"
→ Job queue mein add karo (instant — 10ms)
→ User ko turant response: "Email bhej rahe hain!"
→ Background worker separately email bhejta hai
→ GREAT User Experience!
```

> **Socho Aise:** Restaurant mein order dete ho to waiter turant order note karta hai aur tum baith ke relax karte ho (instant response). Kitchen mein chef separately khaana bana raha hai (background job). Waiter tumhare saamne khaana nahi pakata!

### Bull Queue + Redis Architecture

```
[Express API] → [Bull Queue (Redis)] → [Worker Process]
     |                  |                      |
  Request aaya     Job stored here       Job execute karta hai
  Instant response    FIFO queue          Email, image process, etc.
```

### Setup

```bash
npm install bull ioredis
# Redis running hona chahiye (local ya AWS ElastiCache)
```

---

## Bull Queue Implementation

```javascript
// queues/emailQueue.js
// Email sending ke liye background job queue

const Bull = require('bull');

// Queue banao (Redis se connect hota hai)
const emailQueue = new Bull('email-queue', {
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
    }
});

// Job add karo queue mein
async function addEmailJob(emailData) {
    const job = await emailQueue.add('send-email', {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        template: emailData.template
    }, {
        attempts: 3,           // 3 baar try karo fail hone pe
        backoff: {
            type: 'exponential',
            delay: 2000          // 2s, 4s, 8s wait between retries
        },
        removeOnComplete: true, // Success pe queue se hata do
        removeOnFail: false     // Fail pe investigation ke liye rakho
    });

    console.log(`Email job add hua — ID: ${job.id}`);
    return job;
}

// Delayed job — 1 ghante baad bhejo
async function addDelayedEmail(emailData, delayMs) {
    const job = await emailQueue.add('send-email', emailData, {
        delay: delayMs,          // e.g., 3600000 = 1 hour
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
    });

    console.log(`Delayed email job — ${delayMs}ms baad chalega — ID: ${job.id}`);
    return job;
}

// Scheduled/Recurring job (cron)
async function addRecurringReport() {
    await emailQueue.add('daily-report', {
        type: 'daily-crop-prices',
        recipients: ['admin@kisanapp.com']
    }, {
        repeat: {
            cron: '0 8 * * *'    // Har din subah 8 baje
        }
    });
    console.log('Daily report job scheduled');
}

module.exports = { emailQueue, addEmailJob, addDelayedEmail, addRecurringReport };
```

---

## Worker — Jobs Process Karo

```javascript
// workers/emailWorker.js
// Background worker jo email jobs process karta hai

const { emailQueue } = require('../queues/emailQueue');

// Job processor — ye har job ke liye chalega
emailQueue.process('send-email', async (job) => {
    const { to, subject, body } = job.data;

    console.log(`Email bhej rahe hain: ${to} — Subject: ${subject}`);

    // Email bhejne ka actual logic (simulation)
    await simulateSendEmail(to, subject, body);

    console.log(`Email bhej diya: ${to}`);
    return { sent: true, to, timestamp: new Date().toISOString() };
});

// Daily report processor
emailQueue.process('daily-report', async (job) => {
    console.log('Daily crop price report generate ho raha hai...');
    // Report generate + email logic
    return { report: 'generated', date: new Date().toISOString() };
});

// Event listeners — monitoring ke liye
emailQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} complete hua:`, result);
});

emailQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} fail hua:`, err.message);
    // Alert bhejo — Slack/email notification
});

emailQueue.on('stalled', (job) => {
    console.warn(`Job ${job.id} stalled ho gaya — check karo!`);
});

// Email send simulation
async function simulateSendEmail(to, subject, body) {
    // Real mein nodemailer ya SendGrid use karo
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay simulate
    if (Math.random() < 0.1) {
        throw new Error('Email service temporarily unavailable');  // 10% fail rate
    }
}

console.log('Email worker start hua — jobs ka wait kar raha hai...');
```

### Retry Strategies

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `fixed` | Har retry ke beech same delay | Simple retry |
| `exponential` | 2s → 4s → 8s → 16s | API rate limits |
| Custom | Apna logic likho | Complex scenarios |

> **Yaad Rakho:** Exponential backoff sabse common strategy hai — har retry ke beech wait double ho jata hai. Isse overwhelmed server ko recover hone ka time milta hai.

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| Lambda | Serverless function | Pay per execution, max 15 min |
| Cold Start | First invoke delay | ~300-500ms Node.js, ~2-5s Java |
| API Gateway | HTTP endpoint for Lambda | REST API banao Lambda ke upar |
| S3 Trigger | S3 event → Lambda invoke | Image upload → auto resize |
| Bull Queue | Job queue library (Node.js) | Redis-backed, reliable |
| Worker | Job processor | Background mein chalta hai |
| Retry | Failed job phir se try | Exponential backoff recommended |
| Delayed Job | Future mein execute | `delay: 3600000` (1 hour) |
| Recurring Job | Cron schedule pe | `repeat: { cron: '0 8 * * *' }` |

---

## Aaj Kya Seekha?

1. **Serverless computing** mein server manage nahi karna — AWS handle karta hai, tum sirf code likho
2. **Lambda functions** event-driven hain — S3 upload, API call, schedule pe trigger hote hain
3. **Cold start** pehli request pe delay deta hai — warm rakhne ke techniques hain
4. **API Gateway + Lambda** se REST API bana sakte ho bina server ke
5. **Background jobs** se heavy tasks (email, image processing) user request se alag hote hain
6. **Bull Queue + Redis** Node.js ka popular job queue hai — retry, delay, scheduling sab built-in
7. **Exponential backoff** retry strategy hai — failed jobs ko increasing delay ke saath retry karo
8. **Workers** alag process mein chalne chahiye — main app block nahi hona chahiye
