# Day 3 Evening: Arrays & Loops Practice

> **Practice Time!** Arrays aur loops — real problems solve karo!

---

## Setup

> **Terminal Command:**
> ```bash
> mkdir fullstack-day3
> cd fullstack-day3
> git init
> ```

---

## Task 1: Kisan Market Price Tracker

### Problem Statement

Ek system banao jo market prices track kare, analysis kare, aur report de. File: `market-tracker.js`

### Solution

```javascript
// Market Data
const crops = [
  { name: "Tomato", price: 45, quantity: 100 },
  { name: "Onion", price: 35, quantity: 200 },
  { name: "Potato", price: 25, quantity: 150 },
  { name: "Wheat", price: 22, quantity: 500 },
  { name: "Rice", price: 40, quantity: 300 },
  { name: "Cotton", price: 65, quantity: 80 },
  { name: "Sugarcane", price: 3, quantity: 1000 },
];

// 1. Print all crops with for...of
console.log("🌾 ===== MARKET PRICE LIST =====");
for (const crop of crops) {
  console.log(`  ${crop.name}: Rs.${crop.price}/kg (${crop.quantity} kg available)`);
}

// 2. Total market value using reduce
const totalValue = crops.reduce((sum, crop) => sum + (crop.price * crop.quantity), 0);
console.log(`\n💰 Total Market Value: Rs.${totalValue.toLocaleString()}`);

// 3. Find expensive crops (above Rs.30/kg) using filter
const expensive = crops.filter(crop => crop.price > 30);
console.log(`\n📈 Expensive Crops (>Rs.30/kg):`);
expensive.forEach(crop => console.log(`  - ${crop.name}: Rs.${crop.price}/kg`));

// 4. Create price report using map
const report = crops.map(crop => ({
  crop: crop.name,
  revenue: crop.price * crop.quantity,
  category: crop.price > 40 ? "Premium" : crop.price > 20 ? "Standard" : "Budget"
}));

console.log("\n📊 Revenue Report:");
report.forEach(item => {
  console.log(`  ${item.crop}: Rs.${item.revenue.toLocaleString()} [${item.category}]`);
});

// 5. Sort by price (highest first)
const sorted = [...crops].sort((a, b) => b.price - a.price);
console.log("\n🏆 Crops by Price (High to Low):");
sorted.forEach((crop, i) => {
  console.log(`  ${i + 1}. ${crop.name} — Rs.${crop.price}/kg`);
});

// 6. Average price
const avgPrice = crops.reduce((sum, crop) => sum + crop.price, 0) / crops.length;
console.log(`\n📉 Average Price: Rs.${avgPrice.toFixed(2)}/kg`);
```

> **Expected Output:**
> ```
> 🌾 ===== MARKET PRICE LIST =====
>   Tomato: Rs.45/kg (100 kg available)
>   Onion: Rs.35/kg (200 kg available)
>   ...
> 
> 💰 Total Market Value: Rs.39,550
> 
> 📈 Expensive Crops (>Rs.30/kg):
>   - Tomato: Rs.45/kg
>   - Onion: Rs.35/kg
>   ...
> ```

---

## Task 2: Number Cruncher

File: `number-crunch.js`

```javascript
const numbers = [12, 45, 7, 89, 23, 56, 34, 67, 2, 90, 15, 78];

// 1. Find even and odd numbers
const even = numbers.filter(n => n % 2 === 0);
const odd = numbers.filter(n => n % 2 !== 0);
console.log("Even:", even);
console.log("Odd:", odd);

// 2. Sum of all numbers
const sum = numbers.reduce((s, n) => s + n, 0);
console.log("Sum:", sum);

// 3. Min and Max
const min = Math.min(...numbers);
const max = Math.max(...numbers);
console.log(`Min: ${min}, Max: ${max}`);

// 4. Double each number
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

// 5. Numbers greater than average
const avg = sum / numbers.length;
const aboveAvg = numbers.filter(n => n > avg);
console.log(`Average: ${avg.toFixed(1)}`);
console.log("Above Average:", aboveAvg);

// 6. Sort ascending and descending
console.log("Ascending:", [...numbers].sort((a, b) => a - b));
console.log("Descending:", [...numbers].sort((a, b) => b - a));
```

> **Yaad Rakho:** `.sort()` original array change karta hai! Agar original bachana hai to `[...array]` se copy banao pehle (spread operator).

---

## Task 3: Linux Commands Practice

Terminal mein ye commands practice karo:

```bash
# File operations
touch index.js         # empty file banao
echo "hello" > test.txt  # file mein likho
cat test.txt           # file padho
cp test.txt backup.txt  # copy karo
mv backup.txt old.txt   # rename karo
rm old.txt             # delete karo

# List with details
ls -la                 # saari files with permissions

# File content
wc -l market-tracker.js  # lines count karo

# Search
grep "console" market-tracker.js  # "console" wali lines dhundho
```

> **Tip:** Linux commands roz 10 minute practice karo. Ek mahine mein natural feel hone lagenge!

---

## Mini Project: Student Report Card Generator

File: `report-card.js`

```javascript
const students = [
  { name: "Priya", marks: { math: 85, science: 92, english: 78, hindi: 88 } },
  { name: "Rahul", marks: { math: 65, science: 70, english: 82, hindi: 75 } },
  { name: "Amit", marks: { math: 92, science: 88, english: 95, hindi: 90 } },
  { name: "Sneha", marks: { math: 45, science: 52, english: 60, hindi: 55 } },
];

console.log("📋 ===== STUDENT REPORT CARDS =====\n");

const results = students.map(student => {
  const marksArray = Object.values(student.marks);
  const total = marksArray.reduce((sum, m) => sum + m, 0);
  const percentage = total / marksArray.length;
  
  let grade;
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 40) grade = "D";
  else grade = "F";

  return { ...student, total, percentage, grade, pass: percentage >= 40 };
});

// Print each student's report
results.forEach(r => {
  console.log(`📌 ${r.name}`);
  console.log(`   Math: ${r.marks.math} | Science: ${r.marks.science} | English: ${r.marks.english} | Hindi: ${r.marks.hindi}`);
  console.log(`   Total: ${r.total}/400 | Percentage: ${r.percentage.toFixed(1)}%`);
  console.log(`   Grade: ${r.grade} | Status: ${r.pass ? "PASS ✅" : "FAIL ❌"}\n`);
});

// Class statistics
const allPercentages = results.map(r => r.percentage);
const classAvg = allPercentages.reduce((s, p) => s + p, 0) / allPercentages.length;
const topper = results.reduce((top, r) => r.percentage > top.percentage ? r : top);
const passCount = results.filter(r => r.pass).length;

console.log("📊 ===== CLASS STATISTICS =====");
console.log(`Class Average: ${classAvg.toFixed(1)}%`);
console.log(`Topper: ${topper.name} (${topper.percentage.toFixed(1)}%)`);
console.log(`Pass: ${passCount}/${results.length}`);
console.log(`Fail: ${results.length - passCount}/${results.length}`);
```

---

## Homework

1. **Todo List** — Array mein tasks add/remove/display karo
2. **FizzBuzz** — 1-100 mein: 3 ka multiple = "Fizz", 5 ka = "Buzz", dono ka = "FizzBuzz"
3. **Array Flatten** — Nested array ko flat karo: `[[1,2],[3,4],[5]] → [1,2,3,4,5]`
4. **Git commit** karo poora kaam

> **Warning:** `for...in` loop arrays ke liye mat use karo — ye objects ke liye hai. Arrays ke liye `for...of` use karo!

---

## Aaj Ka Summary

- ✅ Array CRUD operations practice kiye
- ✅ map, filter, reduce se real problems solve kiye
- ✅ Loops ke saath data processing ki
- ✅ Linux commands practice kiye
- ✅ Mini project complete kiya — Report Card Generator
