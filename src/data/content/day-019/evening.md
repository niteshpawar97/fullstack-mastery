# Day 19 Evening: Closures & Callbacks — Hands-On Practice

> **Aaj ka plan:** Ab closures aur callbacks ko practically use karenge. Exercises mein closure patterns implement karenge, callback-based file operations karenge, aur event-driven programming patterns seekhenge.

---

## Exercise 1: Closure Basics — Counter Variations

### Task: Different types ke counters banao using closures

```javascript
// counter.js

// Basic Counter — closure se private variable
function createCounter(startFrom = 0) {
  let count = startFrom;  // Private — bahar se access nahi hoga

  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    reset() {
      count = startFrom;  // Original value pe wapas
      return count;
    },
    getCount() {
      return count;
    }
  };
}

// Test karo
const counter1 = createCounter(0);
console.log(counter1.increment());  // 1
console.log(counter1.increment());  // 2
console.log(counter1.increment());  // 3
console.log(counter1.decrement());  // 2
console.log(counter1.reset());      // 0

// Alag counter — apna alag state hai
const counter2 = createCounter(100);
console.log(counter2.increment());  // 101
console.log(counter1.getCount());   // 0 — counter1 pe koi asar nahi!
```

> **Expected Output:**
> ```
> 1
> 2
> 3
> 2
> 0
> 101
> 0
> ```

### Task: Step Counter banao (custom step size)

```javascript
// step-counter.js

function createStepCounter(step = 1) {
  let count = 0;

  return {
    next() {
      count += step;
      return count;
    },
    prev() {
      count -= step;
      return count;
    },
    value() {
      return count;
    }
  };
}

const byTwo = createStepCounter(2);
console.log(byTwo.next());  // 2
console.log(byTwo.next());  // 4
console.log(byTwo.next());  // 6
console.log(byTwo.prev());  // 4

const byFive = createStepCounter(5);
console.log(byFive.next());  // 5
console.log(byFive.next());  // 10
```

> **Practice Time!** Ek `createCountdown(from)` function banao jo har call pe 1 kam kare aur 0 pe "Done!" return kare.

---

## Exercise 2: Private Data — Farm Management

### Task: Farmer management system with private data

```javascript
// farm-manager.js

function createFarmManager() {
  // Private data — bahar se koi access nahi kar sakta
  const farmers = [];
  let nextId = 1;

  return {
    // Naya farmer add karo
    addFarmer(name, crop, area) {
      const farmer = {
        id: nextId++,     // Auto-increment ID
        name,
        crop,
        area,
        addedAt: new Date().toLocaleDateString()
      };
      farmers.push(farmer);
      console.log(`✅ Farmer added: ${name} (ID: ${farmer.id})`);
      return farmer;
    },

    // Farmer dhundho by name
    findFarmer(name) {
      const found = farmers.filter(f =>
        f.name.toLowerCase().includes(name.toLowerCase())
      );
      return found.length > 0 ? found : "Koi farmer nahi mila!";
    },

    // Farmer remove karo by ID
    removeFarmer(id) {
      const index = farmers.findIndex(f => f.id === id);
      if (index === -1) {
        console.log("❌ Farmer not found!");
        return false;
      }
      const removed = farmers.splice(index, 1)[0];
      console.log(`🗑️ Removed: ${removed.name}`);
      return true;
    },

    // Saare farmers dekho
    listFarmers() {
      if (farmers.length === 0) {
        console.log("Koi farmer registered nahi hai!");
        return;
      }
      console.log("\n=== Registered Farmers ===");
      farmers.forEach(f => {
        console.log(`[${f.id}] ${f.name} - ${f.crop} (${f.area})`);
      });
      console.log(`Total: ${farmers.length} farmers\n`);
    },

    // Statistics
    getStats() {
      return {
        totalFarmers: farmers.length,
        crops: [...new Set(farmers.map(f => f.crop))],
        nextId: nextId
      };
    }
  };
}

// Test karo
const farm = createFarmManager();
farm.addFarmer("Rajesh", "Wheat", "5 acres");
farm.addFarmer("Priya", "Rice", "3 acres");
farm.addFarmer("Suresh", "Cotton", "7 acres");
farm.addFarmer("Rajesh Kumar", "Sugarcane", "10 acres");
farm.listFarmers();

console.log("Search 'Rajesh':", farm.findFarmer("Rajesh"));
console.log("Stats:", farm.getStats());

farm.removeFarmer(2);  // Priya remove
farm.listFarmers();

// Direct access try karo — nahi milega!
// console.log(farm.farmers);  // undefined — private hai!
// console.log(farm.nextId);   // undefined — private hai!
```

> **Yaad Rakho:** `farmers` array aur `nextId` variable closure ke andar "enclosed" hain. Koi bhi bahar se directly modify nahi kar sakta. Sirf defined methods (addFarmer, removeFarmer, etc.) se hi access possible hai. This is the power of closures!

---

## Exercise 3: Function Factory Patterns

### Task: Discount calculator factory banao

```javascript
// discount-factory.js

// Discount calculator factory
function createDiscountCalculator(discountPercent, label) {
  return function(price) {
    const discount = price * (discountPercent / 100);
    const finalPrice = price - discount;
    return {
      label,
      original: price,
      discount: discount,
      discountPercent: discountPercent + "%",
      final: finalPrice
    };
  };
}

// Alag-alag discount calculators
const festivalDiscount = createDiscountCalculator(20, "Festival Sale");
const memberDiscount = createDiscountCalculator(10, "Member Discount");
const bulkDiscount = createDiscountCalculator(30, "Bulk Purchase");

console.log(festivalDiscount(5000));
// { label: "Festival Sale", original: 5000, discount: 1000, ... final: 4000 }

console.log(memberDiscount(5000));
// { label: "Member Discount", original: 5000, discount: 500, ... final: 4500 }

console.log(bulkDiscount(5000));
// { label: "Bulk Purchase", original: 5000, discount: 1500, ... final: 3500 }
```

### Task: Greeting generator factory

```javascript
// greeting-factory.js

function createGreeting(language) {
  const greetings = {
    hindi: (name) => `Namaste ${name}! Aapka swagat hai.`,
    english: (name) => `Hello ${name}! Welcome aboard.`,
    punjabi: (name) => `Sat Sri Akal ${name}! Ji aayan nu.`,
    marathi: (name) => `Namaskar ${name}! Tumcha swagat aahe.`
  };

  const greetFn = greetings[language] || greetings.english;

  return function(name) {
    return greetFn(name);
  };
}

const hindiGreet = createGreeting("hindi");
const englishGreet = createGreeting("english");
const punjabiGreet = createGreeting("punjabi");

console.log(hindiGreet("Rajesh"));    // Namaste Rajesh! Aapka swagat hai.
console.log(englishGreet("John"));     // Hello John! Welcome aboard.
console.log(punjabiGreet("Gurpreet")); // Sat Sri Akal Gurpreet! Ji aayan nu.
```

> **Practice Time!** Ek `createLogger(prefix)` function banao jo har message ke aage prefix lagaye. Jaise `createLogger("[ERROR]")` se bana function har message ke aage `[ERROR]` lagaye.

---

## Exercise 4: Memoization — Performance Boost

### Task: Fibonacci with memoization

```javascript
// memoize.js

// Generic memoize function
function memoize(fn) {
  const cache = {};
  let cacheHits = 0;
  let cacheMisses = 0;

  const memoized = function(...args) {
    const key = JSON.stringify(args);

    if (cache[key] !== undefined) {
      cacheHits++;
      return cache[key];
    }

    cacheMisses++;
    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };

  // Cache stats dekhne ke liye
  memoized.stats = function() {
    return {
      hits: cacheHits,
      misses: cacheMisses,
      cacheSize: Object.keys(cache).length
    };
  };

  memoized.clearCache = function() {
    Object.keys(cache).forEach(key => delete cache[key]);
    cacheHits = 0;
    cacheMisses = 0;
  };

  return memoized;
}

// Fibonacci — without memoize (slow!)
function fibSlow(n) {
  if (n <= 1) return n;
  return fibSlow(n - 1) + fibSlow(n - 2);
}

// Fibonacci — with memoize (fast!)
const fibFast = memoize(function fib(n) {
  if (n <= 1) return n;
  return fibFast(n - 1) + fibFast(n - 2);
});

// Performance test
console.time("Without memoize");
console.log(fibSlow(35));  // Slow — bohot time lagega
console.timeEnd("Without memoize");

console.time("With memoize");
console.log(fibFast(35));  // Fast — cached!
console.timeEnd("With memoize");

console.log("Cache stats:", fibFast.stats());
```

> **Expected Output:**
> ```
> 9227465
> Without memoize: ~100ms+
> 9227465
> With memoize: ~1ms
> Cache stats: { hits: 33, misses: 36, cacheSize: 36 }
> ```

---

## Exercise 5: Callback-Based File Operations

### Task: Simple file operations using callbacks

```javascript
// file-ops.js
const fs = require('fs');

// Data folder banao pehle
const DATA_DIR = './farm-data';

// Folder check aur create
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
  console.log("📁 farm-data folder bana diya!");
}

// Farmer data write karo
function writeFarmerData(filename, data, callback) {
  const filePath = `${DATA_DIR}/${filename}`;
  const jsonData = JSON.stringify(data, null, 2);

  fs.writeFile(filePath, jsonData, 'utf8', function(err) {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, `File saved: ${filePath}`);
  });
}

// Farmer data read karo
function readFarmerData(filename, callback) {
  const filePath = `${DATA_DIR}/${filename}`;

  fs.readFile(filePath, 'utf8', function(err, data) {
    if (err) {
      callback(err, null);
      return;
    }
    try {
      const parsed = JSON.parse(data);
      callback(null, parsed);
    } catch (parseError) {
      callback(parseError, null);
    }
  });
}

// Use karo
const farmerData = {
  farmers: [
    { name: "Rajesh", crop: "Wheat", area: 5 },
    { name: "Priya", crop: "Rice", area: 3 }
  ],
  updatedAt: new Date().toISOString()
};

// Write karo, phir read karo — callbacks chained
writeFarmerData('farmers.json', farmerData, function(err, msg) {
  if (err) {
    console.log("❌ Write error:", err.message);
    return;
  }
  console.log("✅", msg);

  // Ab read karo (callback ke andar callback)
  readFarmerData('farmers.json', function(err, data) {
    if (err) {
      console.log("❌ Read error:", err.message);
      return;
    }
    console.log("📄 Farmer data:");
    data.farmers.forEach(f => {
      console.log(`   ${f.name} - ${f.crop} (${f.area} acres)`);
    });
  });
});
```

> **Terminal Command:**
> ```bash
> node file-ops.js
> ```

---

## Exercise 6: Event-Driven Pattern with Callbacks

### Task: Simple Event Emitter banao (closure + callbacks)

```javascript
// event-system.js

function createEventSystem() {
  // Private event listeners store
  const listeners = {};

  return {
    // Event pe listener register karo
    on(event, callback) {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
      console.log(`📌 Listener added for: "${event}"`);
    },

    // Event fire karo — saare listeners call honge
    emit(event, data) {
      if (!listeners[event] || listeners[event].length === 0) {
        console.log(`⚠️ No listeners for: "${event}"`);
        return;
      }
      console.log(`🔔 Event fired: "${event}"`);
      listeners[event].forEach(callback => callback(data));
    },

    // Listener remove karo
    off(event, callback) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(cb => cb !== callback);
      console.log(`🗑️ Listener removed for: "${event}"`);
    },

    // Ek baar fire hone ke baad automatically remove
    once(event, callback) {
      const wrapper = (data) => {
        callback(data);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
    }
  };
}

// Farm Event System
const farmEvents = createEventSystem();

// Listeners register karo
farmEvents.on("harvest", (data) => {
  console.log(`🌾 Harvest complete! ${data.crop}: ${data.quantity} quintals`);
});

farmEvents.on("harvest", (data) => {
  console.log(`📊 Updating inventory for ${data.crop}...`);
});

farmEvents.on("weather-alert", (data) => {
  console.log(`⛈️ Weather Alert: ${data.message}`);
});

// One-time event
farmEvents.once("system-start", (data) => {
  console.log(`🚀 System started at ${data.time}`);
});

// Events fire karo
farmEvents.emit("system-start", { time: new Date().toLocaleTimeString() });
farmEvents.emit("system-start", { time: "again" });  // Ye fire nahi hoga!

farmEvents.emit("harvest", { crop: "Wheat", quantity: 50 });
farmEvents.emit("weather-alert", { message: "Heavy rain expected tomorrow!" });
```

> **Yaad Rakho:** Ye pattern Node.js ke core `EventEmitter` jaisa hai. Real applications mein events ka pattern har jagah use hota hai — button clicks, API requests, file operations sab event-driven hain.

---

## Exercise 7: Callback Hell Refactored

### Task: Nested callbacks ko clean code mein convert karo

```javascript
// callback-hell.js — BEFORE (messy)

// ❌ Callback Hell version
function processOrder_ugly(orderId) {
  getOrder(orderId, function(err, order) {
    if (err) { console.log(err); return; }
    getCustomer(order.customerId, function(err, customer) {
      if (err) { console.log(err); return; }
      getAddress(customer.addressId, function(err, address) {
        if (err) { console.log(err); return; }
        calculateShipping(address, function(err, shipping) {
          if (err) { console.log(err); return; }
          console.log("Order processed:", { order, customer, address, shipping });
        });
      });
    });
  });
}

// ✅ Clean version — Named functions
function processOrder_clean(orderId) {
  getOrder(orderId, handleOrder);
}

function handleOrder(err, order) {
  if (err) { console.log("Order error:", err); return; }
  console.log("Order found:", order.id);
  getCustomer(order.customerId, handleCustomer);
}

function handleCustomer(err, customer) {
  if (err) { console.log("Customer error:", err); return; }
  console.log("Customer found:", customer.name);
  getAddress(customer.addressId, handleAddress);
}

function handleAddress(err, address) {
  if (err) { console.log("Address error:", err); return; }
  console.log("Address found:", address.city);
  calculateShipping(address, handleShipping);
}

function handleShipping(err, shipping) {
  if (err) { console.log("Shipping error:", err); return; }
  console.log("Shipping cost:", shipping.cost);
  console.log("✅ Order processing complete!");
}

// Mock functions for testing
function getOrder(id, cb) {
  setTimeout(() => cb(null, { id, customerId: 42 }), 100);
}
function getCustomer(id, cb) {
  setTimeout(() => cb(null, { id, name: "Rajesh", addressId: 7 }), 100);
}
function getAddress(id, cb) {
  setTimeout(() => cb(null, { id, city: "Jaipur", pin: "302001" }), 100);
}
function calculateShipping(addr, cb) {
  setTimeout(() => cb(null, { cost: 150, method: "Express" }), 100);
}

// Test karo
processOrder_clean("ORD-001");
```

---

## Mini Challenge: Rate Limiter using Closures

### Task: Function call limiter banao

```javascript
// rate-limiter.js

function createRateLimiter(maxCalls, timeWindowMs) {
  const calls = [];  // Closure mein timestamps store

  return function(fn, ...args) {
    const now = Date.now();

    // Purane calls (time window se bahar) hatao
    while (calls.length > 0 && calls[0] <= now - timeWindowMs) {
      calls.shift();
    }

    // Check karo limit cross to nahi hui
    if (calls.length >= maxCalls) {
      console.log(`⛔ Rate limit exceeded! Max ${maxCalls} calls per ${timeWindowMs}ms`);
      console.log(`   Try again in ${timeWindowMs - (now - calls[0])}ms`);
      return null;
    }

    // Call allow karo
    calls.push(now);
    console.log(`✅ Call ${calls.length}/${maxCalls} — allowed`);
    return fn(...args);
  };
}

// Test: Max 3 calls per 5 seconds
const limiter = createRateLimiter(3, 5000);

function fetchData(id) {
  return `Data for farmer #${id}`;
}

console.log(limiter(fetchData, 1));  // ✅ Call 1/3
console.log(limiter(fetchData, 2));  // ✅ Call 2/3
console.log(limiter(fetchData, 3));  // ✅ Call 3/3
console.log(limiter(fetchData, 4));  // ⛔ Rate limit exceeded!
```

> **Practice Time!** Is rate limiter mein `reset()` function add karo jo saare calls clear kar de.

---

## Quick Revision Table

| Exercise | Closure Concept Used | Key Learning |
|----------|---------------------|-------------|
| Counter | Private variable | State encapsulation |
| Farm Manager | Private array + counter | Data hiding |
| Factory | Returned function | Customized functions |
| Memoize | Cache object | Performance optimization |
| File Ops | Callback pattern | Async operations |
| Event System | Listeners object | Event-driven pattern |
| Rate Limiter | Timestamps array | Access control |

---

## Aaj Kya Seekha?

1. **Closure se counter** banaya — private state manage kiya
2. **Data hiding** implement kiya — farm manager mein private data
3. **Function factory** pattern use kiya — discount calculators
4. **Memoization** se performance improve kiya — Fibonacci example
5. **Callback-based file operations** kiye — read/write with error handling
6. **Event system** banaya using closures — Node.js EventEmitter jaisa
7. **Callback hell** ko clean code mein convert kiya — named functions se
8. **Rate limiter** banaya — closure se real-world problem solve kiya

> **Yaad Rakho:** Closures JavaScript ka foundation hai. Jo aaj practice kiya — ye patterns React mein (useState), Node.js mein (middleware), aur har jagah milenge. Kal hum Promises aur Async/Await seekhenge — jo callback hell ka permanent solution hai!
