# Day 99 Morning: Apollo Server + Express + MongoDB — Setup & CRUD Resolvers

> **Aaj ka plan:** Aaj hum real GraphQL API banayenge! Apollo Server ko Express ke saath integrate karenge, MongoDB connect karenge, Mongoose models banayenge aur CRUD resolvers likhenge. Jaise manddi mein actual dukaan kholna — schema toh bana liya, ab dukaan chalao!

---

## Project Setup

> **Terminal Command:**
```bash
# Naya project banao
mkdir graphql-kisan-api && cd graphql-kisan-api
npm init -y

# Dependencies install karo
npm install @apollo/server express mongoose dotenv graphql graphql-tag
npm install cors

# Dev dependencies
npm install --save-dev typescript ts-node-dev @types/express @types/cors @types/node
npx tsc --init
```

### tsconfig.json — Important Options

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

### Folder Structure

```
graphql-kisan-api/
├── src/
│   ├── models/
│   │   ├── Kisan.ts         # Kisan Mongoose model
│   │   └── Fasal.ts         # Fasal Mongoose model
│   ├── graphql/
│   │   ├── typeDefs.ts      # GraphQL schema (SDL)
│   │   └── resolvers.ts     # Resolver functions
│   ├── config/
│   │   └── db.ts            # MongoDB connection
│   ├── context.ts           # Apollo context type
│   └── index.ts             # Entry point
├── .env
├── tsconfig.json
└── package.json
```

---

## Step 1: Mongoose Models — Typed

```typescript
// src/models/Kisan.ts
import mongoose, { Schema, Document } from "mongoose";

// Interface define karo
export interface IKisan {
  naam: string;
  phone: string;
  email?: string;
  gaon: string;
  state: string;
  khetArea: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKisanDocument extends IKisan, Document {}

// Schema banao
const kisanSchema = new Schema<IKisanDocument>(
  {
    naam: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, trim: true },
    gaon: { type: String, required: true },
    state: { type: String, required: true },
    khetArea: { type: Number, required: true, min: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IKisanDocument>("Kisan", kisanSchema);
```

```typescript
// src/models/Fasal.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFasal {
  naam: string;
  category: "ANAAJ" | "SABZI" | "PHAL" | "MASALA" | "DAIRY";
  pricePerKg: number;
  quantityKg: number;
  kisanId: Types.ObjectId;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFasalDocument extends IFasal, Document {}

const fasalSchema = new Schema<IFasalDocument>(
  {
    naam: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["ANAAJ", "SABZI", "PHAL", "MASALA", "DAIRY"],
    },
    pricePerKg: { type: Number, required: true, min: 0 },
    quantityKg: { type: Number, required: true, min: 0 },
    kisanId: { type: Schema.Types.ObjectId, ref: "Kisan", required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Index for queries
fasalSchema.index({ kisanId: 1 });
fasalSchema.index({ category: 1, isAvailable: 1 });

export default mongoose.model<IFasalDocument>("Fasal", fasalSchema);
```

> **Yaad Rakho:** Mongoose models GraphQL se independent hain. Models database ke saath kaam karte hain, GraphQL resolvers models use karte hain. Separation of concerns!

---

## Step 2: GraphQL Type Definitions (SDL)

```typescript
// src/graphql/typeDefs.ts

// #graphql tag se VS Code mein syntax highlighting milta hai
export const typeDefs = `#graphql

  # ========== ENUM TYPES ==========
  enum FasalCategory {
    ANAAJ
    SABZI
    PHAL
    MASALA
    DAIRY
  }

  # ========== OBJECT TYPES ==========
  type Kisan {
    id: ID!
    naam: String!
    phone: String!
    email: String
    gaon: String!
    state: String!
    khetArea: Float!
    isVerified: Boolean!
    fasals: [Fasal!]!
    createdAt: String!
    updatedAt: String!
  }

  type Fasal {
    id: ID!
    naam: String!
    category: FasalCategory!
    pricePerKg: Float!
    quantityKg: Float!
    kisan: Kisan!
    isAvailable: Boolean!
    createdAt: String!
  }

  # ========== INPUT TYPES ==========
  input CreateKisanInput {
    naam: String!
    phone: String!
    email: String
    gaon: String!
    state: String!
    khetArea: Float!
  }

  input UpdateKisanInput {
    naam: String
    phone: String
    email: String
    gaon: String
    state: String
    khetArea: Float
  }

  input CreateFasalInput {
    naam: String!
    category: FasalCategory!
    pricePerKg: Float!
    quantityKg: Float!
  }

  # ========== QUERY TYPE ==========
  type Query {
    # Kisan queries
    kisan(id: ID!): Kisan
    kisans(state: String, isVerified: Boolean, limit: Int, offset: Int): [Kisan!]!
    kisanCount(state: String): Int!

    # Fasal queries
    fasal(id: ID!): Fasal
    fasals(category: FasalCategory, minPrice: Float, maxPrice: Float): [Fasal!]!
  }

  # ========== MUTATION TYPE ==========
  type Mutation {
    # Kisan mutations
    createKisan(input: CreateKisanInput!): Kisan!
    updateKisan(id: ID!, input: UpdateKisanInput!): Kisan!
    deleteKisan(id: ID!): Boolean!
    verifyKisan(id: ID!): Kisan!

    # Fasal mutations
    createFasal(kisanId: ID!, input: CreateFasalInput!): Fasal!
    deleteFasal(id: ID!): Boolean!
  }
`;
```

> **Socho Aise:** typeDefs = menu card. Query = "ye dikhao" section. Mutation = "ye karo" section. Input = order form. Types = dish descriptions.

---

## Step 3: Resolvers — Full CRUD

```typescript
// src/graphql/resolvers.ts
import { GraphQLError } from "graphql";
import Kisan, { IKisanDocument } from "../models/Kisan";
import Fasal, { IFasalDocument } from "../models/Fasal";

export const resolvers = {
  // ========== QUERY RESOLVERS ==========
  Query: {
    // Ek kisan by ID
    kisan: async (_: unknown, args: { id: string }): Promise<IKisanDocument | null> => {
      const kisan = await Kisan.findById(args.id);
      if (!kisan) {
        throw new GraphQLError("Kisan nahi mila!", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return kisan;
    },

    // Sab kisans — filtered + paginated
    kisans: async (
      _: unknown,
      args: { state?: string; isVerified?: boolean; limit?: number; offset?: number },
    ): Promise<IKisanDocument[]> => {
      const filter: Record<string, unknown> = {};
      if (args.state) filter.state = args.state;
      if (args.isVerified !== undefined) filter.isVerified = args.isVerified;

      const limit = args.limit || 20;
      const offset = args.offset || 0;

      return Kisan.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit);
    },

    // Total kisan count
    kisanCount: async (_: unknown, args: { state?: string }): Promise<number> => {
      const filter: Record<string, unknown> = {};
      if (args.state) filter.state = args.state;
      return Kisan.countDocuments(filter);
    },

    // Ek fasal by ID
    fasal: async (_: unknown, args: { id: string }): Promise<IFasalDocument | null> => {
      const fasal = await Fasal.findById(args.id);
      if (!fasal) {
        throw new GraphQLError("Fasal nahi mili!", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return fasal;
    },

    // Fasals with filters
    fasals: async (
      _: unknown,
      args: { category?: string; minPrice?: number; maxPrice?: number },
    ): Promise<IFasalDocument[]> => {
      const filter: Record<string, unknown> = { isAvailable: true };
      if (args.category) filter.category = args.category;
      if (args.minPrice || args.maxPrice) {
        const priceFilter: Record<string, number> = {};
        if (args.minPrice) priceFilter.$gte = args.minPrice;
        if (args.maxPrice) priceFilter.$lte = args.maxPrice;
        filter.pricePerKg = priceFilter;
      }
      return Fasal.find(filter).sort({ pricePerKg: 1 });
    },
  },

  // ========== MUTATION RESOLVERS ==========
  Mutation: {
    // Naya kisan banao
    createKisan: async (
      _: unknown,
      args: { input: { naam: string; phone: string; gaon: string; state: string; khetArea: number; email?: string } },
    ): Promise<IKisanDocument> => {
      // Duplicate phone check
      const existing = await Kisan.findOne({ phone: args.input.phone });
      if (existing) {
        throw new GraphQLError("Is phone number se kisan pehle se hai!", {
          extensions: { code: "DUPLICATE_ENTRY", field: "phone" },
        });
      }
      return Kisan.create(args.input);
    },

    // Kisan update karo
    updateKisan: async (
      _: unknown,
      args: { id: string; input: Record<string, unknown> },
    ): Promise<IKisanDocument | null> => {
      const kisan = await Kisan.findByIdAndUpdate(args.id, args.input, {
        new: true,
        runValidators: true,
      });
      if (!kisan) {
        throw new GraphQLError("Kisan nahi mila!", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return kisan;
    },

    // Kisan delete karo
    deleteKisan: async (_: unknown, args: { id: string }): Promise<boolean> => {
      const result = await Kisan.findByIdAndDelete(args.id);
      if (!result) {
        throw new GraphQLError("Kisan nahi mila!", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      // Kisan ke saath uski fasals bhi delete karo
      await Fasal.deleteMany({ kisanId: args.id });
      return true;
    },

    // Kisan verify karo
    verifyKisan: async (_: unknown, args: { id: string }): Promise<IKisanDocument | null> => {
      const kisan = await Kisan.findByIdAndUpdate(
        args.id,
        { isVerified: true },
        { new: true },
      );
      if (!kisan) {
        throw new GraphQLError("Kisan nahi mila!", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return kisan;
    },

    // Nayi fasal banao
    createFasal: async (
      _: unknown,
      args: { kisanId: string; input: { naam: string; category: string; pricePerKg: number; quantityKg: number } },
    ): Promise<IFasalDocument> => {
      // Kisan exists check
      const kisan = await Kisan.findById(args.kisanId);
      if (!kisan) {
        throw new GraphQLError("Kisan nahi mila — fasal add nahi ho sakti!", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return Fasal.create({ ...args.input, kisanId: args.kisanId });
    },

    // Fasal delete karo
    deleteFasal: async (_: unknown, args: { id: string }): Promise<boolean> => {
      const result = await Fasal.findByIdAndDelete(args.id);
      return result !== null;
    },
  },

  // ========== FIELD RESOLVERS (Nested) ==========

  // Kisan ke andar fasals resolve karo
  Kisan: {
    fasals: async (parent: IKisanDocument): Promise<IFasalDocument[]> => {
      // parent = current Kisan document
      return Fasal.find({ kisanId: parent.id, isAvailable: true });
    },
  },

  // Fasal ke andar kisan resolve karo
  Fasal: {
    kisan: async (parent: IFasalDocument): Promise<IKisanDocument | null> => {
      return Kisan.findById(parent.kisanId);
    },
  },
};
```

> **Warning:** Nested resolvers (Kisan.fasals, Fasal.kisan) mein N+1 problem hota hai. 10 kisans fetch karo toh 10 extra queries fasals ke liye. Isko kal DataLoader se fix karenge!

---

## Step 4: Server Entry Point

```typescript
// src/index.ts
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kisan-graphql";
const PORT = parseInt(process.env.PORT || "4000", 10);

async function startServer(): Promise<void> {
  // Express app banao
  const app = express();

  // Apollo Server banao
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // Introspection ON for development (production mein OFF karo)
    introspection: true,
  });

  // Apollo Server start karo
  await server.start();

  // Express middleware lagao
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server),
  );

  // MongoDB connect karo
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected!");

  // Server start karo
  app.listen(PORT, () => {
    console.log(`GraphQL server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
```

> **Expected Output:**
```
MongoDB connected!
GraphQL server ready at http://localhost:4000/graphql
```

> **Terminal Command:**
```bash
# Dev server start karo
npx ts-node-dev --respawn src/index.ts

# Browser mein jaao: http://localhost:4000/graphql
# Apollo Sandbox khulega — yahan queries test karo!
```

---

## Quick Revision Table

| Component | File | Purpose |
|-----------|------|---------|
| Models | `models/Kisan.ts` | Database schema + Mongoose |
| typeDefs | `graphql/typeDefs.ts` | GraphQL schema (SDL) |
| Resolvers | `graphql/resolvers.ts` | Query/Mutation implementation |
| Entry | `index.ts` | Apollo + Express + MongoDB connect |
| Query resolver | `Query.kisan()` | Data fetch karo |
| Mutation resolver | `Mutation.createKisan()` | Data create/update/delete |
| Field resolver | `Kisan.fasals()` | Nested data resolve |
| GraphQLError | Error handling | Structured error with code |

---

## Aaj Kya Seekha?

1. **Apollo Server + Express** — `@apollo/server` with `expressMiddleware`
2. **Mongoose models** — typed models as GraphQL data source
3. **typeDefs** — complete SDL with types, inputs, queries, mutations
4. **CRUD resolvers** — create, read, update, delete for Kisan aur Fasal
5. **Field resolvers** — nested data (Kisan.fasals, Fasal.kisan) auto-resolve
6. **Error handling** — `GraphQLError` with extensions for structured errors
7. **Server setup** — MongoDB + Apollo + Express ek saath

> **Practice Time!** Evening mein context setup karenge auth ke liye aur advanced error handling dekhenge. Abhi server start karo aur Playground mein queries test karo!
