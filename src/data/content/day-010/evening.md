# Day 10 Evening: MongoDB CRUD Practice

> **Practice Time!** MongoDB mein CRUD operations practice karo — products collection pe kaam karo, SQL se compare karo, aur git commit karo!

---

## Setup

> **Terminal Command:**
> ```bash
> # MongoDB shell start karo
> mongosh
> 
> # Ya MongoDB Compass use karo (GUI)
> # Ya MongoDB Atlas (cloud — browser mein)
> ```

---

## Task 1: Products Collection — Complete CRUD

```javascript
// mongosh mein run karo

// Database select karo
use practice_db

// ===== CREATE: Products daalo =====

db.products.insertMany([
  {
    name: "Organic Wheat Flour",
    category: "Grains",
    price: 55,
    unit: "kg",
    stock: 500,
    brand: "Kisan Fresh",
    origin: "Punjab",
    isOrganic: true,
    ratings: [4, 5, 4, 5, 3],
    nutritionPer100g: { calories: 340, protein: 12, fiber: 2.7 },
    addedAt: new Date()
  },
  {
    name: "Basmati Rice",
    category: "Grains",
    price: 120,
    unit: "kg",
    stock: 300,
    brand: "India Gate",
    origin: "Haryana",
    isOrganic: false,
    ratings: [5, 5, 4, 5, 5],
    nutritionPer100g: { calories: 350, protein: 7, fiber: 0.4 },
    addedAt: new Date()
  },
  {
    name: "Fresh Tomato",
    category: "Vegetables",
    price: 45,
    unit: "kg",
    stock: 200,
    brand: null,
    origin: "Maharashtra",
    isOrganic: true,
    ratings: [3, 4, 4, 3],
    nutritionPer100g: { calories: 18, protein: 0.9, fiber: 1.2 },
    addedAt: new Date()
  },
  {
    name: "Mustard Oil",
    category: "Oils",
    price: 180,
    unit: "liter",
    stock: 150,
    brand: "Fortune",
    origin: "Rajasthan",
    isOrganic: false,
    ratings: [4, 3, 4, 4, 5],
    nutritionPer100g: { calories: 884, protein: 0, fiber: 0 },
    addedAt: new Date()
  },
  {
    name: "Organic Honey",
    category: "Natural",
    price: 350,
    unit: "500g",
    stock: 80,
    brand: "Dabur",
    origin: "Himachal",
    isOrganic: true,
    ratings: [5, 5, 4, 5, 5, 4],
    nutritionPer100g: { calories: 304, protein: 0.3, fiber: 0 },
    addedAt: new Date()
  },
  {
    name: "Cotton Seeds",
    category: "Seeds",
    price: 800,
    unit: "5kg bag",
    stock: 50,
    brand: "BT Cotton",
    origin: "Gujarat",
    isOrganic: false,
    ratings: [4, 3, 4],
    nutritionPer100g: null,
    addedAt: new Date()
  },
  {
    name: "Fresh Onion",
    category: "Vegetables",
    price: 32,
    unit: "kg",
    stock: 400,
    brand: null,
    origin: "Maharashtra",
    isOrganic: false,
    ratings: [3, 3, 4, 3, 4],
    nutritionPer100g: { calories: 40, protein: 1.1, fiber: 1.7 },
    addedAt: new Date()
  },
  {
    name: "Jaggery (Gud)",
    category: "Natural",
    price: 60,
    unit: "kg",
    stock: 250,
    brand: null,
    origin: "UP",
    isOrganic: true,
    ratings: [4, 5, 4, 5],
    nutritionPer100g: { calories: 383, protein: 0.4, fiber: 0 },
    addedAt: new Date()
  }
])

// Verify
db.products.countDocuments()  // 8
```

---

## Task 2: READ Queries Practice

```javascript
// ===== BASIC QUERIES =====

// 1. Sab products
db.products.find().pretty()

// 2. Sirf name aur price (projection)
db.products.find({}, { _id: 0, name: 1, price: 1, category: 1 })

// 3. Vegetables category
db.products.find({ category: "Vegetables" })

// 4. Organic products
db.products.find({ isOrganic: true }, { _id: 0, name: 1, price: 1 })

// 5. Price > Rs.100
db.products.find({ price: { $gt: 100 } }, { _id: 0, name: 1, price: 1 })

// 6. Price between 50 and 200
db.products.find({
  price: { $gte: 50, $lte: 200 }
}, { _id: 0, name: 1, price: 1 })

// 7. Grains ya Vegetables
db.products.find({
  category: { $in: ["Grains", "Vegetables"] }
}, { _id: 0, name: 1, category: 1, price: 1 })

// 8. Brand hai (not null)
db.products.find({
  brand: { $ne: null }
}, { _id: 0, name: 1, brand: 1 })

// 9. Stock kam hai (< 100)
db.products.find({
  stock: { $lt: 100 }
}, { _id: 0, name: 1, stock: 1 })

// 10. Maharashtra se organic products
db.products.find({
  origin: "Maharashtra",
  isOrganic: true
})


// ===== SORT + LIMIT =====

// 11. Price high to low
db.products.find({}, { _id: 0, name: 1, price: 1 })
  .sort({ price: -1 })

// 12. Top 3 cheapest
db.products.find({}, { _id: 0, name: 1, price: 1 })
  .sort({ price: 1 })
  .limit(3)

// 13. Stock high to low, top 5
db.products.find({}, { _id: 0, name: 1, stock: 1 })
  .sort({ stock: -1 })
  .limit(5)


// ===== ARRAY QUERIES =====

// 14. Rating mein 5 hai (koi bhi position)
db.products.find({ ratings: 5 })

// 15. Average rating calculate karo (advanced — aggregation)
db.products.find().forEach(product => {
  const avgRating = product.ratings.reduce((s, r) => s + r, 0) / product.ratings.length;
  print(`${product.name}: ${avgRating.toFixed(1)} stars`);
})

// 16. Ratings array size > 4
db.products.find({
  "ratings.4": { $exists: true }  // 5th element exist karta hai?
}, { _id: 0, name: 1, ratings: 1 })


// ===== NESTED OBJECT QUERIES =====

// 17. High calorie products (> 300 cal)
db.products.find({
  "nutritionPer100g.calories": { $gt: 300 }
}, { _id: 0, name: 1, "nutritionPer100g.calories": 1 })

// 18. Protein > 5g products
db.products.find({
  "nutritionPer100g.protein": { $gt: 5 }
}, { _id: 0, name: 1, "nutritionPer100g.protein": 1 })


// ===== REGEX (LIKE equivalent) =====

// 19. Name mein "Fresh" hai
db.products.find({ name: /Fresh/ })

// 20. Name mein "organic" hai (case insensitive)
db.products.find({ name: /organic/i })
```

> **Tip:** MongoDB mein nested fields access karne ke liye dot notation use karo: `"nutritionPer100g.calories"`. Ye SQL mein JOIN se karna padta!

---

## Task 3: UPDATE Practice

```javascript
// ===== UPDATE OPERATIONS =====

// 1. Price update
db.products.updateOne(
  { name: "Fresh Tomato" },
  { $set: { price: 50 } }
)

// 2. Stock increase
db.products.updateOne(
  { name: "Basmati Rice" },
  { $inc: { stock: 100 } }  // stock + 100
)

// 3. Add new field
db.products.updateOne(
  { name: "Organic Honey" },
  { $set: { discount: 10, discountedPrice: 315 } }
)

// 4. Array mein naya rating add karo
db.products.updateOne(
  { name: "Mustard Oil" },
  { $push: { ratings: 5 } }
)

// 5. Array se specific rating hatao
db.products.updateOne(
  { name: "Fresh Onion" },
  { $pull: { ratings: 3 } }  // Saare 3 ratings hatenge
)

// 6. Multiple fields update
db.products.updateOne(
  { name: "Cotton Seeds" },
  {
    $set: { price: 750, brand: "Mahyco BT" },
    $inc: { stock: -10 }
  }
)

// 7. Sab organic products pe "certified" field add karo
db.products.updateMany(
  { isOrganic: true },
  { $set: { certified: true, certifiedBy: "FSSAI" } }
)

// 8. Sab products ka price 5% badhao
db.products.updateMany(
  {},
  { $mul: { price: 1.05 } }
)

// Verify changes
db.products.find({ name: "Fresh Tomato" }, { _id: 0, name: 1, price: 1 })
db.products.find({ isOrganic: true }, { _id: 0, name: 1, certified: 1, certifiedBy: 1 })
```

---

## Task 4: DELETE Practice

```javascript
// 1. Ek product delete
db.products.deleteOne({ name: "Cotton Seeds" })

// 2. Low stock products delete (< 100 stock)
// Pehle dekho kya delete hoga
db.products.find({ stock: { $lt: 100 } }, { _id: 0, name: 1, stock: 1 })

// Phir delete karo
db.products.deleteMany({ stock: { $lt: 100 } })

// 3. Count verify
db.products.countDocuments()
```

> **Warning:** Delete se pehle hamesha `find` se check karo ki kya delete hoga. Production mein galti se delete karne ka koi undo nahi hai!

---

## Task 5: SQL vs MongoDB — Side by Side

```
===== SQL =====                              ===== MongoDB =====

CREATE TABLE products (                      db.createCollection("products")
  id INT PRIMARY KEY AUTO_INCREMENT,         // ya auto-create on first insert
  name VARCHAR(100),
  price DECIMAL(8,2)
);

INSERT INTO products (name, price)           db.products.insertOne({
VALUES ('Wheat', 22);                          name: "Wheat", price: 22
                                             })

SELECT * FROM products;                      db.products.find()

SELECT name, price FROM products             db.products.find({},
WHERE price > 50;                              { _id: 0, name: 1, price: 1 })
                                               .sort({ price: -1 })

SELECT category, COUNT(*), AVG(price)        db.products.aggregate([
FROM products                                  { $group: {
GROUP BY category                                _id: "$category",
ORDER BY AVG(price) DESC;                        count: { $sum: 1 },
                                                 avgPrice: { $avg: "$price" }
                                               }},
                                               { $sort: { avgPrice: -1 } }
                                             ])

UPDATE products SET price = 55               db.products.updateOne(
WHERE name = 'Wheat';                          { name: "Wheat" },
                                               { $set: { price: 55 } }
                                             )

DELETE FROM products                         db.products.deleteOne(
WHERE name = 'Wheat';                          { name: "Wheat" }
                                             )
```

---

## Task 6: Git Commit

> **Terminal Command:**
> ```bash
> # Apne JS practice files ko git mein save karo
> mkdir fullstack-day10
> cd fullstack-day10
> git init
> 
> # MongoDB commands ko ek file mein save karo (reference ke liye)
> # File: mongodb-practice.js mein saare commands copy karo
> 
> git add .
> git commit -m "Day 10: MongoDB CRUD practice — products collection, SQL comparison"
> git log --oneline
> ```

---

## Homework Challenges

### Challenge 1: Blog Posts Collection

```javascript
// Ek blog_posts collection banao with:
// - title, content, author, tags (array), comments (array of objects)
// - 5 blog posts insert karo
// - Find: by author, by tag, by comment count
// - Update: add comment, update title
// - Delete: old posts
```

### Challenge 2: Aggregation Pipeline (Preview)

```javascript
// Ye advanced hai — try karo!
db.products.aggregate([
  // Stage 1: Filter organic products
  { $match: { isOrganic: true } },
  
  // Stage 2: Add calculated field
  { $addFields: {
    stockValue: { $multiply: ["$price", "$stock"] }
  }},
  
  // Stage 3: Sort by stock value
  { $sort: { stockValue: -1 } },
  
  // Stage 4: Project specific fields
  { $project: {
    _id: 0,
    name: 1,
    price: 1,
    stock: 1,
    stockValue: 1
  }}
])
```

### Challenge 3: Apna Kaam

1. Ek `employees` collection banao — 10 employees with departments
2. Department wise count, average salary nikalo
3. Highest paid employee dhundho
4. Specific department ke employees update karo

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| `insertOne/Many` | Documents create kiye |
| `find` + projection | Data select kiya, specific fields |
| `$gt, $lt, $in` | Comparison operators |
| `$and, $or` | Logical operators |
| `.sort().limit()` | Sort aur paginate |
| `$set, $inc, $push` | Update operators |
| `$pull, $unset` | Remove field/array item |
| `updateMany` | Bulk update |
| `deleteOne/Many` | Documents delete kiye |
| Regex | Pattern matching (`/text/i`) |
| Nested queries | Dot notation (`"field.subfield"`) |
| SQL vs MongoDB | Same concepts, different syntax |

---

## Aaj Kya Seekha?

- Products collection mein complete CRUD practice ki
- Complex queries likhe — nested objects, arrays, regex
- Update operators use kiye — $set, $inc, $push, $pull, $mul
- Sort, limit, skip se pagination kiya
- SQL aur MongoDB ka side-by-side comparison samjha
- Aggregation pipeline ka intro mila
- Ab hum SQL aur NoSQL dono jaante hain — next week se backend coding!
