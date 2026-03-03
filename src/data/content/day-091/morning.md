# Day 91 Morning: TypeScript Intro — Types, Interfaces, Enums

> **Aaj ka plan:** Aaj hum TypeScript ki duniya mein kadam rakh rahe hain! JavaScript toh seekh liya, ab uska "big brother" seekhenge. TypeScript = JavaScript + Type Safety. Jaise farmer ko pata hota hai ki kaunse beej se kaunsi fasal aayegi — waise hi TypeScript se pata hota hai ki variable mein kya aayega!

---

## TypeScript Kya Hai?

TypeScript ek **superset** hai JavaScript ka — matlab har JavaScript code valid TypeScript code hai, par TypeScript mein **types** add hote hain.

```
JavaScript → Dynamic typing (runtime pe pata chalte hain bugs)
TypeScript → Static typing (code likhte waqt hi pata chal jaata hai)
```

> **Socho Aise:** JavaScript aise hai jaise andhere mein rasta dhundhna — chalte chalte pata chalega ki galat gali mein aa gaye. TypeScript aise hai jaise Google Maps laga ke chalna — pehle se pata hai kahan jaana hai!

---

## TypeScript Install Karna

> **Terminal Command:**
```bash
# Global install
npm install -g typescript

# Version check
tsc --version

# Naya project setup
mkdir ts-basics && cd ts-basics
npm init -y
npm install typescript --save-dev

# tsconfig generate karo
npx tsc --init
```

### tsconfig.json Samjho

```json
{
  "compilerOptions": {
    "target": "ES2020",           // Kaunsa JS version output hoga
    "module": "commonjs",         // Module system
    "strict": true,               // Strict mode ON — best practice
    "outDir": "./dist",           // Compiled JS yahan jayega
    "rootDir": "./src",           // TypeScript files yahan hain
    "esModuleInterop": true,      // Import compatibility
    "skipLibCheck": true,         // Library type check skip
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## Basic Types — Pehli Seedhi

### Primitive Types

```typescript
// String — naam, address, message
let kisanNaam: string = "Ramesh Kumar";
let gaon: string = "Sultanpur";

// Number — price, quantity, age
let fasalPrice: number = 2500;
let khetArea: number = 5.5;   // decimal bhi number hai

// Boolean — haan ya naa
let isOrganicFarmer: boolean = true;
let loanApproved: boolean = false;

// Undefined aur Null
let middleName: string | undefined = undefined;  // ho sakta hai na ho
let deletedAt: Date | null = null;                // abhi nahi delete hua
```

> **Yaad Rakho:** TypeScript mein `:` ke baad type likhte hain. `let x: number = 5` ka matlab hai "x sirf number ho sakta hai". Agar string daaloge toh error aayega BEFORE running!

### Arrays

```typescript
// Array of numbers — fasal prices
let prices: number[] = [2500, 3000, 1800, 4200];

// Array of strings — fasal names
let fasalList: string[] = ["Gehun", "Chawal", "Makka"];

// Alternative syntax
let quantities: Array<number> = [100, 200, 50];

// Mixed nahi chalega — ye error dega!
// let mixed: number[] = [1, "do", 3]; // ERROR!
```

### Tuple — Fixed Structure Array

```typescript
// Tuple — pehle naam, phir price (order fix hai)
let fasalDetail: [string, number] = ["Gehun", 2500];

// Ye galat hai:
// let wrong: [string, number] = [2500, "Gehun"]; // ERROR! Order matters
```

---

## Type Inference — TypeScript Khud Samajhta Hai

```typescript
// TypeScript khud samajh leta hai ki ye number hai
let autoNumber = 42;           // type: number (inferred)
let autoString = "Hello";     // type: string (inferred)

// Toh explicitly likhna zaroori nahi hamesha
// Lekin complex cases mein likhna better hai
```

> **Tip:** Simple variables mein TypeScript khud type samajh leta hai (inference). Par function parameters aur return types mein **explicitly** likhna best practice hai.

---

## Interfaces — Object Ka Blueprint

Interface ek **contract** hai — batata hai ki object mein kya kya hona chahiye.

```typescript
// Kisan ka blueprint
interface Kisan {
  naam: string;
  gaon: string;
  khetArea: number;
  isOrganic: boolean;
  phone?: string;          // ? = optional field — ho bhi sakta hai, na bhi ho
}

// Ab Kisan type ka object banao
const farmer1: Kisan = {
  naam: "Ramesh Kumar",
  gaon: "Sultanpur",
  khetArea: 5.5,
  isOrganic: true
  // phone nahi diya — koi baat nahi, optional hai
};

const farmer2: Kisan = {
  naam: "Suresh Yadav",
  gaon: "Bareilly",
  khetArea: 3.2,
  isOrganic: false,
  phone: "9876543210"   // optional par de diya — valid hai
};

// Ye error dega — naam missing hai!
// const farmer3: Kisan = { gaon: "Lucknow", khetArea: 2 }; // ERROR!
```

### Nested Interfaces

```typescript
interface Address {
  gaon: string;
  district: string;
  state: string;
  pincode: string;
}

interface KisanProfile {
  naam: string;
  age: number;
  address: Address;           // Nested interface
  fasalList: string[];        // Array of strings
  rating: number;
}

const profile: KisanProfile = {
  naam: "Mohan Lal",
  age: 45,
  address: {
    gaon: "Rampur",
    district: "Bareilly",
    state: "Uttar Pradesh",
    pincode: "243001"
  },
  fasalList: ["Gehun", "Chawal", "Ganna"],
  rating: 4.5
};
```

### Readonly aur Extending Interfaces

```typescript
// Readonly — ek baar set kiya toh change nahi hoga
interface Product {
  readonly id: string;
  name: string;
  price: number;
}

const wheat: Product = { id: "P001", name: "Gehun", price: 2500 };
// wheat.id = "P002"; // ERROR! Readonly hai — change nahi kar sakte
wheat.price = 2700;    // Ye chalega — readonly nahi hai

// Interface extending — ek interface doosre se inherit karta hai
interface User {
  naam: string;
  email: string;
}

interface Admin extends User {
  role: string;
  permissions: string[];
}

const admin: Admin = {
  naam: "Priya",
  email: "priya@kisanmart.com",
  role: "super_admin",
  permissions: ["create", "read", "update", "delete"]
};
```

---

## Enums — Fixed Options Ka Set

Enum = **Enumeration** — jab tumhe fixed options chahiye.

```typescript
// Fasal ka season — sirf ye 3 hi ho sakte hain
enum Season {
  Kharif = "KHARIF",       // June-October (Rice, Cotton)
  Rabi = "RABI",           // November-March (Wheat, Mustard)
  Zaid = "ZAID"            // March-June (Watermelon, Cucumber)
}

// Order status — fixed stages
enum OrderStatus {
  Pending = "PENDING",
  Confirmed = "CONFIRMED",
  Shipped = "SHIPPED",
  Delivered = "DELIVERED",
  Cancelled = "CANCELLED"
}

// Usage
interface Order {
  orderId: string;
  product: string;
  status: OrderStatus;     // Sirf OrderStatus values allowed
  season: Season;
}

const order: Order = {
  orderId: "ORD-001",
  product: "Gehun 50kg",
  status: OrderStatus.Confirmed,   // Enum value use karo
  season: Season.Rabi
};

// Ye galat hai:
// order.status = "random_status"; // ERROR! Sirf OrderStatus values chalenge
```

### Numeric Enums

```typescript
// Numeric enum — auto increment hota hai
enum Priority {
  Low,        // 0
  Medium,     // 1
  High,       // 2
  Critical    // 3
}

console.log(Priority.High);  // 2
console.log(Priority[2]);    // "High" — reverse mapping
```

> **Warning:** String enums use karo production mein — numeric enums se debugging mushkil hoti hai. `OrderStatus.Confirmed` padhne mein clear hai, `OrderStatus[1]` nahi.

---

## Union Types — Ya Ye Ya Wo

```typescript
// ID number bhi ho sakta hai, string bhi
let productId: string | number;
productId = "P-001";    // Valid
productId = 1001;       // Valid bhi
// productId = true;    // ERROR! Boolean allowed nahi hai

// Function mein union type
function getPrice(product: string | number): string {
  if (typeof product === "string") {
    return `Product naam: ${product}`;
  }
  return `Product ID: ${product}`;
}
```

---

## Quick Revision Table

| Concept | Syntax | Example |
|---------|--------|---------|
| String type | `let x: string` | `let naam: string = "Ram"` |
| Number type | `let x: number` | `let price: number = 100` |
| Boolean type | `let x: boolean` | `let active: boolean = true` |
| Array | `let x: type[]` | `let items: string[] = ["a"]` |
| Tuple | `[type1, type2]` | `let t: [string, number]` |
| Interface | `interface Name {}` | Object ka blueprint |
| Optional | `field?: type` | `phone?: string` |
| Readonly | `readonly field` | `readonly id: string` |
| Enum | `enum Name {}` | Fixed values ka set |
| Union | `type1 \| type2` | `string \| number` |

---

## Aaj Kya Seekha?

1. **TypeScript** = JavaScript + Type Safety — bugs compile time pe pakadta hai
2. **Basic types** — string, number, boolean, arrays, tuples
3. **Interfaces** — objects ka blueprint, optional fields, readonly, extending
4. **Enums** — fixed options jaise OrderStatus, Season
5. **Union types** — ek variable mein multiple types allow karna
6. **Type inference** — TypeScript khud bhi type samajh leta hai

> **Practice Time!** Evening session mein hum functions ke types, type aliases, aur type narrowing seekhenge. Apna pehla `.ts` file banao aur usmein ek `KisanProfile` interface banao!
