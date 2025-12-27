# Day 26 Evening: Event Loop Practice — Quiz, Async Flow & Scheduler

> **Aaj ka plan:** Subah humne Event Loop ka theory seekha — ab usko practice mein test karenge. Event loop quiz solve karenge, async flow predict karenge, aur ek simple task scheduler banayenge.

---

## Exercise 1: Event Loop Output Prediction Quiz

### Quiz 1: Basic

```javascript
// Pehle khud output predict karo, phir neeche answer dekho!
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("D");
```

> **Socho Aise:** Step by step socho — kya sync hai? Kya microtask hai? Kya macrotask hai?

<details>
<summary>Answer Dekho</summary>

```
A → Sync (turant execute)
D → Sync (turant execute)
C → Microtask (Promise — high priority)
B → Macrotask (setTimeout — low priority)
```

Output: `A, D, C, B`

</details>

### Quiz 2: Nested Promises

```javascript
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("3");
    return Promise.resolve();
  })
  .then(() => {
    console.log("4");
  });

Promise.resolve().then(() => {
  console.log("5");
});

console.log("6");
```

<details>
<summary>Answer Dekho</summary>

```
1 → Sync
6 → Sync
3 → Microtask (pehli promise chain ka pehla .then)
5 → Microtask (dusri promise)
4 → Microtask (pehli chain ka dusra .then — ek tick baad)
2 → Macrotask (setTimeout)
```

Output: `1, 6, 3, 5, 4, 2`

</details>

### Quiz 3: setTimeout Inside Promise

```javascript
console.log("Start");

setTimeout(() => {
  console.log("Timeout 1");
  Promise.resolve().then(() => console.log("Promise in Timeout"));
}, 0);

Promise.resolve().then(() => {
  console.log("Promise 1");
  setTimeout(() => console.log("Timeout in Promise"), 0);
});

setTimeout(() => console.log("Timeout 2"), 0);

console.log("End");
```

<details>
<summary>Answer Dekho</summary>

```
Start        → Sync
End          → Sync
Promise 1    → Microtask
Timeout 1    → Macrotask (pehla setTimeout)
Promise in Timeout → Microtask (macrotask ke baad drain)
Timeout 2    → Macrotask
Timeout in Promise → Macrotask (sabse baad mein register hua)
```

Output: `Start, End, Promise 1, Timeout 1, Promise in Timeout, Timeout 2, Timeout in Promise`

</details>

### Quiz 4: process.nextTick (Node.js)

```javascript
console.log("1");

setImmediate(() => console.log("2 - setImmediate"));

process.nextTick(() => console.log("3 - nextTick"));

Promise.resolve().then(() => console.log("4 - Promise"));

setTimeout(() => console.log("5 - setTimeout"), 0);

process.nextTick(() => console.log("6 - nextTick 2"));

console.log("7");
```

<details>
<summary>Answer Dekho</summary>

```
1 → Sync
7 → Sync
3 → nextTick (highest micro priority)
6 → nextTick (highest micro priority)
4 → Promise (microtask)
5 → setTimeout (macrotask)
2 → setImmediate (after I/O)
```

Output: `1, 7, 3, 6, 4, 5, 2`

</details>

> **Yaad Rakho:** Priority: Sync > nextTick > Promise > setTimeout > setImmediate

---

## Exercise 2: Async Flow Prediction

### Flow 1: Sequential vs Parallel

```javascript
// Sequential — ek ke baad ek (slow)
async function sequential() {
  console.time("Sequential");

  const result1 = await delay(1000, "Task 1");
  console.log(result1);

  const result2 = await delay(1000, "Task 2");
  console.log(result2);

  const result3 = await delay(1000, "Task 3");
  console.log(result3);

  console.timeEnd("Sequential"); // ~3 seconds
}

// Parallel — sab ek saath (fast!)
async function parallel() {
  console.time("Parallel");

  const [r1, r2, r3] = await Promise.all([
    delay(1000, "Task 1"),
    delay(1000, "Task 2"),
    delay(1000, "Task 3")
  ]);
  console.log(r1, r2, r3);

  console.timeEnd("Parallel"); // ~1 second!
}

// Helper function
function delay(ms, value) {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), ms);
  });
}

// sequential(); // 3 sec lagenge
// parallel();   // 1 sec lagega — 3x fast!
```

> **Tip:** Jab tasks independent hain (ek ka result dusre ko nahi chahiye), toh hamesha `Promise.all` use karo — performance mein bahut farak aata hai!

### Flow 2: Error Handling Patterns

```javascript
// Kya hoga agar ek promise fail ho jaaye?

async function riskyOperation() {
  try {
    // Promise.all — ek bhi fail hua toh SAB cancel
    const results = await Promise.all([
      fetchData("api/users"),      // ✅ Success
      fetchData("api/invalid"),    // ❌ Fail
      fetchData("api/products")    // Ye bhi cancel ho jaayega!
    ]);
  } catch (err) {
    console.log("Koi ek fail hua:", err.message);
  }
}

// Promise.allSettled — sab complete hone do, pass ya fail
async function safeOperation() {
  const results = await Promise.allSettled([
    fetchData("api/users"),
    fetchData("api/invalid"),
    fetchData("api/products")
  ]);

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`Task ${i}: ✅`, result.value);
    } else {
      console.log(`Task ${i}: ❌`, result.reason);
    }
  });
}

// Mock fetch function
function fetchData(url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url.includes("invalid")) {
        reject(new Error(`${url} not found`));
      } else {
        resolve(`Data from ${url}`);
      }
    }, 1000);
  });
}
```

> **Yaad Rakho:** `Promise.all` = Sab ya Koi Nahi. `Promise.allSettled` = Sabka result do, chahe pass ho ya fail. Real projects mein `allSettled` zyada safe hai.

### Flow 3: Race Condition

```javascript
// Promise.race — jo pehle complete ho, uska result lo
async function raceExample() {
  const fastest = await Promise.race([
    delay(3000, "Slow Server"),
    delay(1000, "Fast Server"),
    delay(2000, "Medium Server")
  ]);
  console.log("Winner:", fastest); // "Fast Server" (1 sec mein aaya)
}

// Real use case: Timeout mechanism
async function fetchWithTimeout(url, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout!")), timeoutMs);
  });

  const fetchPromise = fetch(url);

  // Jo pehle complete ho — data ya timeout
  return Promise.race([fetchPromise, timeoutPromise]);
}

// 5 sec ka timeout
// fetchWithTimeout("https://api.example.com/data", 5000);
```

---

## Exercise 3: Build a Simple Task Scheduler

```javascript
class TaskScheduler {
  constructor() {
    this.tasks = [];         // pending tasks
    this.running = 0;        // currently running count
    this.maxConcurrent = 2;  // max 2 tasks ek saath
    this.results = [];       // completed results
  }

  // Task add karo
  addTask(name, duration, priority = 'normal') {
    this.tasks.push({
      name,
      duration,
      priority,
      status: 'pending',
      addedAt: Date.now()
    });
    console.log(`📋 Task added: "${name}" (${duration}ms, ${priority})`);

    // High priority tasks pehle
    this.tasks.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return 0;
    });
  }

  // Ek task execute karo
  #executeTask(task) {
    return new Promise((resolve) => {
      task.status = 'running';
      this.running++;
      console.log(`▶️  Running: "${task.name}" (${this.running}/${this.maxConcurrent} slots used)`);

      setTimeout(() => {
        task.status = 'completed';
        task.completedAt = Date.now();
        this.running--;
        this.results.push(task);
        console.log(`✅ Completed: "${task.name}" | Remaining: ${this.tasks.length}`);
        resolve(task);
      }, task.duration);
    });
  }

  // Scheduler chalaao
  async run() {
    console.log(`\n🚀 Scheduler starting with ${this.tasks.length} tasks...\n`);
    const startTime = Date.now();

    while (this.tasks.length > 0 || this.running > 0) {
      // Jab tak slots available hain aur tasks pending hain
      while (this.running < this.maxConcurrent && this.tasks.length > 0) {
        const task = this.tasks.shift();
        // Fire and forget — next task turant start hogi
        this.#executeTask(task);
      }
      // Thoda wait karo next iteration ke liye
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n🏁 All tasks done in ${totalTime}ms`);
    return this.results;
  }

  // Status dikhao
  status() {
    console.log("\n📊 Scheduler Status:");
    console.log(`   Pending: ${this.tasks.length}`);
    console.log(`   Running: ${this.running}`);
    console.log(`   Completed: ${this.results.length}`);
  }
}

// Scheduler use karo
async function main() {
  const scheduler = new TaskScheduler();

  scheduler.addTask("Database Backup", 3000, "high");
  scheduler.addTask("Send Emails", 2000, "normal");
  scheduler.addTask("Generate Report", 4000, "normal");
  scheduler.addTask("Cache Cleanup", 1000, "high");
  scheduler.addTask("Log Rotation", 1500, "normal");

  const results = await scheduler.run();

  console.log("\n📋 Results:");
  results.forEach(r => {
    const duration = r.completedAt - r.addedAt;
    console.log(`   ${r.name}: ${r.status} (${duration}ms)`);
  });
}

main();
```

> **Expected Output:**
> ```
> 📋 Task added: "Database Backup" (3000ms, high)
> 📋 Task added: "Send Emails" (2000ms, normal)
> ... (baaki tasks)
>
> 🚀 Scheduler starting with 5 tasks...
>
> ▶️  Running: "Database Backup" (1/2 slots used)
> ▶️  Running: "Cache Cleanup" (2/2 slots used)
> ✅ Completed: "Cache Cleanup" | Remaining: 2
> ▶️  Running: "Send Emails" (2/2 slots used)
> ... (baaki tasks complete hote hain)
>
> 🏁 All tasks done in ~5000ms
> ```

> **Practice Time!** `maxConcurrent` ko 3 bana ke try karo — dekho total time kaise kam hota hai!

---

## Bonus: Common Async Mistakes

```javascript
// ❌ GALAT: forEach ke saath async kaam nahi karta properly
async function wrong() {
  const items = [1, 2, 3];
  items.forEach(async (item) => {
    const result = await processItem(item); // Ye wait nahi karega!
    console.log(result);
  });
  console.log("Done"); // Ye pehle print hoga!
}

// ✅ SAHI: for...of use karo sequential ke liye
async function correct() {
  const items = [1, 2, 3];
  for (const item of items) {
    const result = await processItem(item); // Properly wait karega
    console.log(result);
  }
  console.log("Done"); // Ye last mein print hoga
}

// ✅ SAHI: Promise.all use karo parallel ke liye
async function correctParallel() {
  const items = [1, 2, 3];
  const results = await Promise.all(
    items.map(item => processItem(item))
  );
  console.log(results); // Sab ek saath
  console.log("Done");
}
```

> **Warning:** `forEach` ke andar `await` kabhi mat use karo — ye expected tarike se kaam nahi karta! `for...of` ya `Promise.all` with `map` use karo.

---

## Quick Revision Table

| Exercise | Kya Seekha | Key Pattern |
|----------|-----------|-------------|
| Quiz 1-4 | Output prediction | Sync > nextTick > Promise > setTimeout > setImmediate |
| Sequential vs Parallel | Performance difference | `Promise.all` for parallel |
| Error Handling | all vs allSettled | `allSettled` safer hai |
| Race | Timeout pattern | `Promise.race` for timeout |
| Scheduler | Concurrency control | Max concurrent tasks manage karna |
| forEach trap | Async forEach galat hai | `for...of` ya `map` + `Promise.all` |

---

## Aaj Kya Seekha?

1. **Event loop output predict** karna — sync, microtask, macrotask order
2. **Sequential vs Parallel** — `Promise.all` se 3x fast ho sakta hai
3. **Promise.allSettled** — safer than `Promise.all` jab partial failure ok ho
4. **Promise.race** — timeout mechanism banane ke liye
5. **Task Scheduler** — concurrency control ka practical example
6. **forEach + async** wala trap — hamesha `for...of` ya `map` use karo

> **Tip:** Kal hum Linux Deep Dive karenge — file permissions, processes, shell scripting, aur cron jobs sikhenge. Backend developer ke liye Linux jaanna bahut zaroori hai!
