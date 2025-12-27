# Day 25 Morning: Object-Oriented Programming in JavaScript

> **Aaj ka plan:** Aaj hum JavaScript mein OOP (Object-Oriented Programming) sikhenge — constructor functions, prototype chain, ES6 classes, inheritance, static methods, getters/setters, aur encapsulation. Ye sab real-world projects mein daily use hota hai!

---

## OOP Kya Hai?

### Real-Life Se Samjho

OOP ek programming approach hai jahan hum real-world cheezein code mein represent karte hain using **objects**. Har object ke paas **properties** (data) aur **methods** (kaam karne ke functions) hote hain.

> **Socho Aise:** Socho ek farmer hai — uska naam hai, uski zameen hai (properties), aur wo fasal bota hai, paani deta hai (methods). Ab agar 100 farmers hain, toh kya hum har ek ke liye alag-alag code likhenge? Nahi! Hum ek **blueprint** (class) banayenge aur usse 100 farmers create karenge.

### OOP Ke 4 Pillars

| Pillar | Matlab | Example |
|--------|--------|---------|
| **Encapsulation** | Data aur methods ko ek saath bundle karna | Bank account ka balance bahar se directly change nahi hona chahiye |
| **Abstraction** | Complex cheezein chhupa ke simple interface dena | Car chalane ke liye engine ka kaam jaanna zaroori nahi |
| **Inheritance** | Ek class se dusri class properties le sakti hai | ElectricCar inherits from Car |
| **Polymorphism** | Same method, alag behavior | `animal.speak()` — Dog bole "Woof", Cat bole "Meow" |

---

## Constructor Functions (Old Way)

ES6 se pehle hum constructor functions use karte the objects banane ke liye.

```javascript
// Constructor function — naam Capital letter se shuru hota hai
function Farmer(name, land, crop) {
  // 'this' current object ko point karta hai
  this.name = name;
  this.land = land;       // bigha mein
  this.crop = crop;

  // Method define karna
  this.introduce = function() {
    console.log(`Main hoon ${this.name}, mere paas ${this.land} bigha zameen hai`);
  };
}

// Naya farmer banana — 'new' keyword zaroori hai!
const kisan1 = new Farmer("Ramesh", 5, "Gehu");
const kisan2 = new Farmer("Suresh", 10, "Chawal");

kisan1.introduce(); // Main hoon Ramesh, mere paas 5 bigha zameen hai
kisan2.introduce(); // Main hoon Suresh, mere paas 10 bigha zameen hai
```

> **Warning:** Agar `new` keyword bhool gaye toh `this` global object (window/global) ko point karega aur bugs aayenge. Hamesha `new` lagao!

---

## Prototype Chain

### Memory Problem

Upar wale example mein har object apni alag `introduce` function copy rakhta hai. 100 farmers = 100 copies of same function. Memory waste!

### Prototype Se Solution

```javascript
function Farmer(name, land, crop) {
  this.name = name;
  this.land = land;
  this.crop = crop;
}

// Prototype pe method dalo — sab objects share karenge
Farmer.prototype.introduce = function() {
  console.log(`Main hoon ${this.name}, mere paas ${this.land} bigha zameen hai`);
};

Farmer.prototype.harvest = function() {
  console.log(`${this.name} ki ${this.crop} ki katai ho rahi hai!`);
};

const kisan1 = new Farmer("Ramesh", 5, "Gehu");
kisan1.introduce(); // Kaam karta hai!
kisan1.harvest();   // Ye bhi kaam karta hai!

// Check karo — method prototype pe hai
console.log(kisan1.hasOwnProperty('name'));       // true (own property)
console.log(kisan1.hasOwnProperty('introduce'));  // false (prototype pe hai)
```

> **Yaad Rakho:** Jab JavaScript kisi property ko object pe nahi dhundh paata, toh wo uske **prototype** mein dekhta hai, phir uske prototype mein, aur aise chain chalti hai jab tak `null` nahi mil jaata. Isko **Prototype Chain** kehte hain.

```javascript
// Prototype chain dekhna
console.log(kisan1.__proto__ === Farmer.prototype);           // true
console.log(Farmer.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__);                      // null (chain yahan khatam)
```

---

## ES6 Classes (Modern Way)

ES6 mein `class` keyword aaya — ye internally prototype hi use karta hai, lekin syntax clean hai.

```javascript
class Animal {
  // Constructor — jab new object banta hai tab chalta hai
  constructor(name, type, sound) {
    this.name = name;
    this.type = type;
    this.sound = sound;
  }

  // Method — automatically prototype pe jaata hai
  speak() {
    console.log(`${this.name} bolta hai: ${this.sound}!`);
  }

  info() {
    console.log(`${this.name} ek ${this.type} hai`);
  }
}

const dog = new Animal("Tommy", "Dog", "Bhow Bhow");
const cat = new Animal("Billu", "Cat", "Meow");

dog.speak(); // Tommy bolta hai: Bhow Bhow!
cat.speak(); // Billu bolta hai: Meow!
```

> **Tip:** ES6 classes sirf "syntactic sugar" hain — andar prototype chain hi kaam kar rahi hai. Lekin readability bahut better hai!

---

## Inheritance: extends aur super

### Parent Class Se Properties Lena

```javascript
// Parent class (base class)
class Vehicle {
  constructor(brand, model, year) {
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    console.log(`${this.brand} ${this.model} start ho gayi!`);
  }

  stop() {
    this.isRunning = false;
    console.log(`${this.brand} ${this.model} band ho gayi!`);
  }
}

// Child class — Vehicle se inherit karti hai
class Car extends Vehicle {
  constructor(brand, model, year, fuelType) {
    // super() parent ka constructor call karta hai — ZAROORI hai!
    super(brand, model, year);
    this.fuelType = fuelType;  // apni extra property
  }

  // Apna method
  honk() {
    console.log(`${this.brand} ${this.model}: Peep Peep! 🚗`);
  }
}

class ElectricCar extends Car {
  constructor(brand, model, year, batteryCapacity) {
    super(brand, model, year, "Electric");
    this.batteryCapacity = batteryCapacity;
    this.chargeLevel = 100;
  }

  charge() {
    this.chargeLevel = 100;
    console.log(`${this.brand} ${this.model} fully charged!`);
  }
}

const mycar = new Car("Maruti", "Swift", 2024, "Petrol");
mycar.start();  // Maruti Swift start ho gayi!
mycar.honk();   // Maruti Swift: Peep Peep!

const tesla = new ElectricCar("Tesla", "Model 3", 2025, "75kWh");
tesla.start();  // Tesla Model 3 start ho gayi! (parent ka method)
tesla.charge(); // Tesla Model 3 fully charged! (apna method)
```

> **Yaad Rakho:** `super()` hamesha child class ke constructor mein `this` use karne se **pehle** call karna padta hai. Warna error aayega!

---

## Static Methods

Static methods class pe hote hain, objects pe nahi. Ye utility functions ke liye use hote hain.

```javascript
class MathHelper {
  // Static method — class pe directly call hota hai
  static add(a, b) {
    return a + b;
  }

  static celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
  }

  static generateId() {
    return 'ID-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
}

// Class pe directly call karo — object banana zaroori nahi
console.log(MathHelper.add(5, 3));                 // 8
console.log(MathHelper.celsiusToFahrenheit(37));   // 98.6
console.log(MathHelper.generateId());              // ID-1717171717171-453

// const m = new MathHelper();
// m.add(5, 3); // ERROR! Static method object pe nahi milta
```

---

## Getters & Setters

Getters aur Setters se hum properties ko control ke saath read/write kar sakte hain.

```javascript
class IoTSensor {
  constructor(sensorId, location) {
    this.sensorId = sensorId;
    this.location = location;
    this._temperature = 0; // underscore = "private" convention
    this._readings = [];
  }

  // Getter — property ki tarah access hota hai
  get temperature() {
    return this._temperature;
  }

  // Setter — value set karte waqt validation kar sakte hain
  set temperature(value) {
    if (typeof value !== 'number') {
      throw new Error('Temperature ek number hona chahiye!');
    }
    if (value < -50 || value > 60) {
      throw new Error('Temperature -50 se 60 ke beech hona chahiye!');
    }
    this._temperature = value;
    this._readings.push({ value, time: new Date() });
  }

  // Getter — computed property
  get averageTemp() {
    if (this._readings.length === 0) return 0;
    const sum = this._readings.reduce((acc, r) => acc + r.value, 0);
    return (sum / this._readings.length).toFixed(2);
  }
}

const sensor = new IoTSensor("SENSOR-001", "Khet-A");

// Setter use hota hai — but lagta property jaisa
sensor.temperature = 32;
sensor.temperature = 35;
sensor.temperature = 28;

// Getter use hota hai — function call ki tarah nahi, property jaisa
console.log(sensor.temperature); // 28
console.log(sensor.averageTemp); // 31.67

// sensor.temperature = "garam"; // Error! Validation kaam karegi
```

> **Socho Aise:** Getter/Setter ek security guard jaisa hai — koi bhi andar seedha nahi ja sakta, guard check karega pehle!

---

## Encapsulation: Private Fields (#)

ES2022 mein **true private fields** aaye `#` symbol ke saath.

```javascript
class BankAccount {
  // Private fields — class ke bahar access nahi ho sakte
  #balance;
  #pin;
  #transactions;

  constructor(owner, initialBalance, pin) {
    this.owner = owner;           // public
    this.#balance = initialBalance; // private
    this.#pin = pin;               // private
    this.#transactions = [];       // private
  }

  // Public method — controlled access
  deposit(amount) {
    if (amount <= 0) throw new Error("Amount positive hona chahiye!");
    this.#balance += amount;
    this.#transactions.push({ type: 'deposit', amount, date: new Date() });
    console.log(`${amount} jama hua. Naya balance: ${this.#balance}`);
  }

  withdraw(amount, pin) {
    if (pin !== this.#pin) throw new Error("Galat PIN!");
    if (amount > this.#balance) throw new Error("Paisa kam hai bhai!");
    this.#balance -= amount;
    this.#transactions.push({ type: 'withdraw', amount, date: new Date() });
    console.log(`${amount} nikla. Bacha hua: ${this.#balance}`);
  }

  get balance() {
    return this.#balance;
  }

  getStatement() {
    return this.#transactions.map(t =>
      `${t.type}: ₹${t.amount} on ${t.date.toLocaleDateString()}`
    );
  }
}

const account = new BankAccount("Ravi", 10000, 1234);
account.deposit(5000);        // 5000 jama hua. Naya balance: 15000
account.withdraw(2000, 1234); // 2000 nikla. Bacha hua: 13000

console.log(account.balance);      // 13000 (getter se)
// console.log(account.#balance);  // SyntaxError! Private field bahar se access nahi hota
// console.log(account.#pin);      // SyntaxError!
```

> **Warning:** `#` wale private fields sirf class ke andar hi accessible hain. Ye `_underscore` convention se alag hai — `_` sirf ek naming convention hai, actually private nahi hota. `#` truly private hai!

---

## Quick Revision Table

| Concept | Syntax | Use Case |
|---------|--------|----------|
| Constructor Function | `function Car() {}` | Old way, ES5 |
| Prototype | `Car.prototype.method = fn` | Shared methods, memory efficient |
| ES6 Class | `class Car {}` | Modern, clean syntax |
| Inheritance | `class ElectricCar extends Car` | Parent se properties lena |
| super() | `super(args)` | Parent constructor call karna |
| Static Method | `static methodName()` | Utility functions, no object needed |
| Getter | `get propName()` | Computed/controlled property read |
| Setter | `set propName(val)` | Validated property write |
| Private Field | `#fieldName` | True encapsulation |

---

## Aaj Kya Seekha?

1. **OOP ke 4 pillars** — Encapsulation, Abstraction, Inheritance, Polymorphism
2. **Constructor functions** — purana tarika objects banane ka
3. **Prototype chain** — JavaScript mein inheritance ka actual mechanism
4. **ES6 Classes** — modern, clean syntax (internally prototype hi hai)
5. **extends/super** — inheritance implement karna
6. **Static methods** — class-level utility functions
7. **Getters/Setters** — controlled property access
8. **Private fields (#)** — true encapsulation

> **Practice Time!** Evening session mein hum Animal hierarchy, Vehicle system, aur BankAccount class banakar practice karenge. Abhi tak jo seekha hai usko revise karo!
