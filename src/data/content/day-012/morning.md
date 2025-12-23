# Day 12 Morning: Node.js File System + Modules — Files Padhna Aur Likhna Seekho

> **Aaj ka plan:** Aaj hum Node.js mein files read/write karna seekhenge (fs module), apne khud ke modules banayenge, require vs import ka farak samjhenge, aur path module use karenge. Ye backend development ki **foundation** hai!

---

## Modules Kya Hain?

### Code Ko Tukdon Mein Todo

Socho tumhare paas 5000 lines ka code hai ek hi file mein — padho kaun? Debug karo kaun? Module system tumhe code ko **chhote-chhote files** mein todne deta hai.

> **Socho Aise:** Ek bada factory hai. Ek hi room mein sab kaam ho to chaos hoga. Isliye alag alag departments bante hain — production, packaging, billing. Har department apna kaam karta hai. Modules bhi aise hi hain — har file apna specific kaam karti hai!

### Module Types in Node.js

| Type | Example | Kahan Se Aata Hai |
|------|---------|-------------------|
| **Core Modules** | `fs`, `path`, `http`, `os` | Node.js ke saath built-in |
| **Local Modules** | `./myModule.js` | Tum khud banate ho |
| **Third-party** | `express`, `mongoose` | npm se install karte ho |

---

## CommonJS vs ESM — Do Tarike

### CommonJS (CJS) — Purana Tarika (Default)

```javascript
// Export karna
// math-utils.js
function add(a, b) { return a + b; }
function multiply(a, b) { return a * b; }

module.exports = { add, multiply };
```

```javascript
// Import karna
// app.js
const { add, multiply } = require("./math-utils");
console.log(add(5, 3));       // 8
console.log(multiply(4, 7));  // 28
```

### ES Modules (ESM) — Naya Tarika (Modern)

```javascript
// Export karna
// math-utils.mjs  (ya .js with "type": "module" in package.json)
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }
```

```javascript
// Import karna
// app.mjs
import { add, multiply } from "./math-utils.mjs";
console.log(add(5, 3));       // 8
console.log(multiply(4, 7));  // 28
```

### Comparison Table

| Feature | CommonJS (CJS) | ES Modules (ESM) |
|---------|----------------|-------------------|
| Syntax | `require()` / `module.exports` | `import` / `export` |
| File Extension | `.js` (default) | `.mjs` or `.js` with config |
| Loading | Synchronous | Asynchronous |
| Node.js Support | Hamesha se | Node 12+ |
| Use Case | Backend (common) | Modern projects, frontend |

> **Tip:** Abhi ke liye hum **CommonJS (require)** use karenge kyunki ye Node.js ka default hai aur zyada tutorials/projects mein yahi milega. Baad mein ESM pe shift karenge.

### package.json Mein Type Set Karna

Agar ESM use karna ho to `package.json` mein:
```json
{
  "type": "module"
}
```

> **Warning:** Ek project mein ya to CJS use karo ya ESM. Dono mix karna mushkil ho sakta hai beginners ke liye!

---

## Custom Module Banana — Apni Library

### Step 1: Module File Banao

```javascript
// kisan-utils.js — Kisan ke liye utility functions
// Ye hamara custom module hai

function calculateProfit(totalSale, totalCost) {
    // Profit calculate karo
    const profit = totalSale - totalCost;
    const profitPercent = ((profit / totalCost) * 100).toFixed(2);
    return {
        profit,
        profitPercent: profitPercent + "%",
        isProfit: profit > 0
    };
}

function formatCurrency(amount) {
    // Indian format mein paisa dikhao
    return "₹" + amount.toLocaleString("en-IN");
}

function getSeasonCrop(month) {
    // Mahine ke hisaab se crop suggest karo
    if (month >= 6 && month <= 9) return "Kharif (Rice, Cotton, Soybean)";
    if (month >= 10 || month <= 2) return "Rabi (Wheat, Mustard, Chana)";
    return "Zaid (Watermelon, Cucumber, Moong)";
}

// Module export karo — dusri files mein use ke liye
module.exports = {
    calculateProfit,
    formatCurrency,
    getSeasonCrop
};
```

### Step 2: Module Use Karo

```javascript
// app.js — Main file jo module use karegi
const { calculateProfit, formatCurrency, getSeasonCrop } = require("./kisan-utils");

// Profit check karo
const result = calculateProfit(50000, 35000);
console.log("Profit:", formatCurrency(result.profit));
console.log("Profit %:", result.profitPercent);
console.log("Fayda hua?", result.isProfit ? "Haan!" : "Nahi 😢");

// Season crop
const currentMonth = new Date().getMonth() + 1;  // 0-indexed isliye +1
console.log(`\nApril mein crop: ${getSeasonCrop(4)}`);
console.log(`August mein crop: ${getSeasonCrop(8)}`);
console.log(`December mein crop: ${getSeasonCrop(12)}`);
```

> **Yaad Rakho:** `require("./kisan-utils")` mein `./` lagana zaroori hai local files ke liye. Bina `./` ke Node soochega ki ye core module ya npm package hai.

---

## __dirname Aur __filename

### Ye Kya Hain?

```javascript
// location-demo.js
console.log("File ka poora path:", __filename);
// Output: C:\Users\user\project\location-demo.js

console.log("Folder ka path:", __dirname);
// Output: C:\Users\user\project
```

| Variable | Kya Deta Hai |
|----------|-------------|
| `__filename` | Current file ka full path |
| `__dirname` | Current file ki directory ka path |

> **Yaad Rakho:** Ye dono sirf CommonJS mein available hain. ESM mein alternative use karna padta hai (`import.meta.url`).

---

## Path Module — File Paths Ko Smart Handle Karo

### Kyon Zaroori Hai?

Windows mein path: `C:\Users\file.txt` (backslash)
Linux/Mac mein: `/home/user/file.txt` (forward slash)

`path` module automatically sahi separator use karta hai — cross-platform code ke liye zaroori hai!

```javascript
// path-demo.js
const path = require("path");

// path.join() — safely paths jodo
const filePath = path.join(__dirname, "data", "students.json");
console.log("Joined Path:", filePath);
// Windows: C:\Users\...\data\students.json
// Linux:   /home/.../data/students.json

// path.basename() — sirf filename nikalo
console.log("Filename:", path.basename("/home/user/report.pdf"));
// Output: report.pdf

// path.extname() — extension nikalo
console.log("Extension:", path.extname("photo.jpg"));
// Output: .jpg

// path.dirname() — parent directory nikalo
console.log("Directory:", path.dirname("/home/user/docs/file.txt"));
// Output: /home/user/docs

// path.resolve() — absolute path banao
console.log("Resolved:", path.resolve("data", "file.txt"));
// Output: C:\Users\...\data\file.txt (full absolute path)

// path.parse() — path ko tukdon mein todo
const parsed = path.parse("/home/user/docs/report.pdf");
console.log("Parsed:", parsed);
// Output: { root: '/', dir: '/home/user/docs', base: 'report.pdf', ext: '.pdf', name: 'report' }
```

> **Tip:** Hamesha `path.join()` use karo strings ko manually `+` se jodne ki jagah. Ye cross-platform bugs se bachata hai!

---

## fs Module — Files Read/Write Karo

### fs Module Load Karo

```javascript
const fs = require("fs");
```

### 1. readFile — File Padhna (Async)

```javascript
// read-demo.js
const fs = require("fs");
const path = require("path");

// Pehle ek sample file banao manually: data.txt
// Content: "Namaste Duniya! Ye meri pehli file hai."

const filePath = path.join(__dirname, "data.txt");

// Async read (non-blocking — recommended)
fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
        console.error("File read mein error:", err.message);
        return;
    }
    console.log("File Content:");
    console.log(data);
});

console.log("Ye pehle print hoga — async hai!");
```

> **Yaad Rakho:** `"utf8"` dena zaroori hai, warna raw Buffer milega (binary data). `utf8` batata hai ki "text format mein padho".

### 2. readFileSync — Synchronous Read

```javascript
// Sync read (blocking — program ruk jaata hai jab tak file padh na le)
try {
    const data = fs.readFileSync(filePath, "utf8");
    console.log("Sync read:", data);
} catch (err) {
    console.error("Error:", err.message);
}
```

> **Warning:** Production code mein `readFileSync` avoid karo — ye blocking hai, server slow ho jayega. Development/scripts mein theek hai.

### 3. writeFile — File Likhna

```javascript
// write-demo.js
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "output.txt");

const content = `Kisan Report
Date: ${new Date().toLocaleDateString()}
====================
Crop: Tomato
Weight: 500 kg
Price: ₹40/kg
Total: ₹20,000
`;

// File likho (agar file hai to overwrite, nahi hai to create)
fs.writeFile(outputPath, content, "utf8", (err) => {
    if (err) {
        console.error("Write error:", err.message);
        return;
    }
    console.log("File successfully likhi gayi:", outputPath);
});
```

> **Warning:** `writeFile` purani content **OVERWRITE** kar deta hai! Agar add karna ho to `appendFile` use karo.

### 4. appendFile — File Mein Add Karna

```javascript
// append-demo.js
const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "app.log");

function addLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    fs.appendFile(logPath, logEntry, "utf8", (err) => {
        if (err) {
            console.error("Log write failed:", err.message);
            return;
        }
        console.log("Log added:", message);
    });
}

// Multiple logs add karo
addLog("Server started");
addLog("User Ramesh logged in");
addLog("Data fetched from database");
```

> **Socho Aise:** `writeFile` aise hai jaise whiteboard pehle saaf karo fir likho. `appendFile` aise hai jaise whiteboard pe neeche aur likho — jo pehle se hai wo rahega!

### 5. File Exist Check + Delete

```javascript
const fs = require("fs");

// Check if file exists
if (fs.existsSync("temp.txt")) {
    console.log("File hai!");

    // Delete karo
    fs.unlinkSync("temp.txt");
    console.log("File delete ho gayi!");
} else {
    console.log("File nahi hai!");
}
```

### 6. Directory Operations

```javascript
const fs = require("fs");
const path = require("path");

// Naya folder banao
const dirPath = path.join(__dirname, "reports");

if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    console.log("Folder bana diya:", dirPath);
}

// Folder ke andar files dekho
const files = fs.readdirSync(__dirname);
console.log("\nIs folder mein ye files hain:");
files.forEach(file => {
    console.log(`  📄 ${file}`);
});
```

---

## Quick Revision Table

| Concept | Key Point |
|---------|-----------|
| **require()** | CommonJS mein module import karo |
| **module.exports** | CommonJS mein module export karo |
| **import/export** | ES Modules ka modern syntax |
| **__dirname** | Current file ki directory ka path |
| **__filename** | Current file ka full path |
| **path.join()** | Paths ko safely jodo (cross-platform) |
| **fs.readFile()** | Async file read (non-blocking) |
| **fs.writeFile()** | File likho (overwrite hogi) |
| **fs.appendFile()** | File mein content add karo |
| **fs.existsSync()** | Check karo file/folder hai ya nahi |
| **fs.mkdirSync()** | Naya folder banao |
| **fs.readdirSync()** | Folder ke contents dekho |

---

## Aaj Kya Seekha?

1. **Modules** se code ko organized files mein todh sakte ho
2. **CommonJS** — `require/module.exports` — Node.js ka default system
3. **ES Modules** — `import/export` — modern JavaScript ka tarika
4. **Custom modules** banake apni libraries create kar sakte ho
5. **path module** se cross-platform file paths handle karo
6. **fs module** se files read, write, append, delete sab kar sakte ho
7. **Async vs Sync** — async (callback) production mein better, sync scripts mein okay

> **Tip:** Evening mein hum ek file reader/writer tool aur logging module banayenge. Abhi ek baar `fs.readFile` aur `fs.writeFile` khud try karo!
