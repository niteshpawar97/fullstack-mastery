# Day 23 Morning: npm & Package Management

> **Aaj ka plan:** Aaj hum npm (Node Package Manager) ke baare mein sab kuch seekhenge — package.json kya hai, dependencies kaise install karte hain, semantic versioning kya hai, npx kya hai, aur node_modules kaise kaam karta hai. npm samajhna Node.js development ka foundation hai!

---

## npm Kya Hai?

### Node Package Manager

> **Socho Aise:** npm ek **library/store** hai jahan lakho readymade code packages available hain. Jaise kisan ko har cheez khud nahi banana padta — beej ki dukaan se beej, fertilizer ki dukaan se fertilizer le aata hai. Waise hi developer ko har cheez scratch se nahi likhni padti — npm se readymade packages install kar lete hain!

### npm Ke 3 Roles

| Role | Kya Karta Hai |
|------|-------------|
| **Package Registry** | Online database jahan 2 million+ packages hain |
| **CLI Tool** | Terminal command jo packages manage karta hai |
| **Website** | [npmjs.com](https://npmjs.com) — packages search karo |

```bash
# npm version check karo
npm --version
# 10.x.x ya upar

# Node.js ke saath npm automatically install hota hai
node --version
# v20.x.x ya upar
```

> **Yaad Rakho:** npm Node.js ke saath bundle aata hai — alag se install nahi karna padta.

---

## package.json — Project Ka ID Card

### package.json Kya Hai?

Ye file tumhare project ki **poori jaankari** rakhti hai — naam, version, dependencies, scripts, sab kuch.

### package.json Banao

```bash
# Interactive mode — har cheez poochega
npm init

# Quick mode — defaults ke saath
npm init -y
```

### package.json Structure

```json
{
  "name": "farm-management-app",
  "version": "1.0.0",
  "description": "A CLI app for managing farm data",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "lint": "eslint ."
  },
  "keywords": ["farm", "agriculture", "cli"],
  "author": "Rajesh Kumar",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  }
}
```

### Important Fields Explained

| Field | Kya Hai | Example |
|-------|---------|---------|
| `name` | Package ka naam (lowercase, no spaces) | `"farm-app"` |
| `version` | Current version | `"1.0.0"` |
| `main` | Entry point file | `"index.js"` |
| `scripts` | Shortcut commands | `"start": "node index.js"` |
| `dependencies` | Production packages | `"express": "^4.18.2"` |
| `devDependencies` | Development-only packages | `"jest": "^29.7.0"` |

---

## Dependencies vs devDependencies

### Kya Farak Hai?

```bash
# Production dependency — app ko run karne ke liye zaroori
npm install express
npm install dotenv
npm install mongoose

# Development dependency — sirf development ke liye
npm install --save-dev nodemon
npm install --save-dev jest
npm install --save-dev eslint
npm install -D prettier   # -D shortcut hai --save-dev ka
```

> **Socho Aise:** Socho ek kisan ka khet hai. **dependencies** = beej, paani, fertilizer (production ke liye zaroori). **devDependencies** = measuring tape, soil tester (khet banana ke waqt chahiye, fasal bechte waqt nahi).

| Type | Kab Install Hota | Use Case |
|------|-----------------|----------|
| `dependencies` | `npm install` pe hamesha | express, mongoose, dotenv |
| `devDependencies` | `npm install` pe (dev), `npm install --production` pe NAHI | jest, nodemon, eslint |

---

## Semantic Versioning (SemVer)

### Version Numbers Kaise Kaam Karte Hain?

```
  MAJOR . MINOR . PATCH
    4   .  18   .   2
```

| Part | Kab Badhta Hai | Example |
|------|---------------|---------|
| **MAJOR** | Breaking changes — purana code toot sakta hai | 3.0.0 → 4.0.0 |
| **MINOR** | Naye features — purana code safe hai | 4.17.0 → 4.18.0 |
| **PATCH** | Bug fixes — kuch nahi tootega | 4.18.1 → 4.18.2 |

### Version Ranges in package.json

```json
{
  "dependencies": {
    "exact": "4.18.2",        // Exact version — sirf 4.18.2
    "caret": "^4.18.2",       // ^  = MINOR aur PATCH update allowed (4.x.x)
    "tilde": "~4.18.2",       // ~  = Sirf PATCH update allowed (4.18.x)
    "greater": ">=4.18.0",    // 4.18.0 ya upar kuch bhi
    "star": "*",              // Kuch bhi — DANGER!
    "range": ">=4.0.0 <5.0.0" // 4.x.x range
  }
}
```

> **Yaad Rakho:** `^` (caret) sabse common hai — ye minor aur patch updates allow karta hai lekin major version nahi change hota. Safe hai kyunki breaking changes nahi aayenge.

### Example: Samjho practically

```
"express": "^4.18.2"

✅ Allow: 4.18.3, 4.19.0, 4.20.1
❌ Block: 5.0.0 (major change — breaking!)
```

> **Warning:** `"*"` kabhi mat use karo — ye koi bhi version install kar dega, breaking changes bhi!

---

## npm install / uninstall

### Packages Install Karo

```bash
# Ek package install karo
npm install lodash

# Multiple packages ek saath
npm install express dotenv cors

# Specific version install karo
npm install express@4.17.1

# Dev dependency
npm install -D nodemon

# Global install (system-wide)
npm install -g nodemon
npm install -g typescript
```

### Packages Remove Karo

```bash
# Package remove karo
npm uninstall lodash

# Dev dependency remove karo
npm uninstall -D nodemon

# Global package remove karo
npm uninstall -g nodemon
```

### Useful npm Commands

```bash
# Installed packages dekho
npm list
npm list --depth=0  # Sirf top-level packages

# Outdated packages check karo
npm outdated

# Packages update karo
npm update

# Security vulnerabilities check karo
npm audit

# Security fix karo (automatically)
npm audit fix

# Cache clear karo (agar issues aa rahe hain)
npm cache clean --force
```

---

## npx — Execute Without Installing

### npx Kya Hai?

npx ek command hai jo package ko **bina globally install kiye** run karne deta hai.

```bash
# ❌ OLD way: pehle install karo, phir use karo
npm install -g create-react-app
create-react-app my-app

# ✅ NEW way: npx se directly run karo
npx create-react-app my-app

# Kuch aur examples
npx cowsay "Hello Farmer!"
npx json-server --watch db.json
npx eslint --init
npx http-server
```

> **Socho Aise:** npx aise hai jaise tum dukaan se tool rent pe lete ho — kaam ho gaya to wapas kar diya. Install nahi karna padta permanently.

### npm run vs npx

```bash
# package.json scripts — npm run se chalte hain
npm run start     # "start" script chalega
npm run dev       # "dev" script chalega
npm run test      # "test" script chalega
npm test          # shortcut (test, start, stop ke liye "run" nahi chahiye)
npm start         # shortcut

# npx — direct executable run karo
npx nodemon index.js
npx jest --watch
```

---

## node_modules — Dependency Dungeon

### node_modules Kya Hai?

Jab tum `npm install` karte ho, sab packages `node_modules` folder mein download hote hain.

```
my-project/
├── node_modules/         ← Sab packages yahan hain
│   ├── express/         ← Express ka code
│   ├── lodash/          ← Lodash ka code
│   ├── body-parser/     ← Express ki dependency
│   └── ... (100s more)
├── package.json          ← Tumhare dependencies ki list
└── package-lock.json     ← Exact versions locked
```

> **Warning:** `node_modules` folder ko **kabhi Git mein push mat karo!** Ye bahut bada hota hai (100s of MB). `.gitignore` mein add karo.

```gitignore
# .gitignore
node_modules/
```

Jab koi tumhara project clone kare, wo sirf `npm install` run karega — node_modules automatically ban jaayega.

---

## package-lock.json — Version Lock

### Ye Kya Karta Hai?

`package-lock.json` har package ki **exact version** lock karta hai. Isse guarantee hoti hai ki sab ke paas same versions install honge.

```json
// package.json mein:
"express": "^4.18.2"  // 4.18.x kuch bhi aa sakta hai

// package-lock.json mein:
"express": {
  "version": "4.18.2",          // EXACT version locked
  "resolved": "https://...",     // Kahan se download hua
  "integrity": "sha512-..."      // File ka hash (security)
}
```

> **Yaad Rakho:** 
> - `package-lock.json` ko Git mein **zaroor push karo** — ye team ke liye consistency ensure karta hai
> - `node_modules` ko Git mein **kabhi push mat karo** — bahut bada hai
> - `package.json` + `package-lock.json` se koi bhi `npm install` karke exact same setup bana sakta hai

---

## Creating Your Own Package

### Simple Package Banao

```javascript
// my-farm-utils/index.js

/**
 * Farm Utility Functions
 * Kisan ke liye helpful utilities
 */

// Area convert karo — acres to hectares
function acresToHectares(acres) {
  return (acres * 0.4047).toFixed(2);
}

// Crop yield calculate karo
function calculateYield(area, yieldPerAcre) {
  return {
    totalYield: area * yieldPerAcre,
    unit: "quintals"
  };
}

// Profit calculate karo
function calculateProfit(revenue, expenses) {
  const profit = revenue - expenses;
  return {
    profit,
    margin: ((profit / revenue) * 100).toFixed(1) + "%",
    status: profit > 0 ? "Profit" : profit < 0 ? "Loss" : "Break-even"
  };
}

module.exports = {
  acresToHectares,
  calculateYield,
  calculateProfit
};
```

```json
// my-farm-utils/package.json
{
  "name": "my-farm-utils",
  "version": "1.0.0",
  "description": "Utility functions for farm management",
  "main": "index.js",
  "keywords": ["farm", "agriculture", "utility"],
  "author": "Your Name",
  "license": "MIT"
}
```

```javascript
// Use karo apne package ko (local testing)
const { acresToHectares, calculateYield, calculateProfit } = require('./my-farm-utils');

console.log(acresToHectares(5));          // "2.02" hectares
console.log(calculateYield(5, 20));       // { totalYield: 100, unit: "quintals" }
console.log(calculateProfit(50000, 30000)); // { profit: 20000, margin: "40.0%", status: "Profit" }
```

> **Tip:** Agar npm pe publish karna hai to `npm publish` command use karo (pehle npm pe account banana padega).

---

## npm Scripts — Automation

### Custom Scripts Likho

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest --verbose",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "build": "webpack --mode production",
    "clean": "rm -rf dist node_modules",
    "prestart": "echo 'Starting app...'",
    "poststart": "echo 'App started!'"
  }
}
```

```bash
# Scripts run karo
npm start              # "start" script
npm test               # "test" script
npm run dev            # Custom scripts ke liye "run" lagta hai
npm run lint
npm run test:watch

# Pre/Post hooks automatically chalte hain
npm start
# Output:
# Starting app...     ← prestart
# (app starts)        ← start
# App started!        ← poststart
```

> **Yaad Rakho:** `start`, `test`, `stop`, `restart` — ye built-in scripts hain, inke liye `run` nahi chahiye. Baaki sab custom scripts ke liye `npm run <name>` use karo.

---

## Quick Revision Table

| Concept | Kya Hai | Command/File |
|---------|---------|-------------|
| npm init | Project initialize karo | `npm init -y` |
| npm install | Package install karo | `npm install express` |
| dependencies | Production packages | `npm install package` |
| devDependencies | Dev-only packages | `npm install -D package` |
| Semantic Versioning | MAJOR.MINOR.PATCH | `"^4.18.2"` |
| npx | Run without installing | `npx create-react-app app` |
| node_modules | Downloaded packages | NEVER push to Git |
| package-lock.json | Exact versions locked | ALWAYS push to Git |
| npm scripts | Automation commands | `npm run script-name` |
| npm audit | Security check | `npm audit fix` |

---

## Aaj Kya Seekha?

1. **npm** — Node Package Manager, 2M+ packages ka ecosystem
2. **package.json** — project ka ID card, dependencies, scripts
3. **dependencies vs devDependencies** — production vs development packages
4. **Semantic Versioning** — MAJOR.MINOR.PATCH, `^` aur `~` ka matlab
5. **npm install/uninstall** — packages manage karna
6. **npx** — packages bina install kiye run karna
7. **node_modules** — downloaded packages (Git mein push mat karo!)
8. **package-lock.json** — exact versions lock (Git mein zaroor push karo!)
9. **npm scripts** — automation aur shortcuts
10. **Own package** — apna package banana

> **Yaad Rakho:** npm ek developer ka best friend hai. 2 million+ packages available hain — har problem ka solution already kisi ne likha hai. "Don't reinvent the wheel — npm install the wheel!" Evening mein hum practically npm use karke ek colorful CLI tool banayenge!
