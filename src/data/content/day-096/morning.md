# Day 96 Morning: TypeScript Best Practices — Strict Mode & tsconfig Mastery

> **Aaj ka plan:** Aaj hum TypeScript ko professional level pe configure karenge. Strict mode, tsconfig ke important options, utility types patterns — sab seekhenge! Jaise manddi mein quality control hota hai — waise TypeScript mein strict mode tumhara code quality control hai!

---

## Strict Mode — Kyon Zaroori Hai?

```typescript
// Bina strict mode ke — ye sab chalta hai (BAD!)
let naam;             // type: any (chupke se!)
naam = "Ramu";
naam = 42;            // Koi error nahi!
naam = null;          // Koi error nahi!

// Strict mode ON karo — TypeScript sab pakad lega
// tsconfig.json mein: "strict": true
```

> **Socho Aise:** Strict mode bina TypeScript aise hai jaise manddi mein bina weight machine ke — koi bhi bol de "5 kilo hai" aur koi check nahi! Strict mode ON matlab har cheez tuli hui.

---

## tsconfig.json — Complete Professional Setup

```json
{
  "compilerOptions": {
    // ========== STRICT OPTIONS ==========
    "strict": true,                    // Sab strict flags ON
    "noImplicitAny": true,             // any silently nahi aayega
    "strictNullChecks": true,          // null/undefined alag handle
    "strictFunctionTypes": true,       // Function params strict check
    "strictBindCallApply": true,       // bind/call/apply typed
    "strictPropertyInitialization": true, // Class properties init zaroori
    "noImplicitThis": true,            // this ka type pata hona chahiye
    "alwaysStrict": true,              // "use strict" har file mein

    // ========== EXTRA CHECKS ==========
    "noUnusedLocals": true,            // Unused variable = error
    "noUnusedParameters": true,        // Unused param = error
    "noImplicitReturns": true,         // Har path pe return zaroori
    "noFallthroughCasesInSwitch": true,// switch mein break zaroori
    "noUncheckedIndexedAccess": true,  // array[0] = T | undefined
    "exactOptionalPropertyTypes": true,// optional vs undefined alag

    // ========== MODULE & TARGET ==========
    "target": "ES2022",               // Modern JS output
    "module": "NodeNext",             // Node.js ESM support
    "moduleResolution": "NodeNext",   // Node.js module resolution
    "esModuleInterop": true,          // CommonJS imports easy
    "resolveJsonModule": true,        // JSON import allow

    // ========== OUTPUT ==========
    "outDir": "./dist",               // Compiled JS yahan jayega
    "rootDir": "./src",               // Source code yahan hai
    "declaration": true,              // .d.ts files generate
    "declarationMap": true,           // Declaration source maps
    "sourceMap": true,                // Debugging ke liye

    // ========== PATH ALIASES ==========
    "baseUrl": "./src",
    "paths": {
      "@models/*": ["models/*"],
      "@routes/*": ["routes/*"],
      "@utils/*": ["utils/*"],
      "@config/*": ["config/*"],
      "@middleware/*": ["middleware/*"]
    },

    // ========== OTHER ==========
    "skipLibCheck": true,             // node_modules types skip
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

> **Yaad Rakho:** `"strict": true` akela 8 strict flags ON karta hai. Agar tum individually flags likhte ho toh `strict: true` redundant ho jaata hai — lekin dono rakhna best practice hai for clarity.

---

## noUncheckedIndexedAccess — Hidden Gem

```typescript
// Bina noUncheckedIndexedAccess:
const fasalList: string[] = ["Gehun", "Chawal", "Makka"];
const pehli = fasalList[0]; // Type: string (guaranteed lage)
const dasvi = fasalList[9]; // Type: string (WRONG! undefined hoga)

// noUncheckedIndexedAccess: true ke saath:
const pehli2 = fasalList[0]; // Type: string | undefined
// Ab tum FORCE ho check karne ke liye:
if (pehli2) {
  console.log(pehli2.toUpperCase()); // Safe!
}

// Record access bhi safe:
const prices: Record<string, number> = { gehun: 2500 };
const gehunPrice = prices["gehun"]; // Type: number | undefined
```

> **Tip:** `noUncheckedIndexedAccess` production code mein ON rakho. Ye bohot saare runtime errors pakad leta hai compile time pe!

---

## Utility Types — Professional Patterns

```typescript
// ========== REAL WORLD UTILITY TYPE PATTERNS ==========

interface Kisan {
  id: string;
  naam: string;
  phone: string;
  email: string;
  password: string;
  gaon: string;
  state: string;
  khetArea: number;
  isVerified: boolean;
  createdAt: Date;
}

// 1. CreateDTO — id aur timestamps hata do
type CreateKisanDTO = Omit<Kisan, "id" | "createdAt" | "isVerified">;

// 2. UpdateDTO — sab optional except id
type UpdateKisanDTO = Partial<Omit<Kisan, "id" | "createdAt">> & { id: string };

// 3. PublicProfile — password hata do
type KisanPublicProfile = Omit<Kisan, "password">;

// 4. LoginDTO — sirf email + password
type LoginDTO = Pick<Kisan, "email" | "password">;

// 5. SearchFilters — kuch fields optional
type KisanSearchFilters = Partial<Pick<Kisan, "state" | "gaon" | "isVerified">>;

// 6. ReadOnly response — koi modify nahi kar sakta
type KisanResponse = Readonly<KisanPublicProfile>;

// 7. Required — optional ko required banao
type StrictKisan = Required<Kisan>;
```

> **Socho Aise:** Utility types aise hain jaise ek hi fasal se alag-alag products banao — gehun se atta, maida, suji, daliya. Ek interface se multiple DTOs!

---

## Discriminated Unions — Type-Safe Events

```typescript
// Event system jahan har event ka apna data hai
type AppEvent =
  | { type: "KISAN_REGISTERED"; data: { kisanId: string; naam: string } }
  | { type: "ORDER_PLACED"; data: { orderId: string; amount: number } }
  | { type: "PAYMENT_DONE"; data: { paymentId: string; method: "UPI" | "CARD" } }
  | { type: "FASAL_LISTED"; data: { fasalId: string; category: string } };

// TypeScript automatically narrow karega!
function handleEvent(event: AppEvent): void {
  switch (event.type) {
    case "KISAN_REGISTERED":
      // event.data mein kisanId, naam available — TypeScript jaanta hai!
      console.log(`Naya kisan: ${event.data.naam}`);
      break;
    case "ORDER_PLACED":
      // event.data mein orderId, amount — auto typed!
      console.log(`Order: Rs ${event.data.amount}`);
      break;
    case "PAYMENT_DONE":
      console.log(`Payment via ${event.data.method}`);
      break;
    case "FASAL_LISTED":
      console.log(`Fasal listed: ${event.data.category}`);
      break;
    default:
      // Exhaustive check — agar naya event add karo toh yahan error
      const _never: never = event;
      throw new Error(`Unknown event: ${_never}`);
  }
}
```

> **Warning:** `never` type ka use exhaustive check ke liye karo. Agar koi naya event type add karo aur switch mein handle na karo — TypeScript compile time pe error dega!

---

## Custom Utility Types — Advanced

```typescript
// Apne khud ke utility types banao!

// 1. DeepPartial — nested objects bhi optional
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 2. NonNullableFields — sab fields required + non-null
type NonNullableFields<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

// 3. PickByType — sirf string fields nikalo
type PickByType<T, ValueType> = {
  [P in keyof T as T[P] extends ValueType ? P : never]: T[P];
};

// Usage:
type KisanStringFields = PickByType<Kisan, string>;
// Result: { id: string; naam: string; phone: string; email: string; ... }

// 4. ApiResponse wrapper
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
  timestamp: Date;
};

type KisanListResponse = ApiResponse<KisanPublicProfile[]>;
type SingleKisanResponse = ApiResponse<KisanPublicProfile>;
```

---

## Quick Revision Table

| Config Option | Kya Karta Hai | Default |
|---------------|--------------|---------|
| `strict: true` | Sab strict flags ON | `false` |
| `noImplicitAny` | Hidden any pakdo | Part of strict |
| `strictNullChecks` | null/undefined alag | Part of strict |
| `noUnusedLocals` | Unused vars = error | `false` |
| `noUncheckedIndexedAccess` | Array access safe | `false` |
| `exactOptionalPropertyTypes` | Optional strict | `false` |
| `Partial<T>` | Sab fields optional | Utility type |
| `Pick<T, K>` | Selected fields | Utility type |
| `Omit<T, K>` | Fields hata do | Utility type |
| `Readonly<T>` | Immutable banao | Utility type |

---

## Aaj Kya Seekha?

1. **Strict mode** — `"strict": true` se 8 important checks ON hote hain
2. **tsconfig mastery** — professional tsconfig setup with path aliases
3. **noUncheckedIndexedAccess** — array/object access safe banata hai
4. **Utility types** — Partial, Pick, Omit, Readonly se DTOs banao
5. **Discriminated unions** — type-safe event handling with exhaustive check
6. **Custom utility types** — DeepPartial, PickByType, ApiResponse wrapper

> **Practice Time!** Evening mein ESLint + Prettier setup karenge TypeScript ke saath. Abhi apne project ka tsconfig.json update karo strict mode ke saath!
