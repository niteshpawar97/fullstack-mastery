# Day 2 Evening: Conditions & Strings Practice

> **Practice Time!** Operators, conditions aur string methods — ab code likh ke practice karo!

---

## Setup

> **Terminal Command:**
> ```bash
> mkdir fullstack-day2
> cd fullstack-day2
> git init
> ```

---

## Task 1: Grade Calculator

### Problem Statement

Student ke marks lo aur grade batao. File: `grade.js`

### Solution

```javascript
const studentName = "Priya";
const marks = 78;

let grade;
let remark;

if (marks >= 90) {
  grade = "A+";
  remark = "Outstanding! Bahut badhiya!";
} else if (marks >= 80) {
  grade = "A";
  remark = "Excellent! Bahut accha kaam!";
} else if (marks >= 70) {
  grade = "B";
  remark = "Good! Aur mehnat karo!";
} else if (marks >= 60) {
  grade = "C";
  remark = "Average. Zyada practice chahiye.";
} else if (marks >= 40) {
  grade = "D";
  remark = "Below average. Serious padhai karo!";
} else {
  grade = "F";
  remark = "Fail. Dubara try karo, haar mat mano!";
}

console.log(`Student: ${studentName}`);
console.log(`Marks: ${marks}/100`);
console.log(`Grade: ${grade}`);
console.log(`Remark: ${remark}`);

// Pass/Fail check
const status = marks >= 40 ? "PASS ✅" : "FAIL ❌";
console.log(`Status: ${status}`);
```

> **Expected Output:**
> ```
> Student: Priya
> Marks: 78/100
> Grade: B
> Remark: Good! Aur mehnat karo!
> Status: PASS ✅
> ```

---

## Task 2: Smart Farming Advisory System

### Problem Statement

Ek system banao jo weather conditions ke basis pe kisan ko advice de. File: `farming-advisor.js`

```javascript
// Weather Data
const temperature = 32;      // Celsius
const humidity = 65;          // percentage
const isRainy = false;
const windSpeed = 15;         // km/h
const soilMoisture = 30;     // percentage
const currentSeason = "summer";

console.log("🌾 ===== KISAN ADVISORY SYSTEM =====");
console.log(`📊 Temperature: ${temperature}°C`);
console.log(`💧 Humidity: ${humidity}%`);
console.log(`🌧️ Rain: ${isRainy ? "Haan" : "Nahi"}`);
console.log(`💨 Wind: ${windSpeed} km/h`);
console.log(`🌱 Soil Moisture: ${soilMoisture}%`);
console.log("====================================\n");

// Irrigation Decision
if (soilMoisture < 20) {
  console.log("🚨 URGENT: Turant sinchai karo!");
} else if (soilMoisture < 40 && !isRainy) {
  console.log("⚠️ Kal sinchai plan karo.");
} else if (soilMoisture > 80) {
  console.log("⛔ Over-watering! Sinchai band karo.");
} else {
  console.log("✅ Paani level theek hai.");
}

// Spray Advisory
const canSpray = !isRainy && windSpeed < 20 && humidity < 80;
console.log(`\n🧴 Spray advisory: ${canSpray ? "Spray kar sakte ho ✅" : "Aaj spray mat karo ❌"}`);

// Heat Advisory
if (temperature > 42) {
  console.log("\n🔥 Extreme heat! Workers ko shade mein rakhna.");
} else if (temperature > 35) {
  console.log("\n☀️ High heat — subah jaldi ya shaam ko kaam karo.");
}

// Season-specific tip
const seasonTip = currentSeason === "summer" 
  ? "Mulching karo — paani bachega" 
  : currentSeason === "winter" 
  ? "Frost protection lagao" 
  : "Regular monitoring karo";

console.log(`\n💡 Season Tip (${currentSeason}): ${seasonTip}`);
```

---

## Task 3: String Manipulation — Data Cleaning

### Problem Statement

Real world mein data messy aata hai. Clean karna seekho. File: `string-clean.js`

```javascript
// Messy data (jaise form se aata hai)
const rawName = "   raMeSH   kuMAR   ";
const rawEmail = "  Ramesh.Kumar@Gmail.COM  ";
const rawPhone = "+91-98765-43210";
const rawAddress = "village: nashik, district: nashik, state: maharashtra";

// Clean the data
const cleanName = rawName.trim().toLowerCase().split(/\s+/)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ");

const cleanEmail = rawEmail.trim().toLowerCase();
const cleanPhone = rawPhone.replace(/[-+\s]/g, "");
const cleanState = rawAddress.split(",")
  .find(part => part.includes("state"))
  ?.split(":")[1]
  ?.trim()
  ?.toUpperCase();

console.log("=== Cleaned Data ===");
console.log(`Name: ${cleanName}`);
console.log(`Email: ${cleanEmail}`);
console.log(`Phone: ${cleanPhone}`);
console.log(`State: ${cleanState}`);

// Validation
const isEmailValid = cleanEmail.includes("@") && cleanEmail.includes(".");
const isPhoneValid = cleanPhone.length === 12; // with country code
console.log(`\nEmail valid: ${isEmailValid ? "✅" : "❌"}`);
console.log(`Phone valid: ${isPhoneValid ? "✅" : "❌"}`);
```

> **Tip:** Real projects mein data cleaning bahut important hai. User se jo data aata hai wo kabhi clean nahi hota!

---

## Git Practice

```bash
# Status check karo
git status

# Saari files add karo
git add .

# Commit karo
git commit -m "Day 2: Operators, conditions, and string methods practice"

# Log dekho
git log --oneline
```

---

## Homework

1. **Age Calculator** banao — birthdate se current age calculate karo
2. **Password Strength Checker** — length, uppercase, number check karo (hint: `.length`, `.match()`)
3. **BMI Calculator** with health category (Underweight/Normal/Overweight/Obese)
4. Sab kaam ka **git commit** karo

> **Warning:** Variables ke naam meaningful rakho! `x`, `y`, `temp` mat use karo — `temperature`, `soilMoisture`, `studentName` use karo. Code padh ke samajh aana chahiye.

---

## Aaj Ka Summary

- ✅ Operators practice — arithmetic, comparison, logical
- ✅ if/else conditions ke saath real-world problems solve kiye
- ✅ String methods se data cleaning ki
- ✅ Git commit practice
