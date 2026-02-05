# Day 73 Evening: Practice — Lambda Function + Bull Queue Setup

> **Aaj ka plan:** Ab hum hands-on practice karenge — AWS Lambda function banayenge aur API Gateway se trigger karenge. Phir Bull queue se email sending simulation set karenge with delayed jobs.

---

## Practice 1: AWS Lambda Function Create Karo

### Step 1 — Lambda Function Banao

```
AWS Console → Lambda → Create Function

1. Author from scratch
2. Function name: kisan-weather-alert
3. Runtime: Node.js 20.x
4. Architecture: arm64
5. Permissions: Create new role
6. Create Function
```

### Step 2 — Function Code Likho

```javascript
// Lambda Console mein Code editor mein paste karo
// index.mjs

// Weather alert function — kisan ko mausam ki jaankari deta hai
export const handler = async (event) => {
    console.log('Event:', JSON.stringify(event));

    // Query parameters ya body se data lo
    let city = 'Delhi';
    let crop = 'gehu';

    if (event.queryStringParameters) {
        city = event.queryStringParameters.city || city;
        crop = event.queryStringParameters.crop || crop;
    }

    // Weather data (simulated — real mein weather API call hogi)
    const weatherData = {
        Delhi: { temp: 32, humidity: 45, condition: 'Sunny', rainfall: 0 },
        Lucknow: { temp: 34, humidity: 55, condition: 'Partly Cloudy', rainfall: 0 },
        Jaipur: { temp: 38, humidity: 30, condition: 'Hot', rainfall: 0 },
        Bhopal: { temp: 30, humidity: 65, condition: 'Rainy', rainfall: 15 }
    };

    // Crop advice based on weather
    const cropAdvice = {
        gehu: {
            idealTemp: { min: 15, max: 25 },
            waterNeed: 'medium',
            tip: 'Gehu ke liye 20-25°C best hai. Zyada garmi mein paani badhao.'
        },
        dhan: {
            idealTemp: { min: 25, max: 35 },
            waterNeed: 'high',
            tip: 'Dhan ko paani zyada chahiye. Humidity 60%+ achhi hai.'
        },
        makka: {
            idealTemp: { min: 20, max: 30 },
            waterNeed: 'medium',
            tip: 'Makka mein drip irrigation best hai. Waterlogging se bachao.'
        }
    };

    const weather = weatherData[city];
    if (!weather) {
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: `City "${city}" ka data nahi hai`,
                available: Object.keys(weatherData)
            })
        };
    }

    const advice = cropAdvice[crop] || { tip: 'Is crop ka advice available nahi hai' };

    // Alert generate karo
    const alert = generateAlert(weather, advice, city, crop);

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: true,
            city,
            crop,
            weather,
            advice: advice.tip,
            alert: alert,
            timestamp: new Date().toISOString()
        })
    };
};

// Alert message generate karo
function generateAlert(weather, advice, city, crop) {
    const alerts = [];

    if (weather.temp > 35) {
        alerts.push(`${city} mein bahut garmi hai (${weather.temp}°C). Paani ka extra intezaam karo.`);
    }

    if (weather.rainfall > 10) {
        alerts.push(`${city} mein baarish ho rahi hai (${weather.rainfall}mm). Drainage check karo.`);
    }

    if (weather.humidity > 80) {
        alerts.push('Humidity bahut zyada hai — fungal disease ka risk hai. Spray karo.');
    }

    if (alerts.length === 0) {
        alerts.push(`${city} mein mausam ${crop} ke liye theek hai. Normal care continue karo.`);
    }

    return alerts;
}
```

### Step 3 — Test Karo (Lambda Console Mein)

```json
{
    "queryStringParameters": {
        "city": "Bhopal",
        "crop": "dhan"
    }
}
```

```
Lambda Console → Test tab → Create test event → Paste above JSON → Test

Execution result: succeeded (green)
```

> **Expected Output:**
```json
{
    "statusCode": 200,
    "body": "{\"success\":true,\"city\":\"Bhopal\",\"crop\":\"dhan\",\"weather\":{\"temp\":30,\"humidity\":65,\"condition\":\"Rainy\",\"rainfall\":15},\"advice\":\"Dhan ko paani zyada chahiye...\",\"alert\":[\"Bhopal mein baarish ho rahi hai (15mm). Drainage check karo.\"]}"
}
```

---

## Practice 2: API Gateway Connect Karo

### Step 1 — API Gateway Setup

```
API Gateway Console → Create API → HTTP API → Build

1. Add Integration:
   - Integration type: Lambda
   - Lambda function: kisan-weather-alert
   - Region: ap-south-1

2. Configure Routes:
   - Method: GET
   - Resource path: /weather-alert

3. Stage name: prod

4. Create
```

### Step 2 — API Test Karo

```bash
# API Gateway URL se test karo
# URL format: https://{api-id}.execute-api.ap-south-1.amazonaws.com/prod

# Default city/crop
curl "https://abc123.execute-api.ap-south-1.amazonaws.com/prod/weather-alert"

# Specific city + crop
curl "https://abc123.execute-api.ap-south-1.amazonaws.com/prod/weather-alert?city=Jaipur&crop=gehu"

# Non-existent city
curl "https://abc123.execute-api.ap-south-1.amazonaws.com/prod/weather-alert?city=Mumbai"
```

> **Expected Output:**
```json
{
    "success": true,
    "city": "Jaipur",
    "crop": "gehu",
    "weather": { "temp": 38, "humidity": 30, "condition": "Hot", "rainfall": 0 },
    "advice": "Gehu ke liye 20-25°C best hai. Zyada garmi mein paani badhao.",
    "alert": ["Jaipur mein bahut garmi hai (38°C). Paani ka extra intezaam karo."]
}
```

> **Tip:** API Gateway ka URL production mein Route53 se custom domain pe map kar sakte ho — `api.kisanapp.com/weather-alert`

---

## Practice 3: Bull Queue — Email Job System

### Step 1 — Project Setup

```bash
# Project folder banao
mkdir -p ~/kisan-job-system && cd ~/kisan-job-system
npm init -y
npm install express bull ioredis dotenv

# Redis install karo (agar local mein nahi hai)
# Ubuntu:
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis

# Redis running hai?
redis-cli ping
# Expected: PONG
```

### Step 2 — Email Queue Define Karo

```javascript
// queues/emailQueue.js
// Email jobs ke liye Bull queue

const Bull = require('bull');

// Redis connection se queue banao
const emailQueue = new Bull('kisan-email', {
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000       // 2s → 4s → 8s
        },
        removeOnComplete: 100, // Last 100 completed jobs rakho
        removeOnFail: 50       // Last 50 failed jobs rakho
    }
});

// Welcome email job
async function sendWelcomeEmail(farmerData) {
    const job = await emailQueue.add('welcome-email', {
        to: farmerData.email,
        name: farmerData.name,
        type: 'welcome'
    });
    console.log(`Welcome email job queued — ID: ${job.id}`);
    return { jobId: job.id };
}

// Price alert (delayed — 1 hour baad)
async function sendPriceAlert(farmerEmail, cropData) {
    const job = await emailQueue.add('price-alert', {
        to: farmerEmail,
        crop: cropData.name,
        price: cropData.price,
        type: 'price-alert'
    }, {
        delay: 5000  // 5 seconds delay (testing ke liye, production mein zyada)
    });
    console.log(`Price alert delayed job — 5s baad — ID: ${job.id}`);
    return { jobId: job.id };
}

// Daily digest (recurring)
async function scheduleDailyDigest() {
    // Purane recurring jobs hata do (duplicate avoid)
    const repeatableJobs = await emailQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        if (job.name === 'daily-digest') {
            await emailQueue.removeRepeatableByKey(job.key);
        }
    }

    await emailQueue.add('daily-digest', {
        type: 'daily-digest',
        recipients: 'all-farmers'
    }, {
        repeat: { cron: '0 8 * * *' }  // Har din subah 8 baje
    });
    console.log('Daily digest scheduled — har din 8 AM');
}

module.exports = { emailQueue, sendWelcomeEmail, sendPriceAlert, scheduleDailyDigest };
```

### Step 3 — Worker Banao

```javascript
// workers/emailWorker.js
// Email jobs process karne wala worker

const { emailQueue } = require('../queues/emailQueue');

// Welcome email processor
emailQueue.process('welcome-email', async (job) => {
    const { to, name } = job.data;
    console.log(`[WORKER] Welcome email bhej rahe hain: ${name} (${to})`);

    // Email bhejne ki simulation (2 second)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 10% chance fail hone ka (retry test ke liye)
    if (Math.random() < 0.1) {
        throw new Error('SMTP server busy — retry hoga');
    }

    const emailContent = `
    Namaste ${name}! 
    Kisan App mein aapka swagat hai.
    Ab aap mandi ke taaza bhav dekh sakte hain.
    `;

    console.log(`[WORKER] Welcome email SENT to ${to}`);
    return { sent: true, to, content: emailContent.trim() };
});

// Price alert processor
emailQueue.process('price-alert', async (job) => {
    const { to, crop, price } = job.data;
    console.log(`[WORKER] Price alert bhej rahe hain: ${crop} @ ${price} to ${to}`);

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`[WORKER] Price alert SENT for ${crop}`);
    return { sent: true, crop, price };
});

// Daily digest processor
emailQueue.process('daily-digest', async (job) => {
    console.log(`[WORKER] Daily digest generate ho raha hai...`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`[WORKER] Daily digest SENT to all farmers`);
    return { sent: true, type: 'daily-digest', date: new Date().toISOString() };
});

// Event listeners
emailQueue.on('completed', (job, result) => {
    console.log(`[DONE] Job #${job.id} (${job.name}) complete:`, result.sent ? 'Sent' : 'Failed');
});

emailQueue.on('failed', (job, err) => {
    console.error(`[FAIL] Job #${job.id} (${job.name}) failed — Attempt ${job.attemptsMade}/${job.opts.attempts}: ${err.message}`);
});

emailQueue.on('waiting', (jobId) => {
    console.log(`[QUEUE] Job #${jobId} queue mein wait kar raha hai`);
});

console.log('=== Email Worker Started ===');
console.log('Jobs ka wait kar raha hai...\n');
```

### Step 4 — Express API Se Jobs Add Karo

```javascript
// server.js
// Express API + Bull Queue integration

const express = require('express');
const { sendWelcomeEmail, sendPriceAlert, scheduleDailyDigest, emailQueue } = require('./queues/emailQueue');

const app = express();
app.use(express.json());

// Farmer register → Welcome email queue mein
app.post('/api/farmers/register', async (req, res) => {
    const { name, email, phone } = req.body;

    // Farmer save karo database mein (simplified)
    const farmer = { id: Date.now(), name, email, phone };

    // Welcome email job queue mein add (instant response)
    const job = await sendWelcomeEmail({ name, email });

    res.status(201).json({
        success: true,
        message: `${name} ji, registration ho gaya! Welcome email aa rahi hai.`,
        farmer,
        emailJobId: job.jobId
    });
});

// Price alert bhejo (delayed)
app.post('/api/alerts/price', async (req, res) => {
    const { email, cropName, price } = req.body;

    const job = await sendPriceAlert(email, { name: cropName, price });

    res.json({
        success: true,
        message: 'Price alert 5 seconds mein aayega!',
        jobId: job.jobId
    });
});

// Daily digest schedule karo
app.post('/api/alerts/schedule-digest', async (req, res) => {
    await scheduleDailyDigest();
    res.json({
        success: true,
        message: 'Daily digest scheduled — har din subah 8 baje'
    });
});

// Queue status dekho
app.get('/api/queue/status', async (req, res) => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        emailQueue.getWaitingCount(),
        emailQueue.getActiveCount(),
        emailQueue.getCompletedCount(),
        emailQueue.getFailedCount(),
        emailQueue.getDelayedCount()
    ]);

    res.json({
        queue: 'kisan-email',
        counts: { waiting, active, completed, failed, delayed },
        timestamp: new Date().toISOString()
    });
});

// Specific job ka status dekho
app.get('/api/queue/job/:id', async (req, res) => {
    const job = await emailQueue.getJob(req.params.id);
    if (!job) {
        return res.status(404).json({ error: 'Job nahi mila' });
    }

    const state = await job.getState();
    res.json({
        id: job.id,
        name: job.name,
        state,
        data: job.data,
        attempts: job.attemptsMade,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API server port ${PORT} pe`));
```

### Step 5 — Test Karo

```bash
# Terminal 1: Worker start karo
node workers/emailWorker.js

# Terminal 2: API server start karo
node server.js

# Terminal 3: API calls karo

# Register a farmer (welcome email queue mein jayega)
curl -X POST http://localhost:3000/api/farmers/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Rajesh Kumar","email":"rajesh@kisan.com","phone":"9876543210"}'

# Price alert (delayed — 5 seconds baad process hoga)
curl -X POST http://localhost:3000/api/alerts/price \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh@kisan.com","cropName":"Gehu","price":2275}'

# Queue status check karo
curl http://localhost:3000/api/queue/status

# Specific job track karo
curl http://localhost:3000/api/queue/job/1
```

> **Expected Output (Worker Terminal):**
```
=== Email Worker Started ===
[QUEUE] Job #1 queue mein wait kar raha hai
[WORKER] Welcome email bhej rahe hain: Rajesh Kumar (rajesh@kisan.com)
[WORKER] Welcome email SENT to rajesh@kisan.com
[DONE] Job #1 (welcome-email) complete: Sent
[QUEUE] Job #2 queue mein wait kar raha hai
... (5 seconds baad)
[WORKER] Price alert bhej rahe hain: Gehu @ 2275 to rajesh@kisan.com
[WORKER] Price alert SENT for Gehu
[DONE] Job #2 (price-alert) complete: Sent
```

> **Practice Time!** Worker ko band karo (`Ctrl+C`), phir 5 jobs add karo API se. Worker wapas start karo — saari pending jobs process ho jayengi. Ye hai Bull queue ki power — jobs kabhi lose nahi hote!

---

## Quick Revision Table

| Task | Command/Code | Notes |
|------|-------------|-------|
| Lambda create | AWS Console → Lambda | Node.js 20.x, arm64 |
| Lambda test | Console Test tab | JSON event pass karo |
| API Gateway | HTTP API → Lambda integration | Public URL milta hai |
| Redis start | `sudo systemctl start redis` | Bull queue ke liye zaroori |
| Redis check | `redis-cli ping` → PONG | Connection verify |
| Queue create | `new Bull('name', { redis })` | Queue instance banao |
| Add job | `queue.add('type', data)` | Instant queue mein |
| Delayed job | `queue.add('type', data, { delay })` | Future mein execute |
| Process job | `queue.process('type', handler)` | Worker mein define |
| Queue status | `queue.getWaitingCount()` | Monitoring ke liye |

---

## Aaj Kya Seekha?

1. **Lambda function** banaya aur test kiya — serverless weather alert API
2. **API Gateway** se Lambda ko HTTP endpoint diya — public URL se access hota hai
3. **Bull Queue + Redis** se email job system banaya — API instant response deta hai
4. **Delayed jobs** se price alerts future mein schedule kiye — `delay` option se
5. **Recurring jobs** cron expression se schedule kiye — daily digest har subah 8 baje
6. **Retry with exponential backoff** — failed jobs automatically retry hote hain increasing delay ke saath
7. **Queue monitoring** API banaya — waiting, active, completed, failed counts real-time dekhe
8. Worker band hone pe bhi **jobs safe rehte hain** Redis mein — worker restart hone pe process hote hain
