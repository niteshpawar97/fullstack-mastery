# Day 6 Evening: DOM Practice + Git Branching Practice

> **Practice Time!** DOM se interactive page banao aur Git branching practice karo!

---

## Setup

> **Terminal Command:**
> ```bash
> mkdir fullstack-day6
> cd fullstack-day6
> git init
> ```

---

## Task 1: Simple Interactive Page

File: `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kisan Market Board</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #2e7d32; margin-bottom: 15px; }
    .input-group { display: flex; gap: 10px; margin-bottom: 15px; }
    input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; }
    button { padding: 10px 20px; background: #2e7d32; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
    button:hover { background: #1b5e20; }
    .crop-list { list-style: none; }
    .crop-item { padding: 10px; margin: 5px 0; background: #e8f5e9; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; }
    .crop-item .delete-btn { background: #c62828; padding: 5px 10px; font-size: 12px; }
    .counter { color: #666; margin-top: 10px; font-size: 14px; }
    .search-box { margin-bottom: 15px; }
    .search-box input { width: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="page-title">Kisan Market Board</h1>
    
    <div class="search-box">
      <input type="text" id="search-input" placeholder="Search crop...">
    </div>
    
    <div class="input-group">
      <input type="text" id="crop-name" placeholder="Crop name (e.g., Wheat)">
      <input type="number" id="crop-price" placeholder="Price (Rs.)">
      <button id="add-btn">Add</button>
    </div>
    
    <ul class="crop-list" id="crop-list"></ul>
    
    <p class="counter" id="counter">Total crops: 0</p>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

File: `app.js`

```javascript
// DOM Elements select karo
const cropNameInput = document.querySelector("#crop-name");
const cropPriceInput = document.querySelector("#crop-price");
const addBtn = document.querySelector("#add-btn");
const cropList = document.querySelector("#crop-list");
const counter = document.querySelector("#counter");
const searchInput = document.querySelector("#search-input");

// Data store — array of objects
let crops = [];

// Counter update karo
function updateCounter() {
  counter.textContent = `Total crops: ${crops.length}`;
}

// List render karo — poori list dobara banao
function renderList(filterText = "") {
  // List clear karo
  cropList.innerHTML = "";
  
  // Filter apply karo
  const filtered = crops.filter(crop =>
    crop.name.toLowerCase().includes(filterText.toLowerCase())
  );
  
  // Har crop ka li banao
  filtered.forEach((crop, index) => {
    const li = document.createElement("li");
    li.classList.add("crop-item");
    
    // Crop info span
    const infoSpan = document.createElement("span");
    infoSpan.textContent = `${crop.name} — Rs.${crop.price}/kg`;
    
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      crops.splice(index, 1);  // Array se hatao
      renderList(searchInput.value);  // Dobara render karo
      updateCounter();
    });
    
    li.appendChild(infoSpan);
    li.appendChild(deleteBtn);
    cropList.appendChild(li);
  });
}

// Add button click
addBtn.addEventListener("click", () => {
  const name = cropNameInput.value.trim();
  const price = cropPriceInput.value.trim();
  
  // Validation
  if (!name || !price) {
    alert("Crop name aur price dono daalo!");
    return;
  }
  
  // Array mein add
  crops.push({ name, price: Number(price) });
  
  // Render aur update
  renderList(searchInput.value);
  updateCounter();
  
  // Inputs clear karo
  cropNameInput.value = "";
  cropPriceInput.value = "";
  cropNameInput.focus();  // Focus wapas name pe
});

// Enter key se bhi add ho
cropPriceInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addBtn.click();  // Button click simulate karo
  }
});

// Search — real-time filter
searchInput.addEventListener("input", (e) => {
  renderList(e.target.value);
});

// Initial data add karo (demo ke liye)
const initialCrops = [
  { name: "Wheat", price: 22 },
  { name: "Rice", price: 35 },
  { name: "Cotton", price: 65 },
  { name: "Sugarcane", price: 3 },
  { name: "Tomato", price: 45 }
];

initialCrops.forEach(crop => crops.push(crop));
renderList();
updateCounter();
```

> **Tip:** Is page ko browser mein kholke test karo. `index.html` file pe double-click karo ya VS Code mein Live Server extension use karo.

---

## Task 2: DOM Manipulation Exercises

File: `dom-exercises.js` (Ye browser console mein run karo ya HTML file mein include karo)

```javascript
// Agar Node.js mein run kar rahe ho to ye sirf reference ke liye hai
// Browser mein test karo — Console tab mein paste karo

// Exercise 1: Element banao aur page mein daalo
function addCropCard(name, price, season) {
  const card = document.createElement("div");
  card.style.cssText = "padding:15px; margin:10px; border:1px solid #ccc; border-radius:8px; background:#f9f9f9;";
  
  card.innerHTML = `
    <h3 style="color:#2e7d32">${name}</h3>
    <p>Price: Rs.${price}/kg</p>
    <p>Season: ${season}</p>
  `;
  
  document.body.appendChild(card);
}

// Exercise 2: Timer banao
function startTimer(seconds) {
  const display = document.createElement("h2");
  display.style.cssText = "text-align:center; font-size:48px; color:#1565c0;";
  document.body.appendChild(display);
  
  let remaining = seconds;
  
  const interval = setInterval(() => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    
    if (remaining <= 0) {
      clearInterval(interval);
      display.textContent = "Time Up!";
      display.style.color = "red";
    }
    
    remaining--;
  }, 1000);
}

// Exercise 3: Toggle dark mode
function addDarkModeToggle() {
  const btn = document.createElement("button");
  btn.textContent = "Toggle Dark Mode";
  btn.style.cssText = "position:fixed; top:10px; right:10px; padding:10px 15px; cursor:pointer; border-radius:5px;";
  
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    
    if (document.body.classList.contains("dark-mode")) {
      document.body.style.backgroundColor = "#1a1a2e";
      document.body.style.color = "#eee";
    } else {
      document.body.style.backgroundColor = "#f5f5f5";
      document.body.style.color = "#333";
    }
  });
  
  document.body.appendChild(btn);
}

console.log("DOM exercises loaded! Browser mein functions call karo.");
```

---

## Task 3: Git Branching Practice

> **Terminal Command:**
> ```bash
> # ===== GIT BRANCHING PRACTICE =====
> 
> # Step 1: Initial commit on main
> git add index.html app.js
> git commit -m "Initial: Kisan Market Board page"
> 
> # Step 2: Feature branch banao — search feature ke liye
> git checkout -b feature/search
> # (search wala code already hai — ek aur feature add karo)
> # dom-exercises.js add karo
> git add dom-exercises.js
> git commit -m "Add DOM exercise functions"
> 
> # Step 3: Branch list dekho
> git branch
> # * feature/search
> #   main
> 
> # Step 4: Main pe wapas jao
> git checkout main
> 
> # Step 5: Doosri branch banao — style improvement
> git checkout -b feature/dark-mode
> # (kuch CSS change karo index.html mein)
> git add .
> git commit -m "Add dark mode styles"
> 
> # Step 6: Main pe jao aur merge karo
> git checkout main
> git merge feature/search
> git merge feature/dark-mode
> 
> # Step 7: Log dekho — sab branches ka kaam main mein aa gaya
> git log --oneline --graph --all
> 
> # Step 8: Branches delete karo
> git branch -d feature/search
> git branch -d feature/dark-mode
> 
> # Step 9: Final status
> git branch
> git log --oneline
> ```

> **Yaad Rakho:** Branch naming convention follow karo:
> - `feature/feature-name` — naya feature
> - `fix/bug-name` — bug fix
> - `docs/what-changed` — documentation
> - `refactor/what-changed` — code cleanup

---

## Task 4: Merge Conflict Simulation

> **Terminal Command:**
> ```bash
> # ===== MERGE CONFLICT PRACTICE =====
> 
> # Step 1: Main branch pe ek file banao
> echo 'console.log("Hello from main");' > conflict-test.js
> git add conflict-test.js
> git commit -m "Add conflict-test file"
> 
> # Step 2: Branch A banao aur file change karo
> git checkout -b branch-a
> echo 'console.log("Hello from Branch A");' > conflict-test.js
> git add .
> git commit -m "Branch A: change greeting"
> 
> # Step 3: Main pe wapas jao, Branch B banao
> git checkout main
> git checkout -b branch-b
> echo 'console.log("Hello from Branch B");' > conflict-test.js
> git add .
> git commit -m "Branch B: change greeting"
> 
> # Step 4: Main pe jao, Branch A merge karo (no conflict)
> git checkout main
> git merge branch-a
> 
> # Step 5: Ab Branch B merge karo — CONFLICT!
> git merge branch-b
> # CONFLICT! Ab conflict-test.js kholo aur fix karo
> 
> # Step 6: File mein conflict markers dikhenge:
> # <<<<<<< HEAD
> # console.log("Hello from Branch A");
> # =======
> # console.log("Hello from Branch B");
> # >>>>>>> branch-b
> 
> # Step 7: Fix karo (jo chahiye wo rakho) aur commit
> # editor mein fix karne ke baad:
> git add conflict-test.js
> git commit -m "Resolve merge conflict — keep both greetings"
> ```

> **Tip:** VS Code mein merge conflicts ke liye achha visual editor hai — "Accept Current", "Accept Incoming", "Accept Both" options dikhata hai. Bahut easy!

---

## Homework

1. Interactive page mein "Edit" button add karo — crop ka price update ho sake
2. Ek "Sort by Price" button add karo
3. Git mein 3 branches banao, har branch mein alag feature add karo, phir sab merge karo
4. `localStorage` se data save karo (bonus — page refresh pe data rahe)

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| `querySelector` | CSS selector se element dhundho |
| `createElement` | Naya DOM element banao |
| `appendChild` | Child element add karo |
| `addEventListener` | Event handle karo |
| `textContent` | Safe text change |
| `classList.toggle` | Class on/off karo |
| `git branch` | Branch banao/dekho |
| `git checkout -b` | Nayi branch banao + switch |
| `git merge` | Branch merge karo |
| Merge Conflict | Manually resolve karo + commit |

---

## Aaj Kya Seekha?

- Interactive webpage banaya with DOM manipulation
- Events handle kiye — click, input, keydown
- Dynamic elements create aur delete kiye
- Git branching workflow samjha — create, switch, merge
- Merge conflicts simulate kiye aur resolve karna seekha
- Branch naming conventions seekhe
