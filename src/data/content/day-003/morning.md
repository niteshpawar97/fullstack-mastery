# Day 3 Morning: Arrays & Loops — Data Collections

> **Aaj ka plan:** Ab tak hum single values store kar rahe the. Aaj seekhenge ki multiple values ek saath kaise handle karte hain — Arrays aur Loops ke saath!

---

## Arrays Kya Hain?

Array ek ordered list hai — ek dabbe mein bahut saare items rakh sakte ho.

```javascript
// Array banao
const fruits = ["Apple", "Mango", "Banana", "Orange"];
const prices = [120, 80, 40, 60];
const mixed = ["Ramesh", 45, true, null];  // alag-alag types bhi rakh sakte ho

// Access karo (index 0 se start hota hai!)
console.log(fruits[0]);  // "Apple"
console.log(fruits[2]);  // "Banana"
console.log(fruits.length);  // 4

// Last element
console.log(fruits[fruits.length - 1]);  // "Orange"
```

> **Socho Aise:** Array ek train jaisi hai — har dabba (index) mein ek item hai. Pehla dabba 0 number ka hai, doosra 1, teesra 2...

> **Yaad Rakho:** Array index 0 se start hota hai, 1 se nahi! Ye sabse common mistake hai beginners ki.

---

## Array Methods — CRUD Operations

```javascript
const crops = ["Wheat", "Rice", "Cotton"];

// ADD — end mein
crops.push("Sugarcane");
console.log(crops);  // ["Wheat", "Rice", "Cotton", "Sugarcane"]

// ADD — start mein
crops.unshift("Soybean");
console.log(crops);  // ["Soybean", "Wheat", "Rice", "Cotton", "Sugarcane"]

// REMOVE — end se
const last = crops.pop();
console.log(last);   // "Sugarcane"

// REMOVE — start se
const first = crops.shift();
console.log(first);  // "Soybean"

// FIND index
const riceIndex = crops.indexOf("Rice");
console.log(riceIndex);  // 1

// CHECK if exists
console.log(crops.includes("Rice"));  // true
console.log(crops.includes("Mango")); // false

// REMOVE specific item
crops.splice(riceIndex, 1);  // index 1 se 1 item hatao
console.log(crops);  // ["Wheat", "Cotton"]

// INSERT at position
crops.splice(1, 0, "Bajra");  // index 1 pe "Bajra" daalo
console.log(crops);  // ["Wheat", "Bajra", "Cotton"]
```

### Array Methods Cheatsheet

| Method | Kya Karta Hai | Returns |
|--------|--------------|---------|
| `.push()` | End mein add | New length |
| `.pop()` | End se remove | Removed item |
| `.unshift()` | Start mein add | New length |
| `.shift()` | Start se remove | Removed item |
| `.indexOf()` | Position find karo | Index (-1 if not found) |
| `.includes()` | Hai ya nahi | true/false |
| `.splice()` | Add/Remove at position | Removed items |
| `.slice()` | Copy a portion | New array |
| `.concat()` | Join arrays | New array |
| `.reverse()` | Ulta karo | Same array (mutated) |
| `.sort()` | Sort karo | Same array (mutated) |

---

## Loops — Repeat Karo

### for Loop

```javascript
// Basic for loop
const students = ["Priya", "Rahul", "Amit", "Sneha", "Vikram"];

for (let i = 0; i < students.length; i++) {
  console.log(`${i + 1}. ${students[i]}`);
}
// 1. Priya
// 2. Rahul
// ...
```

### for...of Loop (Modern — Arrays ke liye best)

```javascript
const crops = ["Wheat", "Rice", "Cotton", "Sugarcane"];

for (const crop of crops) {
  console.log(`🌾 ${crop}`);
}
```

### forEach Method

```javascript
const prices = [100, 200, 150, 300];

prices.forEach((price, index) => {
  console.log(`Item ${index + 1}: Rs.${price}`);
});
```

### while Loop

```javascript
// Jab tak condition true hai, loop chalega
let countdown = 5;

while (countdown > 0) {
  console.log(`${countdown}...`);
  countdown--;
}
console.log("🚀 Launch!");
```

> **Warning:** While loop mein condition kabhi false na ho to infinite loop ban jaata hai — program hang ho jaata hai! Hamesha counter update karo.

### Loop Selection Guide

| Situation | Best Loop |
|-----------|-----------|
| Array iterate karna | `for...of` |
| Index chahiye | `for` ya `forEach` |
| Condition-based | `while` |
| Minimum 1 baar run karna | `do...while` |

---

## Powerful Array Methods: map, filter, reduce

### map — Transform karo

```javascript
const prices = [100, 200, 150, 300];

// Sab pe 10% discount lagao
const discounted = prices.map(price => price * 0.9);
console.log(discounted);  // [90, 180, 135, 270]

// Kisan ke naam capitalize karo
const names = ["ramesh", "suresh", "mahesh"];
const capitalized = names.map(name => name.charAt(0).toUpperCase() + name.slice(1));
console.log(capitalized);  // ["Ramesh", "Suresh", "Mahesh"]
```

### filter — Chhaan lo

```javascript
const temperatures = [25, 38, 42, 31, 45, 28, 36];

// Sirf high temperatures nikalo
const hot = temperatures.filter(temp => temp > 35);
console.log(hot);  // [38, 42, 45, 36]

// Even numbers
const numbers = [1, 2, 3, 4, 5, 6, 7, 8];
const even = numbers.filter(num => num % 2 === 0);
console.log(even);  // [2, 4, 6, 8]
```

### reduce — Ek value mein compress karo

```javascript
const sales = [500, 300, 800, 200, 600];

// Total sales
const total = sales.reduce((sum, sale) => sum + sale, 0);
console.log(`Total Sales: Rs.${total}`);  // Rs.2400

// Maximum sale
const maxSale = sales.reduce((max, sale) => sale > max ? sale : max, 0);
console.log(`Highest Sale: Rs.${maxSale}`);  // Rs.800
```

> **Yaad Rakho:** `map` = transform (same length), `filter` = chhaan (shorter length), `reduce` = compress (single value). Ye teen methods JavaScript ka backbone hain!

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| Array | Ordered collection of items |
| Index | 0 se start hota hai |
| `.push()` / `.pop()` | End mein add/remove |
| `for...of` | Array iterate karne ka modern way |
| `.map()` | Har item ko transform karo |
| `.filter()` | Condition se items chhaan lo |
| `.reduce()` | Ek single value mein compress karo |

---

## Aaj Kya Seekha?

- Arrays kaise banate hain aur access karte hain
- Array CRUD operations: push, pop, splice, etc.
- Loops: for, for...of, forEach, while
- map, filter, reduce — JavaScript ke power tools
