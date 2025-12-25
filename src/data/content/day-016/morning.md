# Day 16 Morning: DSA — Sorting Algorithms — Bubble, Selection, Insertion Sort

> **Aaj ka plan:** Aaj hum teen fundamental sorting algorithms seekhenge — Bubble Sort, Selection Sort, aur Insertion Sort. Har ek ko step-by-step visualize karenge, code likhenge, time complexity compare karenge, aur samjhenge ki kab kaunsa use karna hai!

---

## Sorting Kyon Zaroori Hai?

### Real-World Sorting Examples

| Situation | Sorting Kaise Help Karta Hai |
|-----------|----------------------------|
| Mandi mein price list | Sabse sasta/mehenga dikhao |
| Student marks | Topper kaun hai? |
| E-commerce products | Price low-to-high, rating high-to-low |
| Search results | Relevance se sort |
| Database queries | ORDER BY column |
| Binary Search | Sorted array chahiye — pehle sort karo! |

> **Socho Aise:** Kisan mandi mein 1000 bags hain — alag alag weight ke. Agar sorted nahi hain to ek specific weight dhundhne mein 1000 checks lagenge. Agar sorted hain to Binary Search se sirf 10 checks!

---

## Bubble Sort — Sabse Simple Sorting

### Algorithm Kaise Kaam Karta Hai?

1. Array mein adjacent (ek-dusre ke bagal wale) elements compare karo
2. Agar wrong order mein hain to **swap** karo
3. Ek pass ke baad sabse bada element end pe pahunch jaata hai
4. Ye process repeat karo jab tak koi swap na ho

### Step-by-Step Visualization

```
Array: [64, 34, 25, 12, 22]

=== Pass 1 ===
[64, 34, 25, 12, 22]  → 64 > 34? Swap! → [34, 64, 25, 12, 22]
[34, 64, 25, 12, 22]  → 64 > 25? Swap! → [34, 25, 64, 12, 22]
[34, 25, 64, 12, 22]  → 64 > 12? Swap! → [34, 25, 12, 64, 22]
[34, 25, 12, 64, 22]  → 64 > 22? Swap! → [34, 25, 12, 22, 64] ← 64 apni jagah aa gaya!

=== Pass 2 ===
[34, 25, 12, 22, 64]  → 34 > 25? Swap! → [25, 34, 12, 22, 64]
[25, 34, 12, 22, 64]  → 34 > 12? Swap! → [25, 12, 34, 22, 64]
[25, 12, 34, 22, 64]  → 34 > 22? Swap! → [25, 12, 22, 34, 64] ← 34 done!

=== Pass 3 ===
[25, 12, 22, 34, 64]  → 25 > 12? Swap! → [12, 25, 22, 34, 64]
[12, 25, 22, 34, 64]  → 25 > 22? Swap! → [12, 22, 25, 34, 64] ← 25 done!

=== Pass 4 ===
[12, 22, 25, 34, 64]  → 12 > 22? Nahi.  ← No swap! Already sorted!

Final: [12, 22, 25, 34, 64] ✅
```

> **Socho Aise:** Bubble Sort aise hai jaise paani mein bubble upar aata hai — sabse bada element har pass mein "bubble up" karke end pe jaata hai!

### Implementation

```javascript
// bubble-sort.js

function bubbleSort(arr) {
    const n = arr.length;
    let swapped;

    for (let i = 0; i < n - 1; i++) {
        swapped = false;

        // Har pass mein adjacent elements compare karo
        for (let j = 0; j < n - 1 - i; j++) {  // -i kyunki last i elements already sorted
            if (arr[j] > arr[j + 1]) {
                // Swap karo
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swapped = true;
            }
        }

        // Agar koi swap nahi hua — matlab already sorted!
        if (!swapped) {
            console.log(`  Early exit at pass ${i + 1} — already sorted!`);
            break;
        }
    }

    return arr;
}

// Test
const prices = [64, 34, 25, 12, 22];
console.log("Before:", [...prices]);
console.log("After:", bubbleSort(prices));
```

### Time Complexity

| Case | Complexity | Kab Hota Hai |
|------|-----------|-------------|
| **Best** | O(n) | Array already sorted (ek pass, no swap) |
| **Average** | O(n²) | Random order |
| **Worst** | O(n²) | Reverse sorted |
| **Space** | O(1) | In-place sorting (extra array nahi chahiye) |

---

## Selection Sort — Sabse Chhota Dhundho Aur Rakh Do

### Algorithm Kaise Kaam Karta Hai?

1. Poore array mein **minimum element** dhundho
2. Use pehli position pe rakh do (swap)
3. Ab baaki array (index 1 onwards) mein minimum dhundho
4. Use doosri position pe rakh do
5. Repeat until sorted

### Step-by-Step Visualization

```
Array: [64, 25, 12, 22, 11]

=== Step 1 === Find minimum in full array
[64, 25, 12, 22, 11]  → Min = 11 (index 4)
Swap 64 ↔ 11
[11, 25, 12, 22, 64]  ← 11 fixed! ✅

=== Step 2 === Find minimum in [25, 12, 22, 64]
[11 | 25, 12, 22, 64]  → Min = 12 (index 2)
Swap 25 ↔ 12
[11, 12, 25, 22, 64]  ← 12 fixed! ✅

=== Step 3 === Find minimum in [25, 22, 64]
[11, 12 | 25, 22, 64]  → Min = 22 (index 3)
Swap 25 ↔ 22
[11, 12, 22, 25, 64]  ← 22 fixed! ✅

=== Step 4 === Find minimum in [25, 64]
[11, 12, 22 | 25, 64]  → Min = 25 (already in place)
[11, 12, 22, 25, 64]  ← 25 fixed! ✅

Final: [11, 12, 22, 25, 64] ✅
```

> **Socho Aise:** Socho tum exam papers check kar rahe ho. Pehle sabse kam marks wala dhundho, use pehle rakho. Fir baaki mein se sabse kam wala dhundho, doosre pe rakho. Yahi Selection Sort hai!

### Implementation

```javascript
// selection-sort.js

function selectionSort(arr) {
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
        // Minimum element ka index dhundho
        let minIndex = i;

        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }

        // Swap karo (agar minimum kisi aur jagah hai)
        if (minIndex !== i) {
            [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
        }
    }

    return arr;
}

// Test
const data = [64, 25, 12, 22, 11];
console.log("Before:", [...data]);
console.log("After:", selectionSort(data));
```

### Time Complexity

| Case | Complexity | Kab Hota Hai |
|------|-----------|-------------|
| **Best** | O(n²) | Hamesha — sorting se farak nahi padta |
| **Average** | O(n²) | Random order |
| **Worst** | O(n²) | Reverse sorted |
| **Space** | O(1) | In-place sorting |

> **Yaad Rakho:** Selection Sort ka time complexity hamesha O(n²) hai — chahe array sorted ho ya nahi. Lekin **swaps ki sankhya kam** hoti hai (max n-1 swaps). Isliye jab swapping costly ho, Selection Sort better hai.

---

## Insertion Sort — Cards Jaise Sort Karo

### Algorithm Kaise Kaam Karta Hai?

1. Doosre element se shuru karo (pehla element already "sorted" hai)
2. Current element ko uthao (key)
3. Left side ke sorted part mein **sahi jagah** pe insert karo
4. Baaki elements ko right shift karo jagah banane ke liye
5. Repeat for all elements

### Step-by-Step Visualization

```
Array: [64, 25, 12, 22, 11]

=== Step 1 === key = 25
Sorted part: [64]
25 < 64? Haan → 64 ko right shift → insert 25
[25, 64, 12, 22, 11]

=== Step 2 === key = 12
Sorted part: [25, 64]
12 < 64? Haan → 64 shift right
12 < 25? Haan → 25 shift right
Insert 12 at start
[12, 25, 64, 22, 11]

=== Step 3 === key = 22
Sorted part: [12, 25, 64]
22 < 64? Haan → 64 shift right
22 < 25? Haan → 25 shift right
22 < 12? Nahi → insert 22 here
[12, 22, 25, 64, 11]

=== Step 4 === key = 11
Sorted part: [12, 22, 25, 64]
11 < 64? Haan → shift
11 < 25? Haan → shift
11 < 22? Haan → shift
11 < 12? Haan → shift
Insert 11 at start
[11, 12, 22, 25, 64]

Final: [11, 12, 22, 25, 64] ✅
```

> **Socho Aise:** Jaise tum playing cards sort karte ho — naya card uthao aur haath mein sahi jagah pe daal do. Left side hamesha sorted rehta hai. Yahi Insertion Sort hai!

### Implementation

```javascript
// insertion-sort.js

function insertionSort(arr) {
    const n = arr.length;

    for (let i = 1; i < n; i++) {
        const key = arr[i];  // Current element uthao
        let j = i - 1;

        // Key se bade elements ko right shift karo
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];  // Shift right
            j--;
        }

        // Key ko sahi jagah daal do
        arr[j + 1] = key;
    }

    return arr;
}

// Test
const marks = [64, 25, 12, 22, 11];
console.log("Before:", [...marks]);
console.log("After:", insertionSort(marks));
```

### Time Complexity

| Case | Complexity | Kab Hota Hai |
|------|-----------|-------------|
| **Best** | O(n) | Already sorted — inner loop chalta hi nahi |
| **Average** | O(n²) | Random order |
| **Worst** | O(n²) | Reverse sorted |
| **Space** | O(1) | In-place sorting |

> **Tip:** Insertion Sort **nearly sorted arrays** pe bahut fast hai (O(n) best case). Chhote arrays ke liye bhi ye best choice hai. JavaScript ka built-in `.sort()` chhote arrays pe internally Insertion Sort use karta hai!

---

## Teeno Ki Comparison

### Side-by-Side Table

| Feature | Bubble Sort | Selection Sort | Insertion Sort |
|---------|------------|---------------|----------------|
| **Best Case** | O(n) | O(n²) | O(n) |
| **Average** | O(n²) | O(n²) | O(n²) |
| **Worst Case** | O(n²) | O(n²) | O(n²) |
| **Space** | O(1) | O(1) | O(1) |
| **Stable?** | Yes | No | Yes |
| **Swaps** | Bahut zyada | Kam (max n-1) | Medium |
| **Nearly Sorted** | Fast (O(n)) | Slow (O(n²)) | Fast (O(n)) |
| **Use Case** | Teaching only | Minimum swaps needed | Small/nearly sorted |

### Stability Kya Hai?

**Stable sort** matlab — agar do elements equal hain to unka **original order** maintained rehta hai.

```javascript
// Example: Sort by marks
const students = [
    { name: "Rahul", marks: 85 },
    { name: "Priya", marks: 90 },
    { name: "Amit", marks: 85 }   // Same marks as Rahul
];

// Stable sort: Rahul pehle, Amit baad mein (original order)
// Unstable sort: Amit pehle aa sakta hai (order change ho sakta hai)
```

> **Yaad Rakho:** Real-world mein ye teeno sorts rarely use hote hain (slow hain). Production mein Merge Sort, Quick Sort, ya built-in `.sort()` use karte hain. Lekin ye teeno samajhna zaroori hai — foundation hai!

### Kab Kaunsa Use Karo?

| Situation | Best Sort |
|-----------|----------|
| Sikhna / Samajhna | Bubble Sort (sabse simple) |
| Nearly sorted data | Insertion Sort (O(n) best case) |
| Minimum swaps chahiye | Selection Sort |
| Chhota array (< 50 items) | Insertion Sort |
| Production code | `.sort()` ya Merge/Quick Sort |

---

## Quick Revision Table

| Concept | Key Point |
|---------|-----------|
| **Bubble Sort** | Adjacent elements compare + swap, biggest bubbles up |
| **Selection Sort** | Minimum dhundho, correct position pe rakho |
| **Insertion Sort** | Ek ek element uthakar sorted part mein sahi jagah daalo |
| **Stable Sort** | Equal elements ka original order maintain hota hai |
| **O(n²)** | Nested loops — slow for large data |
| **O(n)** | Insertion/Bubble ka best case (already sorted) |
| **In-place** | Teeno O(1) extra space use karte hain |

---

## Aaj Kya Seekha?

1. **Bubble Sort** — adjacent compare + swap, biggest element bubbles to end
2. **Selection Sort** — minimum dhundho, correct position pe swap karo
3. **Insertion Sort** — cards jaise sort karo, nearly sorted pe best
4. **Teeno O(n²)** hain average/worst case mein — bade data pe slow
5. **Insertion Sort** chhote aur nearly sorted arrays ke liye best hai
6. **Stability** matter karti hai jab equal elements ka order important ho
7. **Production mein** `.sort()` use karo — internally optimized algorithm chalta hai

> **Tip:** Evening mein hum teeno sorts implement karenge, performance compare karenge, aur kisan market prices sort karenge. Visualization yaad karo — interview mein explain karna padega!
