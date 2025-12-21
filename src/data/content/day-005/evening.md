# Day 5 Evening: Objects & JSON Practice

> **Practice Time!** Objects aur JSON — real data ke saath practice karo!

---

## Setup

> **Terminal Command:**
> ```bash
> mkdir fullstack-day5
> cd fullstack-day5
> git init
> ```

---

## Task 1: Student Record System

File: `student-system.js`

```javascript
// Student object banao — complete profile
const student = {
  id: 1,
  name: "Priya Sharma",
  age: 21,
  course: "BCA",
  semester: 4,
  subjects: ["Data Structures", "DBMS", "Web Development", "OS"],
  marks: {
    dataStructures: 85,
    dbms: 78,
    webDev: 92,
    os: 70
  },
  address: {
    street: "MG Road",
    city: "Jaipur",
    state: "Rajasthan",
    pin: "302001"
  },
  
  // Methods
  getFullAddress() {
    const { street, city, state, pin } = this.address;
    return `${street}, ${city}, ${state} - ${pin}`;
  },
  
  calculatePercentage() {
    const marksArray = Object.values(this.marks);
    const total = marksArray.reduce((sum, m) => sum + m, 0);
    return (total / marksArray.length).toFixed(1);
  },
  
  getGrade() {
    const pct = parseFloat(this.calculatePercentage());
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B";
    if (pct >= 60) return "C";
    return "D";
  },

  displayProfile() {
    console.log("===== STUDENT PROFILE =====");
    console.log(`Name: ${this.name}`);
    console.log(`Course: ${this.course} (Sem ${this.semester})`);
    console.log(`Age: ${this.age}`);
    console.log(`Address: ${this.getFullAddress()}`);
    console.log(`\nSubjects: ${this.subjects.join(", ")}`);
    console.log(`\nMarks:`);
    for (const [subject, marks] of Object.entries(this.marks)) {
      console.log(`  ${subject}: ${marks}`);
    }
    console.log(`\nPercentage: ${this.calculatePercentage()}%`);
    console.log(`Grade: ${this.getGrade()}`);
  }
};

student.displayProfile();

// Destructuring practice
const { name, course, marks } = student;
const { dataStructures, webDev } = marks;
console.log(`\n${name} scored ${dataStructures} in DS and ${webDev} in Web Dev`);
```

> **Expected Output:**
> ```
> ===== STUDENT PROFILE =====
> Name: Priya Sharma
> Course: BCA (Sem 4)
> Age: 21
> Address: MG Road, Jaipur, Rajasthan - 302001
> 
> Subjects: Data Structures, DBMS, Web Development, OS
> 
> Marks:
>   dataStructures: 85
>   dbms: 78
>   webDev: 92
>   os: 70
> 
> Percentage: 81.3%
> Grade: A
> ```

---

## Task 2: Kisan Profile System

File: `kisan-profile.js`

```javascript
// Kisan profiles banao
const kisan1 = {
  name: "Ramesh Kumar",
  village: "Kheda",
  district: "Aligarh",
  state: "UP",
  landArea: 5,  // acres
  crops: [
    { name: "Wheat", season: "Rabi", investmentPerAcre: 15000 },
    { name: "Rice", season: "Kharif", investmentPerAcre: 18000 },
    { name: "Sugarcane", season: "Annual", investmentPerAcre: 25000 }
  ],
  equipment: ["Tractor", "Pump", "Sprayer"],
  
  getTotalInvestment() {
    return this.crops.reduce((total, crop) => {
      return total + (crop.investmentPerAcre * this.landArea);
    }, 0);
  },
  
  getCropNames() {
    return this.crops.map(c => c.name);
  }
};

// Spread operator se naya kisan banao (copy + modify)
const kisan2 = {
  ...kisan1,
  name: "Suresh Yadav",
  village: "Govindpur",
  landArea: 8,
  crops: [
    { name: "Cotton", season: "Kharif", investmentPerAcre: 20000 },
    { name: "Mustard", season: "Rabi", investmentPerAcre: 12000 }
  ],
  equipment: [...kisan1.equipment, "Harvester"]  // kisan1 ke equipment + naya
};

// Display function
function displayKisanProfile(kisan) {
  console.log(`\n===== KISAN PROFILE =====`);
  console.log(`Name: ${kisan.name}`);
  console.log(`Location: ${kisan.village}, ${kisan.district}, ${kisan.state}`);
  console.log(`Land: ${kisan.landArea} acres`);
  console.log(`Crops: ${kisan.getCropNames().join(", ")}`);
  console.log(`Equipment: ${kisan.equipment.join(", ")}`);
  console.log(`Total Investment: Rs.${kisan.getTotalInvestment().toLocaleString()}`);
  
  // Har crop ki detail
  console.log(`\nCrop Details:`);
  kisan.crops.forEach(crop => {
    const total = crop.investmentPerAcre * kisan.landArea;
    console.log(`  ${crop.name} (${crop.season}): Rs.${crop.investmentPerAcre}/acre x ${kisan.landArea} = Rs.${total.toLocaleString()}`);
  });
}

displayKisanProfile(kisan1);
displayKisanProfile(kisan2);

// Compare two kisans
console.log("\n===== COMPARISON =====");
const inv1 = kisan1.getTotalInvestment();
const inv2 = kisan2.getTotalInvestment();
console.log(`${kisan1.name}: Rs.${inv1.toLocaleString()}`);
console.log(`${kisan2.name}: Rs.${inv2.toLocaleString()}`);
console.log(`Zyada investment: ${inv1 > inv2 ? kisan1.name : kisan2.name}`);
```

> **Tip:** Real projects mein data aise hi objects mein hota hai. Backend se API data aata hai — wo bhi objects ka array hota hai. Isliye objects ko achhe se samjho!

---

## Task 3: JSON Data Handling

File: `json-practice.js`

```javascript
// ===== 1. Object to JSON and back =====
console.log("===== JSON CONVERSION =====");

const order = {
  orderId: "ORD-2026-001",
  customer: "Amit Verma",
  items: [
    { name: "Laptop", price: 55000, qty: 1 },
    { name: "Mouse", price: 500, qty: 2 },
    { name: "Keyboard", price: 1200, qty: 1 }
  ],
  date: "2026-04-04",
  status: "Processing"
};

// Object -> JSON String
const jsonStr = JSON.stringify(order);
console.log("JSON String:");
console.log(jsonStr);
console.log(`Type: ${typeof jsonStr}\n`);  // string

// Pretty JSON
console.log("Pretty JSON:");
console.log(JSON.stringify(order, null, 2));

// JSON String -> Object
const parsed = JSON.parse(jsonStr);
console.log(`\nParsed back — Customer: ${parsed.customer}`);
console.log(`Items count: ${parsed.items.length}`);


// ===== 2. API Response Simulation =====
console.log("\n===== API RESPONSE HANDLING =====");

const weatherApi = `{
  "city": "Jaipur",
  "temperature": 38,
  "humidity": 25,
  "forecast": [
    { "day": "Monday", "high": 40, "low": 28, "condition": "Sunny" },
    { "day": "Tuesday", "high": 39, "low": 27, "condition": "Partly Cloudy" },
    { "day": "Wednesday", "high": 42, "low": 30, "condition": "Hot" }
  ]
}`;

// Parse karo
const weather = JSON.parse(weatherApi);

// Destructure karo
const { city, temperature, humidity, forecast } = weather;

console.log(`Weather for ${city}`);
console.log(`Current: ${temperature}°C, Humidity: ${humidity}%`);
console.log(`\nForecast:`);
forecast.forEach(day => {
  console.log(`  ${day.day}: ${day.low}°C - ${day.high}°C (${day.condition})`);
});

// Filter — hot days
const hotDays = forecast.filter(d => d.high > 40);
console.log(`\nHot Days (>40°C): ${hotDays.map(d => d.day).join(", ")}`);


// ===== 3. Deep Copy with JSON =====
console.log("\n===== DEEP COPY =====");

const original = {
  name: "Config",
  settings: {
    theme: "dark",
    notifications: { email: true, sms: false }
  }
};

// Shallow copy — inner objects shared hain!
const shallowCopy = { ...original };
shallowCopy.settings.theme = "light";
console.log(`Original theme: ${original.settings.theme}`);  // "light" — badal gaya!

// Deep copy — JSON trick
const deepCopy = JSON.parse(JSON.stringify(original));
deepCopy.settings.notifications.email = false;
console.log(`Original email: ${original.settings.notifications.email}`);  // true — safe!
console.log(`Copy email: ${deepCopy.settings.notifications.email}`);     // false

// Modern way — structuredClone (Node 17+)
const modernCopy = structuredClone(original);
modernCopy.name = "Modified Config";
console.log(`Original name: ${original.name}`);     // "Config"
console.log(`Modern copy name: ${modernCopy.name}`); // "Modified Config"
```

> **Yaad Rakho:** Spread operator `...` shallow copy karta hai. Nested objects ke liye `JSON.parse(JSON.stringify())` ya `structuredClone()` use karo!

---

## Task 4: Object Utility Functions

File: `object-utils.js`

```javascript
// 1. Object compare function
function compareObjects(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => {
    if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
      return compareObjects(obj1[key], obj2[key]);  // Recursive compare
    }
    return obj1[key] === obj2[key];
  });
}

const a = { name: "Test", value: 42 };
const b = { name: "Test", value: 42 };
const c = { name: "Test", value: 99 };

console.log("===== OBJECT COMPARE =====");
console.log(`a == b: ${compareObjects(a, b)}`);  // true
console.log(`a == c: ${compareObjects(a, c)}`);  // false


// 2. Object transformer — sab values ko modify karo
function transformValues(obj, transformFn) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = transformFn(value);
  }
  return result;
}

const prices = { wheat: 2200, rice: 3500, cotton: 6500 };
const discounted = transformValues(prices, price => Math.round(price * 0.9));
console.log("\n===== DISCOUNTED PRICES =====");
console.log("Original:", prices);
console.log("10% Off:", discounted);


// 3. Merge multiple objects with conflict resolution
function smartMerge(...objects) {
  return objects.reduce((merged, obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (key in merged && typeof merged[key] === "number" && typeof value === "number") {
        merged[key] = merged[key] + value;  // Numbers ko add karo
      } else {
        merged[key] = value;  // Baaki overwrite karo
      }
    }
    return merged;
  }, {});
}

const sales1 = { wheat: 5000, rice: 3000 };
const sales2 = { wheat: 7000, cotton: 4000 };
const sales3 = { rice: 2000, cotton: 6000, wheat: 3000 };

console.log("\n===== SMART MERGE (Sum Numbers) =====");
console.log(smartMerge(sales1, sales2, sales3));
// { wheat: 15000, rice: 5000, cotton: 10000 }
```

---

## Task 5: Git Commit

> **Terminal Command:**
> ```bash
> git add .
> git status
> git commit -m "Day 5: Objects & JSON practice — student system, kisan profile, JSON handling, utils"
> git log --oneline
> ```

---

## Homework Challenges

### Challenge 1: Inventory Management Object

```javascript
// Apna inventory system banao
const inventory = {
  items: [],
  
  addItem(name, price, stock) {
    this.items.push({ name, price, stock, id: this.items.length + 1 });
    console.log(`Added: ${name}`);
  },
  
  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id);
  },
  
  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.stock), 0);
  },
  
  display() {
    console.log("\n===== INVENTORY =====");
    this.items.forEach(item => {
      console.log(`[${item.id}] ${item.name}: Rs.${item.price} x ${item.stock} = Rs.${item.price * item.stock}`);
    });
    console.log(`Total Value: Rs.${this.getTotal().toLocaleString()}`);
  }
};

// Test karo
inventory.addItem("Wheat", 2200, 10);
inventory.addItem("Rice", 3500, 5);
inventory.addItem("Cotton", 6500, 3);
inventory.display();
```

### Challenge 2: Apna Kaam

1. Apna `userProfile` object banao with methods (getName, getAge, updateCity)
2. JSON string se 5 products parse karo, filter karo (price > 1000), aur display karo
3. Nested object deep copy experiment karo

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| Object creation | `{ key: value }` — curly braces |
| Dot/Bracket | `obj.key` vs `obj["key"]` |
| Methods | Object ke andar functions |
| `this` | Current object reference |
| Destructuring | `const { a, b } = obj` |
| Spread `...` | Shallow copy / merge |
| `JSON.stringify()` | Object -> string |
| `JSON.parse()` | String -> object |
| Deep copy | `JSON.parse(JSON.stringify())` |
| `Object.keys/values/entries` | Object iterate karo |

---

## Aaj Kya Seekha?

- Student profile system banaya with methods
- Kisan profile banaya — real-world data modeling
- JSON conversion aur API response handling
- Shallow vs Deep copy ka fark samjha
- Object utility functions banaye — compare, transform, merge
- Git commit practice ki
