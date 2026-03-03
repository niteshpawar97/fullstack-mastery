# Day 97 Morning: Week 14 Revision — TypeScript Full Recap (REVISION)

> **Aaj ka plan:** Aaj Week 14 ka FULL revision! TypeScript basics se lekar advanced patterns tak — sab ek jagah recap! Jaise exam se pehle poora syllabus ek baar quickly revise karte hain — waise hi aaj sab topics ek baar mein cover karenge. Evening mein Typed Task Manager API banayenge!

---

## TypeScript Journey — Week 14 Overview

```
Day 89: TS Basics — Types, Interfaces, Enums
Day 90: Functions, Generics, Type Guards
Day 91: OOP — Classes, Access Modifiers, Abstract
Day 92: Advanced — Mapped, Conditional, Template Literal
Day 93: Express + TS — Typed Routes, Middleware
Day 94: Zod + TS — Runtime Validation
Day 95: Mongoose + TS, Prisma ORM
Day 96: Best Practices, ESLint, Prettier

Aaj: FULL REVISION + Mini Project!
```

---

## Topic 1: Basic Types Recap

```typescript
// Primitive types
let naam: string = "Ramu Kisan";
let umar: number = 35;
let isVerified: boolean = true;

// Arrays
let fasalList: string[] = ["Gehun", "Chawal", "Makka"];
let prices: Array<number> = [2500, 3000, 1800];

// Tuple — fixed length, mixed types
let kisanInfo: [string, number, boolean] = ["Ramu", 35, true];

// Enum — named constants
enum FasalCategory {
  ANAAJ = "anaaj",
  SABZI = "sabzi",
  PHAL = "phal",
  MASALA = "masala",
}

// Union + Literal types
type PaymentMethod = "UPI" | "CARD" | "CASH" | "BANK_TRANSFER";
type StatusCode = 200 | 201 | 400 | 404 | 500;

// any vs unknown vs never
let kuchBhi: any = "danger";       // AVOID — type checking off
let pataНahi: unknown = "safe";    // SAFE — check zaroori before use
// never — function jo kabhi return nahi karti (throw / infinite loop)
```

> **Yaad Rakho:** `any` = type checking OFF. `unknown` = type checking ON but use se pehle check karo. Production mein hamesha `unknown` prefer karo `any` ki jagah!

---

## Topic 2: Interfaces vs Types

```typescript
// Interface — objects ke liye, extendable
interface IKisan {
  naam: string;
  phone: string;
  state: string;
}

// Extend ho sakta hai
interface IVerifiedKisan extends IKisan {
  isVerified: true;
  verifiedAt: Date;
}

// Type Alias — unions, intersections, utility types
type ApiResult = IKisan | null;
type CreateDTO = Omit<IKisan, "id">;
type KisanOrError = IKisan | { error: string };

// RULE: Objects ke liye Interface, baaki sab ke liye Type
```

---

## Topic 3: Generics Recap

```typescript
// Generic function — kisi bhi type ke saath kaam kare
function wrapInArray<T>(item: T): T[] {
  return [item];
}

// Generic with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic interface
interface IApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Generic class
class Repository<T extends { id: string }> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findById(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  getAll(): T[] {
    return [...this.items]; // Copy return karo, original nahi
  }
}
```

> **Socho Aise:** Generic matlab ek dabba jisme kuch bhi rakh sakte ho — lekin jab ek baar type fix karo, phir wohi type ka saamaan aayega. Jaise ek godown gehun ke liye fix karo toh gehun hi aayega!

---

## Topic 4: Type Guards + Narrowing

```typescript
// typeof guard
function processInput(input: string | number): string {
  if (typeof input === "string") {
    return input.toUpperCase(); // TypeScript jaanta hai: string
  }
  return input.toFixed(2);     // TypeScript jaanta hai: number
}

// in guard
interface ICar { drive(): void; }
interface IBoat { sail(): void; }

function move(vehicle: ICar | IBoat): void {
  if ("drive" in vehicle) {
    vehicle.drive();   // ICar
  } else {
    vehicle.sail();    // IBoat
  }
}

// instanceof guard
function handleError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;  // Error type
  }
  return String(err);
}

// Custom type guard
function isKisan(obj: unknown): obj is IKisan {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "naam" in obj &&
    "phone" in obj
  );
}
```

---

## Topic 5: Utility Types — Quick Reference

```typescript
interface IProduct {
  id: string;
  naam: string;
  price: number;
  category: string;
  inStock: boolean;
}

// Partial — sab optional
type UpdateProduct = Partial<IProduct>;

// Required — sab required
type StrictProduct = Required<IProduct>;

// Pick — selected fields
type ProductCard = Pick<IProduct, "naam" | "price" | "inStock">;

// Omit — fields hata do
type CreateProduct = Omit<IProduct, "id">;

// Record — key-value map
type PriceMap = Record<string, number>;

// Readonly — immutable
type FrozenProduct = Readonly<IProduct>;

// Extract / Exclude — union types filter
type NumericFields = Extract<keyof IProduct, "price">;
type NonIdFields = Exclude<keyof IProduct, "id">;

// ReturnType — function ka return type nikalo
function getProducts(): IProduct[] { return []; }
type ProductList = ReturnType<typeof getProducts>; // IProduct[]
```

---

## Topic 6: Express + TypeScript Pattern

```typescript
// Typed Express route handler
import { Request, Response, NextFunction } from "express";

interface ICreateKisanBody {
  naam: string;
  phone: string;
  state: string;
}

interface IKisanParams {
  id: string;
}

// Typed controller
const createKisan = async (
  req: Request<{}, {}, ICreateKisanBody>,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  const { naam, phone, state } = req.body; // Fully typed!
  // ... create logic
  res.status(201).json({ success: true, data: { naam, phone, state } });
};

const getKisan = async (
  req: Request<IKisanParams>,
  res: Response,
): Promise<void> => {
  const { id } = req.params; // id: string — typed!
  // ... find logic
  res.json({ success: true });
};
```

---

## Topic 7: Zod + TypeScript Combo

```typescript
import { z } from "zod";

// Schema define karo — runtime + compile time dono
const KisanSchema = z.object({
  naam: z.string().min(2, "Naam kam se kam 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian phone number do"),
  state: z.string(),
  khetArea: z.number().positive("Area positive hona chahiye"),
});

// Schema se type nikalo — DRY!
type KisanInput = z.infer<typeof KisanSchema>;
// Result: { naam: string; phone: string; state: string; khetArea: number }

// Validation
const result = KisanSchema.safeParse(requestBody);
if (result.success) {
  const data: KisanInput = result.data; // Typed!
} else {
  console.error(result.error.flatten());
}
```

---

## Quick Revision Table

| Topic | Key Concept | Example |
|-------|------------|---------|
| Basic Types | Primitives, Arrays, Tuples | `string`, `number[]`, `[string, number]` |
| Interfaces | Object shape, extendable | `interface IKisan extends IUser` |
| Types | Unions, intersections | `type Result = Success \| Error` |
| Generics | Reusable typed code | `function wrap<T>(x: T): T[]` |
| Type Guards | Runtime type checking | `typeof`, `in`, `instanceof` |
| Utility Types | Transform types | `Partial`, `Pick`, `Omit` |
| Express + TS | Typed handlers | `Request<Params, {}, Body>` |
| Zod | Runtime validation | `z.infer<typeof Schema>` |
| ESLint | Code quality | `no-explicit-any: "error"` |
| Strict mode | tsconfig strict | `"strict": true` |

---

## Aaj Kya Seekha?

1. **Basic types** — primitives, arrays, tuples, enums, union, literal types
2. **Interfaces vs Types** — interfaces for objects, types for everything else
3. **Generics** — reusable code with type parameters aur constraints
4. **Type guards** — typeof, in, instanceof, custom guards for narrowing
5. **Utility types** — Partial, Pick, Omit, Record, Readonly, ReturnType
6. **Express + TS** — typed Request, Response, middleware chain
7. **Zod** — runtime validation with compile-time type inference

> **Practice Time!** Evening mein Typed Task Manager API banayenge — Express + TypeScript + Mongoose + Zod. Abhi ye sab concepts ek baar aur padh lo aur apne notes update karo!
