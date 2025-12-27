# Day 23 Evening: npm Practice — Build a Colorful CLI Tool + Linux Practice

> **Aaj ka plan:** Ab npm practically use karenge — project initialize karenge, popular packages install karenge (lodash, chalk, dotenv), ek colorful CLI tool banayenge, aur saath mein kuch Linux/terminal commands bhi practice karenge.

---

## Exercise 1: Project Setup with npm

### Task: Professional project initialize karo

```bash
# Project folder banao
mkdir farm-cli-tool
cd farm-cli-tool

# npm init karo
npm init -y

# Folder structure banao
mkdir src
mkdir src/utils
mkdir src/commands
touch src/index.js
touch src/utils/helpers.js
touch src/commands/farmer.js
touch .env
touch .gitignore
```

### .gitignore setup karo

```gitignore
# .gitignore
node_modules/
.env
*.log
dist/
.DS_Store
Thumbs.db
```

### .env file setup karo

```env
# .env
APP_NAME=Farm CLI Tool
APP_VERSION=1.0.0
ADMIN_NAME=Rajesh
MAX_FARMERS=100
DB_HOST=localhost
DB_PORT=27017
```

> **Terminal Command:**
> ```bash
> # Verify structure
> ls -la
> ls -R src/
> ```

---

## Exercise 2: Install Popular Packages

### Task: Useful packages install karo

```bash
# Production dependencies
npm install chalk@4       # Colorful terminal output (v4 for CommonJS)
npm install dotenv        # .env file se variables load karo
npm install lodash        # Utility functions
npm install boxen@5       # Boxes in terminal (v5 for CommonJS)
npm install ora@5         # Loading spinners (v5 for CommonJS)

# Dev dependencies
npm install -D nodemon    # Auto-restart on file changes

# Check kya install hua
npm list --depth=0
```

> **Tip:** chalk, boxen, ora ke latest versions ESM-only hain. CommonJS (require) ke liye purane versions use karo. Hum abhi CommonJS use kar rahe hain.

### package.json update karo

```json
{
  "name": "farm-cli-tool",
  "version": "1.0.0",
  "description": "A colorful CLI tool for farm management",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "farmer:add": "node src/commands/farmer.js add",
    "farmer:list": "node src/commands/farmer.js list",
    "clean": "rm -rf node_modules package-lock.json"
  },
  "author": "Your Name",
  "license": "MIT"
}
```

---

## Exercise 3: Using dotenv

### Task: Environment variables load karo

```javascript
// src/utils/config.js
require('dotenv').config();

const config = {
  appName: process.env.APP_NAME || "Farm App",
  version: process.env.APP_VERSION || "0.0.1",
  adminName: process.env.ADMIN_NAME || "Admin",
  maxFarmers: parseInt(process.env.MAX_FARMERS) || 50,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 27017
  }
};

// Validate required config
function validateConfig() {
  const required = ['APP_NAME', 'APP_VERSION'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️ Missing env variables: ${missing.join(', ')}`);
    console.warn('   Copy .env.example to .env and fill values');
  }
  return missing.length === 0;
}

module.exports = { config, validateConfig };
```

```javascript
// Test karo
// src/test-config.js
const { config, validateConfig } = require('./utils/config');

console.log("App Config:");
console.log("  Name:", config.appName);
console.log("  Version:", config.version);
console.log("  Admin:", config.adminName);
console.log("  Max Farmers:", config.maxFarmers);
console.log("  DB:", `${config.db.host}:${config.db.port}`);
console.log("  Config valid:", validateConfig());
```

> **Terminal Command:**
> ```bash
> node src/test-config.js
> ```

> **Yaad Rakho:** `.env` file mein sensitive data (passwords, API keys) hota hai. Ye file **kabhi Git mein push mat karo!** Ek `.env.example` file banao jisme dummy values hon — wo push karo.

---

## Exercise 4: Using Lodash — Utility Functions

### Task: Lodash ke powerful functions use karo

```javascript
// src/utils/helpers.js
const _ = require('lodash');

// Farm data
const farmers = [
  { name: "Rajesh", crop: "Wheat", area: 5, revenue: 50000, state: "Rajasthan" },
  { name: "Priya", crop: "Rice", area: 3, revenue: 45000, state: "Punjab" },
  { name: "Suresh", crop: "Cotton", area: 7, revenue: 85000, state: "Gujarat" },
  { name: "Anita", crop: "Wheat", area: 4, revenue: 40000, state: "Rajasthan" },
  { name: "Mohan", crop: "Rice", area: 6, revenue: 72000, state: "Punjab" },
  { name: "Geeta", crop: "Cotton", area: 3, revenue: 36000, state: "Gujarat" },
  { name: "Vikram", crop: "Sugarcane", area: 10, revenue: 100000, state: "Maharashtra" },
  { name: "Sunita", crop: "Wheat", area: 8, revenue: 80000, state: "Rajasthan" }
];

// 1. groupBy — crop ke basis pe group karo
const byCrop = _.groupBy(farmers, 'crop');
console.log("\n🌾 Farmers by Crop:");
Object.entries(byCrop).forEach(([crop, group]) => {
  console.log(`  ${crop}: ${group.map(f => f.name).join(', ')}`);
});

// 2. sortBy — revenue ke basis pe sort karo
const topEarners = _.sortBy(farmers, 'revenue').reverse().slice(0, 3);
console.log("\n💰 Top 3 Earners:");
topEarners.forEach((f, i) => {
  console.log(`  ${i + 1}. ${f.name} — ₹${f.revenue.toLocaleString()}`);
});

// 3. sumBy — total area calculate karo
const totalArea = _.sumBy(farmers, 'area');
console.log(`\n📐 Total farming area: ${totalArea} acres`);

// 4. meanBy — average revenue
const avgRevenue = _.meanBy(farmers, 'revenue');
console.log(`📊 Average revenue: ₹${Math.round(avgRevenue).toLocaleString()}`);

// 5. uniqBy — unique states
const states = _.uniqBy(farmers, 'state').map(f => f.state);
console.log(`🗺️ States: ${states.join(', ')}`);

// 6. countBy — crop wise count
const cropCount = _.countBy(farmers, 'crop');
console.log("\n📋 Crop Distribution:", cropCount);

// 7. chunk — farmers ko batches mein baanto
const batches = _.chunk(farmers, 3);
console.log(`\n📦 Batches (3 per batch): ${batches.length} batches`);

// 8. pick / omit — object se specific fields
const firstFarmer = farmers[0];
const summary = _.pick(firstFarmer, ['name', 'crop', 'revenue']);
console.log("\n📝 Farmer Summary:", summary);
// { name: "Rajesh", crop: "Wheat", revenue: 50000 }

const withoutRevenue = _.omit(firstFarmer, ['revenue']);
console.log("📝 Without Revenue:", withoutRevenue);

// 9. debounce — function ko delay karo (search box jaise)
const searchFarmer = _.debounce((query) => {
  const results = farmers.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );
  console.log(`\n🔍 Search "${query}": Found ${results.length} farmers`);
}, 300);

// Simulate rapid typing
searchFarmer("Ra");
searchFarmer("Raj");
searchFarmer("Rajesh");  // Sirf ye execute hoga (300ms delay)

module.exports = { farmers };
```

> **Terminal Command:**
> ```bash
> node src/utils/helpers.js
> ```

---

## Exercise 5: Build Colorful CLI Tool

### Task: Chalk + Boxen se beautiful terminal output banao

```javascript
// src/index.js
const chalk = require('chalk');
const boxen = require('boxen');
const _ = require('lodash');
const { config } = require('./utils/config');

// === COLORFUL OUTPUT FUNCTIONS === //

// Welcome banner
function showBanner() {
  const banner = boxen(
    chalk.green.bold(`🌾 ${config.appName}\n`) +
    chalk.cyan(`Version: ${config.version}\n`) +
    chalk.yellow(`Admin: ${config.adminName}`),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green'
    }
  );
  console.log(banner);
}

// Colored table display
function displayFarmers(farmers) {
  console.log(chalk.bold.underline('\n📋 Farmer Registry\n'));

  const header = chalk.bold(
    `${'ID'.padEnd(5)}${'Name'.padEnd(15)}${'Crop'.padEnd(12)}${'Area'.padEnd(10)}${'Revenue'.padEnd(12)}${'State'}`
  );
  console.log(header);
  console.log(chalk.gray('─'.repeat(65)));

  farmers.forEach((farmer, index) => {
    const id = chalk.gray(`${(index + 1).toString().padEnd(5)}`);
    const name = chalk.white(farmer.name.padEnd(15));

    // Crop ko color karo based on type
    const cropColors = {
      'Wheat': chalk.yellow,
      'Rice': chalk.green,
      'Cotton': chalk.white,
      'Sugarcane': chalk.magenta,
      'default': chalk.cyan
    };
    const colorFn = cropColors[farmer.crop] || cropColors.default;
    const crop = colorFn(farmer.crop.padEnd(12));

    const area = chalk.blue(`${farmer.area} acres`.padEnd(10));

    // Revenue ko color karo based on amount
    const revColor = farmer.revenue >= 70000 ? chalk.green :
                     farmer.revenue >= 40000 ? chalk.yellow :
                     chalk.red;
    const revenue = revColor(`₹${farmer.revenue.toLocaleString()}`.padEnd(12));

    const state = chalk.gray(farmer.state);

    console.log(`${id}${name}${crop}${area}${revenue}${state}`);
  });

  console.log(chalk.gray('─'.repeat(65)));
}

// Statistics with colors
function showStats(farmers) {
  const totalArea = _.sumBy(farmers, 'area');
  const totalRevenue = _.sumBy(farmers, 'revenue');
  const avgRevenue = _.meanBy(farmers, 'revenue');

  const statsBox = boxen(
    chalk.bold.cyan('📊 Statistics\n\n') +
    chalk.white(`Total Farmers: ${chalk.bold.green(farmers.length)}\n`) +
    chalk.white(`Total Area: ${chalk.bold.blue(totalArea + ' acres')}\n`) +
    chalk.white(`Total Revenue: ${chalk.bold.green('₹' + totalRevenue.toLocaleString())}\n`) +
    chalk.white(`Avg Revenue: ${chalk.bold.yellow('₹' + Math.round(avgRevenue).toLocaleString())}\n`) +
    chalk.white(`Top Earner: ${chalk.bold.green(_.maxBy(farmers, 'revenue').name)}`),
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }
  );
  console.log(statsBox);
}

// Success message
function success(msg) {
  console.log(chalk.green.bold(`\n✅ ${msg}`));
}

// Error message
function error(msg) {
  console.log(chalk.red.bold(`\n❌ ${msg}`));
}

// Warning message
function warning(msg) {
  console.log(chalk.yellow.bold(`\n⚠️ ${msg}`));
}

// Info message
function info(msg) {
  console.log(chalk.cyan(`ℹ️ ${msg}`));
}

// === MAIN APP === //

const farmers = [
  { name: "Rajesh", crop: "Wheat", area: 5, revenue: 50000, state: "Rajasthan" },
  { name: "Priya", crop: "Rice", area: 3, revenue: 45000, state: "Punjab" },
  { name: "Suresh", crop: "Cotton", area: 7, revenue: 85000, state: "Gujarat" },
  { name: "Anita", crop: "Wheat", area: 4, revenue: 40000, state: "Rajasthan" },
  { name: "Mohan", crop: "Rice", area: 6, revenue: 72000, state: "Punjab" },
  { name: "Geeta", crop: "Cotton", area: 3, revenue: 36000, state: "Gujarat" },
  { name: "Vikram", crop: "Sugarcane", area: 10, revenue: 100000, state: "Maharashtra" },
  { name: "Sunita", crop: "Wheat", area: 8, revenue: 80000, state: "Rajasthan" }
];

// Run the CLI
showBanner();
displayFarmers(farmers);
showStats(farmers);

success("Farm data loaded successfully!");
warning("3 farmers need to update their crop info");
info(`Total ${farmers.length} farmers registered`);
error("Database backup is 3 days old!");

// Crop distribution
console.log(chalk.bold.underline('\n🌾 Crop Distribution\n'));
const cropGroups = _.groupBy(farmers, 'crop');
Object.entries(cropGroups).forEach(([crop, group]) => {
  const bar = chalk.green('█'.repeat(group.length * 3));
  console.log(`${crop.padEnd(12)} ${bar} ${group.length} farmers`);
});
```

> **Terminal Command:**
> ```bash
> npm start
> # Ya
> node src/index.js
> ```

---

## Exercise 6: Linux/Terminal Practice

### Task: Important terminal commands practice karo

```bash
# === FILE & DIRECTORY OPERATIONS === #

# Current directory
pwd

# List files (detailed)
ls -la

# List only JS files
ls *.js
ls src/**/*.js

# File size check
du -sh node_modules/  # node_modules ka size dekho (scary!)

# File count
find . -name "*.js" -not -path "./node_modules/*" | wc -l
# Kitni JS files hain (node_modules ke bina)

# === FILE CONTENT === #

# File content dekho
cat package.json

# First 10 lines
head -10 package.json

# Last 5 lines
tail -5 package.json

# Word count
wc -l src/index.js  # Lines count

# === SEARCH === #

# File mein text search karo
grep "require" src/index.js
grep -r "chalk" src/         # Recursive search
grep -rn "function" src/     # With line numbers

# === PROCESS === #

# Running processes
ps aux | grep node

# Kill a process
# kill <PID>

# === ENVIRONMENT === #

# Environment variables dekho
env | grep NODE
echo $PATH
echo $HOME

# Temporary env variable set karo
NODE_ENV=production node src/index.js

# === CHAINING COMMANDS === #

# && — pehla success ho to doosra chale
mkdir test-dir && cd test-dir && echo "Success!"

# || — pehla fail ho to doosra chale
cat nonexistent.txt || echo "File not found!"

# | (pipe) — ek ka output doosre ka input
npm list --depth=0 | grep lodash
cat package.json | grep "version"

# === PERMISSION === #

# File permissions dekho
ls -l src/index.js

# Make file executable
chmod +x src/index.js
```

### Task: Package inspection commands

```bash
# Package ki info dekho
npm info express

# Package ki saari versions
npm view express versions

# Konsa package kya depend karta hai
npm explain express 2>/dev/null || npm ls express

# Package ka size check
du -sh node_modules/lodash/
du -sh node_modules/chalk/

# Total node_modules size
du -sh node_modules/
```

> **Tip:** `node_modules` folder ka size usually bahut bada hota hai (50MB-500MB+). Isliye `.gitignore` mein zaroor daalo!

---

## Mini Challenge: Complete CLI App with Menu

### Task: Interactive menu-based CLI app banao

```javascript
// src/interactive.js
const chalk = require('chalk');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(chalk.cyan(question), resolve);
  });
}

const farmers = [];
let nextId = 1;

function showMenu() {
  console.log(chalk.bold.yellow('\n=== Farm CLI Tool ==='));
  console.log(chalk.white('1. Add Farmer'));
  console.log(chalk.white('2. List Farmers'));
  console.log(chalk.white('3. Search Farmer'));
  console.log(chalk.white('4. Remove Farmer'));
  console.log(chalk.white('5. Statistics'));
  console.log(chalk.red('6. Exit'));
}

async function addFarmer() {
  const name = await ask('  Name: ');
  const crop = await ask('  Crop: ');
  const area = await ask('  Area (acres): ');

  if (!name || !crop || !area) {
    console.log(chalk.red('❌ All fields required!'));
    return;
  }

  farmers.push({
    id: nextId++,
    name: name.trim(),
    crop: crop.trim(),
    area: parseFloat(area),
    addedAt: new Date().toLocaleString()
  });

  console.log(chalk.green(`\n✅ Farmer "${name.trim()}" added!`));
}

function listFarmers() {
  if (farmers.length === 0) {
    console.log(chalk.yellow('\n📋 No farmers registered yet.'));
    return;
  }

  console.log(chalk.bold('\n📋 Registered Farmers:'));
  farmers.forEach(f => {
    const status = chalk.green(`[${f.id}]`);
    console.log(`  ${status} ${f.name} — ${chalk.yellow(f.crop)} (${f.area} acres)`);
  });
}

async function searchFarmer() {
  const query = await ask('  Search name: ');
  const results = farmers.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  if (results.length === 0) {
    console.log(chalk.yellow(`\n🔍 No farmers matching "${query}"`));
  } else {
    console.log(chalk.green(`\n🔍 Found ${results.length} farmer(s):`));
    results.forEach(f => console.log(`  [${f.id}] ${f.name} — ${f.crop}`));
  }
}

async function main() {
  console.log(chalk.green.bold('\n🌾 Welcome to Farm CLI Tool!\n'));

  let running = true;
  while (running) {
    showMenu();
    const choice = await ask('\n> Choose option (1-6): ');

    switch (choice.trim()) {
      case '1': await addFarmer(); break;
      case '2': listFarmers(); break;
      case '3': await searchFarmer(); break;
      case '4':
        const id = await ask('  Farmer ID to remove: ');
        const idx = farmers.findIndex(f => f.id === parseInt(id));
        if (idx !== -1) {
          const removed = farmers.splice(idx, 1)[0];
          console.log(chalk.green(`\n✅ Removed: ${removed.name}`));
        } else {
          console.log(chalk.red('\n❌ Farmer not found!'));
        }
        break;
      case '5':
        console.log(chalk.bold('\n📊 Statistics:'));
        console.log(`  Total Farmers: ${chalk.green(farmers.length)}`);
        if (farmers.length > 0) {
          const totalArea = farmers.reduce((s, f) => s + f.area, 0);
          console.log(`  Total Area: ${chalk.blue(totalArea + ' acres')}`);
          const crops = [...new Set(farmers.map(f => f.crop))];
          console.log(`  Crops: ${chalk.yellow(crops.join(', '))}`);
        }
        break;
      case '6':
        console.log(chalk.green('\n👋 Goodbye! Happy Farming!\n'));
        running = false;
        break;
      default:
        console.log(chalk.red('\n❌ Invalid option!'));
    }
  }

  rl.close();
}

main();
```

> **Terminal Command:**
> ```bash
> node src/interactive.js
> ```

---

## Quick Revision Table

| Exercise | Package Used | Key Learning |
|----------|-------------|-------------|
| Project Setup | npm init | Professional structure |
| Config | dotenv | Environment variables |
| Data Processing | lodash | groupBy, sortBy, sumBy, etc. |
| Colorful Output | chalk, boxen | Terminal UI |
| Linux Practice | Terminal commands | grep, pipe, chmod |
| Interactive CLI | readline + chalk | Menu-based app |

---

## Aaj Kya Seekha?

1. **npm project** properly initialize kiya — package.json, .gitignore, .env
2. **dotenv** se environment variables manage kiye — secrets safe
3. **lodash** ke powerful functions use kiye — groupBy, sortBy, sumBy
4. **chalk + boxen** se colorful terminal output banaya
5. **Linux commands** practice kiye — grep, pipe, du, chmod
6. **Interactive CLI app** banaya — real-world tool
7. **npm scripts** likhe — automation

> **Yaad Rakho:** npm ecosystem bahut powerful hai. Har problem ka package available hai — lodash for utilities, chalk for colors, dotenv for config, express for servers. "Standing on the shoulders of giants" — npm ye possible banata hai! Kal hum ES6+ Modern JavaScript seekhenge!
