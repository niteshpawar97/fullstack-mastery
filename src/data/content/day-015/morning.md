# Day 15 Morning: DSA — Arrays & Searching — Big O Notation Samjho

> **Aaj ka plan:** Aaj se DSA (Data Structures & Algorithms) ki journey shuru! Samjhenge ki DSA kyon zaroori hai, Big O notation kya hai, time complexity kaise measure karte hain, aur Linear Search + Binary Search seekhenge step by step.

---

## DSA Kyon Zaroori Hai?

### Coding Interviews + Real-World Performance

> **Socho Aise:** Tum ek kisan ho jiske paas 10,000 bags hain. Ek specific bag dhundhna hai. Kya karoge?
> - **Method 1:** Ek ek bag check karo (shuru se end tak) — Linear Search
> - **Method 2:** Bags ko weight se sort karo, fir beech se shuru karo — Binary Search
>
> Method 1 mein 10,000 checks lag sakte hain. Method 2 mein sirf 14 checks! DSA ye farak samjhata hai.

### DSA Kahan Use Hota Hai?

| Situation | DSA Concept |
|-----------|------------|
| Google search results | Sorting + Searching algorithms |
| GPS shortest route | Graph algorithms (Dijkstra) |
| Social media feed | Sorting + Priority Queue |
| Browser back button | Stack data structure |
| Print queue | Queue data structure |
| Database indexing | Trees (B-Tree) |
| Autocomplete suggestions | Trie data structure |

> **Yaad Rakho:** DSA sirf interviews ke liye nahi hai — ye tumhare code ko **fast aur efficient** banata hai. 1 user pe farak nahi dikhta, lekin 1 lakh users pe slow code server tod deta hai!

---

## Big O Notation — Speed Kaise Measure Karo?

### Big O Kya Hai?

Big O notation batata hai ki jaise **input size badhega**, algorithm kitna **slow** hoga. Ye worst-case scenario measure karta hai.

> **Socho Aise:** Socho tum ek restaurant mein ho:
> - O(1) — Menu card pe rate dekhna (instant, chahe 100 items ho ya 1000)
> - O(n) — Ek ek dish taste karna (jitni zyada dishes, utna zyada time)
> - O(n²) — Har dish ko har doosri dish ke saath compare karna (bahut slow!)

### Common Big O Complexities

```
Speed (Fast to Slow):

O(1) → O(log n) → O(n) → O(n log n) → O(n²) → O(2ⁿ)
 ⚡        🏃‍♂️         🚶        🐢           🐌         💀
```

| Big O | Name | Example | 1000 items pe operations |
|-------|------|---------|------------------------|
| **O(1)** | Constant | Array index access | 1 |
| **O(log n)** | Logarithmic | Binary Search | ~10 |
| **O(n)** | Linear | Linear Search | 1,000 |
| **O(n log n)** | Linearithmic | Merge Sort, Quick Sort | ~10,000 |
| **O(n²)** | Quadratic | Bubble Sort, Nested loops | 1,000,000 |
| **O(2ⁿ)** | Exponential | Recursive Fibonacci | Universe khatam ho jaye! |

### Code Examples — Big O Identify Karo

#### O(1) — Constant Time

```javascript
// O(1) — Input size se farak nahi padta
function getFirstElement(arr) {
    return arr[0];  // Hamesha ek hi operation
}

// Array chahe 10 ka ho ya 10 lakh ka — same speed
const prices = [40, 30, 25, 45, 20];
console.log(getFirstElement(prices));  // 40 — instant!
```

#### O(n) — Linear Time

```javascript
// O(n) — Har element ko ek baar dekhna padega
function findMax(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {  // n baar chalega
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

// 10 elements = 10 operations, 1000 elements = 1000 operations
console.log(findMax([40, 30, 85, 45, 20]));  // 85
```

#### O(n²) — Quadratic Time

```javascript
// O(n²) — Nested loops — bahut slow bade data pe!
function findDuplicates(arr) {
    const duplicates = [];
    for (let i = 0; i < arr.length; i++) {          // n baar
        for (let j = i + 1; j < arr.length; j++) {  // n baar (roughly)
            if (arr[i] === arr[j]) {
                duplicates.push(arr[i]);
            }
        }
    }
    return duplicates;
}

// 10 items = 100 ops, 1000 items = 1,000,000 ops!
console.log(findDuplicates([1, 2, 3, 2, 4, 3]));  // [2, 3]
```

#### O(log n) — Logarithmic Time

```javascript
// O(log n) — Har step mein aadha data eliminate
// Binary Search — ye aage detail mein dekhenge
// 1000 items mein sirf ~10 steps!
```

> **Yaad Rakho:** Big O mein constants ignore karte hain:
> - O(2n) = O(n)
> - O(n + 100) = O(n)
> - O(n/2) = O(n)
> - Sirf dominant term rakhte hain: O(n² + n) = O(n²)

---

## Linear Search — Seedha Seedha Dhundho

### Algorithm

1. Array ke pehle element se shuru karo
2. Har element ko target se compare karo
3. Agar match mila — return index
4. Agar array khatam ho gaya — return -1 (nahi mila)

### Visualization

```
Array: [40, 10, 85, 25, 60, 30, 15]
Target: 25

Step 1: [40] ← 40 === 25? Nahi ❌
Step 2: [10] ← 10 === 25? Nahi ❌
Step 3: [85] ← 85 === 25? Nahi ❌
Step 4: [25] ← 25 === 25? HAAN! ✅ → return index 3
```

### Implementation

```javascript
// Linear Search — ek ek element check karo
function linearSearch(arr, target) {
    // Har element ko check karo
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;  // Mil gaya! Index return karo
        }
    }
    return -1;  // Nahi mila
}

// Test karo
const mandiPrices = [40, 10, 85, 25, 60, 30, 15];

console.log(linearSearch(mandiPrices, 25));   // 3 (index 3 pe hai)
console.log(linearSearch(mandiPrices, 100));  // -1 (nahi hai)
console.log(linearSearch(mandiPrices, 40));   // 0 (pehla element)
console.log(linearSearch(mandiPrices, 15));   // 6 (last element)
```

### Time Complexity Analysis

| Case | Complexity | Explanation |
|------|-----------|-------------|
| **Best Case** | O(1) | Pehle element pe hi mil gaya |
| **Worst Case** | O(n) | Last element pe mila ya mila hi nahi |
| **Average Case** | O(n/2) = O(n) | Average mein aadhe elements check karne padenge |

> **Socho Aise:** Linear Search aise hai jaise library mein ek ek kitab check karo — simple lekin slow. 10 kitaab mein theek hai, 10 lakh mein mushkil!

---

## Binary Search — Smart Dhundho (Sorted Array)

### Pre-condition: Array SORTED hona chahiye!

### Algorithm

1. Beech ka element (mid) nikalo
2. Agar mid === target — mil gaya!
3. Agar target < mid — left half mein dhundho
4. Agar target > mid — right half mein dhundho
5. Jab tak left <= right, repeat karo

### Visualization

```
Sorted Array: [10, 15, 25, 30, 40, 60, 85]
Target: 25

Step 1: left=0, right=6, mid=3
        [10, 15, 25, |30|, 40, 60, 85]
                      ↑mid
        25 < 30? HAAN → Right half hatao → right = mid - 1 = 2

Step 2: left=0, right=2, mid=1
        [10, |15|, 25]
              ↑mid
        25 > 15? HAAN → Left half hatao → left = mid + 1 = 2

Step 3: left=2, right=2, mid=2
        [25]
         ↑mid
        25 === 25? HAAN! ✅ → return index 2

Sirf 3 steps mein mil gaya! (Linear search mein 3 steps lage, lekin bade array mein farak bahut bada hota hai)
```

### Implementation — Iterative

```javascript
// Binary Search — har step mein aadha data eliminate karo
// ZAROORI: Array sorted hona chahiye!
function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        // Beech ka index nikalo
        const mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            return mid;  // Mil gaya!
        }
        else if (arr[mid] < target) {
            left = mid + 1;  // Right half mein dhundho
        }
        else {
            right = mid - 1;  // Left half mein dhundho
        }
    }

    return -1;  // Nahi mila
}

// Test karo (SORTED array hona chahiye!)
const sortedPrices = [10, 15, 25, 30, 40, 60, 85];

console.log(binarySearch(sortedPrices, 25));   // 2
console.log(binarySearch(sortedPrices, 85));   // 6
console.log(binarySearch(sortedPrices, 10));   // 0
console.log(binarySearch(sortedPrices, 50));   // -1 (nahi hai)
```

### Implementation — Recursive

```javascript
// Binary Search — Recursive version
function binarySearchRecursive(arr, target, left = 0, right = arr.length - 1) {
    // Base case — nahi mila
    if (left > right) return -1;

    const mid = Math.floor((left + right) / 2);

    // Mil gaya!
    if (arr[mid] === target) return mid;

    // Left half mein dhundho
    if (target < arr[mid]) {
        return binarySearchRecursive(arr, target, left, mid - 1);
    }

    // Right half mein dhundho
    return binarySearchRecursive(arr, target, mid + 1, right);
}

console.log(binarySearchRecursive(sortedPrices, 60));  // 5
console.log(binarySearchRecursive(sortedPrices, 99));  // -1
```

### Time Complexity Analysis

| Case | Complexity | Explanation |
|------|-----------|-------------|
| **Best Case** | O(1) | Beech mein hi mil gaya |
| **Worst Case** | O(log n) | Maximum log₂(n) comparisons |
| **Average Case** | O(log n) | Har step mein data aadha hota hai |

### Linear vs Binary — Comparison

| Array Size | Linear Search (max) | Binary Search (max) |
|-----------|-------------------|-------------------|
| 10 | 10 steps | 4 steps |
| 100 | 100 steps | 7 steps |
| 1,000 | 1,000 steps | 10 steps |
| 1,000,000 | 1,000,000 steps | 20 steps |
| 1,000,000,000 | 1 billion steps | 30 steps |

> **Yaad Rakho:** Binary Search sirf **sorted array** pe kaam karta hai! Unsorted array pe pehle sort karo (O(n log n)), fir binary search karo (O(log n)).

> **Socho Aise:** Dictionary mein word dhundhte time tum binary search karte ho — beech se kholo, agar word aage hai to aage jao, peeche hai to peeche. Tum ek ek page nahi palatte! Wahi binary search hai.

---

## Array Methods Jo DSA Mein Zaroori Hain

```javascript
const arr = [10, 20, 30, 40, 50];

// Basic Operations
arr.push(60);        // End mein add     → [10,20,30,40,50,60]
arr.pop();           // End se remove    → [10,20,30,40,50]
arr.unshift(5);      // Start mein add   → [5,10,20,30,40,50]
arr.shift();         // Start se remove  → [10,20,30,40,50]

// Search
arr.indexOf(30);     // 2 (index)
arr.includes(30);    // true
arr.find(x => x > 25);  // 30 (pehla match)
arr.findIndex(x => x > 25);  // 2

// Transform
arr.map(x => x * 2);        // [20,40,60,80,100]
arr.filter(x => x > 25);    // [30,40,50]
arr.reduce((sum, x) => sum + x, 0);  // 150

// Sort
arr.sort((a, b) => a - b);  // Ascending
arr.sort((a, b) => b - a);  // Descending

// Slice vs Splice
arr.slice(1, 3);    // [20,30] — copy (original safe)
arr.splice(1, 2);   // Removes 2 items from index 1 — mutates original!

// Reverse
arr.reverse();       // [50,40,30,20,10] — mutates original!
```

> **Warning:** `sort()` bina callback ke strings ki tarah sort karta hai! `[10, 9, 80].sort()` = `[10, 80, 9]` (GALAT!). Hamesha `(a,b) => a-b` dena!

---

## Quick Revision Table

| Concept | Key Point |
|---------|-----------|
| **DSA** | Data Structures + Algorithms = efficient code |
| **Big O** | Algorithm ki speed measure karo (worst case) |
| **O(1)** | Constant — instant, size se farak nahi |
| **O(log n)** | Logarithmic — Binary Search jaise |
| **O(n)** | Linear — ek ek element check |
| **O(n²)** | Quadratic — nested loops — slow! |
| **Linear Search** | Ek ek check, works on unsorted, O(n) |
| **Binary Search** | Aadha aadha karo, needs sorted, O(log n) |
| **Array.sort()** | Hamesha comparator do: `(a,b) => a-b` |

---

## Aaj Kya Seekha?

1. **DSA** efficient code likhne ke liye zaroori hai — interviews + real-world
2. **Big O notation** algorithm ki performance measure karta hai
3. **O(1) < O(log n) < O(n) < O(n²)** — fast to slow
4. **Linear Search** — simple, unsorted pe kaam karta hai, O(n)
5. **Binary Search** — fast, sirf sorted array pe, O(log n)
6. **Binary Search** har step mein data ko aadha kar deta hai
7. **Array methods** — push, pop, indexOf, find, filter, sort, slice

> **Tip:** Evening mein hum search algorithms implement karenge aur array problems solve karenge — find max, find duplicates, rotate array. Big O wali table yaad karo!
