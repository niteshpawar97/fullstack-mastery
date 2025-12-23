# Day 10 Morning: MongoDB Intro + CRUD

> **Aaj ka plan:** Aaj NoSQL ki duniya mein entry! MongoDB — duniya ka sabse popular NoSQL database. SQL mein tables/rows hote hain, MongoDB mein collections/documents. JSON jaisa data store hota hai — flexible, fast, aur modern apps ke liye perfect!

---

## NoSQL vs SQL — Kya Fark Hai?

| Feature | SQL (MySQL/PostgreSQL) | NoSQL (MongoDB) |
|---------|----------------------|-----------------|
| Data Structure | Tables, Rows, Columns | Collections, Documents |
| Schema | Fixed (columns define karo pehle) | Flexible (har document alag ho sakta hai) |
| Data Format | Rows with fixed columns | JSON-like documents (BSON) |
| Relationships | JOIN se link karo | Embed karo ya reference karo |
| Best For | Structured data, transactions | Flexible data, rapid development |
| Query Language | SQL | MongoDB Query Language (MQL) |
| Scaling | Vertical (bigger server) | Horizontal (more servers) |

> **Socho Aise:** SQL ek register hai — har page same format mein hona chahiye (columns fixed). MongoDB ek notebook hai — har page pe kuch bhi likh sakte ho, format alag bhi ho sakta hai!

---

## MongoDB Terminology

| SQL Term | MongoDB Term | Example |
|----------|-------------|---------|
| Database | Database | `kisan_market` |
| Table | Collection | `kisans` |
| Row | Document | `{ name: "Ramesh", age: 45 }` |
| Column | Field | `name`, `age` |
| Primary Key | `_id` (auto-generated) | `ObjectId("...")` |
| JOIN | Embedding / `$lookup` | Nested documents |

---

## MongoDB Setup

> **Terminal Command:**
> ```bash
> # MongoDB version check
> mongod --version
> mongosh --version
> 
> # MongoDB shell start karo
> mongosh
> 
> # Ya MongoDB Compass use karo (GUI tool)
> # Download: https://www.mongodb.com/products/compass
> ```

> **Tip:** Local setup mushkil lage to MongoDB Atlas use karo — free cloud database milta hai! https://www.mongodb.com/atlas

---

## Basic MongoDB Commands

```javascript
// mongosh mein ye commands run karo

// Sab databases dekho
show dbs

// Database use karo (nahi hai to banayega jab data daaloge)
use kisan_market

// Current database
db

// Sab collections dekho
show collections

// Collection delete karo
// db.kisans.drop()

// Database delete karo
// db.dropDatabase()
```

---

## Document Structure

MongoDB mein data JSON-like format mein store hota hai (internally BSON — Binary JSON).

```javascript
// Ek MongoDB document — JavaScript object jaisa dikhta hai!
{
  _id: ObjectId("64a7b8c9d1e2f3a4b5c6d7e8"),  // Auto-generated unique ID
  name: "Ramesh Kumar",
  age: 45,
  village: "Kheda",
  state: "UP",
  phone: "9876543210",
  crops: ["Wheat", "Rice", "Cotton"],     // Array — SQL mein ye alag table hoti
  address: {                               // Nested object — SQL mein JOIN chahiye
    street: "Main Road",
    district: "Aligarh",
    pin: "202001"
  },
  landArea: 5.0,
  isActive: true,
  registeredAt: ISODate("2026-04-04T10:30:00Z")
}
```

> **Yaad Rakho:** MongoDB mein `_id` field automatic banta hai — ye 12-byte unique identifier hai (ObjectId). Tum apna bhi de sakte ho, lekin usually auto-generated best hai.

---

## CREATE — insertOne & insertMany

### insertOne — Ek Document Daalo

```javascript
// mongosh mein:
use kisan_market

// Ek kisan add karo
db.kisans.insertOne({
  name: "Ramesh Kumar",
  age: 45,
  village: "Kheda",
  district: "Aligarh",
  state: "UP",
  phone: "9876543210",
  crops: ["Wheat", "Rice"],
  landArea: 5.0,
  annualIncome: 350000,
  isActive: true,
  registeredAt: new Date()
})

// Output:
// {
//   acknowledged: true,
//   insertedId: ObjectId("...")
// }
```

### insertMany — Multiple Documents Daalo

```javascript
db.kisans.insertMany([
  {
    name: "Suresh Yadav",
    age: 38,
    village: "Govindpur",
    district: "Mathura",
    state: "UP",
    phone: "9876543211",
    crops: ["Cotton", "Mustard", "Sugarcane"],
    landArea: 8.5,
    annualIncome: 520000,
    isActive: true,
    registeredAt: new Date()
  },
  {
    name: "Priya Devi",
    age: 32,
    village: "Barmer",
    district: "Barmer",
    state: "Rajasthan",
    phone: "9876543212",
    crops: ["Bajra", "Jowar"],
    landArea: 3.0,
    annualIncome: 180000,
    isActive: true,
    registeredAt: new Date()
  },
  {
    name: "Mahesh Patel",
    age: 50,
    village: "Anand",
    district: "Anand",
    state: "Gujarat",
    phone: "9876543213",
    crops: ["Sugarcane", "Cotton"],
    landArea: 12.0,
    annualIncome: 780000,
    isActive: true,
    registeredAt: new Date()
  },
  {
    name: "Geeta Kumari",
    age: 28,
    village: "Darbhanga",
    district: "Darbhanga",
    state: "Bihar",
    phone: "9876543214",
    crops: ["Rice"],
    landArea: 2.5,
    annualIncome: 150000,
    isActive: false,
    registeredAt: new Date()
  }
])
```

> **Tip:** MongoDB mein schema fix nahi hai! Ek document mein `email` field ho, doosre mein na ho — koi error nahi aayega. Ye flexibility hai NoSQL ki. Lekin production mein Mongoose (schema validation library) use karte hain.

---

## READ — find & findOne

### findOne — Pehla Matching Document

```javascript
// Pehla active kisan
db.kisans.findOne({ isActive: true })

// Name se dhundho
db.kisans.findOne({ name: "Ramesh Kumar" })

// Phone se dhundho
db.kisans.findOne({ phone: "9876543210" })
```

### find — Sab Matching Documents

```javascript
// Sab kisans
db.kisans.find()

// Pretty print
db.kisans.find().pretty()

// UP ke kisans
db.kisans.find({ state: "UP" })

// Active kisans
db.kisans.find({ isActive: true })

// Specific fields only (projection)
db.kisans.find(
  { state: "UP" },                    // Filter
  { name: 1, village: 1, crops: 1 }   // Projection (1 = show, 0 = hide)
)
// _id default dikhta hai, hide karne ke liye: { _id: 0, name: 1 }
```

### Comparison Operators

```javascript
// $gt (greater than), $gte (greater or equal)
db.kisans.find({ landArea: { $gt: 5 } })      // Land > 5 acres
db.kisans.find({ age: { $gte: 40 } })          // Age >= 40

// $lt (less than), $lte (less or equal)
db.kisans.find({ annualIncome: { $lt: 200000 } })  // Income < 2 lakh

// $eq (equal), $ne (not equal)
db.kisans.find({ state: { $ne: "UP" } })       // State is NOT UP

// $in (multiple values mein se koi bhi)
db.kisans.find({ state: { $in: ["UP", "Gujarat"] } })

// $nin (NOT in)
db.kisans.find({ state: { $nin: ["Bihar", "Rajasthan"] } })
```

### Logical Operators

```javascript
// $and — dono conditions true
db.kisans.find({
  $and: [
    { state: "UP" },
    { landArea: { $gt: 3 } }
  ]
})
// Short form (default AND):
db.kisans.find({ state: "UP", landArea: { $gt: 3 } })

// $or — koi ek true
db.kisans.find({
  $or: [
    { state: "UP" },
    { state: "Gujarat" }
  ]
})

// $not
db.kisans.find({
  landArea: { $not: { $gt: 5 } }
})

// Complex query
db.kisans.find({
  $and: [
    { $or: [{ state: "UP" }, { state: "Gujarat" }] },
    { annualIncome: { $gt: 300000 } },
    { isActive: true }
  ]
})
```

### Array Queries

```javascript
// Array mein specific value
db.kisans.find({ crops: "Wheat" })          // crops array mein "Wheat" hai?

// Array mein multiple values (sab hone chahiye)
db.kisans.find({ crops: { $all: ["Wheat", "Rice"] } })

// Array size
db.kisans.find({ crops: { $size: 2 } })    // Exactly 2 crops wale

// Array element match
db.kisans.find({ "crops.0": "Wheat" })     // Pehla crop "Wheat" hai?
```

### Sort, Limit, Skip

```javascript
// Sort (1 = ascending, -1 = descending)
db.kisans.find().sort({ annualIncome: -1 })     // Income high to low
db.kisans.find().sort({ name: 1 })               // Name A-Z

// Limit
db.kisans.find().sort({ annualIncome: -1 }).limit(3)  // Top 3

// Skip (pagination)
db.kisans.find().sort({ name: 1 }).skip(2).limit(2)   // Page 2 (skip 2, take 2)

// Count
db.kisans.countDocuments({ state: "UP" })  // UP ke kitne kisans?
db.kisans.countDocuments({})               // Total kitne?
```

---

## UPDATE — updateOne & updateMany

### updateOne — Ek Document Update

```javascript
// $set — fields update karo (nahi hai to add hogi)
db.kisans.updateOne(
  { name: "Ramesh Kumar" },          // Filter — kisko update karna hai
  { $set: { annualIncome: 400000, landArea: 6.0 } }  // Update — kya change
)

// $inc — number increment karo
db.kisans.updateOne(
  { name: "Ramesh Kumar" },
  { $inc: { age: 1 } }              // age + 1
)

// $push — array mein add karo
db.kisans.updateOne(
  { name: "Ramesh Kumar" },
  { $push: { crops: "Sugarcane" } }  // crops array mein "Sugarcane" add
)

// $pull — array se hatao
db.kisans.updateOne(
  { name: "Ramesh Kumar" },
  { $pull: { crops: "Rice" } }       // crops se "Rice" hatao
)

// $unset — field completely hatao
db.kisans.updateOne(
  { name: "Geeta Kumari" },
  { $unset: { annualIncome: "" } }   // annualIncome field remove
)
```

### updateMany — Multiple Documents Update

```javascript
// Sab UP ke kisans ko active karo
db.kisans.updateMany(
  { state: "UP" },
  { $set: { isActive: true } }
)

// Sab active kisans ka income 10% badhao
db.kisans.updateMany(
  { isActive: true },
  { $mul: { annualIncome: 1.10 } }   // Multiply by 1.10 (10% increase)
)
```

---

## DELETE — deleteOne & deleteMany

```javascript
// Ek document delete karo
db.kisans.deleteOne({ name: "Geeta Kumari" })

// Multiple delete
db.kisans.deleteMany({ isActive: false })

// Sab delete (DANGER!)
// db.kisans.deleteMany({})  // SARE documents delete!
```

> **Warning:** `deleteMany({})` — khaali filter matlab SAB delete! SQL ke `DELETE FROM table` jaisa hai bina WHERE ke. Bahut careful raho!

---

## SQL vs MongoDB Comparison

| Operation | SQL | MongoDB |
|-----------|-----|---------|
| Create table | `CREATE TABLE students (...)` | `db.createCollection("students")` (ya auto-create) |
| Insert | `INSERT INTO students VALUES (...)` | `db.students.insertOne({...})` |
| Select all | `SELECT * FROM students` | `db.students.find()` |
| Select where | `SELECT * WHERE age > 20` | `db.students.find({ age: { $gt: 20 } })` |
| Select fields | `SELECT name, age FROM students` | `db.students.find({}, { name: 1, age: 1 })` |
| Update | `UPDATE students SET age=25 WHERE id=1` | `db.students.updateOne({ _id: id }, { $set: { age: 25 } })` |
| Delete | `DELETE FROM students WHERE id=1` | `db.students.deleteOne({ _id: id })` |
| Count | `SELECT COUNT(*) FROM students` | `db.students.countDocuments()` |
| Sort | `ORDER BY age DESC` | `.sort({ age: -1 })` |
| Limit | `LIMIT 5` | `.limit(5)` |
| Like | `WHERE name LIKE '%ram%'` | `{ name: /ram/i }` (regex) |

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| MongoDB | NoSQL document database — JSON-like data |
| Collection | Table ka equivalent |
| Document | Row ka equivalent — flexible schema |
| `_id` | Auto-generated unique identifier |
| `insertOne/Many` | Data daalo |
| `find/findOne` | Data dhundho |
| `$gt, $lt, $in` | Comparison operators |
| `$and, $or` | Logical operators |
| `$set, $inc, $push` | Update operators |
| `updateOne/Many` | Data update karo |
| `deleteOne/Many` | Data hatao |
| `.sort().limit()` | Sort aur paginate |

---

## Aaj Kya Seekha?

- NoSQL vs SQL ka fark — kab kya use karna hai
- MongoDB terminology — database, collection, document
- CRUD operations — insertOne, find, updateOne, deleteOne
- Query operators — comparison ($gt, $lt, $in) aur logical ($and, $or)
- Array operations — $push, $pull, $all, $size
- Update operators — $set, $inc, $mul, $unset
- SQL se MongoDB ka comparison — concepts same, syntax alag
