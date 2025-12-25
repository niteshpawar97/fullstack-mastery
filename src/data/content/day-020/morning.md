# Day 20 Morning: JS Advanced — Promises & Async/Await

> **Aaj ka plan:** Aaj hum JavaScript ke asynchronous programming ka sabse important topic cover karenge — Promises aur Async/Await. Callback hell ka permanent solution! Samjhenge ki Promise kya hai, kaise kaam karta hai, .then/.catch chains, Promise.all/race, aur modern async/await syntax.

---

## Pehle Samjho — Synchronous vs Asynchronous

### Synchronous (Ek ke baad ek)

```javascript
// Synchronous — Line by line execute hota hai
console.log("1. Kisan ne beej boya");        // Pehle ye
console.log("2. Paani diya");                // Phir ye
console.log("3. Fasal taiyaar");             // Phir ye
// Sab order mein — ek khatam to doosra
```

### Asynchronous (Parallel mein kaam)

```javascript
// Asynchronous — Wait nahi karta, aage badh jaata hai
console.log("1. Kisan ne beej boya");

setTimeout(() => {
  console.log("2. 3 mahine baad fasal taiyaar");  // Ye LAST mein aayega
}, 3000);

console.log("3. Tab tak doosra kaam karo");  // Ye PEHLE aayega

// Output:
// 1. Kisan ne beej boya
// 3. Tab tak doosra kaam karo
// 2. 3 mahine baad fasal taiyaar (3 second baad)
```

> **Socho Aise:** Synchronous matlab tum queue mein khade ho — tumhara number aaye tab hi counter pe jaoge. Asynchronous matlab tumne token liya aur baithke doosra kaam karte raho — number aaye to buzzer bajega!

---

## Promise Kya Hai?

Promise ek **object** hai jo future mein milne wali value ko represent karta hai.

### Promise Ke 3 States

| State | Matlab | Analogy |
|-------|--------|---------|
| **Pending** | Abhi process ho raha hai | Order diya, khana ban raha hai |
| **Fulfilled** | Kaam successfully ho gaya | Khana aa gaya! |
| **Rejected** | Kuch galat ho gaya | Khana nahi ban paya, error! |

```javascript
// Promise banao
const farmerPromise = new Promise((resolve, reject) => {
  const cropReady = true;  // Simulation

  setTimeout(() => {
    if (cropReady) {
      resolve({ crop: "Wheat", quantity: "50 quintals" });  // Success!
    } else {
      reject(new Error("Fasal kharab ho gayi!"));  // Failure!
    }
  }, 2000);
});

console.log(farmerPromise);  // Promise { <pending> }
```

> **Socho Aise:** Promise ek "promise card" jaisa hai. Restaurant mein order diya — unhone bola "Aapka khana 20 min mein aayega." Wo card tumhare paas hai (pending). 20 min baad ya to khana aayega (fulfilled) ya bolenge "Sorry, item available nahi hai" (rejected).

---

## .then(), .catch(), .finally()

### Promise Ko Handle Karo

```javascript
// Promise create karo
function fetchFarmerData(farmerId) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Farmer #${farmerId} ka data dhundh rahe hain...`);

    setTimeout(() => {
      if (farmerId > 0) {
        resolve({
          id: farmerId,
          name: "Rajesh",
          crop: "Wheat",
          area: "5 acres"
        });
      } else {
        reject(new Error("Invalid farmer ID!"));
      }
    }, 1500);
  });
}

// .then() — jab promise FULFILL ho
// .catch() — jab promise REJECT ho
// .finally() — DONO cases mein chale
fetchFarmerData(1)
  .then(farmer => {
    console.log("✅ Farmer mila:", farmer.name);
    console.log(`   Crop: ${farmer.crop}, Area: ${farmer.area}`);
  })
  .catch(error => {
    console.log("❌ Error:", error.message);
  })
  .finally(() => {
    console.log("📋 Data fetch operation complete.");
  });
```

> **Expected Output:**
> ```
> 🔍 Farmer #1 ka data dhundh rahe hain...
> ✅ Farmer mila: Rajesh
>    Crop: Wheat, Area: 5 acres
> 📋 Data fetch operation complete.
> ```

### Promise Chaining — .then() ke baad .then()

```javascript
// Ek ke baad ek operations — clean chain!
function getUser(id) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ id, name: "Rajesh", farmId: 42 }), 500);
  });
}

function getFarm(farmId) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ id: farmId, location: "Jaipur", crops: ["Wheat", "Rice"] }), 500);
  });
}

function getWeather(location) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ location, temp: "32°C", condition: "Sunny" }), 500);
  });
}

// Chain — ek ke baad ek, cleanly!
getUser(1)
  .then(user => {
    console.log(`👤 User: ${user.name}`);
    return getFarm(user.farmId);  // Next promise return karo
  })
  .then(farm => {
    console.log(`🌾 Farm: ${farm.location}`);
    return getWeather(farm.location);  // Next promise return karo
  })
  .then(weather => {
    console.log(`🌤️ Weather: ${weather.temp}, ${weather.condition}`);
  })
  .catch(error => {
    console.log("❌ Kuch galat ho gaya:", error.message);
  });

// Compare karo callback hell se — kitna clean hai!
```

> **Yaad Rakho:** `.then()` mein jo bhi return karo — wo next `.then()` ko milta hai. Agar Promise return karo to wo resolve hone tak wait karta hai. Ye hai Promise chaining ka power!

---

## Promise.all() — Parallel Execution

Jab multiple promises ko **saath mein** run karna ho aur **sab ka result** chahiye:

```javascript
// Teenon APIs simultaneously call karo
const farmerAPI = new Promise(resolve => {
  setTimeout(() => resolve({ farmers: 150 }), 2000);
});

const cropAPI = new Promise(resolve => {
  setTimeout(() => resolve({ crops: ["Wheat", "Rice", "Cotton"] }), 1500);
});

const weatherAPI = new Promise(resolve => {
  setTimeout(() => resolve({ temp: "32°C" }), 1000);
});

console.time("Promise.all");
Promise.all([farmerAPI, cropAPI, weatherAPI])
  .then(([farmers, crops, weather]) => {
    // Destructuring — teenon results ek saath!
    console.log("Farmers:", farmers);
    console.log("Crops:", crops);
    console.log("Weather:", weather);
    console.timeEnd("Promise.all");
    // ~2000ms (sabse slow promise jitna time)
  })
  .catch(error => {
    // Agar KISI BHI ek promise mein error aaya — sab fail!
    console.log("Error:", error.message);
  });
```

> **Socho Aise:** Promise.all aise hai jaise tum 3 dukaan pe order diya ek saath. Jab TEENON ka saamaan aa jaaye, tab packing shuru hogi. Agar ek bhi na aaye — poora order cancel!

---

## Promise.race() — Pehla Result Lo

Jo promise **sabse pehle** complete ho, uska result lo:

```javascript
// Konsa server sabse fast respond karta hai?
const server1 = new Promise(resolve => {
  setTimeout(() => resolve("Server 1: Mumbai (200ms)"), 200);
});

const server2 = new Promise(resolve => {
  setTimeout(() => resolve("Server 2: Delhi (100ms)"), 100);
});

const server3 = new Promise(resolve => {
  setTimeout(() => resolve("Server 3: Bangalore (300ms)"), 300);
});

Promise.race([server1, server2, server3])
  .then(winner => {
    console.log("🏆 Winner:", winner);
    // "Server 2: Delhi (100ms)" — sabse fast!
  });
```

> **Tip:** `Promise.race()` timeout implement karne ke liye useful hai — ek actual API call aur ek timeout promise race karao.

```javascript
// Timeout pattern
function fetchWithTimeout(url, timeoutMs) {
  const fetchPromise = fetch(url);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout!")), timeoutMs);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}
```

---

## Promise.allSettled() — Sab Ka Result Chahiye

Promise.all mein ek fail hone pe sab fail hota hai. `allSettled` mein sab ka result milta hai — chahe pass ho ya fail:

```javascript
const api1 = Promise.resolve({ data: "Farmer list" });
const api2 = Promise.reject(new Error("Database down!"));
const api3 = Promise.resolve({ data: "Crop prices" });

Promise.allSettled([api1, api2, api3])
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`API ${index + 1}: ✅`, result.value);
      } else {
        console.log(`API ${index + 1}: ❌`, result.reason.message);
      }
    });
  });

// Output:
// API 1: ✅ { data: "Farmer list" }
// API 2: ❌ Database down!
// API 3: ✅ { data: "Crop prices" }
```

> **Yaad Rakho:** `Promise.all` = sab pass hone chahiye. `Promise.allSettled` = sab ka result chahiye, fail bhi chalega.

---

## Async/Await — Modern Syntax

### Async/Await Kya Hai?

Promises ko **synchronous style** mein likhne ka tarika. Under the hood ye Promises hi use karta hai!

```javascript
// Promise chain wala code (.then style)
function getDataPromise() {
  return getUser(1)
    .then(user => getFarm(user.farmId))
    .then(farm => getWeather(farm.location))
    .then(weather => console.log(weather));
}

// Same code with async/await — kitna clean!
async function getDataAsync() {
  const user = await getUser(1);         // Wait karo jab tak user mile
  const farm = await getFarm(user.farmId);  // Wait karo jab tak farm mile
  const weather = await getWeather(farm.location);  // Wait karo
  console.log(weather);
}

getDataAsync();
```

> **Socho Aise:** `await` matlab "ruko, pehle ye kaam hone do." Jaise tum chai bana rahe ho — "pehle paani ubalne do (await), phir chai patti daalo (await), phir doodh daalo." Step by step, lekin peeche asynchronous hai!

### Async Function Rules

```javascript
// 1. 'async' keyword lagao function ke pehle
async function fetchData() {
  // 2. 'await' sirf async function ke andar use ho sakta hai
  const result = await somePromise;
  return result;  // 3. Async function HAMESHA promise return karta hai
}

// Arrow function ke saath
const fetchData2 = async () => {
  const result = await somePromise;
  return result;
};
```

---

## Error Handling — try/catch with Async/Await

```javascript
async function getFarmerInfo(farmerId) {
  try {
    console.log("🔍 Searching farmer...");
    const farmer = await fetchFarmerData(farmerId);
    console.log("✅ Found:", farmer.name);

    console.log("🌾 Getting crop details...");
    const crops = await getCropDetails(farmer.id);
    console.log("✅ Crops:", crops);

    return { farmer, crops };
  } catch (error) {
    // Kisi bhi await mein error aaye — yahan catch hoga
    console.log("❌ Error:", error.message);
    return null;
  } finally {
    // Hamesha chalega — error ho ya na ho
    console.log("📋 Operation complete.");
  }
}

// Helper functions
function fetchFarmerData(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: "Rajesh" });
      } else {
        reject(new Error("Invalid ID"));
      }
    }, 1000);
  });
}

function getCropDetails(farmerId) {
  return new Promise(resolve => {
    setTimeout(() => resolve(["Wheat", "Rice"]), 500);
  });
}

// Test karo
getFarmerInfo(1);   // Success case
getFarmerInfo(-1);  // Error case
```

---

## Parallel with Async/Await

```javascript
// ❌ Sequential — ek ke baad ek (slow!)
async function fetchAllSlow() {
  console.time("Sequential");
  const farmers = await fetchFarmers();   // 2 sec wait
  const crops = await fetchCrops();       // 2 sec wait
  const weather = await fetchWeather();   // 2 sec wait
  console.timeEnd("Sequential");         // ~6 seconds!
}

// ✅ Parallel — sab ek saath (fast!)
async function fetchAllFast() {
  console.time("Parallel");
  const [farmers, crops, weather] = await Promise.all([
    fetchFarmers(),    // Sab simultaneously
    fetchCrops(),      // start hote hain
    fetchWeather()
  ]);
  console.timeEnd("Parallel");  // ~2 seconds!
  console.log({ farmers, crops, weather });
}

// Helper functions
function fetchFarmers() {
  return new Promise(resolve =>
    setTimeout(() => resolve(["Rajesh", "Priya"]), 2000)
  );
}
function fetchCrops() {
  return new Promise(resolve =>
    setTimeout(() => resolve(["Wheat", "Rice"]), 2000)
  );
}
function fetchWeather() {
  return new Promise(resolve =>
    setTimeout(() => resolve({ temp: "32°C" }), 2000)
  );
}

fetchAllFast();
```

> **Warning:** Agar do operations independent hain (ek ka result doosre ko nahi chahiye), to `Promise.all` use karo parallel execution ke liye. Sequential await mat lagao — time waste hoga!

---

## Promise Methods Summary

| Method | Behaviour | Use Case |
|--------|-----------|----------|
| `Promise.all()` | Sab pass to pass, ek fail to sab fail | Sab results chahiye |
| `Promise.race()` | Pehla complete hone wala win | Timeout, fastest server |
| `Promise.allSettled()` | Sab ka result, fail bhi | Dashboard data loading |
| `Promise.any()` | Pehla SUCCESS wala win | Fallback servers |

---

## Quick Revision Table

| Concept | Kya Hai | Syntax |
|---------|---------|--------|
| Promise | Future value ka object | `new Promise((resolve, reject) => {})` |
| .then() | Success handler | `promise.then(result => {})` |
| .catch() | Error handler | `promise.catch(err => {})` |
| .finally() | Hamesha chale | `promise.finally(() => {})` |
| async | Function ko async banao | `async function name() {}` |
| await | Promise resolve hone tak ruko | `const data = await promise` |
| Promise.all | Sab parallel, sab pass hone chahiye | `Promise.all([p1, p2, p3])` |
| Promise.race | Pehla complete wala win | `Promise.race([p1, p2])` |
| try/catch | Async error handling | `try { await ... } catch(e) {}` |

---

## Aaj Kya Seekha?

1. **Promise** — future value represent karta hai (pending/fulfilled/rejected)
2. **.then/.catch/.finally** — promise handle karne ke methods
3. **Promise chaining** — ek ke baad ek operations, cleanly
4. **Promise.all** — parallel execution, sab ka result ek saath
5. **Promise.race** — pehla complete hone wala win
6. **Promise.allSettled** — sab ka result chahiye, fail bhi
7. **Async/Await** — promises ko synchronous style mein likhna
8. **try/catch** — async code mein error handling
9. **Parallel vs Sequential** — independent operations `Promise.all` se karo

> **Yaad Rakho:** Async/Await modern JavaScript ka standard hai. Har API call, database query, file operation — sab async hain. Ye concept Node.js backend development ka foundation hai. Evening mein hum isko practically use karenge!
