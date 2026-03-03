# Day 93 Evening: TypeScript Advanced — Utility Types

> **Aaj ka plan:** Morning mein Generics seekhe — ab evening mein TypeScript ke built-in **Utility Types** seekhenge. Ye ready-made tools hain jo existing types ko transform karte hain. Jaise farmer ke paas alag alag aujar hote hain — hathoda, daranti, hal — waise TypeScript ke paas Partial, Pick, Omit, Record hain!

---

## Utility Types Kyu Zaroori Hain?

```typescript
// Socho tumhare paas ye interface hai
interface Kisan {
  id: string;
  naam: string;
  phone: string;
  gaon: string;
  khetArea: number;
  isOrganic: boolean;
  rating: number;
}

// Ab update ke liye sab fields optional chahiye — naya interface banao?
// Create ke liye id nahi chahiye — phir se naya interface?
// Display ke liye sirf naam aur gaon chahiye — ek aur?

// NAHI! Utility Types se ek hi interface se sab kaam hoga!
```

---

## Partial<T> — Sab Fields Optional

```typescript
// Partial — har field ko optional (?) bana deta hai
type UpdateKisan = Partial<Kisan>;

// Ye aisa ban gaya:
// {
//   id?: string;
//   naam?: string;
//   phone?: string;
//   gaon?: string;
//   khetArea?: number;
//   isOrganic?: boolean;
//   rating?: number;
// }

// Use case — update mein sirf changed fields bhejo
function updateKisan(id: string, updates: Partial<Kisan>): void {
  console.log(`Kisan ${id} update ho raha hai:`, updates);
  // Sirf jo fields bheje wo update honge
}

updateKisan("K-001", { naam: "Ramesh Kumar", khetArea: 6.0 });
// Sirf naam aur khetArea bheja — baaki nahi chahiye
```

## Required<T> — Sab Fields Required

```typescript
// Required — har optional field ko required bana do
interface KisanInput {
  naam: string;
  phone: string;
  gaon?: string;        // Optional
  khetArea?: number;    // Optional
  isOrganic?: boolean;  // Optional
}

type StrictKisanInput = Required<KisanInput>;
// Ab gaon, khetArea, isOrganic bhi REQUIRED hain!

// const strict: StrictKisanInput = { naam: "Ram", phone: "123" };
// ERROR! gaon, khetArea, isOrganic bhi dena padega
```

---

## Pick<T, Keys> — Sirf Selected Fields Lo

```typescript
// Sirf kuch fields chahiye — Pick use karo
type KisanCard = Pick<Kisan, "naam" | "gaon" | "rating">;

// Ye ban gaya:
// { naam: string; gaon: string; rating: number; }

const card: KisanCard = {
  naam: "Ramesh Kumar",
  gaon: "Sultanpur",
  rating: 4.5
};

// Login credentials ke liye
type LoginInput = Pick<Kisan, "phone">;
// { phone: string }

// Profile display ke liye
type ProfileDisplay = Pick<Kisan, "naam" | "gaon" | "khetArea" | "isOrganic">;
```

## Omit<T, Keys> — Kuch Fields Hatao

```typescript
// Kuch fields nahi chahiye — Omit use karo (Pick ka ulta)
type CreateKisanInput = Omit<Kisan, "id" | "rating" | "createdAt">;

// Kisan se id, rating, createdAt hata diya
// Baaki sab fields rahenge

const newKisan: CreateKisanInput = {
  naam: "Suresh Yadav",
  phone: "9876543210",
  gaon: "Bareilly",
  khetArea: 3.2,
  isOrganic: false
};

// Public response — sensitive fields hatao
type PublicKisan = Omit<Kisan, "phone">;
// Phone number hide — privacy ke liye
```

> **Yaad Rakho:** `Pick` = "sirf ye fields lo", `Omit` = "ye fields hatao, baaki lo". Dono opposite hain — situation ke hisaab se use karo.

---

## Record<Keys, Type> — Dynamic Object Map

```typescript
// Record — keys aur values ka type define karo
type FasalPrice = Record<string, number>;

const prices: FasalPrice = {
  "Gehun": 2500,
  "Chawal": 3000,
  "Makka": 1800,
  "Ganna": 350
};

// Fixed keys ke saath Record
type Season = "kharif" | "rabi" | "zaid";

type SeasonalCrops = Record<Season, string[]>;

const crops: SeasonalCrops = {
  kharif: ["Chawal", "Makka", "Kapas"],
  rabi: ["Gehun", "Sarson", "Chana"],
  zaid: ["Tarbuz", "Kheera", "Moong"]
};

// Permission matrix
type Role = "admin" | "kisan" | "trader";
type Permission = {
  read: boolean;
  write: boolean;
  delete: boolean;
};

const rolePermissions: Record<Role, Permission> = {
  admin: { read: true, write: true, delete: true },
  kisan: { read: true, write: true, delete: false },
  trader: { read: true, write: false, delete: false }
};
```

---

## Readonly<T> — Immutable Banao

```typescript
// Readonly — koi bhi field change nahi kar sakte
type FrozenKisan = Readonly<Kisan>;

const kisan: FrozenKisan = {
  id: "K-001",
  naam: "Ramesh",
  phone: "9876543210",
  gaon: "Sultanpur",
  khetArea: 5.5,
  isOrganic: true,
  rating: 4.5
};

// kisan.naam = "Suresh"; // ERROR! Readonly hai — change nahi hoga

// Config objects ke liye perfect
type AppConfig = Readonly<{
  port: number;
  dbUrl: string;
  jwtSecret: string;
}>;

const config: AppConfig = {
  port: 5000,
  dbUrl: "mongodb://localhost:27017/kisanmart",
  jwtSecret: "super-secret-key"
};
// config.port = 3000; // ERROR! Config change nahi hona chahiye
```

---

## Exclude aur Extract — Union Types Ke Liye

```typescript
// Exclude — union se kuch types hatao
type AllStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

type ActiveStatus = Exclude<AllStatus, "cancelled">;
// "pending" | "confirmed" | "shipped" | "delivered"

type CompletedStatus = Extract<AllStatus, "delivered" | "cancelled">;
// "delivered" | "cancelled"

// Real use case
type AllEvents = "click" | "hover" | "scroll" | "keypress" | "resize";
type MouseEvents = Extract<AllEvents, "click" | "hover">;
// "click" | "hover"
```

## NonNullable<T> — Null/Undefined Hatao

```typescript
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;
// string — null aur undefined hat gaye!

// Function mein use
function processName(name: NonNullable<string | null>): string {
  return name.toUpperCase(); // Safe hai — null nahi aayega
}
```

---

## ReturnType aur Parameters

```typescript
// Function ka return type nikalo
function calculateMSP(fasal: string, quantity: number): { total: number; gst: number } {
  const rate = 2500;
  const total = rate * quantity;
  return { total, gst: total * 0.05 };
}

type MSPResult = ReturnType<typeof calculateMSP>;
// { total: number; gst: number }

// Function ke parameters ka type nikalo
type MSPParams = Parameters<typeof calculateMSP>;
// [fasal: string, quantity: number]
```

---

## Combining Utility Types — Real World

```typescript
// Complete example — Kisan API ke liye
interface Kisan {
  id: string;
  naam: string;
  phone: string;
  email: string;
  gaon: string;
  khetArea: number;
  isOrganic: boolean;
  isVerified: boolean;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Create input — id aur timestamps nahi chahiye
type CreateKisanDTO = Omit<Kisan, "id" | "isVerified" | "rating" | "createdAt" | "updatedAt">;

// Update input — sab optional, aur id change nahi kar sakte
type UpdateKisanDTO = Partial<Omit<Kisan, "id" | "createdAt">>;

// List display — sirf important fields
type KisanListItem = Pick<Kisan, "id" | "naam" | "gaon" | "rating" | "isOrganic">;

// Public profile — phone aur email hidden
type PublicKisan = Omit<Kisan, "phone" | "email">;

// Admin view — sab dikhao, par read-only
type AdminKisanView = Readonly<Kisan>;

// Search filters
type KisanFilters = Partial<Pick<Kisan, "gaon" | "isOrganic" | "isVerified">>;

// Usage
const filters: KisanFilters = { isOrganic: true, gaon: "Sultanpur" };
const listItem: KisanListItem = {
  id: "K-001",
  naam: "Ramesh",
  gaon: "Sultanpur",
  rating: 4.5,
  isOrganic: true
};
```

> **Tip:** DTO = Data Transfer Object. Alag alag operations ke liye alag DTOs banao — Create, Update, List, Detail. Utility types se ye bahut easy hai!

---

## Quick Revision Table

| Utility Type | Kya Karta Hai | Example |
|-------------|--------------|---------|
| `Partial<T>` | Sab fields optional | Update input |
| `Required<T>` | Sab fields required | Strict validation |
| `Pick<T, K>` | Selected fields lo | List display |
| `Omit<T, K>` | Kuch fields hatao | Create input |
| `Record<K, V>` | Key-value map | Price tables |
| `Readonly<T>` | Immutable banao | Config objects |
| `Exclude<U, E>` | Union se hatao | Active statuses |
| `Extract<U, E>` | Union se lo | Mouse events |
| `NonNullable<T>` | Null/undefined hatao | Safe strings |
| `ReturnType<F>` | Return type nikalo | Function results |

---

## Aaj Kya Seekha?

1. **Partial** — update operations ke liye sab optional
2. **Pick/Omit** — fields select ya hatao — list view, create input
3. **Record** — dynamic key-value maps banao
4. **Readonly** — config/constants immutable banao
5. **Exclude/Extract** — union types filter karo
6. **Combining** — utility types ko combine karke powerful DTOs banao

> **Practice Time!** Apne KisanMart project ke liye sabhi DTOs banao — CreateDTO, UpdateDTO, ListItemDTO, PublicDTO, AdminDTO — utility types use karke. Ek base interface se sab derive karo!
