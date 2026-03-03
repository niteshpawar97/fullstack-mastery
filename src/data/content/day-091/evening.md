# Day 91 Evening: TypeScript — Functions, Type Aliases, Type Narrowing

> **Aaj ka plan:** Morning mein basic types, interfaces, enums seekhe. Ab evening mein functions ko type-safe banana seekhenge, Type Aliases samjhenge, aur Type Narrowing — yani TypeScript ko batana ki "bhai, ye is waqt ye type hai!" Real code mein ye sab bahut kaam aata hai.

---

## Functions Mein Types

### Basic Function Types

```typescript
// Function parameters aur return type dono mein type lagao
function calculateMSP(fasal: string, quantity: number): number {
  // MSP = Minimum Support Price
  const mspRates: Record<string, number> = {
    "Gehun": 2275,
    "Chawal": 2183,
    "Makka": 1962
  };
  
  const rate = mspRates[fasal] || 0;
  return rate * quantity;  // Return type: number
}

const totalPrice = calculateMSP("Gehun", 100);
// totalPrice ka type automatically number hai
console.log(`Total MSP: Rs. ${totalPrice}`);  // Rs. 227500
```

### Arrow Functions with Types

```typescript
// Arrow function mein bhi same tarika
const getGreeting = (kisanNaam: string): string => {
  return `Namaste ${kisanNaam}ji! KisanMart mein swagat hai.`;
};

// Short form — single expression
const double = (n: number): number => n * 2;

// Void return — kuch return nahi karta
const logOrder = (orderId: string): void => {
  console.log(`Order ${orderId} placed successfully`);
  // Koi return nahi — void
};
```

### Optional aur Default Parameters

```typescript
// Optional parameter — ? lagao
function createKisan(
  naam: string,
  gaon: string,
  phone?: string,          // Optional — dena zaroori nahi
  isOrganic: boolean = false  // Default value
): object {
  return {
    naam,
    gaon,
    phone: phone || "N/A",   // Agar nahi diya toh "N/A"
    isOrganic
  };
}

// Dono valid hain:
const k1 = createKisan("Ramesh", "Sultanpur");
const k2 = createKisan("Suresh", "Bareilly", "9876543210", true);
```

### Function Overloads

```typescript
// Ek function — alag alag input types ke liye alag behavior
function getKisanInfo(id: number): string;
function getKisanInfo(naam: string): string;
function getKisanInfo(value: number | string): string {
  if (typeof value === "number") {
    return `Kisan ID se dhundh rahe: #${value}`;
  }
  return `Kisan naam se dhundh rahe: ${value}`;
}

console.log(getKisanInfo(101));        // "Kisan ID se dhundh rahe: #101"
console.log(getKisanInfo("Ramesh"));   // "Kisan naam se dhundh rahe: Ramesh"
```

> **Yaad Rakho:** Function parameters mein HAMESHA type likho. Return type bhi likho — even agar TypeScript infer kar sakta hai. Ye code ko readable aur safe banata hai.

---

## Type Aliases — Apne Custom Types Banao

Type alias = Kisi bhi type ko ek naam de do.

```typescript
// Simple type alias
type FasalNaam = string;
type Price = number;
type IsAvailable = boolean;

// Object type alias — interface jaisa par different
type Kisan = {
  naam: string;
  gaon: string;
  khetArea: number;
  fasalList: FasalNaam[];
};

// Union type alias — bahut useful
type ID = string | number;

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";

// Function type alias
type PriceCalculator = (quantity: number, rate: number) => number;

const calculateTotal: PriceCalculator = (quantity, rate) => {
  return quantity * rate;
};
```

### Type Alias vs Interface — Kab Kya Use Karein?

```typescript
// INTERFACE — jab object shape define karna ho
// Extend ho sakta hai, merge ho sakta hai
interface User {
  naam: string;
  email: string;
}

interface Admin extends User {  // Extending possible
  role: string;
}

// TYPE ALIAS — jab union, tuple, ya complex types chahiye
// Zyada flexible hai
type Response = "success" | "error" | "loading";  // Union — interface se nahi hoga
type Coordinate = [number, number];                 // Tuple
type Callback = (data: any) => void;                // Function type
```

> **Tip:** General rule: Objects ke liye **Interface** use karo, baaki sab ke liye **Type Alias**. Dono kaam karte hain par ye convention follow karo.

---

## Type Narrowing — TypeScript Ko Hint Do

Type narrowing matlab TypeScript ko batana ki is point pe variable ka type kya hai.

### typeof Guard

```typescript
function processInput(input: string | number): string {
  // Yahan TypeScript ko nahi pata — string hai ya number?
  
  if (typeof input === "string") {
    // Ab TypeScript jaanta hai — ye string hai!
    return input.toUpperCase();   // String methods available
  }
  
  // Yahan TypeScript jaanta hai — ye number hai!
  return input.toFixed(2);        // Number methods available
}

console.log(processInput("gehun"));   // "GEHUN"
console.log(processInput(2500.5));    // "2500.50"
```

### in Operator Guard

```typescript
interface Farmer {
  naam: string;
  khetArea: number;
}

interface Trader {
  naam: string;
  shopName: string;
}

function getInfo(person: Farmer | Trader): string {
  if ("khetArea" in person) {
    // TypeScript jaanta hai — ye Farmer hai
    return `Farmer: ${person.naam}, Khet: ${person.khetArea} acre`;
  }
  // TypeScript jaanta hai — ye Trader hai
  return `Trader: ${person.naam}, Shop: ${person.shopName}`;
}
```

### instanceof Guard

```typescript
class CropError extends Error {
  cropName: string;
  constructor(message: string, cropName: string) {
    super(message);
    this.cropName = cropName;
  }
}

class PriceError extends Error {
  currentPrice: number;
  constructor(message: string, price: number) {
    super(message);
    this.currentPrice = price;
  }
}

function handleError(error: CropError | PriceError): string {
  if (error instanceof CropError) {
    return `Crop issue: ${error.cropName} — ${error.message}`;
  }
  return `Price issue: Rs. ${error.currentPrice} — ${error.message}`;
}
```

### Discriminated Unions — Best Pattern

```typescript
// Har type mein ek common "discriminator" field rakho
interface SuccessResponse {
  status: "success";        // Literal type — discriminator
  data: any;
  message: string;
}

interface ErrorResponse {
  status: "error";          // Literal type — discriminator
  error: string;
  code: number;
}

type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: ApiResponse): void {
  switch (response.status) {
    case "success":
      // TypeScript jaanta hai — SuccessResponse hai
      console.log(`Data: ${response.data}`);
      console.log(`Message: ${response.message}`);
      break;
    case "error":
      // TypeScript jaanta hai — ErrorResponse hai
      console.log(`Error ${response.code}: ${response.error}`);
      break;
  }
}

// Usage
handleResponse({ status: "success", data: { id: 1 }, message: "Kisan found" });
handleResponse({ status: "error", error: "Not found", code: 404 });
```

> **Socho Aise:** Type narrowing aise hai jaise manddi mein fasal check karna. Pehle dekhte ho "ye gehun hai ya chawal?" — phir uske hisaab se rate decide karte ho. TypeScript bhi pehle check karta hai type, phir uske methods allow karta hai.

---

## Literal Types

```typescript
// Exact values as types — bahut powerful
type Direction = "north" | "south" | "east" | "west";
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

let method: HttpMethod = "GET";     // Valid
// method = "PATCH";                 // ERROR! Allowed nahi hai

let roll: DiceRoll = 4;             // Valid
// roll = 7;                         // ERROR! 7 allowed nahi hai

// Real use case — API routes
function handleRoute(method: HttpMethod, path: string): string {
  return `${method} ${path}`;
}
```

---

## Practical Exercise: Kisan App Types

```typescript
// Poore din ka combined example
type ID = string | number;

enum FasalType {
  Kharif = "KHARIF",
  Rabi = "RABI",
  Zaid = "ZAID"
}

interface Address {
  gaon: string;
  district: string;
  state: string;
}

interface Kisan {
  readonly id: ID;
  naam: string;
  phone: string;
  address: Address;
  fasalType: FasalType;
  isVerified: boolean;
  rating?: number;       // Optional
}

// Function — Kisan create karo
function createKisan(
  naam: string,
  phone: string,
  address: Address,
  fasalType: FasalType
): Kisan {
  return {
    id: `KSN-${Date.now()}`,
    naam,
    phone,
    address,
    fasalType,
    isVerified: false
  };
}

// Usage
const newKisan = createKisan(
  "Ramesh Kumar",
  "9876543210",
  { gaon: "Sultanpur", district: "Sultanpur", state: "UP" },
  FasalType.Rabi
);

console.log(newKisan);
```

> **Expected Output:**
```
{
  id: "KSN-1712345678901",
  naam: "Ramesh Kumar",
  phone: "9876543210",
  address: { gaon: "Sultanpur", district: "Sultanpur", state: "UP" },
  fasalType: "RABI",
  isVerified: false
}
```

---

## Quick Revision Table

| Concept | Kya Karta Hai | Example |
|---------|--------------|---------|
| Function types | Parameters + return type define | `(x: number): string` |
| Optional param | `?` se optional | `phone?: string` |
| Default param | Default value de do | `isActive = true` |
| Type Alias | Custom type banao | `type ID = string \| number` |
| Literal Type | Exact values only | `"GET" \| "POST"` |
| typeof guard | Runtime type check | `typeof x === "string"` |
| in guard | Property check | `"khet" in person` |
| instanceof | Class instance check | `error instanceof CropError` |
| Discriminated Union | Common field se identify | `status: "success" \| "error"` |

---

## Aaj Kya Seekha?

1. **Function types** — parameters aur return dono mein types lagao
2. **Type Aliases** — `type` keyword se custom types banao
3. **Type vs Interface** — objects ke liye interface, baaki ke liye type
4. **Type Narrowing** — typeof, in, instanceof se type check karo
5. **Discriminated Unions** — common field se different types identify karo
6. **Literal Types** — exact values as types — "GET" | "POST"

> **Practice Time!** Ek `Product` type alias banao with literal type `category: "grain" | "vegetable" | "fruit"` aur ek function likho jo category ke hisaab se discount calculate kare using type narrowing!
