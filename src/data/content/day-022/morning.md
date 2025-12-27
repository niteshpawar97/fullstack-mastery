# Day 22 Morning: Error Handling + Debugging Basics

> **Aaj ka plan:** Aaj hum seekhenge ki errors kya hote hain, kaise handle karte hain, custom errors kaise banate hain, aur debugging kaise karte hain. Ye concepts production-ready code likhne ke liye essential hain. Ek ache developer ka kaam sirf code likhna nahi — errors ko gracefully handle karna bhi hai!

---

## Errors Kya Hote Hain?

### JavaScript Error Types

> **Socho Aise:** Errors aise hain jaise gaadi chalate waqt signals. Red signal (error) bole to ruko — aage jaoge to accident hoga. Green signal bole to chalo. Humara kaam hai — red signals ko pehchano aur handle karo.

```javascript
// 1. SyntaxError — Code likhne mein galti
// console.log("Hello"  // ❌ Missing closing bracket
// const = 5;           // ❌ Invalid variable name

// 2. ReferenceError — Variable exist nahi karta
console.log(farmName);  // ❌ farmName is not defined

// 3. TypeError — Galat type pe operation
const num = 42;
num.toUpperCase();  // ❌ num.toUpperCase is not a function

null.toString();    // ❌ Cannot read properties of null

// 4. RangeError — Value allowed range se bahar
const arr = new Array(-1);  // ❌ Invalid array length

// 5. URIError — Invalid URI encoding
decodeURIComponent('%');  // ❌ URI malformed
```

### Error Object Ki Properties

```javascript
try {
  undefinedVariable;  // Ye error throw karega
} catch (error) {
  console.log(error.name);     // "ReferenceError"
  console.log(error.message);  // "undefinedVariable is not defined"
  console.log(error.stack);    // Full stack trace — kahan error aaya
}
```

| Property | Kya Batata Hai |
|----------|---------------|
| `name` | Error ka type (TypeError, RangeError, etc.) |
| `message` | Error ka description |
| `stack` | Kaunsi file, kaunsi line pe error aaya |

---

## try / catch / finally

### Basic Syntax

```javascript
try {
  // Risky code yahan likho
  // Jo error de sakta hai
  const data = JSON.parse("invalid json");

} catch (error) {
  // Error aaye to yahan handle karo
  console.log("Error pakda gaya:", error.message);

} finally {
  // Ye HAMESHA chalega — error ho ya na ho
  console.log("Cleanup done!");
}
```

### Real-World Example: API Data Parsing

```javascript
function parseFarmerData(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    // Validate karo — required fields hain?
    if (!data.name) throw new Error("Farmer name is required!");
    if (!data.crop) throw new Error("Crop info is required!");
    if (data.area <= 0) throw new Error("Area must be positive!");

    console.log(`✅ Valid farmer: ${data.name}`);
    return data;

  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log("❌ Invalid JSON format:", error.message);
    } else {
      console.log("❌ Validation error:", error.message);
    }
    return null;

  } finally {
    console.log("📋 Parsing attempt complete.");
  }
}

// Test cases
parseFarmerData('{"name": "Rajesh", "crop": "Wheat", "area": 5}');
// ✅ Valid farmer: Rajesh

parseFarmerData('invalid json');
// ❌ Invalid JSON format: Unexpected token i in JSON

parseFarmerData('{"crop": "Rice", "area": 3}');
// ❌ Validation error: Farmer name is required!
```

> **Yaad Rakho:** `finally` block hamesha execute hota hai — chahe error aaye ya na aaye. Ye database connections close karne, file handles release karne, cleanup karne ke liye perfect hai.

---

## Throwing Errors — Apne Errors Banao

### throw Keyword

```javascript
function withdrawMoney(balance, amount) {
  if (typeof amount !== 'number') {
    throw new TypeError("Amount must be a number!");
  }
  if (amount <= 0) {
    throw new RangeError("Amount must be positive!");
  }
  if (amount > balance) {
    throw new Error("Insufficient balance!");
  }

  return balance - amount;
}

try {
  console.log(withdrawMoney(1000, 500));   // 500
  console.log(withdrawMoney(1000, "abc")); // TypeError!
} catch (error) {
  console.log(`${error.name}: ${error.message}`);
}
```

### Kab throw karein?

- Input validation fail ho
- Required data missing ho
- Business logic violation ho (negative amount, invalid age, etc.)
- API unexpected response de

> **Tip:** Errors throw karo jab function apna kaam nahi kar sakta. Caller ko decide karne do ki error ke saath kya karna hai (catch karke retry, user ko message, fallback value, etc.)

---

## Custom Error Classes

### Apne Error Types Banao

```javascript
// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);         // Parent Error class ko call karo
    this.name = "AppError";
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends AppError {
  constructor(field, message) {
    super(message, 400);    // 400 = Bad Request
    this.name = "ValidationError";
    this.field = field;
  }
}

class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} with ID ${id} not found`, 404);
    this.name = "NotFoundError";
    this.resource = resource;
    this.resourceId = id;
  }
}

class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);  // 401 = Unauthorized
    this.name = "AuthError";
  }
}

// Use karo
function getFarmer(id, isLoggedIn) {
  if (!isLoggedIn) {
    throw new AuthError("Please login to access farmer data");
  }
  if (!id || typeof id !== 'number') {
    throw new ValidationError("id", "Farmer ID must be a number");
  }

  const farmers = { 1: "Rajesh", 2: "Priya" };
  if (!farmers[id]) {
    throw new NotFoundError("Farmer", id);
  }

  return { id, name: farmers[id] };
}

// Handle different error types
try {
  const farmer = getFarmer(99, true);
  console.log(farmer);
} catch (error) {
  if (error instanceof AuthError) {
    console.log(`🔒 Auth Error (${error.statusCode}): ${error.message}`);
  } else if (error instanceof ValidationError) {
    console.log(`⚠️ Validation Error: ${error.field} — ${error.message}`);
  } else if (error instanceof NotFoundError) {
    console.log(`🔍 Not Found (${error.statusCode}): ${error.message}`);
  } else {
    console.log(`❌ Unknown Error: ${error.message}`);
  }
}
```

> **Socho Aise:** Custom errors aise hain jaise hospital mein alag-alag departments. "Haddi tuti hai" to ortho mein jao. "Bukhar hai" to medicine mein jao. Error ka type pata ho to sahi treatment (handling) ho sakta hai.

---

## Error Handling Best Practices

### Do's and Don'ts

```javascript
// ❌ GALAT: Empty catch — error ko chhupa diya
try {
  riskyOperation();
} catch (error) {
  // Kuch nahi kiya — silent failure!
}

// ✅ SAHI: Error ko properly handle karo
try {
  riskyOperation();
} catch (error) {
  console.error("Operation failed:", error.message);
  // Log karo, user ko batao, fallback use karo
}

// ❌ GALAT: Generic error message
throw new Error("Something went wrong");

// ✅ SAHI: Specific error message
throw new Error("Failed to save farmer data: database connection timeout");

// ❌ GALAT: Har jagah try/catch
try { const x = 5 + 3; } catch(e) {}  // Ye kabhi fail nahi hoga!

// ✅ SAHI: Sirf risky operations mein try/catch
try {
  const data = JSON.parse(userInput);  // User input risky hai!
} catch (error) {
  console.log("Invalid input format");
}
```

### Error Handling Strategy

```javascript
// 1. Function level — specific errors handle karo
function parseConfig(configString) {
  try {
    return JSON.parse(configString);
  } catch (error) {
    throw new ValidationError("config", "Invalid JSON configuration");
  }
}

// 2. Module level — related errors group karo
async function fetchAndSaveFarmer(id) {
  try {
    const farmer = await fetchFarmer(id);
    await saveFarmer(farmer);
    return farmer;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;  // Farmer nahi mila — null return karo
    }
    throw error;  // Baaki errors upar propagate karo
  }
}

// 3. Application level — top-level error handler
process.on('uncaughtException', (error) => {
  console.error('💀 Uncaught Exception:', error.message);
  console.error(error.stack);
  process.exit(1);  // Gracefully exit karo
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 Unhandled Promise Rejection:', reason);
  process.exit(1);
});
```

---

## Debugging Basics

### Console Methods — Debug Ka Swiss Army Knife

```javascript
// 1. console.log — basic output
console.log("Simple message");
console.log("Farmer:", { name: "Rajesh", crop: "Wheat" });

// 2. console.error — errors ke liye (red mein dikhta hai)
console.error("❌ Database connection failed!");

// 3. console.warn — warnings ke liye (yellow mein)
console.warn("⚠️ Deprecated function used!");

// 4. console.table — arrays/objects ko table mein dikhao
const farmers = [
  { name: "Rajesh", crop: "Wheat", area: 5 },
  { name: "Priya", crop: "Rice", area: 3 },
  { name: "Suresh", crop: "Cotton", area: 7 }
];
console.table(farmers);
// Beautiful table dikhega terminal mein!

// 5. console.time / console.timeEnd — performance measure
console.time("Data Processing");
// ... kuch heavy kaam ...
for (let i = 0; i < 1000000; i++) { Math.sqrt(i); }
console.timeEnd("Data Processing");
// Data Processing: 15.234ms

// 6. console.count — kitni baar call hua
function processItem(item) {
  console.count("processItem called");
  // ... processing ...
}
processItem("a");  // processItem called: 1
processItem("b");  // processItem called: 2

// 7. console.group / console.groupEnd — grouped output
console.group("Farmer Details");
console.log("Name: Rajesh");
console.log("Crop: Wheat");
console.group("Financial");
console.log("Revenue: ₹50,000");
console.log("Expenses: ₹20,000");
console.groupEnd();
console.groupEnd();

// 8. console.assert — condition false ho to error
console.assert(1 === 1, "Ye nahi dikhega");
console.assert(1 === 2, "Ye dikhega — assertion failed!");

// 9. console.trace — call stack dikhao
function a() { b(); }
function b() { c(); }
function c() { console.trace("Kahan se aaya?"); }
a();  // Full call stack dikhega: c <- b <- a
```

---

## debugger Keyword

```javascript
function calculateProfit(revenue, expenses) {
  const profit = revenue - expenses;
  debugger;  // Yahan execution ruk jaayega (jab DevTools khuli ho)
  const taxRate = 0.18;
  const tax = profit * taxRate;
  const netProfit = profit - tax;
  return netProfit;
}

// Browser DevTools ya VS Code debugger mein step-by-step dekh sakte ho
// Har variable ki value inspect kar sakte ho
```

> **Tip:** `debugger` statement code mein daalo aur browser DevTools ya VS Code Debugger open karo. Execution wahi ruk jaayega — variable values dekh sakte ho, step-by-step chal sakte ho.

---

## Node.js Debugging

### VS Code Debugger Setup

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current File",
      "program": "${file}",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Node.js Inspect Mode

```bash
# Node.js ko inspect mode mein run karo
node --inspect app.js

# Chrome mein jaake chrome://inspect kholo
# "Open dedicated DevTools for Node" pe click karo

# Ya VS Code mein F5 dabaao (launch.json set hone ke baad)
```

### Debugging Techniques

```javascript
// Technique 1: Strategic console.log
function processOrder(order) {
  console.log("[DEBUG] Order received:", order);  // Input dekho

  const total = order.items.reduce((sum, item) => {
    console.log("[DEBUG] Processing item:", item);  // Har item dekho
    return sum + item.price * item.quantity;
  }, 0);

  console.log("[DEBUG] Total calculated:", total);  // Output dekho
  return total;
}

// Technique 2: Conditional debugging
const DEBUG = process.env.NODE_ENV !== 'production';

function debugLog(...args) {
  if (DEBUG) {
    console.log("[DEBUG]", ...args);
  }
}

debugLog("This only shows in development");

// Technique 3: Error stack trace analysis
try {
  someFunction();
} catch (error) {
  // Stack trace padho — bottom to top
  console.error(error.stack);
  // Error at someFunction (app.js:15:5)    ← Yahan error hua
  // at processData (app.js:10:3)           ← Is function ne call kiya
  // at main (app.js:5:1)                   ← Is function ne call kiya
}
```

---

## Common Debugging Patterns

### Pattern 1: Divide and Conquer

```javascript
// Agar pata nahi kahan error aa raha hai:
// Step 1: Function ke start mein log daalo
// Step 2: Function ke end mein log daalo
// Step 3: Agar start print hua lekin end nahi — error beech mein hai
// Step 4: Beech mein aur logs daalo — narrow down karo

function complexFunction(data) {
  console.log("=== START ===");       // Step 1

  const step1 = processStep1(data);
  console.log("Step 1 done:", step1);  // Yahan tak aaya?

  const step2 = processStep2(step1);
  console.log("Step 2 done:", step2);  // Yahan tak aaya?

  const step3 = processStep3(step2);
  console.log("Step 3 done:", step3);  // Yahan tak aaya?

  console.log("=== END ===");          // Step 2
  return step3;
}
```

### Pattern 2: typeof Check

```javascript
// Unexpected type se errors aate hain
function safeAdd(a, b) {
  console.log("typeof a:", typeof a);  // Debug
  console.log("typeof b:", typeof b);  // Debug

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError(`Expected numbers, got ${typeof a} and ${typeof b}`);
  }
  return a + b;
}

safeAdd(5, "3");  // TypeError: Expected numbers, got number and string
```

---

## Quick Revision Table

| Concept | Kya Hai | Kab Use Karein |
|---------|---------|---------------|
| try/catch | Error pakadne ka tarika | Risky operations (JSON parse, API calls, file I/O) |
| finally | Hamesha chalta hai | Cleanup (close connections, release resources) |
| throw | Apna error banao | Validation fail, business logic violation |
| Custom Error | Apne error types | Different error categories handle karne ke liye |
| console.table | Data table mein dikhao | Arrays/Objects debug karne ke liye |
| console.time | Performance measure | Slow code dhundhne ke liye |
| debugger | Code execution roko | Step-by-step debug karne ke liye |
| Stack trace | Error kahan aaya | Error ki origin dhundhne ke liye |

---

## Aaj Kya Seekha?

1. **Error Types** — SyntaxError, TypeError, ReferenceError, RangeError — har type ka matlab
2. **try/catch/finally** — errors ko gracefully handle karna
3. **throw** — apne errors banana aur throw karna
4. **Custom Error Classes** — ValidationError, NotFoundError, AuthError
5. **Error Handling Best Practices** — specific errors, proper logging, strategy
6. **Console Methods** — log, error, warn, table, time, group, assert, trace
7. **debugger** keyword — code execution rokna aur inspect karna
8. **Node.js Debugging** — VS Code debugger, inspect mode, strategic logging
9. **Debugging Patterns** — divide and conquer, typeof check

> **Yaad Rakho:** "A good developer doesn't write code without bugs — they write code that handles bugs gracefully." Error handling aur debugging — ye do skills tum junior developer se senior developer banati hain. Evening mein hum practically error handling patterns implement karenge!
