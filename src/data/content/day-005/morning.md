# Day 5 Morning: Objects & JSON — Real Data Structures

> **Aaj ka plan:** Aaj hum seekhenge Objects — JavaScript ka sabse important data structure. Real duniya mein har cheez ek object hai — student, product, kisan, order. Objects se hum real data model karte hain. Saath mein JSON — internet ki universal data language!

---

## Objects Kya Hain?

Object ek key-value pair ka collection hai. Jaise ek form mein — har field (key) ka ek value hota hai.

```javascript
// Object banao — curly braces {}
const student = {
  name: "Priya Sharma",
  age: 22,
  course: "BCA",
  city: "Jaipur",
  isActive: true
};

// Access karo — Dot notation
console.log(student.name);     // "Priya Sharma"
console.log(student.age);      // 22

// Access karo — Bracket notation
console.log(student["course"]);  // "BCA"
console.log(student["city"]);    // "Jaipur"

// Dynamic key ke liye bracket notation zaruri hai
const key = "name";
console.log(student[key]);  // "Priya Sharma"
// console.log(student.key);  // undefined — ye "key" naam ki property dhundhega
```

> **Socho Aise:** Object ek Aadhaar Card jaisa hai — Naam, Age, Address, Photo — har field ek property hai. Array mein order matter karta hai, Object mein key matter karti hai.

---

## Properties Add, Update, Delete

```javascript
const kisan = {
  name: "Ramesh Kumar",
  village: "Kheda",
  mainCrop: "Wheat"
};

// ADD — nayi property
kisan.phone = "9876543210";
kisan.landArea = 5;  // acres

// UPDATE — existing property
kisan.mainCrop = "Rice";

// DELETE — property hatao
delete kisan.phone;

console.log(kisan);
// { name: "Ramesh Kumar", village: "Kheda", mainCrop: "Rice", landArea: 5 }

// CHECK — property exists?
console.log("name" in kisan);     // true
console.log("phone" in kisan);    // false (delete kar diya tha)
console.log(kisan.email);         // undefined (property hi nahi hai)
```

> **Warning:** `delete` operator property hata deta hai completely. Property ko `undefined` set karna alag hai — key rahegi lekin value `undefined` hogi.

---

## Object Methods — Functions Inside Objects

```javascript
const bankAccount = {
  owner: "Vikram Singh",
  balance: 50000,
  
  // Method — object ke andar function
  deposit(amount) {
    this.balance += amount;
    console.log(`Rs.${amount} jama. New Balance: Rs.${this.balance}`);
  },
  
  withdraw(amount) {
    if (amount > this.balance) {
      console.log("Insufficient balance! Itna paisa nahi hai.");
      return;
    }
    this.balance -= amount;
    console.log(`Rs.${amount} nikala. New Balance: Rs.${this.balance}`);
  },
  
  getStatement() {
    return `Account: ${this.owner} | Balance: Rs.${this.balance}`;
  }
};

bankAccount.deposit(10000);    // Rs.10000 jama. New Balance: Rs.60000
bankAccount.withdraw(5000);    // Rs.5000 nikala. New Balance: Rs.55000
bankAccount.withdraw(100000);  // Insufficient balance!
console.log(bankAccount.getStatement());
// Account: Vikram Singh | Balance: Rs.55000
```

> **Yaad Rakho:** `this` keyword current object ko refer karta hai. Method ke andar `this.balance` ka matlab hai "is object ka balance". Arrow functions mein `this` alag behave karta hai — methods ke liye regular functions use karo!

---

## this Keyword — Samjho Carefully

```javascript
const car = {
  brand: "Tata",
  model: "Nexon",
  year: 2024,
  
  // Regular method — this = car object
  getInfo() {
    return `${this.brand} ${this.model} (${this.year})`;
  },
  
  // Arrow function — this = outer scope (NOT car object!)
  getInfoArrow: () => {
    // this yahan window/global object hoga, car nahi!
    return `${this.brand} ${this.model}`;  // undefined undefined
  }
};

console.log(car.getInfo());       // "Tata Nexon (2024)" — correct!
console.log(car.getInfoArrow());  // "undefined undefined" — galat!
```

> **Warning:** Object methods ke liye arrow function mat use karo! Arrow function apna `this` nahi banata — parent scope ka `this` inherit karta hai. Ye bahut common mistake hai!

---

## Object Destructuring — Smart Way to Extract

```javascript
const product = {
  id: 101,
  name: "Organic Wheat",
  price: 2200,
  quantity: 50,
  category: "Grains",
  origin: "Punjab"
};

// Purana tarika — ek ek karke
const name1 = product.name;
const price1 = product.price;

// Naya tarika — Destructuring (ek line mein multiple extract)
const { name, price, category } = product;
console.log(name);      // "Organic Wheat"
console.log(price);     // 2200
console.log(category);  // "Grains"

// Rename karte hue destructure
const { name: productName, price: productPrice } = product;
console.log(productName);   // "Organic Wheat"
console.log(productPrice);  // 2200

// Default value — agar property na ho
const { rating = "Not Rated", origin } = product;
console.log(rating);  // "Not Rated" (product mein rating nahi hai)
console.log(origin);  // "Punjab"

// Function parameter mein destructuring
function displayProduct({ name, price, category }) {
  console.log(`${name} — Rs.${price} [${category}]`);
}
displayProduct(product);  // "Organic Wheat — Rs.2200 [Grains]"
```

> **Tip:** Destructuring code ko clean aur readable banata hai. API se data aaye to destructure karo — har property ek variable mein!

---

## Spread Operator (...) — Copy & Merge

```javascript
// 1. Object copy
const original = { a: 1, b: 2, c: 3 };
const copy = { ...original };
console.log(copy);  // { a: 1, b: 2, c: 3 }

// Copy change karo — original safe hai
copy.a = 100;
console.log(original.a);  // 1 (unchanged!)
console.log(copy.a);      // 100

// 2. Merge objects
const personalInfo = { name: "Amit", age: 25 };
const addressInfo = { city: "Delhi", pin: "110001" };
const contactInfo = { phone: "9999999999", email: "amit@gmail.com" };

const fullProfile = { ...personalInfo, ...addressInfo, ...contactInfo };
console.log(fullProfile);
// { name: "Amit", age: 25, city: "Delhi", pin: "110001", phone: "9999999999", email: "amit@gmail.com" }

// 3. Override specific properties
const defaultConfig = {
  theme: "light",
  language: "en",
  fontSize: 14,
  notifications: true
};

const userConfig = {
  ...defaultConfig,
  theme: "dark",        // override
  language: "hi",       // override
  fontSize: 16          // override
};

console.log(userConfig);
// { theme: "dark", language: "hi", fontSize: 16, notifications: true }
```

> **Yaad Rakho:** Spread operator **shallow copy** banata hai. Agar object ke andar object hai (nested), to inner object ka reference copy hota hai, actual copy nahi. Deep copy ke liye `structuredClone()` ya `JSON.parse(JSON.stringify())` use karo.

---

## Object Useful Methods

```javascript
const crop = {
  name: "Cotton",
  price: 6500,
  unit: "quintal",
  season: "Kharif"
};

// Object.keys() — sab keys ka array
console.log(Object.keys(crop));
// ["name", "price", "unit", "season"]

// Object.values() — sab values ka array
console.log(Object.values(crop));
// ["Cotton", 6500, "quintal", "Kharif"]

// Object.entries() — key-value pairs ka array
console.log(Object.entries(crop));
// [["name","Cotton"], ["price",6500], ["unit","quintal"], ["season","Kharif"]]

// Loop karo entries pe
for (const [key, value] of Object.entries(crop)) {
  console.log(`${key}: ${value}`);
}
// name: Cotton
// price: 6500
// unit: quintal
// season: Kharif

// Object.freeze() — ab koi change nahi hoga
const frozenCrop = Object.freeze({ name: "Wheat", price: 2200 });
frozenCrop.price = 3000;  // Silently fail (strict mode mein error)
console.log(frozenCrop.price);  // 2200 (change nahi hua!)
```

---

## JSON — JavaScript Object Notation

JSON internet pe data exchange ki standard language hai. API se data JSON mein aata hai.

```javascript
// JavaScript Object (JS mein use karo)
const studentObj = {
  name: "Sneha",
  age: 21,
  subjects: ["Math", "Science"],
  active: true
};

// Object -> JSON String (bhejne ke liye — server ko, file mein, etc.)
const jsonString = JSON.stringify(studentObj);
console.log(jsonString);
// '{"name":"Sneha","age":21,"subjects":["Math","Science"],"active":true}'
console.log(typeof jsonString);  // "string"

// JSON String -> Object (wapas use karne ke liye)
const parsedObj = JSON.parse(jsonString);
console.log(parsedObj.name);  // "Sneha"
console.log(typeof parsedObj);  // "object"

// Pretty print — readable format
const prettyJson = JSON.stringify(studentObj, null, 2);
console.log(prettyJson);
// {
//   "name": "Sneha",
//   "age": 21,
//   "subjects": [
//     "Math",
//     "Science"
//   ],
//   "active": true
// }
```

### JSON Rules

```javascript
// JSON mein ye ALLOWED hai:
// - Strings (double quotes only): "hello"
// - Numbers: 42, 3.14
// - Booleans: true, false
// - null
// - Arrays: [1, 2, 3]
// - Objects: {"key": "value"}

// JSON mein ye NOT ALLOWED:
// - Single quotes: 'hello'     (sirf double quotes)
// - Functions: function() {}
// - undefined
// - Comments: // ya /* */
// - Trailing comma: {"a": 1,}
```

> **Socho Aise:** JSON ek universal language hai — chahe Python ho, Java ho, ya JavaScript — sab JSON samajhte hain. API banao to JSON bhejo, API se data lo to JSON parse karo!

---

## Real-World Example: Kisan Market API Data

```javascript
// Imagine ye data API se aaya — JSON string ke form mein
const apiResponse = `{
  "status": "success",
  "data": {
    "market": "Azadpur Mandi",
    "date": "2026-04-04",
    "crops": [
      { "name": "Tomato", "price": 45, "unit": "kg" },
      { "name": "Onion", "price": 32, "unit": "kg" },
      { "name": "Wheat", "price": 2200, "unit": "quintal" }
    ]
  }
}`;

// Parse karo — string se object banao
const response = JSON.parse(apiResponse);

// Destructure karo — clean access
const { status, data: { market, date, crops } } = response;

console.log(`Market: ${market}`);
console.log(`Date: ${date}`);
console.log(`Status: ${status}`);
console.log("\nCrop Prices:");
crops.forEach(crop => {
  console.log(`  ${crop.name}: Rs.${crop.price}/${crop.unit}`);
});
```

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| Object | `{ key: value }` — key-value pairs |
| Dot Notation | `obj.key` — direct access |
| Bracket Notation | `obj["key"]` — dynamic key ke liye |
| Methods | Object ke andar functions |
| `this` | Current object ko refer karta hai |
| Destructuring | `const { a, b } = obj` — extract values |
| Spread `...` | Copy/merge objects |
| `Object.keys()` | Sab keys ka array |
| `Object.entries()` | Key-value pairs ka array |
| `JSON.stringify()` | Object -> JSON string |
| `JSON.parse()` | JSON string -> Object |

---

## Aaj Kya Seekha?

- Objects kaise banate, access karte, update karte hain
- Object methods aur `this` keyword
- Destructuring se clean data extraction
- Spread operator se copy aur merge
- Object.keys/values/entries utility methods
- JSON — internet ki data language, stringify aur parse
