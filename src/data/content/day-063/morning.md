# Day 63 Morning: Redis Caching

> **Aaj ka plan:** Aaj hum caching ki duniya mein jaayenge! Samjhenge ki caching kya hai, kyu zaroori hai, aur Redis — duniya ka sabse popular in-memory data store — kaise kaam karta hai. Data types, TTL, caching strategies sab cover karenge!

---

## Caching Kya Hai?

### Frequently Used Data Ko Fast Access Dena

Caching matlab — baar baar use hone wale data ko ek **fast storage** mein rakh do, taaki har baar database ko query na karna pade.

> **Socho Aise:** Socho tum ek farmer ho. Har baar mandi ka bhav jaanne ke liye 10 km door jaate ho. Ab agar tumhare phone pe roz subah bhav aa jaaye — to har baar jaana thodi padega! Phone pe stored bhav = **Cache**. Mandi = **Database**.

### Bina Cache vs Cache Ke Saath

```
Without Cache:
Client → Server → Database (har baar DB query) → Server → Client
Time: 200ms

With Cache:
Client → Server → Cache (agar data hai to yahan se de do!) → Server → Client
Time: 5ms   ← 40x faster!

Cache miss hone pe:
Client → Server → Cache (nahi hai!) → Database → Cache mein store → Server → Client
```

> **Yaad Rakho:** Cache = **temporary fast storage**. Database se data laao, cache mein rakho, next time cache se de do. Simple concept, massive performance improvement!

---

## Redis Kya Hai?

### In-Memory Data Store

Redis (Remote Dictionary Server) ek **in-memory data store** hai — matlab ye data RAM mein rakhta hai, disk pe nahi. Isliye ye bahut fast hai!

| Feature | Details |
|---------|---------|
| Speed | 100,000+ operations per second |
| Storage | RAM mein (in-memory) |
| Data Types | Strings, Hashes, Lists, Sets, Sorted Sets |
| Persistence | Optional — data disk pe bhi save ho sakta hai |
| Use Cases | Caching, sessions, real-time analytics, queues |
| Default Port | 6379 |

> **Tip:** Redis itna fast hai ki Instagram, Twitter, GitHub, Stack Overflow — sab Redis use karte hain caching ke liye!

---

## Redis Data Types

### 1. Strings — Sabse Basic

```bash
# String set karo
SET name "Ramesh Kisan"
# Output: OK

# String get karo
GET name
# Output: "Ramesh Kisan"

# Number store karo aur increment karo
SET visitor_count 0
INCR visitor_count        # 1
INCR visitor_count        # 2
INCR visitor_count        # 3

# Multiple values ek saath
MSET crop "Wheat" price "2500" location "Punjab"
MGET crop price location
# Output: "Wheat" "2500" "Punjab"
```

### 2. Hashes — Object Jaisa (Key-Value Pairs)

```bash
# Hash set karo — ek product ki details
HSET product:101 name "Organic Wheat" price 2500 stock 500 farmer "Ramesh"

# Ek field get karo
HGET product:101 name
# Output: "Organic Wheat"

# Sab fields get karo
HGETALL product:101
# Output:
# "name" "Organic Wheat"
# "price" "2500"
# "stock" "500"
# "farmer" "Ramesh"

# Ek field update karo
HSET product:101 price 2800
```

> **Socho Aise:** Hash Redis mein JavaScript object jaisa hai. `product:101` ek key hai jiske andar multiple fields hain — name, price, stock. Database document jaisa!

### 3. Lists — Ordered Collection

```bash
# List mein items push karo (left se)
LPUSH recent_orders "order:501" "order:502" "order:503"

# List se items get karo (0 se 2 index tak)
LRANGE recent_orders 0 2
# Output: "order:503" "order:502" "order:501"

# Right se pop karo (remove + return)
RPOP recent_orders
# Output: "order:501"

# List ki length
LLEN recent_orders
# Output: 2
```

### 4. Sets — Unique Values (No Duplicates)

```bash
# Set mein members add karo
SADD online_farmers "farmer:1" "farmer:2" "farmer:3"

# Sab members dekho
SMEMBERS online_farmers
# Output: "farmer:1" "farmer:2" "farmer:3"

# Duplicate add karne ki koshish — nahi hoga
SADD online_farmers "farmer:1"
# Output: 0 (already exists)

# Kitne members hain
SCARD online_farmers
# Output: 3

# Kya ye member hai?
SISMEMBER online_farmers "farmer:2"
# Output: 1 (true)
```

### 5. Sorted Sets — Score Ke Saath Sorted

```bash
# Top rated farmers (score = rating)
ZADD top_farmers 4.8 "Ramesh" 4.5 "Suresh" 4.9 "Mahesh" 3.2 "Dinesh"

# Top 3 farmers dekho (highest score first)
ZREVRANGE top_farmers 0 2 WITHSCORES
# Output:
# "Mahesh" "4.9"
# "Ramesh" "4.8"
# "Suresh" "4.5"

# Kisi farmer ka rank
ZREVRANK top_farmers "Ramesh"
# Output: 1 (0-indexed, matlab 2nd position)
```

> **Example:** Sorted Sets leaderboards ke liye perfect hain — top farmers by rating, top products by sales, etc.

---

## TTL — Time To Live (Expiry)

Cache mein data hamesha nahi rehna chahiye — purana data serve karna galat hai. TTL set karo taaki data automatically expire ho jaaye.

```bash
# Key set karo with expiry (seconds mein)
SET mandi_price "Wheat: Rs 2500/quintal" EX 3600
# Ye 1 hour (3600 seconds) baad automatically delete ho jayega

# Already existing key pe expiry lagao
SET session:user123 "active"
EXPIRE session:user123 1800     # 30 minutes

# Kitna time bacha hai check karo
TTL session:user123
# Output: 1795 (seconds remaining)

# Expiry hatao (permanent bana do)
PERSIST session:user123

# Key exists check karo
EXISTS session:user123
# Output: 1 (hai)

# Key delete karo
DEL session:user123
```

> **Yaad Rakho:** TTL bahut important hai! Bina TTL ke cache mein purana data reh jaayega aur users ko galat information dikhegi. Hamesha TTL set karo.

---

## Caching Strategies

### 1. Cache-Aside (Lazy Loading) — Sabse Common

```
Step 1: Check cache mein data hai?
Step 2: Haan → cache se return karo (CACHE HIT)
Step 3: Nahi → database se laao, cache mein store karo, return karo (CACHE MISS)
```

```javascript
// Cache-Aside pattern — sabse popular
async function getProduct(productId) {
  const cacheKey = `product:${productId}`;
  
  // Step 1: Pehle cache check karo
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    console.log('CACHE HIT! Fast response');
    return JSON.parse(cached);  // cache se return
  }
  
  // Step 2: Cache miss — database se laao
  console.log('CACHE MISS! DB se la rahe hain...');
  const product = await Product.findById(productId);
  
  // Step 3: Cache mein store karo (1 hour ke liye)
  await redis.set(cacheKey, JSON.stringify(product), 'EX', 3600);
  
  return product;
}
```

### 2. Write-Through — Likho To Cache Bhi Update Karo

```javascript
// Write-Through — jab data update ho, cache bhi update karo
async function updateProduct(productId, updateData) {
  // Step 1: Database update karo
  const product = await Product.findByIdAndUpdate(
    productId, 
    updateData, 
    { new: true }
  );
  
  // Step 2: Cache bhi update karo — consistent rehega
  const cacheKey = `product:${productId}`;
  await redis.set(cacheKey, JSON.stringify(product), 'EX', 3600);
  
  return product;
}
```

### 3. Cache Invalidation — Purana Cache Delete Karo

```javascript
// Jab product delete ho, cache bhi delete karo
async function deleteProduct(productId) {
  await Product.findByIdAndDelete(productId);
  
  // Cache se bhi hatao!
  await redis.del(`product:${productId}`);
  
  // Related cache bhi clear karo
  await redis.del('products:all');  // product list cache bhi purana ho gaya
  
  console.log('Product aur uska cache dono delete ho gaye!');
}
```

> **Warning:** Cache invalidation computer science ke sabse mushkil problems mein se ek hai! Hamesha socho — "jab data change ho, kaunse caches purane ho jaayenge?" Ye miss karna = bugs!

---

## Redis CLI — Basic Commands Summary

```bash
# Connection test
PING
# Output: PONG

# Sab keys dekho (PRODUCTION MEIN MAT KARO!)
KEYS *

# Key ka type check karo
TYPE product:101

# Sab data delete karo (DANGER!)
FLUSHALL

# Database info
INFO

# Monitor real-time commands
MONITOR
```

> **Warning:** `KEYS *` production mein kabhi mat chalao! Ye sab keys scan karta hai aur server slow ho jaata hai. Production mein `SCAN` command use karo.

---

## Quick Revision Table

| Concept | Explanation |
|---------|------------|
| Caching | Frequently used data ko fast storage mein rakhna |
| Redis | In-memory data store — RAM mein data, bahut fast |
| Strings | Basic key-value (`SET`, `GET`, `INCR`) |
| Hashes | Object jaisa — multiple fields (`HSET`, `HGETALL`) |
| Lists | Ordered collection (`LPUSH`, `LRANGE`) |
| Sets | Unique values (`SADD`, `SMEMBERS`) |
| Sorted Sets | Score ke saath sorted (`ZADD`, `ZREVRANGE`) |
| TTL | Auto-expire — purana data automatically delete (`EX`, `EXPIRE`) |
| Cache-Aside | Pehle cache check, miss pe DB se laao aur cache karo |
| Write-Through | DB update ke saath cache bhi update karo |
| Invalidation | Data change pe purana cache delete karo |

---

## Aaj Kya Seekha?

1. **Caching** data access ko 10-100x fast bana deta hai
2. **Redis** in-memory store hai — RAM mein data rakhta hai (bahut fast)
3. Redis ke **5 main data types**: Strings, Hashes, Lists, Sets, Sorted Sets
4. **TTL** hamesha set karo — purana data cache mein nahi rehna chahiye
5. **Cache-Aside** sabse common strategy hai — pehle cache check, phir DB
6. **Cache Invalidation** mushkil hai lekin zaroori hai — data change pe cache clear karo
7. Evening mein Redis practically use karenge Express API mein!
