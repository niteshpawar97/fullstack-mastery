# Day 28 Morning: Week 4 Revision + Phase 1 Complete Review (REVISION DAY)

> **Aaj ka plan:** Aaj Phase 1 ka full revision hai! JavaScript, Git, SQL, MongoDB, Node.js, DSA, Linux — sab kuch ek jagah. Interview prep questions aur common mistakes bhi cover karenge. Ye day bahut important hai — isko seriously lo!

---

## Phase 1 Ka Journey: Week 1-4 Overview

### Hum Kahan Se Kahan Aaye

| Week | Topics | Key Skills |
|------|--------|------------|
| Week 1 | JS Basics, Git, Data Types, Functions | Variables, loops, functions, git workflow |
| Week 2 | Arrays, Objects, DOM, Error Handling | Array methods, object manipulation, try-catch |
| Week 3 | SQL, MongoDB, Node.js Basics | Database CRUD, server basics, npm |
| Week 4 | DSA, OOP, Event Loop, Linux | Problem solving, classes, async, shell |

> **Socho Aise:** Phase 1 mein humne ek building ki neev (foundation) rakhi. JavaScript humari programming language hai, Git version control ke liye, Databases data store karne ke liye, Node.js server banane ke liye, aur Linux deployment ke liye. Ab in sab ko milake projects banayenge!

---

## Topic 1: JavaScript Core Revision

### Variables & Types

```javascript
// var vs let vs const — interview mein zaroor puchenge!
var x = 1;    // Function scoped, hoisted, re-declarable — AVOID karo
let y = 2;    // Block scoped, not re-declarable — values change ho sakti hain
const z = 3;  // Block scoped, not re-assignable — constants ke liye

// Types — 7 Primitive + 1 Non-primitive
// Primitive: string, number, boolean, null, undefined, symbol, bigint
// Non-primitive: object (arrays, functions bhi objects hain)

// Type checking
console.log(typeof "hello");     // "string"
console.log(typeof 42);          // "number"
console.log(typeof null);        // "object" (JavaScript ka famous bug!)
console.log(Array.isArray([]));  // true (typeof se array check nahi hota)
```

### Functions

```javascript
// 3 tarike se function banao
// 1. Declaration — hoisted hota hai
function add(a, b) { return a + b; }

// 2. Expression — hoisted nahi hota
const multiply = function(a, b) { return a * b; };

// 3. Arrow — short syntax, lexical 'this'
const divide = (a, b) => a / b;

// Destructuring + Default params
function createUser({ name, age = 25, city = "Delhi" }) {
  return { name, age, city };
}
```

### Array Methods — Must Remember

```javascript
const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map — transform karo
const doubled = nums.map(n => n * 2);       // [2, 4, 6, ...]

// filter — chhant-te karo
const evens = nums.filter(n => n % 2 === 0); // [2, 4, 6, 8, 10]

// reduce — ek value mein simeto
const sum = nums.reduce((acc, n) => acc + n, 0); // 55

// find — pehla match
const first = nums.find(n => n > 5);         // 6

// some/every
const hasEven = nums.some(n => n % 2 === 0);  // true
const allPos = nums.every(n => n > 0);         // true

// Chain karo!
const result = nums
  .filter(n => n % 2 === 0)  // even numbers
  .map(n => n ** 2)           // square karo
  .reduce((acc, n) => acc + n, 0); // sum = 220
```

> **Yaad Rakho:** `map` naya array banata hai, `forEach` kuch return nahi karta. `filter` condition se chhant-ta hai, `find` pehla match deta hai. `reduce` sab ko ek mein milata hai.

---

## Topic 2: Git Revision

### Daily Use Commands

```bash
# Basic workflow
git init                    # Naya repo
git add .                   # Stage all
git commit -m "message"     # Commit
git push origin main        # Push to remote

# Branching — interview mein zaroor puchenge
git branch feature-login    # Branch banao
git checkout feature-login  # Branch pe jao
git checkout -b hotfix      # Banao + jao (shortcut)
git merge feature-login     # Merge karo

# Undo operations
git checkout -- file.js     # File changes undo
git reset HEAD file.js      # Unstage karo
git revert abc123           # Commit undo (safe way)
git stash                   # Changes temporarily save karo
git stash pop               # Wapas laao
```

### Git Flow — Interview Answer

> **Example:**
> ```
> main     ──●──────────────────●──── (production)
>             \                /
> develop   ───●──●──●──●──●──── (development)
>               \      /
> feature    ────●──●──── (feature-login)
> ```

---

## Topic 3: SQL Revision

```sql
-- CRUD Operations
-- Create
INSERT INTO farmers (name, crop, land_area)
VALUES ('Ramesh', 'Gehu', 5.5);

-- Read
SELECT name, crop FROM farmers
WHERE land_area > 3
ORDER BY name ASC
LIMIT 10;

-- Update
UPDATE farmers SET crop = 'Chawal'
WHERE name = 'Ramesh';

-- Delete
DELETE FROM farmers WHERE land_area < 1;

-- JOINs — bahut important!
-- INNER JOIN — dono tables mein match ho
SELECT f.name, o.product
FROM farmers f
INNER JOIN orders o ON f.id = o.farmer_id;

-- LEFT JOIN — left table ke sab rows + matching right
SELECT f.name, o.product
FROM farmers f
LEFT JOIN orders o ON f.id = o.farmer_id;

-- Aggregate functions
SELECT crop, COUNT(*) as total, AVG(land_area) as avg_land
FROM farmers
GROUP BY crop
HAVING COUNT(*) > 5
ORDER BY total DESC;
```

---

## Topic 4: MongoDB Revision

```javascript
// MongoDB CRUD
// Create
db.farmers.insertOne({ name: "Ramesh", crop: "Gehu", land: 5.5 });
db.farmers.insertMany([{ name: "Suresh" }, { name: "Mukesh" }]);

// Read
db.farmers.find({ crop: "Gehu" });
db.farmers.find({ land: { $gt: 3 } }).sort({ name: 1 }).limit(10);

// Update
db.farmers.updateOne({ name: "Ramesh" }, { $set: { crop: "Chawal" } });
db.farmers.updateMany({ land: { $lt: 2 } }, { $set: { status: "small" } });

// Delete
db.farmers.deleteOne({ name: "Ramesh" });

// Aggregation Pipeline
db.orders.aggregate([
  { $match: { status: "delivered" } },
  { $group: { _id: "$product", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
  { $limit: 5 }
]);
```

> **Yaad Rakho:** SQL = Structured, schema-based, JOINs strong. MongoDB = Flexible, document-based, nesting strong. Dono ka apna use case hai!

---

## Topic 5: Node.js Revision

```javascript
// Basic server
const http = require('http');
const fs = require('fs').promises;

const server = http.createServer(async (req, res) => {
  // Routing
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Hello Kisan!" }));
  }
  else if (req.url === '/data' && req.method === 'GET') {
    try {
      const data = await fs.readFile('data.json', 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: "File nahi mili" }));
    }
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route nahi mila" }));
  }
});

server.listen(3000, () => console.log("Server running on :3000"));
```

---

## Topic 6: DSA Quick Revision

```javascript
// Searching
// Linear Search — O(n)
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// Binary Search — O(log n) — sorted array chahiye!
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// Sorting
// Bubble Sort — O(n²) — simple but slow
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

// Stack & Queue
const stack = []; // LIFO
stack.push(1);    // Add
stack.pop();      // Remove last

const queue = []; // FIFO
queue.push(1);    // Add
queue.shift();    // Remove first
```

---

## Common Mistakes Compilation

| # | Galti | Sahi Tarika |
|---|-------|-------------|
| 1 | `==` use karna | `===` hamesha use karo (strict equality) |
| 2 | `var` use karna | `let`/`const` use karo |
| 3 | Callback hell | Promises / async-await use karo |
| 4 | `forEach` mein `await` | `for...of` ya `Promise.all` use karo |
| 5 | Error handling bhoolna | `try-catch` hamesha lagao async code mein |
| 6 | `.env` file commit karna | `.gitignore` mein add karo |
| 7 | `chmod 777` dena | Minimum required permissions do |
| 8 | SQL injection | Parameterized queries use karo |
| 9 | `git add .` blindly | Pehle `git status` dekho |
| 10 | Console.log debugging | Proper logging library use karo (production mein) |

---

## Interview Prep Questions

### JavaScript
1. `var`, `let`, `const` mein kya farak hai?
2. Closures kya hain? Example do.
3. `==` vs `===` kya farak hai?
4. Event Loop kaise kaam karta hai?
5. `this` keyword kaise kaam karta hai?

### Git
6. `git merge` vs `git rebase` mein kya farak hai?
7. Merge conflict kaise resolve karte ho?
8. `git stash` kab use karte ho?

### Database
9. SQL vs NoSQL — kab kya use karna chahiye?
10. Indexing kya hai aur kyon zaroori hai?

### Node.js
11. Node.js single-threaded hai phir bhi fast kaise hai?
12. `require` vs `import` mein kya farak hai?

> **Tip:** Har question ka answer khud likhke practice karo — bol ke practice karna aur bhi better hai!

---

## Quick Revision Table

| Topic | Key Concepts | Importance Level |
|-------|-------------|-----------------|
| JS Variables | let/const, scope, hoisting | Must Know |
| Functions | Arrow, closures, callbacks | Must Know |
| Array Methods | map, filter, reduce, find | Must Know |
| Git | Branch, merge, stash, revert | Must Know |
| SQL | CRUD, JOINs, aggregations | Must Know |
| MongoDB | CRUD, aggregation pipeline | Must Know |
| Node.js | HTTP server, file system, npm | Must Know |
| DSA | Search, sort, stack, queue | Important |
| Event Loop | Microtask, macrotask, async | Must Know |
| Linux | chmod, grep, piping, cron | Important |

---

## Aaj Kya Seekha?

1. **Phase 1 complete revision** — 4 weeks ka saara content ek jagah
2. **JavaScript core** — variables, functions, array methods
3. **Git workflow** — branching, merging, undo operations
4. **SQL + MongoDB** — CRUD, JOINs, aggregations
5. **Node.js basics** — HTTP server, file handling
6. **DSA fundamentals** — search, sort, stack, queue
7. **Common mistakes** — kya galti karte hain aur kaise bachein
8. **Interview questions** — preparation ke liye practice karo

> **Practice Time!** Evening mein Phase 1 Project shuru karenge — "CLI Task Manager with JSON Storage". Architecture design aur project setup karenge!
