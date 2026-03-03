# Day 95 Evening: TypeScript + Prisma ORM — The Modern Way

> **Aaj ka plan:** Morning mein Mongoose + TypeScript dekha. Ab evening mein **Prisma ORM** — jo TypeScript ke liye specifically bana hai! Prisma mein types auto-generate hote hain — tum schema likho, Prisma types banayega. Jaise architect drawing banaye aur builder khud samajh jaaye!

---

## Prisma Kya Hai?

```
Mongoose:
- Schema JS/TS mein likhte ho
- Types manually define karo
- MongoDB ke liye best

Prisma:
- Schema apni language mein likhte ho (.prisma file)
- Types AUTO-GENERATE hote hain
- PostgreSQL, MySQL, MongoDB — sab support
- TypeScript ka BEST friend
```

> **Socho Aise:** Mongoose mein tum apna ID card khud banate ho. Prisma mein tum sirf photo aur details do — Prisma tumhara ID card automatic bana deta hai, wo bhi laminated!

---

## Prisma Setup

> **Terminal Command:**
```bash
# Prisma install karo
npm install prisma --save-dev
npm install @prisma/client

# Prisma initialize karo (PostgreSQL by default)
npx prisma init

# Ye banayega:
# prisma/schema.prisma — schema file
# .env — DATABASE_URL
```

### .env File

```env
# PostgreSQL connection
DATABASE_URL="postgresql://user:password@localhost:5432/kisanmart?schema=public"

# Ya MongoDB use karna ho toh:
# DATABASE_URL="mongodb://localhost:27017/kisanmart"
```

---

## Prisma Schema — The Heart

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"    // Ya "mongodb"
  url      = env("DATABASE_URL")
}

// ============ MODELS ============

// User model — Kisan, Trader, Admin
model User {
  id          String    @id @default(cuid())
  naam        String
  email       String    @unique
  phone       String    @unique
  password    String
  role        Role      @default(KISAN)
  isVerified  Boolean   @default(false)
  avatar      String?                     // ? = optional
  gaon        String?
  district    String?
  state       String?
  khetArea    Float?                      // Decimal number
  isOrganic   Boolean   @default(false)
  rating      Float     @default(0)

  // Relations — ek user ke kai products ho sakte hain
  products    Product[]
  orders      Order[]   @relation("buyer")
  reviews     Review[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([state, isOrganic])             // Composite index
  @@map("users")                           // Table name
}

// Product model
model Product {
  id          String    @id @default(cuid())
  name        String
  description String
  price       Float
  category    Category
  stock       Int       @default(0)
  images      String[]                     // Array of URLs
  isActive    Boolean   @default(true)
  rating      Float     @default(0)
  numReviews  Int       @default(0)

  // Relations
  seller      User      @relation(fields: [sellerId], references: [id])
  sellerId    String
  orderItems  OrderItem[]
  reviews     Review[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([category, isActive])
  @@map("products")
}

// Order model
model Order {
  id              String      @id @default(cuid())
  status          OrderStatus @default(PENDING)
  totalAmount     Float
  shippingAddress Json                      // JSON field
  paymentMethod   String
  isPaid          Boolean     @default(false)

  buyer           User        @relation("buyer", fields: [buyerId], references: [id])
  buyerId         String
  items           OrderItem[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@map("orders")
}

// OrderItem — Many-to-Many through table
model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Float

  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product @relation(fields: [productId], references: [id])
  productId String

  @@map("order_items")
}

// Review model
model Review {
  id      String @id @default(cuid())
  rating  Int
  comment String

  user      User    @relation(fields: [userId], references: [id])
  userId    String
  product   Product @relation(fields: [productId], references: [id])
  productId String

  createdAt DateTime @default(now())

  @@unique([userId, productId])   // Ek user ek product ka ek hi review
  @@map("reviews")
}

// ============ ENUMS ============

enum Role {
  KISAN
  TRADER
  ADMIN
}

enum Category {
  GRAIN
  VEGETABLE
  FRUIT
  DAIRY
  SPICE
  OTHER
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

> **Yaad Rakho:** Prisma schema `.prisma` file mein likhte hain — ye na JavaScript hai na TypeScript. Ye Prisma ki apni language hai. Isse Prisma Client types auto-generate karta hai.

---

## Prisma Client Generate Karo

> **Terminal Command:**
```bash
# Schema se types generate karo
npx prisma generate

# Database mein tables banao (migration)
npx prisma migrate dev --name init

# Prisma Studio — GUI database browser
npx prisma studio
```

### Auto-Generated Types

```typescript
// Prisma generate ke baad ye types automatically available hain:
// import { User, Product, Order, Role, Category } from "@prisma/client"

// User type — schema se auto-generated
// {
//   id: string
//   naam: string
//   email: string
//   phone: string
//   password: string
//   role: Role
//   isVerified: boolean
//   avatar: string | null
//   ...
// }

// KUCH BHI MANUALLY DEFINE NAHI KARNA!
```

---

## Prisma Client Use Karo

### Database Connection

```typescript
// src/config/prisma.ts
import { PrismaClient } from "@prisma/client";

// Singleton pattern — ek hi instance banao
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"] // Development mein logging
});

export default prisma;
```

### CRUD Operations — Fully Typed!

```typescript
// src/services/user.service.ts
import prisma from "../config/prisma";
import { User, Prisma, Role } from "@prisma/client";

// CREATE — auto-complete milega!
const createUser = async (data: Prisma.UserCreateInput): Promise<User> => {
  const user = await prisma.user.create({
    data: {
      naam: data.naam,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: Role.KISAN
      // TypeScript batayega ki kya kya fields daal sakte ho
    }
  });
  return user;  // Type: User (auto-generated)
};

// FIND MANY — with filters, sorting, pagination
const getKisans = async (
  page: number = 1,
  limit: number = 10,
  state?: string
): Promise<{ users: User[]; total: number }> => {
  const where: Prisma.UserWhereInput = {
    role: Role.KISAN,
    isVerified: true,
    ...(state && { state })   // Optional filter
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { rating: "desc" },
      select: {                      // Sirf ye fields lao
        id: true,
        naam: true,
        gaon: true,
        state: true,
        rating: true,
        isOrganic: true
        // password NAHI — select mein nahi daala
      }
    }),
    prisma.user.count({ where })
  ]);

  return { users, total };
};

// FIND ONE
const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      products: true,   // Related products bhi lao
      orders: true      // Related orders bhi lao
    }
  });
};

// UPDATE
const updateUser = async (
  id: string,
  data: Prisma.UserUpdateInput
): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data    // TypeScript ensure karega valid fields
  });
};

// DELETE
const deleteUser = async (id: string): Promise<User> => {
  return prisma.user.delete({
    where: { id }
  });
};

export { createUser, getKisans, getUserById, updateUser, deleteUser };
```

> **Tip:** Prisma mein `select` (sirf ye fields) aur `include` (relations bhi lao) use karo. Dono saath mein nahi chal sakte — ek choose karo!

---

## Mongoose vs Prisma — Comparison

| Feature | Mongoose | Prisma |
|---------|----------|--------|
| Schema location | JS/TS files mein | .prisma file mein |
| Types | Manual define | Auto-generated |
| Database | MongoDB best | PostgreSQL, MySQL, MongoDB |
| Relations | Manual populate | Auto relations |
| Migrations | Manual | `prisma migrate` |
| GUI | MongoDB Compass | Prisma Studio |
| Learning curve | Medium | Easy with TS |
| Auto-complete | Manual types se | Automatic |

---

## Quick Revision Table

| Concept | Mongoose Way | Prisma Way |
|---------|-------------|------------|
| Schema | JS/TS mein Schema() | .prisma file |
| Types | IUser extends Document | Auto from `@prisma/client` |
| Create | `Model.create(data)` | `prisma.model.create({ data })` |
| Find | `Model.find(query)` | `prisma.model.findMany({ where })` |
| Update | `Model.findByIdAndUpdate()` | `prisma.model.update({ where, data })` |
| Relations | `.populate("field")` | `include: { relation: true }` |
| Migration | Manual scripts | `npx prisma migrate dev` |

---

## Aaj Kya Seekha?

1. **Mongoose + TS** — three-layer interfaces, typed queries, aggregation
2. **Prisma ORM** — schema file se auto-generated types
3. **Prisma setup** — install, init, generate, migrate
4. **Prisma CRUD** — fully typed create, find, update, delete
5. **Select vs Include** — fields choose ya relations include
6. **Mongoose vs Prisma** — dono ke pros/cons samjhe

> **Practice Time!** Prisma schema likho apne project ke liye — User, Product, Order models ke saath. `npx prisma generate` karo aur auto-complete enjoy karo!
