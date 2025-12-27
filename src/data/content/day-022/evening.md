# Day 22 Evening: Error Handling & Debugging — Hands-On Practice

> **Aaj ka plan:** Ab error handling aur debugging ko practically implement karenge. Broken code fix karenge, custom error classes banayenge, error handling patterns practice karenge, aur debugging techniques use karenge.

---

## Exercise 1: Error Types — Pehchano Aur Fix Karo

### Task: Har code snippet mein error pehchano aur fix karo

```javascript
// error-types.js

// Bug 1: SyntaxError — Fix karo!
// ❌ Broken:
// function greet(name {
//   console.log("Hello " + name);
// }

// ✅ Fixed:
function greet(name) {
  console.log("Hello " + name);
}

// Bug 2: ReferenceError — Fix karo!
// ❌ Broken:
// console.log(farmerName);

// ✅ Fixed:
const farmerName = "Rajesh";
console.log(farmerName);

// Bug 3: TypeError — Fix karo!
// ❌ Broken:
// const price = null;
// console.log(price.toFixed(2));

// ✅ Fixed:
const price = null;
console.log(price ? price.toFixed(2) : "Price not available");

// Bug 4: RangeError — Fix karo!
// ❌ Broken:
// function recursiveForever() { recursiveForever(); }
// recursiveForever();  // Maximum call stack size exceeded

// ✅ Fixed:
function recursiveWithLimit(n) {
  if (n <= 0) return;  // Base case — rokne ka condition
  console.log(n);
  recursiveWithLimit(n - 1);
}
recursiveWithLimit(5);
```

### Task: Error detective — kaunsa error type aayega?

```javascript
// Quiz — predict karo kaunsa error aayega

// 1.
try {
  const obj = {};
  obj.method();  // ?
} catch (e) {
  console.log(e.name);  // TypeError — method is not a function
}

// 2.
try {
  JSON.parse("{'invalid': 'json'}");  // ?
} catch (e) {
  console.log(e.name);  // SyntaxError — single quotes not valid
}

// 3.
try {
  const num = 1;
  num = 2;  // ?
} catch (e) {
  console.log(e.name);  // TypeError — Assignment to constant variable
}

// 4.
try {
  (42).toString(100);  // ?
} catch (e) {
  console.log(e.name);  // RangeError — radix must be between 2 and 36
}
```

> **Practice Time!** 5 aur broken code snippets likho aur friends ko fix karne do!

---

## Exercise 2: Custom Error Classes — Farm Management System

### Task: Complete error handling system banao

```javascript
// custom-errors.js

// Base Application Error
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;  // Expected error, not a bug
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

// Specific Error Types
class ValidationError extends AppError {
  constructor(errors) {
    super("Validation failed", 400, errors);
  }
}

class NotFoundError extends AppError {
  constructor(resource, identifier) {
    super(`${resource} not found: ${identifier}`, 404);
    this.resource = resource;
    this.identifier = identifier;
  }
}

class DuplicateError extends AppError {
  constructor(resource, field, value) {
    super(`${resource} already exists with ${field}: ${value}`, 409);
    this.field = field;
    this.value = value;
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Permission denied") {
    super(message, 403);
  }
}

// Farm Management System with proper errors
class FarmManagementSystem {
  constructor() {
    this.farmers = new Map();
    this.nextId = 1;
  }

  addFarmer(data) {
    // Validation
    const errors = [];
    if (!data.name || data.name.trim().length < 2) {
      errors.push({ field: "name", message: "Name must be at least 2 characters" });
    }
    if (!data.crop) {
      errors.push({ field: "crop", message: "Crop is required" });
    }
    if (!data.area || data.area <= 0) {
      errors.push({ field: "area", message: "Area must be a positive number" });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    // Duplicate check
    const existing = [...this.farmers.values()].find(
      f => f.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existing) {
      throw new DuplicateError("Farmer", "name", data.name);
    }

    const farmer = {
      id: this.nextId++,
      name: data.name.trim(),
      crop: data.crop,
      area: data.area,
      createdAt: new Date().toISOString()
    };

    this.farmers.set(farmer.id, farmer);
    return farmer;
  }

  getFarmer(id) {
    const farmer = this.farmers.get(id);
    if (!farmer) {
      throw new NotFoundError("Farmer", id);
    }
    return farmer;
  }

  updateFarmer(id, updates, userRole = "viewer") {
    // Authorization check
    if (userRole === "viewer") {
      throw new AuthorizationError("Only admins and editors can update farmers");
    }

    const farmer = this.getFarmer(id);  // NotFoundError throw ho sakta hai

    // Validation for updates
    if (updates.area !== undefined && updates.area <= 0) {
      throw new ValidationError([
        { field: "area", message: "Area must be positive" }
      ]);
    }

    Object.assign(farmer, updates);
    return farmer;
  }

  deleteFarmer(id, userRole = "viewer") {
    if (userRole !== "admin") {
      throw new AuthorizationError("Only admins can delete farmers");
    }

    const farmer = this.getFarmer(id);
    this.farmers.delete(id);
    return farmer;
  }
}

// === ERROR HANDLER === //
function handleError(error) {
  if (error instanceof ValidationError) {
    console.log(`\n⚠️ VALIDATION ERROR (${error.statusCode}):`);
    error.details.forEach(err => {
      console.log(`   - ${err.field}: ${err.message}`);
    });
  } else if (error instanceof NotFoundError) {
    console.log(`\n🔍 NOT FOUND (${error.statusCode}): ${error.message}`);
  } else if (error instanceof DuplicateError) {
    console.log(`\n📋 DUPLICATE (${error.statusCode}): ${error.message}`);
  } else if (error instanceof AuthenticationError) {
    console.log(`\n🔒 AUTH ERROR (${error.statusCode}): ${error.message}`);
  } else if (error instanceof AuthorizationError) {
    console.log(`\n🚫 FORBIDDEN (${error.statusCode}): ${error.message}`);
  } else {
    console.log(`\n💀 UNEXPECTED ERROR: ${error.message}`);
    console.log(error.stack);
  }
}

// === TEST CASES === //
const farm = new FarmManagementSystem();

// Test 1: Successful operations
try {
  const farmer = farm.addFarmer({ name: "Rajesh", crop: "Wheat", area: 5 });
  console.log("✅ Added:", farmer.name);
} catch (error) {
  handleError(error);
}

// Test 2: Validation Error
try {
  farm.addFarmer({ name: "", crop: "", area: -1 });
} catch (error) {
  handleError(error);
}

// Test 3: Duplicate Error
try {
  farm.addFarmer({ name: "Rajesh", crop: "Rice", area: 3 });
} catch (error) {
  handleError(error);
}

// Test 4: Not Found Error
try {
  farm.getFarmer(999);
} catch (error) {
  handleError(error);
}

// Test 5: Authorization Error
try {
  farm.updateFarmer(1, { area: 10 }, "viewer");
} catch (error) {
  handleError(error);
}

// Test 6: Successful update
try {
  const updated = farm.updateFarmer(1, { area: 10 }, "admin");
  console.log("✅ Updated:", updated.name, "- Area:", updated.area);
} catch (error) {
  handleError(error);
}

// Test 7: Error as JSON (API response ke liye)
try {
  farm.getFarmer(999);
} catch (error) {
  if (error instanceof AppError) {
    console.log("\n📡 API Response:", JSON.stringify(error.toJSON(), null, 2));
  }
}
```

> **Expected Output:**
> ```
> ✅ Added: Rajesh
> ⚠️ VALIDATION ERROR (400):
>    - name: Name must be at least 2 characters
>    - crop: Crop is required
>    - area: Area must be a positive number
> 📋 DUPLICATE (409): Farmer already exists with name: Rajesh
> 🔍 NOT FOUND (404): Farmer not found: 999
> 🚫 FORBIDDEN (403): Only admins and editors can update farmers
> ✅ Updated: Rajesh - Area: 10
> ```

---

## Exercise 3: Debug Broken Code

### Task: Ye code broken hai — bugs dhundho aur fix karo

```javascript
// broken-code.js — IS MEIN 7 BUGS HAIN! DHUNDHO!

// Bug 1: Off-by-one error
function getFarmers(page, limit) {
  const farmers = ["Rajesh", "Priya", "Suresh", "Anita", "Mohan",
                   "Geeta", "Vikram", "Sunita", "Arun", "Kavita"];

  // ❌ BUG: start calculation galat hai
  // const start = page * limit;  // page=1 pe start=5 hoga (galat!)

  // ✅ FIX:
  const start = (page - 1) * limit;  // page=1 pe start=0 (sahi!)
  const end = start + limit;

  return farmers.slice(start, end);
}

console.log("Page 1:", getFarmers(1, 3));  // ["Rajesh", "Priya", "Suresh"]
console.log("Page 2:", getFarmers(2, 3));  // ["Anita", "Mohan", "Geeta"]

// Bug 2: Async timing issue
// ❌ BUG:
// function loadData() {
//   let result;
//   setTimeout(() => { result = "data loaded"; }, 100);
//   return result;  // undefined return hoga!
// }

// ✅ FIX:
function loadData() {
  return new Promise(resolve => {
    setTimeout(() => { resolve("data loaded"); }, 100);
  });
}

loadData().then(result => console.log("Bug 2 fix:", result));

// Bug 3: Object reference trap
// ❌ BUG:
// const original = { name: "Rajesh", address: { city: "Jaipur" } };
// const copy = { ...original };
// copy.address.city = "Delhi";
// console.log(original.address.city);  // "Delhi" — original bhi badal gaya!

// ✅ FIX: Deep copy karo
const original = { name: "Rajesh", address: { city: "Jaipur" } };
const copy = JSON.parse(JSON.stringify(original));  // Deep copy
copy.address.city = "Delhi";
console.log("Bug 3 fix — Original:", original.address.city);  // "Jaipur" (safe!)
console.log("Bug 3 fix — Copy:", copy.address.city);  // "Delhi"

// Bug 4: Floating point arithmetic
// ❌ BUG:
// if (0.1 + 0.2 === 0.3) { console.log("Equal!"); }  // Never prints!

// ✅ FIX:
if (Math.abs((0.1 + 0.2) - 0.3) < Number.EPSILON) {
  console.log("Bug 4 fix: Numbers are equal!");
}

// Bug 5: Array comparison
// ❌ BUG:
// if ([1, 2, 3] === [1, 2, 3]) { console.log("Equal!"); }  // Never prints!

// ✅ FIX:
function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
console.log("Bug 5 fix:", arraysEqual([1, 2, 3], [1, 2, 3]));  // true

// Bug 6: forEach with async
// ❌ BUG: forEach does NOT wait for async
// async function processAll(items) {
//   items.forEach(async (item) => {
//     await processItem(item);  // Ye parallel chalega, sequential nahi!
//   });
//   console.log("All done!");  // Ye pehle print hoga!
// }

// ✅ FIX: for...of use karo
async function processAll(items) {
  for (const item of items) {
    await processItem(item);  // Sequential
  }
  console.log("Bug 6 fix: All done!");
}

async function processItem(item) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`  Processing: ${item}`);
      resolve();
    }, 100);
  });
}

processAll(["Wheat", "Rice", "Cotton"]);

// Bug 7: this context lost
// ❌ BUG:
// const farmer = {
//   name: "Rajesh",
//   crops: ["Wheat", "Rice"],
//   showCrops: function() {
//     this.crops.forEach(function(crop) {
//       console.log(this.name + " grows " + crop);  // this.name = undefined!
//     });
//   }
// };

// ✅ FIX: Arrow function use karo (lexical this)
const farmer = {
  name: "Rajesh",
  crops: ["Wheat", "Rice"],
  showCrops: function() {
    this.crops.forEach((crop) => {
      console.log(`Bug 7 fix: ${this.name} grows ${crop}`);
    });
  }
};

setTimeout(() => farmer.showCrops(), 500);
```

> **Practice Time!** Apne purane code mein 3 bugs dhundho aur fix karo. Console methods use karo debugging ke liye.

---

## Exercise 4: Async Error Handling Patterns

### Task: Robust async error handling implement karo

```javascript
// async-errors.js

// Pattern 1: Safe Async Wrapper
function safeAsync(fn) {
  return async function(...args) {
    try {
      return [null, await fn(...args)];
    } catch (error) {
      return [error, null];
    }
  };
}

// Usage
async function fetchFarmerData(id) {
  if (id < 0) throw new Error("Invalid ID");
  return new Promise(resolve =>
    setTimeout(() => resolve({ id, name: "Rajesh" }), 300)
  );
}

const safeFetch = safeAsync(fetchFarmerData);

async function demo1() {
  const [err1, data1] = await safeFetch(1);
  if (err1) console.log("Error:", err1.message);
  else console.log("Pattern 1 - Success:", data1.name);

  const [err2, data2] = await safeFetch(-1);
  if (err2) console.log("Pattern 1 - Error:", err2.message);
  else console.log("Data:", data2);
}

// Pattern 2: Retry with Backoff
async function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 100, onRetry = null } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      if (onRetry) onRetry(attempt, delay, error);

      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Usage
let callCount = 0;
async function unreliableAPI() {
  callCount++;
  if (callCount < 3) throw new Error("Server busy!");
  return { data: "Success on attempt " + callCount };
}

async function demo2() {
  try {
    const result = await withRetry(unreliableAPI, {
      maxRetries: 5,
      baseDelay: 100,
      onRetry: (attempt, delay, err) => {
        console.log(`  Retry ${attempt} after ${delay}ms (${err.message})`);
      }
    });
    console.log("Pattern 2 - Result:", result);
  } catch (error) {
    console.log("Pattern 2 - All retries failed:", error.message);
  }
}

// Pattern 3: Timeout wrapper
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function demo3() {
  // Fast operation — should succeed
  try {
    const fast = await withTimeout(
      new Promise(r => setTimeout(() => r("Fast!"), 100)),
      500
    );
    console.log("Pattern 3 - Fast:", fast);
  } catch (error) {
    console.log("Pattern 3 - Fast error:", error.message);
  }

  // Slow operation — should timeout
  try {
    const slow = await withTimeout(
      new Promise(r => setTimeout(() => r("Slow!"), 2000)),
      500
    );
    console.log("Pattern 3 - Slow:", slow);
  } catch (error) {
    console.log("Pattern 3 - Timeout:", error.message);
  }
}

// Run all demos
async function main() {
  console.log("=== Pattern 1: Safe Async ===");
  await demo1();

  console.log("\n=== Pattern 2: Retry with Backoff ===");
  callCount = 0;
  await demo2();

  console.log("\n=== Pattern 3: Timeout ===");
  await demo3();
}

main();
```

---

## Exercise 5: Debugging Challenge — Console Power

### Task: Console methods use karke application debug karo

```javascript
// debug-challenge.js

// Farm inventory system — debug karo
const inventory = [
  { id: 1, crop: "Wheat", quantity: 500, price: 2000, warehouse: "A" },
  { id: 2, crop: "Rice", quantity: 300, price: 3000, warehouse: "B" },
  { id: 3, crop: "Cotton", quantity: 200, price: 6000, warehouse: "A" },
  { id: 4, crop: "Sugarcane", quantity: 1000, price: 350, warehouse: "C" },
  { id: 5, crop: "Mustard", quantity: 150, price: 5000, warehouse: "B" }
];

// Table format mein dekho
console.table(inventory);

// Grouped analysis
console.group("📊 Inventory Analysis");

  console.time("Analysis");

  // Total value calculate karo
  const totalValue = inventory.reduce((sum, item) => {
    const value = item.quantity * item.price;
    console.count("Items processed");
    return sum + value;
  }, 0);
  console.log(`💰 Total inventory value: ₹${totalValue.toLocaleString()}`);

  // Warehouse wise grouping
  console.group("🏭 Warehouse Summary");
  const warehouseGroups = {};
  inventory.forEach(item => {
    if (!warehouseGroups[item.warehouse]) {
      warehouseGroups[item.warehouse] = [];
    }
    warehouseGroups[item.warehouse].push(item.crop);
  });
  console.table(warehouseGroups);
  console.groupEnd();

  // Assertions — validate data
  console.group("✅ Data Validation");
  inventory.forEach(item => {
    console.assert(item.quantity > 0, `${item.crop}: quantity should be positive`);
    console.assert(item.price > 0, `${item.crop}: price should be positive`);
    console.assert(item.warehouse, `${item.crop}: warehouse is required`);
  });
  console.log("All assertions passed!");
  console.groupEnd();

  console.timeEnd("Analysis");

console.groupEnd();

// Trace example — kahan se call ho raha hai?
function calculateRevenue(crop) {
  console.trace(`calculateRevenue called for ${crop}`);
  const item = inventory.find(i => i.crop === crop);
  return item ? item.quantity * item.price : 0;
}

console.log("\n💰 Wheat Revenue:", calculateRevenue("Wheat"));
```

---

## Mini Challenge: Error-Resilient Data Pipeline

### Task: Multiple data sources se data process karo — errors handle karo gracefully

```javascript
// data-pipeline.js

async function dataPipeline() {
  console.log("🚀 Starting data pipeline...\n");

  // Source functions — kuch fail honge
  const sources = [
    {
      name: "Farmer Database",
      fetch: () => new Promise((resolve) =>
        setTimeout(() => resolve({ farmers: 150 }), 300)
      )
    },
    {
      name: "Weather API",
      fetch: () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error("API rate limit exceeded")), 200)
      )
    },
    {
      name: "Market Prices",
      fetch: () => new Promise((resolve) =>
        setTimeout(() => resolve({ wheat: 2100, rice: 3200 }), 400)
      )
    },
    {
      name: "Satellite Data",
      fetch: () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Service unavailable")), 100)
      )
    },
    {
      name: "Soil Analysis",
      fetch: () => new Promise((resolve) =>
        setTimeout(() => resolve({ ph: 6.5, moisture: "adequate" }), 250)
      )
    }
  ];

  // Process all sources — don't let one failure stop everything
  console.time("Pipeline complete");

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      console.log(`  📡 Fetching: ${source.name}...`);
      const data = await source.fetch();
      return { name: source.name, data };
    })
  );

  // Separate successes and failures
  const successful = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      failed.push({
        name: sources[index].name,
        error: result.reason.message
      });
    }
  });

  // Report
  console.log("\n=== PIPELINE RESULTS ===\n");

  console.log("✅ Successful sources:");
  successful.forEach(s => {
    console.log(`   ${s.name}:`, s.data);
  });

  if (failed.length > 0) {
    console.log("\n❌ Failed sources:");
    failed.forEach(f => {
      console.log(`   ${f.name}: ${f.error}`);
    });
  }

  console.log(`\n📊 Success rate: ${successful.length}/${sources.length} (${Math.round(successful.length/sources.length * 100)}%)`);
  console.timeEnd("Pipeline complete");

  return { successful, failed };
}

dataPipeline();
```

---

## Quick Revision Table

| Exercise | Concept Practiced | Key Takeaway |
|----------|------------------|--------------|
| Error Types | Identify & fix errors | Har error type ka meaning samjho |
| Custom Errors | Error class hierarchy | API-ready error responses |
| Debug Broken Code | 7 common bugs | Real-world gotchas |
| Async Patterns | safeAsync, retry, timeout | Production-ready patterns |
| Console Power | table, group, assert, trace | Efficient debugging |
| Data Pipeline | allSettled, graceful degradation | Never let one failure crash all |

---

## Aaj Kya Seekha?

1. **Error types** pehchane aur fix kiye — SyntaxError, TypeError, ReferenceError
2. **Custom Error classes** banaye — ValidationError, NotFoundError, AuthError
3. **7 common bugs** dhundhe aur fix kiye — off-by-one, async issues, this context
4. **Async error patterns** — safeAsync, retry with backoff, timeout wrapper
5. **Console debugging** — table, group, assert, trace use kiya
6. **Error-resilient pipeline** — graceful degradation with Promise.allSettled

> **Yaad Rakho:** Errors aana normal hai — unko gracefully handle karna professional development hai. Har error ek learning opportunity hai. "The best error handler is the one that never surprises the user." Kal hum npm aur package management seekhenge!
