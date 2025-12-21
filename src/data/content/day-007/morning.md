# Day 7 Morning: Week 1 Revision — JavaScript Foundations

> **Aaj ka plan:** Aaj REVISION DAY hai! Poore hafte ka JavaScript seekha — variables, types, operators, conditions, arrays, loops, functions, objects — sab ek jagah revise karenge. Common mistakes review karenge. Aaj ka goal: foundation pakka karo!

---

## Week 1 Ka Roadmap Recap

| Day | Topic | Key Concepts |
|-----|-------|-------------|
| Day 1 | Setup + Basics | Node.js, VS Code, Git, console.log |
| Day 2 | Variables & Operators | let/const/var, data types, operators, conditions |
| Day 3 | Arrays & Loops | Arrays, push/pop, for/forEach, map/filter/reduce |
| Day 4 | Functions & Scope | Declaration, arrow, default params, scope, hoisting |
| Day 5 | Objects & JSON | Objects, methods, this, destructuring, JSON |
| Day 6 | DOM + Git Branch | querySelector, events, createElement, git branch/merge |

---

## Revision 1: Variables & Data Types

```javascript
// ===== let vs const vs var =====

// const — value change nahi hogi (use by default)
const APP_NAME = "Kisan App";
const PI = 3.14;
// APP_NAME = "New Name";  // ERROR! Assignment to constant

// let — value change ho sakti hai
let score = 0;
score = 100;  // OK

// var — purana, avoid karo (function scope, hoisting issues)
var oldWay = "Don't use me";

// ===== Data Types =====

// Primitive types
const name = "Ramesh";        // String
const age = 35;               // Number
const price = 99.99;          // Number (JS mein int/float same hai)
const isActive = true;        // Boolean
const nothing = null;         // Null (intentionally empty)
let unknown;                  // Undefined (value nahi di)
const id = Symbol("id");     // Symbol (unique identifier)
const bigNum = 9007199254740991n; // BigInt

// Reference types
const arr = [1, 2, 3];       // Array (object hai internally)
const obj = { a: 1 };        // Object
const fn = () => {};          // Function (object hai internally)

// typeof check
console.log(typeof name);      // "string"
console.log(typeof age);       // "number"
console.log(typeof isActive);  // "boolean"
console.log(typeof null);      // "object" — JS ka famous bug!
console.log(typeof undefined); // "undefined"
console.log(typeof arr);       // "object"
console.log(Array.isArray(arr)); // true — array check ka sahi tarika
```

> **Yaad Rakho:** `typeof null === "object"` — ye JavaScript ka purana bug hai jo fix nahi ho sakta. Array check ke liye `Array.isArray()` use karo.

---

## Revision 2: Operators & Conditions

```javascript
// ===== Comparison =====
console.log(5 == "5");    // true — loose equality (type convert karta hai)
console.log(5 === "5");   // false — strict equality (type bhi match karo!)
console.log(5 !== "5");   // true

// HAMESHA === use karo, == mat use karo!

// ===== Logical Operators =====
const hasLand = true;
const hasWater = false;

console.log(hasLand && hasWater);  // false (AND — dono true chahiye)
console.log(hasLand || hasWater);  // true (OR — ek bhi true)
console.log(!hasWater);            // true (NOT — ulta karo)

// ===== Ternary Operator =====
const temp = 42;
const weather = temp > 40 ? "Bahut garmi hai!" : "Theek hai";

// ===== if-else =====
const marks = 75;

if (marks >= 90) {
  console.log("A+ Grade");
} else if (marks >= 80) {
  console.log("A Grade");
} else if (marks >= 70) {
  console.log("B Grade");
} else {
  console.log("Below B");
}

// ===== switch =====
const day = "Monday";

switch (day) {
  case "Monday":
  case "Tuesday":
  case "Wednesday":
  case "Thursday":
  case "Friday":
    console.log("Working day");
    break;
  case "Saturday":
  case "Sunday":
    console.log("Weekend!");
    break;
  default:
    console.log("Invalid day");
}
```

---

## Revision 3: Arrays & Loops

```javascript
// ===== Array CRUD =====
const crops = ["Wheat", "Rice"];
crops.push("Cotton");         // Add end: ["Wheat", "Rice", "Cotton"]
crops.unshift("Soybean");     // Add start: ["Soybean", "Wheat", "Rice", "Cotton"]
crops.pop();                  // Remove end: ["Soybean", "Wheat", "Rice"]
crops.shift();                // Remove start: ["Wheat", "Rice"]
crops.splice(1, 0, "Bajra"); // Insert at 1: ["Wheat", "Bajra", "Rice"]

// ===== Loops =====

// for loop
for (let i = 0; i < crops.length; i++) {
  console.log(`${i}: ${crops[i]}`);
}

// for...of (modern — best for arrays)
for (const crop of crops) {
  console.log(crop);
}

// forEach (callback style)
crops.forEach((crop, i) => console.log(`${i + 1}. ${crop}`));

// ===== map, filter, reduce =====
const prices = [100, 200, 150, 300, 50];

// map — transform (same length output)
const discounted = prices.map(p => p * 0.9);  // 10% off

// filter — chhaan (shorter output)
const expensive = prices.filter(p => p > 150);  // [200, 300]

// reduce — compress (single value output)
const total = prices.reduce((sum, p) => sum + p, 0);  // 800

// Chain karo — ek ke baad ek
const result = prices
  .filter(p => p > 100)       // [200, 150, 300]
  .map(p => p * 0.9)          // [180, 135, 270]
  .reduce((s, p) => s + p, 0); // 585
```

---

## Revision 4: Functions

```javascript
// ===== Declaration vs Expression vs Arrow =====

// Declaration — hoisted
function greet(name) {
  return `Hello, ${name}!`;
}

// Expression — not hoisted
const farewell = function(name) {
  return `Bye, ${name}!`;
};

// Arrow — short syntax
const double = (n) => n * 2;
const multiply = (a, b) => a * b;

// ===== Default Parameters =====
function createOrder(item, qty = 1, price = 100) {
  return { item, qty, price, total: qty * price };
}

console.log(createOrder("Wheat"));          // qty=1, price=100
console.log(createOrder("Rice", 5));        // qty=5, price=100
console.log(createOrder("Cotton", 3, 200)); // qty=3, price=200

// ===== Scope Recap =====
const global = "Global";

function outer() {
  const outerVar = "Outer";
  
  function inner() {
    const innerVar = "Inner";
    console.log(global, outerVar, innerVar);  // Sab accessible
  }
  
  inner();
  // console.log(innerVar);  // ERROR — inner ke bahar nahi
}
```

---

## Revision 5: Objects & JSON

```javascript
// ===== Object =====
const kisan = {
  name: "Ramesh",
  village: "Kheda",
  crops: ["Wheat", "Rice"],
  
  introduce() {
    return `Main ${this.name} hoon, ${this.village} se`;
  }
};

// Access
console.log(kisan.name);           // Dot notation
console.log(kisan["village"]);     // Bracket notation
console.log(kisan.introduce());    // Method call

// ===== Destructuring =====
const { name, village, crops } = kisan;

// ===== Spread =====
const updatedKisan = { ...kisan, phone: "9999999999" };

// ===== Object methods =====
Object.keys(kisan);     // ["name", "village", "crops", "introduce"]
Object.values(kisan);   // ["Ramesh", "Kheda", [...], fn]
Object.entries(kisan);  // [["name","Ramesh"], ...]

// ===== JSON =====
const json = JSON.stringify(kisan, null, 2);  // Object -> String
const parsed = JSON.parse('{"a":1}');         // String -> Object
```

---

## Common Mistakes Review

### Mistake 1: == vs ===

```javascript
// GALAT
if (userInput == 0) { }   // "" == 0 bhi true ho jayega!

// SAHI
if (userInput === 0) { }  // Strict check — type bhi match hoga
```

### Mistake 2: Array ka reference copy

```javascript
// GALAT — dono same array point karte hain
const original = [1, 2, 3];
const copy = original;
copy.push(4);
console.log(original);  // [1, 2, 3, 4] — original bhi badal gaya!

// SAHI — spread se naya array
const safeCopy = [...original];
safeCopy.push(5);
console.log(original);  // [1, 2, 3, 4] — safe!
```

### Mistake 3: Arrow function mein this

```javascript
// GALAT — arrow function mein this kaam nahi karega
const obj = {
  name: "Test",
  getName: () => this.name  // undefined!
};

// SAHI — regular function use karo
const obj2 = {
  name: "Test",
  getName() { return this.name; }  // "Test"
};
```

### Mistake 4: forEach return kuch nahi karta

```javascript
// GALAT — forEach se naya array nahi banta
const doubled = [1, 2, 3].forEach(n => n * 2);
console.log(doubled);  // undefined!

// SAHI — map use karo
const doubled2 = [1, 2, 3].map(n => n * 2);
console.log(doubled2);  // [2, 4, 6]
```

### Mistake 5: const object mutable hai

```javascript
const user = { name: "Amit" };
user.name = "Vikram";  // YE KAAM KAREGA!
// const sirf reassignment rokta hai, mutation nahi
// user = {};  // ERROR — ye nahi hoga
```

---

## Git Commands Cheatsheet

```bash
# Setup
git init                    # Repo initialize
git config --list           # Config dekho

# Daily workflow
git status                  # Kya badla hai?
git add .                   # Sab stage karo
git add file.js             # Specific file stage
git commit -m "message"     # Commit karo
git log --oneline           # History dekho

# Branching
git branch                  # Branches dekho
git checkout -b name        # Nayi branch banao + switch
git checkout main           # Main pe jao
git merge branch-name       # Merge karo
git branch -d branch-name   # Branch delete

# Undo
git restore file.js         # Unstaged changes hatao
git restore --staged file.js # Staged se unstage karo
```

---

## Quick Revision Table

| Category | Key Concepts |
|----------|-------------|
| Variables | `const` (default), `let` (change), avoid `var` |
| Types | string, number, boolean, null, undefined, object, array |
| Comparison | Hamesha `===` use karo, `==` avoid |
| Arrays | push/pop/map/filter/reduce — ye 5 yaad karo |
| Loops | `for...of` arrays ke liye, `for...in` objects ke liye |
| Functions | Arrow for short, declaration for methods |
| Scope | Block (`let/const`) > Function (`var`) > Global |
| Objects | `{ key: value }`, destructure karo, spread karo |
| JSON | `stringify` = send, `parse` = receive |
| Git | `init, add, commit, branch, merge` — daily commands |

---

## Aaj Kya Seekha?

- Poore Week 1 ka complete revision kiya
- Variables, types, operators, conditions recap
- Arrays, loops, map/filter/reduce recap
- Functions, scope, hoisting recap
- Objects, JSON, destructuring recap
- Common mistakes identify kiye — ab ye galtiyan nahi hongi!
- Git commands cheatsheet ready
