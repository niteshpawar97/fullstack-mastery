# Day 7 Evening: Mini Project — Kisan Profile Manager CLI Tool

> **Practice Time!** Week 1 ka sab kuch use karke ek complete CLI tool banao — Node.js mein! Ye "Kisan Profile Manager" hai — farmers ka data manage karega (CRUD operations in-memory arrays ke saath).

---

## Setup

> **Terminal Command:**
> ```bash
> mkdir kisan-profile-manager
> cd kisan-profile-manager
> git init
> npm init -y
> ```

---

## Project: Kisan Profile Manager

File: `index.js`

```javascript
// ===== KISAN PROFILE MANAGER =====
// Node.js CLI Tool — CRUD operations with in-memory arrays
// Week 1 ka poora JavaScript use ho raha hai yahan!

const readline = require("readline");

// ===== DATA STORE (In-Memory) =====
let kisans = [
  {
    id: 1,
    name: "Ramesh Kumar",
    village: "Kheda",
    district: "Aligarh",
    state: "UP",
    phone: "9876543210",
    landArea: 5,
    crops: ["Wheat", "Rice"],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Suresh Yadav",
    village: "Govindpur",
    district: "Mathura",
    state: "UP",
    phone: "9876543211",
    landArea: 8,
    crops: ["Cotton", "Sugarcane", "Mustard"],
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Priya Devi",
    village: "Barmer",
    district: "Barmer",
    state: "Rajasthan",
    phone: "9876543212",
    landArea: 3,
    crops: ["Bajra", "Jowar"],
    createdAt: new Date().toISOString()
  }
];

let nextId = 4;  // Auto-increment ID

// ===== READLINE SETUP =====
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

// ===== UTILITY FUNCTIONS =====

// Separator line print karo
function separator() {
  console.log("=".repeat(60));
}

// Single kisan profile display karo
function displayKisan(kisan) {
  console.log(`  ID: ${kisan.id}`);
  console.log(`  Name: ${kisan.name}`);
  console.log(`  Village: ${kisan.village}, ${kisan.district}, ${kisan.state}`);
  console.log(`  Phone: ${kisan.phone}`);
  console.log(`  Land: ${kisan.landArea} acres`);
  console.log(`  Crops: ${kisan.crops.join(", ")}`);
  console.log(`  Registered: ${kisan.createdAt}`);
}

// ===== CRUD OPERATIONS =====

// CREATE — Naya kisan register karo
async function addKisan() {
  separator();
  console.log("  REGISTER NEW KISAN");
  separator();
  
  const name = await ask("  Name: ");
  const village = await ask("  Village: ");
  const district = await ask("  District: ");
  const state = await ask("  State: ");
  const phone = await ask("  Phone: ");
  const landArea = await ask("  Land Area (acres): ");
  const cropsInput = await ask("  Crops (comma separated): ");
  
  // Validation
  if (!name || !village || !phone) {
    console.log("\n  ERROR: Name, Village, aur Phone required hain!");
    return;
  }
  
  // New kisan object banao
  const newKisan = {
    id: nextId++,
    name,
    village,
    district: district || "N/A",
    state: state || "N/A",
    phone,
    landArea: parseFloat(landArea) || 0,
    crops: cropsInput.split(",").map(c => c.trim()).filter(c => c !== ""),
    createdAt: new Date().toISOString()
  };
  
  // Array mein add karo
  kisans.push(newKisan);
  
  console.log(`\n  Kisan "${name}" registered! (ID: ${newKisan.id})`);
}

// READ — Sab kisans dikhao
function listAllKisans() {
  separator();
  console.log(`  ALL KISANS (Total: ${kisans.length})`);
  separator();
  
  if (kisans.length === 0) {
    console.log("  Koi kisan registered nahi hai.");
    return;
  }
  
  kisans.forEach((kisan, index) => {
    console.log(`\n  --- Kisan ${index + 1} ---`);
    displayKisan(kisan);
  });
}

// READ — Ek kisan dhundho (ID se ya name se)
async function searchKisan() {
  separator();
  console.log("  SEARCH KISAN");
  separator();
  
  const query = await ask("  Search (name ya ID): ");
  
  // ID se dhundho
  const byId = kisans.find(k => k.id === parseInt(query));
  if (byId) {
    console.log("\n  Found by ID:");
    displayKisan(byId);
    return;
  }
  
  // Name se dhundho (partial match)
  const byName = kisans.filter(k => 
    k.name.toLowerCase().includes(query.toLowerCase())
  );
  
  if (byName.length > 0) {
    console.log(`\n  Found ${byName.length} result(s):`);
    byName.forEach(k => {
      console.log(`\n  --- ID: ${k.id} ---`);
      displayKisan(k);
    });
  } else {
    console.log(`\n  Koi result nahi mila for "${query}"`);
  }
}

// UPDATE — Kisan ki info update karo
async function updateKisan() {
  separator();
  console.log("  UPDATE KISAN");
  separator();
  
  const id = parseInt(await ask("  Kisan ID: "));
  const kisan = kisans.find(k => k.id === id);
  
  if (!kisan) {
    console.log(`\n  ERROR: ID ${id} wala kisan nahi mila!`);
    return;
  }
  
  console.log("\n  Current Profile:");
  displayKisan(kisan);
  
  console.log("\n  (Enter dabao jo field change nahi karni)");
  
  const name = await ask(`  Name [${kisan.name}]: `);
  const village = await ask(`  Village [${kisan.village}]: `);
  const phone = await ask(`  Phone [${kisan.phone}]: `);
  const landArea = await ask(`  Land Area [${kisan.landArea}]: `);
  const cropsInput = await ask(`  Crops [${kisan.crops.join(", ")}]: `);
  
  // Sirf wo update karo jo user ne bhara hai (blank = no change)
  if (name) kisan.name = name;
  if (village) kisan.village = village;
  if (phone) kisan.phone = phone;
  if (landArea) kisan.landArea = parseFloat(landArea);
  if (cropsInput) kisan.crops = cropsInput.split(",").map(c => c.trim()).filter(c => c !== "");
  
  console.log(`\n  Kisan ID ${id} updated!`);
  console.log("  Updated Profile:");
  displayKisan(kisan);
}

// DELETE — Kisan hatao
async function deleteKisan() {
  separator();
  console.log("  DELETE KISAN");
  separator();
  
  const id = parseInt(await ask("  Kisan ID to delete: "));
  const index = kisans.findIndex(k => k.id === id);
  
  if (index === -1) {
    console.log(`\n  ERROR: ID ${id} wala kisan nahi mila!`);
    return;
  }
  
  const kisan = kisans[index];
  console.log(`\n  Deleting: ${kisan.name} (ID: ${kisan.id})`);
  
  const confirm = await ask("  Confirm delete? (y/n): ");
  
  if (confirm.toLowerCase() === "y") {
    kisans.splice(index, 1);
    console.log(`  Kisan "${kisan.name}" deleted!`);
  } else {
    console.log("  Delete cancelled.");
  }
}

// STATS — Summary statistics
function showStats() {
  separator();
  console.log("  KISAN STATISTICS");
  separator();
  
  if (kisans.length === 0) {
    console.log("  Koi data nahi hai.");
    return;
  }
  
  // Total kisans
  console.log(`  Total Kisans: ${kisans.length}`);
  
  // Total land
  const totalLand = kisans.reduce((sum, k) => sum + k.landArea, 0);
  console.log(`  Total Land: ${totalLand} acres`);
  
  // Average land
  console.log(`  Average Land: ${(totalLand / kisans.length).toFixed(1)} acres`);
  
  // All unique crops
  const allCrops = [...new Set(kisans.flatMap(k => k.crops))];
  console.log(`  Total Unique Crops: ${allCrops.length}`);
  console.log(`  Crops: ${allCrops.join(", ")}`);
  
  // State-wise count
  const stateCount = {};
  kisans.forEach(k => {
    stateCount[k.state] = (stateCount[k.state] || 0) + 1;
  });
  
  console.log(`\n  State-wise Distribution:`);
  for (const [state, count] of Object.entries(stateCount)) {
    console.log(`    ${state}: ${count} kisan(s)`);
  }
  
  // Biggest farmer
  const biggest = kisans.reduce((max, k) => k.landArea > max.landArea ? k : max);
  console.log(`\n  Sabse Bada Kisan: ${biggest.name} (${biggest.landArea} acres)`);
}

// EXPORT — JSON mein data dikhao
function exportData() {
  separator();
  console.log("  EXPORT DATA (JSON)");
  separator();
  
  const jsonData = JSON.stringify(kisans, null, 2);
  console.log(jsonData);
  console.log(`\n  Total records: ${kisans.length}`);
}

// ===== MAIN MENU =====
async function showMenu() {
  console.log("\n");
  separator();
  console.log("  KISAN PROFILE MANAGER v1.0");
  separator();
  console.log("  1. List All Kisans");
  console.log("  2. Add New Kisan");
  console.log("  3. Search Kisan");
  console.log("  4. Update Kisan");
  console.log("  5. Delete Kisan");
  console.log("  6. Statistics");
  console.log("  7. Export JSON");
  console.log("  0. Exit");
  separator();
  
  const choice = await ask("  Choose option (0-7): ");
  
  switch (choice) {
    case "1": listAllKisans(); break;
    case "2": await addKisan(); break;
    case "3": await searchKisan(); break;
    case "4": await updateKisan(); break;
    case "5": await deleteKisan(); break;
    case "6": showStats(); break;
    case "7": exportData(); break;
    case "0":
      console.log("\n  Dhanyavaad! Kisan Profile Manager band ho raha hai...");
      rl.close();
      return;
    default:
      console.log("\n  Invalid option! 0-7 mein se choose karo.");
  }
  
  // Menu dobara dikhao (loop)
  await showMenu();
}

// ===== START APP =====
console.log("\n  Namaste! Welcome to Kisan Profile Manager!");
showMenu();
```

> **Terminal Command:**
> ```bash
> # Run karo
> node index.js
> 
> # Test karo:
> # 1 — List all kisans
> # 2 — Add new kisan
> # 3 — Search by name or ID
> # 4 — Update kisan info
> # 5 — Delete kisan
> # 6 — See statistics
> # 7 — Export as JSON
> # 0 — Exit
> ```

> **Expected Output:**
> ```
>   Namaste! Welcome to Kisan Profile Manager!
> 
> ============================================================
>   KISAN PROFILE MANAGER v1.0
> ============================================================
>   1. List All Kisans
>   2. Add New Kisan
>   3. Search Kisan
>   ...
> ============================================================
>   Choose option (0-7): 
> ```

---

## Concepts Used in This Project

| Concept | Kahan Use Hua |
|---------|-------------|
| Variables (`let`, `const`) | Data store, nextId counter |
| Arrays | `kisans` array — main data store |
| Objects | Har kisan ek object hai |
| Functions | CRUD operations as functions |
| Arrow Functions | Callbacks — map, filter, reduce, find |
| Default Parameters | N/A fallback values |
| Destructuring | Object.entries mein `[state, count]` |
| Spread Operator | `new Set` ke saath unique crops |
| Array Methods | push, splice, find, findIndex, filter, reduce, map, flatMap |
| JSON | Export feature — stringify |
| Scope | Function scope mein local variables |
| Template Literals | String formatting har jagah |
| Ternary Operator | Status checks |
| switch | Menu options handle karna |
| Async/Await | User input handling |

---

## Git Commit

> **Terminal Command:**
> ```bash
> git add .
> git commit -m "Day 7: Kisan Profile Manager CLI — CRUD tool using Node.js"
> 
> # Git log dekho — poora week ka kaam
> git log --oneline
> ```

---

## Bonus Challenges

1. **Sort Feature** — Kisans ko name, land area, ya state se sort karo
2. **Filter Feature** — State ya crop ke basis pe filter karo
3. **File Save** — `fs` module se JSON file mein data save karo (hint: `fs.writeFileSync`)
4. **Import Feature** — JSON file se data load karo
5. **Duplicate Check** — Same phone number wala kisan already hai to warning do

---

## Week 1 Complete Checklist

- [ ] JavaScript basics: variables, types, operators
- [ ] Conditions: if/else, switch, ternary
- [ ] Arrays: CRUD, map/filter/reduce
- [ ] Loops: for, for...of, forEach
- [ ] Functions: declaration, arrow, default params, scope
- [ ] Objects: creation, methods, this, destructuring, spread
- [ ] JSON: stringify, parse
- [ ] DOM: querySelector, events, createElement
- [ ] Git: init, add, commit, branch, merge
- [ ] Mini Project: Kisan Profile Manager complete

---

## Aaj Kya Seekha?

- Poore Week 1 ka revision kiya
- Real-world CLI tool banaya — Kisan Profile Manager
- CRUD operations implement kiye — Create, Read, Update, Delete
- Statistics aur export features add kiye
- Sab JavaScript concepts ek project mein use kiye
- Next week se databases start honge — SQL aur MongoDB!
