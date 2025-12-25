# Day 15 Evening: DSA Practice — Search Algorithms + Array Problems

> **Practice Time!** Morning mein seekha Big O, Linear Search, Binary Search. Ab inhe implement karenge aur classic array problems solve karenge. Har problem mein time complexity analyse karo!

---

## Setup: Project Folder Banao

> **Terminal Command:**
> ```bash
> mkdir day15-dsa-arrays
> cd day15-dsa-arrays
> git init
> code .
> ```

---

## Task 1: Linear Search — Multiple Versions

### Problem: Basic Linear Search

```javascript
// linear-search.js

// Version 1: Basic — index return karo
function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) return i;
    }
    return -1;
}

// Version 2: Saare indices return karo (agar duplicate hai)
function linearSearchAll(arr, target) {
    const indices = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            indices.push(i);
        }
    }
    return indices;
}

// Version 3: Object array mein search karo
function searchByProperty(arr, key, value) {
    return arr.filter(item => item[key] === value);
}

// ===== TESTING =====
const prices = [40, 25, 60, 25, 80, 25, 35];

console.log("=== LINEAR SEARCH ===\n");

// Basic search
console.log("60 ka index:", linearSearch(prices, 60));     // 2
console.log("99 ka index:", linearSearch(prices, 99));     // -1

// All occurrences
console.log("25 ke saare indices:", linearSearchAll(prices, 25));  // [1, 3, 5]

// Object search
const farmers = [
    { name: "Ramesh", crop: "Tomato", village: "Nashik" },
    { name: "Suresh", crop: "Onion", village: "Pune" },
    { name: "Dinesh", crop: "Tomato", village: "Nashik" },
    { name: "Kamal", crop: "Wheat", village: "Indore" }
];

const tomatoFarmers = searchByProperty(farmers, "crop", "Tomato");
console.log("\nTomato farmers:", tomatoFarmers);
// Output: Ramesh aur Dinesh
```

> **Terminal Command:**
> ```bash
> node linear-search.js
> ```

---

## Task 2: Binary Search — Multiple Versions

### Problem: Implement Binary Search + Variations

```javascript
// binary-search.js

// Version 1: Iterative Binary Search
function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    let steps = 0;  // Steps count karo

    while (left <= right) {
        steps++;
        const mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            console.log(`  Found ${target} at index ${mid} in ${steps} steps`);
            return mid;
        }
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    console.log(`  ${target} not found — took ${steps} steps`);
    return -1;
}

// Version 2: Find first occurrence (duplicate values mein)
function binarySearchFirst(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    let result = -1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            result = mid;       // Yaad rakho position
            right = mid - 1;   // Aur left mein dhundho (pehla occurrence ke liye)
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
}

// Version 3: Find last occurrence
function binarySearchLast(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    let result = -1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            result = mid;      // Yaad rakho
            left = mid + 1;    // Right mein dhundho (last occurrence ke liye)
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
}

// ===== TESTING =====
console.log("=== BINARY SEARCH ===\n");

const sorted = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
console.log("Array size:", sorted.length);

binarySearch(sorted, 35);  // Found in ~4 steps
binarySearch(sorted, 5);   // Found in ~4 steps
binarySearch(sorted, 80);  // Found in ~4 steps
binarySearch(sorted, 42);  // Not found

// First and Last occurrence
console.log("\n=== FIRST/LAST OCCURRENCE ===");
const withDuplicates = [10, 20, 20, 20, 30, 30, 40, 50];
console.log("Array:", withDuplicates);
console.log("20 first occurrence:", binarySearchFirst(withDuplicates, 20));  // 1
console.log("20 last occurrence:", binarySearchLast(withDuplicates, 20));   // 3
console.log("20 count:", binarySearchLast(withDuplicates, 20) - binarySearchFirst(withDuplicates, 20) + 1);  // 3
```

---

## Task 3: Linear vs Binary — Speed Comparison

### Problem: Dono ka performance compare karo

```javascript
// speed-compare.js — Linear vs Binary Search ka speed test

function linearSearch(arr, target) {
    let steps = 0;
    for (let i = 0; i < arr.length; i++) {
        steps++;
        if (arr[i] === target) return { index: i, steps };
    }
    return { index: -1, steps };
}

function binarySearch(arr, target) {
    let left = 0, right = arr.length - 1, steps = 0;

    while (left <= right) {
        steps++;
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return { index: mid, steps };
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return { index: -1, steps };
}

// Different sizes test karo
const sizes = [100, 1000, 10000, 100000, 1000000];

console.log("=== SPEED COMPARISON ===\n");
console.log("Size".padEnd(12) + "Linear Steps".padEnd(16) + "Binary Steps".padEnd(16) + "Kitna Fast");
console.log("-".repeat(56));

sizes.forEach(size => {
    // Sorted array banao
    const arr = Array.from({ length: size }, (_, i) => i + 1);

    // Worst case — last element dhundho
    const target = size;

    const linearResult = linearSearch(arr, target);
    const binaryResult = binarySearch(arr, target);

    const speedup = Math.round(linearResult.steps / binaryResult.steps);
    console.log(
        String(size).padEnd(12) +
        String(linearResult.steps).padEnd(16) +
        String(binaryResult.steps).padEnd(16) +
        `${speedup}x faster`
    );
});
```

> **Expected Output:**
> ```
> Size        Linear Steps    Binary Steps    Kitna Fast
> --------------------------------------------------------
> 100         100             7               14x faster
> 1000        1000            10              100x faster
> 10000       10000           14              714x faster
> 100000      100000          17              5882x faster
> 1000000     1000000         20              50000x faster
> ```

> **Yaad Rakho:** 10 lakh elements mein Binary Search sirf 20 steps leta hai! Linear Search 10 lakh steps. Ye DSA ki power hai!

---

## Task 4: Find Maximum & Minimum

### Problem: Array mein sabse bada aur chhota element dhundho

```javascript
// find-max-min.js

// Method 1: Loop se (O(n))
function findMaxMin(arr) {
    if (arr.length === 0) return null;

    let max = arr[0];
    let min = arr[0];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) max = arr[i];
        if (arr[i] < min) min = arr[i];
    }

    return { max, min };
}

// Method 2: Math.max/min with spread (O(n))
function findMaxMinBuiltIn(arr) {
    return {
        max: Math.max(...arr),
        min: Math.min(...arr)
    };
}

// Method 3: reduce se (O(n))
function findMaxReduce(arr) {
    return arr.reduce((max, curr) => curr > max ? curr : max, arr[0]);
}

// Test karo
const mandiPrices = [45, 30, 72, 18, 95, 60, 25, 88, 12, 55];
console.log("=== FIND MAX/MIN ===\n");
console.log("Prices:", mandiPrices);
console.log("Loop method:", findMaxMin(mandiPrices));
console.log("Built-in:", findMaxMinBuiltIn(mandiPrices));
console.log("Max (reduce):", findMaxReduce(mandiPrices));

// Second largest element
function findSecondMax(arr) {
    let max = -Infinity;
    let secondMax = -Infinity;

    for (const num of arr) {
        if (num > max) {
            secondMax = max;
            max = num;
        } else if (num > secondMax && num !== max) {
            secondMax = num;
        }
    }
    return secondMax;
}

console.log("\nSecond largest:", findSecondMax(mandiPrices));  // 88
```

---

## Task 5: Find Duplicates

### Problem: Array mein duplicate elements dhundho

```javascript
// find-duplicates.js

// Method 1: Brute Force — O(n²) — SLOW!
function findDuplicatesBrute(arr) {
    const duplicates = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
                duplicates.push(arr[i]);
            }
        }
    }
    return duplicates;
}

// Method 2: Using Object/Map — O(n) — FAST!
function findDuplicatesMap(arr) {
    const count = {};
    const duplicates = [];

    for (const item of arr) {
        count[item] = (count[item] || 0) + 1;
    }

    for (const [key, value] of Object.entries(count)) {
        if (value > 1) {
            duplicates.push({ value: key, count: value });
        }
    }

    return duplicates;
}

// Method 3: Using Set — O(n) — Cleanest!
function findDuplicatesSet(arr) {
    const seen = new Set();
    const duplicates = new Set();

    for (const item of arr) {
        if (seen.has(item)) {
            duplicates.add(item);
        }
        seen.add(item);
    }

    return [...duplicates];
}

// Test karo
const data = [10, 20, 30, 20, 40, 10, 50, 30, 10, 60];
console.log("=== FIND DUPLICATES ===\n");
console.log("Array:", data);
console.log("Brute force:", findDuplicatesBrute(data));
console.log("Map method:", findDuplicatesMap(data));
console.log("Set method:", findDuplicatesSet(data));

// Time complexity comparison:
// Brute Force: O(n²) — do nested loops
// Map method:  O(n)  — ek loop count karo, ek loop filter karo
// Set method:  O(n)  — ek hi loop mein done!
```

> **Yaad Rakho:** Duplicates dhundhne ke liye **Set** ya **Object** use karo — O(n) hai. Nested loops O(n²) hai — bade data pe bahut slow!

---

## Task 6: Rotate Array

### Problem: Array ko k positions se rotate karo

```javascript
// rotate-array.js

// Left Rotate by k positions
// [1,2,3,4,5], k=2 → [3,4,5,1,2]
function rotateLeft(arr, k) {
    const n = arr.length;
    k = k % n;  // Agar k > n hai to wrap karo

    // Method: slice + concat
    return [...arr.slice(k), ...arr.slice(0, k)];
}

// Right Rotate by k positions
// [1,2,3,4,5], k=2 → [4,5,1,2,3]
function rotateRight(arr, k) {
    const n = arr.length;
    k = k % n;

    return [...arr.slice(n - k), ...arr.slice(0, n - k)];
}

// In-place rotation (without extra array) — O(1) space
function rotateLeftInPlace(arr, k) {
    k = k % arr.length;

    // Helper: array ko reverse karo
    function reverse(arr, start, end) {
        while (start < end) {
            [arr[start], arr[end]] = [arr[end], arr[start]];
            start++;
            end--;
        }
    }

    // 3-step reversal algorithm
    reverse(arr, 0, k - 1);       // Pehle k elements reverse
    reverse(arr, k, arr.length - 1); // Baaki elements reverse
    reverse(arr, 0, arr.length - 1); // Poora array reverse

    return arr;
}

// Test karo
console.log("=== ROTATE ARRAY ===\n");

const original = [1, 2, 3, 4, 5, 6, 7];
console.log("Original:", original);
console.log("Left rotate by 2:", rotateLeft([...original], 2));   // [3,4,5,6,7,1,2]
console.log("Right rotate by 2:", rotateRight([...original], 2)); // [6,7,1,2,3,4,5]

// Kisan example
const weekPrices = [40, 42, 38, 45, 50, 35, 48]; // Mon-Sun prices
console.log("\nWeek prices:", weekPrices);
console.log("Wednesday se start:", rotateLeft(weekPrices, 2));
// Ab Wednesday pehle aa jayega

// In-place rotation
const testArr = [10, 20, 30, 40, 50];
console.log("\nIn-place rotate left by 2:", rotateLeftInPlace(testArr, 2));
```

---

## Task 7: Git Commit

```bash
git add .
git status
git commit -m "Day 15: DSA arrays - linear/binary search, max/min, duplicates, rotate array"
git log --oneline
```

---

## Mini Challenges

> **Practice Time!** Ye problems khud solve karo:

### Challenge 1: Two Sum Problem

Ek array aur ek target number diya hai. Do aisi numbers dhundho jinke sum === target. Indices return karo.

```javascript
// Input: [2, 7, 11, 15], target = 9
// Output: [0, 1] (because 2 + 7 = 9)

// Hint: Object/Map use karo O(n) solution ke liye
// Brute force O(n²) hai — nested loops
function twoSum(arr, target) {
    // Tumhara code yahan...
}
```

### Challenge 2: Move Zeros to End

Array mein saare zeros end mein le jao, baki elements ka order same rakho.

```javascript
// Input: [0, 1, 0, 3, 12]
// Output: [1, 3, 12, 0, 0]

function moveZeros(arr) {
    // Tumhara code yahan...
    // Hint: ek pointer non-zero elements ke liye rakho
}
```

### Challenge 3: Missing Number

1 se n tak ke numbers mein se ek missing hai. Dhundho.

```javascript
// Input: [1, 2, 4, 5, 6] (3 missing hai)
// Output: 3

// Hint: Sum formula use karo: n*(n+1)/2
function findMissing(arr) {
    // Tumhara code yahan...
}
```

---

## Quick Revision Table

| Problem | Best Approach | Time Complexity |
|---------|--------------|----------------|
| Linear Search | Simple loop | O(n) |
| Binary Search | Divide & conquer (sorted) | O(log n) |
| Find Max/Min | Single loop | O(n) |
| Find Duplicates | Set/Map | O(n) |
| Rotate Array | Slice + spread | O(n) |
| Two Sum | HashMap/Object | O(n) |
| Move Zeros | Two pointers | O(n) |
| Missing Number | Sum formula | O(n) |

---

## Aaj Kya Seekha?

1. **Linear Search** — simple, unsorted arrays ke liye, O(n)
2. **Binary Search** — sorted array mein, O(log n), bahut fast
3. **Speed comparison** — 10 lakh items mein Binary = 20 steps, Linear = 10 lakh steps
4. **Find Max/Min** — ek loop mein O(n) mein ho jaata hai
5. **Find Duplicates** — Set/Map use karo, nested loop se bachho
6. **Rotate Array** — slice+spread ya 3-step reversal technique
7. **Time complexity** analyse karna — har problem mein socho kitna fast hai

> **Tip:** Kal hum Sorting Algorithms seekhenge — Bubble Sort, Selection Sort, Insertion Sort! Aaj ke challenges zaroor solve karo — Two Sum problem interview ka favorite hai!
