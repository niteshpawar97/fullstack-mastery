# Day 4 Morning: Functions & Scope — Code Ko Organize Karo

> **Aaj ka plan:** Aaj hum seekhenge functions — code ke reusable blocks. Jaise ek factory baar-baar same product banati hai, waise hi function baar-baar same kaam karta hai. Saath mein scope samjhenge — variable kahan dikhta hai, kahan nahi!

---

## Functions Kya Hain?

Function ek reusable code block hai — ek baar likho, baar-baar use karo. Jaise ek machine: input daalo, output lo.

```javascript
// Function Declaration
function greet(name) {
  // name = parameter (placeholder)
  return `Namaste, ${name}! Kaise ho?`;
}

// Function Call
const message = greet("Ramesh");  // "Ramesh" = argument (actual value)
console.log(message);  // "Namaste, Ramesh! Kaise ho?"

// Ek aur call — same function, different input
console.log(greet("Priya"));  // "Namaste, Priya! Kaise ho?"
```

> **Socho Aise:** Function ek chai ki machine hai — patti aur paani daalo (parameters), chai nikle (return value). Machine ek baar banao, hazaar baar chai banao!

---

## Function Declaration vs Expression vs Arrow

### 1. Function Declaration (Classic Way)

```javascript
function add(a, b) {
  return a + b;
}
console.log(add(5, 3));  // 8
```

### 2. Function Expression (Variable mein store)

```javascript
const multiply = function(a, b) {
  return a * b;
};
console.log(multiply(4, 5));  // 20
```

### 3. Arrow Function (Modern — ES6)

```javascript
// Full arrow function
const subtract = (a, b) => {
  return a - b;
};

// Short form — single expression to auto return
const divide = (a, b) => a / b;

// Single parameter — parentheses optional
const double = n => n * 2;

console.log(subtract(10, 3));  // 7
console.log(divide(20, 4));    // 5
console.log(double(7));        // 14
```

> **Yaad Rakho:** Arrow functions chhote kaam ke liye best hain. Single line mein `return` likhne ki zaroorat nahi. Lekin `this` keyword ka behaviour alag hota hai arrow functions mein — ye baad mein detail mein dekhenge.

---

## Parameters & Arguments

```javascript
// Basic parameters
function introduce(name, age, city) {
  console.log(`Main ${name} hoon, ${age} saal ka, ${city} se.`);
}
introduce("Vikram", 25, "Jaipur");
// "Main Vikram hoon, 25 saal ka, Jaipur se."

// Kya hota hai jab argument na do?
introduce("Vikram");
// "Main Vikram hoon, undefined saal ka, undefined se."
```

> **Warning:** Agar argument nahi doge to parameter `undefined` hoga. Isliye default parameters use karo!

---

## Default Parameters

```javascript
// Default values — jab argument na mile to ye use hoga
function calculatePrice(price, tax = 0.18, discount = 0) {
  const taxAmount = price * tax;
  const discountAmount = price * discount;
  const finalPrice = price + taxAmount - discountAmount;
  return finalPrice;
}

// Sab arguments do
console.log(calculatePrice(1000, 0.18, 0.10));  // 1080

// Sirf price do — tax aur discount default lagega
console.log(calculatePrice(1000));  // 1180

// Price aur tax do — discount default
console.log(calculatePrice(1000, 0.12));  // 1120
```

> **Example:** Soch — ek kisan ki dukaan. Default tax 18% hai, default discount 0. Customer aaya, sirf price bolo — baaki system handle karega!

---

## Return Statement

```javascript
// Return se function value deta hai
function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 40) return "D";
  return "F";  // baaki sab ke liye
}

console.log(getGrade(85));  // "A"
console.log(getGrade(55));  // "D"

// Return ke baad kuch nahi chalta
function test() {
  return 10;
  console.log("Ye kabhi nahi chalega!");  // Dead code
}
```

> **Yaad Rakho:** `return` ke baad function ruk jaata hai. Koi bhi code return ke baad nahi chalega. Aur agar `return` nahi likha to function `undefined` return karta hai.

---

## Multiple Values Return (Object/Array se)

```javascript
// Object return karo — multiple values
function getKisanReport(name, crops, income) {
  const avgIncome = income / crops.length;
  const status = avgIncome > 50000 ? "Achi kamaai" : "Sudhaar zaruri";
  
  return {
    kisanName: name,
    totalCrops: crops.length,
    averageIncome: avgIncome,
    status: status
  };
}

const report = getKisanReport("Ramesh", ["Wheat", "Rice", "Cotton"], 180000);
console.log(report);
// { kisanName: "Ramesh", totalCrops: 3, averageIncome: 60000, status: "Achi kamaai" }

// Destructure karke use karo
const { kisanName, status } = report;
console.log(`${kisanName}: ${status}`);  // "Ramesh: Achi kamaai"
```

---

## Scope — Variable Ki Duniya

Scope matlab — variable kahan dikhta hai aur kahan nahi. JavaScript mein 3 tarah ka scope hai:

### 1. Global Scope

```javascript
// Global scope — poore file mein dikhta hai
const appName = "Kisan App";

function showApp() {
  console.log(appName);  // Access milega — global hai
}

showApp();  // "Kisan App"
console.log(appName);  // Yahan bhi milega
```

### 2. Function Scope (Local Scope)

```javascript
function calculateArea(length, width) {
  // ye variables sirf is function ke andar dikhte hain
  const area = length * width;
  const unit = "sq meters";
  console.log(`Area: ${area} ${unit}`);
}

calculateArea(10, 5);  // "Area: 50 sq meters"
// console.log(area);  // ERROR! area yahan exist nahi karta
```

### 3. Block Scope (let/const ka scope)

```javascript
if (true) {
  let blockVar = "Main sirf block ke andar hoon";
  const alsoBlock = "Main bhi block mein hoon";
  var notBlock = "Main block ke bahar bhi hoon!";  // var block scope follow nahi karta
}

// console.log(blockVar);  // ERROR!
// console.log(alsoBlock); // ERROR!
console.log(notBlock);     // "Main block ke bahar bhi hoon!" — var ka kamaal
```

> **Warning:** `var` block scope nahi follow karta — ye function scope follow karta hai. Isliye hamesha `let` aur `const` use karo. `var` se bugs aate hain!

---

## Scope Chain — Andar Se Bahar Dhundho

```javascript
const globalMsg = "Main global hoon";

function outer() {
  const outerMsg = "Main outer hoon";
  
  function inner() {
    const innerMsg = "Main inner hoon";
    
    // Inner function ko sab dikhta hai — andar se bahar tak
    console.log(innerMsg);   // OK
    console.log(outerMsg);   // OK — parent ka access hai
    console.log(globalMsg);  // OK — global ka access hai
  }
  
  inner();
  // console.log(innerMsg);  // ERROR! — inner ke bahar nahi dikhta
}

outer();
```

> **Socho Aise:** Scope chain ek building jaisi hai. Ground floor (global) se sab dikhta hai. Top floor (inner function) se neeche sab dikh jaata hai, lekin neeche se upar nahi dikh sakta!

---

## Hoisting — Upar Uthao!

JavaScript apne aap declarations ko upar le jaata hai (hoist karta hai) — lekin initialization nahi.

```javascript
// Function declaration — fully hoisted
console.log(sayHello());  // "Hello!" — call pehle, declaration baad mein bhi kaam karega

function sayHello() {
  return "Hello!";
}

// var — hoisted but undefined
console.log(x);  // undefined (error nahi — hoisted hai, lekin value nahi mili)
var x = 10;
console.log(x);  // 10

// let/const — hoisted but NOT accessible (Temporal Dead Zone)
// console.log(y);  // ERROR! Cannot access 'y' before initialization
let y = 20;

// Function Expression — NOT hoisted
// console.log(myFunc());  // ERROR! myFunc is not a function
const myFunc = function() {
  return "I'm a function expression";
};
```

> **Yaad Rakho:** Function declarations puri hoisted hoti hain — call pehle bhi kar sakte ho. Lekin `let`, `const`, aur function expressions hoisted hone ke baavjood use nahi kar sakte pehle (Temporal Dead Zone). Safe rehne ke liye — pehle declare karo, phir use karo!

---

## Practical Example: IoT Sensor System

```javascript
// Global config
const THRESHOLD_TEMP = 40;  // degree celsius

function checkSensor(sensorId, temperature) {
  // Local scope — sirf is function mein
  const timestamp = new Date().toLocaleString();
  const status = temperature > THRESHOLD_TEMP ? "ALERT" : "NORMAL";
  
  // Nested function — parent scope access hai
  function formatAlert() {
    return `[${timestamp}] Sensor ${sensorId}: ${temperature}°C — ${status}`;
  }
  
  return formatAlert();
}

console.log(checkSensor("FARM-01", 38));
// [4/4/2026, ...] Sensor FARM-01: 38°C — NORMAL

console.log(checkSensor("FARM-02", 45));
// [4/4/2026, ...] Sensor FARM-02: 45°C — ALERT
```

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| Function Declaration | `function name() {}` — hoisted, classic way |
| Function Expression | `const fn = function() {}` — variable mein store |
| Arrow Function | `const fn = () => {}` — modern, short syntax |
| Parameters | Function ke placeholders (`name`, `age`) |
| Arguments | Actual values jo call karte waqt dete ho |
| Default Params | `function fn(x = 10)` — fallback value |
| Return | Value wapas deta hai, function rok deta hai |
| Global Scope | Poore file mein accessible |
| Function Scope | Sirf function ke andar |
| Block Scope | `let`/`const` — sirf `{}` ke andar |
| Hoisting | Declarations upar uth jaati hain |
| Scope Chain | Inner se outer dhundh sakta hai, ulta nahi |

---

## Aaj Kya Seekha?

- Functions kaise declare karte hain — declaration, expression, arrow
- Parameters, arguments, aur default parameters
- Return statement ka use aur multiple values return karna
- Scope ke 3 types: global, function, block
- Scope chain — inner se outer accessible hai
- Hoisting — declarations upar uthti hain lekin let/const ka Temporal Dead Zone
