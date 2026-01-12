# Day 49 Morning: Advanced MongoDB — Aggregation Pipeline

> **Aaj ka plan:** Aaj hum MongoDB ki sabse powerful feature seekhenge — Aggregation Pipeline. $match, $group, $sort, $project, $lookup (join), $unwind, $addFields sab cover karenge. Real-world analytics queries likhenge — total sales, average price, top products.

---

## Aggregation Pipeline Kya Hai?

### Data Processing Factory

Aggregation Pipeline ek **data processing conveyor belt** hai. Data ek stage se doosre stage mein jaata hai — har stage kuch transform karta hai.

```
Documents ──→ $match ──→ $group ──→ $sort ──→ $project ──→ Result
(Raw data)   (Filter)   (Group)   (Sort)    (Shape)     (Final)
```

> **Socho Aise:** Socho ek mandi hai jahan 10,000 transactions hain. Tumhe jaanna hai "har fasal ki total bikri kitni hai?" Raw data mein tumhe kuch nahi dikhega. Aggregation pipeline se tum filter karo, group karo, sort karo — aur saaf answer mil jaaye.

### Basic Syntax

```javascript
// Aggregation pipeline ka basic structure
const result = await Collection.aggregate([
  { $match: { /* filter */ } },     // Stage 1: Filter karo
  { $group: { /* group */ } },      // Stage 2: Group karo
  { $sort: { /* sort */ } },        // Stage 3: Sort karo
  { $project: { /* shape */ } },    // Stage 4: Output shape karo
]);
```

> **Yaad Rakho:** Pipeline mein stages ka **order matter** karta hai! Pehle $match karo (data kam karo), phir $group karo. Ulta karoge toh pehle sab group hoga phir filter — slow aur galat!

---

## Sample Data — Kisan Mandi

Hum ye sample data use karenge poore lesson mein:

```javascript
// orders collection — mandi ke transactions
[
  { farmer: "Ramesh", crop: "Tomato", qty: 100, price: 40, date: "2026-01-15", district: "Lucknow" },
  { farmer: "Suresh", crop: "Potato", qty: 200, price: 25, date: "2026-01-20", district: "Kanpur" },
  { farmer: "Ramesh", crop: "Onion", qty: 150, price: 35, date: "2026-02-10", district: "Lucknow" },
  { farmer: "Mahesh", crop: "Tomato", qty: 80, price: 45, date: "2026-02-15", district: "Agra" },
  { farmer: "Suresh", crop: "Tomato", qty: 120, price: 42, date: "2026-03-01", district: "Kanpur" },
  { farmer: "Ramesh", crop: "Potato", qty: 300, price: 22, date: "2026-03-10", district: "Lucknow" },
  // ... aur bahut saare
]
```

---

## $match — Filter Karo

### SQL ke WHERE Jaisa

```javascript
// Sirf Tomato ke orders filter karo
const result = await Order.aggregate([
  { $match: { crop: "Tomato" } }
]);
// SQL equivalent: SELECT * FROM orders WHERE crop = 'Tomato'

// Multiple conditions
const result2 = await Order.aggregate([
  {
    $match: {
      crop: "Tomato",
      price: { $gte: 40 },           // Price 40 ya zyada
      date: { $gte: "2026-02-01" }   // February se baad
    }
  }
]);
// SQL: WHERE crop='Tomato' AND price >= 40 AND date >= '2026-02-01'
```

> **Tip:** `$match` hamesha pipeline mein **pehle** rakho. Ye jitna jaldi data kam karega, utna baaki stages fast chalenge. $match indexes bhi use kar sakta hai (sirf pehle stage mein).

---

## $group — Group Karo Aur Calculate Karo

### SQL ke GROUP BY Jaisa

```javascript
// Har crop ki total quantity aur total revenue nikalo
const result = await Order.aggregate([
  {
    $group: {
      _id: "$crop",                          // Group by crop
      totalQty: { $sum: "$qty" },            // Total quantity
      totalRevenue: { $sum: { $multiply: ["$qty", "$price"] } }, // qty * price
      avgPrice: { $avg: "$price" },          // Average price
      orderCount: { $sum: 1 },               // Kitne orders
      maxPrice: { $max: "$price" },          // Sabse zyada price
      minPrice: { $min: "$price" }           // Sabse kam price
    }
  }
]);
```

> **Expected Output:**
> ```json
> [
>   { "_id": "Tomato", "totalQty": 300, "totalRevenue": 13140, "avgPrice": 42.3, "orderCount": 3 },
>   { "_id": "Potato", "totalQty": 500, "totalRevenue": 11600, "avgPrice": 23.5, "orderCount": 2 },
>   { "_id": "Onion", "totalQty": 150, "totalRevenue": 5250, "avgPrice": 35, "orderCount": 1 }
> ]
> ```

### Group Operators

| Operator | Kya Karta Hai | Example |
|----------|---------------|---------|
| `$sum` | Total nikale | `$sum: "$qty"` |
| `$avg` | Average nikale | `$avg: "$price"` |
| `$min` | Minimum value | `$min: "$price"` |
| `$max` | Maximum value | `$max: "$price"` |
| `$first` | Pehla document | `$first: "$farmer"` |
| `$last` | Aakhri document | `$last: "$date"` |
| `$push` | Array mein daalo | `$push: "$farmer"` |
| `$addToSet` | Unique array | `$addToSet: "$district"` |

> **Yaad Rakho:** `_id` field mein jo likho, wahi GROUP BY ka criteria hai. `_id: "$crop"` = group by crop. `_id: null` = saare documents ek group mein (total nikalna ho toh).

### Multiple Fields Se Group

```javascript
// District + Crop ke hisaab se group karo
const result = await Order.aggregate([
  {
    $group: {
      _id: {
        district: "$district",
        crop: "$crop"
      },
      totalRevenue: { $sum: { $multiply: ["$qty", "$price"] } },
      avgPrice: { $avg: "$price" }
    }
  }
]);
// Result: { _id: { district: "Lucknow", crop: "Tomato" }, totalRevenue: 4000, ... }
```

---

## $sort — Sort Karo

### SQL ke ORDER BY Jaisa

```javascript
// Total revenue ke hisaab se sort karo (sabse zyada pehle)
const topCrops = await Order.aggregate([
  {
    $group: {
      _id: "$crop",
      totalRevenue: { $sum: { $multiply: ["$qty", "$price"] } }
    }
  },
  { $sort: { totalRevenue: -1 } }  // -1 = descending, 1 = ascending
]);
```

> **Tip:** `1` = ascending (chhota se bada), `-1` = descending (bada se chhota). Revenue sort karni ho toh `-1` use karo — top performers pehle dikhein.

---

## $project — Output Shape Karo

### SQL ke SELECT Jaisa

```javascript
// Sirf zaroori fields dikhaao, rename karo, calculate karo
const result = await Order.aggregate([
  {
    $group: {
      _id: "$crop",
      totalQty: { $sum: "$qty" },
      totalRevenue: { $sum: { $multiply: ["$qty", "$price"] } },
      avgPrice: { $avg: "$price" }
    }
  },
  {
    $project: {
      _id: 0,                                    // _id hide karo
      cropName: "$_id",                           // _id ko rename karo
      totalQty: 1,                                // Dikhao
      totalRevenue: 1,                            // Dikhao
      avgPrice: { $round: ["$avgPrice", 2] },     // 2 decimal places
      priceCategory: {                            // Naya field calculate karo
        $cond: {
          if: { $gte: ["$avgPrice", 40] },
          then: "Premium",
          else: "Standard"
        }
      }
    }
  }
]);
```

> **Expected Output:**
> ```json
> [
>   { "cropName": "Tomato", "totalQty": 300, "totalRevenue": 13140, "avgPrice": 42.3, "priceCategory": "Premium" },
>   { "cropName": "Potato", "totalQty": 500, "totalRevenue": 11600, "avgPrice": 23.5, "priceCategory": "Standard" }
> ]
> ```

---

## $lookup — JOIN (Collections Milo)

### SQL ke JOIN Jaisa

```javascript
// Orders collection mein farmer details join karo
// farmers collection: { _id, name, phone, district }
// orders collection: { farmer, crop, qty, price }

const result = await Order.aggregate([
  {
    $lookup: {
      from: "farmers",        // Kaunsi collection se join karna hai
      localField: "farmer",   // Orders mein kaunsa field
      foreignField: "name",   // Farmers mein kaunsa field match kare
      as: "farmerDetails"     // Result array ka naam
    }
  }
]);
// Result mein har order ke saath farmerDetails array aayega
```

> **Socho Aise:** $lookup = do tables ko jodna. Jaise orders table mein farmer ka naam hai, farmers table mein uska phone number hai. $lookup se dono mila dete hain — ab order ke saath farmer ka phone bhi dikh jaaye.

### $lookup with pipeline (Advanced)

```javascript
const result = await Order.aggregate([
  {
    $lookup: {
      from: "farmers",
      let: { farmerName: "$farmer" },   // Variable pass karo
      pipeline: [
        { $match: { $expr: { $eq: ["$name", "$$farmerName"] } } },
        { $project: { phone: 1, district: 1, _id: 0 } }  // Sirf zaroori fields
      ],
      as: "farmerInfo"
    }
  }
]);
```

---

## $unwind — Array Kholo

### Array Ke Har Element Alag Document Bane

```javascript
// Agar farmer ke paas crops array hai
// { farmer: "Ramesh", crops: ["Tomato", "Potato", "Onion"] }

const result = await Farmer.aggregate([
  { $unwind: "$crops" }
]);

// Result — 3 separate documents:
// { farmer: "Ramesh", crops: "Tomato" }
// { farmer: "Ramesh", crops: "Potato" }
// { farmer: "Ramesh", crops: "Onion" }
```

> **Yaad Rakho:** `$unwind` ke baad array wala field normal value ban jaata hai. Ye $lookup ke baad kaafi use hota hai kyunki $lookup result ek array deta hai.

```javascript
// $lookup ke baad $unwind karo
const result = await Order.aggregate([
  {
    $lookup: {
      from: "farmers",
      localField: "farmer",
      foreignField: "name",
      as: "farmerDetails"
    }
  },
  { $unwind: "$farmerDetails" },  // Array se single object banao
  {
    $project: {
      crop: 1,
      qty: 1,
      farmerPhone: "$farmerDetails.phone"  // Ab direct access
    }
  }
]);
```

---

## $addFields — Naye Fields Add Karo

### Bina Purane Fields Hataaye

```javascript
// Revenue calculate karke naya field add karo
const result = await Order.aggregate([
  {
    $addFields: {
      revenue: { $multiply: ["$qty", "$price"] },  // qty * price
      month: { $month: { $dateFromString: { dateString: "$date" } } },
      isHighValue: { $gte: [{ $multiply: ["$qty", "$price"] }, 5000] }
    }
  }
]);
// Ab har document mein revenue, month, isHighValue fields bhi honge
// PLUS purane saare fields bhi rahenge
```

> **Tip:** `$addFields` aur `$project` mein fark ye hai — `$addFields` purane fields rakhta hai aur naye add karta hai. `$project` mein tum explicitly batao kya rakhna hai kya nahi.

---

## Complete Analytics Pipeline

### Top 5 Crops by Revenue

```javascript
// Sabse zyada kamane wali 5 crops
const topCrops = await Order.aggregate([
  { $match: { date: { $gte: "2026-01-01" } } },           // Is saal ke orders
  {
    $group: {
      _id: "$crop",
      totalRevenue: { $sum: { $multiply: ["$qty", "$price"] } },
      totalQty: { $sum: "$qty" },
      avgPrice: { $avg: "$price" },
      orderCount: { $sum: 1 }
    }
  },
  { $sort: { totalRevenue: -1 } },                         // Revenue se sort
  { $limit: 5 },                                           // Top 5
  {
    $project: {
      _id: 0,
      crop: "$_id",
      totalRevenue: { $round: ["$totalRevenue", 0] },
      totalQty: 1,
      avgPrice: { $round: ["$avgPrice", 2] },
      orderCount: 1
    }
  }
]);
```

---

## Quick Revision Table

| Stage | SQL Equivalent | Kya Karta Hai |
|-------|---------------|---------------|
| `$match` | WHERE | Documents filter karo |
| `$group` | GROUP BY | Group karke calculate karo |
| `$sort` | ORDER BY | Sort karo |
| `$project` | SELECT | Fields choose/rename/calculate |
| `$lookup` | JOIN | Do collections mein join |
| `$unwind` | — | Array ke elements alag karo |
| `$addFields` | — | Naye fields add karo (purane rahen) |
| `$limit` | LIMIT | Kitne results chahiye |
| `$skip` | OFFSET | Kitne skip karo |
| `$count` | COUNT(*) | Total documents gino |

---

## Aaj Kya Seekha?

1. **Aggregation Pipeline** — stages ka chain jo data transform karta hai
2. **$match** — filter karo (hamesha pehle rakhne ki koshish karo)
3. **$group** — group by + sum, avg, min, max, count
4. **$sort** — ascending (1) ya descending (-1) sort
5. **$project** — output shape karo, rename karo, calculate karo
6. **$lookup** — do collections ko JOIN karo (SQL JOIN jaisa)
7. **$unwind** — array ke har element ko alag document banao
8. **$addFields** — naye calculated fields add karo bina purane hataaye

> **Practice Time!** Evening mein hum kisan market data pe real aggregation queries likhenge — total revenue by crop, monthly trends, top farmers. Hands-on practice!
