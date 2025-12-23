# Day 12 Evening: File Reader/Writer Tool + Logging Module + Linux Practice

> **Practice Time!** Morning mein seekha fs module, path module, custom modules. Ab real tools banate hain — file reader, file writer, aur apna khud ka logging module!

---

## Setup: Project Folder Banao

> **Terminal Command:**
> ```bash
> mkdir day12-fs-modules
> cd day12-fs-modules
> npm init -y
> git init
> code .
> ```

`npm init -y` se `package.json` ban jayega — ye Node.js project ka config file hai.

---

## Task 1: Custom Logging Module

### Problem Statement

Ek logging module banao jo timestamps ke saath messages log kare file mein aur console mein.

### Steps

1. `logger.js` file banao — ye hamara custom module hoga
2. `app.js` mein isse use karo

### Solution — logger.js

```javascript
// logger.js — Apna custom logging module
const fs = require("fs");
const path = require("path");

// Log file ka path
const LOG_FILE = path.join(__dirname, "app.log");

// Log levels ke colors (terminal mein)
const LEVELS = {
    INFO: "ℹ️  INFO",
    WARN: "⚠️  WARN",
    ERROR: "❌ ERROR",
    SUCCESS: "✅ SUCCESS",
    DEBUG: "🔍 DEBUG"
};

function writeLog(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;

    // Console mein dikhao
    console.log(logLine);

    // File mein bhi likho
    fs.appendFile(LOG_FILE, logLine + "\n", (err) => {
        if (err) console.error("Log file write failed:", err.message);
    });
}

// Alag alag log functions
function info(message) {
    writeLog(LEVELS.INFO, message);
}

function warn(message) {
    writeLog(LEVELS.WARN, message);
}

function error(message) {
    writeLog(LEVELS.ERROR, message);
}

function success(message) {
    writeLog(LEVELS.SUCCESS, message);
}

function debug(message) {
    writeLog(LEVELS.DEBUG, message);
}

// Log file clear karo
function clearLogs() {
    fs.writeFileSync(LOG_FILE, "");
    console.log("Log file cleared!");
}

// Export karo — doosri files mein use ke liye
module.exports = {
    info,
    warn,
    error,
    success,
    debug,
    clearLogs
};
```

### Solution — app.js (Logger Use Karo)

```javascript
// app.js — Logger module use karte hain
const logger = require("./logger");

// Alag alag log types
logger.info("Application started");
logger.success("Database connection successful");
logger.warn("Memory usage is high: 85%");
logger.debug("Processing request from user: Ramesh");
logger.error("Failed to fetch crop prices from API");

logger.info("Processing 500kg Tomato order");
logger.success("Order #1234 placed successfully");
logger.warn("Stock low: Only 50kg Onion remaining");
```

> **Terminal Command:**
> ```bash
> node app.js
> ```

> **Expected Output:**
> ```
> [2026-04-04T10:00:00.000Z] [ℹ️  INFO] Application started
> [2026-04-04T10:00:00.001Z] [✅ SUCCESS] Database connection successful
> [2026-04-04T10:00:00.002Z] [⚠️  WARN] Memory usage is high: 85%
> ...
> ```

Ab `app.log` file check karo — usme bhi saare logs honge!

---

## Task 2: File Reader Tool

### Problem Statement

Ek command-line file reader banao jo koi bhi text file padh ke dikhaye, with line numbers.

### Solution

```javascript
// file-reader.js — Koi bhi file padho with line numbers
// Usage: node file-reader.js <filepath>

const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const filePath = process.argv[2];

// Validation
if (!filePath) {
    console.log("╔═════════════════════════════════╗");
    console.log("║     FILE READER TOOL            ║");
    console.log("╠═════════════════════════════════╣");
    console.log("║ Usage:                          ║");
    console.log("║   node file-reader.js <file>    ║");
    console.log("║                                 ║");
    console.log("║ Example:                        ║");
    console.log("║   node file-reader.js data.txt  ║");
    console.log("╚═════════════════════════════════╝");
    process.exit(1);
}

// Full path banao
const fullPath = path.resolve(filePath);

// Check karo file hai ya nahi
if (!fs.existsSync(fullPath)) {
    logger.error(`File not found: ${fullPath}`);
    process.exit(1);
}

// File read karo
logger.info(`Reading file: ${fullPath}`);

try {
    const content = fs.readFileSync(fullPath, "utf8");
    const lines = content.split("\n");

    console.log(`\n📄 File: ${path.basename(fullPath)}`);
    console.log(`📊 Lines: ${lines.length} | Size: ${fs.statSync(fullPath).size} bytes`);
    console.log("─".repeat(50));

    // Line numbers ke saath print karo
    lines.forEach((line, index) => {
        const lineNum = String(index + 1).padStart(4, " ");
        console.log(`${lineNum} │ ${line}`);
    });

    console.log("─".repeat(50));
    logger.success("File read complete");
} catch (err) {
    logger.error(`Read failed: ${err.message}`);
}
```

Test karne ke liye pehle ek sample file banao:

> **Terminal Command:**
> ```bash
> echo "Namaste Duniya
> Ye meri pehli file hai
> Node.js se padh rahe hain
> Line 4 - last line" > sample.txt
> node file-reader.js sample.txt
> ```

---

## Task 3: File Writer Tool

### Problem Statement

Ek tool banao jo command line se content le aur file mein likhe — new file ya append mode.

### Solution

```javascript
// file-writer.js — File mein content likho
// Usage: node file-writer.js <filename> <mode:write|append> <content>

const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const fileName = process.argv[2];
const mode = process.argv[3];  // "write" ya "append"
const content = process.argv.slice(4).join(" ");  // Baaki saare arguments = content

// Validation
if (!fileName || !mode || !content) {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║        FILE WRITER TOOL                  ║");
    console.log("╠══════════════════════════════════════════╣");
    console.log("║ Usage:                                   ║");
    console.log("║   node file-writer.js <file> <mode> text ║");
    console.log("║                                          ║");
    console.log("║ Modes:                                   ║");
    console.log("║   write  — New file (overwrite)          ║");
    console.log("║   append — Add to existing file          ║");
    console.log("║                                          ║");
    console.log("║ Examples:                                ║");
    console.log("║   node file-writer.js notes.txt write    ║");
    console.log("║     Hello this is my first note          ║");
    console.log("║   node file-writer.js notes.txt append   ║");
    console.log("║     This line will be added              ║");
    console.log("╚══════════════════════════════════════════╝");
    process.exit(1);
}

if (mode !== "write" && mode !== "append") {
    logger.error("Mode sirf 'write' ya 'append' ho sakta hai!");
    process.exit(1);
}

const fullPath = path.join(__dirname, fileName);

try {
    if (mode === "write") {
        fs.writeFileSync(fullPath, content + "\n", "utf8");
        logger.success(`File written: ${fullPath}`);
    } else {
        fs.appendFileSync(fullPath, content + "\n", "utf8");
        logger.success(`Content appended to: ${fullPath}`);
    }

    // File info dikhao
    const stats = fs.statSync(fullPath);
    console.log(`\n📄 File: ${fileName}`);
    console.log(`📊 Size: ${stats.size} bytes`);
    console.log(`📅 Modified: ${stats.mtime.toLocaleString()}`);
} catch (err) {
    logger.error(`Write failed: ${err.message}`);
}
```

> **Terminal Command:**
> ```bash
> node file-writer.js notes.txt write "Meri pehli note - Node.js seekh raha hoon"
> node file-writer.js notes.txt append "Doosri note - fs module bahut useful hai"
> node file-writer.js notes.txt append "Teesri note - Custom modules banana aasan hai"
> node file-reader.js notes.txt
> ```

---

## Task 4: JSON Data Manager

### Problem Statement

Ek student database banao jo JSON file mein data store kare — add, list, search features ke saath.

### Solution

```javascript
// student-db.js — JSON file based student database
// Usage: node student-db.js add <name> <age> <grade>
//        node student-db.js list
//        node student-db.js search <name>

const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "students.json");

// Database load karo (ya empty array return karo)
function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
}

// Database save karo
function saveDB(students) {
    fs.writeFileSync(DB_FILE, JSON.stringify(students, null, 2), "utf8");
}

// Command parse karo
const command = process.argv[2];

if (!command) {
    console.log("Commands: add, list, search, delete, stats");
    console.log("Example: node student-db.js add Rahul 20 A");
    process.exit(1);
}

switch (command) {
    case "add": {
        const name = process.argv[3];
        const age = parseInt(process.argv[4]);
        const grade = process.argv[5];

        if (!name || isNaN(age) || !grade) {
            console.log("Usage: node student-db.js add <name> <age> <grade>");
            break;
        }

        const students = loadDB();
        const newStudent = {
            id: students.length + 1,
            name,
            age,
            grade,
            addedAt: new Date().toISOString()
        };
        students.push(newStudent);
        saveDB(students);
        console.log(`✅ Student added: ${name} (Age: ${age}, Grade: ${grade})`);
        console.log(`📊 Total students: ${students.length}`);
        break;
    }

    case "list": {
        const students = loadDB();
        if (students.length === 0) {
            console.log("Koi student nahi hai! 'add' command use karo.");
            break;
        }

        console.log("\n===== STUDENT LIST =====\n");
        console.log("ID".padEnd(5) + "Name".padEnd(15) + "Age".padEnd(8) + "Grade");
        console.log("-".repeat(35));
        students.forEach(s => {
            console.log(
                String(s.id).padEnd(5) +
                s.name.padEnd(15) +
                String(s.age).padEnd(8) +
                s.grade
            );
        });
        console.log(`\nTotal: ${students.length} students`);
        break;
    }

    case "search": {
        const searchName = process.argv[3];
        if (!searchName) {
            console.log("Usage: node student-db.js search <name>");
            break;
        }

        const students = loadDB();
        const found = students.filter(s =>
            s.name.toLowerCase().includes(searchName.toLowerCase())
        );

        if (found.length === 0) {
            console.log(`❌ "${searchName}" se koi match nahi mila`);
        } else {
            console.log(`\n🔍 ${found.length} result(s) found:\n`);
            found.forEach(s => {
                console.log(`  ID: ${s.id} | ${s.name} | Age: ${s.age} | Grade: ${s.grade}`);
            });
        }
        break;
    }

    case "stats": {
        const students = loadDB();
        if (students.length === 0) {
            console.log("No data available.");
            break;
        }

        const avgAge = students.reduce((sum, s) => sum + s.age, 0) / students.length;
        const gradeCount = {};
        students.forEach(s => {
            gradeCount[s.grade] = (gradeCount[s.grade] || 0) + 1;
        });

        console.log("\n📊 STUDENT STATS");
        console.log(`Total Students : ${students.length}`);
        console.log(`Average Age    : ${avgAge.toFixed(1)}`);
        console.log("Grade Distribution:");
        Object.entries(gradeCount).forEach(([grade, count]) => {
            console.log(`  Grade ${grade}: ${count} students`);
        });
        break;
    }

    default:
        console.log(`Unknown command: ${command}`);
        console.log("Valid commands: add, list, search, stats");
}
```

> **Terminal Command:**
> ```bash
> node student-db.js add Rahul 20 A
> node student-db.js add Priya 19 A+
> node student-db.js add Amit 21 B
> node student-db.js add Neha 20 A
> node student-db.js list
> node student-db.js search Pri
> node student-db.js stats
> ```

---

## Task 5: Linux Command Practice (ls/cat/grep)

### Problem Statement

Backend developers ko Linux commands aana zaroori hai. Practice karo!

### ls — Files List Karo

```bash
# Current folder ki files
ls

# Detailed list (permissions, size, date)
ls -la

# Sirf .js files
ls *.js

# Size ke saath human-readable
ls -lh
```

### cat — File Content Dekho

```bash
# File padho
cat sample.txt

# Line numbers ke saath
cat -n sample.txt

# Multiple files ek saath
cat sample.txt notes.txt
```

### grep — Content Search Karo

```bash
# Kisi word ko search karo
grep "error" app.log

# Case-insensitive search
grep -i "error" app.log

# Line number ke saath
grep -n "Student" student-db.js

# Multiple files mein search
grep -r "require" *.js

# Count kitni baar aaya
grep -c "log" app.js
```

> **Practice Time!** In commands ko apne project folder mein try karo. Har command ka output samjho. Backend developer ke liye ye daily use commands hain!

---

## Task 6: Git Commit

```bash
git add .
git status
git commit -m "Day 12: fs module tools - logger, file reader/writer, student JSON db, linux practice"
git log --oneline
```

---

## Mini Challenge: Directory Scanner

### Problem Statement

Ek script banao jo kisi bhi folder ko scan kare aur bataye:
- Kitni files hain
- Kitne folders hain
- Total size
- Sabse badi file kaun si hai

### Hint

```javascript
// dir-scanner.js
const fs = require("fs");
const path = require("path");

const targetDir = process.argv[2] || __dirname;

// fs.readdirSync() se files lo
// fs.statSync() se har file ki info lo
// stat.isFile() aur stat.isDirectory() se type check karo
// stat.size se size dekho

// Tumhara code yahan likho...
```

> **Practice Time!** Is challenge ko khud solve karo! `fs.statSync()` aur `fs.readdirSync()` use karo.

---

## Quick Revision Table

| Task | Key Concepts |
|------|-------------|
| Logger Module | `module.exports`, `fs.appendFile()`, custom functions |
| File Reader | `fs.readFileSync()`, `fs.statSync()`, `path.resolve()` |
| File Writer | `fs.writeFileSync()`, `fs.appendFileSync()`, modes |
| Student DB | `JSON.parse()`, `JSON.stringify()`, file-based storage |
| Linux Commands | `ls -la`, `cat -n`, `grep -rn` |
| Git Commit | Regular commits with clear messages |

---

## Aaj Kya Seekha?

1. **Custom modules** banake code ko reusable bana sakte ho
2. **fs.readFileSync/readFile** se files padh sakte ho
3. **fs.writeFileSync/writeFile** se files likh sakte ho (overwrite)
4. **fs.appendFileSync/appendFile** se existing file mein add kar sakte ho
5. **JSON** files ko database ki tarah use kar sakte ho (small projects ke liye)
6. **Linux commands** — ls, cat, grep — backend developer ki daily tools hain
7. **path.join()** hamesha use karo — hardcoded paths mat likho

> **Tip:** Kal hum HTTP protocol aur apna pehla server banayenge! Aaj ke tools practice karo — file read/write backend ka foundation hai!
