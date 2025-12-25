# Day 21 Morning: Week 3 Revision — DSA, Git, Closures, Promises

> **Aaj ka plan:** Aaj hum poore Week 3 ka revision karenge — DSA (search, sort, stack, queue), Git advanced, Closures, aur Promises. Saath mein interview-style questions bhi practice karenge. Ye REVISION DAY hai — consolidate karo sab kuch!

---

## Revision 1: DSA — Search Algorithms

### Linear Search vs Binary Search

```javascript
// Linear Search — O(n) — har element check karo
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;  // Mil gaya!
  }
  return -1;  // Nahi mila
}

// Binary Search — O(log n) — SORTED array chahiye
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;       // Mil gaya!
    else if (arr[mid] < target) left = mid + 1;  // Right mein dekho
    else right = mid - 1;                       // Left mein dekho
  }
  return -1;
}

// Test
const prices = [100, 200, 350, 500, 750, 1000, 1500];
console.log(binarySearch(prices, 500));  // 3
console.log(linearSearch(prices, 500));  // 3
```

> **Yaad Rakho:** Binary Search sirf **sorted array** pe kaam karta hai. Time complexity O(log n) — 1 million elements mein bhi max 20 comparisons!

### Interview Question: Kab kaunsa search?

| Scenario | Best Search | Kyun |
|----------|-------------|------|
| Unsorted array | Linear | Binary ke liye sorted chahiye |
| Sorted array | Binary | O(log n) — bahut fast |
| Linked List | Linear | Random access nahi hai |
| Small array (< 10) | Linear | Overhead kam hai |

---

## Revision 2: DSA — Sorting Algorithms

### Bubble Sort vs Selection Sort

```javascript
// Bubble Sort — O(n²) — adjacent elements swap karo
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];  // Swap
        swapped = true;
      }
    }
    if (!swapped) break;  // Already sorted? Ruko!
  }
  return arr;
}

// Selection Sort — O(n²) — minimum dhundho aur place karo
function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];  // Swap
    }
  }
  return arr;
}

// Test
console.log(bubbleSort([64, 34, 25, 12, 22, 11, 90]));
// [11, 12, 22, 25, 34, 64, 90]
```

### Sorting Comparison

| Algorithm | Best Case | Worst Case | Stable? |
|-----------|-----------|------------|---------|
| Bubble Sort | O(n) | O(n²) | Yes |
| Selection Sort | O(n²) | O(n²) | No |
| Insertion Sort | O(n) | O(n²) | Yes |
| JS .sort() | O(n log n) | O(n log n) | Depends |

---

## Revision 3: DSA — Stack & Queue

### Stack — LIFO (Last In, First Out)

```javascript
// Stack implementation
class Stack {
  constructor() {
    this.items = [];
  }

  push(item) { this.items.push(item); }
  pop() { return this.items.pop(); }
  peek() { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
  size() { return this.items.length; }
}

// Use case: Undo feature
const undoStack = new Stack();
undoStack.push("Type 'Hello'");
undoStack.push("Type 'World'");
undoStack.push("Delete 'World'");
console.log("Undo:", undoStack.pop());  // "Delete 'World'" — last action undo
```

### Queue — FIFO (First In, First Out)

```javascript
// Queue implementation
class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) { this.items.push(item); }
  dequeue() { return this.items.shift(); }
  front() { return this.items[0]; }
  isEmpty() { return this.items.length === 0; }
  size() { return this.items.length; }
}

// Use case: Task processing
const taskQueue = new Queue();
taskQueue.enqueue("Process payment");
taskQueue.enqueue("Send email");
taskQueue.enqueue("Update inventory");
console.log("Next task:", taskQueue.dequeue());  // "Process payment" — pehle aaya pehle
```

> **Socho Aise:** Stack = plate ka stack (upar se uthao). Queue = line mein khade log (pehle aaya pehle jaayega).

---

## Revision 4: Git Advanced

### Git Quick Reference

```bash
# Merge — branches combine karo
git checkout main
git merge feature-branch

# Rebase — linear history banao (sirf local branch pe!)
git checkout feature-branch
git rebase main

# Stash — changes temporarily save karo
git stash save "message"
git stash pop

# Cherry-pick — specific commit uthao
git cherry-pick <commit-hash>

# Conflict resolve workflow
# 1. File edit karo (markers hatao)
# 2. git add <file>
# 3. git commit
```

### Interview Question: Merge vs Rebase?

| Point | Merge | Rebase |
|-------|-------|--------|
| History | Branching structure dikhta hai | Linear (seedhi line) |
| Safety | Shared branch pe safe | Sirf local branch pe |
| Merge commit | Banta hai | Nahi banta |
| Use when | Public/shared branches | Private feature branches |

> **Yaad Rakho:** "Never rebase a shared branch" — ye golden rule hai!

---

## Revision 5: Closures

### Closure = Inner function + Outer variables (even after outer ends)

```javascript
// Classic closure example
function createMultiplier(multiplier) {
  // 'multiplier' enclosed hai
  return function(number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

// Private variable pattern
function createWallet(initialAmount) {
  let balance = initialAmount;  // Private!

  return {
    spend(amount) {
      if (amount <= balance) {
        balance -= amount;
        return `Spent ₹${amount}. Remaining: ₹${balance}`;
      }
      return "Insufficient balance!";
    },
    addMoney(amount) {
      balance += amount;
      return `Added ₹${amount}. Balance: ₹${balance}`;
    },
    checkBalance() {
      return `Balance: ₹${balance}`;
    }
  };
}

const wallet = createWallet(1000);
console.log(wallet.spend(300));       // Spent ₹300. Remaining: ₹700
console.log(wallet.addMoney(500));    // Added ₹500. Balance: ₹1200
console.log(wallet.checkBalance());   // Balance: ₹1200
// wallet.balance → undefined (private!)
```

### Interview Questions: Closures

**Q1: Ye output kya hoga?**

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Answer: 3, 3, 3 (var function-scoped hai, loop khatam hone pe i=3)
```

**Q2: Isko fix karo**

```javascript
// Fix 1: let use karo
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Answer: 0, 1, 2

// Fix 2: IIFE use karo
for (var i = 0; i < 3; i++) {
  ((j) => {
    setTimeout(() => console.log(j), 100);
  })(i);
}
// Answer: 0, 1, 2
```

**Q3: Closure kahan use hota hai real-world mein?**

- React Hooks (useState, useEffect)
- Event handlers
- Middleware patterns
- Memoization / Caching
- Module pattern (private variables)
- Debounce / Throttle functions

---

## Revision 6: Promises & Async/Await

### Promise States

```
Pending ──→ Fulfilled (resolve)
         └→ Rejected  (reject)
```

### Syntax Quick Reference

```javascript
// Promise creation
const promise = new Promise((resolve, reject) => {
  // async operation
  resolve(data);   // Success
  reject(error);   // Failure
});

// .then/.catch/.finally
promise
  .then(data => console.log(data))
  .catch(err => console.log(err))
  .finally(() => console.log("Done"));

// Async/Await
async function fetchData() {
  try {
    const data = await somePromise;
    return data;
  } catch (error) {
    console.log(error);
  }
}

// Parallel execution
const [a, b, c] = await Promise.all([p1, p2, p3]);
```

### Interview Question: Promise Methods

```javascript
// Promise.all — sab pass hone chahiye
Promise.all([p1, p2, p3]).then(([r1, r2, r3]) => {});
// Ek fail → sab fail

// Promise.allSettled — sab ka result chahiye
Promise.allSettled([p1, p2, p3]).then(results => {
  results.forEach(r => {
    // r.status = "fulfilled" ya "rejected"
  });
});

// Promise.race — pehla complete wala
Promise.race([p1, p2]).then(first => {});

// Promise.any — pehla SUCCESSFUL wala
Promise.any([p1, p2]).then(firstSuccess => {});
```

### Interview Question: Output kya hoga?

```javascript
console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => console.log("3"));

console.log("4");

// Answer: 1, 4, 3, 2
// Kyun? Synchronous pehle (1, 4)
// Microtask (Promise) phir (3)
// Macrotask (setTimeout) last mein (2)
```

> **Yaad Rakho:** Microtasks (Promises) hamesha Macrotasks (setTimeout) se pehle execute hote hain. Ye **Event Loop** ka concept hai!

---

## Common Interview Questions — Quick Answers

### Q1: var vs let vs const?
| Feature | var | let | const |
|---------|-----|-----|-------|
| Scope | Function | Block | Block |
| Hoisting | Yes (undefined) | Yes (TDZ) | Yes (TDZ) |
| Reassign | Yes | Yes | No |
| Redeclare | Yes | No | No |

### Q2: == vs ===?
```javascript
5 == "5"    // true  (type coercion hota hai)
5 === "5"   // false (strict — type bhi match hona chahiye)
// Hamesha === use karo!
```

### Q3: null vs undefined?
```javascript
let a;           // undefined — declared but no value
let b = null;    // null — intentionally empty
typeof a;        // "undefined"
typeof b;        // "object" (JS ka bug!)
```

### Q4: Spread vs Rest?
```javascript
// Spread — expand karo
const arr = [1, 2, 3];
const newArr = [...arr, 4, 5];  // [1, 2, 3, 4, 5]

// Rest — collect karo
function sum(...numbers) {       // numbers = [1, 2, 3, 4, 5]
  return numbers.reduce((a, b) => a + b, 0);
}
```

### Q5: Map vs forEach?
```javascript
// forEach — kuch karo, kuch return nahi
[1,2,3].forEach(n => console.log(n));

// map — transform karo, NEW array return
const doubled = [1,2,3].map(n => n * 2);  // [2, 4, 6]
```

---

## Week 3 Concept Map

```
Week 3 Topics
├── DSA
│   ├── Search → Linear O(n), Binary O(log n)
│   ├── Sort → Bubble, Selection, Insertion
│   ├── Stack → LIFO, push/pop, undo feature
│   └── Queue → FIFO, enqueue/dequeue, task processing
├── Git Advanced
│   ├── Merge → Combine branches
│   ├── Rebase → Linear history
│   ├── Conflicts → Same line edit → resolve manually
│   ├── Stash → Temporary save
│   └── Cherry-pick → Pick specific commit
├── Closures
│   ├── Lexical Scope → Where function is written
│   ├── Private Variables → Data hiding
│   ├── Function Factory → Customized functions
│   └── Memoization → Cache results
└── Promises
    ├── States → Pending/Fulfilled/Rejected
    ├── .then/.catch → Handle results/errors
    ├── Promise.all → Parallel, all must pass
    ├── Promise.allSettled → All results
    └── Async/Await → Modern syntax
```

---

## Quick Revision Table

| Topic | Key Concept | Interview Tip |
|-------|-------------|---------------|
| Binary Search | O(log n), sorted array | Array sorted hai to yahi use karo |
| Stack | LIFO, push/pop | Browser back button, undo |
| Queue | FIFO, enqueue/dequeue | Task processing, BFS |
| Merge | Branch combine | Shared branches ke liye |
| Rebase | Linear history | Sirf local branches pe |
| Closure | Inner fn + outer vars | Private variables, memoization |
| Promise | Future value object | API calls, file operations |
| async/await | Promise ka clean syntax | try/catch for error handling |

---

## Aaj Kya Seekha? (Revision Summary)

1. **Search** — Linear (unsorted), Binary (sorted) — time complexity samjho
2. **Sort** — Bubble, Selection — O(n²) but conceptually important
3. **Stack/Queue** — LIFO vs FIFO — real-world use cases
4. **Git Merge/Rebase** — kab kaunsa, golden rule yaad rakho
5. **Closures** — inner function + outer scope = power
6. **Promises** — async operations ka standard way
7. **Event Loop** — microtask (Promise) before macrotask (setTimeout)
8. **Interview readiness** — common questions ke answers ready rakho

> **Yaad Rakho:** Revision sirf padh ke nahi hota — likho, code karo, kisi ko explain karo. Evening mein hum ek mini project banayenge jo in sab concepts ko combine karega — "Task Manager CLI"!
