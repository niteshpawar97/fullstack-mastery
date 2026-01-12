# Day 50 Evening: Practice — Indexing, Performance Measurement, Query Optimization

> **Aaj ka plan:** Aaj hum hands-on practice karenge — existing collections pe indexes add karenge, explain() se before/after performance compare karenge, aur slow queries optimize karenge.

---

## Setup — Test Data Generate Karo

### Bahut Saara Data Chahiye Performance Difference Dikhane Ke Liye

```javascript
// generate-data.js — 1 Lakh orders generate karo
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/index-practice');

const orderSchema = new mongoose.Schema({
  farmer: String,
  crop: String,
  qty: Number,
  pricePerKg: Number,
  date: Date,
  district: String,
  category: String,
  status: String
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

const farmers = ['Ramesh', 'Suresh', 'Mahesh', 'Dinesh', 'Kamlesh', 'Rajesh', 'Ganesh', 'Umesh', 'Naresh', 'Hitesh'];
const crops = ['Tomato', 'Potato', 'Onion', 'Wheat', 'Rice', 'Mango', 'Banana', 'Apple', 'Cabbage', 'Carrot'];
const districts = ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Bareilly', 'Gorakhpur'];
const categories = ['vegetable', 'fruit', 'grain'];
const statuses = ['completed', 'pending', 'cancelled'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function generateData() {
  await Order.deleteMany({});

  const batch = [];
  for (let i = 0; i < 100000; i++) {
    batch.push({
      farmer: randomFrom(farmers),
      crop: randomFrom(crops),
      qty: randomBetween(10, 5000),
      pricePerKg: randomBetween(5, 100),
      date: new Date(2025, randomBetween(0, 11), randomBetween(1, 28)),
      district: randomFrom(districts),
      category: randomFrom(categories),
      status: randomFrom(statuses)
    });

    // Har 10000 documents batch insert karo
    if (batch.length === 10000) {
      await Order.insertMany(batch);
      batch.length = 0;
      process.stdout.write('.');
    }
  }

  if (batch.length > 0) await Order.insertMany(batch);

  console.log('\n1,00,000 orders generated!');
  process.exit(0);
}

generateData();
```

> **Terminal Command:**
> ```bash
> node generate-data.js
> ```

> **Expected Output:**
> ```
> ..........
> 1,00,000 orders generated!
> ```

---

## Step 1: Query Performance WITHOUT Index

### explain() Se Measure Karo

```javascript
// measure-before.js — Bina index ke performance dekho
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/index-practice');

const Order = mongoose.model('Order', new mongoose.Schema({
  farmer: String, crop: String, qty: Number, pricePerKg: Number,
  date: Date, district: String, category: String, status: String
}, { timestamps: true }));

async function measurePerformance() {
  console.log('=== BEFORE INDEXES ===\n');

  // Query 1: Find by crop
  console.log('--- Query 1: Find Tomato orders ---');
  let result = await Order.find({ crop: 'Tomato' }).explain('executionStats');
  let stats = result.executionStats;
  console.log(`Stage: ${result.queryPlanner.winningPlan.stage}`);
  console.log(`Documents Returned: ${stats.nReturned}`);
  console.log(`Documents Examined: ${stats.totalDocsExamined}`);
  console.log(`Time: ${stats.executionTimeMillis}ms`);
  console.log(`Efficiency: ${(stats.nReturned / stats.totalDocsExamined * 100).toFixed(1)}%\n`);

  // Query 2: Find by district + crop
  console.log('--- Query 2: Lucknow + Tomato ---');
  result = await Order.find({ district: 'Lucknow', crop: 'Tomato' }).explain('executionStats');
  stats = result.executionStats;
  console.log(`Stage: ${result.queryPlanner.winningPlan.stage}`);
  console.log(`Documents Returned: ${stats.nReturned}`);
  console.log(`Documents Examined: ${stats.totalDocsExamined}`);
  console.log(`Time: ${stats.executionTimeMillis}ms`);
  console.log(`Efficiency: ${(stats.nReturned / stats.totalDocsExamined * 100).toFixed(1)}%\n`);

  // Query 3: Sort by date
  console.log('--- Query 3: Sort by date (latest first) ---');
  result = await Order.find({ crop: 'Tomato' }).sort({ date: -1 }).limit(10).explain('executionStats');
  stats = result.executionStats;
  console.log(`Stage: ${result.queryPlanner.winningPlan.stage || 'SORT + COLLSCAN'}`);
  console.log(`Documents Returned: ${stats.nReturned}`);
  console.log(`Documents Examined: ${stats.totalDocsExamined}`);
  console.log(`Time: ${stats.executionTimeMillis}ms\n`);

  // Query 4: Range query
  console.log('--- Query 4: Price range (50-80) ---');
  result = await Order.find({ pricePerKg: { $gte: 50, $lte: 80 } }).explain('executionStats');
  stats = result.executionStats;
  console.log(`Stage: ${result.queryPlanner.winningPlan.stage}`);
  console.log(`Documents Returned: ${stats.nReturned}`);
  console.log(`Documents Examined: ${stats.totalDocsExamined}`);
  console.log(`Time: ${stats.executionTimeMillis}ms`);
  console.log(`Efficiency: ${(stats.nReturned / stats.totalDocsExamined * 100).toFixed(1)}%\n`);

  process.exit(0);
}

measurePerformance();
```

> **Terminal Command:**
> ```bash
> node measure-before.js
> ```

> **Expected Output (approx):**
> ```
> === BEFORE INDEXES ===
>
> --- Query 1: Find Tomato orders ---
> Stage: COLLSCAN              ← Full scan! BAD!
> Documents Returned: ~10000
> Documents Examined: 100000   ← Saare 1 lakh scan kiye!
> Time: ~85ms
> Efficiency: ~10.0%
> ```

> **Yaad Rakho:** `COLLSCAN` dikhna matlab index nahi hai. `totalDocsExamined: 100000` matlab poori collection scan hui sirf ~10000 documents ke liye. Bahut wasteful!

---

## Step 2: Indexes Add Karo

```javascript
// add-indexes.js — Strategic indexes lagao
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/index-practice');

const Order = mongoose.model('Order', new mongoose.Schema({
  farmer: String, crop: String, qty: Number, pricePerKg: Number,
  date: Date, district: String, category: String, status: String
}, { timestamps: true }));

async function addIndexes() {
  console.log('Adding indexes...\n');

  // Index 1: Single field — crop pe (zyada queries crop pe hoti hain)
  let start = Date.now();
  await Order.collection.createIndex({ crop: 1 });
  console.log(`Index 1 (crop): ${Date.now() - start}ms`);

  // Index 2: Compound — district + crop (dono saath query hote hain)
  start = Date.now();
  await Order.collection.createIndex({ district: 1, crop: 1 });
  console.log(`Index 2 (district+crop): ${Date.now() - start}ms`);

  // Index 3: Compound — crop + date (filter + sort)
  start = Date.now();
  await Order.collection.createIndex({ crop: 1, date: -1 });
  console.log(`Index 3 (crop+date desc): ${Date.now() - start}ms`);

  // Index 4: Single field — pricePerKg (range queries ke liye)
  start = Date.now();
  await Order.collection.createIndex({ pricePerKg: 1 });
  console.log(`Index 4 (pricePerKg): ${Date.now() - start}ms`);

  // Saare indexes dekho
  const indexes = await Order.collection.indexes();
  console.log('\nAll indexes:');
  indexes.forEach(idx => {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  process.exit(0);
}

addIndexes();
```

> **Terminal Command:**
> ```bash
> node add-indexes.js
> ```

> **Expected Output:**
> ```
> Adding indexes...
> Index 1 (crop): 180ms
> Index 2 (district+crop): 210ms
> Index 3 (crop+date desc): 195ms
> Index 4 (pricePerKg): 160ms
>
> All indexes:
>   _id_: {"_id":1}
>   crop_1: {"crop":1}
>   district_1_crop_1: {"district":1,"crop":1}
>   crop_1_date_-1: {"crop":1,"date":-1}
>   pricePerKg_1: {"pricePerKg":1}
> ```

---

## Step 3: Query Performance WITH Index

```javascript
// measure-after.js — Index ke baad performance dekho
// (Same queries as before — ab results compare karo)

async function measureAfterIndex() {
  console.log('=== AFTER INDEXES ===\n');

  // Query 1: Find by crop — ab crop_1 index use hoga
  console.log('--- Query 1: Find Tomato orders ---');
  let result = await Order.find({ crop: 'Tomato' }).explain('executionStats');
  let stats = result.executionStats;
  console.log(`Stage: ${result.queryPlanner.winningPlan.inputStage?.stage || result.queryPlanner.winningPlan.stage}`);
  console.log(`Documents Returned: ${stats.nReturned}`);
  console.log(`Keys Examined: ${stats.totalKeysExamined}`);
  console.log(`Documents Examined: ${stats.totalDocsExamined}`);
  console.log(`Time: ${stats.executionTimeMillis}ms`);
  console.log(`Efficiency: ${(stats.nReturned / Math.max(stats.totalDocsExamined, 1) * 100).toFixed(1)}%\n`);

  // Query 2: Find by district + crop — compound index use hoga
  console.log('--- Query 2: Lucknow + Tomato ---');
  result = await Order.find({ district: 'Lucknow', crop: 'Tomato' }).explain('executionStats');
  stats = result.executionStats;
  console.log(`Index: ${result.queryPlanner.winningPlan.inputStage?.indexName || 'N/A'}`);
  console.log(`Documents Returned: ${stats.nReturned}`);
  console.log(`Documents Examined: ${stats.totalDocsExamined}`);
  console.log(`Time: ${stats.executionTimeMillis}ms\n`);

  // Query 3: Sort by date — crop+date compound index use hoga
  console.log('--- Query 3: Tomato sorted by date ---');
  result = await Order.find({ crop: 'Tomato' }).sort({ date: -1 }).limit(10).explain('executionStats');
  stats = result.executionStats;
  console.log(`Documents Returned: ${stats.nReturned}`);
  console.log(`Documents Examined: ${stats.totalDocsExamined}`);
  console.log(`Time: ${stats.executionTimeMillis}ms`);
  console.log('(Sort in-memory nahi hua — index se sorted aaya!)\n');

  // Query 4: Range query
  console.log('--- Query 4: Price range (50-80) ---');
  result = await Order.find({ pricePerKg: { $gte: 50, $lte: 80 } }).explain('executionStats');
  stats = result.executionStats;
  console.log(`Documents Returned: ${stats.nReturned}`);
  console.log(`Documents Examined: ${stats.totalDocsExamined}`);
  console.log(`Time: ${stats.executionTimeMillis}ms\n`);

  process.exit(0);
}

measureAfterIndex();
```

> **Expected Output (approx):**
> ```
> === AFTER INDEXES ===
>
> --- Query 1: Find Tomato orders ---
> Stage: IXSCAN                 ← Index use hua! GOOD!
> Documents Returned: ~10000
> Keys Examined: ~10000
> Documents Examined: ~10000    ← Sirf zaroori documents examine kiye!
> Time: ~15ms                   ← 85ms se 15ms! 5x faster!
> Efficiency: 100.0%
> ```

---

## Before vs After Comparison

| Query | Before (COLLSCAN) | After (IXSCAN) | Improvement |
|-------|-------------------|-----------------|-------------|
| Find by crop | ~85ms, 100K examined | ~15ms, 10K examined | **5-6x faster** |
| District + Crop | ~90ms, 100K examined | ~5ms, ~1.2K examined | **18x faster** |
| Sort by date | ~120ms, 100K examined | ~1ms, 10 examined | **120x faster** |
| Price range | ~70ms, 100K examined | ~20ms, 30K examined | **3-4x faster** |

> **Socho Aise:** Bina index ke tum mandi ke 1 lakh receipts mein se ek-ek check kar rahe the. Index lagne ke baad seedha sahi pile pe pahunch jaate ho. Time aur effort dono bach gaya!

---

## Step 4: Write Performance Impact

```javascript
// write-impact.js — Index ka insert pe kya asar hota hai
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/index-practice');

// Collection WITHOUT indexes
const RawSchema = new mongoose.Schema({ a: String, b: Number, c: Date });
const RawModel = mongoose.model('Raw', RawSchema);

// Collection WITH indexes
const IndexedSchema = new mongoose.Schema({ a: String, b: Number, c: Date });
IndexedSchema.index({ a: 1 });
IndexedSchema.index({ b: 1 });
IndexedSchema.index({ c: -1 });
IndexedSchema.index({ a: 1, b: 1 });
const IndexedModel = mongoose.model('Indexed', IndexedSchema);

async function testWritePerformance() {
  await RawModel.deleteMany({});
  await IndexedModel.deleteMany({});
  await IndexedModel.ensureIndexes();

  const data = [];
  for (let i = 0; i < 10000; i++) {
    data.push({ a: `item-${i}`, b: Math.random() * 1000, c: new Date() });
  }

  // Without indexes — fast insert
  let start = Date.now();
  await RawModel.insertMany(data);
  const rawTime = Date.now() - start;

  // With indexes — slow insert (4 indexes update karne padte hain)
  start = Date.now();
  await IndexedModel.insertMany(data);
  const indexedTime = Date.now() - start;

  console.log(`Insert 10,000 docs WITHOUT indexes: ${rawTime}ms`);
  console.log(`Insert 10,000 docs WITH 4 indexes:  ${indexedTime}ms`);
  console.log(`Overhead: ${((indexedTime - rawTime) / rawTime * 100).toFixed(0)}% slower writes`);

  process.exit(0);
}

testWritePerformance();
```

> **Expected Output:**
> ```
> Insert 10,000 docs WITHOUT indexes: ~120ms
> Insert 10,000 docs WITH 4 indexes:  ~280ms
> Overhead: ~133% slower writes
> ```

> **Warning:** 4 indexes ke saath writes 2x+ slow ho gayi! IoT projects mein jahan har second 100s of sensor readings aate hain, zyada indexes performance kill kar sakte hain. Balance rakhna zaroori hai.

---

## Step 5: Slow Query Optimization

```javascript
// optimize.js — Slow queries find karo aur fix karo
async function findAndFixSlowQueries() {

  // Slow Query 1: farmer + status + date sort
  console.log('=== Slow Query: farmer + status + date sort ===');
  let before = await Order.find({ farmer: 'Ramesh', status: 'completed' })
    .sort({ date: -1 }).limit(20).explain('executionStats');
  console.log(`BEFORE — Examined: ${before.executionStats.totalDocsExamined}, Time: ${before.executionStats.executionTimeMillis}ms`);

  // Fix: Compound index banao jisme filter + sort dono covered ho
  await Order.collection.createIndex({ farmer: 1, status: 1, date: -1 });
  console.log('Index added: { farmer: 1, status: 1, date: -1 }');

  let after = await Order.find({ farmer: 'Ramesh', status: 'completed' })
    .sort({ date: -1 }).limit(20).explain('executionStats');
  console.log(`AFTER  — Examined: ${after.executionStats.totalDocsExamined}, Time: ${after.executionStats.executionTimeMillis}ms\n`);

  // Slow Query 2: category aggregation
  console.log('=== Slow Query: category aggregation ===');
  await Order.collection.createIndex({ category: 1, pricePerKg: 1 });
  console.log('Index added: { category: 1, pricePerKg: 1 }');
  console.log('Aggregation $match on category will now use IXSCAN\n');

  // Show all indexes
  const allIndexes = await Order.collection.indexes();
  console.log('=== All Indexes ===');
  allIndexes.forEach(idx => console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`));

  process.exit(0);
}

findAndFixSlowQueries();
```

---

## Index Design Checklist

```
✅ DO:
  □ $match / find() mein frequently used fields pe index lagao
  □ Sort fields ko compound index mein include karo
  □ explain() se verify karo IXSCAN ho raha hai
  □ Compound index mein high-cardinality field pehle rakhne ki koshish karo
  □ Production mein profiler enable karo (level 1)

❌ DON'T:
  □ Har field pe index mat lagao
  □ Write-heavy collections pe bahut zyada indexes mat lagao
  □ Rarely used queries ke liye index mat banao
  □ Duplicate indexes mat banao (crop_1 hai toh crop_1_date_-1 crop queries bhi cover karega)
```

---

## Quick Revision Table

| Action | Command | Purpose |
|--------|---------|---------|
| Create index | `createIndex({field: 1})` | Fast queries |
| List indexes | `collection.indexes()` | Kaunse indexes hain |
| Drop index | `dropIndex('indexName')` | Extra index hatao |
| Explain query | `.explain('executionStats')` | Performance analyze |
| Check scan type | `winningPlan.stage` | IXSCAN vs COLLSCAN |
| Check efficiency | `nReturned / totalDocsExamined` | 1.0 = perfect |
| Enable profiler | `db.setProfilingLevel(1)` | Slow queries catch |

---

## Aaj Kya Seekha?

1. **Performance measurement** — explain() se before/after compare kiya
2. **COLLSCAN vs IXSCAN** — bina index full scan, index ke saath targeted scan
3. **Strategic indexing** — filter fields + sort fields ko cover karo
4. **Write overhead** — har extra index inserts slow karta hai
5. **Compound index** — multiple fields ko ek index mein combine karo
6. **Query optimization** — slow queries identify karo aur fix karo
7. **Balance** — read speed vs write speed ka trade-off samjho

> **Practice Time!** Apne IoT dashboard project (Day 48) pe jaao aur: (1) explain() se current queries check karo. (2) Zaroori indexes add karo. (3) Before/after time compare karo. Kal revision day hai — sab kuch revise karenge!
