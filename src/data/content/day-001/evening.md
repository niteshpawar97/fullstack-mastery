# Day 1 Evening: Pehla JS Program + Git Init + Terminal Practice

> **Practice Time!** Aaj morning mein jo seekha — variables, data types, console.log — ab usse haathon se karo!

---

## Setup: Apna Pehla Project Folder

> **Terminal Command:**
> ```bash
> mkdir fullstack-day1
> cd fullstack-day1
> code .
> ```

VS Code mein ek naya file banao: `practice.js`

---

## Task 1: Variables & Data Types Practice

### Problem Statement

Ek "Farmer Profile" banao using JavaScript variables. Kisan ki poori information store karo aur print karo.

### Steps

1. VS Code mein `practice.js` file kholo
2. Neeche ka code likho (khud type karo, copy-paste mat karo!)
3. Terminal mein run karo: `node practice.js`

### Solution

```javascript
// Kisan Profile
const kisanNaam = "Ramesh Patil";
const gaon = "Nashik";
let umar = 45;
const khetArea = 5.5;        // acres mein
const isOrganic = true;
let currentCrop = "Tomato";
const phoneNumber = "9876543210";

// Profile print karo
console.log("===== KISAN PROFILE =====");
console.log(`Naam: ${kisanNaam}`);
console.log(`Gaon: ${gaon}`);
console.log(`Umar: ${umar} saal`);
console.log(`Khet: ${khetArea} acres`);
console.log(`Organic Farming: ${isOrganic}`);
console.log(`Current Crop: ${currentCrop}`);
console.log(`Phone: ${phoneNumber}`);
console.log("========================");

// Value change karo (let wale variables)
umar = 46;  // birthday ho gaya!
currentCrop = "Onion";  // crop change ki

console.log("\n--- Updated Info ---");
console.log(`Nayi Umar: ${umar}`);
console.log(`Nayi Crop: ${currentCrop}`);

// Ye error dega — const change nahi hota!
// gaon = "Pune";  // ❌ TypeError: Assignment to constant variable
```

> **Expected Output:**
> ```
> ===== KISAN PROFILE =====
> Naam: Ramesh Patil
> Gaon: Nashik
> Umar: 45 saal
> Khet: 5.5 acres
> Organic Farming: true
> Current Crop: Tomato
> Phone: 9876543210
> ========================
> 
> --- Updated Info ---
> Nayi Umar: 46
> Nayi Crop: Onion
> ```

---

## Task 2: typeof Practice

Ek naya file banao: `types.js`

```javascript
// Alag-alag values ka type check karo
const values = [
  "Hello",
  42,
  3.14,
  true,
  undefined,
  null,
  "100",   // ye string hai, number nahi!
];

console.log("=== Type Checking ===");
values.forEach((val, index) => {
  console.log(`Value: ${val} --> Type: ${typeof val}`);
});

// Interesting cases
console.log("\n=== Tricky Cases ===");
console.log(`"5" + 3 = ${"5" + 3}`);       // "53" (string concatenation!)
console.log(`"5" - 3 = ${"5" - 3}`);       // 2 (number subtraction!)
console.log(`true + 1 = ${true + 1}`);     // 2 (true = 1)
console.log(`false + 1 = ${false + 1}`);   // 1 (false = 0)
```

> **Yaad Rakho:** JavaScript mein `+` operator ke saath string ho to concatenation hota hai. Ye bahut common bug ka reason hai!

---

## Task 3: Git Initialize

Ab apne project ko Git se track karo.

```bash
# Project folder mein jao (already hona chahiye)
cd fullstack-day1

# Git initialize karo
git init

# Status check karo
git status

# Files add karo
git add .

# Pehla commit karo
git commit -m "Day 1: JavaScript basics - variables and data types"

# Log dekho
git log --oneline
```

> **Tip:** Har din ka kaam commit karo. Ye tumhari coding diary hai!

### Git Samjho

| Command | Kya Karta Hai |
|---------|--------------|
| `git init` | Naya Git repo start karta hai |
| `git status` | Kya change hua ye batata hai |
| `git add .` | Saari files ko stage karta hai |
| `git commit -m "..."` | Changes save karta hai with message |
| `git log` | History dikhata hai |

> **Socho Aise:** Git ek time machine hai. Agar tumne galti se code bigaad diya, to Git se purane version pe wapas ja sakte ho!

---

## Mini Challenge: Calculator

Ek file banao `calculator.js`:

```javascript
// Simple Calculator
const num1 = 10;
const num2 = 3;

console.log("=== Simple Calculator ===");
console.log(`${num1} + ${num2} = ${num1 + num2}`);
console.log(`${num1} - ${num2} = ${num1 - num2}`);
console.log(`${num1} × ${num2} = ${num1 * num2}`);
console.log(`${num1} ÷ ${num2} = ${num1 / num2}`);
console.log(`${num1} % ${num2} = ${num1 % num2}`);  // remainder
console.log(`${num1} ** ${num2} = ${num1 ** num2}`); // power
```

### Extra Challenge (Try Yourself!)

- User se input lena seekho (hint: `process.argv` ya `readline` module)
- Temperature converter banao (Celsius to Fahrenheit)
- BMI calculator banao

---

## Homework

1. **3 alag profiles banao** — Student, Teacher, Doctor — with proper variables
2. **typeof experiment** — 10 alag values ke type check karo
3. **Git commit** karo saara kaam finish hone pe

> **Warning:** Copy-paste mat karo! Khud type karo — muscle memory banti hai. Pehle slow chalega, baad mein fast ho jaoge.

---

## Aaj Ka Summary

- ✅ Pehla JS program likha aur run kiya
- ✅ Variables practice ki (let, const)
- ✅ Data types samjhe aur typeof use kiya
- ✅ Git init kiya aur pehla commit kiya
- ✅ Terminal commands practice kiye
