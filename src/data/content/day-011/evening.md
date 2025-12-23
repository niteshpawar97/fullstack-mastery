# Day 11 Evening: Node.js Practice — Scripts, Arguments & Calculations

> **Practice Time!** Morning mein seekha ki Node.js kya hai, REPL, process object, global vs window. Ab haathon se code karo — real Node.js scripts likho!

---

## Setup: Project Folder Banao

> **Terminal Command:**
> ```bash
> mkdir day11-nodejs-intro
> cd day11-nodejs-intro
> git init
> code .
> ```

---

## Task 1: System Info Script

### Problem Statement

Ek script likho jo tumhare computer ki saari information print kare using `process` object.

### Steps

1. File banao: `system-info.js`
2. Neeche ka code khud type karo
3. Run karo: `node system-info.js`

### Solution

```javascript
// system-info.js - Computer ki jaankari dikhao
// Ye script sirf Node.js mein chalegi, browser mein nahi!

console.log("╔══════════════════════════════════╗");
console.log("║      SYSTEM INFORMATION          ║");
console.log("╚══════════════════════════════════╝");

// Node.js version
console.log(`\n📌 Node.js Version : ${process.version}`);

// Operating System
const platforms = {
    win32: "Windows",
    linux: "Linux",
    darwin: "macOS"
};
const osName = platforms[process.platform] || process.platform;
console.log(`💻 Operating System: ${osName}`);

// Architecture (64-bit ya 32-bit)
console.log(`🔧 Architecture    : ${process.arch}`);

// Current Directory
console.log(`📂 Working Directory: ${process.cwd()}`);

// Process ID
console.log(`🆔 Process ID      : ${process.pid}`);

// Memory Usage
const mem = process.memoryUsage();
console.log(`\n📊 Memory Usage:`);
console.log(`   RSS        : ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Heap Total : ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Heap Used  : ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);

// Uptime
console.log(`\n⏱️  Uptime: ${process.uptime().toFixed(3)} seconds`);

// Environment variable (PATH ka ek chhota hissa)
console.log(`\n🌍 Home Directory: ${process.env.HOME || process.env.USERPROFILE}`);
```

> **Expected Output:**
> ```
> ╔══════════════════════════════════╗
> ║      SYSTEM INFORMATION          ║
> ╚══════════════════════════════════╝
>
> 📌 Node.js Version : v20.11.0
> 💻 Operating System: Windows
> 🔧 Architecture    : x64
> 📂 Working Directory: C:\Users\...\day11-nodejs-intro
> 🆔 Process ID      : 15432
>
> 📊 Memory Usage:
>    RSS        : 25.50 MB
>    Heap Total : 6.12 MB
>    Heap Used  : 4.88 MB
>
> ⏱️  Uptime: 0.035 seconds
>
> 🌍 Home Directory: C:\Users\user
> ```

---

## Task 2: Command Line Calculator

### Problem Statement

Ek calculator banao jo command line se 2 numbers aur operator le aur result de.

### Steps

1. File banao: `calculator.js`
2. Code likho
3. Run karo: `node calculator.js 10 + 5`

### Solution

```javascript
// calculator.js - Command line calculator
// Usage: node calculator.js <num1> <operator> <num2>

// Arguments lo (index 2 se shuru)
const num1 = parseFloat(process.argv[2]);
const operator = process.argv[3];
const num2 = parseFloat(process.argv[4]);

// Check karo ki saare arguments diye hain
if (!process.argv[2] || !operator || !process.argv[4]) {
    console.log("❌ Galat usage!");
    console.log("✅ Sahi tarika: node calculator.js <number1> <operator> <number2>");
    console.log("📝 Example: node calculator.js 10 + 5");
    console.log("📝 Operators: + - * / % **");
    process.exit(1);  // Error se exit
}

// Check karo ki numbers valid hain
if (isNaN(num1) || isNaN(num2)) {
    console.log("❌ Invalid numbers! Sirf numbers dalo.");
    process.exit(1);
}

let result;
let operationName;

// Operator ke hisaab se calculation
switch (operator) {
    case "+":
        result = num1 + num2;
        operationName = "Jod (Addition)";
        break;
    case "-":
        result = num1 - num2;
        operationName = "Ghatao (Subtraction)";
        break;
    case "*":
        result = num1 * num2;
        operationName = "Guna (Multiplication)";
        break;
    case "/":
        if (num2 === 0) {
            console.log("❌ Zero se divide nahi kar sakte!");
            process.exit(1);
        }
        result = num1 / num2;
        operationName = "Bhag (Division)";
        break;
    case "%":
        result = num1 % num2;
        operationName = "Shesha (Modulo)";
        break;
    case "**":
        result = num1 ** num2;
        operationName = "Power (Exponent)";
        break;
    default:
        console.log(`❌ Unknown operator: ${operator}`);
        console.log("✅ Valid operators: + - * / % **");
        process.exit(1);
}

// Result dikhao
console.log("\n============================");
console.log(`  Operation: ${operationName}`);
console.log(`  ${num1} ${operator} ${num2} = ${result}`);
console.log("============================");
```

> **Terminal Command:**
> ```bash
> node calculator.js 100 + 250
> node calculator.js 500 - 175
> node calculator.js 25 "*" 4
> node calculator.js 1000 / 3
> node calculator.js 2 "**" 10
> ```

> **Warning:** Terminal mein `*` ko quotes mein likho `"*"`, nahi to terminal isse wildcard samjhega!

---

## Task 3: Kisan Mandi Price Calculator

### Problem Statement

Command line se kisan ka naam, crop naam, weight aur price-per-kg lo. Total sale calculate karo aur commission kat ke final amount batao.

### Solution

```javascript
// mandi-calculator.js
// Usage: node mandi-calculator.js <kisanNaam> <crop> <weightKg> <pricePerKg>

const kisanNaam = process.argv[2];
const crop = process.argv[3];
const weightKg = parseFloat(process.argv[4]);
const pricePerKg = parseFloat(process.argv[5]);

// Validation
if (!kisanNaam || !crop || isNaN(weightKg) || isNaN(pricePerKg)) {
    console.log("╔═══════════════════════════════════════╗");
    console.log("║    MANDI PRICE CALCULATOR - HELP      ║");
    console.log("╠═══════════════════════════════════════╣");
    console.log("║ Usage:                                ║");
    console.log("║ node mandi-calculator.js              ║");
    console.log("║   <naam> <crop> <weight> <price>      ║");
    console.log("║                                       ║");
    console.log("║ Example:                              ║");
    console.log("║ node mandi-calculator.js              ║");
    console.log("║   Ramesh Tomato 500 40                ║");
    console.log("╚═══════════════════════════════════════╝");
    process.exit(1);
}

// Calculations
const totalSale = weightKg * pricePerKg;
const commissionRate = 0.05;  // 5% mandi commission
const commission = totalSale * commissionRate;
const labourCharge = weightKg * 0.5;  // ₹0.50 per kg loading
const netAmount = totalSale - commission - labourCharge;

// Receipt print karo
console.log("\n╔═══════════════════════════════════════╗");
console.log("║         MANDI SALE RECEIPT            ║");
console.log("╠═══════════════════════════════════════╣");
console.log(`║ Kisan     : ${kisanNaam.padEnd(25)}║`);
console.log(`║ Crop      : ${crop.padEnd(25)}║`);
console.log(`║ Weight    : ${(weightKg + " kg").padEnd(25)}║`);
console.log(`║ Rate      : ₹${(pricePerKg + "/kg").padEnd(23)}║`);
console.log("╠═══════════════════════════════════════╣");
console.log(`║ Gross Sale: ₹${totalSale.toFixed(2).padEnd(23)}║`);
console.log(`║ Commission: ₹${commission.toFixed(2).padEnd(23)}║`);
console.log(`║ Labour    : ₹${labourCharge.toFixed(2).padEnd(23)}║`);
console.log("╠═══════════════════════════════════════╣");
console.log(`║ NET AMOUNT: ₹${netAmount.toFixed(2).padEnd(23)}║`);
console.log("╚═══════════════════════════════════════╝");
console.log(`\nDate: ${new Date().toLocaleDateString()}`);
console.log(`Time: ${new Date().toLocaleTimeString()}`);
```

> **Terminal Command:**
> ```bash
> node mandi-calculator.js Ramesh Tomato 500 40
> node mandi-calculator.js Suresh Onion 1000 25
> ```

---

## Task 4: Multi-Student Grade Calculator

### Problem Statement

Command line se multiple students ke marks lo aur unka grade calculate karo.

### Solution

```javascript
// grade-calculator.js
// Usage: node grade-calculator.js Rahul:85 Priya:92 Amit:67 Neha:45

const args = process.argv.slice(2);  // Pehle 2 skip karo

if (args.length === 0) {
    console.log("Usage: node grade-calculator.js Name1:Marks1 Name2:Marks2 ...");
    console.log("Example: node grade-calculator.js Rahul:85 Priya:92 Amit:67");
    process.exit(1);
}

// Grade determine karne ka function
function getGrade(marks) {
    if (marks >= 90) return { grade: "A+", remark: "Excellent!" };
    if (marks >= 80) return { grade: "A",  remark: "Very Good" };
    if (marks >= 70) return { grade: "B",  remark: "Good" };
    if (marks >= 60) return { grade: "C",  remark: "Average" };
    if (marks >= 50) return { grade: "D",  remark: "Below Avg" };
    return { grade: "F", remark: "Fail" };
}

console.log("\n===== STUDENT GRADE REPORT =====\n");
console.log("Name".padEnd(15) + "Marks".padEnd(10) + "Grade".padEnd(8) + "Remark");
console.log("-".repeat(45));

let totalMarks = 0;
let topperName = "";
let topperMarks = 0;

args.forEach(arg => {
    const [name, marksStr] = arg.split(":");
    const marks = parseInt(marksStr);

    if (!name || isNaN(marks)) {
        console.log(`⚠️  Invalid entry: ${arg} — skip kiya`);
        return;
    }

    const { grade, remark } = getGrade(marks);
    console.log(name.padEnd(15) + String(marks).padEnd(10) + grade.padEnd(8) + remark);

    totalMarks += marks;
    if (marks > topperMarks) {
        topperMarks = marks;
        topperName = name;
    }
});

console.log("-".repeat(45));
console.log(`\nTotal Students: ${args.length}`);
console.log(`Average Marks : ${(totalMarks / args.length).toFixed(1)}`);
console.log(`Class Topper  : ${topperName} (${topperMarks} marks)`);
```

> **Terminal Command:**
> ```bash
> node grade-calculator.js Rahul:85 Priya:92 Amit:67 Neha:45 Ravi:78
> ```

---

## Task 5: Environment Variable Explorer

### Problem Statement

Apne system ki environment variables explore karo using `process.env`.

### Solution

```javascript
// env-explorer.js
// Node.js se apne system ki environment variables dekho

const env = process.env;

console.log("=== ENVIRONMENT VARIABLES ===\n");

// Kuch important variables
console.log(`Username    : ${env.USERNAME || env.USER || "N/A"}`);
console.log(`Home Dir    : ${env.HOME || env.USERPROFILE || "N/A"}`);
console.log(`OS          : ${env.OS || process.platform}`);
console.log(`Shell       : ${env.SHELL || env.ComSpec || "N/A"}`);
console.log(`Node Path   : ${process.execPath}`);

// Kitne environment variables hain?
const envKeys = Object.keys(env);
console.log(`\nTotal ENV variables: ${envKeys.length}`);

// Search feature — command line se search karo
const searchTerm = process.argv[2];
if (searchTerm) {
    console.log(`\n🔍 Searching for "${searchTerm}"...\n`);
    const matches = envKeys.filter(key =>
        key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matches.length > 0) {
        matches.forEach(key => {
            // Value chhota karke dikhao (privacy ke liye)
            const val = env[key];
            const shortVal = val.length > 60 ? val.substring(0, 60) + "..." : val;
            console.log(`  ${key} = ${shortVal}`);
        });
    } else {
        console.log("  Kuch nahi mila!");
    }
} else {
    console.log("\nTip: node env-explorer.js <search-term> se search karo");
    console.log("Example: node env-explorer.js path");
}
```

> **Terminal Command:**
> ```bash
> node env-explorer.js
> node env-explorer.js path
> node env-explorer.js node
> ```

---

## Task 6: Git Commit Practice

### Problem Statement

Apna saara kaam git mein commit karo — ye habit banana zaroori hai!

### Steps

```bash
# Status check karo
git status

# Saari files add karo
git add .

# Commit karo with meaningful message
git commit -m "Day 11: Node.js intro - system info, calculator, mandi price tool, grade calculator"

# Log dekho
git log --oneline
```

> **Tip:** Har task ke baad commit karna achi habit hai. Real job mein bhi aisa hi karte hain — chhote chhote commits, clear messages!

---

## Mini Challenge: Number Guessing Game

### Problem Statement

Ek number guessing hint tool banao — user command line se guess kare, program bataye ki sahi hai ya nahi.

### Hint

```javascript
// guess-game.js
// Ek fixed secret number rakho
// process.argv se user ka guess lo
// Compare karo aur hint do — "Too High", "Too Low", ya "Correct!"

const secretNumber = 42;
const guess = parseInt(process.argv[2]);

// Tumhara code yahan likho...
// Agar guess nahi diya to usage batao
// Agar guess === secretNumber to "Sahi jawab!"
// Agar guess > secretNumber to "Bahut bada! Neeche try karo"
// Agar guess < secretNumber to "Bahut chhota! Upar try karo"
```

> **Practice Time!** Is challenge ko khud solve karo! Hint: `if-else` use karo. Bonus: Multiple secret numbers ka array banao aur random pick karo using `Math.random()`.

---

## Quick Revision Table

| Task | Key Concept |
|------|------------|
| System Info | `process.version`, `process.platform`, `process.memoryUsage()` |
| Calculator | `process.argv` se input, `parseFloat()` for numbers |
| Mandi Tool | String methods like `.padEnd()`, `.toFixed()` for formatting |
| Grade Calc | `Array.forEach()`, `split(":")` for parsing |
| ENV Explorer | `process.env` — system variables access |
| Git Commit | Har task ke baad commit — professional habit |

---

## Aaj Kya Seekha?

1. **Node.js scripts** terminal mein `node filename.js` se chalte hain
2. **process.argv** se command line se koi bhi data le sakte ho
3. **process.env** se environment variables access hote hain
4. **process.exit()** se program ko band kar sakte ho with status code
5. **parseFloat / parseInt** se string arguments ko numbers mein convert karo
6. **Formatting** — `.padEnd()`, `.toFixed()` se output sundar banao
7. **Git commit** — har task ke baad karo, clear messages ke saath

> **Tip:** Kal hum Node.js ke File System module seekhenge — files read/write karna! Aaj ke saare scripts ek baar phir se khud type karke run karo. Copy-paste se seekhna nahi hota!
