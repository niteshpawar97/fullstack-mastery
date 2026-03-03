# Day 94 Morning: Migrate JS Project to TypeScript — Planning & Setup

> **Aaj ka plan:** Ab tak TypeScript alag se seekha. Aaj REAL challenge — ek existing JavaScript project ko TypeScript mein convert karenge! Ye industry mein bahut common hai — companies purane JS codebase ko TS mein migrate karti hain. Jaise purane ghar ko renovate karna — structure same, par naya look aur safety!

---

## Migration Strategy — Step by Step

### Galat Approach vs Sahi Approach

```
GALAT: Poora project ek saath convert karo
→ Bahut saare errors ek saath
→ Kuch kaam nahi karega
→ Demotivation hoga

SAHI: Dheere dheere convert karo (Incremental Migration)
→ Ek file at a time
→ Project hamesha working rahega
→ Confidence badhega
```

> **Socho Aise:** Jaise purani haveli renovate karte hain — pehle ek kamra, phir doosra. Poora ghar ek saath todke nahi banate — nahi toh rahoge kahan? Same project mein — hamesha working state mein rakho!

---

## Step 1: TypeScript Add Karo (Without Breaking Anything)

> **Terminal Command:**
```bash
# Existing JS project mein jao
cd kisanmart-api

# TypeScript dependencies install karo
npm install typescript ts-node @types/node --save-dev
npm install @types/express @types/mongoose @types/jsonwebtoken --save-dev
npm install @types/bcryptjs @types/cors @types/multer --save-dev

# tsconfig.json generate karo
npx tsc --init
```

### tsconfig.json — Migration Friendly

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    
    "strict": false,                // IMPORTANT: Pehle false rakho!
    "allowJs": true,                // JS files bhi allow hain
    "checkJs": false,               // JS files check mat karo abhi
    
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    
    "noImplicitAny": false,         // Pehle false — baad mein true karenge
    "strictNullChecks": false       // Pehle false — baad mein true karenge
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> **Warning:** Migration mein `strict: false` se shuru karo! Agar strict: true karoge toh 100+ errors aayenge ek saath. Dheere dheere strict options ON karo.

---

## Step 2: File Rename Strategy

### Priority Order — Kya Pehle Convert Karein?

```
1. Types/Interfaces file banao (types/index.ts)         ← PEHLA
2. Config files (database.ts, env config)                ← DOOSRA
3. Utility/Helper functions                              ← TEESRA
4. Models (Mongoose models)                              ← CHAUTHA
5. Middleware (auth, error handler)                       ← PAANCHWA
6. Controllers                                           ← CHHATHA
7. Routes                                                ← SAATWA
8. Entry point (app.ts/server.ts)                        ← AAKHRI
```

### File Rename Karna

```bash
# .js ko .ts mein rename karo — ek ek karke!
# Pehle types file banao (ye nahi tha JS mein)
touch src/types/index.ts

# Config convert karo
mv src/config/database.js src/config/database.ts

# Utility convert karo
mv src/utils/helpers.js src/utils/helpers.ts

# Aur aage ek ek karke...
```

---

## Step 3: Types File Banao

```typescript
// src/types/index.ts — Sab custom types yahan

// ============ ENUMS ============
export enum UserRole {
  Kisan = "kisan",
  Trader = "trader",
  Admin = "admin"
}

export enum OrderStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Shipped = "shipped",
  Delivered = "delivered",
  Cancelled = "cancelled"
}

// ============ INTERFACES ============

// User interface — Mongoose document ke saath
export interface IUser {
  _id: string;
  naam: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Product interface
export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  seller: string; // User ID
  rating: number;
  numReviews: number;
  createdAt: Date;
}

// Order interface
export interface IOrder {
  _id: string;
  buyer: string;
  products: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: IAddress;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: Date;
}

export interface IOrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

// ============ DTOs ============

export type CreateUserDTO = Omit<IUser, "_id" | "isVerified" | "createdAt" | "updatedAt">;
export type UpdateUserDTO = Partial<Omit<IUser, "_id" | "password" | "createdAt">>;
export type LoginDTO = Pick<IUser, "email" | "password">;
export type PublicUserDTO = Omit<IUser, "password">;

// ============ API TYPES ============

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request with user (auth ke baad)
import { Request } from "express";
export interface AuthRequest extends Request {
  user?: {
    id: string;
    naam: string;
    role: UserRole;
    email: string;
  };
}
```

---

## Step 4: Config Files Convert Karo

### database.js → database.ts

```typescript
// PEHLE (JavaScript):
// const mongoose = require("mongoose");
// const connectDB = async () => {
//   const conn = await mongoose.connect(process.env.MONGODB_URI);
//   console.log(`MongoDB connected: ${conn.connection.host}`);
// };

// AB (TypeScript):
// src/config/database.ts
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri: string = process.env.MONGODB_URI || "mongodb://localhost:27017/kisanmart";
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Database error: ${error.message}`);
    }
    process.exit(1);
  }
};

export default connectDB;
```

### Kya Badla?

```
1. require → import
2. Function return type add kiya: Promise<void>
3. process.env ko string type diya with fallback
4. Error handling mein instanceof check
5. module.exports → export default
```

---

## Step 5: Utility Functions Convert Karo

### helpers.js → helpers.ts

```typescript
// PEHLE (JavaScript):
// const generateToken = (userId) => { ... }
// const formatPrice = (price) => { ... }

// AB (TypeScript):
// src/utils/helpers.ts
import jwt from "jsonwebtoken";

// Token generate karo — typed parameters aur return
export const generateToken = (userId: string, role: string): string => {
  const secret: string = process.env.JWT_SECRET || "fallback-secret";
  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn: "7d" }
  );
};

// Price format karo
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(price);
};

// Slug generate karo
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

// Pagination helper
interface PaginationResult {
  skip: number;
  limit: number;
  page: number;
}

export const paginate = (
  page: number = 1,
  limit: number = 10
): PaginationResult => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
    page: safePage
  };
};
```

> **Tip:** Migration mein sabse easy kaam hai utility functions convert karna — ye chhote aur independent hote hain. Inse start karo confidence build hoga!

---

## Common Migration Patterns

### Pattern 1: require → import

```typescript
// JS:
const express = require("express");
const { Router } = require("express");
const mongoose = require("mongoose");

// TS:
import express from "express";
import { Router } from "express";
import mongoose from "mongoose";
```

### Pattern 2: module.exports → export

```typescript
// JS:
module.exports = router;
module.exports = { generateToken, formatPrice };

// TS:
export default router;
export { generateToken, formatPrice };
```

### Pattern 3: Callback Types

```typescript
// JS:
app.get("/", (req, res) => { ... });

// TS:
import { Request, Response } from "express";
app.get("/", (req: Request, res: Response): void => { ... });
```

### Pattern 4: Error Handling

```typescript
// JS:
catch (error) {
  console.log(error.message);
}

// TS:
catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);  // Ab safe hai
  }
}
```

---

## Quick Revision Table

| Migration Step | Kya Karna Hai | Priority |
|---------------|--------------|----------|
| Install TS | `npm install typescript ts-node @types/*` | 1st |
| tsconfig.json | `strict: false`, `allowJs: true` | 1st |
| Types file | Interfaces, enums, DTOs banao | 2nd |
| Config files | database.ts, env config | 3rd |
| Utilities | Helper functions convert | 4th |
| require → import | Module system change | Har file mein |
| exports → export | Export syntax change | Har file mein |
| Add types | Parameters + return types | Har function mein |

---

## Aaj Kya Seekha?

1. **Incremental migration** — ek file at a time, never all at once
2. **tsconfig for migration** — strict: false, allowJs: true se shuru karo
3. **Types file first** — pehle interfaces/enums define karo
4. **Config files** — database, env — chhote aur independent hain
5. **Utility functions** — easiest to convert, confidence builder
6. **Common patterns** — require→import, exports→export, error handling

> **Practice Time!** Evening mein Models, Middleware, aur Controllers convert karenge — wo thoda tricky hai. Abhi apne KisanMart ki types file banao!
