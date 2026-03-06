# Day 99 Evening: Apollo Server — Context for Auth & Advanced Error Handling

> **Aaj ka plan:** Morning mein basic Apollo Server + CRUD resolvers banaye. Ab evening mein **context** setup karenge authentication ke liye — JWT token verify, user identify, aur protected resolvers! Plus advanced error handling patterns. Jaise manddi mein entry ke liye ID card check hota hai — waise GraphQL mein context se auth!

---

## Context Kya Hai?

```
Context = Shared data jo EVERY resolver ko milta hai

REST mein:
- req.user set karte the middleware se
- Har route handler mein req.user available

GraphQL mein:
- context function har request pe run hota hai
- Return value sab resolvers ko 3rd argument mein milti hai
- Auth, database connections, user info — sab context mein
```

> **Socho Aise:** Context jaise manddi ka gate hai — andar aane se pehle tumhara ID check hota hai, aur phir andar har dukaan pe tumhara naam pata hota hai. Ek baar verify — sab jagah access!

---

## Step 1: Context Type Define Karo

```typescript
// src/context.ts
import { Request } from "express";
import { IKisanDocument } from "./models/Kisan";

// Context interface — har resolver ko ye milega
export interface IContext {
  user: IKisanDocument | null; // Logged in kisan (ya null agar guest)
  isAuthenticated: boolean;
  token: string | null;
}

// Context builder function — har request pe chalti hai
export async function buildContext({ req }: { req: Request }): Promise<IContext> {
  // Default context — unauthenticated
  const context: IContext = {
    user: null,
    isAuthenticated: false,
    token: null,
  };

  try {
    // Authorization header se token nikalo
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return context; // No token — guest user
    }

    const token = authHeader.split(" ")[1];
    if (!token) return context;

    context.token = token;

    // JWT verify karo
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "rahasia") as {
      id: string;
    };

    // User database se lao
    const Kisan = (await import("./models/Kisan")).default;
    const user = await Kisan.findById(decoded.id);

    if (user) {
      context.user = user;
      context.isAuthenticated = true;
    }
  } catch (error) {
    // Token invalid — silently ignore, guest rahega
    console.warn("Auth context error:", error);
  }

  return context;
}
```

> **Yaad Rakho:** Context function mein error throw mat karo! Agar token invalid hai toh user null rehne do. Individual resolvers decide karenge ki auth zaroori hai ya nahi.

---

## Step 2: Server Mein Context Lagao

```typescript
// src/index.ts — Updated with context
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { IContext, buildContext } from "./context";

dotenv.config();

async function startServer(): Promise<void> {
  const app = express();

  // Apollo Server — context type specify karo
  const server = new ApolloServer<IContext>({
    typeDefs,
    resolvers,
    introspection: true,

    // Custom error formatting
    formatError: (formattedError, error) => {
      // Production mein internal errors hide karo
      if (process.env.NODE_ENV === "production") {
        // Internal server errors ka message generic banao
        if (formattedError.extensions?.code === "INTERNAL_SERVER_ERROR") {
          return {
            ...formattedError,
            message: "Kuch gadbad ho gayi, thodi der baad try karo!",
          };
        }
      }

      // Development mein full error dikhao
      return formattedError;
    },
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      // HAR request pe context build hoga
      context: buildContext,
    }),
  );

  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kisan-graphql";
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected!");

  const PORT = parseInt(process.env.PORT || "4000", 10);
  app.listen(PORT, () => {
    console.log(`GraphQL server: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
```

---

## Step 3: Auth Helper — Protected Resolvers

```typescript
// src/utils/auth.ts
import { GraphQLError } from "graphql";
import { IContext } from "../context";

// Auth check — resolver mein use karo
export function requireAuth(context: IContext): void {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError("Pehle login karo! Authentication zaroori hai.", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }
}

// Verified kisan check
export function requireVerified(context: IContext): void {
  requireAuth(context); // Pehle auth check
  if (!context.user?.isVerified) {
    throw new GraphQLError("Aapka account abhi verified nahi hai.", {
      extensions: {
        code: "FORBIDDEN",
        http: { status: 403 },
      },
    });
  }
}

// Owner check — sirf apna data edit kar sakte ho
export function requireOwner(context: IContext, resourceOwnerId: string): void {
  requireAuth(context);
  if (context.user?.id !== resourceOwnerId) {
    throw new GraphQLError("Ye aapka resource nahi hai — access denied!", {
      extensions: {
        code: "FORBIDDEN",
        http: { status: 403 },
      },
    });
  }
}
```

---

## Step 4: Resolvers with Auth

```typescript
// src/graphql/resolvers.ts — Auth wale resolvers
import { GraphQLError } from "graphql";
import Kisan, { IKisanDocument } from "../models/Kisan";
import Fasal, { IFasalDocument } from "../models/Fasal";
import { IContext } from "../context";
import { requireAuth, requireVerified, requireOwner } from "../utils/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const resolvers = {
  Query: {
    // PUBLIC — koi bhi dekh sakta hai
    kisans: async (
      _: unknown,
      args: { state?: string; limit?: number; offset?: number },
    ): Promise<IKisanDocument[]> => {
      const filter: Record<string, unknown> = { isVerified: true };
      if (args.state) filter.state = args.state;
      return Kisan.find(filter)
        .sort({ createdAt: -1 })
        .skip(args.offset || 0)
        .limit(args.limit || 20);
    },

    // PROTECTED — sirf logged in user apna profile dekhe
    me: async (
      _: unknown,
      __: unknown,
      context: IContext,
    ): Promise<IKisanDocument> => {
      requireAuth(context);      // Auth check!
      return context.user!;      // ! safe hai kyunki requireAuth check karta hai
    },

    // PROTECTED — apni fasals dekho
    myFasals: async (
      _: unknown,
      __: unknown,
      context: IContext,
    ): Promise<IFasalDocument[]> => {
      requireAuth(context);
      return Fasal.find({ kisanId: context.user!.id });
    },
  },

  Mutation: {
    // PUBLIC — register karo (login ke liye)
    register: async (
      _: unknown,
      args: { input: { naam: string; phone: string; email?: string; password: string; gaon: string; state: string; khetArea: number } },
    ): Promise<{ token: string; kisan: IKisanDocument }> => {
      // Duplicate check
      const existing = await Kisan.findOne({ phone: args.input.phone });
      if (existing) {
        throw new GraphQLError("Phone number pehle se registered hai!", {
          extensions: { code: "DUPLICATE_ENTRY" },
        });
      }

      // Password hash karo
      const hashedPassword = await bcrypt.hash(args.input.password, 12);

      const kisan = await Kisan.create({
        ...args.input,
        password: hashedPassword,
      });

      // JWT token banao
      const token = jwt.sign(
        { id: kisan.id },
        process.env.JWT_SECRET || "rahasia",
        { expiresIn: "7d" },
      );

      return { token, kisan };
    },

    // PUBLIC — login karo
    login: async (
      _: unknown,
      args: { phone: string; password: string },
    ): Promise<{ token: string; kisan: IKisanDocument }> => {
      const kisan = await Kisan.findOne({ phone: args.phone }).select("+password");
      if (!kisan) {
        throw new GraphQLError("Phone number ya password galat hai!", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const isValid = await bcrypt.compare(args.password, kisan.password);
      if (!isValid) {
        throw new GraphQLError("Phone number ya password galat hai!", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const token = jwt.sign(
        { id: kisan.id },
        process.env.JWT_SECRET || "rahasia",
        { expiresIn: "7d" },
      );

      return { token, kisan };
    },

    // PROTECTED — sirf apni fasal add karo
    createFasal: async (
      _: unknown,
      args: { input: { naam: string; category: string; pricePerKg: number; quantityKg: number } },
      context: IContext,
    ): Promise<IFasalDocument> => {
      requireVerified(context); // Verified kisan hi fasal add kar sakta hai

      return Fasal.create({
        ...args.input,
        kisanId: context.user!.id, // Logged in user ki fasal
      });
    },

    // PROTECTED — sirf apni fasal delete karo
    deleteFasal: async (
      _: unknown,
      args: { id: string },
      context: IContext,
    ): Promise<boolean> => {
      requireAuth(context);

      const fasal = await Fasal.findById(args.id);
      if (!fasal) {
        throw new GraphQLError("Fasal nahi mili!", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Owner check — sirf apni fasal delete kar sakte ho
      requireOwner(context, fasal.kisanId.toString());

      await fasal.deleteOne();
      return true;
    },
  },

  // Nested resolvers same rahenge
  Kisan: {
    fasals: async (parent: IKisanDocument): Promise<IFasalDocument[]> => {
      return Fasal.find({ kisanId: parent.id, isAvailable: true });
    },
  },
};
```

> **Tip:** Public queries mein context use mat karo (optional). Protected mein `requireAuth()` call karo. Owner-specific mein `requireOwner()` call karo. Three levels of access!

---

## Updated Schema with Auth Types

```graphql
# typeDefs mein add karo:

type AuthPayload {
  token: String!
  kisan: Kisan!
}

type Query {
  # Public
  kisans(state: String, limit: Int, offset: Int): [Kisan!]!
  kisan(id: ID!): Kisan
  fasals(category: FasalCategory): [Fasal!]!

  # Protected — requires auth
  me: Kisan!
  myFasals: [Fasal!]!
}

type Mutation {
  # Public
  register(input: RegisterInput!): AuthPayload!
  login(phone: String!, password: String!): AuthPayload!

  # Protected
  updateMe(input: UpdateKisanInput!): Kisan!
  createFasal(input: CreateFasalInput!): Fasal!
  deleteFasal(id: ID!): Boolean!
}

input RegisterInput {
  naam: String!
  phone: String!
  email: String
  password: String!
  gaon: String!
  state: String!
  khetArea: Float!
}
```

---

## Advanced Error Handling Patterns

```typescript
// src/utils/errors.ts — Custom GraphQL errors

import { GraphQLError } from "graphql";

// Reusable error classes
export class NotFoundError extends GraphQLError {
  constructor(resource: string) {
    super(`${resource} nahi mila!`, {
      extensions: { code: "NOT_FOUND" },
    });
  }
}

export class DuplicateError extends GraphQLError {
  constructor(field: string) {
    super(`${field} pehle se exist karta hai!`, {
      extensions: { code: "DUPLICATE_ENTRY", field },
    });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message: string, field?: string) {
    super(message, {
      extensions: { code: "VALIDATION_ERROR", field },
    });
  }
}

// Usage in resolvers:
// throw new NotFoundError("Kisan");
// throw new DuplicateError("phone");
// throw new ValidationError("Price 0 se zyada hona chahiye", "pricePerKg");
```

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| Context | Shared data per request | `{ user, isAuthenticated }` |
| buildContext | Context factory function | JWT verify + user fetch |
| requireAuth | Auth guard helper | Throw if not logged in |
| requireOwner | Owner check helper | Throw if not resource owner |
| AuthPayload | Login/Register response | `{ token, kisan }` |
| formatError | Custom error formatting | Hide internals in production |
| GraphQLError | Structured errors | `extensions.code` for type |
| Custom errors | Reusable error classes | `NotFoundError("Kisan")` |

---

## Aaj Kya Seekha?

1. **Context** — per-request shared data for auth, DB, user info
2. **buildContext** — JWT token verify aur user fetch har request pe
3. **Auth helpers** — requireAuth, requireVerified, requireOwner
4. **Protected resolvers** — auth check before data access
5. **Auth mutations** — register + login with JWT tokens
6. **Error classes** — reusable custom GraphQL errors
7. **formatError** — production mein internal errors hide karo

> **Practice Time!** Kal GraphQL Advanced — Subscriptions, Pagination, DataLoader! Aaj auth flow complete karo aur Playground mein login karke protected queries test karo!
