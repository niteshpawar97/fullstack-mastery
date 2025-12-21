# Day 2 Morning: Operators, Conditions & String Methods

> **Aaj ka plan:** JavaScript mein decisions kaise lete hain — if/else, comparison operators, aur strings ke saath kaam karna seekhenge.

---

## Operators in JavaScript

### Arithmetic Operators (Math)

```javascript
const a = 10;
const b = 3;

console.log(a + b);   // 13  (addition)
console.log(a - b);   // 7   (subtraction)
console.log(a * b);   // 30  (multiplication)
console.log(a / b);   // 3.33 (division)
console.log(a % b);   // 1   (remainder/modulo)
console.log(a ** b);  // 1000 (power: 10³)
```

### Comparison Operators

```javascript
console.log(5 == "5");   // true  ⚠️ (loose equality — sirf value check)
console.log(5 === "5");  // false ✅ (strict equality — value + type check)
console.log(5 != "5");   // false
console.log(5 !== "5");  // true ✅

console.log(10 > 5);    // true
console.log(10 < 5);    // false
console.log(10 >= 10);  // true
console.log(10 <= 9);   // false
```

> **Yaad Rakho:** Hamesha `===` (triple equal) use karo, `==` (double equal) nahi! Double equal se bugs aate hain kyunki ye type conversion karta hai silently.

> **Socho Aise:** `==` ek aise dost jaisa hai jo haan mein haan milata hai (5 aur "5" same bolta hai). `===` ek strict teacher jaisa hai jo type bhi check karta hai (5 number hai, "5" string hai — alag!).

### Logical Operators

```javascript
const age = 25;
const hasLicense = true;

// AND — dono true hone chahiye
console.log(age >= 18 && hasLicense);  // true ✅

// OR — koi ek true ho to kaafi
console.log(age >= 18 || hasLicense);  // true

// NOT — ulta kar deta hai
console.log(!hasLicense);  // false
```

---

## Conditions: if / else if / else

### Basic Structure

```javascript
const temperature = 38;

if (temperature >= 40) {
  console.log("Bahut garmi hai! Ghar pe raho.");
} else if (temperature >= 30) {
  console.log("Garmi hai, paani peete raho.");
} else if (temperature >= 20) {
  console.log("Mausam accha hai!");
} else {
  console.log("Thand hai, sweater pehno.");
}
```

### Practical Example: Kisan Advisory

```javascript
const soilMoisture = 35;  // percentage
const isRainy = false;
const cropType = "wheat";

if (soilMoisture < 20) {
  console.log("🚨 Emergency! Abhi sinchai karo!");
} else if (soilMoisture < 40 && !isRainy) {
  console.log("⚠️ Kal sinchai karna hoga.");
} else if (soilMoisture > 80) {
  console.log("💧 Bahut paani hai — drainage check karo.");
} else {
  console.log("✅ Soil moisture theek hai.");
}
```

> **Tip:** Conditions likhte waqt pehle edge cases socho — sabse extreme condition pehle check karo.

---

## Ternary Operator (Short if/else)

```javascript
const age = 20;

// Long way
let message;
if (age >= 18) {
  message = "Adult";
} else {
  message = "Minor";
}

// Short way (Ternary) ✅
const message2 = age >= 18 ? "Adult" : "Minor";
console.log(message2);  // "Adult"
```

> **Warning:** Ternary operator sirf simple conditions ke liye use karo. Complex logic mein if/else better hai — readability matter karti hai!

---

## String Methods

Strings ke saath bahut kuch kar sakte ho:

```javascript
const fullName = "  Ramesh Kumar Patil  ";

// Length
console.log(fullName.length);              // 22 (spaces bhi count hote hain)

// Trim (spaces hatao)
console.log(fullName.trim());              // "Ramesh Kumar Patil"

// Case change
console.log(fullName.trim().toUpperCase()); // "RAMESH KUMAR PATIL"
console.log(fullName.trim().toLowerCase()); // "ramesh kumar patil"

// Search
console.log(fullName.includes("Kumar"));    // true
console.log(fullName.indexOf("Kumar"));     // 9
console.log(fullName.startsWith("  R"));    // true

// Extract
console.log(fullName.trim().slice(0, 6));   // "Ramesh"
console.log(fullName.trim().split(" "));    // ["Ramesh", "Kumar", "Patil"]

// Replace
console.log(fullName.trim().replace("Patil", "Sharma")); // "Ramesh Kumar Sharma"
```

### Template Literals (Backticks)

```javascript
const crop = "Onion";
const price = 45;
const quantity = 100;

// Old way (messy)
console.log("Crop: " + crop + ", Price: Rs." + price + "/kg, Total: Rs." + (price * quantity));

// New way (clean) ✅
console.log(`Crop: ${crop}, Price: Rs.${price}/kg, Total: Rs.${price * quantity}`);

// Multi-line strings
const receipt = `
=============================
  KISAN MARKET RECEIPT
=============================
  Crop:     ${crop}
  Price:    Rs.${price}/kg
  Quantity: ${quantity} kg
  Total:    Rs.${price * quantity}
=============================
`;
console.log(receipt);
```

> **Yaad Rakho:** Template literals (backticks \`\`) teen fayde dete hain: 1) Variable embed kar sakte ho `${}` se, 2) Multi-line strings likh sakte ho, 3) Code clean dikhta hai.

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| `===` | Strict comparison (hamesha use karo) |
| `&&` | AND — dono true chahiye |
| `\|\|` | OR — ek true kaafi |
| `!` | NOT — ulta kar do |
| Ternary | `condition ? trueValue : falseValue` |
| `.trim()` | Spaces hatao |
| `.includes()` | String mein search karo |
| `.split()` | String ko array mein todo |
| Template literal | Backtick \`\` mein `${}` use karo |

---

## Aaj Kya Seekha?

- Arithmetic, Comparison, aur Logical operators
- `===` vs `==` ka difference (hamesha `===` use karo!)
- if / else if / else conditions
- Ternary operator for short conditions
- String methods: trim, includes, split, replace, slice
- Template literals with backticks
