# Day 93 Morning: TypeScript Advanced — Generics

> **Aaj ka plan:** Aaj hum TypeScript ka sabse powerful feature seekhenge — **Generics**! Generics aise hain jaise ek universal dabba jo kisi bhi cheez ko rakh sakta hai, par ek baar decide karo ki kya rakhna hai toh wahi chalega. Farmer ke godown mein alag alag fasal ke liye alag compartment — par structure same!

---

## Generics Kya Hain?

Generic = "Type ka placeholder". Function ya class likhte waqt type fix nahi karte — use karte waqt decide karte hain.

### Problem Without Generics

```typescript
// Bina generic ke — har type ke liye alag function likhna padta
function getFirstString(arr: string[]): string {
  return arr[0];
}

function getFirstNumber(arr: number[]): number {
  return arr[0];
}

// Ye toh bekaar hai — same logic, alag alag functions!
```

### Solution With Generics

```typescript
// Generic function — T ek placeholder hai type ka
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

// Ab kisi bhi type ke saath use karo!
const firstFasal = getFirst<string>(["Gehun", "Chawal", "Makka"]);
// firstFasal ka type: string

const firstPrice = getFirst<number>([2500, 3000, 1800]);
// firstPrice ka type: number

// TypeScript khud bhi samajh leta hai (inference)
const firstBool = getFirst([true, false, true]);
// firstBool ka type: boolean — auto inferred!
```

> **Socho Aise:** Generic aise hai jaise manddi ka weighing machine — gehun bhi tol sakta hai, chawal bhi, makka bhi. Machine same hai, par jo daalo uska weight aata hai. `T` = "jo bhi daalo".

---

## Generic Functions — Deep Dive

### Multiple Type Parameters

```typescript
// Do alag types — T aur U
function makePair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const pair1 = makePair<string, number>("Gehun", 2500);
// Type: [string, number]

const pair2 = makePair<number, boolean>(101, true);
// Type: [number, boolean]

// Real example — key-value pair
function createEntry<K, V>(key: K, value: V): { key: K; value: V } {
  return { key, value };
}

const entry = createEntry("fasalNaam", "Gehun");
// { key: string, value: string }
```

### Generic Constraints — T Ko Limit Karo

```typescript
// T kuch bhi nahi ho sakta — sirf wo jo "length" property rakhta ho
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): void {
  console.log(`Length: ${item.length}`);
}

logLength("Gehun");           // String mein length hai — OK
logLength([1, 2, 3]);         // Array mein length hai — OK
logLength({ length: 10 });    // Object mein length hai — OK
// logLength(42);             // ERROR! Number mein length nahi hai
```

### keyof Constraint

```typescript
// Object ki keys ko constraint ke roop mein use karo
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const kisan = {
  naam: "Ramesh",
  gaon: "Sultanpur",
  khetArea: 5.5
};

const naam = getProperty(kisan, "naam");     // Type: string
const area = getProperty(kisan, "khetArea"); // Type: number
// getProperty(kisan, "age");                // ERROR! "age" key nahi hai
```

> **Yaad Rakho:** `extends` generic mein "inherits" nahi matlab — "ye condition match honi chahiye" matlab hai. `T extends HasLength` = "T ke paas length property honi chahiye".

---

## Generic Interfaces

```typescript
// API Response — kisi bhi data type ke saath kaam kare
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Kisan list response
const kisanResponse: ApiResponse<string[]> = {
  success: true,
  message: "Kisans mil gaye",
  data: ["Ramesh", "Suresh", "Mohan"],
  timestamp: new Date().toISOString()
};

// Single kisan response
interface Kisan {
  naam: string;
  gaon: string;
}

const singleResponse: ApiResponse<Kisan> = {
  success: true,
  message: "Kisan mila",
  data: { naam: "Ramesh", gaon: "Sultanpur" },
  timestamp: new Date().toISOString()
};

// Paginated response — generic ke andar generic
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const paginatedKisans: PaginatedResponse<Kisan> = {
  success: true,
  data: [
    { naam: "Ramesh", gaon: "Sultanpur" },
    { naam: "Suresh", gaon: "Bareilly" }
  ],
  pagination: { page: 1, limit: 10, total: 50 }
};
```

---

## Generic Classes

```typescript
// Generic collection — kisi bhi type ke items store karo
class Collection<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getById(index: number): T | undefined {
    return this.items[index];
  }

  getAll(): T[] {
    return [...this.items]; // Copy return karo — original safe rahe
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  count(): number {
    return this.items.length;
  }
}

// Kisan collection
interface Kisan {
  id: number;
  naam: string;
  isOrganic: boolean;
}

const kisanCollection = new Collection<Kisan>();
kisanCollection.add({ id: 1, naam: "Ramesh", isOrganic: true });
kisanCollection.add({ id: 2, naam: "Suresh", isOrganic: false });
kisanCollection.add({ id: 3, naam: "Mohan", isOrganic: true });

// Type-safe filtering
const organicKisans = kisanCollection.filter(k => k.isOrganic);
console.log(organicKisans);
// [{ id: 1, naam: "Ramesh", isOrganic: true }, { id: 3, naam: "Mohan", isOrganic: true }]

// Product collection — same class, different type
interface Product {
  id: number;
  name: string;
  price: number;
}

const productCollection = new Collection<Product>();
productCollection.add({ id: 1, name: "Gehun", price: 2500 });
```

> **Socho Aise:** `Collection<T>` aise hai jaise ek standard godown — chahe gehun bharo ya chawal, structure same hai (rack, section, numbering). `T` decide karta hai ki andar kya jayega.

---

## Generic with Default Types

```typescript
// Default type — agar specify nahi kiya toh ye use hoga
interface FetchOptions<T = any> {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: T;
  headers?: Record<string, string>;
}

// Bina type specify kiye — T = any
const getRequest: FetchOptions = {
  url: "/api/kisans",
  method: "GET"
};

// Type specify karke — T = CreateKisanBody
interface CreateKisanBody {
  naam: string;
  phone: string;
}

const postRequest: FetchOptions<CreateKisanBody> = {
  url: "/api/kisans",
  method: "POST",
  body: { naam: "Ramesh", phone: "9876543210" }
};
```

---

## Practical: Generic Repository Pattern

```typescript
// Database operations ka generic pattern
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

class Repository<T extends BaseEntity> {
  private collection: T[] = [];
  private collectionName: string;

  constructor(name: string) {
    this.collectionName = name;
  }

  create(item: Omit<T, "id" | "createdAt" | "updatedAt"> & Partial<BaseEntity>): T {
    const newItem = {
      ...item,
      id: `${this.collectionName}-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    } as T;
    this.collection.push(newItem);
    return newItem;
  }

  findById(id: string): T | undefined {
    return this.collection.find(item => item.id === id);
  }

  findAll(): T[] {
    return [...this.collection];
  }

  delete(id: string): boolean {
    const index = this.collection.findIndex(item => item.id === id);
    if (index === -1) return false;
    this.collection.splice(index, 1);
    return true;
  }
}

// Usage — har entity ke liye same Repository
interface Kisan extends BaseEntity {
  naam: string;
  gaon: string;
}

interface Product extends BaseEntity {
  name: string;
  price: number;
}

const kisanRepo = new Repository<Kisan>("kisan");
const productRepo = new Repository<Product>("product");

// Type-safe hai — galat field nahi de sakte
kisanRepo.create({ naam: "Ramesh", gaon: "Sultanpur" });
productRepo.create({ name: "Gehun", price: 2500 });
```

---

## Quick Revision Table

| Concept | Syntax | Use Case |
|---------|--------|----------|
| Basic Generic | `function fn<T>(x: T): T` | Reusable typed functions |
| Multiple Types | `<T, U>` | Pairs, maps, transforms |
| Constraint | `<T extends Interface>` | T ko limit karo |
| keyof | `<K extends keyof T>` | Object keys as types |
| Generic Interface | `interface Box<T> { data: T }` | Typed data structures |
| Generic Class | `class Store<T> {}` | Typed collections |
| Default Type | `<T = string>` | Fallback type |

---

## Aaj Kya Seekha?

1. **Generics** — type ka placeholder jo use karte waqt decide hota hai
2. **Generic functions** — ek function, multiple types ke saath kaam kare
3. **Constraints** — `extends` se generic ko limit karo
4. **keyof** — object ki keys ko type ke roop mein use karo
5. **Generic interfaces** — ApiResponse<T> jaisa reusable structure
6. **Generic classes** — Collection<T>, Repository<T> patterns

> **Practice Time!** Evening mein Utility Types seekhenge — Partial, Pick, Omit, Record aur bahut kuch! Abhi ek `Stack<T>` generic class banao with push, pop, peek methods.
