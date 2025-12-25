# Day 18 Evening: Git Advanced — Hands-On Practice

> **Aaj ka plan:** Ab theory ho gayi, time hai haath gande karne ka! Aaj hum practically branches banayenge, intentionally conflicts create karenge, resolve karenge, rebase workflow practice karenge, stash aur cherry-pick use karenge.

---

## Practice Setup

Pehle ek fresh practice repository banao:

```bash
# Naya folder banao aur Git init karo
mkdir git-advanced-practice
cd git-advanced-practice
git init

# Pehli file banao
echo "# Farm Management System" > README.md
echo "A system to manage farmer data" >> README.md
git add README.md
git commit -m "Initial commit: add README"
```

> **Tip:** Har exercise ke liye fresh repo banana best hai — koi purana conflict ya confusion nahi hoga.

---

## Exercise 1: Merge Practice

### Task: Do branches banao aur merge karo

**Step 1:** Main branch pe base file banao

```javascript
// farmer.js — base file banao
const farmers = [
  { name: "Rajesh", crop: "Wheat", area: "5 acres" },
  { name: "Suresh", crop: "Rice", area: "3 acres" }
];

// Farmer list print karo
function showFarmers() {
  farmers.forEach(f => {
    console.log(`${f.name} grows ${f.crop} on ${f.area}`);
  });
}

showFarmers();
```

```bash
# File create aur commit karo
git add farmer.js
git commit -m "Add farmer data and display function"
```

**Step 2:** Feature branch banao

```bash
# Naya branch banao aur switch karo
git checkout -b feature-add-farmer
```

```javascript
// farmer.js mein naya farmer add karo
const farmers = [
  { name: "Rajesh", crop: "Wheat", area: "5 acres" },
  { name: "Suresh", crop: "Rice", area: "3 acres" },
  { name: "Priya", crop: "Cotton", area: "7 acres" }  // Naya farmer
];

// Farmer list print karo
function showFarmers() {
  farmers.forEach(f => {
    console.log(`${f.name} grows ${f.crop} on ${f.area}`);
  });
}

// Total area calculate karo (naya function)
function totalArea() {
  const total = farmers.reduce((sum, f) => sum + parseInt(f.area), 0);
  console.log(`Total farming area: ${total} acres`);
}

showFarmers();
totalArea();
```

```bash
git add farmer.js
git commit -m "Add new farmer Priya and totalArea function"
```

**Step 3:** Main branch pe wapas jao aur merge karo

```bash
git checkout main
git merge feature-add-farmer
# Fast-forward merge hona chahiye!
```

> **Expected Output:**
> ```
> Updating abc1234..def5678
> Fast-forward
>  farmer.js | 10 ++++++++--
>  1 file changed, 8 insertions(+), 2 deletions(-)
> ```

> **Practice Time!** Branch delete karo merge ke baad:
> ```bash
> git branch -d feature-add-farmer
> git log --oneline --graph
> ```

---

## Exercise 2: Intentional Merge Conflict

### Task: Same file ki same line do branches mein edit karo

**Step 1:** Do branches banao main se

```bash
# Branch 1 banao
git checkout -b branch-rajesh

# farmer.js mein Rajesh ka crop change karo
# Line 2: { name: "Rajesh", crop: "Corn", area: "5 acres" }
# (Wheat ko Corn karo)
```

```bash
git add farmer.js
git commit -m "Change Rajesh crop to Corn"
```

```bash
# Main pe wapas jao
git checkout main

# Branch 2 banao
git checkout -b branch-sunil

# farmer.js mein SAME LINE edit karo
# Line 2: { name: "Rajesh", crop: "Sugarcane", area: "5 acres" }
# (Wheat ko Sugarcane karo)
```

```bash
git add farmer.js
git commit -m "Change Rajesh crop to Sugarcane"
```

**Step 2:** Merge karo — Conflict aayega!

```bash
git checkout main

# Pehle ek branch merge karo (ye smooth hoga)
git merge branch-rajesh
# Fast-forward merge

# Ab doosri branch merge karo — CONFLICT!
git merge branch-sunil
```

> **Expected Output:**
> ```
> Auto-merging farmer.js
> CONFLICT (content): Merge conflict in farmer.js
> Automatic merge failed; fix conflicts and then commit the result.
> ```

**Step 3:** Conflict resolve karo

```bash
# Status dekho
git status
# both modified: farmer.js

# File kholo — ye dikhega:
```

```
<<<<<<< HEAD
  { name: "Rajesh", crop: "Corn", area: "5 acres" },
=======
  { name: "Rajesh", crop: "Sugarcane", area: "5 acres" },
>>>>>>> branch-sunil
```

```javascript
// Decide karo kya rakhna hai — dono crops rakh lete hain
  { name: "Rajesh", crop: "Corn & Sugarcane", area: "5 acres" },
```

```bash
# Resolve ke baad stage aur commit karo
git add farmer.js
git commit -m "Resolve conflict: combine Rajesh crops"
```

> **Practice Time!** `git log --oneline --graph --all` run karo aur dekhlo branching structure kaise dikh rahi hai.

---

## Exercise 3: Rebase Workflow

### Task: Feature branch ko rebase karo main pe

```bash
# Fresh start ke liye naya file banao main pe
git checkout main

# config.js banao
echo 'const config = { port: 3000, db: "mongodb://localhost" };' > config.js
echo 'module.exports = config;' >> config.js
git add config.js
git commit -m "Add config file"

# Feature branch banao
git checkout -b feature-api

# API file banao
cat > api.js << 'JSEOF'
// API routes for farmer management
const express = require('express');
const router = express.Router();

// GET all farmers
router.get('/farmers', (req, res) => {
  res.json({ message: "All farmers list" });
});

module.exports = router;
JSEOF

git add api.js
git commit -m "Add basic API routes"

# Ek aur commit feature branch pe
cat >> api.js << 'JSEOF'

// POST new farmer
router.post('/farmers', (req, res) => {
  res.json({ message: "Farmer added!" });
});
JSEOF

git add api.js
git commit -m "Add POST route for farmers"
```

Ab main branch pe kuch aur commits daalo:

```bash
git checkout main
echo 'const logger = (msg) => console.log(`[LOG]: ${msg}`);' > logger.js
echo 'module.exports = logger;' >> logger.js
git add logger.js
git commit -m "Add logger utility"
```

Ab rebase karo:

```bash
# Feature branch pe jao
git checkout feature-api

# Main ke upar rebase karo
git rebase main
```

> **Expected Output:**
> ```
> Successfully rebased and updated refs/heads/feature-api.
> ```

```bash
# Check karo — linear history dikhegi
git log --oneline --graph --all
```

> **Yaad Rakho:** Rebase ke baad feature branch ke commits naye hash ke saath aa jaate hain. Isliye shared branch pe kabhi rebase mat karo!

---

## Exercise 4: Git Stash Practice

### Task: Kaam beech mein save karo aur baad mein continue karo

```bash
git checkout main

# Kuch changes karo (commit mat karo)
echo "// TODO: Add authentication" >> api.js 2>/dev/null || echo "// TODO: Add authentication" > api.js
echo "// TODO: Add validation" >> farmer.js
```

```bash
# Achanak urgent bug fix karna hai!
# Changes stash karo
git stash save "incomplete auth and validation work"

# Dekho — working directory clean hai
git status
# nothing to commit, working tree clean

# Stash list dekho
git stash list
# stash@{0}: On main: incomplete auth and validation work
```

```bash
# Bug fix karo
git checkout -b hotfix-urgent
echo "// Bug fixed!" > bugfix.js
git add bugfix.js
git commit -m "Fix urgent production bug"
git checkout main
git merge hotfix-urgent

# Ab stash wapas laao
git stash pop
# Tumhare incomplete changes wapas aa gaye!
git status
```

> **Practice Time!** Multiple stashes banao aur specific stash apply karo:
> ```bash
> # Stash 1
> echo "change 1" > temp1.txt
> git stash save "first stash"
> 
> # Stash 2
> echo "change 2" > temp2.txt
> git stash save "second stash"
> 
> # List dekho
> git stash list
> 
> # Pehli stash apply karo (second one, kyunki stack hai — LIFO)
> git stash apply stash@{1}
> ```

---

## Exercise 5: Cherry-Pick Practice

### Task: Specific commit ko doosri branch mein laao

```bash
# Feature branch pe kuch commits karo
git checkout -b feature-payments

echo 'function processPayment(amount) { return "Paid: " + amount; }' > payment.js
git add payment.js
git commit -m "Add payment processing function"

echo 'function validateCard(number) { return number.length === 16; }' > validate.js
git add validate.js
git commit -m "Add card validation - CRITICAL BUG FIX"

echo 'function paymentHistory() { return []; }' > history.js
git add history.js
git commit -m "Add payment history feature"

# Commit hashes dekho
git log --oneline
# abc1234 Add payment history feature
# def5678 Add card validation - CRITICAL BUG FIX  <-- ye chahiye
# ghi9012 Add payment processing function
```

```bash
# Sirf critical bug fix main mein chahiye
git checkout main

# Cherry-pick karo (apna actual hash use karo!)
git cherry-pick def5678  # <-- apna hash daalo
```

> **Expected Output:**
> ```
> [main xyz7890] Add card validation - CRITICAL BUG FIX
>  1 file changed, 1 insertion(+)
>  create mode 100644 validate.js
> ```

---

## Exercise 6: .gitignore Practice

### Task: Proper .gitignore setup karo

```bash
# Project mein unnecessary files banao
mkdir node_modules
echo "fake package" > node_modules/package.txt
echo "DB_PASSWORD=secret123" > .env
echo "local notes" > .DS_Store
mkdir logs
echo "error log" > logs/error.log

# .gitignore banao
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.production

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Build output
dist/
build/
EOF

git add .gitignore
git commit -m "Add comprehensive .gitignore"
```

```bash
# Check karo — ignored files show nahi honge
git status
# .env, node_modules, logs — kuch nahi dikhega!

# Kya ignore ho raha hai dekho
git status --ignored
```

> **Warning:** Agar `.env` pehle se tracked hai to pehle `git rm --cached .env` karo, phir .gitignore mein add karo!

---

## Mini Challenge: Complete Git Workflow

### Scenario: Farm Management App ke liye team workflow simulate karo

```bash
# 1. Fresh repo banao
mkdir farm-app && cd farm-app && git init

# 2. Initial setup
echo "# Farm Management App" > README.md
git add README.md
git commit -m "Initial commit"

# 3. Feature branch banao
git checkout -b feature-dashboard

# 4. Dashboard code likho
cat > dashboard.js << 'JSEOF'
// Farm Dashboard
// Kisan ke liye ek simple dashboard

function getDashboardData() {
  return {
    totalFarmers: 150,
    totalArea: "500 acres",
    activeCrops: ["Wheat", "Rice", "Cotton"],
    weather: "Sunny, 32°C"
  };
}

function displayDashboard() {
  const data = getDashboardData();
  console.log("=== Farm Dashboard ===");
  console.log(`Farmers: ${data.totalFarmers}`);
  console.log(`Area: ${data.totalArea}`);
  console.log(`Crops: ${data.activeCrops.join(", ")}`);
  console.log(`Weather: ${data.weather}`);
}

module.exports = { getDashboardData, displayDashboard };
JSEOF

git add dashboard.js
git commit -m "Add farm dashboard module"

# 5. Main pe wapas jao, doosra feature banao
git checkout main
git checkout -b feature-reports

cat > reports.js << 'JSEOF'
// Farm Reports Module
function generateReport(type) {
  const reports = {
    daily: "Daily harvest: 50 quintals",
    weekly: "Weekly summary: 350 quintals",
    monthly: "Monthly total: 1500 quintals"
  };
  return reports[type] || "Invalid report type";
}

module.exports = { generateReport };
JSEOF

git add reports.js
git commit -m "Add farm reports module"

# 6. Dono branches ko main mein merge karo
git checkout main
git merge feature-dashboard
git merge feature-reports

# 7. Graph dekho — beautiful branching!
git log --oneline --graph --all

# 8. Branches clean up karo
git branch -d feature-dashboard
git branch -d feature-reports
```

> **Practice Time!** Ab ek conflict scenario create karo — dono branches mein README.md ko edit karo aur merge karo. Conflict resolve karke commit karo.

---

## Bonus Challenge: Interactive Rebase Scenario

```bash
# Multiple commits banao
echo "v1" > app.js && git add app.js && git commit -m "Add app v1"
echo "v2" > app.js && git add app.js && git commit -m "Add app v2"
echo "typo fix" > app.js && git add app.js && git commit -m "Fix typo"
echo "v3" > app.js && git add app.js && git commit -m "Add app v3"

# Log dekho
git log --oneline
# 4 commits dikhenge

# Rebase se last 3 commits squash karo (ek mein combine)
# (Interactive rebase — advanced topic, try karo!)
# git rebase -i HEAD~3
```

---

## Quick Revision Table

| Exercise | Kya Kiya | Key Command |
|----------|----------|-------------|
| Merge | Branch combine ki | `git merge branch-name` |
| Conflict | Same line edit, resolve kiya | Manually edit + `git add` + `git commit` |
| Rebase | Linear history banayi | `git rebase main` |
| Stash | Changes temporarily save kiye | `git stash` / `git stash pop` |
| Cherry-pick | Specific commit uthaya | `git cherry-pick <hash>` |
| .gitignore | Unnecessary files ignore kiye | `.gitignore` file |

---

## Aaj Kya Seekha?

1. **Merge** practically kiya — fast-forward aur 3-way dono
2. **Conflict intentionally create kiya** aur successfully resolve kiya
3. **Rebase workflow** practice kiya — clean linear history banayi
4. **Stash** se kaam temporarily save kiya aur wapas laaya
5. **Cherry-pick** se specific commit doosri branch mein laaya
6. **.gitignore** properly setup kiya — secrets aur junk files ignore kiye
7. **Team workflow** simulate kiya — branching, merging, cleanup

> **Yaad Rakho:** Git Advanced concepts roz ki professional development mein use hote hain. Jo developer Git ache se jaanta hai, wo team mein sabse valuable hota hai. Roz 10 minute Git practice karo — ek mahine mein expert ban jaoge!
