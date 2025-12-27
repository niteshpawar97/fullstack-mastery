# Day 24 Evening: ES6+ Modern JavaScript — Hands-On Practice

> **Aaj ka plan:** Ab ES6+ features ko practically use karenge. Purane code ko modern syntax mein refactor karenge, data transformation challenges solve karenge, aur real-world patterns implement karenge.

---

## Exercise 1: Destructuring Mastery

### Task: Har scenario mein destructuring use karo

```javascript
// destructuring-practice.js

// === ARRAY DESTRUCTURING === //

// 1. Function se multiple values return karo
function getTopFarmers() {
  return ["Rajesh", "Priya", "Suresh", "Anita", "Mohan"];
}

const [gold, silver, bronze, ...others] = getTopFarmers();
console.log(`🥇 ${gold}, 🥈 ${silver}, ���� ${bronze}`);
console.log(`Others: ${others.join(', ')}`);

// 2. Swap multiple variables
let a = 1, b = 2, c = 3;
[a, b, c] = [c, a, b];  // Rotate!
console.log(a, b, c);  // 3, 1, 2

// 3. Parse CSV-like data
const csvLine = "Rajesh,Wheat,5,Jaipur,50000";
const [name, crop, area, city, revenue] = csvLine.split(',');
console.log(`${name} grows ${crop} in ${city} (${area} acres, ₹${revenue})`);

// 4. Nested array destructuring
const coordinates = [[28.6, 77.2], [26.9, 75.7], [19.0, 72.8]];
const [[lat1, lon1], [lat2, lon2], [lat3, lon3]] = coordinates;
console.log(`Delhi: ${lat1}°N, ${lon1}°E`);
console.log(`Jaipur: ${lat2}°N, ${lon2}°E`);
console.log(`Mumbai: ${lat3}°N, ${lon3}°E`);

// === OBJECT DESTRUCTURING === //

// 5. API response destructuring
const apiResponse = {
  status: 200,
  data: {
    farmers: [
      { id: 1, name: "Rajesh", crop: "Wheat", area: 5 },
      { id: 2, name: "Priya", crop: "Rice", area: 3 }
    ],
    pagination: {
      page: 1,
      totalPages: 5,
      totalItems: 50
    }
  },
  meta: {
    requestId: "abc-123",
    timestamp: "2024-01-15"
  }
};

// Deep destructuring
const {
  status,
  data: {
    farmers,
    pagination: { page, totalPages }
  },
  meta: { requestId }
} = apiResponse;

console.log(`Status: ${status}`);
console.log(`Page ${page}/${totalPages}`);
console.log(`Request: ${requestId}`);
console.log(`Farmers: ${farmers.map(f => f.name).join(', ')}`);

// 6. Function parameter destructuring with defaults
function createFarmerProfile({
  name,
  crop = "Not specified",
  area = 0,
  state = "Unknown",
  contact: { phone = "N/A", email = "N/A" } = {}
} = {}) {
  return `${name} | ${crop} | ${area} acres | ${state} | Ph: ${phone}`;
}

console.log(createFarmerProfile({
  name: "Rajesh",
  crop: "Wheat",
  area: 5,
  state: "Rajasthan",
  contact: { phone: "9876543210" }
}));

// Defaults kick in
console.log(createFarmerProfile({ name: "Priya" }));
// Priya | Not specified | 0 acres | Unknown | Ph: N/A
```

> **Practice Time!** Ek function banao jo date string "2024-01-15" ko destructure karke `{ year, month, day }` return kare.

---

## Exercise 2: Spread & Rest — Practical Patterns

### Task: Spread/Rest se common problems solve karo

```javascript
// spread-rest-practice.js

// 1. Immutable state updates (React pattern)
const state = {
  farmers: [
    { id: 1, name: "Rajesh", crop: "Wheat" },
    { id: 2, name: "Priya", crop: "Rice" }
  ],
  loading: false,
  error: null
};

// Add farmer — without mutating original
const newState = {
  ...state,
  farmers: [
    ...state.farmers,
    { id: 3, name: "Suresh", crop: "Cotton" }
  ]
};
console.log("Original farmers:", state.farmers.length);  // 2
console.log("New farmers:", newState.farmers.length);     // 3

// Update farmer — without mutating
const updateState = {
  ...state,
  farmers: state.farmers.map(f =>
    f.id === 1 ? { ...f, crop: "Sugarcane" } : f
  )
};
console.log("Updated:", updateState.farmers[0].crop);  // "Sugarcane"
console.log("Original:", state.farmers[0].crop);       // "Wheat" (safe!)

// Remove farmer — without mutating
const deleteState = {
  ...state,
  farmers: state.farmers.filter(f => f.id !== 2)
};
console.log("After delete:", deleteState.farmers.length);  // 1

// 2. Merge configs with defaults
function createConfig(userConfig) {
  const defaults = {
    host: "localhost",
    port: 3000,
    database: "farm_db",
    logging: false,
    maxConnections: 10
  };

  // User config overrides defaults
  return { ...defaults, ...userConfig };
}

const config = createConfig({
  port: 8080,
  database: "production_db",
  logging: true
});
console.log(config);
// { host: "localhost", port: 8080, database: "production_db",
//   logging: true, maxConnections: 10 }

// 3. Collect remaining arguments
function logActivity(timestamp, user, ...actions) {
  console.log(`[${timestamp}] User: ${user}`);
  actions.forEach((action, i) => {
    console.log(`  ${i + 1}. ${action}`);
  });
}

logActivity(
  "2024-01-15 10:30",
  "Rajesh",
  "Logged in",
  "Added crop data",
  "Generated report",
  "Logged out"
);

// 4. Object property removal (without delete)
const user = {
  id: 1,
  name: "Rajesh",
  password: "secret123",  // Ye remove karna hai!
  email: "rajesh@farm.com",
  role: "admin"
};

const { password, ...safeUser } = user;
console.log(safeUser);
// { id: 1, name: "Rajesh", email: "rajesh@farm.com", role: "admin" }
// password removed!

// 5. Dynamic property addition
function addField(obj, key, value) {
  return { ...obj, [key]: value };
}

let farmer = { name: "Rajesh" };
farmer = addField(farmer, "crop", "Wheat");
farmer = addField(farmer, "area", 5);
farmer = addField(farmer, "state", "Rajasthan");
console.log(farmer);
// { name: "Rajesh", crop: "Wheat", area: 5, state: "Rajasthan" }
```

---

## Exercise 3: Optional Chaining & Nullish Coalescing

### Task: Safely access deeply nested data

```javascript
// safe-access.js

// Complex API response — kuch fields missing ho sakte hain
const farmDatabase = {
  farm001: {
    name: "Green Valley",
    owner: {
      name: "Rajesh",
      contact: {
        phone: "9876543210",
        email: null  // email nahi hai
      }
    },
    crops: [
      { name: "Wheat", yield: 50, price: 2000 },
      { name: "Rice", yield: 30, price: 3000 }
    ],
    equipment: null,  // Equipment data nahi hai
    settings: {
      notifications: true,
      irrigationHours: 0,  // 0 valid hai!
      autoReport: false    // false valid hai!
    }
  },
  farm002: {
    name: "Sunrise Farm",
    owner: null,  // Owner data missing
    crops: [],
    equipment: {
      tractors: 2
    }
  }
};

// Safe data extraction function
function getFarmReport(farmId) {
  const farm = farmDatabase[farmId];

  // Optional chaining se safe access
  const report = {
    farmName: farm?.name ?? "Unknown Farm",
    ownerName: farm?.owner?.name ?? "No Owner",
    phone: farm?.owner?.contact?.phone ?? "N/A",
    email: farm?.owner?.contact?.email ?? "No email",
    firstCrop: farm?.crops?.[0]?.name ?? "No crops",
    cropCount: farm?.crops?.length ?? 0,
    tractors: farm?.equipment?.tractors ?? 0,

    // ?? vs || — important difference!
    notifications: farm?.settings?.notifications ?? true,
    irrigationHours: farm?.settings?.irrigationHours ?? 8,  // 0 valid!
    autoReport: farm?.settings?.autoReport ?? true,          // false valid!
  };

  return report;
}

// Test farm001
console.log("=== Farm 001 ===");
const report1 = getFarmReport("farm001");
console.log(JSON.stringify(report1, null, 2));
// irrigationHours will be 0 (not 8!)
// autoReport will be false (not true!)

// Test farm002 — missing data
console.log("\n=== Farm 002 ===");
const report2 = getFarmReport("farm002");
console.log(JSON.stringify(report2, null, 2));
// ownerName will be "No Owner"
// phone will be "N/A"

// Test non-existent farm
console.log("\n=== Farm 999 ===");
const report3 = getFarmReport("farm999");
console.log(JSON.stringify(report3, null, 2));
// Everything will be defaults

// Chained method calls
const upperOwner = farmDatabase.farm001?.owner?.name?.toUpperCase();
console.log("\nUpper owner:", upperOwner);  // "RAJESH"

const missingOwner = farmDatabase.farm002?.owner?.name?.toUpperCase();
console.log("Missing owner:", missingOwner);  // undefined (no error!)
```

> **Yaad Rakho:** `?.` + `??` combo modern JavaScript mein har jagah use hota hai. API responses mein missing data common hai — ye combo safe defaults provide karta hai.

---

## Exercise 4: Map & Set — Data Structures

### Task: Map aur Set se real problems solve karo

```javascript
// map-set-practice.js

// === MAP EXERCISES === //

// 1. Crop price tracker — Map use karo
const priceTracker = new Map();

// Set prices
function updatePrice(crop, price) {
  const history = priceTracker.get(crop) || [];
  history.push({ price, date: new Date().toLocaleDateString() });
  priceTracker.set(crop, history);
}

updatePrice("Wheat", 2000);
updatePrice("Rice", 3000);
updatePrice("Wheat", 2100);  // Price updated
updatePrice("Wheat", 2050);
updatePrice("Rice", 3200);

// Get latest price
function getLatestPrice(crop) {
  const history = priceTracker.get(crop);
  if (!history?.length) return null;
  return history[history.length - 1].price;
}

console.log("Wheat latest:", getLatestPrice("Wheat"));  // 2050
console.log("Rice latest:", getLatestPrice("Rice"));    // 3200

// Display all prices
console.log("\n📊 Price History:");
for (const [crop, history] of priceTracker) {
  console.log(`\n${crop}:`);
  history.forEach(h => console.log(`  ₹${h.price} (${h.date})`));
}

// 2. Object as Map key — user sessions
const sessions = new Map();

const user1 = { id: 1, name: "Rajesh" };
const user2 = { id: 2, name: "Priya" };

sessions.set(user1, { loginTime: new Date(), pages: ["dashboard", "crops"] });
sessions.set(user2, { loginTime: new Date(), pages: ["profile"] });

console.log("\nSessions:");
for (const [user, session] of sessions) {
  console.log(`  ${user.name}: ${session.pages.length} pages visited`);
}

// === SET EXERCISES === //

// 3. Unique visitors tracking
const dailyVisitors = new Set();

function recordVisit(userId) {
  const sizeBefore = dailyVisitors.size;
  dailyVisitors.add(userId);
  const isNew = dailyVisitors.size > sizeBefore;
  console.log(`User ${userId}: ${isNew ? "New visitor!" : "Returning visitor"}`);
}

recordVisit("user_001");  // New
recordVisit("user_002");  // New
recordVisit("user_001");  // Returning
recordVisit("user_003");  // New
recordVisit("user_002");  // Returning

console.log(`\nUnique visitors today: ${dailyVisitors.size}`);

// 4. Tag system with Set
class TagManager {
  constructor() {
    this.itemTags = new Map();  // item -> Set of tags
  }

  addTag(item, tag) {
    if (!this.itemTags.has(item)) {
      this.itemTags.set(item, new Set());
    }
    this.itemTags.get(item).add(tag.toLowerCase());
  }

  removeTag(item, tag) {
    this.itemTags.get(item)?.delete(tag.toLowerCase());
  }

  getTags(item) {
    return [...(this.itemTags.get(item) || [])];
  }

  findByTag(tag) {
    const results = [];
    for (const [item, tags] of this.itemTags) {
      if (tags.has(tag.toLowerCase())) {
        results.push(item);
      }
    }
    return results;
  }

  getAllTags() {
    const allTags = new Set();
    for (const tags of this.itemTags.values()) {
      for (const tag of tags) {
        allTags.add(tag);
      }
    }
    return [...allTags];
  }
}

const tags = new TagManager();
tags.addTag("Wheat", "rabi");
tags.addTag("Wheat", "winter");
tags.addTag("Wheat", "staple");
tags.addTag("Rice", "kharif");
tags.addTag("Rice", "summer");
tags.addTag("Rice", "staple");
tags.addTag("Cotton", "kharif");
tags.addTag("Cotton", "cash-crop");

console.log("\nWheat tags:", tags.getTags("Wheat"));
console.log("Staple crops:", tags.findByTag("staple"));
console.log("Kharif crops:", tags.findByTag("kharif"));
console.log("All tags:", tags.getAllTags());
```

---

## Exercise 5: Refactor Old Code to ES6+

### Task: Purane code ko modern syntax mein convert karo

```javascript
// refactor.js

// ============ BEFORE (ES5 style) ============ //

// OLD function
function calculateFarmStats_OLD(farmers) {
  var totalArea = 0;
  var totalRevenue = 0;
  var cropTypes = [];

  for (var i = 0; i < farmers.length; i++) {
    totalArea = totalArea + farmers[i].area;
    totalRevenue = totalRevenue + farmers[i].revenue;
    if (cropTypes.indexOf(farmers[i].crop) === -1) {
      cropTypes.push(farmers[i].crop);
    }
  }

  var avgRevenue = totalRevenue / farmers.length;

  var result = {
    count: farmers.length,
    totalArea: totalArea,
    totalRevenue: totalRevenue,
    avgRevenue: avgRevenue,
    crops: cropTypes
  };

  return result;
}

// OLD object creation
function createFarmer_OLD(name, crop, area, state) {
  return {
    name: name,
    crop: crop,
    area: area,
    state: state,
    getInfo: function() {
      var self = this;
      return self.name + ' grows ' + self.crop;
    }
  };
}

// ============ AFTER (ES6+ style) ============ //

// MODERN function
const calculateFarmStats = (farmers) => {
  const totalArea = farmers.reduce((sum, { area }) => sum + area, 0);
  const totalRevenue = farmers.reduce((sum, { revenue }) => sum + revenue, 0);
  const crops = [...new Set(farmers.map(({ crop }) => crop))];
  const avgRevenue = totalRevenue / farmers.length;

  return {
    count: farmers.length,
    totalArea,         // Shorthand property
    totalRevenue,
    avgRevenue,
    crops
  };
};

// MODERN object creation
const createFarmer = (name, crop, area, state) => ({
  name,              // Shorthand
  crop,
  area,
  state,
  getInfo() {        // Method shorthand
    return `${this.name} grows ${this.crop}`;  // Template literal
  }
});

// Test data
const farmers = [
  { name: "Rajesh", crop: "Wheat", area: 5, revenue: 50000 },
  { name: "Priya", crop: "Rice", area: 3, revenue: 45000 },
  { name: "Suresh", crop: "Cotton", area: 7, revenue: 85000 },
  { name: "Anita", crop: "Wheat", area: 4, revenue: 40000 }
];

// Modern usage
const { count, totalArea, avgRevenue, crops } = calculateFarmStats(farmers);
console.log(`${count} farmers, ${totalArea} acres, avg ₹${Math.round(avgRevenue)}`);
console.log(`Crops: ${crops.join(', ')}`);

const rajesh = createFarmer("Rajesh", "Wheat", 5, "Rajasthan");
console.log(rajesh.getInfo());  // "Rajesh grows Wheat"
```

---

## Exercise 6: Data Transformation Challenges

### Task: ES6+ features se data transform karo

```javascript
// data-transform.js

const rawData = [
  { id: 1, name: "Rajesh Kumar", crops: "Wheat,Rice", area: "5.5", state: "RJ", revenue: "50000" },
  { id: 2, name: "Priya Sharma", crops: "Rice", area: "3", state: "PB", revenue: "45000" },
  { id: 3, name: "Suresh Patel", crops: "Cotton,Sugarcane", area: "7.2", state: "GJ", revenue: "85000" },
  { id: 4, name: "Anita Verma", crops: "Wheat,Mustard,Peas", area: "4", state: "RJ", revenue: "40000" },
  { id: 5, name: "Mohan Singh", crops: "Rice,Wheat", area: "6", state: "PB", revenue: "72000" }
];

const stateMap = { RJ: "Rajasthan", PB: "Punjab", GJ: "Gujarat", MH: "Maharashtra" };

// Challenge 1: Transform raw data to clean format
const cleanData = rawData.map(({
  id, name, crops, area, state, revenue
}) => ({
  id,
  firstName: name.split(' ')[0],
  lastName: name.split(' ')[1] ?? "",
  crops: crops.split(','),
  area: parseFloat(area),
  state: stateMap[state] ?? state,
  revenue: parseInt(revenue),
  revenuePerAcre: Math.round(parseInt(revenue) / parseFloat(area))
}));

console.log("=== Clean Data ===");
console.table(cleanData.map(({ id, firstName, state, area, revenuePerAcre }) =>
  ({ id, firstName, state, area, revenuePerAcre })
));

// Challenge 2: Group by state with stats
const stateStats = cleanData.reduce((acc, farmer) => {
  const { state } = farmer;
  if (!acc[state]) {
    acc[state] = { farmers: [], totalArea: 0, totalRevenue: 0 };
  }
  acc[state].farmers.push(farmer.firstName);
  acc[state].totalArea += farmer.area;
  acc[state].totalRevenue += farmer.revenue;
  return acc;
}, {});

console.log("\n=== State Statistics ===");
Object.entries(stateStats).forEach(([state, { farmers: f, totalArea: a, totalRevenue: r }]) => {
  console.log(`${state}: ${f.join(', ')} | ${a} acres | ₹${r.toLocaleString()}`);
});

// Challenge 3: All unique crops across all farmers
const allCrops = [...new Set(cleanData.flatMap(f => f.crops))];
console.log(`\n🌾 All crops: ${allCrops.join(', ')}`);

// Challenge 4: Find farmers who grow specific crop
const findFarmersByCrop = (crop) =>
  cleanData
    .filter(f => f.crops.includes(crop))
    .map(({ firstName, state }) => `${firstName} (${state})`);

console.log(`\nWheat farmers: ${findFarmersByCrop('Wheat').join(', ')}`);
console.log(`Rice farmers: ${findFarmersByCrop('Rice').join(', ')}`);

// Challenge 5: Top earner per state
const topPerState = Object.fromEntries(
  Object.entries(
    cleanData.reduce((acc, f) => {
      if (!acc[f.state] || f.revenue > acc[f.state].revenue) {
        acc[f.state] = f;
      }
      return acc;
    }, {})
  ).map(([state, f]) => [state, `${f.firstName} (���${f.revenue.toLocaleString()})`])
);

console.log("\n🏆 Top earner per state:", topPerState);

// Challenge 6: Create lookup Map
const farmerLookup = new Map(cleanData.map(f => [f.id, f]));
const farmer3 = farmerLookup.get(3);
console.log(`\nLookup ID 3: ${farmer3?.firstName} from ${farmer3?.state}`);
```

---

## Mini Challenge: Build a Data Pipeline

### Task: Multiple transformation steps chain karo ES6+ style mein

```javascript
// pipeline.js

// Pipe function — functions chain karo
const pipe = (...fns) => (input) =>
  fns.reduce((acc, fn) => fn(acc), input);

// Transformation functions
const parseNumbers = (data) =>
  data.map(item => ({
    ...item,
    area: Number(item.area),
    revenue: Number(item.revenue)
  }));

const addMetrics = (data) =>
  data.map(item => ({
    ...item,
    revenuePerAcre: Math.round(item.revenue / item.area),
    tier: item.revenue >= 70000 ? 'Gold' :
          item.revenue >= 40000 ? 'Silver' : 'Bronze'
  }));

const sortByRevenue = (data) =>
  [...data].sort((a, b) => b.revenue - a.revenue);

const toSummary = (data) =>
  data.map(({ name, tier, revenue, revenuePerAcre }) =>
    ({ name, tier, revenue: `��${revenue.toLocaleString()}`, revenuePerAcre })
  );

// Pipeline — chain transformations!
const processData = pipe(
  parseNumbers,
  addMetrics,
  sortByRevenue,
  toSummary
);

const rawInput = [
  { name: "Rajesh", area: "5", revenue: "50000" },
  { name: "Priya", area: "3", revenue: "45000" },
  { name: "Suresh", area: "7", revenue: "85000" },
  { name: "Mohan", area: "6", revenue: "72000" },
  { name: "Geeta", area: "2", revenue: "25000" }
];

const result = processData(rawInput);
console.log("\n📊 Processed Pipeline Result:");
console.table(result);
```

---

## Quick Revision Table

| Exercise | ES6+ Features Used | Key Pattern |
|----------|-------------------|-------------|
| Destructuring | Array/Object/Nested/Params | Clean data extraction |
| Spread/Rest | Immutable updates, config merge | State management |
| Optional Chaining | `?.` + `??` | Safe nested access |
| Map/Set | Price tracker, tags, visitors | Specialized data structures |
| Code Refactor | All ES6+ features | Legacy to modern |
| Data Transform | destructuring, Set, flatMap | Real-world data processing |
| Pipeline | Spread, arrow functions, pipe | Functional programming |

---

## Aaj Kya Seekha?

1. **Destructuring** mastered — arrays, objects, nested, function params
2. **Spread/Rest** patterns — immutable state, config merge, property removal
3. **Optional Chaining + Nullish Coalescing** — safe data access combo
4. **Map & Set** — price tracker, tag system, unique visitors
5. **Legacy code refactor** — ES5 to ES6+ transformation
6. **Data transformation** — groupBy, flatMap, lookup, pipeline
7. **Pipe pattern** — functional programming style data processing

> **Yaad Rakho:** ES6+ features ab JavaScript ka standard hai. Har modern codebase mein ye features use hote hain — React components, Node.js APIs, data processing pipelines. In features ko daily practice mein use karo — ek hafta mein natural lagenge. Ab tum modern JavaScript likhne ke liye ready ho!
