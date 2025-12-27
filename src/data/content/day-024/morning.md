# Day 24 Morning: ES6+ Modern JavaScript

> **Aaj ka plan:** Aaj hum Modern JavaScript (ES6 aur usse aage) ke powerful features seekhenge — destructuring, rest/spread operators, optional chaining, nullish coalescing, Map/Set, Symbol, aur iterators/generators ka introduction. Ye features modern code likhne ke liye essential hain!

---

## Destructuring — Ek Shot Mein Multiple Variables

### Array Destructuring

```javascript
// ❌ OLD way — ek ek karke variable assign karna
const crops = ["Wheat", "Rice", "Cotton"];
const first = crops[0];
const second = crops[1];
const third = crops[2];

// ✅ ES6 way — destructuring
const [crop1, crop2, crop3] = crops;
console.log(crop1);  // "Wheat"
console.log(crop2);  // "Rice"
console.log(crop3);  // "Cotton"
```

> **Socho Aise:** Destructuring aise hai jaise ek gift box kholo aur andar se cheezein alag-alag rakh do — sab kuch ek hi step mein!

### Array Destructuring Tricks

```javascript
// Skip elements
const colors = ["red", "green", "blue", "yellow"];
const [, , thirdColor] = colors;
console.log(thirdColor);  // "blue"

// Default values
const [a = 10, b = 20, c = 30] = [1, 2];
console.log(a, b, c);  // 1, 2, 30 (c ko default mila)

// Swap variables — no temp variable needed!
let x = "Hello";
let y = "World";
[x, y] = [y, x];
console.log(x, y);  // "World", "Hello" — Swapped!

// Rest pattern — baaki sab ek array mein
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head);  // 1
console.log(tail);  // [2, 3, 4, 5]

// Nested destructuring
const matrix = [[1, 2], [3, 4]];
const [[a1, a2], [b1, b2]] = matrix;
console.log(a1, a2, b1, b2);  // 1, 2, 3, 4
```

### Object Destructuring

```javascript
// Farmer object
const farmer = {
  name: "Rajesh",
  age: 45,
  crop: "Wheat",
  area: 5,
  state: "Rajasthan",
  contact: {
    phone: "9876543210",
    email: "rajesh@farm.com"
  }
};

// ❌ OLD way
const name = farmer.name;
const crop = farmer.crop;
const area = farmer.area;

// ✅ ES6 way — object destructuring
const { name: farmerName, crop: farmerCrop, area: farmerArea } = farmer;
console.log(farmerName);  // "Rajesh"

// Same property names? Aur bhi simple!
const { age, state } = farmer;
console.log(age, state);  // 45, "Rajasthan"

// Default values
const { income = 0, experience = "Unknown" } = farmer;
console.log(income);      // 0 (default — farmer mein nahi tha)
console.log(experience);  // "Unknown"

// Rename while destructuring
const { name: n, crop: c } = farmer;
console.log(n, c);  // "Rajesh", "Wheat"

// Nested object destructuring
const { contact: { phone, email } } = farmer;
console.log(phone);  // "9876543210"
console.log(email);  // "rajesh@farm.com"
```

### Function Parameters Mein Destructuring

```javascript
// ❌ OLD way
function displayFarmer(farmer) {
  console.log(farmer.name + " grows " + farmer.crop);
}

// ✅ ES6 way — parameter destructuring
function displayFarmer({ name, crop, area = 0 }) {
  console.log(`${name} grows ${crop} on ${area} acres`);
}

displayFarmer({ name: "Rajesh", crop: "Wheat", area: 5 });
// "Rajesh grows Wheat on 5 acres"

displayFarmer({ name: "Priya", crop: "Rice" });
// "Priya grows Rice on 0 acres" (default area)

// Return multiple values with destructuring
function getFarmerStats(farmers) {
  const total = farmers.length;
  const totalArea = farmers.reduce((s, f) => s + f.area, 0);
  const avgArea = totalArea / total;
  return { total, totalArea, avgArea };
}

const { total, totalArea, avgArea } = getFarmerStats([
  { area: 5 }, { area: 3 }, { area: 7 }
]);
console.log(`${total} farmers, ${totalArea} acres, avg ${avgArea.toFixed(1)}`);
```

> **Yaad Rakho:** Destructuring se code concise aur readable banta hai. Function parameters mein use karo — behtar API design ke liye.

---

## Rest & Spread Operators (...)

### Spread Operator — Expand Karo

```javascript
// Array spread
const winterCrops = ["Wheat", "Mustard", "Peas"];
const summerCrops = ["Rice", "Cotton", "Sugarcane"];

// Combine arrays
const allCrops = [...winterCrops, ...summerCrops];
console.log(allCrops);
// ["Wheat", "Mustard", "Peas", "Rice", "Cotton", "Sugarcane"]

// Array copy (shallow)
const cropsCopy = [...winterCrops];
cropsCopy.push("Barley");
console.log(winterCrops);  // Original safe — ["Wheat", "Mustard", "Peas"]
console.log(cropsCopy);    // Copy changed — ["Wheat", "Mustard", "Peas", "Barley"]

// Object spread
const farmerBase = { name: "Rajesh", crop: "Wheat" };
const farmerFull = { ...farmerBase, area: 5, state: "Rajasthan" };
console.log(farmerFull);
// { name: "Rajesh", crop: "Wheat", area: 5, state: "Rajasthan" }

// Override properties
const updatedFarmer = { ...farmerBase, crop: "Rice", area: 3 };
console.log(updatedFarmer);
// { name: "Rajesh", crop: "Rice", area: 3 }  — crop overridden!
```

> **Socho Aise:** Spread operator `...` aise hai jaise tum ek dabba khol ke uski cheezein bahar bikh dete ho — spread kar dete ho.

### Rest Operator — Collect Karo

```javascript
// Function parameters mein rest
function addFarmers(manager, ...farmers) {
  // manager = pehla argument
  // farmers = baaki sab ek array mein
  console.log(`Manager: ${manager}`);
  console.log(`Farmers: ${farmers.join(', ')}`);
}

addFarmers("Admin", "Rajesh", "Priya", "Suresh");
// Manager: Admin
// Farmers: Rajesh, Priya, Suresh

// Object rest — kuch properties nikal ke baaki collect karo
const farmer = {
  name: "Rajesh",
  age: 45,
  crop: "Wheat",
  area: 5,
  state: "Rajasthan",
  phone: "9876543210"
};

const { name: fName, age: fAge, ...restInfo } = farmer;
console.log(fName);     // "Rajesh"
console.log(fAge);      // 45
console.log(restInfo);  // { crop: "Wheat", area: 5, state: "Rajasthan", phone: "..." }
```

> **Tip:** Rest (`...`) jab **collect** karna ho (function params, destructuring mein). Spread (`...`) jab **expand** karna ho (array/object mein). Same syntax `...` hai — context se pata chalta hai!

---

## Optional Chaining (?.)

### Problem: Nested Object Access

```javascript
// ❌ PROBLEM: Agar property undefined hai to error aata hai
const farmer = {
  name: "Rajesh",
  address: null
};

// console.log(farmer.address.city);
// ❌ TypeError: Cannot read properties of null

// ❌ OLD FIX: Lengthy checking
const city = farmer.address && farmer.address.city
  ? farmer.address.city
  : "Unknown";

// ✅ ES2020: Optional Chaining — clean!
const cityName = farmer.address?.city;
console.log(cityName);  // undefined (no error!)

// Default value ke saath
const cityWithDefault = farmer.address?.city ?? "Unknown";
console.log(cityWithDefault);  // "Unknown"
```

### Optional Chaining — Different Use Cases

```javascript
const farmData = {
  name: "Green Valley Farm",
  owner: {
    name: "Rajesh",
    contact: {
      phone: "9876543210"
    }
  },
  crops: ["Wheat", "Rice"],
  getReport: function() {
    return "Annual Report 2024";
  }
};

// Property access
console.log(farmData.owner?.name);              // "Rajesh"
console.log(farmData.owner?.address?.city);      // undefined (no error!)
console.log(farmData.manager?.name);             // undefined

// Array access
console.log(farmData.crops?.[0]);                // "Wheat"
console.log(farmData.categories?.[0]);           // undefined

// Method call
console.log(farmData.getReport?.());             // "Annual Report 2024"
console.log(farmData.generateInvoice?.());       // undefined (no error!)

// Chaining multiple levels
const phone = farmData.owner?.contact?.phone;
console.log(phone);  // "9876543210"

const email = farmData.owner?.contact?.email?.toLowerCase();
console.log(email);  // undefined
```

> **Yaad Rakho:** `?.` matlab "agar ye exist karta hai to aage badho, nahi to undefined return kar do." Error nahi aayega — safe access!

---

## Nullish Coalescing (??)

### `??` vs `||` — Kya Farak Hai?

```javascript
// || (OR) — falsy values pe trigger hota hai
// Falsy: false, 0, "", null, undefined, NaN

console.log(0 || "default");      // "default" — 0 falsy hai!
console.log("" || "default");     // "default" — "" falsy hai!
console.log(false || "default");  // "default"
console.log(null || "default");   // "default"

// ?? (Nullish Coalescing) — SIRF null/undefined pe trigger
// Ye 0, "", false ko RAKHTA hai

console.log(0 ?? "default");      // 0 — 0 rakh liya!
console.log("" ?? "default");     // "" — empty string rakh liya!
console.log(false ?? "default");  // false — false rakh liya!
console.log(null ?? "default");   // "default"
console.log(undefined ?? "default");  // "default"
```

### Practical Examples

```javascript
// Farmer settings — 0 valid value hai!
const farmer = {
  name: "Rajesh",
  irrigationHours: 0,    // 0 hours = valid (rain-fed farming)
  subsidyAmount: null,    // null = not yet determined
  experience: ""          // Empty string = not provided
};

// ❌ || se problem — 0 ko bhi override kar dega
console.log(farmer.irrigationHours || 8);  // 8 — GALAT! 0 valid tha!

// ✅ ?? se sahi result
console.log(farmer.irrigationHours ?? 8);  // 0 — SAHI!
console.log(farmer.subsidyAmount ?? "TBD");  // "TBD"
console.log(farmer.experience ?? "N/A");     // "" (empty string rakhta hai)

// Optional chaining + nullish coalescing = powerful combo
const config = {
  database: {
    port: 0  // 0 is valid!
  }
};

const port = config.database?.port ?? 3000;
console.log(port);  // 0 (not 3000!)

const host = config.database?.host ?? "localhost";
console.log(host);  // "localhost"
```

> **Warning:** `||` falsy values (0, "", false) ko bhi override karta hai. `??` sirf null/undefined ko override karta hai. Jab 0 ya "" valid value ho, `??` use karo!

---

## Map — Better Objects for Key-Value Pairs

### Map vs Object

```javascript
// Regular Object — keys sirf strings/symbols
const obj = {};
obj["name"] = "Rajesh";
obj[1] = "one";        // 1 convert hota hai "1" string mein
obj[true] = "yes";     // true convert hota hai "true" string mein

// Map — ANY type ka key ho sakta hai!
const farmMap = new Map();

// String keys
farmMap.set("name", "Green Valley Farm");
farmMap.set("location", "Jaipur");

// Number key
farmMap.set(101, { name: "Rajesh", crop: "Wheat" });

// Object key!
const priya = { id: 2, name: "Priya" };
farmMap.set(priya, { crop: "Rice", area: 3 });

// Function key!
const getData = () => {};
farmMap.set(getData, "some data");

console.log(farmMap.get("name"));     // "Green Valley Farm"
console.log(farmMap.get(101));        // { name: "Rajesh", crop: "Wheat" }
console.log(farmMap.get(priya));      // { crop: "Rice", area: 3 }
console.log(farmMap.size);            // 5

// Map methods
farmMap.has("name");    // true
farmMap.delete(101);    // Remove
farmMap.clear();        // Sab remove
```

### Map Iteration

```javascript
const cropPrices = new Map([
  ["Wheat", 2000],
  ["Rice", 3000],
  ["Cotton", 6000],
  ["Sugarcane", 350]
]);

// forEach
cropPrices.forEach((price, crop) => {
  console.log(`${crop}: ₹${price}/quintal`);
});

// for...of with entries
for (const [crop, price] of cropPrices) {
  console.log(`${crop}: ₹${price}`);
}

// Keys aur values alag se
console.log([...cropPrices.keys()]);    // ["Wheat", "Rice", "Cotton", "Sugarcane"]
console.log([...cropPrices.values()]);  // [2000, 3000, 6000, 350]

// Map to Object aur Object to Map
const obj = Object.fromEntries(cropPrices);
console.log(obj);  // { Wheat: 2000, Rice: 3000, ... }

const mapFromObj = new Map(Object.entries(obj));
```

---

## Set — Unique Values Only

### Set Kya Hai?

```javascript
// Set mein sirf unique values hoti hain — duplicates automatically remove
const cropSet = new Set();

cropSet.add("Wheat");
cropSet.add("Rice");
cropSet.add("Wheat");   // Duplicate — add nahi hoga!
cropSet.add("Cotton");
cropSet.add("Rice");    // Duplicate — add nahi hoga!

console.log(cropSet);      // Set { "Wheat", "Rice", "Cotton" }
console.log(cropSet.size); // 3

// Array se duplicates remove — most common use case!
const allCrops = ["Wheat", "Rice", "Wheat", "Cotton", "Rice", "Sugarcane", "Wheat"];
const uniqueCrops = [...new Set(allCrops)];
console.log(uniqueCrops);  // ["Wheat", "Rice", "Cotton", "Sugarcane"]

// Set methods
cropSet.has("Wheat");    // true
cropSet.delete("Rice");  // Remove
cropSet.clear();         // Sab remove

// Set operations (manually)
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// Union (A + B)
const union = new Set([...setA, ...setB]);
console.log(union);  // Set { 1, 2, 3, 4, 5, 6 }

// Intersection (A ∩ B)
const intersection = new Set([...setA].filter(x => setB.has(x)));
console.log(intersection);  // Set { 3, 4 }

// Difference (A - B)
const difference = new Set([...setA].filter(x => !setB.has(x)));
console.log(difference);  // Set { 1, 2 }
```

> **Tip:** Array se duplicates remove karna ho? One-liner: `[...new Set(array)]`

---

## Symbol — Unique Identifiers

### Symbol Kya Hai?

```javascript
// Symbol — har baar unique value banta hai
const id1 = Symbol("farmerId");
const id2 = Symbol("farmerId");

console.log(id1 === id2);  // false! — same description, different symbol

// Use case: Object mein hidden/private-like properties
const FARM_ID = Symbol("farmId");
const INTERNAL_STATE = Symbol("state");

const farmer = {
  name: "Rajesh",
  [FARM_ID]: 42,             // Symbol as key
  [INTERNAL_STATE]: "active"  // Symbol as key
};

console.log(farmer.name);           // "Rajesh"
console.log(farmer[FARM_ID]);       // 42
console.log(Object.keys(farmer));   // ["name"] — Symbols dikhai nahi dete!

// Well-known Symbols
// Symbol.iterator — object ko iterable banao
// Symbol.toPrimitive — type conversion customize karo
```

> **Yaad Rakho:** Symbols advanced topic hai. Main use case: library code mein unique property keys banane ke liye. Beginners ke liye itna jaanna kaafi hai ki ye exist karta hai.

---

## Iterators & Generators (Introduction)

### Iterator Pattern

```javascript
// Custom iterator — manually next() call karo
function createFarmerIterator(farmers) {
  let index = 0;

  return {
    next() {
      if (index < farmers.length) {
        return { value: farmers[index++], done: false };
      }
      return { value: undefined, done: true };
    }
  };
}

const iterator = createFarmerIterator(["Rajesh", "Priya", "Suresh"]);
console.log(iterator.next());  // { value: "Rajesh", done: false }
console.log(iterator.next());  // { value: "Priya", done: false }
console.log(iterator.next());  // { value: "Suresh", done: false }
console.log(iterator.next());  // { value: undefined, done: true }
```

### Generator Functions (function*)

```javascript
// Generator — yield keyword se values ek ek karke deta hai
function* cropGenerator() {
  yield "Wheat";      // Pehli baar next() call pe ye milega
  yield "Rice";       // Doosri baar
  yield "Cotton";     // Teesri baar
}

const gen = cropGenerator();
console.log(gen.next());  // { value: "Wheat", done: false }
console.log(gen.next());  // { value: "Rice", done: false }
console.log(gen.next());  // { value: "Cotton", done: false }
console.log(gen.next());  // { value: undefined, done: true }

// for...of ke saath
for (const crop of cropGenerator()) {
  console.log(crop);
}
// Wheat, Rice, Cotton

// Infinite sequence generator
function* idGenerator() {
  let id = 1;
  while (true) {
    yield id++;  // Infinite — but lazy (jab next() call ho tab hi)
  }
}

const nextId = idGenerator();
console.log(nextId.next().value);  // 1
console.log(nextId.next().value);  // 2
console.log(nextId.next().value);  // 3
// Infinite hai — lekin jab chahiye tab hi next value generate hoti hai!
```

> **Socho Aise:** Generator function ek **paused function** hai. `yield` pe ruk jaata hai aur `next()` call pe aage chalta hai. Lazy evaluation — jab chahiye tab data generate hota hai, sab ek saath nahi!

---

## Quick Revision Table

| Feature | Kya Karta Hai | Syntax |
|---------|--------------|--------|
| Array Destructuring | Array se variables nikalo | `const [a, b] = arr` |
| Object Destructuring | Object se properties nikalo | `const { name, age } = obj` |
| Spread | Expand karo | `[...arr]`, `{...obj}` |
| Rest | Collect karo | `function(...args)` |
| Optional Chaining | Safe property access | `obj?.prop?.sub` |
| Nullish Coalescing | null/undefined ke liye default | `value ?? "default"` |
| Map | Key-value (any type key) | `new Map()`, `.set()`, `.get()` |
| Set | Unique values only | `new Set()`, `[...new Set(arr)]` |
| Symbol | Unique identifier | `Symbol("desc")` |
| Generator | Lazy value producer | `function* gen() { yield val }` |

---

## Aaj Kya Seekha?

1. **Destructuring** — arrays aur objects se values ek shot mein nikalna
2. **Spread (...)** — arrays/objects expand karna, copy banana
3. **Rest (...)** — multiple values ek array mein collect karna
4. **Optional Chaining (?.)** — safe nested property access, no more TypeError
5. **Nullish Coalescing (??)** — sirf null/undefined ke liye defaults (0 aur "" safe)
6. **Map** — any type ka key allowed, better than plain objects for key-value
7. **Set** — unique values, duplicates remove karo one-liner mein
8. **Symbol** — unique identifiers, hidden properties
9. **Generators** — lazy evaluation, yield se ek ek value dena

> **Yaad Rakho:** ES6+ features modern JavaScript hain. React, Node.js, TypeScript — sab jagah ye features daily use hote hain. `?.`, `??`, destructuring, spread — ye tumhara code 10x cleaner banayenge. Evening mein hum purane code ko ES6+ mein refactor karenge!
