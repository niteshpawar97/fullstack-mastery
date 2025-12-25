# Day 19 Morning: JS Advanced — Closures & Callbacks

> **Aaj ka plan:** Aaj hum JavaScript ke do sabse important concepts seekhenge — Closures aur Callbacks. Ye dono concepts interviews mein bhi poochhe jaate hain aur real-world development mein har jagah use hote hain. Samjhenge ki closure kya hai, lexical scope kaise kaam karta hai, callbacks kaise likhte hain, aur callback hell se kaise bachte hain.

---

## Lexical Scope — Pehle Ye Samjho

### Scope Kya Hai?

Scope matlab — variable kahan se accessible hai.

```javascript
// Global scope — poore program mein accessible
const appName = "Farm App";

function showApp() {
  // Function scope — sirf is function ke andar
  const version = "2.0";
  console.log(appName);  // ✅ Global accessible hai
  console.log(version);  // ✅ Apna scope hai
}

showApp();
console.log(version);  // ❌ ReferenceError — version yahan nahi hai
```

### Lexical Scope Kya Hai?

Lexical scope matlab — **jahan function LIKHA hai**, wahan se scope decide hota hai. "Jahan call hota hai" se nahi!

```javascript
const crop = "Wheat";  // Outer scope

function outerFunction() {
  const fertilizer = "Urea";  // outerFunction ka scope

  function innerFunction() {
    // innerFunction ko dono accessible hain
    // kyunki ye "lexically" (code mein physically)
    // outerFunction ke andar likha hai
    console.log(crop);        // ✅ "Wheat"
    console.log(fertilizer);  // ✅ "Urea"
  }

  innerFunction();
}

outerFunction();
```

> **Socho Aise:** Lexical scope ek family jaise hai. Bachcha (inner function) ko papa (outer function) aur dada (global) ki property access hai. Lekin papa ko bachche ki property access nahi hai.

---

## Closures — JavaScript Ka Superpower

### Closure Kya Hai?

> **Closure tab banta hai jab ek inner function apne outer function ke variables ko ACCESS karta hai, OUTER function khatam hone ke BAAD bhi.**

```javascript
function createFarmer(name) {
  // 'name' outer function ka variable hai
  
  return function showCrop(crop) {
    // Inner function 'name' ko access kar raha hai
    // Even after createFarmer() khatam ho gaya
    console.log(`${name} grows ${crop}`);
  };
}

// createFarmer call hua aur khatam ho gaya
const rajesh = createFarmer("Rajesh");
const priya = createFarmer("Priya");

// Lekin inner function abhi bhi 'name' access kar sakta hai!
rajesh("Wheat");  // "Rajesh grows Wheat"
priya("Rice");    // "Priya grows Rice"
```

> **Socho Aise:** Socho tumne school chhod diya (outer function khatam). Lekin tumhare paas abhi bhi school ki memories hain (closure). Tum un memories ko access kar sakte ho — school band ho gaya toh kya hua!

### Closure Kaise Kaam Karta Hai?

```javascript
function counter() {
  let count = 0;  // Ye variable "enclosed" hai

  return {
    increment: function() {
      count++;          // count access kar raha hai
      console.log(`Count: ${count}`);
    },
    decrement: function() {
      count--;          // same count access kar raha hai
      console.log(`Count: ${count}`);
    },
    getCount: function() {
      return count;     // count return kar raha hai
    }
  };
}

const myCounter = counter();
myCounter.increment();  // Count: 1
myCounter.increment();  // Count: 2
myCounter.decrement();  // Count: 1
console.log(myCounter.getCount());  // 1

// count variable directly accessible nahi hai
// console.log(count);  // ❌ ReferenceError
```

> **Yaad Rakho:** Closure ek "backpack" jaisa hai. Jab inner function bahar jaata hai, wo apne outer scope ke variables ka ek backpack saath le jaata hai. Jab chahiye tab backpack se nikal ke use kar sakta hai!

---

## Closure Ke Practical Patterns

### Pattern 1: Private Variables (Data Hiding)

```javascript
// Bank account — balance directly access nahi ho sakta
function createBankAccount(initialBalance) {
  let balance = initialBalance;  // Private variable!

  return {
    deposit: function(amount) {
      if (amount > 0) {
        balance += amount;
        console.log(`Deposited: ₹${amount}. Balance: ₹${balance}`);
      }
    },
    withdraw: function(amount) {
      if (amount > 0 && amount <= balance) {
        balance -= amount;
        console.log(`Withdrawn: ₹${amount}. Balance: ₹${balance}`);
      } else {
        console.log("Insufficient balance!");
      }
    },
    getBalance: function() {
      return balance;
    }
  };
}

const account = createBankAccount(1000);
account.deposit(500);    // Deposited: ₹500. Balance: ₹1500
account.withdraw(200);   // Withdrawn: ₹200. Balance: ₹1300
// account.balance = 999999;  // ❌ Ye kaam nahi karega — private hai!
console.log(account.getBalance());  // 1300
```

> **Yaad Rakho:** Closure se hum "private" variables bana sakte hain JavaScript mein. Bahar se koi directly modify nahi kar sakta — sirf defined methods se hi access hota hai.

### Pattern 2: Function Factory

```javascript
// Tax calculator factory — different rates ke liye
function createTaxCalculator(taxRate) {
  return function(amount) {
    const tax = amount * (taxRate / 100);
    return {
      original: amount,
      tax: tax,
      total: amount + tax
    };
  };
}

// Alag-alag tax calculators banao
const gstCalculator = createTaxCalculator(18);    // 18% GST
const serviceCalculator = createTaxCalculator(12); // 12% Service tax

console.log(gstCalculator(1000));
// { original: 1000, tax: 180, total: 1180 }

console.log(serviceCalculator(1000));
// { original: 1000, tax: 120, total: 1120 }
```

### Pattern 3: Memoization (Cache Results)

```javascript
// Expensive calculation ko cache karo
function memoize(fn) {
  const cache = {};  // Closure mein cache store hota hai

  return function(n) {
    if (cache[n] !== undefined) {
      console.log(`Cache se liya: ${n}`);
      return cache[n];
    }
    console.log(`Calculate kar raha hai: ${n}`);
    const result = fn(n);
    cache[n] = result;  // Cache mein save karo
    return result;
  };
}

// Factorial function ko memoize karo
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

const memoFactorial = memoize(factorial);
console.log(memoFactorial(5));  // Calculate kar raha hai: 5 → 120
console.log(memoFactorial(5));  // Cache se liya: 5 → 120 (fast!)
console.log(memoFactorial(3));  // Calculate kar raha hai: 3 → 6
```

> **Socho Aise:** Memoization aise hai jaise tum pehli baar kisi recipe ko dekh ke khana banaate ho (slow). Doosri baar yaad se bana lete ho (fast) — kyunki dimag mein "cache" ho gaya!

---

## Common Closure Trap: Loop Problem

```javascript
// ❌ GALAT — Classic closure trap
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i);  // 3, 3, 3 — kyunki 'var' function-scoped hai
  }, 1000);
}

// ✅ SAHI — let use karo (block-scoped)
for (let i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i);  // 0, 1, 2 — har iteration ka apna 'i'
  }, 1000);
}

// ✅ SAHI — IIFE se closure banao (purana tarika)
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(function() {
      console.log(j);  // 0, 1, 2
    }, 1000);
  })(i);
}
```

> **Warning:** `var` aur closures ka combination bohot tricky hai. Hamesha `let` ya `const` use karo loops mein — ye problem nahi aayega.

---

## Callback Functions

### Callback Kya Hai?

Callback ek function hai jo **doosre function ko argument** ke roop mein diya jaata hai, aur **baad mein call** hota hai.

```javascript
// Simple callback example
function greetFarmer(name, callback) {
  console.log(`Namaste, ${name}!`);
  callback(name);  // Callback function ko call karo
}

// Callback function define karo
function showCropInfo(farmerName) {
  console.log(`${farmerName} ki fasal ki jaankari load ho rahi hai...`);
}

greetFarmer("Rajesh", showCropInfo);
// Namaste, Rajesh!
// Rajesh ki fasal ki jaankari load ho rahi hai...
```

> **Socho Aise:** Callback aise hai jaise tum restaurant mein order dete ho aur waiter ko bolte ho — "Jab khana ready ho, mujhe bula dena." Tumhara "bula dena" ek callback hai!

### Higher-Order Functions

Jo function doosre function ko argument mein leta hai ya return karta hai — wo **higher-order function** hai.

```javascript
// Array methods — sabse common higher-order functions
const crops = [
  { name: "Wheat", price: 2000, quantity: 50 },
  { name: "Rice", price: 3000, quantity: 30 },
  { name: "Cotton", price: 5000, quantity: 20 },
  { name: "Sugarcane", price: 1500, quantity: 100 }
];

// filter — condition ke basis pe filter karo
const expensiveCrops = crops.filter(crop => crop.price > 2500);
console.log(expensiveCrops);
// [{ name: "Rice", ... }, { name: "Cotton", ... }]

// map — har element ko transform karo
const cropNames = crops.map(crop => crop.name);
console.log(cropNames);  // ["Wheat", "Rice", "Cotton", "Sugarcane"]

// reduce — sab ko ek value mein combine karo
const totalValue = crops.reduce((sum, crop) => {
  return sum + (crop.price * crop.quantity);
}, 0);
console.log(`Total value: ₹${totalValue}`);
// Total value: ₹390000

// forEach — har element pe kuch karo (return nahi karta)
crops.forEach(crop => {
  console.log(`${crop.name}: ₹${crop.price}/quintal`);
});
```

### Asynchronous Callbacks

```javascript
const fs = require('fs');

// File read karo — async callback
fs.readFile('farmers.json', 'utf8', function(err, data) {
  if (err) {
    console.log("Error reading file:", err.message);
    return;
  }
  console.log("File data:", data);
});

console.log("Ye pehle print hoga — async hai!");
// Output order:
// 1. "Ye pehle print hoga — async hai!"
// 2. "File data: ..." (baad mein, jab file read ho jaaye)
```

> **Yaad Rakho:** Asynchronous callbacks turant execute nahi hote. JavaScript pehle baaki code run karta hai, phir jab async operation complete hota hai tab callback execute hota hai.

---

## Callback Hell — Problem Aur Solution

### Callback Hell Kya Hai?

Jab callbacks ke andar callbacks ke andar callbacks hote hain — nested pyramids ban jaate hain:

```javascript
// ❌ Callback Hell — "Pyramid of Doom"
getUser(userId, function(user) {
  getOrders(user.id, function(orders) {
    getOrderDetails(orders[0].id, function(details) {
      getShipping(details.shippingId, function(shipping) {
        updateTracking(shipping.trackingId, function(result) {
          console.log("Finally done!", result);
          // 5 levels deep — nightmare!
        });
      });
    });
  });
});
```

> **Socho Aise:** Callback hell aise hai jaise tum ek phone call pe ho, phir call pe kisi aur ko connect karo, phir woh kisi aur ko — 5 levels deep. Koi samajh nahi aa raha kaun kisse baat kar raha hai!

### Callback Hell Se Bachne Ke Tarike

```javascript
// ✅ Solution 1: Named functions use karo
function handleUser(user) {
  getOrders(user.id, handleOrders);
}

function handleOrders(orders) {
  getOrderDetails(orders[0].id, handleDetails);
}

function handleDetails(details) {
  console.log("Details:", details);
}

getUser(userId, handleUser);  // Clean!

// ✅ Solution 2: Promises use karo (kal seekhenge!)
// ✅ Solution 3: Async/Await use karo (kal seekhenge!)
```

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| Lexical Scope | Jahan function likha hai, wahan se scope | "Write-time" pe decide hota hai |
| Closure | Inner function outer variables ko yaad rakhta hai | Outer function khatam hone ke baad bhi |
| Private Variables | Closure se bante hain | Bahar se direct access nahi |
| Memoization | Results cache karo | Closure mein cache store hota hai |
| Callback | Function as argument | Baad mein execute hota hai |
| Higher-Order Function | Function jo function le/de | map, filter, reduce |
| Callback Hell | Nested callbacks | Named functions ya Promises se solve |

---

## Aaj Kya Seekha?

1. **Lexical Scope** — function jahan likha hai, wahan se scope milta hai
2. **Closures** — inner function outer function ke variables ko "yaad" rakhta hai, even after outer function ends
3. **Private Variables** — closure se data hiding kar sakte hain
4. **Function Factory** — closure se customized functions bana sakte hain
5. **Memoization** — closure se results cache kar sakte hain
6. **Callbacks** — function ko argument mein pass karo, baad mein execute hoga
7. **Higher-Order Functions** — map, filter, reduce — daily use hote hain
8. **Callback Hell** — deeply nested callbacks ka problem, solutions hain!

> **Yaad Rakho:** Closures JavaScript ka superpower hai — isko samajhna interviews ke liye bhi zaroori hai aur real-world code ke liye bhi. Evening mein hum isko practically use karenge!
