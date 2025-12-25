# Day 20 Evening: Promises & Async/Await — Hands-On Practice

> **Aaj ka plan:** Ab Promises aur Async/Await ko practically use karenge. Callbacks ko promises mein convert karenge, API fetch simulate karenge, parallel calls practice karenge, aur real-world async patterns implement karenge.

---

## Exercise 1: Basic Promise Creation

### Task: Custom promises banao aur handle karo

```javascript
// promise-basics.js

// 1. Simple Promise — crop harvest simulation
function harvestCrop(cropName, daysToHarvest) {
  return new Promise((resolve, reject) => {
    console.log(`🌱 ${cropName} ki harvesting shuru...`);

    setTimeout(() => {
      // 80% chance success, 20% chance failure
      const success = Math.random() > 0.2;

      if (success) {
        resolve({
          crop: cropName,
          quantity: Math.floor(Math.random() * 100) + 10,
          quality: "A Grade"
        });
      } else {
        reject(new Error(`${cropName} ki fasal kharab ho gayi! Baarish ka asar.`));
      }
    }, daysToHarvest * 100);  // Simulate days
  });
}

// Handle karo
harvestCrop("Wheat", 10)
  .then(result => {
    console.log(`✅ Harvest successful!`);
    console.log(`   Crop: ${result.crop}`);
    console.log(`   Quantity: ${result.quantity} quintals`);
    console.log(`   Quality: ${result.quality}`);
  })
  .catch(error => {
    console.log(`❌ ${error.message}`);
  })
  .finally(() => {
    console.log(`📋 Harvest season report complete.`);
  });
```

> **Terminal Command:**
> ```bash
> node promise-basics.js
> ```

### Task: Promise-based delay function

```javascript
// delay.js

// Reusable delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Use karo — step by step execution with delays
async function farmingProcess() {
  console.log("🌱 Step 1: Beej boya...");
  await delay(1000);

  console.log("💧 Step 2: Paani diya...");
  await delay(1000);

  console.log("🧪 Step 3: Fertilizer daala...");
  await delay(1000);

  console.log("☀️ Step 4: Dhoop mein bada ho raha hai...");
  await delay(2000);

  console.log("🌾 Step 5: Fasal taiyaar! Harvest time!");
}

farmingProcess();
```

> **Practice Time!** Ek `retry(fn, maxAttempts)` function banao jo promise fail hone pe dubara try kare.

---

## Exercise 2: Convert Callbacks to Promises

### Task: Callback-based functions ko Promise mein convert karo

```javascript
// callback-to-promise.js
const fs = require('fs');

// ❌ OLD: Callback style
function readFileCallback(path, callback) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) callback(err, null);
    else callback(null, data);
  });
}

// ✅ NEW: Promise style
function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// ✅ BEST: util.promisify use karo (Node.js built-in)
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Test karo
async function main() {
  try {
    // File likho
    const farmerData = JSON.stringify({
      farmers: [
        { name: "Rajesh", crop: "Wheat" },
        { name: "Priya", crop: "Rice" }
      ]
    }, null, 2);

    await writeFileAsync('farmers.json', farmerData, 'utf8');
    console.log("✅ File written successfully!");

    // File padho
    const data = await readFileAsync('farmers.json', 'utf8');
    const parsed = JSON.parse(data);
    console.log("📄 Farmers:", parsed.farmers);

  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main();
```

### Custom Promisify Function Banao

```javascript
// custom-promisify.js

// Apna promisify banao — samjho kaise kaam karta hai
function myPromisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      // Original function ko call karo with callback
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// Test karo
const myReadFile = myPromisify(fs.readFile);

myReadFile('farmers.json', 'utf8')
  .then(data => console.log("✅ Data:", data))
  .catch(err => console.log("❌ Error:", err.message));
```

> **Yaad Rakho:** `util.promisify` Node.js ka built-in function hai. Ye kisi bhi callback-based function (jo last argument mein `(err, result)` callback le) ko Promise-based bana deta hai.

---

## Exercise 3: API Fetch Simulation

### Task: Fake API calls simulate karo aur chain karo

```javascript
// api-simulation.js

// Fake database
const database = {
  users: {
    1: { id: 1, name: "Rajesh", role: "farmer", farmId: 101 },
    2: { id: 2, name: "Priya", role: "farmer", farmId: 102 },
    3: { id: 3, name: "Admin", role: "admin", farmId: null }
  },
  farms: {
    101: { id: 101, location: "Jaipur", area: "50 acres", cropIds: [201, 202] },
    102: { id: 102, location: "Udaipur", area: "30 acres", cropIds: [203] }
  },
  crops: {
    201: { id: 201, name: "Wheat", season: "Rabi", pricePerQuintal: 2000 },
    202: { id: 202, name: "Mustard", season: "Rabi", pricePerQuintal: 5000 },
    203: { id: 203, name: "Rice", season: "Kharif", pricePerQuintal: 3000 }
  }
};

// API functions — simulate network delay
function fetchUser(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = database.users[userId];
      if (user) resolve(user);
      else reject(new Error(`User #${userId} not found!`));
    }, 500);
  });
}

function fetchFarm(farmId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const farm = database.farms[farmId];
      if (farm) resolve(farm);
      else reject(new Error(`Farm #${farmId} not found!`));
    }, 500);
  });
}

function fetchCrop(cropId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const crop = database.crops[cropId];
      if (crop) resolve(crop);
      else reject(new Error(`Crop #${cropId} not found!`));
    }, 300);
  });
}

// ✅ Async/Await se complete farmer profile fetch karo
async function getFarmerProfile(userId) {
  try {
    console.log(`\n🔍 Fetching profile for User #${userId}...`);
    console.time("Total time");

    // Step 1: User fetch karo
    const user = await fetchUser(userId);
    console.log(`👤 User: ${user.name} (${user.role})`);

    if (!user.farmId) {
      console.log("⚠️ User is not a farmer!");
      return null;
    }

    // Step 2: Farm fetch karo
    const farm = await fetchFarm(user.farmId);
    console.log(`🌾 Farm: ${farm.location} (${farm.area})`);

    // Step 3: Crops parallel mein fetch karo (independent hain)
    const crops = await Promise.all(
      farm.cropIds.map(id => fetchCrop(id))
    );
    console.log(`🌿 Crops:`);
    crops.forEach(crop => {
      console.log(`   - ${crop.name} (${crop.season}) ₹${crop.pricePerQuintal}/quintal`);
    });

    console.timeEnd("Total time");

    return { user, farm, crops };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

// Test karo
getFarmerProfile(1);
// After first completes, run another
setTimeout(() => getFarmerProfile(2), 2000);
setTimeout(() => getFarmerProfile(99), 4000);  // Error case
```

> **Expected Output:**
> ```
> 🔍 Fetching profile for User #1...
> 👤 User: Rajesh (farmer)
> 🌾 Farm: Jaipur (50 acres)
> 🌿 Crops:
>    - Wheat (Rabi) ₹2000/quintal
>    - Mustard (Rabi) ₹5000/quintal
> Total time: ~1300ms
> ```

---

## Exercise 4: Promise.all — Parallel Dashboard Loading

### Task: Dashboard ke liye multiple APIs simultaneously call karo

```javascript
// dashboard.js

// Simulate different API endpoints
function fetchFarmerCount() {
  return new Promise(resolve => {
    setTimeout(() => resolve({ total: 1500, active: 1200 }), 800);
  });
}

function fetchTodayWeather() {
  return new Promise(resolve => {
    setTimeout(() => resolve({
      temp: "34°C",
      humidity: "65%",
      condition: "Partly Cloudy",
      advisory: "Paani dena zaroori hai"
    }), 600);
  });
}

function fetchMarketPrices() {
  return new Promise(resolve => {
    setTimeout(() => resolve({
      wheat: 2100,
      rice: 3200,
      cotton: 6500,
      sugarcane: 350
    }), 1000);
  });
}

function fetchNotifications() {
  return new Promise(resolve => {
    setTimeout(() => resolve([
      "Subsidy application deadline: 15 April",
      "New crop insurance scheme launched",
      "Mandi prices updated"
    ]), 400);
  });
}

// Dashboard load karo — sab parallel!
async function loadDashboard() {
  console.log("📊 Loading Farm Dashboard...\n");
  console.time("Dashboard loaded in");

  try {
    const [farmers, weather, prices, notifications] = await Promise.all([
      fetchFarmerCount(),
      fetchTodayWeather(),
      fetchMarketPrices(),
      fetchNotifications()
    ]);

    // Display dashboard
    console.log("=== FARM DASHBOARD ===\n");

    console.log("👥 Farmers:");
    console.log(`   Total: ${farmers.total} | Active: ${farmers.active}\n`);

    console.log("🌤️ Weather:");
    console.log(`   ${weather.temp} | ${weather.humidity} humidity`);
    console.log(`   ${weather.condition}`);
    console.log(`   Advisory: ${weather.advisory}\n`);

    console.log("💰 Market Prices (₹/quintal):");
    Object.entries(prices).forEach(([crop, price]) => {
      console.log(`   ${crop}: ₹${price}`);
    });

    console.log("\n🔔 Notifications:");
    notifications.forEach((notif, i) => {
      console.log(`   ${i + 1}. ${notif}`);
    });

    console.timeEnd("\nDashboard loaded in");

  } catch (error) {
    console.log("❌ Dashboard load failed:", error.message);
  }
}

loadDashboard();
```

---

## Exercise 5: Error Handling Patterns

### Task: Robust error handling with async/await

```javascript
// error-patterns.js

// Pattern 1: Individual try/catch
async function safeOperation() {
  let user, farm;

  try {
    user = await fetchUser(1);
  } catch (error) {
    console.log("User fetch failed, using default");
    user = { name: "Guest", farmId: null };
  }

  if (user.farmId) {
    try {
      farm = await fetchFarm(user.farmId);
    } catch (error) {
      console.log("Farm fetch failed");
      farm = null;
    }
  }

  return { user, farm };
}

// Pattern 2: Wrapper function — Go-style error handling
async function safeAwait(promise) {
  try {
    const result = await promise;
    return [null, result];  // [error, data]
  } catch (error) {
    return [error, null];   // [error, data]
  }
}

// Usage — clean error handling!
async function main() {
  const [userErr, user] = await safeAwait(fetchUser(1));
  if (userErr) {
    console.log("User error:", userErr.message);
    return;
  }
  console.log("User:", user.name);

  const [farmErr, farm] = await safeAwait(fetchFarm(user.farmId));
  if (farmErr) {
    console.log("Farm error:", farmErr.message);
    return;
  }
  console.log("Farm:", farm.location);
}

// Pattern 3: Retry with exponential backoff
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      console.log(`✅ Success on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts`);
      }
      // Wait before retry — exponential backoff
      const waitTime = Math.pow(2, attempt) * 100;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Test retry
async function unreliableAPI() {
  // 70% chance fail
  if (Math.random() > 0.3) {
    throw new Error("Server error 500");
  }
  return { data: "Success!" };
}

fetchWithRetry(unreliableAPI, 5)
  .then(result => console.log("Final result:", result))
  .catch(err => console.log("Final error:", err.message));

// Helper functions from Exercise 3
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: "Rajesh", farmId: 101 });
      else reject(new Error("Invalid user ID"));
    }, 300);
  });
}

function fetchFarm(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id) resolve({ id, location: "Jaipur" });
      else reject(new Error("Invalid farm ID"));
    }, 300);
  });
}
```

> **Yaad Rakho:** `safeAwait` pattern bohot popular hai — ye Go language ke error handling style se inspired hai. `[error, data]` return karta hai — clean aur readable!

---

## Exercise 6: Promise.allSettled — Graceful Degradation

### Task: Dashboard mein kuch APIs fail ho jaye to bhi baaki data dikhao

```javascript
// graceful-dashboard.js

function fetchFarmers() {
  return new Promise(resolve =>
    setTimeout(() => resolve(["Rajesh", "Priya", "Suresh"]), 500)
  );
}

function fetchPrices() {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Price API down!")), 300)
  );
}

function fetchAlerts() {
  return new Promise(resolve =>
    setTimeout(() => resolve(["Heavy rain alert"]), 400)
  );
}

async function loadGracefulDashboard() {
  console.log("Loading dashboard (some APIs may fail)...\n");

  const results = await Promise.allSettled([
    fetchFarmers(),
    fetchPrices(),
    fetchAlerts()
  ]);

  const labels = ["Farmers", "Prices", "Alerts"];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(`✅ ${labels[index]}:`, result.value);
    } else {
      console.log(`❌ ${labels[index]}: Unavailable (${result.reason.message})`);
    }
  });

  // Count successes and failures
  const succeeded = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;
  console.log(`\n📊 ${succeeded} succeeded, ${failed} failed out of ${results.length}`);
}

loadGracefulDashboard();
```

---

## Mini Challenge: Async Task Queue

### Task: Ek task queue banao jo promises ko sequentially ya parallel execute kare

```javascript
// task-queue.js

function createTaskQueue() {
  const tasks = [];
  const results = [];

  return {
    // Task add karo (function jo promise return kare)
    add(taskFn, label) {
      tasks.push({ fn: taskFn, label });
      console.log(`📌 Task added: "${label}"`);
    },

    // Sequential execution — ek ke baad ek
    async runSequential() {
      console.log("\n🔄 Running tasks sequentially...");
      console.time("Sequential");

      for (const task of tasks) {
        try {
          const result = await task.fn();
          results.push({ label: task.label, status: "success", result });
          console.log(`  ✅ ${task.label}: Done`);
        } catch (error) {
          results.push({ label: task.label, status: "error", error: error.message });
          console.log(`  ❌ ${task.label}: ${error.message}`);
        }
      }

      console.timeEnd("Sequential");
      return results;
    },

    // Parallel execution — sab ek saath
    async runParallel() {
      console.log("\n⚡ Running tasks in parallel...");
      console.time("Parallel");

      const promises = tasks.map(async (task) => {
        try {
          const result = await task.fn();
          return { label: task.label, status: "success", result };
        } catch (error) {
          return { label: task.label, status: "error", error: error.message };
        }
      });

      const parallelResults = await Promise.all(promises);
      parallelResults.forEach(r => {
        const icon = r.status === "success" ? "✅" : "❌";
        console.log(`  ${icon} ${r.label}`);
      });

      console.timeEnd("Parallel");
      return parallelResults;
    }
  };
}

// Test karo
const queue = createTaskQueue();

// Tasks add karo
queue.add(
  () => new Promise(resolve => setTimeout(() => resolve("Farmer data"), 1000)),
  "Fetch Farmers"
);
queue.add(
  () => new Promise(resolve => setTimeout(() => resolve("Crop data"), 1500)),
  "Fetch Crops"
);
queue.add(
  () => new Promise(resolve => setTimeout(() => resolve("Weather data"), 800)),
  "Fetch Weather"
);

// Sequential run (3+ seconds)
queue.runSequential().then(() => {
  // Parallel run (1.5 seconds max)
  const queue2 = createTaskQueue();
  queue2.add(
    () => new Promise(resolve => setTimeout(() => resolve("A"), 1000)),
    "Task A"
  );
  queue2.add(
    () => new Promise(resolve => setTimeout(() => resolve("B"), 1500)),
    "Task B"
  );
  queue2.add(
    () => new Promise(resolve => setTimeout(() => resolve("C"), 800)),
    "Task C"
  );
  queue2.runParallel();
});
```

> **Practice Time!** Task queue mein `runWithConcurrency(limit)` add karo — jaise max 2 tasks ek saath run hon.

---

## Quick Revision Table

| Exercise | Pattern Used | Key Learning |
|----------|-------------|--------------|
| Harvest simulation | Basic Promise | resolve/reject |
| Callback to Promise | promisify | Migration pattern |
| API simulation | async/await + chaining | Real-world data flow |
| Dashboard | Promise.all | Parallel loading |
| Error patterns | safeAwait, retry | Robust error handling |
| Graceful degradation | Promise.allSettled | Partial failure handling |
| Task queue | Sequential + Parallel | Execution control |

---

## Aaj Kya Seekha?

1. **Promise creation** kiya — resolve/reject handle kiya
2. **Callbacks ko Promises mein convert** kiya — util.promisify bhi seekha
3. **API fetch simulation** — real-world data flow implement kiya
4. **Promise.all** — parallel dashboard loading
5. **Error handling patterns** — safeAwait, retry with backoff
6. **Promise.allSettled** — graceful degradation pattern
7. **Task queue** — sequential aur parallel execution control kiya
8. **async/await** — modern syntax practically use kiya

> **Yaad Rakho:** Promises aur Async/Await — ye Node.js backend ka DNA hai. Har database query, har API call, har file operation — sab async hai. Jo developer ye ache se jaanta hai, wo backend confidently build kar sakta hai!
