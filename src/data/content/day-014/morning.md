# Day 14 Morning: Week 2 Revision — SQL, MongoDB, Node.js, HTTP, File System

> **Aaj ka plan:** Aaj REVISION DAY hai! Week 2 mein jo seekha — SQL queries, MongoDB operations, Node.js basics, fs module, HTTP server — sab ek jagah revise karenge. Common mistakes dekhenge aur quick quiz solve karenge. Ye day bahut important hai — foundation pakka karo!

---

## Week 2 Ka Quick Recap

### Kya Kya Seekha Humne?

| Day | Topic | Key Takeaway |
|-----|-------|-------------|
| Day 8 | SQL Basics | Tables, SELECT, WHERE, INSERT, UPDATE, DELETE |
| Day 9 | SQL Joins + Advanced | INNER/LEFT/RIGHT JOIN, GROUP BY, HAVING, subqueries |
| Day 10 | MongoDB Basics | Documents, Collections, CRUD, find, insertOne |
| Day 11 | Node.js Intro | V8 engine, REPL, process object, global vs window |
| Day 12 | FS + Modules | require/export, readFile, writeFile, path module |
| Day 13 | HTTP + Server | HTTP methods, status codes, createServer, routing |

---

## Section 1: SQL Revision — Quick Fire

### Important SQL Commands Yaad Karo

```sql
-- Table banana
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    age INT,
    grade CHAR(2),
    city VARCHAR(50)
);

-- Data dalna
INSERT INTO students (name, age, grade, city)
VALUES ('Rahul', 20, 'A', 'Delhi');

-- Data padhna
SELECT * FROM students;
SELECT name, grade FROM students WHERE age > 18;

-- Data update
UPDATE students SET grade = 'A+' WHERE name = 'Rahul';

-- Data delete
DELETE FROM students WHERE id = 5;

-- Sorting
SELECT * FROM students ORDER BY age DESC;

-- Filtering
SELECT * FROM students WHERE city IN ('Delhi', 'Mumbai');
SELECT * FROM students WHERE name LIKE 'R%';

-- Aggregate functions
SELECT COUNT(*) FROM students;
SELECT AVG(age) FROM students;
SELECT city, COUNT(*) as total FROM students GROUP BY city;

-- Joins
SELECT s.name, c.course_name
FROM students s
INNER JOIN courses c ON s.id = c.student_id;
```

### SQL Common Mistakes

| Mistake | Sahi Tarika |
|---------|------------|
| `WHERE` mein `=` ki jagah `==` | SQL mein `=` use karo, `==` nahi |
| `DELETE` bina `WHERE` ke | Hamesha `WHERE` lagao, nahi to saara data ud jayega! |
| String mein double quotes | SQL mein single quotes use karo: `'Rahul'` |
| `GROUP BY` bhool jana | Aggregate function ke saath `GROUP BY` zaroori hai |
| `HAVING` vs `WHERE` confuse | `WHERE` = row filter, `HAVING` = group filter |

> **Warning:** `DELETE FROM students;` — ye SAARE students delete kar dega! Hamesha `WHERE` condition lagao!

### Quick Quiz — SQL

**Q1:** Students table se wo students nikalo jinki age 18 se 25 ke beech hai aur city Delhi hai.

<details>
<summary>Answer Dekho</summary>

```sql
SELECT * FROM students
WHERE age BETWEEN 18 AND 25
AND city = 'Delhi';
```
</details>

**Q2:** Har city mein kitne students hain? Sirf wo cities dikhao jinme 3 se zyada students hain.

<details>
<summary>Answer Dekho</summary>

```sql
SELECT city, COUNT(*) as student_count
FROM students
GROUP BY city
HAVING COUNT(*) > 3
ORDER BY student_count DESC;
```
</details>

**Q3:** `INNER JOIN` aur `LEFT JOIN` mein kya farak hai?

<details>
<summary>Answer Dekho</summary>

- **INNER JOIN** — Sirf matching rows dono tables se
- **LEFT JOIN** — Left table ke saare rows + matching right table ke rows (no match = NULL)
</details>

---

## Section 2: MongoDB Revision — Quick Fire

### Important MongoDB Commands

```javascript
// Database select karo
use kisanDB

// Collection mein document add karo
db.farmers.insertOne({
    name: "Ramesh",
    village: "Nashik",
    crops: ["Tomato", "Onion"],
    landAcres: 5.5,
    isOrganic: true
})

// Saare documents dekho
db.farmers.find()

// Filter se dekho
db.farmers.find({ village: "Nashik" })
db.farmers.find({ landAcres: { $gt: 3 } })   // Greater than 3
db.farmers.find({ crops: "Tomato" })           // Array mein Tomato hai?

// Update karo
db.farmers.updateOne(
    { name: "Ramesh" },
    { $set: { landAcres: 6.0 } }
)

// Delete karo
db.farmers.deleteOne({ name: "Ramesh" })

// Count karo
db.farmers.countDocuments({ isOrganic: true })

// Sort karo
db.farmers.find().sort({ landAcres: -1 })  // -1 = descending
```

### SQL vs MongoDB — Side by Side

| Operation | SQL | MongoDB |
|-----------|-----|---------|
| Create | `INSERT INTO` | `insertOne()` / `insertMany()` |
| Read | `SELECT * FROM` | `find()` |
| Update | `UPDATE SET` | `updateOne()` / `$set` |
| Delete | `DELETE FROM` | `deleteOne()` / `deleteMany()` |
| Filter | `WHERE age > 18` | `{ age: { $gt: 18 } }` |
| Sort | `ORDER BY age DESC` | `.sort({ age: -1 })` |
| Count | `SELECT COUNT(*)` | `countDocuments()` |
| Like | `WHERE name LIKE 'R%'` | `{ name: /^R/ }` (regex) |

> **Yaad Rakho:** SQL = structured tables with rows/columns. MongoDB = flexible documents (JSON-like). SQL mein schema fix hota hai, MongoDB mein flexible.

### Quick Quiz — MongoDB

**Q1:** Wo saare farmers nikalo jo organic farming karte hain aur jinke paas 5 acres se zyada zameen hai.

<details>
<summary>Answer Dekho</summary>

```javascript
db.farmers.find({
    isOrganic: true,
    landAcres: { $gt: 5 }
})
```
</details>

**Q2:** Ramesh ka village "Pune" se update karo aur ek nayi crop "Sugarcane" add karo.

<details>
<summary>Answer Dekho</summary>

```javascript
db.farmers.updateOne(
    { name: "Ramesh" },
    {
        $set: { village: "Pune" },
        $push: { crops: "Sugarcane" }
    }
)
```
</details>

---

## Section 3: Node.js Basics Revision

### Core Concepts Recap

```javascript
// 1. REPL — terminal mein 'node' type karo
// Interactive JavaScript playground

// 2. process object
console.log(process.version);      // Node version
console.log(process.platform);     // OS
console.log(process.argv);         // Command line arguments
console.log(process.cwd());        // Current directory
console.log(process.env.HOME);     // Environment variables

// 3. global vs window
// Browser: window object (DOM, alert, document)
// Node.js: global object (process, require, __dirname)
// Universal: globalThis

// 4. Modules
const fs = require("fs");           // Core module
const myMod = require("./myFile"); // Local module
// module.exports = { func1, func2 }   // Export karo
```

### Quick Quiz — Node.js

**Q1:** `process.argv` ka pehla element kya hota hai?

<details>
<summary>Answer Dekho</summary>

Node.js executable ka path (e.g., `C:\Program Files\nodejs\node.exe`). Actual arguments `process.argv[2]` se shuru hote hain.
</details>

**Q2:** CommonJS mein module export kaise karte hain?

<details>
<summary>Answer Dekho</summary>

```javascript
// Single function export
module.exports = myFunction;

// Multiple functions export
module.exports = { func1, func2, func3 };
```
</details>

---

## Section 4: File System (fs) Revision

### Key Operations

```javascript
const fs = require("fs");
const path = require("path");

// READ — file padhna
const data = fs.readFileSync("file.txt", "utf8");  // Sync
fs.readFile("file.txt", "utf8", (err, data) => {}); // Async

// WRITE — file likhna (overwrite!)
fs.writeFileSync("file.txt", "content", "utf8");

// APPEND — file mein add karna
fs.appendFileSync("file.txt", "\nnew line", "utf8");

// EXISTS — check karo file hai?
if (fs.existsSync("file.txt")) { /* hai */ }

// DELETE — file mitao
fs.unlinkSync("file.txt");

// DIRECTORY — folder banao
fs.mkdirSync("newFolder");

// LIST — folder ki files dekho
const files = fs.readdirSync(__dirname);

// PATH — safe path join karo
const fullPath = path.join(__dirname, "data", "file.json");
```

### Common Mistakes — FS Module

| Mistake | Solution |
|---------|----------|
| `readFile` bina `utf8` ke | Raw Buffer milega — hamesha `"utf8"` do |
| `writeFile` se purana data ud gaya | `writeFile` overwrite karta hai — `appendFile` use karo |
| Hardcoded path `"C:\Users\..."` | `path.join(__dirname, ...)` use karo |
| Local module mein `./` bhool gaye | `require("myFile")` galat — `require("./myFile")` sahi |
| File exist nahi hai to crash | Pehle `fs.existsSync()` check karo ya try-catch lagao |

### Quick Quiz — fs Module

**Q1:** `fs.writeFile` aur `fs.appendFile` mein kya farak hai?

<details>
<summary>Answer Dekho</summary>

- `writeFile` — file ko completely overwrite kar deta hai (purana content gayab)
- `appendFile` — purane content ke baad naya content add karta hai
</details>

**Q2:** `__dirname` kya return karta hai?

<details>
<summary>Answer Dekho</summary>

Current file jis folder mein hai uska absolute path. E.g., `C:\Users\user\project`
</details>

---

## Section 5: HTTP + Server Revision

### HTTP Method Quick Reference

| Method | CRUD | Use |
|--------|------|-----|
| GET | Read | Data lao |
| POST | Create | Naya data banao |
| PUT | Update (full) | Poora data update karo |
| PATCH | Update (partial) | Kuch fields update karo |
| DELETE | Delete | Data mitao |

### Status Code Quick Reference

| Code | Meaning | Yaad Kaise Rakhein |
|------|---------|-------------------|
| 200 | OK | Sab theek! |
| 201 | Created | Naya bana diya! |
| 400 | Bad Request | Tumne galat bheja |
| 401 | Unauthorized | Login karo pehle |
| 404 | Not Found | Mila nahi |
| 500 | Server Error | Server toot gaya |

### Server Code Pattern

```javascript
const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    const method = req.method;

    // Route check
    if (pathname === "/api/data" && method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "success" }));
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

server.listen(3000, () => console.log("Server running on :3000"));
```

### Quick Quiz — HTTP

**Q1:** GET aur POST mein kya farak hai?

<details>
<summary>Answer Dekho</summary>

- **GET** — Data lao (read). Data URL mein jaata hai (query params). Body nahi hota.
- **POST** — Naya data banao (create). Data body mein jaata hai. Sensitive data ke liye safe.
</details>

**Q2:** 404 aur 500 mein kya farak hai?

<details>
<summary>Answer Dekho</summary>

- **404** — Resource nahi mila (client ne galat URL diya — client ki galti)
- **500** — Server mein error hua (code mein bug hai — server ki galti)
</details>

---

## Section 6: Mixed Quiz — Sab Mila Ke

**Q1:** Ek Node.js script likho jo command line se filename le aur uski lines count kare.

<details>
<summary>Answer Dekho</summary>

```javascript
const fs = require("fs");
const file = process.argv[2];
if (!file) { console.log("Usage: node count.js <file>"); process.exit(1); }
const content = fs.readFileSync(file, "utf8");
console.log(`Lines: ${content.split("\n").length}`);
```
</details>

**Q2:** HTTP server mein POST request ka data kaise receive karte hain?

<details>
<summary>Answer Dekho</summary>

```javascript
let body = "";
req.on("data", (chunk) => { body += chunk.toString(); });
req.on("end", () => {
    const data = JSON.parse(body);
    // data use karo
});
```
Data chunks mein aata hai — `data` event se collect karo, `end` event pe process karo.
</details>

**Q3:** `require("fs")` aur `require("./fs")` mein kya farak hai?

<details>
<summary>Answer Dekho</summary>

- `require("fs")` — Node.js ka built-in fs module load karta hai
- `require("./fs")` — Current directory mein `fs.js` file load karega (local module)
</details>

**Q4:** MongoDB mein `$gt` kya karta hai? SQL mein equivalent kya hai?

<details>
<summary>Answer Dekho</summary>

- MongoDB: `{ age: { $gt: 18 } }` — age 18 se zyada
- SQL: `WHERE age > 18`
- `$gt` = Greater Than, `$gte` = Greater Than or Equal
</details>

---

## Common Beginner Mistakes — Top 10

| # | Mistake | Fix |
|---|---------|-----|
| 1 | Server band karna bhool gaye, port busy | `Ctrl+C` se band karo ya `lsof -i :3000` se process dhundho |
| 2 | `JSON.parse()` pe crash | `try-catch` mein wrap karo |
| 3 | Async function ka result synchronously use kiya | Callback ya async/await use karo |
| 4 | `res.end()` bhool gaye | Response latka rahega — hamesha `res.end()` likho |
| 5 | SQL mein semicolon bhool gaye | Har query ke end mein `;` lagao |
| 6 | MongoDB mein `$set` bhool gaye update mein | Bina `$set` ke poora document replace ho jayega |
| 7 | `require` mein `./` nahi lagaya local file ke liye | `require("./myFile")` — dot-slash zaroori |
| 8 | `fs.readFile` ke result ko return kiya | Async mein return nahi kaam karta — callback use karo |
| 9 | Port already in use error | Doosra port use karo (3001, 8080) ya purana server band karo |
| 10 | Git commit nahi kiya din bhar | Chote-chote commits karo — professional habit |

---

## Quick Revision Table

| Topic | Most Important Thing |
|-------|---------------------|
| **SQL** | `SELECT`, `JOIN`, `GROUP BY`, `WHERE` |
| **MongoDB** | `find()`, `insertOne()`, `updateOne()` with `$set` |
| **Node.js** | `process.argv`, `require()`, `module.exports` |
| **fs Module** | `readFile`, `writeFile`, `appendFile`, `path.join()` |
| **HTTP** | Methods (GET/POST), Status Codes (200/404/500) |
| **Server** | `http.createServer()`, `req.url`, `res.end()` |

---

## Aaj Kya Seekha?

1. Week 2 ke **saare concepts** ek jagah revise kiye
2. **SQL vs MongoDB** ka clear comparison samjha
3. **Common mistakes** identify kiye aur unke solutions jaane
4. **Quick quiz** se apni understanding test ki
5. **Pattern recognition** — har technology ka basic CRUD pattern same hai

> **Tip:** Evening mein ek mini project banayenge — "Student Database CLI" — jo aaj tak ka saara knowledge use karega! Abhi tak ke quizzes mein jo galat hue, unko dubara padho.
