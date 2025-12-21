# Day 1 Morning: JavaScript Introduction & Dev Environment Setup

> **Aaj ka plan:** Aaj hum apna development environment setup karenge aur JavaScript ki duniya mein pehla kadam rakhenge. Samjhenge ki JavaScript kya hai, kahan use hota hai, aur basic syntax kaise likhte hain.

---

## JavaScript Kya Hai?

### Duniya Ki Sabse Popular Language

JavaScript ek programming language hai jo originally browsers ke liye bani thi — lekin aaj ye har jagah use hoti hai: websites, mobile apps, servers, IoT devices, sab mein!

> **Socho Aise:** Socho ek kisan hai jo apne khet ki monitoring ke liye app use karta hai. Wo app ka frontend (jo dikhta hai) — JavaScript se bana hai. Backend (jo data process karta hai) — wo bhi JavaScript (Node.js) se ban sakta hai. Matlab ek hi language se poora system ban sakta hai!

### JavaScript Ka History (Short)

| Year | Kya Hua |
|------|---------|
| 1995 | Brendan Eich ne 10 din mein banaya (Netscape ke liye) |
| 2009 | Node.js aaya — JavaScript ab server pe bhi chal sakta hai |
| 2015 | ES6 aaya — Modern JavaScript ka start |
| 2024+ | JavaScript har jagah — Web, Mobile, IoT, AI |

> **Yaad Rakho:** JavaScript aur Java bilkul alag languages hain! Naam milta-julta hai lekin koi relation nahi hai. Jaise Pineapple aur Apple ka koi relation nahi hai.

---

## Dev Environment Setup

### Step 1: Node.js Install Karo

Node.js ek runtime hai jo JavaScript ko browser ke bahar run karne deta hai.

1. Jao [nodejs.org](https://nodejs.org) pe
2. **LTS version** download karo (stable hota hai)
3. Install karo (Next-Next-Finish)
4. Verify karo terminal mein:

```bash
node --version
# v20.x.x ya isse upar dikhna chahiye

npm --version
# 10.x.x ya isse upar dikhna chahiye
```

> **Tip:** Hamesha LTS (Long Term Support) version install karo. Latest version mein bugs ho sakte hain.

### Step 2: VS Code Install Karo

Visual Studio Code — developers ka favourite editor.

1. Download from [code.visualstudio.com](https://code.visualstudio.com)
2. Install karo
3. Ye extensions install karo:
   - **ESLint** — code mistakes pakadta hai
   - **Prettier** — code ko sundar banata hai
   - **JavaScript (ES6) code snippets** — fast typing ke liye

### Step 3: Terminal Basics

Terminal/Command Line — developer ka sabse powerful tool hai.

```bash
# Current directory dekhna
pwd

# Folder mein kya hai dekhna
ls

# Naya folder banana
mkdir my-project

# Folder mein jaana
cd my-project

# Wapas aana
cd ..
```

> **Yaad Rakho:** Terminal se daro mat! Ye tumhara best friend hai. Jo kaam mouse se 10 click mein hota hai, terminal se 1 command mein hota hai.

---

## JavaScript Basics: Variables

### Variable Kya Hai?

Variable ek dabba (container) hai jisme hum data rakhte hain.

```javascript
// Purana tarika (avoid karo)
var naam = "Ramesh";

// Modern tarika ✅
let umar = 25;          // badal sakta hai
const gaon = "Nashik";  // badal nahi sakta (constant)
```

> **Socho Aise:** `let` ek kutchi mitti ka ghada hai — reshape kar sakte ho. `const` ek pathar ka ghada hai — ek baar shape diya, bas!

### let vs const vs var

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| Re-assign | ✅ | ✅ | ❌ |
| Block scope | ❌ | ✅ | ✅ |
| Modern? | ❌ (purana) | ✅ | ✅ |
| Use kab? | Never | Jab value change ho | Default choice |

> **Tip:** Rule: Pehle `const` use karo. Agar baad mein change karna pade to `let` use karo. `var` kabhi mat use karo!

---

## Data Types in JavaScript

JavaScript mein 7 basic data types hain:

```javascript
// 1. String — text
const naam = "Kisan Ramesh";

// 2. Number — number (integer ya decimal)
const umar = 45;
const temperature = 36.5;

// 3. Boolean — true ya false
const isKisan = true;

// 4. Undefined — value assign nahi ki
let khet;
console.log(khet); // undefined

// 5. Null — intentionally empty
const loan = null;  // abhi koi loan nahi hai

// 6. BigInt — bahut bada number
const aadhar = 123456789012345678n;

// 7. Symbol — unique identifier (advanced, baad mein)
```

### typeof Operator

```javascript
console.log(typeof "Hello");    // "string"
console.log(typeof 42);         // "number"
console.log(typeof true);       // "boolean"
console.log(typeof undefined);  // "undefined"
console.log(typeof null);       // "object" ⚠️ (ye JS ka purana bug hai!)
```

> **Warning:** `typeof null` returns `"object"` — ye JavaScript ka ek famous bug hai jo 1995 se hai! Isko fix nahi kiya kyunki bahut saara purana code break ho jaata.

---

## console.log() — Tumhara Pehla Tool

```javascript
// Simple output
console.log("Namaste Duniya!");

// Variable ke saath
const kisanNaam = "Ramesh";
console.log("Kisan ka naam:", kisanNaam);

// Template Literal (modern way) ✅
console.log(`Kisan ka naam: ${kisanNaam}`);
```

> **Yaad Rakho:** `console.log()` tumhara debugging ka sabse pehla aur sabse important tool hai. Jab bhi kuch samajh na aaye, `console.log()` karo!

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| JavaScript | Har jagah chalne wali programming language |
| Node.js | JavaScript ko browser ke bahar run karne ka tool |
| VS Code | Code editor — developer ka workspace |
| `let` | Variable jo change ho sakta hai |
| `const` | Variable jo change nahi hota (default use karo) |
| `var` | Purana tarika — kabhi use mat karo |
| `console.log()` | Screen pe output dikhane ka tarika |

---

## Aaj Kya Seekha?

- JavaScript kya hai aur kyun important hai
- Dev environment setup (Node.js + VS Code + Terminal)
- Variables: `let`, `const`, `var` ka difference
- 7 data types in JavaScript
- `console.log()` se output kaise nikaalte hain
