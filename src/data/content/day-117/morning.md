# Day 117 Morning: Rate Limiting Advanced — Token Bucket & Sliding Window

> **Aaj ka plan:** Aaj hum rate limiting ke advanced algorithms seekhenge — Token Bucket, Sliding Window Log, Sliding Window Counter. Redis ke saath distributed rate limiting implement karenge. API ko abuse se kaise bachate hain wo samjhenge!

---

## Rate Limiting Kyu Zaroori Hai?

### Bina Rate Limiting Ke Kya Hota Hai

```
Hacker ya Script:
  POST /api/login → 1000 requests/second 🔥
  POST /api/login → 1000 requests/second 🔥
  POST /api/login → 1000 requests/second 🔥

Result:
  ├── Server overloaded → DOWN for everyone
  ├── Database connections exhausted
  ├── Brute force attack successful
  └── Cloud bill ₹50,000 ka aaya 😱

Rate Limiting ke saath:
  POST /api/login → 5 requests/minute allowed
  6th request → 429 Too Many Requests ❌
  Server safe, Users safe, Wallet safe ✅
```

> **Socho Aise:** Rate limiting aise hai jaise ATM mein daily withdrawal limit hoti hai — ₹25,000/day. Chahe card tumhara hi hai, ek din mein sirf itna nikal sakte ho. Ye security ke liye hai!

---

## Algorithm 1: Fixed Window Counter

```typescript
// Sabse simple approach — lekin edge case hai
// Window: 1 minute, Limit: 100 requests

// Problem: Window ke boundary pe burst ho sakta hai
// 12:00:59 → 100 requests ✅
// 12:01:00 → 100 requests ✅ (naya window)
// Result: 1 second mein 200 requests! Limit ka matlab hi nahi raha

class FixedWindowLimiter {
  private counters = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private windowMs: number,  // Window size in ms
    private maxRequests: number // Max requests per window
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const record = this.counters.get(key);

    // Naya window shuru hua — counter reset
    if (!record || record.windowStart !== windowStart) {
      this.counters.set(key, { count: 1, windowStart });
      return true;
    }

    // Limit check karo
    if (record.count < this.maxRequests) {
      record.count++;
      return true; // Allowed
    }

    return false; // Rate limited!
  }
}
```

> **Warning:** Fixed window mein boundary burst problem hota hai. Production mein sliding window use karo — wo accurate hota hai!

---

## Algorithm 2: Sliding Window Log

```typescript
// Har request ka timestamp store karo — accurate but memory-intensive

class SlidingWindowLog {
  // Har user ke liye timestamps ki list
  private logs = new Map<string, number[]>();

  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs; // Window ka start time

    // Purane timestamps hatao — jo window se bahar hain
    let timestamps = this.logs.get(key) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check karo — window mein kitne requests hain
    if (timestamps.length < this.maxRequests) {
      timestamps.push(now); // Naya timestamp add karo
      this.logs.set(key, timestamps);
      return true;
    }

    this.logs.set(key, timestamps); // Cleanup save karo
    return false; // Rate limited!
  }
}

// Accurate hai lekin memory zyada lagti hai — har request ka timestamp store hota hai
// 1M users × 100 timestamps = bahut saari memory!
```

---

## Algorithm 3: Token Bucket — Industry Standard

```typescript
// Token bucket — best balance of accuracy and performance
// Bucket mein tokens hain. Har request 1 token use karta hai.
// Tokens fixed rate pe refill hote hain.

class TokenBucket {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  constructor(
    private maxTokens: number,    // Bucket ki capacity
    private refillRate: number,   // Kitne tokens per second add ho
  ) {}

  isAllowed(key: string, tokensRequired: number = 1): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      // Naya user — full bucket do
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Tokens refill karo — time ke hisaab se
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    bucket.tokens = Math.min(
      this.maxTokens,                           // Max capacity se zyada nahi
      bucket.tokens + elapsed * this.refillRate // Time ke hisaab se add karo
    );
    bucket.lastRefill = now;

    // Tokens available hain?
    if (bucket.tokens >= tokensRequired) {
      bucket.tokens -= tokensRequired; // Token use karo
      return true;
    }

    return false; // Tokens khatam — rate limited!
  }

  // Client ko batao kitne tokens bache hain
  getRemainingTokens(key: string): number {
    const bucket = this.buckets.get(key);
    return bucket ? Math.floor(bucket.tokens) : this.maxTokens;
  }
}

// Usage
const limiter = new TokenBucket(
  100,  // Max 100 tokens
  10    // 10 tokens per second refill
);
// Burst allow hota hai (100 requests ek saath) but sustained rate limited hai
```

> **Yaad Rakho:** Token Bucket ka fayda — burst traffic allow hota hai (jab bucket full hai). Lekin sustained high traffic limited rehta hai. Isliye ye APIs ke liye perfect hai — user ko thoda burst milta hai!

---

## Redis-Based Distributed Rate Limiting

```typescript
// Single server pe Map kaam karta hai, lekin multiple servers pe?
// Redis use karo — centralized counter, sab servers share karein

import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
});

// Sliding Window Counter — Redis ke saath (best for production)
async function slidingWindowRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}`;

  // Lua script — atomic operation (race condition se bachao)
  const luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    
    -- Purane entries hatao (window se bahar)
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
    
    -- Current count check karo
    local count = redis.call('ZCARD', key)
    
    if count < limit then
      -- Allowed — naya entry add karo
      redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
      redis.call('PEXPIRE', key, window)
      return {1, limit - count - 1}
    else
      -- Rate limited — oldest entry ka timestamp return karo
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local retryAfter = tonumber(oldest[2]) + window - now
      return {0, 0, retryAfter}
    end
  `;

  const result = await redis.eval(luaScript, 1, windowKey, now, windowMs, maxRequests) as number[];

  return {
    allowed: result[0] === 1,
    remaining: result[1] || 0,
    retryAfter: result[2] || 0,
  };
}
```

> **Tip:** Lua script Redis mein atomic execute hota hai — matlab beech mein koi doosra command nahi chal sakta. Race condition ka koi chance nahi! Production mein HAMESHA Lua script use karo rate limiting ke liye.

---

## Express Middleware — Rate Limiter

```typescript
// middleware/rateLimiter.ts — Express ke saath integrate karo
import { Request, Response, NextFunction } from 'express';

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyGenerator: (req: Request) => string; // Kis basis pe limit lagaein
  message?: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator(req);
    const result = await slidingWindowRateLimit(key, options.windowMs, options.max);

    // Standard rate limit headers set karo
    res.set({
      'X-RateLimit-Limit': String(options.max),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Date.now() + options.windowMs),
    });

    if (!result.allowed) {
      res.set('Retry-After', String(Math.ceil(result.retryAfter / 1000)));
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: options.message || 'Rate limit exceeded. Thoda ruko!',
        retryAfter: Math.ceil(result.retryAfter / 1000),
      });
    }

    next();
  };
}

// Different limiters for different routes
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,   // 1 minute
  max: 100,               // 100 requests per minute
  keyGenerator: (req) => `api:${req.ip}`, // IP basis pe
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // Sirf 5 login attempts
  keyGenerator: (req) => `login:${req.body.email}`, // Email basis pe
  message: 'Too many login attempts. 15 minute baad try karo.',
});

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                   // 10 uploads per hour
  keyGenerator: (req) => `upload:${req.user?.id}`, // User basis pe
});

// Routes pe lagao
app.use('/api/', apiLimiter);                // Sab API routes pe
app.post('/api/auth/login', loginLimiter);   // Login pe strict
app.post('/api/upload', uploadLimiter);      // Upload pe strict
```

---

## Quick Revision Table

| Algorithm | Accuracy | Memory | Burst Friendly | Best For |
|-----------|----------|--------|---------------|----------|
| Fixed Window | Low | Low | No (boundary issue) | Simple internal tools |
| Sliding Window Log | High | High | No | Small scale, accurate |
| Sliding Window Counter | High | Medium | Partial | Production APIs |
| Token Bucket | High | Low | Yes (burst ok) | Public APIs, CDNs |

---

## Aaj Kya Seekha?

1. **Fixed Window** simple hai lekin boundary burst problem hai — production ke liye avoid karo
2. **Token Bucket** burst traffic allow karta hai — API rate limiting ke liye industry standard hai
3. **Sliding Window** accurate hai — Redis ke saath distributed environment mein kaam karta hai
4. **Lua scripts** Redis mein atomic operations dete hain — race conditions se bachao
5. **Different routes pe different limits** lagao — login pe strict, read pe lenient

> **Practice Time!** Redis install karo aur Token Bucket rate limiter banao. Express app mein `/api/test` route pe lagao — 10 requests/minute limit. Postman se 15 rapid requests bhejo aur dekho 429 response kab aata hai!
