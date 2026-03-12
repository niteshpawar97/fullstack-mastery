# Day 114 Evening: Redis Lua Scripts & Advanced Patterns

> **Aaj ka plan:** Ab hum Redis mein Lua scripting sikhenge — atomic operations ke liye, plus advanced caching patterns jo production mein bahut kaam aate hain.

---

## Lua Scripts Kyu?

### Problem: Race Condition

```typescript
// YE GALAT HAI — Race condition ho sakti hai!
async function decrementStock(productId: string, quantity: number) {
  // Step 1: Current stock padho
  const stock = parseInt(await redis.get(`stock:${productId}`) || '0');
  
  // ❌ YAHAN PROBLEM HAI!
  // Doosra request bhi same time pe stock padh sakta hai
  // Dono ko "100" milega, dono 10 ghata denge
  // Final stock: 90 (galat!) instead of 80
  
  // Step 2: Check karo kaafi hai ya nahi
  if (stock < quantity) {
    throw new Error('Stock nahi hai!');
  }
  
  // Step 3: Update karo
  await redis.set(`stock:${productId}`, String(stock - quantity));
}
```

> **Socho Aise:** 2 cashiers ek saath check kar rahe hain ki godown mein 10 bags hain. Dono ko "10" milta hai. Dono 5-5 bags ka order confirm kar dete hain. Ab godown mein 0 hone chahiye the lekin system dikhata hai 5. Ye hai race condition!

### Solution: Lua Script — Atomic Operation

```typescript
// Lua script — Redis mein atomically execute hota hai
// Koi bhi doosra command beech mein nahi aa sakta!
const decrementStockScript = `
  -- KEYS[1] = stock key, ARGV[1] = quantity
  local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
  local quantity = tonumber(ARGV[1])
  
  -- Check: stock kaafi hai?
  if stock < quantity then
    return -1  -- Not enough stock
  end
  
  -- Decrement karo — ye atomic hai!
  local newStock = stock - quantity
  redis.call('SET', KEYS[1], newStock)
  
  return newStock
`;

async function decrementStockSafe(productId: string, quantity: number) {
  // EVAL — Lua script Redis server pe chalega
  const result = await redis.eval(
    decrementStockScript,
    1,                          // Kitni KEYS hain
    `stock:${productId}`,       // KEYS[1]
    String(quantity)            // ARGV[1]
  );
  
  if (result === -1) {
    throw new Error('Stock nahi hai bhai!');
  }
  
  console.log(`Stock updated: ${productId} — Remaining: ${result}`);
  return result;
}
```

> **Yaad Rakho:** Lua script Redis server pe atomically execute hota hai. Jab tak script chal rahi hai, koi bhi doosra command execute nahi ho sakta. Race condition impossible!

---

## Useful Lua Scripts

### Script 1: Rate Limiter (Sliding Window)

```typescript
// Advanced rate limiter — per-user, sliding window
const rateLimiterScript = `
  local key = KEYS[1]           -- user:123:rate-limit
  local limit = tonumber(ARGV[1])  -- max requests
  local window = tonumber(ARGV[2]) -- time window in seconds
  local now = tonumber(ARGV[3])    -- current timestamp
  
  -- Purane entries hatao (window se bahar wale)
  redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
  
  -- Current count dekho
  local count = redis.call('ZCARD', key)
  
  if count >= limit then
    -- Limit exceed — reject!
    return 0
  end
  
  -- Naya request add karo
  redis.call('ZADD', key, now, now .. '-' .. math.random(10000))
  redis.call('EXPIRE', key, window)
  
  -- Kitni requests bachi hain
  return limit - count - 1
`;

async function checkRateLimit(userId: string, limit = 100, windowSec = 60) {
  const remaining = await redis.eval(
    rateLimiterScript,
    1,
    `ratelimit:${userId}`,
    String(limit),
    String(windowSec),
    String(Date.now() / 1000)
  );
  
  if (remaining === 0) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining: Number(remaining) };
}
```

### Script 2: Leaderboard Update (Atomic)

```typescript
// Farmer sales leaderboard — atomic score update
const leaderboardScript = `
  local leaderboard = KEYS[1]  -- "farmer-leaderboard"
  local farmerId = ARGV[1]
  local saleAmount = tonumber(ARGV[2])
  
  -- Score increment karo (sorted set)
  redis.call('ZINCRBY', leaderboard, saleAmount, farmerId)
  
  -- Current rank nikalo (0-based, toh +1 karo)
  local rank = redis.call('ZREVRANK', leaderboard, farmerId)
  
  -- Total score nikalo
  local totalScore = redis.call('ZSCORE', leaderboard, farmerId)
  
  return {rank + 1, tonumber(totalScore)}
`;

async function updateFarmerSales(farmerId: string, saleAmount: number) {
  const [rank, total] = await redis.eval(
    leaderboardScript,
    1,
    'farmer-leaderboard',
    farmerId,
    String(saleAmount)
  ) as [number, number];
  
  console.log(`Farmer ${farmerId}: Rank #${rank}, Total Sales: ₹${total}`);
  return { rank, totalSales: total };
}
```

---

## Advanced Caching Patterns

### Pattern 1: Cache-Aside (Lazy Loading)

```typescript
// Sabse common pattern — cache miss pe database se laao
async function getProduct(productId: string) {
  // Step 1: Cache check karo
  const cached = await redis.get(`product:${productId}`);
  
  if (cached) {
    console.log('Cache HIT!');
    return JSON.parse(cached);
  }
  
  // Step 2: Cache miss — database se laao
  console.log('Cache MISS — DB se fetch kar raha hai');
  const product = await db.products.findById(productId);
  
  // Step 3: Cache mein daalo (1 hour ke liye)
  await redis.setex(`product:${productId}`, 3600, JSON.stringify(product));
  
  return product;
}
```

### Pattern 2: Write-Through Cache

```typescript
// Jab bhi data update ho, cache bhi update karo
async function updateProduct(productId: string, updates: any) {
  // Step 1: Database update karo
  const product = await db.products.update(productId, updates);
  
  // Step 2: Cache bhi update karo — stale data nahi rahega
  await redis.setex(`product:${productId}`, 3600, JSON.stringify(product));
  
  // Step 3: Related caches invalidate karo
  await redis.del('products:list'); // List cache bhi purana ho gaya
  
  return product;
}
```

### Pattern 3: Cache Stampede Prevention

```typescript
// Problem: Cache expire hone pe 1000 users ek saath DB hit karte hain!
// Solution: Locking mechanism

const cacheLockScript = `
  local key = KEYS[1]
  local lockKey = KEYS[1] .. ':lock'
  local ttl = tonumber(ARGV[1])
  
  -- Cache check karo
  local cached = redis.call('GET', key)
  if cached then
    return cached
  end
  
  -- Lock try karo — sirf ek hi process DB call karega
  local locked = redis.call('SET', lockKey, '1', 'NX', 'EX', 10)
  
  if locked then
    return '__CACHE_MISS__'  -- Is process ko DB call karna hai
  else
    return '__WAIT__'  -- Koi aur already fetch kar raha hai, thoda ruko
  end
`;

async function getProductSafe(productId: string) {
  const key = `product:${productId}`;
  
  const result = await redis.eval(cacheLockScript, 1, key, '3600');
  
  if (result !== '__CACHE_MISS__' && result !== '__WAIT__') {
    return JSON.parse(result as string); // Cache hit
  }
  
  if (result === '__WAIT__') {
    // Koi aur fetch kar raha hai — thoda wait karo phir retry
    await new Promise(r => setTimeout(r, 100));
    return getProductSafe(productId); // Retry
  }
  
  // Cache miss — hum fetch karenge
  const product = await db.products.findById(productId);
  await redis.setex(key, 3600, JSON.stringify(product));
  await redis.del(`${key}:lock`); // Lock hatao
  
  return product;
}
```

> **Tip:** Cache stampede tab hota hai jab popular cache key expire ho aur hundreds of requests ek saath database hit karein. Lock pattern se sirf ek request DB jaati hai, baaki wait karte hain!

---

## Script Management — EVALSHA

```typescript
// Problem: Har baar poora script bhejne se network bandwidth waste hota hai
// Solution: Script ko ek baar load karo, phir SHA hash se call karo

// App start pe scripts load karo
const scriptSHA = await redis.script('LOAD', decrementStockScript);
console.log(`Script loaded, SHA: ${scriptSHA}`);

// Ab EVALSHA se call karo — sirf hash bhejni hai, script nahi
async function decrementStockFast(productId: string, qty: number) {
  return redis.evalsha(
    scriptSHA,                    // SHA hash — chhota hai
    1,
    `stock:${productId}`,
    String(qty)
  );
}
```

> **Yaad Rakho:** `EVAL` har baar full script bhejta hai. `EVALSHA` sirf hash bhejta hai — network efficient! Production mein hamesha EVALSHA use karo.

---

## Quick Revision Table

| Concept | Kya Hai | Kab Use Karein |
|---------|---------|---------------|
| Lua Script | Atomic Redis operations | Race conditions avoid karne |
| EVAL | Script execute karo | Development mein |
| EVALSHA | Script hash se execute | Production mein |
| Cache-Aside | Lazy loading pattern | Read-heavy data |
| Write-Through | Write pe cache update | Consistency zaroori ho |
| Cache Stampede | Multiple DB hits at once | Lock pattern se roko |
| Sliding Window | Time-based rate limiting | API rate limiting |

---

## Aaj Kya Seekha?

1. **Lua scripts** Redis mein atomic operations guarantee karte hain — race conditions impossible
2. **EVALSHA** production mein use karo — network efficient hai
3. **Cache-Aside** sabse common caching pattern hai — lazy loading
4. **Cache Stampede** prevention zaroori hai popular keys ke liye — locking use karo
5. **Sliding Window** rate limiter Lua script se ek atomic operation mein ban jaata hai

> **Practice Time!** Ek Lua script likho jo "flash sale" implement kare: limited stock hai (e.g., 50 items), multiple users ek saath buy kar rahe hain. Script atomically check kare stock available hai ya nahi, aur decrement kare. Test karo 100 concurrent requests se!
