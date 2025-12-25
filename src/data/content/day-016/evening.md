# Day 16 Evening: Sorting Practice — Implement, Compare & Real-World Problems

> **Practice Time!** Morning mein seekha Bubble, Selection, Insertion Sort. Ab teeno implement karenge, performance compare karenge, kisan market prices sort karenge, aur JS ka built-in `.sort()` master karenge!

---

## Setup: Project Folder Banao

> **Terminal Command:**
> ```bash
> mkdir day16-sorting
> cd day16-sorting
> git init
> code .
> ```

---

## Task 1: All Three Sorts — Complete Implementation

### Problem Statement

Teeno sorting algorithms implement karo with step counting aur visual output.

### Solution

```javascript
// sorting-algorithms.js — Teeno sorts ek file mein

// ===== BUBBLE SORT =====
function bubbleSort(arr) {
    const result = [...arr];  // Copy banao (original safe rahe)
    const n = result.length;
    let swaps = 0;
    let comparisons = 0;

    for (let i = 0; i < n - 1; i++) {
        let swapped = false;

        for (let j = 0; j < n - 1 - i; j++) {
            comparisons++;
            if (result[j] > result[j + 1]) {
                [result[j], result[j + 1]] = [result[j + 1], result[j]];
                swaps++;
                swapped = true;
            }
        }

        if (!swapped) break;  // Optimization: already sorted
    }

    return { sorted: result, swaps, comparisons };
}

// ===== SELECTION SORT =====
function selectionSort(arr) {
    const result = [...arr];
    const n = result.length;
    let swaps = 0;
    let comparisons = 0;

    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;

        for (let j = i + 1; j < n; j++) {
            comparisons++;
            if (result[j] < result[minIndex]) {
                minIndex = j;
            }
        }

        if (minIndex !== i) {
            [result[i], result[minIndex]] = [result[minIndex], result[i]];
            swaps++;
        }
    }

    return { sorted: result, swaps, comparisons };
}

// ===== INSERTION SORT =====
function insertionSort(arr) {
    const result = [...arr];
    const n = result.length;
    let shifts = 0;  // Insertions mein shifts count
    let comparisons = 0;

    for (let i = 1; i < n; i++) {
        const key = result[i];
        let j = i - 1;

        while (j >= 0 && result[j] > key) {
            comparisons++;
            result[j + 1] = result[j];
            shifts++;
            j--;
        }
        comparisons++;  // Last comparison (jo false aayi)
        result[j + 1] = key;
    }

    return { sorted: result, shifts, comparisons };
}

// ===== TESTING =====
const testArrays = {
    "Random":         [64, 34, 25, 12, 22, 11, 90, 45, 67, 33],
    "Already Sorted": [11, 12, 22, 25, 33, 34, 45, 64, 67, 90],
    "Reverse Sorted": [90, 67, 64, 45, 34, 33, 25, 22, 12, 11],
    "Nearly Sorted":  [11, 12, 25, 22, 33, 34, 45, 64, 90, 67]
};

console.log("╔══════════════════════════════════════════════╗");
console.log("║     SORTING ALGORITHMS COMPARISON            ║");
console.log("╚══════════════════════════════════════════════╝\n");

for (const [name, arr] of Object.entries(testArrays)) {
    console.log(`\n=== ${name} Data ===`);
    console.log(`Input: [${arr.join(", ")}]\n`);

    const bubble = bubbleSort(arr);
    const selection = selectionSort(arr);
    const insertion = insertionSort(arr);

    console.log("Algorithm".padEnd(18) + "Comparisons".padEnd(14) + "Swaps/Shifts");
    console.log("-".repeat(45));
    console.log("Bubble Sort".padEnd(18) + String(bubble.comparisons).padEnd(14) + bubble.swaps);
    console.log("Selection Sort".padEnd(18) + String(selection.comparisons).padEnd(14) + selection.swaps);
    console.log("Insertion Sort".padEnd(18) + String(insertion.comparisons).padEnd(14) + insertion.shifts);

    // Verify sab same result de rahe hain
    console.log(`\nResult: [${bubble.sorted.join(", ")}]`);
}
```

> **Terminal Command:**
> ```bash
> node sorting-algorithms.js
> ```

> **Yaad Rakho:** Already sorted array pe Bubble Sort aur Insertion Sort bahut kam comparisons karte hain (best case O(n)). Selection Sort hamesha same number of comparisons karta hai!

---

## Task 2: Performance Benchmark — Bade Array Pe Test

### Problem Statement

Bade arrays pe teeno sorts ka actual time measure karo.

### Solution

```javascript
// benchmark.js — Real performance comparison

// Random array generate karo
function generateRandom(size) {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 10000));
}

// Bubble Sort (without stats — fast version)
function bubbleSort(arr) {
    const result = [...arr];
    for (let i = 0; i < result.length - 1; i++) {
        let swapped = false;
        for (let j = 0; j < result.length - 1 - i; j++) {
            if (result[j] > result[j + 1]) {
                [result[j], result[j + 1]] = [result[j + 1], result[j]];
                swapped = true;
            }
        }
        if (!swapped) break;
    }
    return result;
}

// Selection Sort
function selectionSort(arr) {
    const result = [...arr];
    for (let i = 0; i < result.length - 1; i++) {
        let min = i;
        for (let j = i + 1; j < result.length; j++) {
            if (result[j] < result[min]) min = j;
        }
        if (min !== i) [result[i], result[min]] = [result[min], result[i]];
    }
    return result;
}

// Insertion Sort
function insertionSort(arr) {
    const result = [...arr];
    for (let i = 1; i < result.length; i++) {
        const key = result[i];
        let j = i - 1;
        while (j >= 0 && result[j] > key) {
            result[j + 1] = result[j];
            j--;
        }
        result[j + 1] = key;
    }
    return result;
}

// Benchmark function
function benchmark(name, sortFn, arr) {
    const start = performance.now();
    sortFn(arr);
    const end = performance.now();
    return { name, time: (end - start).toFixed(2) + " ms" };
}

// Test different sizes
const sizes = [100, 1000, 5000, 10000];

console.log("╔═══════════════════════════════════════════════════╗");
console.log("║        SORTING PERFORMANCE BENCHMARK              ║");
console.log("╚═══════════════════════════════════════════════════╝\n");

sizes.forEach(size => {
    const arr = generateRandom(size);

    console.log(`\n--- Array Size: ${size.toLocaleString()} ---`);
    console.log("Algorithm".padEnd(18) + "Time");
    console.log("-".repeat(30));

    const results = [
        benchmark("Bubble Sort", bubbleSort, arr),
        benchmark("Selection Sort", selectionSort, arr),
        benchmark("Insertion Sort", insertionSort, arr),
        benchmark("JS .sort()", (a) => [...a].sort((x, y) => x - y), arr)
    ];

    results.forEach(r => {
        console.log(r.name.padEnd(18) + r.time);
    });
});

console.log("\n💡 Notice: JS built-in .sort() bahut fast hai kyunki ye TimSort use karta hai (O(n log n))");
```

> **Terminal Command:**
> ```bash
> node benchmark.js
> ```

> **Expected Output Pattern:**
> ```
> --- Array Size: 10,000 ---
> Algorithm         Time
> ------------------------------
> Bubble Sort       180.45 ms
> Selection Sort    45.23 ms
> Insertion Sort    25.67 ms
> JS .sort()        2.34 ms        ← Built-in is KING!
> ```

---

## Task 3: Kisan Market Price Sorter

### Problem Statement

Kisan market ki crop data ko different criteria se sort karo.

### Solution

```javascript
// market-sorter.js — Kisan mandi data sorting

const crops = [
    { name: "Tomato",    price: 40,  stock: 500,  season: "Kharif" },
    { name: "Onion",     price: 30,  stock: 800,  season: "Kharif" },
    { name: "Wheat",     price: 25,  stock: 2000, season: "Rabi" },
    { name: "Rice",      price: 45,  stock: 1500, season: "Kharif" },
    { name: "Potato",    price: 20,  stock: 1200, season: "Rabi" },
    { name: "Cotton",    price: 60,  stock: 300,  season: "Kharif" },
    { name: "Sugarcane", price: 3,   stock: 5000, season: "Kharif" },
    { name: "Mustard",   price: 55,  stock: 400,  season: "Rabi" }
];

// Display function
function displayCrops(title, cropList) {
    console.log(`\n=== ${title} ===\n`);
    console.log("Name".padEnd(12) + "Price".padEnd(10) + "Stock".padEnd(10) + "Season");
    console.log("-".repeat(42));
    cropList.forEach(c => {
        console.log(
            c.name.padEnd(12) +
            ("₹" + c.price + "/kg").padEnd(10) +
            (c.stock + " kg").padEnd(10) +
            c.season
        );
    });
}

// 1. Price se sort (Low to High) — using built-in .sort()
const byPriceAsc = [...crops].sort((a, b) => a.price - b.price);
displayCrops("PRICE: Low to High", byPriceAsc);

// 2. Price se sort (High to Low)
const byPriceDesc = [...crops].sort((a, b) => b.price - a.price);
displayCrops("PRICE: High to Low", byPriceDesc);

// 3. Stock se sort (Maximum first)
const byStock = [...crops].sort((a, b) => b.stock - a.stock);
displayCrops("STOCK: Maximum First", byStock);

// 4. Name se sort (Alphabetical)
const byName = [...crops].sort((a, b) => a.name.localeCompare(b.name));
displayCrops("NAME: A to Z", byName);

// 5. Total value se sort (price × stock)
const byValue = [...crops]
    .map(c => ({ ...c, totalValue: c.price * c.stock }))
    .sort((a, b) => b.totalValue - a.totalValue);

console.log("\n=== TOTAL VALUE: Highest First ===\n");
console.log("Name".padEnd(12) + "Price".padEnd(8) + "Stock".padEnd(8) + "Total Value");
console.log("-".repeat(42));
byValue.forEach(c => {
    console.log(
        c.name.padEnd(12) +
        ("₹" + c.price).padEnd(8) +
        (c.stock + "").padEnd(8) +
        "₹" + c.totalValue.toLocaleString("en-IN")
    );
});

// 6. Multi-criteria sort (Season first, then Price)
const multiSort = [...crops].sort((a, b) => {
    // Pehle season se sort
    const seasonCompare = a.season.localeCompare(b.season);
    if (seasonCompare !== 0) return seasonCompare;
    // Same season mein price se sort
    return a.price - b.price;
});
displayCrops("MULTI: Season → Price", multiSort);
```

> **Terminal Command:**
> ```bash
> node market-sorter.js
> ```

---

## Task 4: JavaScript .sort() Deep Dive

### Problem Statement

JS ka built-in `.sort()` properly samjho — common mistakes aur correct usage.

### Solution

```javascript
// js-sort-mastery.js — .sort() method ke sab tricks

// ❌ MISTAKE 1: Bina comparator ke numbers sort karna
const numbers = [10, 9, 80, 200, 3, 15];
console.log("Wrong sort:", [...numbers].sort());
// Output: [10, 15, 200, 3, 80, 9] — STRING comparison ho rahi hai!

// ✅ CORRECT: Comparator function dena
console.log("Right sort:", [...numbers].sort((a, b) => a - b));
// Output: [3, 9, 10, 15, 80, 200]

// ❌ MISTAKE 2: Original array mutate ho jaata hai
const original = [5, 3, 8, 1];
original.sort((a, b) => a - b);
console.log("\nOriginal changed:", original);  // [1, 3, 5, 8] — original badal gaya!

// ✅ CORRECT: Copy pe sort karo
const safe = [5, 3, 8, 1];
const sorted = [...safe].sort((a, b) => a - b);
console.log("Original safe:", safe);    // [5, 3, 8, 1]
console.log("Sorted copy:", sorted);    // [1, 3, 5, 8]

// Strings sort (default works fine)
const fruits = ["Mango", "Apple", "Banana", "Cherry"];
console.log("\nFruits sorted:", [...fruits].sort());
// Output: ["Apple", "Banana", "Cherry", "Mango"]

// Case-insensitive sort
const mixed = ["banana", "Apple", "cherry", "Banana"];
console.log("Case-insensitive:", [...mixed].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
));

// Objects sort
const students = [
    { name: "Rahul", marks: 85 },
    { name: "Priya", marks: 92 },
    { name: "Amit", marks: 78 },
    { name: "Neha", marks: 92 },
    { name: "Ravi", marks: 65 }
];

// Sort by marks (descending)
const byMarks = [...students].sort((a, b) => b.marks - a.marks);
console.log("\nBy Marks (top first):");
byMarks.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} — ${s.marks} marks`);
});

// Sort by name (ascending)
const byName = [...students].sort((a, b) => a.name.localeCompare(b.name));
console.log("\nBy Name (A-Z):");
byName.forEach(s => console.log(`  ${s.name} — ${s.marks}`));

// Sort by marks, then name (multi-criteria)
const multiSort = [...students].sort((a, b) => {
    if (b.marks !== a.marks) return b.marks - a.marks;  // Marks descending
    return a.name.localeCompare(b.name);  // Same marks? Name ascending
});
console.log("\nBy Marks then Name:");
multiSort.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} — ${s.marks}`));
```

> **Yaad Rakho:** `.sort()` ka comparator function:
> - **Negative return** → a pehle aata hai
> - **Positive return** → b pehle aata hai
> - **Zero return** → order same rehta hai

---

## Task 5: Visualize Sorting Step by Step

```javascript
// visual-sort.js — Sorting ko step by step dekho

function visualBubbleSort(arr) {
    const result = [...arr];
    const n = result.length;
    let pass = 0;

    console.log("=== BUBBLE SORT VISUALIZATION ===\n");
    console.log(`Start: [${result.join(", ")}]\n`);

    for (let i = 0; i < n - 1; i++) {
        pass++;
        let swapped = false;

        for (let j = 0; j < n - 1 - i; j++) {
            if (result[j] > result[j + 1]) {
                [result[j], result[j + 1]] = [result[j + 1], result[j]];
                swapped = true;
            }
        }

        // Visual output — sorted part ko mark karo
        const sortedPart = result.slice(n - i - 1).join(", ");
        const unsortedPart = result.slice(0, n - i - 1).join(", ");
        console.log(`Pass ${pass}: [${unsortedPart} | ${sortedPart}]`);

        if (!swapped) {
            console.log("  → No swaps! Already sorted.");
            break;
        }
    }

    console.log(`\nFinal: [${result.join(", ")}]`);
    console.log(`Total passes: ${pass}`);
    return result;
}

visualBubbleSort([64, 34, 25, 12, 22, 11]);
```

---

## Task 6: Git Commit

```bash
git add .
git status
git commit -m "Day 16: Sorting algorithms - bubble/selection/insertion, benchmark, market sorter, JS .sort() mastery"
git log --oneline
```

---

## Mini Challenges

> **Practice Time!** Khud solve karo:

### Challenge 1: Sort by Frequency

Array mein elements ko unki frequency ke hisaab se sort karo.

```javascript
// Input: [1, 1, 2, 2, 2, 3]
// Output: [2, 2, 2, 1, 1, 3] (2 sabse zyada baar aaya)

function sortByFrequency(arr) {
    // Hint: Pehle frequency count karo (Object/Map)
    // Fir frequency ke hisaab se sort karo
    // Tumhara code yahan...
}
```

### Challenge 2: Sort Colors (Dutch Flag Problem)

Array mein sirf 0, 1, 2 hain. In-place sort karo (ek pass mein).

```javascript
// Input: [2, 0, 1, 2, 0, 1, 0]
// Output: [0, 0, 0, 1, 1, 2, 2]

function sortColors(arr) {
    // Hint: Three pointers — low, mid, high
    // Tumhara code yahan...
}
```

### Challenge 3: Custom Comparator

Students ko sort karo: pehle grade se (A+ > A > B > C), fir same grade mein marks se.

```javascript
const students = [
    { name: "Rahul", grade: "A", marks: 85 },
    { name: "Priya", grade: "A+", marks: 95 },
    { name: "Amit", grade: "B", marks: 72 },
    { name: "Neha", grade: "A", marks: 88 },
    { name: "Ravi", grade: "A+", marks: 91 }
];
// Expected: Priya(A+,95), Ravi(A+,91), Neha(A,88), Rahul(A,85), Amit(B,72)
```

---

## Quick Revision Table

| Task | Key Learning |
|------|-------------|
| Three Sorts | Implement + count comparisons/swaps |
| Benchmark | Real time measurement with `performance.now()` |
| Market Sorter | `.sort()` with comparator for objects |
| JS .sort() | Always use comparator for numbers, `[...arr]` for safety |
| Visual Sort | Step-by-step visualization helps understanding |
| Multi-sort | Multiple criteria: `if (a.x !== b.x) return...; return a.y - b.y;` |

---

## Aaj Kya Seekha?

1. **Bubble Sort** — O(n²), simple but slow, good for teaching
2. **Selection Sort** — O(n²) always, minimum swaps
3. **Insertion Sort** — O(n) best case, best for small/nearly sorted
4. **JS .sort()** — always provide `(a,b) => a-b` for numbers!
5. **Performance** — built-in `.sort()` is 10-100x faster (TimSort algorithm)
6. **Copy first** — `[...arr].sort()` to protect original array
7. **Multi-criteria sort** — check primary key first, then secondary

> **Tip:** Kal hum Stack aur Queue seekhenge — bahut important data structures! Browser back button (Stack), printer queue (Queue) — real-world mein har jagah hain. Aaj ke challenges solve karo!
