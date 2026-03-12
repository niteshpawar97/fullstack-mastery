# Day 117 Evening: Per-User Throttling, API Quotas & Distributed Rate Limiting

> **Aaj ka plan:** Ab hum advanced throttling strategies seekhenge — per-user, per-IP, per-API key throttling, API quotas (daily/monthly limits), express-rate-limit advanced config, aur distributed rate limiting across multiple servers.

---

## Per-User / Per-IP / Per-API Key Throttling

### Tiered Rate Limiting

```typescript
// Har user category ke liye alag limits — fair usage policy
interface RateLimitTier {
  name: string;
  requestsPerMinute: number;
  requestsPerDay: number;
  burstLimit: number;          // Ek saath kitne requests
}

const tiers: Record<string, RateLimitTier> = {
  free: {
    name: 'Free Tier',
    requestsPerMinute: 10,    // 10 req/min
    requestsPerDay: 1000,     // 1000 req/day
    burstLimit: 5,            // 5 concurrent max
  },
  pro: {
    name: 'Pro Tier',
    requestsPerMinute: 100,   // 100 req/min
    requestsPerDay: 50000,    // 50K req/day
    burstLimit: 25,
  },
  enterprise: {
    name: 'Enterprise Tier',
    requestsPerMinute: 1000,  // 1000 req/min
    requestsPerDay: 500000,   // 500K req/day
    burstLimit: 100,
  },
};

// Middleware — user ki tier ke hisaab se limit lagao
async function tieredRateLimiter(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    // No API key — IP based limiting (sabse strict)
    const ipResult = await checkRateLimit(`ip:${req.ip}`, tiers.free);
    if (!ipResult.allowed) return sendRateLimitResponse(res, ipResult);
    return next();
  }

  // API key se user aur tier fetch karo
  const keyData = await redis.hgetall(`apikey:${apiKey}`);
  if (!keyData.userId) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const tier = tiers[keyData.tier] || tiers.free;

  // Multiple checks — minute + daily
  const minuteResult = await checkRateLimit(
    `minute:${keyData.userId}`, tier, tier.requestsPerMinute, 60_000
  );
  const dailyResult = await checkRateLimit(
    `daily:${keyData.userId}`, tier, tier.requestsPerDay, 86_400_000
  );

  // Koi bhi limit cross hui toh block karo
  if (!minuteResult.allowed) return sendRateLimitResponse(res, minuteResult);
  if (!dailyResult.allowed) return sendRateLimitResponse(res, dailyResult);

  // Headers set karo — client ko batao kitna quota bacha
  res.set({
    'X-RateLimit-Tier': tier.name,
    'X-RateLimit-Limit-Minute': String(tier.requestsPerMinute),
    'X-RateLimit-Remaining-Minute': String(minuteResult.remaining),
    'X-RateLimit-Limit-Day': String(tier.requestsPerDay),
    'X-RateLimit-Remaining-Day': String(dailyResult.remaining),
  });

  next();
}

// 429 response bhejo — proper format mein
function sendRateLimitResponse(res: Response, result: any) {
  res.set('Retry-After', String(Math.ceil(result.retryAfter / 1000)));

  return res.status(429).json({
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Tumhara quota khatam ho gaya. Upgrade karo ya thoda wait karo!',
    limit: result.limit,
    remaining: 0,
    retryAfter: Math.ceil(result.retryAfter / 1000),
    upgradeUrl: 'https://api.example.com/pricing', // Upsell opportunity!
  });
}
```

> **Socho Aise:** Jaise mobile recharge plans hote hain — ₹199 mein 1.5GB/day, ₹599 mein 3GB/day, ₹999 mein unlimited. API bhi aise hi hain — Free tier mein limited, Pro mein zyada, Enterprise mein bahut zyada!

---

## API Quotas — Monthly/Daily Limits

```typescript
// quotas/quotaManager.ts — Daily aur monthly quotas track karo
import Redis from 'ioredis';

const redis = new Redis();

class QuotaManager {
  // Daily quota check karo
  async checkDailyQuota(userId: string, limit: number): Promise<{
    allowed: boolean;
    used: number;
    remaining: number;
    resetsAt: string;
  }> {
    const today = new Date().toISOString().split('T')[0]; // "2026-04-04"
    const key = `quota:daily:${userId}:${today}`;

    const used = await redis.incr(key);

    // Pehli baar hai toh expiry set karo — midnight pe reset
    if (used === 1) {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
      await redis.expire(key, ttl);
    }

    return {
      allowed: used <= limit,
      used,
      remaining: Math.max(0, limit - used),
      resetsAt: this.getNextMidnight(),
    };
  }

  // Monthly quota check karo
  async checkMonthlyQuota(userId: string, limit: number): Promise<{
    allowed: boolean;
    used: number;
    remaining: number;
    resetsAt: string;
  }> {
    const month = new Date().toISOString().slice(0, 7); // "2026-04"
    const key = `quota:monthly:${userId}:${month}`;

    const used = await redis.incr(key);

    if (used === 1) {
      // Next month first day pe expire
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      const ttl = Math.floor((nextMonth.getTime() - Date.now()) / 1000);
      await redis.expire(key, ttl);
    }

    return {
      allowed: used <= limit,
      used,
      remaining: Math.max(0, limit - used),
      resetsAt: this.getNextMonthStart(),
    };
  }

  // Usage dashboard ke liye — analytics data
  async getUsageStats(userId: string): Promise<object> {
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().slice(0, 7);

    const [dailyUsed, monthlyUsed] = await Promise.all([
      redis.get(`quota:daily:${userId}:${today}`),
      redis.get(`quota:monthly:${userId}:${month}`),
    ]);

    return {
      daily: { used: Number(dailyUsed) || 0 },
      monthly: { used: Number(monthlyUsed) || 0 },
    };
  }

  private getNextMidnight(): string {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    return tomorrow.toISOString();
  }

  private getNextMonthStart(): string {
    const next = new Date();
    next.setMonth(next.getMonth() + 1, 1);
    next.setHours(0, 0, 0, 0);
    return next.toISOString();
  }
}
```

> **Tip:** Quota aur rate limit alag cheezein hain! Rate limit = per second/minute speed control. Quota = daily/monthly total usage cap. Dono saath mein lagao!

---

## express-rate-limit Advanced Configuration

```typescript
// Express ke popular rate limiting library ka advanced setup
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis();

// Store — Redis use karo taaki multiple servers pe kaam kare
const redisStore = new RedisStore({
  sendCommand: (...args: string[]) => redisClient.call(...args),
  prefix: 'rl:', // Redis keys ka prefix
});

// Global API limiter
const globalLimiter = rateLimit({
  store: redisStore,              // Redis store — distributed!
  windowMs: 60 * 1000,           // 1 minute window
  max: 100,                       // 100 requests per minute
  standardHeaders: true,          // RateLimit-* headers bhejo
  legacyHeaders: false,           // X-RateLimit-* purane headers band
  message: {                      // Custom error response
    error: 'TOO_MANY_REQUESTS',
    message: 'Bahut zyada requests. 1 minute wait karo.',
  },
  keyGenerator: (req) => {
    // API key hai toh wo use karo, nahi toh IP
    return (req.headers['x-api-key'] as string) || req.ip || 'unknown';
  },
  skip: (req) => {
    // Health check aur internal routes skip karo
    if (req.path === '/health') return true;
    if (req.headers['x-internal-key'] === process.env.INTERNAL_KEY) return true;
    return false;
  },
  handler: (req, res, next, options) => {
    // Custom handler — logging + response
    console.warn(`Rate limited: ${req.ip} on ${req.path}`);
    res.status(429).json(options.message);
  },
});

// Route-specific limiters — alag alag routes pe alag limits
const authLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 5,                        // Sirf 5 attempts
  keyGenerator: (req) => `auth:${req.body?.email || req.ip}`,
  skipSuccessfulRequests: true,  // Successful login count nahi hoga
});

const searchLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => `search:${req.user?.id || req.ip}`,
  skipFailedRequests: true, // Failed requests count nahi honge
});

// App mein lagao
app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/search', searchLimiter);
```

> **Yaad Rakho:** `skipSuccessfulRequests: true` login pe lagao — successful login count nahi hoga, sirf failed attempts count honge. Smart approach for brute force prevention!

---

## Client-Side 429 Handling

```typescript
// Client ko bhi 429 handle karna aana chahiye — graceful retry
import axios from 'axios';

// Axios interceptor — 429 automatically handle karo
const apiClient = axios.create({ baseURL: 'https://api.example.com' });

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      // Retry-After header se wait time nikalo
      const retryAfter = Number(error.response.headers['retry-after']) || 60;
      console.warn(`Rate limited! Waiting ${retryAfter} seconds...`);

      // Wait karo aur phir retry karo
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return apiClient.request(error.config); // Same request retry
    }

    throw error;
  }
);

// Usage — client ko pata bhi nahi chalega rate limiting hui
const response = await apiClient.get('/api/products');
```

---

## Distributed Rate Limiting Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                             │
│              (Nginx / AWS ALB / Cloudflare)                  │
└───────┬──────────────┬───────────────┬──────────────────────┘
        │              │               │
   ┌────▼────┐   ┌────▼────┐    ┌────▼────┐
   │Server 1 │   │Server 2 │    │Server 3 │
   │ Express  │   │ Express  │    │ Express  │
   │ + Rate   │   │ + Rate   │    │ + Rate   │
   │ Limiter  │   │ Limiter  │    │ Limiter  │
   └────┬────┘   └────┬────┘    └────┬────┘
        │              │               │
        └──────────────┼───────────────┘
                       │
               ┌───────▼────────┐
               │   Redis        │
               │   (Central     │
               │    Counter)    │
               │                │
               │ All 3 servers  │
               │ same counter   │
               │ share karte    │
               └────────────────┘
```

> **Warning:** Bina Redis ke har server apna alag counter rakhega. 3 servers hain aur limit 100 req/min hai, toh user actually 300 req/min bhej sakta hai! Redis centralized counter maintain karta hai — sab servers ek hi counter use karte hain.

---

## Quick Revision Table

| Concept | Kya Hai | Important Point |
|---------|---------|----------------|
| Per-User Limiting | User ID basis pe limit | Fair usage per user |
| Per-IP Limiting | IP address basis pe | Anonymous users ke liye |
| Per-API Key | API key basis pe | Tiered plans ke liye |
| API Quota | Daily/Monthly total cap | Long-term usage control |
| Rate Limit | Per second/minute speed | Short-term burst control |
| 429 Status | Too Many Requests | Standard HTTP response |
| Retry-After | Kitne seconds wait karo | Header mein bhejo |
| Redis Store | Distributed counter | Multiple servers pe kaam |
| Lua Script | Atomic Redis operation | Race condition safe |

---

## Aaj Kya Seekha?

1. **Tiered rate limiting** se free/pro/enterprise users ko alag limits do — fair aur monetizable
2. **API quotas** daily/monthly usage track karte hain — rate limit se alag concept hai
3. **express-rate-limit + Redis** production-ready distributed rate limiting deta hai
4. **skipSuccessfulRequests** login routes pe lagao — sirf failed attempts count ho
5. **Client-side 429 handling** mein Retry-After header read karke auto-retry karo

> **Practice Time!** express-rate-limit install karo Redis store ke saath. Teen routes banao — `/api/public` (50 req/min), `/api/auth/login` (5 attempts/15min), `/api/premium` (500 req/min). Har ek ko test karo aur response headers observe karo!
