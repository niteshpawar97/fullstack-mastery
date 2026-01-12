# Day 49 Evening: Practice — Aggregation Queries on Kisan Market Data

> **Aaj ka plan:** Aaj hum real kisan market data pe aggregation queries likhenge — total revenue by crop, monthly trends, top farmers, district-wise analysis. Hands-on practice with MongoDB aggregation pipeline!

---

## Setup — Sample Data Insert Karo

### Database aur Collection Ready Karo

```javascript
// setup-data.js — Kisan mandi ka sample data
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/kisan-mandi');

const orderSchema = new mongoose.Schema({
  farmer: String,
  crop: String,
  qty: Number,        // kg mein
  pricePerKg: Number, // Rs per kg
  date: Date,
  district: String,
  category: String    // vegetable, fruit, grain
});

const Order = mongoose.model('Order', orderSchema);

// Sample data insert karo
const sampleOrders = [
  { farmer: "Ramesh", crop: "Tomato", qty: 500, pricePerKg: 40, date: new Date("2026-01-10"), district: "Lucknow", category: "vegetable" },
  { farmer: "Suresh", crop: "Potato", qty: 800, pricePerKg: 25, date: new Date("2026-01-15"), district: "Kanpur", category: "vegetable" },
  { farmer: "Mahesh", crop: "Wheat", qty: 2000, pricePerKg: 22, date: new Date("2026-01-20"), district: "Agra", category: "grain" },
  { farmer: "Ramesh", crop: "Onion", qty: 600, pricePerKg: 35, date: new Date("2026-02-05"), district: "Lucknow", category: "vegetable" },
  { farmer: "Dinesh", crop: "Mango", qty: 300, pricePerKg: 80, date: new Date("2026-02-10"), district: "Lucknow", category: "fruit" },
  { farmer: "Suresh", crop: "Tomato", qty: 400, pricePerKg: 45, date: new Date("2026-02-15"), district: "Kanpur", category: "vegetable" },
  { farmer: "Mahesh", crop: "Rice", qty: 1500, pricePerKg: 30, date: new Date("2026-02-20"), district: "Agra", category: "grain" },
  { farmer: "Ramesh", crop: "Tomato", qty: 700, pricePerKg: 38, date: new Date("2026-03-01"), district: "Lucknow", category: "vegetable" },
  { farmer: "Kamlesh", crop: "Banana", qty: 1000, pricePerKg: 25, date: new Date("2026-03-05"), district: "Varanasi", category: "fruit" },
  { farmer: "Suresh", crop: "Potato", qty: 1200, pricePerKg: 20, date: new Date("2026-03-10"), district: "Kanpur", category: "vegetable" },
  { farmer: "Dinesh", crop: "Mango", qty: 500, pricePerKg: 90, date: new Date("2026-03-15"), district: "Lucknow", category: "fruit" },
  { farmer: "Mahesh", crop: "Wheat", qty: 3000, pricePerKg: 24, date: new Date("2026-03-20"), district: "Agra", category: "grain" },
  { farmer: "Ramesh", crop: "Onion", qty: 400, pricePerKg: 30, date: new Date("2026-04-01"), district: "Lucknow", category: "vegetable" },
  { farmer: "Kamlesh", crop: "Banana", qty: 800, pricePerKg: 28, date: new Date("2026-04-02"), district: "Varanasi", category: "fruit" },
  { farmer: "Suresh", crop: "Tomato", qty: 600, pricePerKg: 42, date: new Date("2026-04-03"), district: "Kanpur", category: "vegetable" }
];

async function seedData() {
  await Order.deleteMany({}); // Purana data clear karo
  await Order.insertMany(sampleOrders);
  console.log(`${sampleOrders.length} orders inserted!`);
  process.exit(0);
}

seedData();
```

> **Terminal Command:**
> ```bash
> node setup-data.js
> ```

---

## Query 1: Total Revenue by Crop

```javascript
// query1.js — Har crop ki total revenue kitni hai?
const result = await Order.aggregate([
  // Stage 1: Revenue calculate karo
  {
    $addFields: {
      revenue: { $multiply: ["$qty", "$pricePerKg"] }
    }
  },
  // Stage 2: Crop ke hisaab se group karo
  {
    $group: {
      _id: "$crop",
      totalRevenue: { $sum: "$revenue" },
      totalQty: { $sum: "$qty" },
      avgPricePerKg: { $avg: "$pricePerKg" },
      orderCount: { $sum: 1 }
    }
  },
  // Stage 3: Revenue se sort karo (sabse zyada pehle)
  { $sort: { totalRevenue: -1 } },
  // Stage 4: Output clean karo
  {
    $project: {
      _id: 0,
      crop: "$_id",
      totalRevenue: 1,
      totalQty: 1,
      avgPricePerKg: { $round: ["$avgPricePerKg", 1] },
      orderCount: 1
    }
  }
]);

console.log("=== Revenue by Crop ===");
console.table(result);
```

> **Expected Output:**
> ```
> ┌─────┬──────────┬──────────────┬──────────┬───────────────┬────────────┐
> │     │ crop     │ totalRevenue │ totalQty │ avgPricePerKg │ orderCount │
> ├─────┼──────────┼──────────────┼──────────┼───────────────┼────────────┤
> │  0  │ Wheat    │    116000    │   5000   │     23.0      │     2      │
> │  1  │ Tomato   │     93600    │   2200   │     41.3      │     4      │
> │  2  │ Mango    │     69000    │    800   │     85.0      │     2      │
> │  3  │ Banana   │     47400    │   1800   │     26.5      │     2      │
> │  4  │ Potato   │     44000    │   2000   │     22.5      │     2      │
> │  5  │ Rice     │     45000    │   1500   │     30.0      │     1      │
> │  6  │ Onion    │     33000    │   1000   │     32.5      │     2      │
> └─────┴──────────┴──────────────┴──────────┴───────────────┴────────────┘
> ```

---

## Query 2: Monthly Revenue Trends

```javascript
// query2.js — Har month ki total revenue kaise badh rahi hai?
const monthlyTrends = await Order.aggregate([
  {
    $group: {
      _id: {
        year: { $year: "$date" },
        month: { $month: "$date" }
      },
      totalRevenue: { $sum: { $multiply: ["$qty", "$pricePerKg"] } },
      totalOrders: { $sum: 1 },
      totalQty: { $sum: "$qty" },
      uniqueCrops: { $addToSet: "$crop" }   // Unique crops list
    }
  },
  { $sort: { "_id.year": 1, "_id.month": 1 } },
  {
    $project: {
      _id: 0,
      month: {
        $concat: [
          { $toString: "$_id.year" }, "-",
          {
            $cond: {
              if: { $lt: ["$_id.month", 10] },
              then: { $concat: ["0", { $toString: "$_id.month" }] },
              else: { $toString: "$_id.month" }
            }
          }
        ]
      },
      totalRevenue: 1,
      totalOrders: 1,
      totalQty: 1,
      cropCount: { $size: "$uniqueCrops" }  // Kitni alag crops
    }
  }
]);

console.log("=== Monthly Trends ===");
console.table(monthlyTrends);
```

> **Socho Aise:** Monthly trends se pata chalta hai business badh raha hai ya nahi. Kisan ko pata chalega ki kaunse mahine mein zyada bikri hoti hai — us hisaab se planning kar sakta hai.

---

## Query 3: Top Farmers by Revenue

```javascript
// query3.js — Sabse zyada kamane wale farmers kaun hain?
const topFarmers = await Order.aggregate([
  // Revenue calculate karo
  {
    $addFields: {
      revenue: { $multiply: ["$qty", "$pricePerKg"] }
    }
  },
  // Farmer ke hisaab se group karo
  {
    $group: {
      _id: "$farmer",
      totalRevenue: { $sum: "$revenue" },
      totalOrders: { $sum: 1 },
      totalQty: { $sum: "$qty" },
      crops: { $addToSet: "$crop" },          // Kaunsi crops becheen
      districts: { $addToSet: "$district" },  // Kahan se
      avgOrderValue: { $avg: "$revenue" }
    }
  },
  { $sort: { totalRevenue: -1 } },
  // Top 5 farmers
  { $limit: 5 },
  {
    $project: {
      _id: 0,
      farmer: "$_id",
      totalRevenue: 1,
      totalOrders: 1,
      totalQty: 1,
      crops: 1,
      avgOrderValue: { $round: ["$avgOrderValue", 0] }
    }
  }
]);

console.log("=== Top Farmers ===");
topFarmers.forEach(f => {
  console.log(`${f.farmer}: Rs ${f.totalRevenue} | ${f.totalOrders} orders | Crops: ${f.crops.join(', ')}`);
});
```

---

## Query 4: District-wise Analysis

```javascript
// query4.js — Kaunse district se zyada business aa raha hai?
const districtAnalysis = await Order.aggregate([
  {
    $group: {
      _id: "$district",
      totalRevenue: { $sum: { $multiply: ["$qty", "$pricePerKg"] } },
      totalOrders: { $sum: 1 },
      uniqueFarmers: { $addToSet: "$farmer" },
      uniqueCrops: { $addToSet: "$crop" },
      avgOrderSize: { $avg: "$qty" }
    }
  },
  { $sort: { totalRevenue: -1 } },
  {
    $project: {
      _id: 0,
      district: "$_id",
      totalRevenue: 1,
      totalOrders: 1,
      farmerCount: { $size: "$uniqueFarmers" },
      cropVariety: { $size: "$uniqueCrops" },
      avgOrderSize: { $round: ["$avgOrderSize", 0] }
    }
  }
]);

console.log("=== District Analysis ===");
console.table(districtAnalysis);
```

> **Example:** Is query se mandi manager ko pata chalega — "Lucknow se sabse zyada business aa raha hai, 4 alag crops bik rahi hain, 2 unique farmers hain."

---

## Query 5: Category-wise Revenue (vegetable, fruit, grain)

```javascript
// query5.js — Vegetables zyada bikte hain ya fruits ya grains?
const categoryRevenue = await Order.aggregate([
  {
    $group: {
      _id: "$category",
      totalRevenue: { $sum: { $multiply: ["$qty", "$pricePerKg"] } },
      totalQty: { $sum: "$qty" },
      avgPricePerKg: { $avg: "$pricePerKg" },
      crops: { $addToSet: "$crop" }
    }
  },
  { $sort: { totalRevenue: -1 } },
  {
    $addFields: {
      revenuePerKg: { $round: [{ $divide: ["$totalRevenue", "$totalQty"] }, 1] }
    }
  },
  {
    $project: {
      _id: 0,
      category: "$_id",
      totalRevenue: 1,
      totalQty: 1,
      avgPricePerKg: { $round: ["$avgPricePerKg", 1] },
      revenuePerKg: 1,
      crops: 1
    }
  }
]);

console.log("=== Category Analysis ===");
console.table(categoryRevenue);
```

---

## Query 6: Farmer ka Crop-wise Breakup

```javascript
// query6.js — Ramesh ne kaunsi crop se kitna kamaya?
const farmerBreakup = await Order.aggregate([
  { $match: { farmer: "Ramesh" } },   // Sirf Ramesh ke orders
  {
    $group: {
      _id: "$crop",
      totalRevenue: { $sum: { $multiply: ["$qty", "$pricePerKg"] } },
      totalQty: { $sum: "$qty" },
      orderCount: { $sum: 1 },
      dateRange: {
        $push: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" }
        }
      }
    }
  },
  { $sort: { totalRevenue: -1 } },
  {
    $project: {
      _id: 0,
      crop: "$_id",
      totalRevenue: 1,
      totalQty: 1,
      orderCount: 1,
      dates: "$dateRange"
    }
  }
]);

console.log("=== Ramesh ka Breakup ===");
farmerBreakup.forEach(item => {
  console.log(`${item.crop}: Rs ${item.totalRevenue} (${item.totalQty} kg, ${item.orderCount} orders)`);
  console.log(`  Dates: ${item.dates.join(', ')}`);
});
```

---

## Query 7: Price Trends per Crop Over Months

```javascript
// query7.js — Tomato ka price time ke saath kaise change hua?
const priceTrends = await Order.aggregate([
  { $match: { crop: "Tomato" } },
  {
    $group: {
      _id: { month: { $month: "$date" } },
      avgPrice: { $avg: "$pricePerKg" },
      minPrice: { $min: "$pricePerKg" },
      maxPrice: { $max: "$pricePerKg" },
      totalQty: { $sum: "$qty" }
    }
  },
  { $sort: { "_id.month": 1 } },
  {
    $project: {
      _id: 0,
      month: "$_id.month",
      avgPrice: { $round: ["$avgPrice", 1] },
      minPrice: 1,
      maxPrice: 1,
      totalQty: 1,
      priceRange: { $subtract: ["$maxPrice", "$minPrice"] }
    }
  }
]);

console.log("=== Tomato Price Trends ===");
console.table(priceTrends);
```

> **Tip:** Price trends se kisan samajh sakta hai ki kab bechna sahi hai. Agar March mein Tomato ka price zyada hai toh March mein zyada supply laao.

---

## Complete Runner Script

```javascript
// run-all-queries.js — Saari queries ek saath run karo
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/kisan-mandi');

const Order = mongoose.model('Order', new mongoose.Schema({
  farmer: String, crop: String, qty: Number,
  pricePerKg: Number, date: Date, district: String, category: String
}));

async function runQueries() {
  // Query 1 yahan paste karo...
  // Query 2 yahan paste karo...
  // ... aur baaki saare

  console.log('All queries completed!');
  process.exit(0);
}

runQueries().catch(console.error);
```

> **Terminal Command:**
> ```bash
> node run-all-queries.js
> ```

---

## Quick Revision Table

| Query | Stages Used | Business Question |
|-------|-------------|-------------------|
| Revenue by Crop | addFields, group, sort, project | Kaunsi crop se zyada paisa? |
| Monthly Trends | group (year+month), sort, project | Business badh raha hai? |
| Top Farmers | group, sort, limit | Kaun zyada kama raha hai? |
| District Analysis | group, sort, project | Kahan se business aa raha hai? |
| Category Revenue | group, sort, addFields | Vegetable vs Fruit vs Grain? |
| Farmer Breakup | match, group, sort | Ek farmer ka poora analysis |
| Price Trends | match, group, sort | Price kaise change ho raha hai? |

---

## Aaj Kya Seekha?

1. **Revenue by Crop** — $multiply se revenue calculate, $group se total
2. **Monthly Trends** — $year/$month se date fields extract, month-wise group
3. **Top Farmers** — $addToSet se unique crops list, $limit se top 5
4. **District Analysis** — $size se set ka count, multi-dimension analysis
5. **Category wise** — $divide se per-kg revenue, $addFields se naye calculations
6. **Price Trends** — time-series analysis kaise karte hain
7. **Real business questions** ko aggregation queries mein convert karna seekha

> **Practice Time!** Apne kisan-mandi data pe ye extra queries likho: (1) Kaunsa month sabse zyada orders aaye? (2) Har district ka top crop kaunsa hai? (3) Average order value month-wise kaise change ho raha hai? Kal indexing aur performance optimization seekhenge!
