# Day 50 Morning: Database Indexing & Performance

> **Aaj ka plan:** Aaj hum database indexing seekhenge — indexes kya hain, B-tree kaise kaam karta hai, single field vs compound indexes, createIndex, explain() se query analysis, index ka write performance pe impact, MongoDB profiler, aur SQL EXPLAIN.

---

## Indexes Kya Hain?

### Kitaab Ki Index Jaisa

Socho tumhare paas 1000 pages ki kitaab hai aur tumhe "Aggregation" ke baare mein padhna hai. Do tarike hain:

1. **Bina Index:** Page 1 se lekar 1000 tak har page padho — "Aggregation" milega kahi (Collection Scan)
2. **Index se:** Kitaab ke peeche index dekho — "Aggregation... Page 347" — seedha wahan jaao!

> **Socho Aise:** MongoDB mein bhi waisa hi hai. Bina index ke MongoDB **har document** check karta hai (Collection Scan / COLLSCAN). Index se wo seedha sahi document pe pahunch jaata hai.

```
Without Index (COLLSCAN):
Documents: [1] [2] [3] [4] [5] [6] [7] [8] [9] [10] ... [1000000]
           ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑       ↑
           Sab check karo → SLOW! (O(n))

With Index (IXSCAN):
Index: crop → [Onion:doc3, Potato:doc2, Tomato:doc1, ...]
             Sorted hai! Binary search → FAST! (O(log n))
```

> **Yaad Rakho:** 10 lakh documents mein bina index ke search = 10 lakh comparisons. Index ke saath = ~20 comparisons (log2 of 1M). Ye MASSIVE difference hai!

---

## B-tree — Index Ka Structure

### Kaise Organize Hota Hai Data?

MongoDB indexes B-tree (Balanced Tree) data structure use karte hain:

```
                    [Mango | Potato]
                   /       |        \
          [Banana]    [Onion]    [Rice | Tomato | Wheat]
          /     \      /   \      /    |     \      \
       [docs] [docs] [docs][docs] [docs][docs][docs][docs]
```

- **Root node** se start hota hai
- Har node mein sorted keys hain
- Left subtree mein chhoti values, right mein badi
- **Leaf nodes** mein actual document references (pointers) hain

> **Tip:** B-tree balanced rehta hai — search hamesha O(log n) mein hota hai chahe data kitna bhi ho. 1 crore documents mein bhi ~23-24 comparisons mein answer mil jaaye.

### Index Mein Kya Store Hota Hai?

```
Index entry = { indexed_field_value, pointer_to_document }

Example (index on "crop"):
{ "Banana", → ObjectId("65a1...") }
{ "Mango", → ObjectId("65a2...") }
{ "Onion", → ObjectId("65a3...") }
{ "Potato", → ObjectId("65a4...") }
{ "Tomato", → ObjectId("65a5...") }
```

Index mein poora document nahi hota — sirf field value + document ka pointer. Isliye index chhota hota hai aur RAM mein fit ho jaata hai.

---

## Single Field Index

### Ek Field Pe Index

```javascript
// Ek field pe index banao
// Mongoose schema mein
const orderSchema = new mongoose.Schema({
  farmer: { type: String, index: true },  // Index: true
  crop: String,
  qty: Number,
  pricePerKg: Number,
  date: Date,
  district: String
});

// Ya manually createIndex se
await Order.collection.createIndex({ crop: 1 });  // 1 = ascending
await Order.collection.createIndex({ date: -1 });  // -1 = descending
```

### Kab Use Karein?

```javascript
// Ye query fast hogi kyunki crop pe index hai
await Order.find({ crop: "Tomato" });

// Ye query SLOW hogi kyunki district pe index nahi hai
await Order.find({ district: "Lucknow" });
```

> **Yaad Rakho:** Index sirf un fields ke queries ko fast karega jis pe index hai. Agar `crop` pe index hai lekin query `district` pe hai — toh index kaam nahi aayega.

---

## Compound Index

### Multiple Fields Ka Ek Index

Jab queries mein multiple fields use hote hain, compound index banao:

```javascript
// Compound index — crop + date dono pe
await Order.collection.createIndex({ crop: 1, date: -1 });

// Ye query FAST hogi — dono fields index mein hain
await Order.find({ crop: "Tomato" }).sort({ date: -1 });

// Ye bhi FAST hogi — crop sirf prefix hai
await Order.find({ crop: "Tomato" });

// Ye SLOW hogi — date sirf index ka suffix hai, prefix (crop) nahi diya
await Order.find({ date: { $gte: new Date("2026-03-01") } });
```

> **Warning:** Compound index mein **order matter** karta hai! Index `{ crop: 1, date: -1 }` mein pehle crop filter hoga, phir date. Agar query sirf date pe hai toh ye index kaam nahi aayega. Ye "prefix rule" yaad rakho.

### Prefix Rule

```
Index: { a: 1, b: 1, c: 1 }

Ye queries fast hongi:
✅ find({ a: "x" })                    → prefix a
✅ find({ a: "x", b: "y" })            → prefix a, b
✅ find({ a: "x", b: "y", c: "z" })    → poora index
✅ find({ a: "x" }).sort({ b: 1 })     → prefix a + sort b

Ye queries SLOW hongi:
❌ find({ b: "y" })                    → a missing (prefix nahi)
❌ find({ c: "z" })                    → a, b missing
❌ find({ b: "y", c: "z" })            → a missing
```

> **Socho Aise:** Compound index ek phone book jaisa hai — pehle surname se sort, phir first name se. Agar tumhe sirf first name pata hai toh poori phone book scan karni padegi. Lekin surname pata hai toh direct section mil jaayega.

---

## explain() — Query Analysis

### Query Kaise Execute Ho Rahi Hai?

`explain()` batata hai MongoDB ne query kaise execute ki — index use kiya ya nahi, kitne documents scan kiye, kitna time laga.

```javascript
// explain() use karo
const explanation = await Order.find({ crop: "Tomato" })
  .explain('executionStats');

console.log(JSON.stringify(explanation, null, 2));
```

### Key Fields Samjho

```javascript
// explain() output ke important fields
{
  "queryPlanner": {
    "winningPlan": {
      "stage": "IXSCAN",        // ← IXSCAN = Index use hua (GOOD!)
                                 //   COLLSCAN = Full scan (BAD!)
      "indexName": "crop_1"      // Kaunsa index use hua
    }
  },
  "executionStats": {
    "nReturned": 4,              // Kitne documents return hue
    "totalKeysExamined": 4,      // Index mein kitne keys check kiye
    "totalDocsExamined": 4,      // Kitne documents examine kiye
    "executionTimeMillis": 1     // Kitna time laga (ms)
  }
}
```

### Good vs Bad Query Performance

```
GOOD Query (Index hai):
  stage: "IXSCAN"
  nReturned: 4
  totalDocsExamined: 4         ← Return = Examined (perfect!)
  executionTimeMillis: 1

BAD Query (Index nahi):
  stage: "COLLSCAN"
  nReturned: 4
  totalDocsExamined: 1000000   ← 10 lakh scan for 4 results!
  executionTimeMillis: 850
```

> **Yaad Rakho:** `totalDocsExamined` aur `nReturned` ka ratio dekho. Agar examined >> returned, toh query inefficient hai — index chahiye!

---

## Index Ka Write Performance Pe Impact

### Trade-off Samjho

```
READ Performance:  Index ↑↑↑ = Queries FAST
WRITE Performance: Index ↓↓ = Inserts/Updates SLOW

Kyun?
Har insert/update pe:
1. Document save karo            ← Normal work
2. SAARE relevant indexes update karo ← Extra work!
```

```javascript
// Example — 5 indexes hain ek collection pe
// Har document insert pe:
// 1. Document store          → 1 write
// 2. Index 1 update          → 1 write
// 3. Index 2 update          → 1 write
// 4. Index 3 update          → 1 write
// 5. Index 4 update          → 1 write
// 6. Index 5 update          → 1 write
// Total: 6 writes for 1 insert!
```

> **Warning:** Zyada indexes mat lagao! Har extra index = slow inserts/updates + zyada storage. Sirf un fields pe index lagao jo queries mein actually use hote hain.

### Index Strategy

| Situation | Recommendation |
|-----------|---------------|
| Read-heavy (dashboard, reports) | Zyada indexes OK |
| Write-heavy (IoT sensors, logs) | Kam indexes rakho |
| Mixed workload | Carefully plan karo |
| Rarely queried field | Index mat lagao |
| Frequently filtered field | Index zaroor lagao |

---

## MongoDB Profiler

### Slow Queries Pakdo

MongoDB profiler slow queries track karta hai:

```javascript
// Profiler enable karo (level 1 = slow queries only)
db.setProfilingLevel(1, { slowms: 100 }); // 100ms se zyada wali queries log karo

// Profiler ki info dekho
db.system.profile.find().sort({ ts: -1 }).limit(5);

// Output example
{
  "op": "query",
  "ns": "kisan-mandi.orders",
  "command": { "find": "orders", "filter": { "district": "Lucknow" } },
  "millis": 450,           // 450ms lagi — slow!
  "planSummary": "COLLSCAN" // Index nahi use hua
}
```

### Profiler Levels

| Level | Kya Log Karta Hai |
|-------|-------------------|
| 0 | Kuch nahi (off) |
| 1 | Sirf slow queries (slowms threshold ke upar) |
| 2 | Saari queries (development mein useful, production mein mat) |

> **Tip:** Production mein Level 1 use karo with slowms: 100. Ye sabse slow queries pakdega bina performance hit ke.

---

## SQL EXPLAIN (Bonus — SQL Knowledge)

### PostgreSQL/MySQL mein bhi hai EXPLAIN

```sql
-- SQL mein query plan dekho
EXPLAIN ANALYZE SELECT * FROM orders WHERE crop = 'Tomato';

-- Output
Seq Scan on orders  (cost=0.00..35.50 rows=4 width=64) (actual time=0.02..0.45 rows=4 loops=1)
  Filter: (crop = 'Tomato')
  Rows Removed by Filter: 996

-- Index add karo
CREATE INDEX idx_orders_crop ON orders(crop);

-- Ab phir dekho
EXPLAIN ANALYZE SELECT * FROM orders WHERE crop = 'Tomato';

-- Output (after index)
Index Scan using idx_orders_crop on orders  (cost=0.28..8.29 rows=4 width=64) (actual time=0.01..0.02 rows=4 loops=1)
  Index Cond: (crop = 'Tomato')
```

> **Yaad Rakho:** MongoDB mein `explain()`, SQL mein `EXPLAIN ANALYZE` — dono same kaam karte hain: batate hain query kaise execute hui aur kahan slow hai.

| Concept | MongoDB | SQL |
|---------|---------|-----|
| Full scan | COLLSCAN | Seq Scan |
| Index scan | IXSCAN | Index Scan |
| Create index | `createIndex({field: 1})` | `CREATE INDEX name ON table(field)` |
| Analyze query | `.explain()` | `EXPLAIN ANALYZE` |

---

## Unique aur Other Index Types

```javascript
// Unique index — duplicate values allowed nahi
await Order.collection.createIndex({ email: 1 }, { unique: true });

// TTL index — documents auto-delete after time
await Order.collection.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 } // 24 hours baad delete
);

// Text index — full-text search ke liye
await Order.collection.createIndex({ description: "text" });

// Partial index — sirf kuch documents index karo
await Order.collection.createIndex(
  { pricePerKg: 1 },
  { partialFilterExpression: { pricePerKg: { $gt: 50 } } }
  // Sirf price > 50 wale index mein jayenge — chhota index
);
```

> **Tip:** TTL index IoT data ke liye perfect hai — purana sensor data automatically delete ho jaaye. Partial index tab useful hai jab sirf kuch documents frequently query hote hain.

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| Index | Sorted data structure | Fast reads, slow writes |
| B-tree | Balanced tree | O(log n) search |
| Single Index | Ek field pe | `createIndex({field: 1})` |
| Compound Index | Multiple fields | Order matters (prefix rule) |
| COLLSCAN | Full collection scan | BAD — index nahi hai |
| IXSCAN | Index scan | GOOD — index use ho raha hai |
| explain() | Query analysis | docsExamined vs nReturned dekho |
| Profiler | Slow query detector | Level 1 production ke liye |
| Unique Index | No duplicates | email, username ke liye |
| TTL Index | Auto-delete | Temporary data ke liye |

---

## Aaj Kya Seekha?

1. **Indexes** — database ki phone book jo queries fast karti hai
2. **B-tree** — balanced tree structure, O(log n) search guarantee
3. **Single vs Compound index** — ek field ya multiple fields pe index
4. **Prefix Rule** — compound index mein order matter karta hai
5. **explain()** — query kaise execute hui ye analyze karo
6. **Write trade-off** — zyada indexes = slow inserts/updates
7. **Profiler** — slow queries automatically detect karo
8. **SQL EXPLAIN** — SQL mein bhi same concept hai

> **Practice Time!** Evening mein hum existing collections pe indexes add karenge, explain() se before/after performance measure karenge, aur slow queries optimize karenge!
