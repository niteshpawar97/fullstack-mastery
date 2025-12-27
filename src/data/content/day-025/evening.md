# Day 25 Evening: OOP Practice — Animal, Vehicle & Bank Account Classes

> **Aaj ka plan:** Aaj subah humne OOP ke concepts seekhe — ab unko practice karke apne haath mein laayenge. Hum 3 real-world projects banayenge: Animal hierarchy, Vehicle system, aur Bank Account class.

---

## Project 1: Animal Class Hierarchy

### Step 1: Base Animal Class

```javascript
// Base class — sabhi animals ke liye common
class Animal {
  #health; // private field

  constructor(name, species, age) {
    this.name = name;
    this.species = species;
    this.age = age;
    this.#health = 100;
    this.isAlive = true;
  }

  // Getter for health
  get health() {
    return this.#health;
  }

  // Har animal kha sakta hai
  eat(food) {
    this.#health = Math.min(100, this.#health + 10);
    console.log(`${this.name} ne ${food} khaya. Health: ${this.#health}`);
  }

  // Har animal so sakta hai
  sleep(hours) {
    this.#health = Math.min(100, this.#health + (hours * 5));
    console.log(`${this.name} ${hours} ghante soya. Health: ${this.#health}`);
  }

  // Har animal ka apna sound hoga — override karenge
  speak() {
    console.log(`${this.name} koi awaaz nikaal raha hai...`);
  }

  // toString override for better display
  toString() {
    return `${this.name} (${this.species}) - Age: ${this.age}, Health: ${this.#health}`;
  }
}
```

### Step 2: Child Classes — Dog, Cat, Bird

```javascript
// Dog class — Animal se inherit karta hai
class Dog extends Animal {
  constructor(name, age, breed) {
    super(name, "Dog", age);
    this.breed = breed;
    this.tricks = [];
  }

  // Override speak
  speak() {
    console.log(`${this.name} bolta hai: Bhow Bhow! 🐕`);
  }

  // Dog-specific method
  learnTrick(trick) {
    this.tricks.push(trick);
    console.log(`${this.name} ne naya trick seekha: ${trick}`);
  }

  showTricks() {
    if (this.tricks.length === 0) {
      console.log(`${this.name} ko abhi koi trick nahi aata`);
      return;
    }
    console.log(`${this.name} ke tricks: ${this.tricks.join(', ')}`);
  }

  fetch(item) {
    console.log(`${this.name} ${item} lekar aaya! Good boy!`);
  }
}

// Cat class
class Cat extends Animal {
  constructor(name, age, isIndoor) {
    super(name, "Cat", age);
    this.isIndoor = isIndoor;
    this.livesLeft = 9; // billiyon ke 9 jaan hoti hain!
  }

  speak() {
    console.log(`${this.name} bolta hai: Meow! 🐱`);
  }

  purr() {
    console.log(`${this.name} khush hai: Purrrrrr...`);
  }

  scratch(item) {
    console.log(`${this.name} ne ${item} ko scratch kar diya!`);
  }
}

// Bird class
class Bird extends Animal {
  constructor(name, age, canFly) {
    super(name, "Bird", age);
    this.canFly = canFly;
  }

  speak() {
    console.log(`${this.name} bolta hai: Chee Chee! 🐦`);
  }

  fly() {
    if (this.canFly) {
      console.log(`${this.name} aasmaan mein ud raha hai!`);
    } else {
      console.log(`${this.name} ud nahi sakta :(`);
    }
  }
}
```

### Step 3: Test Karo

```javascript
// Objects banao aur test karo
const tommy = new Dog("Tommy", 3, "Labrador");
tommy.speak();             // Tommy bolta hai: Bhow Bhow!
tommy.eat("Roti");         // Tommy ne Roti khaya. Health: 100
tommy.learnTrick("Shake hand");
tommy.learnTrick("Roll over");
tommy.showTricks();        // Tommy ke tricks: Shake hand, Roll over
tommy.fetch("Ball");       // Tommy Ball lekar aaya! Good boy!

const billu = new Cat("Billu", 2, true);
billu.speak();             // Billu bolta hai: Meow!
billu.purr();              // Billu khush hai: Purrrrrr...
billu.scratch("Sofa");     // Billu ne Sofa ko scratch kar diya!

const tota = new Bird("Mitthu", 1, true);
tota.speak();              // Mitthu bolta hai: Chee Chee!
tota.fly();                // Mitthu aasmaan mein ud raha hai!

// Polymorphism in action!
const animals = [tommy, billu, tota];
animals.forEach(a => a.speak()); // Har animal apna sound nikaalega
```

> **Expected Output:**
> ```
> Tommy bolta hai: Bhow Bhow! 🐕
> Billu bolta hai: Meow! 🐱
> Mitthu bolta hai: Chee Chee! 🐦
> ```

---

## Project 2: Vehicle Class System

```javascript
class Vehicle {
  #mileage;

  constructor(brand, model, year, fuelCapacity) {
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.fuelCapacity = fuelCapacity; // litres mein
    this.currentFuel = fuelCapacity;  // tank full start
    this.#mileage = 0;
    this.isRunning = false;
  }

  get mileage() {
    return this.#mileage;
  }

  start() {
    if (this.currentFuel <= 0) {
      console.log(`${this.brand} ${this.model}: Petrol khatam hai bhai!`);
      return false;
    }
    this.isRunning = true;
    console.log(`${this.brand} ${this.model} start ho gayi! Vroom!`);
    return true;
  }

  stop() {
    this.isRunning = false;
    console.log(`${this.brand} ${this.model} band ho gayi.`);
  }

  drive(km) {
    if (!this.isRunning) {
      console.log("Pehle gaadi start karo!");
      return;
    }
    const fuelNeeded = km / 15; // 15 km per litre average
    if (fuelNeeded > this.currentFuel) {
      console.log(`Itna fuel nahi hai! Sirf ${(this.currentFuel * 15).toFixed(0)} km chal sakti hai.`);
      return;
    }
    this.currentFuel -= fuelNeeded;
    this.#mileage += km;
    console.log(`${km} km drive kiya. Fuel bacha: ${this.currentFuel.toFixed(1)}L | Total: ${this.#mileage} km`);
  }

  refuel(litres) {
    const canAdd = this.fuelCapacity - this.currentFuel;
    const added = Math.min(litres, canAdd);
    this.currentFuel += added;
    console.log(`${added.toFixed(1)}L fuel bhara. Tank: ${this.currentFuel.toFixed(1)}/${this.fuelCapacity}L`);
  }

  // Static utility method
  static compare(v1, v2) {
    console.log(`--- ${v1.brand} vs ${v2.brand} ---`);
    console.log(`Mileage: ${v1.mileage} km vs ${v2.mileage} km`);
    console.log(`Fuel: ${v1.currentFuel.toFixed(1)}L vs ${v2.currentFuel.toFixed(1)}L`);
  }
}

// Bike class
class Bike extends Vehicle {
  constructor(brand, model, year, fuelCapacity, type) {
    super(brand, model, year, fuelCapacity);
    this.type = type; // Sport, Cruiser, Commuter
  }

  wheelie() {
    if (!this.isRunning) {
      console.log("Bike pehle start karo!");
      return;
    }
    console.log(`${this.brand} ${this.model} ne wheelie maari! 🏍️`);
  }
}

// Truck class
class Truck extends Vehicle {
  constructor(brand, model, year, fuelCapacity, loadCapacity) {
    super(brand, model, year, fuelCapacity);
    this.loadCapacity = loadCapacity; // tonnes mein
    this.currentLoad = 0;
  }

  loadCargo(tonnes) {
    if (this.currentLoad + tonnes > this.loadCapacity) {
      console.log(`Itna load nahi le sakta! Capacity: ${this.loadCapacity}T, Current: ${this.currentLoad}T`);
      return;
    }
    this.currentLoad += tonnes;
    console.log(`${tonnes}T load kiya. Total: ${this.currentLoad}/${this.loadCapacity}T`);
  }

  unloadCargo() {
    console.log(`${this.currentLoad}T maal utara.`);
    this.currentLoad = 0;
  }
}

// Test
const swift = new Vehicle("Maruti", "Swift", 2024, 37);
swift.start();
swift.drive(100);
swift.drive(200);

const bullet = new Bike("Royal Enfield", "Classic 350", 2024, 13, "Cruiser");
bullet.start();
bullet.wheelie();

Vehicle.compare(swift, bullet);
```

> **Practice Time!** Ek `ElectricVehicle` class banao jo Vehicle se extend kare, lekin fuel ki jagah battery use kare. `charge()` method add karo.

---

## Project 3: Bank Account System

```javascript
class BankAccount {
  #balance;
  #pin;
  #transactions;
  #accountNumber;

  constructor(owner, initialDeposit, pin) {
    this.owner = owner;
    this.#balance = initialDeposit;
    this.#pin = pin;
    this.#transactions = [];
    this.#accountNumber = BankAccount.#generateAccountNo();
    this.createdAt = new Date();

    // Opening transaction record
    this.#transactions.push({
      type: 'OPENING',
      amount: initialDeposit,
      balance: this.#balance,
      date: new Date()
    });
  }

  // Private static method
  static #counter = 1000;
  static #generateAccountNo() {
    BankAccount.#counter++;
    return `ACC-${BankAccount.#counter}`;
  }

  get accountNumber() {
    return this.#accountNumber;
  }

  get balance() {
    return this.#balance;
  }

  // PIN verify karna — private helper
  #verifyPin(pin) {
    return pin === this.#pin;
  }

  deposit(amount) {
    if (amount <= 0) {
      console.log("Amount 0 se zyada hona chahiye!");
      return false;
    }
    this.#balance += amount;
    this.#transactions.push({
      type: 'CREDIT',
      amount,
      balance: this.#balance,
      date: new Date()
    });
    console.log(`✅ ₹${amount} jama. Balance: ₹${this.#balance}`);
    return true;
  }

  withdraw(amount, pin) {
    if (!this.#verifyPin(pin)) {
      console.log("❌ Galat PIN! Transaction cancel.");
      return false;
    }
    if (amount <= 0) {
      console.log("Amount 0 se zyada hona chahiye!");
      return false;
    }
    if (amount > this.#balance) {
      console.log(`❌ Balance kam hai! Available: ₹${this.#balance}`);
      return false;
    }
    this.#balance -= amount;
    this.#transactions.push({
      type: 'DEBIT',
      amount,
      balance: this.#balance,
      date: new Date()
    });
    console.log(`✅ ₹${amount} nikala. Balance: ₹${this.#balance}`);
    return true;
  }

  transfer(amount, pin, targetAccount) {
    if (!this.#verifyPin(pin)) {
      console.log("❌ Galat PIN!");
      return false;
    }
    if (amount > this.#balance) {
      console.log("❌ Balance kam hai!");
      return false;
    }
    this.#balance -= amount;
    targetAccount.deposit(amount);
    this.#transactions.push({
      type: 'TRANSFER_OUT',
      amount,
      to: targetAccount.accountNumber,
      balance: this.#balance,
      date: new Date()
    });
    console.log(`✅ ₹${amount} transfer hua ${targetAccount.owner} ko`);
    return true;
  }

  getStatement(pin) {
    if (!this.#verifyPin(pin)) {
      console.log("❌ Galat PIN!");
      return;
    }
    console.log(`\n📋 Statement for ${this.owner} (${this.#accountNumber})`);
    console.log("─".repeat(50));
    this.#transactions.forEach(t => {
      const date = t.date.toLocaleDateString();
      console.log(`${date} | ${t.type.padEnd(14)} | ₹${t.amount} | Bal: ₹${t.balance}`);
    });
    console.log("─".repeat(50));
    console.log(`Current Balance: ₹${this.#balance}\n`);
  }
}

// Test karo
const ravi = new BankAccount("Ravi Kumar", 50000, 1234);
const priya = new BankAccount("Priya Sharma", 30000, 5678);

ravi.deposit(10000);            // ₹10000 jama
ravi.withdraw(5000, 1234);      // ₹5000 nikala
ravi.withdraw(5000, 9999);      // Galat PIN!
ravi.transfer(15000, 1234, priya); // ₹15000 transfer

ravi.getStatement(1234);        // Poori statement dikhega
```

> **Expected Output:**
> ```
> ✅ ₹10000 jama. Balance: ₹60000
> ✅ ₹5000 nikala. Balance: ₹55000
> ❌ Galat PIN! Transaction cancel.
> ✅ ₹15000 jama. Balance: ₹45000
> ✅ ₹15000 transfer hua Priya Sharma ko
> ```

---

## Quick Revision Table

| Concept | Kya Kiya | Key Takeaway |
|---------|----------|--------------|
| Animal Hierarchy | Base + Dog/Cat/Bird | Polymorphism — same method, alag behavior |
| Vehicle System | Vehicle + Bike/Truck | Inheritance + static methods |
| Bank Account | Private fields + methods | Encapsulation — data protection |
| Getter/Setter | balance, mileage | Controlled access to private data |
| Static Method | compare(), generateId() | Class-level utility, no object needed |

---

## Aaj Kya Seekha?

1. **Class hierarchy** banana — parent se child tak inheritance chain
2. **Method overriding** — child class apni version de sakti hai
3. **Polymorphism** — ek array mein alag-alag objects, same method call
4. **Private fields** (#) — real encapsulation ka practical use
5. **Static methods** — utility functions jo class pe directly chalte hain
6. **Transfer pattern** — ek object se dusre object mein data bhejne ka tarika

> **Tip:** Kal hum Event Loop aur Async Patterns sikhenge — JavaScript ka sabse important aur tricky concept. Aaj ke OOP concepts achhe se yaad karo!
