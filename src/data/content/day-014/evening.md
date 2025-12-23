# Day 14 Evening: Mini Project — Student Database CLI Tool

> **Practice Time!** Aaj ka mini project hai — ek complete "Student Database CLI" banao jo JSON file mein data store kare. Node.js fs module, modules, process.argv — sab use hoga. Ye tumhara pehla real backend tool hai!

---

## Project: Student Database CLI

### Kya Banayenge?

Ek command-line tool jo:
- Students ko **add** kare (JSON file mein)
- Saare students **list** kare
- Name se **search** kare
- Student ko **update** kare
- Student ko **delete** kare
- **Statistics** dikhaye
- **Export** kare CSV format mein

### Project Structure

```
student-db-cli/
├── package.json
├── index.js          ← Main entry point (CLI handler)
├── lib/
│   ├── database.js   ← File read/write operations
│   ├── display.js    ← Output formatting functions
│   └── validator.js  ← Input validation
├── data/
│   └── students.json ← Data storage file
└── exports/
    └── (CSV files yahaan aayengi)
```

> **Terminal Command:**
> ```bash
> mkdir student-db-cli
> cd student-db-cli
> npm init -y
> mkdir lib data exports
> git init
> code .
> ```

---

## Step 1: Database Module — `lib/database.js`

```javascript
// lib/database.js — JSON file mein data read/write karo
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "students.json");

// Database load karo
function loadStudents() {
    // Agar file nahi hai to empty array return karo
    if (!fs.existsSync(DB_PATH)) {
        saveStudents([]);  // Empty file banao
        return [];
    }

    try {
        const data = fs.readFileSync(DB_PATH, "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Database read error:", err.message);
        return [];
    }
}

// Database save karo
function saveStudents(students) {
    // Data folder check karo
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(students, null, 2), "utf8");
        return true;
    } catch (err) {
        console.error("Database write error:", err.message);
        return false;
    }
}

// Next ID generate karo
function getNextId(students) {
    if (students.length === 0) return 1;
    const maxId = Math.max(...students.map(s => s.id));
    return maxId + 1;
}

module.exports = {
    loadStudents,
    saveStudents,
    getNextId
};
```

---

## Step 2: Validator Module — `lib/validator.js`

```javascript
// lib/validator.js — Input validation functions
function validateName(name) {
    if (!name || name.trim().length < 2) {
        return { valid: false, message: "Name kam se kam 2 characters ka hona chahiye" };
    }
    if (name.length > 50) {
        return { valid: false, message: "Name 50 characters se chhota hona chahiye" };
    }
    return { valid: true };
}

function validateAge(age) {
    const num = parseInt(age);
    if (isNaN(num)) {
        return { valid: false, message: "Age ek number hona chahiye" };
    }
    if (num < 5 || num > 100) {
        return { valid: false, message: "Age 5 se 100 ke beech honi chahiye" };
    }
    return { valid: true, value: num };
}

function validateGrade(grade) {
    const validGrades = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];
    if (!grade || !validGrades.includes(grade.toUpperCase())) {
        return {
            valid: false,
            message: `Grade in mein se hona chahiye: ${validGrades.join(", ")}`
        };
    }
    return { valid: true, value: grade.toUpperCase() };
}

function validateSubject(subject) {
    const validSubjects = ["Math", "Science", "English", "Hindi", "Computer", "History"];
    if (!subject) {
        return { valid: false, message: "Subject dena zaroori hai" };
    }
    // First letter capitalize
    const formatted = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
    return { valid: true, value: formatted };
}

module.exports = {
    validateName,
    validateAge,
    validateGrade,
    validateSubject
};
```

---

## Step 3: Display Module — `lib/display.js`

```javascript
// lib/display.js — Output formatting functions
function printHeader(title) {
    const line = "═".repeat(50);
    console.log(`\n╔${line}╗`);
    console.log(`║${title.padStart(25 + title.length / 2).padEnd(50)}║`);
    console.log(`╚${line}╝`);
}

function printStudentTable(students) {
    if (students.length === 0) {
        console.log("\n  📭 Koi student nahi hai database mein!");
        return;
    }

    console.log("\n" + "─".repeat(65));
    console.log(
        "ID".padEnd(6) +
        "Name".padEnd(18) +
        "Age".padEnd(6) +
        "Grade".padEnd(8) +
        "Subject".padEnd(12) +
        "Date Added"
    );
    console.log("─".repeat(65));

    students.forEach(s => {
        const date = new Date(s.addedAt).toLocaleDateString();
        console.log(
            String(s.id).padEnd(6) +
            s.name.padEnd(18) +
            String(s.age).padEnd(6) +
            s.grade.padEnd(8) +
            (s.subject || "N/A").padEnd(12) +
            date
        );
    });

    console.log("─".repeat(65));
    console.log(`  Total: ${students.length} student(s)\n`);
}

function printStudent(student) {
    console.log("\n┌────────────────────────────┐");
    console.log(`│  Student ID: ${student.id}`);
    console.log(`│  Name    : ${student.name}`);
    console.log(`│  Age     : ${student.age}`);
    console.log(`│  Grade   : ${student.grade}`);
    console.log(`│  Subject : ${student.subject || "N/A"}`);
    console.log(`│  Added   : ${new Date(student.addedAt).toLocaleString()}`);
    console.log("└────────────────────────────┘");
}

function printStats(students) {
    if (students.length === 0) {
        console.log("\n  📭 No data to show stats.");
        return;
    }

    const totalStudents = students.length;
    const avgAge = (students.reduce((s, st) => s + st.age, 0) / totalStudents).toFixed(1);

    // Grade distribution
    const gradeCount = {};
    students.forEach(s => {
        gradeCount[s.grade] = (gradeCount[s.grade] || 0) + 1;
    });

    // Subject distribution
    const subjectCount = {};
    students.forEach(s => {
        const sub = s.subject || "Unknown";
        subjectCount[sub] = (subjectCount[sub] || 0) + 1;
    });

    // Age range
    const ages = students.map(s => s.age);
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);

    console.log("\n📊 STUDENT DATABASE STATISTICS");
    console.log("═".repeat(40));
    console.log(`  Total Students : ${totalStudents}`);
    console.log(`  Average Age    : ${avgAge}`);
    console.log(`  Age Range      : ${minAge} - ${maxAge}`);

    console.log("\n  Grade Distribution:");
    Object.entries(gradeCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([grade, count]) => {
            const bar = "█".repeat(count * 2);
            console.log(`    ${grade.padEnd(4)} ${bar} ${count}`);
        });

    console.log("\n  Subject Distribution:");
    Object.entries(subjectCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([subject, count]) => {
            console.log(`    ${subject.padEnd(12)} : ${count} student(s)`);
        });
}

function printHelp() {
    console.log(`
╔═══════════════════════════════════════════════╗
║         STUDENT DATABASE CLI - HELP           ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Commands:                                    ║
║                                               ║
║  add <name> <age> <grade> [subject]           ║
║    → Naya student add karo                    ║
║                                               ║
║  list                                         ║
║    → Saare students dikhao                    ║
║                                               ║
║  search <name>                                ║
║    → Name se student dhundho                  ║
║                                               ║
║  update <id> <field> <value>                  ║
║    → Student ki info update karo              ║
║    → Fields: name, age, grade, subject        ║
║                                               ║
║  delete <id>                                  ║
║    → Student delete karo                      ║
║                                               ║
║  stats                                        ║
║    → Statistics dikhao                        ║
║                                               ║
║  export                                       ║
║    → CSV file mein export karo                ║
║                                               ║
║  help                                         ║
║    → Ye help message dikhao                   ║
║                                               ║
╚═══════════════════════════════════════════════╝
    `);
}

module.exports = {
    printHeader,
    printStudentTable,
    printStudent,
    printStats,
    printHelp
};
```

---

## Step 4: Main File — `index.js`

```javascript
// index.js — Student Database CLI - Main Entry Point
const fs = require("fs");
const path = require("path");
const { loadStudents, saveStudents, getNextId } = require("./lib/database");
const { validateName, validateAge, validateGrade, validateSubject } = require("./lib/validator");
const { printHeader, printStudentTable, printStudent, printStats, printHelp } = require("./lib/display");

// Command parse karo
const command = process.argv[2];
const args = process.argv.slice(3);

// Agar koi command nahi diya
if (!command) {
    printHelp();
    process.exit(0);
}

// ============ COMMAND HANDLING ============

switch (command.toLowerCase()) {

    // ---- ADD STUDENT ----
    case "add": {
        const [name, age, grade, subject] = args;

        // Validate name
        const nameCheck = validateName(name);
        if (!nameCheck.valid) {
            console.log(`❌ ${nameCheck.message}`);
            console.log("Usage: node index.js add <name> <age> <grade> [subject]");
            break;
        }

        // Validate age
        const ageCheck = validateAge(age);
        if (!ageCheck.valid) {
            console.log(`❌ ${ageCheck.message}`);
            break;
        }

        // Validate grade
        const gradeCheck = validateGrade(grade);
        if (!gradeCheck.valid) {
            console.log(`❌ ${gradeCheck.message}`);
            break;
        }

        // Subject (optional but validate if given)
        let subjectValue = "General";
        if (subject) {
            const subCheck = validateSubject(subject);
            subjectValue = subCheck.valid ? subCheck.value : subject;
        }

        // Load, add, save
        const students = loadStudents();
        const newStudent = {
            id: getNextId(students),
            name: name.trim(),
            age: ageCheck.value,
            grade: gradeCheck.value,
            subject: subjectValue,
            addedAt: new Date().toISOString()
        };

        students.push(newStudent);
        saveStudents(students);

        console.log(`\n✅ Student added successfully!`);
        printStudent(newStudent);
        break;
    }

    // ---- LIST ALL STUDENTS ----
    case "list": {
        printHeader("STUDENT DATABASE");
        const students = loadStudents();
        printStudentTable(students);
        break;
    }

    // ---- SEARCH STUDENT ----
    case "search": {
        const searchTerm = args[0];
        if (!searchTerm) {
            console.log("Usage: node index.js search <name>");
            break;
        }

        const students = loadStudents();
        const results = students.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        printHeader(`SEARCH: "${searchTerm}"`);
        if (results.length === 0) {
            console.log(`\n  🔍 "${searchTerm}" se koi match nahi mila.`);
        } else {
            console.log(`\n  🔍 ${results.length} result(s) found:`);
            printStudentTable(results);
        }
        break;
    }

    // ---- UPDATE STUDENT ----
    case "update": {
        const [idStr, field, ...valueParts] = args;
        const id = parseInt(idStr);
        const value = valueParts.join(" ");

        if (isNaN(id) || !field || !value) {
            console.log("Usage: node index.js update <id> <field> <value>");
            console.log("Fields: name, age, grade, subject");
            console.log("Example: node index.js update 1 grade A+");
            break;
        }

        const students = loadStudents();
        const studentIndex = students.findIndex(s => s.id === id);

        if (studentIndex === -1) {
            console.log(`❌ Student ID ${id} nahi mila!`);
            break;
        }

        // Field validate aur update karo
        const validFields = ["name", "age", "grade", "subject"];
        if (!validFields.includes(field.toLowerCase())) {
            console.log(`❌ Invalid field: ${field}`);
            console.log(`Valid fields: ${validFields.join(", ")}`);
            break;
        }

        const oldValue = students[studentIndex][field];

        switch (field.toLowerCase()) {
            case "name":
                const nameCheck = validateName(value);
                if (!nameCheck.valid) { console.log(`❌ ${nameCheck.message}`); process.exit(1); }
                students[studentIndex].name = value;
                break;
            case "age":
                const ageCheck = validateAge(value);
                if (!ageCheck.valid) { console.log(`❌ ${ageCheck.message}`); process.exit(1); }
                students[studentIndex].age = ageCheck.value;
                break;
            case "grade":
                const gradeCheck = validateGrade(value);
                if (!gradeCheck.valid) { console.log(`❌ ${gradeCheck.message}`); process.exit(1); }
                students[studentIndex].grade = gradeCheck.value;
                break;
            case "subject":
                students[studentIndex].subject = value;
                break;
        }

        saveStudents(students);
        console.log(`\n✅ Student #${id} updated!`);
        console.log(`   ${field}: ${oldValue} → ${students[studentIndex][field]}`);
        printStudent(students[studentIndex]);
        break;
    }

    // ---- DELETE STUDENT ----
    case "delete": {
        const deleteId = parseInt(args[0]);
        if (isNaN(deleteId)) {
            console.log("Usage: node index.js delete <id>");
            break;
        }

        const students = loadStudents();
        const student = students.find(s => s.id === deleteId);

        if (!student) {
            console.log(`❌ Student ID ${deleteId} nahi mila!`);
            break;
        }

        const filtered = students.filter(s => s.id !== deleteId);
        saveStudents(filtered);
        console.log(`\n🗑️  Student deleted: ${student.name} (ID: ${deleteId})`);
        console.log(`   Remaining students: ${filtered.length}`);
        break;
    }

    // ---- STATS ----
    case "stats": {
        printHeader("DATABASE STATISTICS");
        const students = loadStudents();
        printStats(students);
        break;
    }

    // ---- EXPORT TO CSV ----
    case "export": {
        const students = loadStudents();
        if (students.length === 0) {
            console.log("📭 No data to export!");
            break;
        }

        const exportDir = path.join(__dirname, "exports");
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        const timestamp = new Date().toISOString().split("T")[0];
        const csvPath = path.join(exportDir, `students_${timestamp}.csv`);

        // CSV content banao
        let csv = "ID,Name,Age,Grade,Subject,Added Date\n";
        students.forEach(s => {
            const date = new Date(s.addedAt).toLocaleDateString();
            csv += `${s.id},"${s.name}",${s.age},${s.grade},${s.subject || "N/A"},${date}\n`;
        });

        fs.writeFileSync(csvPath, csv, "utf8");
        console.log(`\n📁 CSV exported: ${csvPath}`);
        console.log(`   Records: ${students.length}`);
        break;
    }

    // ---- HELP ----
    case "help": {
        printHelp();
        break;
    }

    // ---- UNKNOWN COMMAND ----
    default: {
        console.log(`❌ Unknown command: "${command}"`);
        console.log("Type 'node index.js help' for available commands.");
    }
}
```

---

## Step 5: Test Karo!

> **Terminal Command:**
> ```bash
> # Help dekho
> node index.js help
>
> # Students add karo
> node index.js add Rahul 20 A Math
> node index.js add Priya 19 A+ Science
> node index.js add Amit 21 B Computer
> node index.js add Neha 20 A English
> node index.js add Ravi 22 C Math
>
> # List karo
> node index.js list
>
> # Search karo
> node index.js search Rah
> node index.js search a
>
> # Update karo
> node index.js update 3 grade A
> node index.js update 5 subject Science
>
> # Stats dekho
> node index.js stats
>
> # CSV export karo
> node index.js export
>
> # Delete karo
> node index.js delete 5
>
> # Final list
> node index.js list
> ```

---

## Step 6: Git Commit

```bash
git add .
git status
git commit -m "Day 14: Student Database CLI - complete CRUD with modules, validation, export"
git log --oneline
```

---

## Bonus Challenge: Extend the Tool

> **Practice Time!** In mein se koi ek feature add karo:

1. **Sort command** — `node index.js list --sort=age` (age/name/grade se sort)
2. **Filter command** — `node index.js list --grade=A` (grade se filter)
3. **Bulk add** — `node index.js import students.csv` (CSV se import)
4. **Backup** — `node index.js backup` (data folder ka copy banao with timestamp)

### Hint for Sort:

```javascript
// list command mein args check karo
if (args.includes("--sort=age")) {
    students.sort((a, b) => a.age - b.age);
}
if (args.includes("--sort=name")) {
    students.sort((a, b) => a.name.localeCompare(b.name));
}
```

---

## Quick Revision Table

| Module | Responsibility |
|--------|---------------|
| `database.js` | JSON file se data read/write |
| `validator.js` | Input validation (name, age, grade) |
| `display.js` | Console output formatting |
| `index.js` | CLI command handling + routing |

| Concept Used | Where |
|-------------|-------|
| `process.argv` | Command line arguments |
| `fs.readFileSync` | Database load |
| `fs.writeFileSync` | Database save |
| `JSON.parse/stringify` | Data serialization |
| `module.exports` | Custom module exports |
| `require()` | Module imports |
| `path.join()` | Safe file paths |
| `Array methods` | filter, find, map, reduce, sort |

---

## Aaj Kya Seekha?

1. **Project structure** — code ko modules mein todna (separation of concerns)
2. **Custom modules** — database, validator, display alag alag files
3. **Input validation** — user ka input hamesha validate karo
4. **CRUD operations** — Create, Read, Update, Delete — full cycle
5. **JSON file** ko database ki tarah use karna (small projects mein)
6. **CSV export** — data ko doosre format mein nikalna
7. **CLI tool** banana — real-world useful skill

> **Tip:** Kal se DSA (Data Structures & Algorithms) shuru hoga! Arrays, Searching, Big O notation seekhenge. Aaj ke project ko extend karo — sort aur filter feature add karo. Ye project resume pe daal sakte ho!
