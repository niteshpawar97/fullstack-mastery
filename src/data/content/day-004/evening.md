# Day 4 Evening: Functions & Scope Practice

> **Practice Time!** Functions banao, scope samjho, aur real problems solve karo!

---

## Setup

> **Terminal Command:**
> ```bash
> mkdir fullstack-day4
> cd fullstack-day4
> git init
> ```

---

## Task 1: Calculator Function

File: `calculator.js`

```javascript
// Basic Calculator — Functions ke saath

// 1. Individual operation functions
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => {
  if (b === 0) return "Error: 0 se divide nahi kar sakte!";
  return a / b;
};

// 2. Main calculator function
function calculate(num1, operator, num2) {
  switch (operator) {
    case "+": return add(num1, num2);
    case "-": return subtract(num1, num2);
    case "*": return multiply(num1, num2);
    case "/": return divide(num1, num2);
    default: return "Error: Invalid operator!";
  }
}

// Test karo
console.log("===== CALCULATOR =====");
console.log(`10 + 5 = ${calculate(10, "+", 5)}`);     // 15
console.log(`20 - 8 = ${calculate(20, "-", 8)}`);     // 12
console.log(`6 * 7 = ${calculate(6, "*", 7)}`);       // 42
console.log(`100 / 4 = ${calculate(100, "/", 4)}`);   // 25
console.log(`10 / 0 = ${calculate(10, "/", 0)}`);     // Error message
console.log(`5 % 2 = ${calculate(5, "%", 2)}`);       // Invalid operator

// 3. Advanced — History maintain karo
const history = [];

function calcWithHistory(num1, operator, num2) {
  const result = calculate(num1, operator, num2);
  const entry = `${num1} ${operator} ${num2} = ${result}`;
  history.push(entry);
  return result;
}

calcWithHistory(25, "+", 75);
calcWithHistory(200, "-", 50);
calcWithHistory(12, "*", 12);

console.log("\n===== CALCULATION HISTORY =====");
history.forEach((entry, i) => {
  console.log(`  ${i + 1}. ${entry}`);
});
```

> **Expected Output:**
> ```
> ===== CALCULATOR =====
> 10 + 5 = 15
> 20 - 8 = 12
> 6 * 7 = 42
> 100 / 4 = 25
> 10 / 0 = Error: 0 se divide nahi kar sakte!
> 5 % 2 = Error: Invalid operator!
> 
> ===== CALCULATION HISTORY =====
>   1. 25 + 75 = 100
>   2. 200 - 50 = 150
>   3. 12 * 12 = 144
> ```

---

## Task 2: Greeting Generator with Default Params

File: `greetings.js`

```javascript
// Greeting function — default parameters ke saath
function greet(name, language = "hi", timeOfDay = "morning") {
  const greetings = {
    hi: {
      morning: `Namaste ${name}! Suprabhat!`,
      afternoon: `Namaste ${name}! Shubh dopahar!`,
      evening: `Namaste ${name}! Shubh sandhya!`
    },
    en: {
      morning: `Good morning, ${name}!`,
      afternoon: `Good afternoon, ${name}!`,
      evening: `Good evening, ${name}!`
    },
    pa: {
      morning: `Sat Sri Akal ${name}! Shubh savere!`,
      afternoon: `Sat Sri Akal ${name}! Shubh dupehar!`,
      evening: `Sat Sri Akal ${name}! Shubh shaam!`
    }
  };

  // Agar language ya time valid nahi hai to default message
  if (!greetings[language]) return `Hello ${name}! (language not supported)`;
  if (!greetings[language][timeOfDay]) return `Hello ${name}! (invalid time)`;

  return greetings[language][timeOfDay];
}

// Test different combinations
console.log("===== GREETINGS =====");
console.log(greet("Ramesh"));                          // Default: Hindi morning
console.log(greet("Priya", "hi", "evening"));          // Hindi evening
console.log(greet("John", "en", "afternoon"));         // English afternoon
console.log(greet("Gurpreet", "pa", "morning"));       // Punjabi morning
console.log(greet("Alex", "fr"));                      // Unsupported language

// Batch greetings — array of people
const people = ["Amit", "Sneha", "Vikram", "Pooja"];
console.log("\n===== BATCH GREETINGS =====");
people.forEach(person => {
  console.log(`  ${greet(person, "hi", "evening")}`);
});
```

> **Tip:** Default parameters bahut useful hain jab function ke bahut saare optional arguments hon. Common cases ke liye defaults rakho, special cases mein override karo.

---

## Task 3: Scope Experiments

File: `scope-lab.js`

```javascript
// ===== EXPERIMENT 1: Block Scope vs Function Scope =====
console.log("===== EXPERIMENT 1: Block vs Function Scope =====");

function scopeTest() {
  var functionScoped = "Main function mein hoon";
  let blockScoped = "Main bhi function mein hoon";

  if (true) {
    var insideIfVar = "var — if ke andar se";
    let insideIfLet = "let — if ke andar se";
    const insideIfConst = "const — if ke andar se";
    
    console.log(insideIfVar);    // OK
    console.log(insideIfLet);    // OK
    console.log(insideIfConst);  // OK
  }

  console.log(insideIfVar);     // OK — var block scope nahi follow karta!
  // console.log(insideIfLet);  // ERROR — let block mein band hai
  // console.log(insideIfConst);// ERROR — const bhi block mein band hai
}
scopeTest();


// ===== EXPERIMENT 2: Loop Scope =====
console.log("\n===== EXPERIMENT 2: Loop Scope =====");

// var ke saath — problem!
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(`var i = ${i}`), 100);
}
// Output: var i = 3, var i = 3, var i = 3 (sab 3 kyunki var shared hai!)

// let ke saath — correct!
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(`let j = ${j}`), 200);
}
// Output: let j = 0, let j = 1, let j = 2 (har iteration ka apna j)


// ===== EXPERIMENT 3: Scope Chain =====
console.log("\n===== EXPERIMENT 3: Scope Chain =====");

const globalLevel = "GLOBAL";

function levelOne() {
  const level1 = "LEVEL 1";

  function levelTwo() {
    const level2 = "LEVEL 2";

    function levelThree() {
      const level3 = "LEVEL 3";
      // Sab accessible — inner se outer tak
      console.log(`${level3} -> ${level2} -> ${level1} -> ${globalLevel}`);
    }

    levelThree();
    // console.log(level3);  // ERROR — inner function ke variable bahar nahi milte
  }

  levelTwo();
}

levelOne();
// Output: "LEVEL 3 -> LEVEL 2 -> LEVEL 1 -> GLOBAL"


// ===== EXPERIMENT 4: Hoisting Demo =====
console.log("\n===== EXPERIMENT 4: Hoisting =====");

// Function declaration — hoisted!
console.log(hoistedFunction());  // "Main hoisted hoon!"

function hoistedFunction() {
  return "Main hoisted hoon!";
}

// var — hoisted as undefined
console.log(hoistedVar);  // undefined
var hoistedVar = "Ab main defined hoon";
console.log(hoistedVar);  // "Ab main defined hoon"

// let — Temporal Dead Zone
try {
  console.log(hoistedLet);  // ERROR!
} catch(e) {
  console.log(`Error: ${e.message}`);
}
let hoistedLet = "Let variable";
```

> **Yaad Rakho:** `var` ke loop problem ko samjho — ye interview mein bahut poochha jaata hai. `let` har iteration mein naya scope banata hai, `var` nahi banata.

---

## Task 4: Utility Functions Collection

File: `utils.js`

```javascript
// Reusable utility functions banao

// 1. Temperature converter
const celsiusToFahrenheit = (c) => (c * 9/5) + 32;
const fahrenheitToCelsius = (f) => (f - 32) * 5/9;

console.log("===== TEMPERATURE CONVERTER =====");
console.log(`37°C = ${celsiusToFahrenheit(37)}°F`);   // 98.6°F — body temp
console.log(`100°F = ${fahrenheitToCelsius(100).toFixed(1)}°C`);  // 37.8°C

// 2. BMI Calculator
function calculateBMI(weight, height, name = "User") {
  const bmi = weight / (height * height);
  let category;
  
  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Normal";
  else if (bmi < 30) category = "Overweight";
  else category = "Obese";

  return { name, bmi: bmi.toFixed(1), category };
}

console.log("\n===== BMI CALCULATOR =====");
const bmiResult = calculateBMI(70, 1.75, "Ramesh");
console.log(`${bmiResult.name}: BMI = ${bmiResult.bmi} (${bmiResult.category})`);

// 3. Simple interest calculator
function simpleInterest(principal, rate = 7, years = 1) {
  const interest = (principal * rate * years) / 100;
  return {
    principal,
    rate: `${rate}%`,
    years,
    interest,
    total: principal + interest
  };
}

console.log("\n===== SIMPLE INTEREST =====");
const loan = simpleInterest(100000, 8.5, 3);
console.log(`Principal: Rs.${loan.principal.toLocaleString()}`);
console.log(`Rate: ${loan.rate} | Years: ${loan.years}`);
console.log(`Interest: Rs.${loan.interest.toLocaleString()}`);
console.log(`Total: Rs.${loan.total.toLocaleString()}`);

// 4. Password strength checker
function checkPasswordStrength(password) {
  let score = 0;
  const feedback = [];
  
  if (password.length >= 8) score++;
  else feedback.push("Minimum 8 characters chahiye");
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Ek capital letter daalo");
  
  if (/[0-9]/.test(password)) score++;
  else feedback.push("Ek number daalo");
  
  if (/[!@#$%^&*]/.test(password)) score++;
  else feedback.push("Ek special character daalo (!@#$%^&*)");
  
  const strength = score <= 1 ? "Weak" : score <= 2 ? "Medium" : score <= 3 ? "Strong" : "Very Strong";
  
  return { password: "*".repeat(password.length), strength, score, feedback };
}

console.log("\n===== PASSWORD CHECKER =====");
const passwords = ["hello", "Hello123", "H3llo@World"];
passwords.forEach(pw => {
  const result = checkPasswordStrength(pw);
  console.log(`${result.password} -> ${result.strength} (${result.score}/4)`);
  if (result.feedback.length > 0) {
    result.feedback.forEach(f => console.log(`  - ${f}`));
  }
});
```

---

## Task 5: Git Commit Practice

> **Terminal Command:**
> ```bash
> # Saari files add karo
> git add .
> git status
> 
> # Commit karo
> git commit -m "Day 4: Functions & Scope practice — calculator, greetings, scope experiments, utils"
> 
> # Log dekho
> git log --oneline
> ```

> **Tip:** Har task complete hone ke baad commit karo. Chhote-chhote commits better hain ek bade commit se. Professional developers aise hi karte hain!

---

## Homework Challenges

### Challenge 1: Higher-Order Function

```javascript
// Ek function banao jo doosra function return kare
function createMultiplier(factor) {
  // Ye function ek naya function return karega
  return (number) => number * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
const tenTimes = createMultiplier(10);

console.log(double(5));    // 10
console.log(triple(5));    // 15
console.log(tenTimes(5));  // 50
```

### Challenge 2: Recursive Factorial

```javascript
// Factorial — function khud ko call kare
function factorial(n) {
  if (n <= 1) return 1;       // Base case — rukne ka point
  return n * factorial(n - 1); // Recursive call
}

console.log(factorial(5));   // 120 (5 * 4 * 3 * 2 * 1)
console.log(factorial(10));  // 3628800
```

### Challenge 3: Apna Kaam

1. Ek `createBill(items, tax)` function banao jo bill generate kare
2. Ek `convertCurrency(amount, from, to)` function banao with default params
3. Scope experiments mein apne examples try karo

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| Declaration | `function name() {}` — hoisted |
| Expression | `const fn = function() {}` — not hoisted |
| Arrow | `const fn = () => {}` — short, modern |
| Default Params | `function(x = 10)` — fallback values |
| Return | Value wapas karo, function ruko |
| Global Scope | Har jagah accessible |
| Block Scope | `let`/`const` sirf `{}` mein |
| Hoisting | `var`/function upar uthte hain |
| Scope Chain | Inner se outer dhundho |

---

## Aaj Kya Seekha?

- Calculator function banaya with history feature
- Default parameters ka real-world use samjha
- Scope experiments se var/let/const ka fark dekha
- Utility functions banaye — reusable code likhna seekha
- Higher-order functions aur recursion ka intro mila
- Git commit practice ki
