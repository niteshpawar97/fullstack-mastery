# Day 26 Morning: Event Loop & Async Patterns in JavaScript

> **Aaj ka plan:** Aaj hum JavaScript ka sabse important aur confusing topic samjhenge — Event Loop! Call stack, Web APIs, callback queue, microtask queue — sab clear hoga. Ye samajhna zaroori hai kyunki Node.js ka poora architecture isi pe based hai.

---

## JavaScript Single-Threaded Hai

### Ek Hi Haath Se Sab Kaam

JavaScript mein sirf **ek thread** hai — matlab ek time pe sirf ek kaam ho sakta hai. Phir bhi hum async operations (API calls, file reading, timers) kaise handle karte hain? Jawab hai — **Event Loop**.

> **Socho Aise:** Socho ek kisan hai jo akela khet mein kaam karta hai (single thread). Wo paani ke liye motor ON karta hai (async task), phir waapas aake beeej bona shuru karta hai. Jab motor ka kaam ho jaata hai, toh wo jaake check karta hai. Wo ek kaam chhod ke wait nahi karta — ye hi event loop hai!

---

## Event Loop Ka Architecture

### Components Samjho

```
┌──────────────────────────────────┐
│         CALL STACK               │  ← Yahan code execute hota hai
│    (Ek time pe ek function)      │     (LIFO — Last In First Out)
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│         WEB APIs / Node APIs     │  ← setTimeout, fetch, fs.readFile
│    (Browser ya Node handle       │     yahan jaate hain
│     karta hai — alag thread)     │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│   MICROTASK QUEUE (Priority!)    │  ← Promises (.then), queueMicrotask
│   (Pehle ye chalte hain)         │     process.nextTick (Node.js)
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│   MACROTASK / CALLBACK QUEUE     │  ← setTimeout, setInterval, I/O
│   (Baad mein ye chalte hain)     │     callbacks
└──────────────────────────────────┘
```

> **Yaad Rakho:** Event Loop ka kaam hai — call stack khali hone ka wait karo, phir pehle microtask queue se sab kaam lo, uske baad macrotask queue se ek kaam lo. Ye cycle repeat hoti hai!

---

## Call Stack Deep Dive

Call stack ek stack data structure hai — jahan functions LIFO order mein execute hote hain.

```javascript
function multiply(a, b) {
  return a * b;       // Step 3: Ye execute hota hai, return hota hai
}

function square(n) {
  return multiply(n, n); // Step 2: multiply call hota hai
}

function printSquare(n) {
  const result = square(n); // Step 1: square call hota hai
  console.log(result);      // Step 4: result print hota hai
}

printSquare(5);            // Step 0: Ye call stack mein jaata hai

// Call stack ka flow:
// 1. printSquare(5)     → stack mein push
// 2. square(5)          → stack mein push
// 3. multiply(5, 5)     → stack mein push
// 4. multiply return 25 → stack se pop
// 5. square return 25   → stack se pop
// 6. console.log(25)    → stack mein push, execute, pop
// 7. printSquare done   → stack se pop
// Stack KHALI!
```

> **Warning:** Agar call stack kabhi khali nahi hota (infinite recursion), toh **Stack Overflow** error aata hai!

```javascript
// Stack Overflow example — KABHI MAT KARO!
function infinite() {
  infinite(); // apne aap ko call karta raha
}
// infinite(); // RangeError: Maximum call stack size exceeded
```

---

## Web APIs aur Async Operations

Jab async kaam aata hai, JavaScript use browser/Node ke Web APIs ko de deta hai.

```javascript
console.log("1. Pehle main"); // Turant call stack mein jaata hai

setTimeout(() => {
  console.log("2. Timer wala"); // 2 sec baad callback queue mein jaayega
}, 2000);

console.log("3. Baad mein main"); // Ye bhi turant chalega

// Output:
// 1. Pehle main
// 3. Baad mein main
// 2. Timer wala (2 sec baad)
```

### Kya Hua Step by Step?

1. `console.log("1...")` → Call stack → Execute → Pop
2. `setTimeout(callback, 2000)` → Call stack → Web API ko de diya → Pop
3. `console.log("3...")` → Call stack → Execute → Pop
4. **Stack ab khali hai!**
5. 2 seconds baad, Web API callback ko **Callback Queue** mein daalti hai
6. Event Loop dekhta hai — stack khali hai? Haan! Callback ko stack mein daalo
7. Callback execute hota hai → `console.log("2...")`

> **Yaad Rakho:** `setTimeout(fn, 0)` bhi turant nahi chalta! Wo pehle Web API jaata hai, phir callback queue, phir event loop use stack mein daalti hai — tab tak synchronous code chal chuka hota hai.

```javascript
console.log("A");
setTimeout(() => console.log("B"), 0); // 0ms ka timer bhi!
console.log("C");

// Output: A, C, B (B last mein aayega!)
```

---

## Microtask Queue vs Macrotask Queue

### Priority System

**Microtask Queue** ko **higher priority** milti hai. Har macrotask ke baad, saari microtasks pehle process hoti hain.

```javascript
console.log("1. Start");

// Macrotask — callback queue mein jaayega
setTimeout(() => {
  console.log("2. setTimeout (Macrotask)");
}, 0);

// Microtask — microtask queue mein jaayega
Promise.resolve().then(() => {
  console.log("3. Promise (Microtask)");
});

// Ek aur microtask
queueMicrotask(() => {
  console.log("4. queueMicrotask (Microtask)");
});

console.log("5. End");

// Output:
// 1. Start
// 5. End
// 3. Promise (Microtask)       ← Microtask pehle!
// 4. queueMicrotask (Microtask) ← Ye bhi pehle!
// 2. setTimeout (Macrotask)     ← Macrotask last mein!
```

### Microtasks vs Macrotasks Table

| Microtasks (HIGH Priority) | Macrotasks (LOW Priority) |
|---------------------------|--------------------------|
| Promise `.then()/.catch()/.finally()` | `setTimeout()` |
| `queueMicrotask()` | `setInterval()` |
| `process.nextTick()` (Node.js) | `setImmediate()` (Node.js) |
| `MutationObserver` (Browser) | I/O operations |

> **Socho Aise:** Microtask = VIP queue (pehle entry). Macrotask = normal queue. Event Loop hamesha pehle VIP queue khaali karta hai!

---

## Node.js Specific: process.nextTick vs setImmediate

```javascript
// Node.js mein special patterns

console.log("1. Start");

// setImmediate — current I/O cycle ke baad chalta hai
setImmediate(() => {
  console.log("2. setImmediate");
});

// setTimeout 0 — minimum delay ke baad
setTimeout(() => {
  console.log("3. setTimeout 0");
}, 0);

// process.nextTick — sabse pehle chalta hai (microtask se bhi pehle!)
process.nextTick(() => {
  console.log("4. process.nextTick");
});

// Promise — microtask
Promise.resolve().then(() => {
  console.log("5. Promise");
});

console.log("6. End");

// Output (Node.js):
// 1. Start
// 6. End
// 4. process.nextTick    ← SABSE pehle (highest priority)
// 5. Promise             ← Microtask
// 3. setTimeout 0        ← Macrotask
// 2. setImmediate        ← Macrotask (I/O cycle ke baad)
```

> **Yaad Rakho:** Priority order: **Synchronous code** > **process.nextTick** > **Promises (Microtasks)** > **setTimeout/setInterval (Macrotasks)** > **setImmediate**

> **Warning:** `process.nextTick` zyada use mat karo — agar recursively call kiya toh event loop block ho sakti hai aur I/O operations starve ho jayenge!

---

## Complex Event Loop Example

```javascript
console.log("Script start");

setTimeout(() => {
  console.log("setTimeout 1");
  Promise.resolve().then(() => {
    console.log("Promise inside setTimeout");
  });
}, 0);

Promise.resolve().then(() => {
  console.log("Promise 1");
}).then(() => {
  console.log("Promise 2");
});

setTimeout(() => {
  console.log("setTimeout 2");
}, 0);

console.log("Script end");

// Output:
// Script start           ← Sync
// Script end             ← Sync
// Promise 1              ← Microtask
// Promise 2              ← Microtask (chained)
// setTimeout 1           ← Macrotask 1
// Promise inside setTimeout ← Microtask (macrotask ke andar bani)
// setTimeout 2           ← Macrotask 2
```

> **Tip:** Har macrotask ke baad, event loop microtask queue ko completely drain karta hai. Isliye "Promise inside setTimeout" setTimeout 2 se pehle aata hai!

---

## Async Patterns in Node.js

### Pattern 1: Callbacks (Old Way)

```javascript
const fs = require('fs');

// Callback pattern — file padhna
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.log("Error aaya:", err.message);
    return;
  }
  console.log("File ka data:", data);
});

console.log("File read ke liye wait nahi karunga!");
```

### Pattern 2: Promises (Better)

```javascript
const fsPromises = require('fs').promises;

fsPromises.readFile('data.txt', 'utf8')
  .then(data => {
    console.log("Data mila:", data);
    return fsPromises.readFile('data2.txt', 'utf8');
  })
  .then(data2 => {
    console.log("Dusra file:", data2);
  })
  .catch(err => {
    console.log("Koi error:", err.message);
  });
```

### Pattern 3: Async/Await (Best)

```javascript
const fsPromises = require('fs').promises;

async function readFiles() {
  try {
    const data1 = await fsPromises.readFile('data.txt', 'utf8');
    console.log("File 1:", data1);

    const data2 = await fsPromises.readFile('data2.txt', 'utf8');
    console.log("File 2:", data2);

    // Dono ek saath padhna ho toh Promise.all use karo
    const [file3, file4] = await Promise.all([
      fsPromises.readFile('data3.txt', 'utf8'),
      fsPromises.readFile('data4.txt', 'utf8')
    ]);
    console.log("Dono ek saath padhein:", file3, file4);

  } catch (err) {
    console.log("Error:", err.message);
  }
}

readFiles();
```

> **Tip:** `Promise.all()` use karo jab multiple async operations independent hain — sab parallel mein chalenge aur jaldi khatam honge!

---

## Quick Revision Table

| Concept | Kya Hai | Priority |
|---------|---------|----------|
| Call Stack | Jahan code execute hota hai (LIFO) | Sabse pehle |
| Web APIs | Browser/Node ke async handlers | Background mein |
| Microtask Queue | Promises, nextTick | High priority |
| Macrotask Queue | setTimeout, setInterval, I/O | Low priority |
| Event Loop | Stack khali ho → microtasks → 1 macrotask → repeat | Manager |
| process.nextTick | Node.js — sabse pehle execute hone wali microtask | Highest micro |
| setImmediate | Node.js — current I/O cycle ke baad | After I/O |

---

## Aaj Kya Seekha?

1. **JavaScript single-threaded** hai lekin async kaam kar sakta hai event loop ki wajah se
2. **Call Stack** mein synchronous code execute hota hai (LIFO order)
3. **Web APIs** async operations ko background mein handle karti hain
4. **Microtask Queue** ko hamesha **Macrotask Queue** se pehle process kiya jaata hai
5. **process.nextTick** Node.js mein sabse zyada priority wali microtask hai
6. **Async patterns**: Callbacks → Promises → Async/Await (evolution)
7. **Promise.all** parallel async operations ke liye best hai

> **Practice Time!** Evening mein hum event loop quiz exercises karenge, async flow predict karenge, aur ek simple scheduler banayenge!
