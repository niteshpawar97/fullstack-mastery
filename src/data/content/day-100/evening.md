# Day 100 Evening: GraphQL Advanced — Auth, DataLoader & N+1 Problem

> **Aaj ka plan:** Day 100 ka grand finale! Aaj hum GraphQL ke sabse important advanced patterns cover karenge — **JWT Authentication** properly, **DataLoader** se N+1 problem solve, **nested resolvers** optimize, aur **cursor-based pagination** implement! Jaise manddi ka sabse experienced vyapari sab tricks jaanta hai — aaj tum GraphQL ke expert banoge!

---

## N+1 Problem — Sabse Bada Performance Killer

```
Scenario: 10 kisans fetch karo with their fasals

Query:
{
  kisans(limit: 10) {
    naam
    fasals {        # ← YE HAR KISAN KE LIYE ALAG QUERY!
      naam
      pricePerKg
    }
  }
}

Bina DataLoader:
Query 1: SELECT * FROM kisans LIMIT 10           (1 query)
Query 2: SELECT * FROM fasals WHERE kisanId = 1   (kisan 1)
Query 3: SELECT * FROM fasals WHERE kisanId = 2   (kisan 2)
Query 4: SELECT * FROM fasals WHERE kisanId = 3   (kisan 3)
...
Query 11: SELECT * FROM fasals WHERE kisanId = 10  (kisan 10)

Total: 1 + 10 = 11 queries! (N + 1 problem)

DataLoader ke saath:
Query 1: SELECT * FROM kisans LIMIT 10
Query 2: SELECT * FROM fasals WHERE kisanId IN [1,2,3,...,10]

Total: Sirf 2 queries! BATCHED!
```

> **Socho Aise:** Bina DataLoader = har kisan ke liye alag se manddi jaana. DataLoader ke saath = ek baar mein sab kisans ke order ek saath lana. 10 trips vs 1 trip!

---

## DataLoader Setup

> **Terminal Command:**
```bash
npm install dataloader
```

```typescript
// src/graphql/loaders.ts
import DataLoader from "dataloader";
import Fasal, { IFasalDocument } from "../models/Fasal";
import Kisan, { IKisanDocument } from "../models/Kisan";

// ========== FASAL LOADER — Kisan ke fasals batch mein lao ==========
export function createFasalLoader(): DataLoader<string, IFasalDocument[]> {
  return new DataLoader<string, IFasalDocument[]>(async (kisanIds) => {
    // EK query mein sab kisanIds ke fasals lao
    const fasals = await Fasal.find({
      kisanId: { $in: kisanIds as string[] },
      isAvailable: true,
    });

    // Group by kisanId — har kisan ke fasals alag
    const fasalMap = new Map<string, IFasalDocument[]>();
    for (const fasal of fasals) {
      const key = fasal.kisanId.toString();
      if (!fasalMap.has(key)) {
        fasalMap.set(key, []);
      }
      fasalMap.get(key)!.push(fasal);
    }

    // IMPORTANT: Same order mein return karo jaise kisanIds aaye the
    return kisanIds.map((id) => fasalMap.get(id.toString()) || []);
  });
}

// ========== KISAN LOADER — Fasal ke kisan batch mein lao ==========
export function createKisanLoader(): DataLoader<string, IKisanDocument | null> {
  return new DataLoader<string, IKisanDocument | null>(async (kisanIds) => {
    // EK query mein sab kisans lao
    const kisans = await Kisan.find({
      _id: { $in: kisanIds as string[] },
    });

    // Map banao for O(1) lookup
    const kisanMap = new Map<string, IKisanDocument>();
    for (const kisan of kisans) {
      kisanMap.set(kisan.id, kisan);
    }

    // Same order mein return karo
    return kisanIds.map((id) => kisanMap.get(id.toString()) || null);
  });
}
```

> **Yaad Rakho:** DataLoader ka RULE: batch function ko IDs same order mein return karni hain jaise receive hui thin. Agar ID 3 ka data nahi mila toh us index pe `null` ya `[]` return karo — skip mat karo!

---

## Context Mein Loaders Add Karo

```typescript
// src/context.ts — Updated with DataLoader
import { Request } from "express";
import DataLoader from "dataloader";
import { IKisanDocument } from "./models/Kisan";
import { IFasalDocument } from "./models/Fasal";
import { createFasalLoader, createKisanLoader } from "./graphql/loaders";

export interface IContext {
  user: IKisanDocument | null;
  isAuthenticated: boolean;
  token: string | null;
  // DataLoaders — HAR request pe naye banao (caching per request)
  loaders: {
    fasalLoader: DataLoader<string, IFasalDocument[]>;
    kisanLoader: DataLoader<string, IKisanDocument | null>;
  };
}

export async function buildContext({ req }: { req: Request }): Promise<IContext> {
  const context: IContext = {
    user: null,
    isAuthenticated: false,
    token: null,
    // Naye loaders — har request pe fresh cache
    loaders: {
      fasalLoader: createFasalLoader(),
      kisanLoader: createKisanLoader(),
    },
  };

  // ... JWT auth logic same as before ...
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const jwt = await import("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "rahasia") as {
        id: string;
      };
      const Kisan = (await import("./models/Kisan")).default;
      const user = await Kisan.findById(decoded.id);
      if (user) {
        context.user = user;
        context.isAuthenticated = true;
        context.token = token;
      }
    }
  } catch {
    // Silent fail — guest user
  }

  return context;
}
```

> **Warning:** DataLoader per-request banao, global mat rakho! Global rakhoge toh ek user ka data doosre user ko dikh sakta hai (cache leak). Har request = naye loaders = fresh cache.

---

## Resolvers with DataLoader

```typescript
// src/graphql/resolvers.ts — Updated with DataLoader

export const resolvers = {
  // Query resolvers same rahenge...

  // ========== FIELD RESOLVERS — NOW WITH DATALOADER ==========
  Kisan: {
    // PEHLE (N+1 problem):
    // fasals: async (parent) => Fasal.find({ kisanId: parent.id })
    // Ye har kisan ke liye alag query karti thi!

    // AB (DataLoader — BATCHED!):
    fasals: async (
      parent: IKisanDocument,
      _args: unknown,
      context: IContext,
    ): Promise<IFasalDocument[]> => {
      // DataLoader automatically batch karega!
      // 10 kisans ke liye 10 baar call hoga, but
      // DataLoader EK query mein sab resolve karega
      return context.loaders.fasalLoader.load(parent.id);
    },
  },

  Fasal: {
    // PEHLE: kisan: async (parent) => Kisan.findById(parent.kisanId)
    // AB:
    kisan: async (
      parent: IFasalDocument,
      _args: unknown,
      context: IContext,
    ): Promise<IKisanDocument | null> => {
      return context.loaders.kisanLoader.load(parent.kisanId.toString());
    },
  },
};
```

---

## Cursor-Based Pagination — Implementation

```typescript
// src/graphql/resolvers.ts — Pagination resolver

// Helper: ID to cursor (Base64 encode)
function toCursor(id: string): string {
  return Buffer.from(id).toString("base64");
}

// Helper: cursor to ID (Base64 decode)
function fromCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf-8");
}

// Paginated fasals resolver
const resolvers = {
  Query: {
    fasalsPaginated: async (
      _: unknown,
      args: { first?: number; after?: string; category?: string },
    ) => {
      const limit = Math.min(args.first || 10, 50); // Max 50 per page
      const filter: Record<string, unknown> = { isAvailable: true };

      if (args.category) filter.category = args.category;

      // Agar cursor hai — uske baad ke records lao
      if (args.after) {
        const afterId = fromCursor(args.after);
        filter._id = { $gt: afterId };
      }

      // Ek extra fetch karo — hasNextPage check ke liye
      const fasals = await Fasal.find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1); // +1 for hasNextPage check

      const hasNextPage = fasals.length > limit;
      // Extra item hata do agar hai
      const actualFasals = hasNextPage ? fasals.slice(0, limit) : fasals;

      // Total count (optional — expensive for large datasets)
      const totalCount = await Fasal.countDocuments(
        args.category ? { category: args.category, isAvailable: true } : { isAvailable: true },
      );

      // Edges banao — node + cursor
      const edges = actualFasals.map((fasal) => ({
        node: fasal,
        cursor: toCursor(fasal.id),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!args.after, // Agar cursor tha toh previous page hai
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount,
      };
    },
  },
};
```

### Client Side — Pagination Query

```graphql
# Pehle page
query GetFasals {
  fasalsPaginated(first: 5) {
    edges {
      node {
        id
        naam
        pricePerKg
        category
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}

# Next page — endCursor use karo
query GetNextFasals {
  fasalsPaginated(first: 5, after: "NjY1YWJjMTIz") {
    edges {
      node {
        id
        naam
        pricePerKg
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

> **Tip:** Cursor-based pagination mein `endCursor` save karo. Next page ke liye `after: endCursor` bhejo. Jab `hasNextPage: false` — data khatam!

---

## Performance Monitoring — Apollo Plugin

```typescript
// src/plugins/logging.ts — Query performance track karo
import { ApolloServerPlugin } from "@apollo/server";
import { IContext } from "../context";

export const loggingPlugin: ApolloServerPlugin<IContext> = {
  async requestDidStart() {
    const startTime = Date.now();

    return {
      async willSendResponse(requestContext) {
        const duration = Date.now() - startTime;
        const operationName = requestContext.request.operationName || "anonymous";

        // Slow queries log karo (100ms se zyada)
        if (duration > 100) {
          console.warn(
            `[SLOW QUERY] ${operationName}: ${duration}ms`,
          );
        }
      },

      async didEncounterErrors(requestContext) {
        // Errors log karo
        for (const error of requestContext.errors) {
          console.error(
            `[GraphQL ERROR] ${error.message}`,
            error.extensions,
          );
        }
      },
    };
  },
};

// Server mein plugin add karo:
// const server = new ApolloServer({
//   schema,
//   plugins: [loggingPlugin, ...otherPlugins],
// });
```

---

## Production Checklist

```typescript
// Production mein ye sab karo:

const server = new ApolloServer<IContext>({
  schema,
  // 1. Introspection OFF — schema expose mat karo
  introspection: process.env.NODE_ENV !== "production",

  // 2. Error formatting — internal errors hide karo
  formatError: (error) => {
    // Mongoose validation errors
    if (error.extensions?.code === "INTERNAL_SERVER_ERROR") {
      return { message: "Server error", extensions: { code: "INTERNAL_SERVER_ERROR" } };
    }
    return error;
  },

  plugins: [
    // 3. Drain plugins for graceful shutdown
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // 4. Logging plugin
    loggingPlugin,
  ],
});

// 5. Rate limiting — express-rate-limit use karo
// 6. Query depth limiting — graphql-depth-limit
// 7. Query complexity — graphql-query-complexity
// 8. Redis PubSub for subscriptions in multi-server
// 9. DataLoader per-request (already done)
// 10. CORS properly configure karo
```

> **Warning:** Production mein introspection OFF karo. Nahi toh koi bhi tumhara poora schema dekh sakta hai. `introspection: process.env.NODE_ENV !== "production"` — development mein ON, production mein OFF!

---

## Complete Architecture Summary

```
Client Request
    ↓
Express Server (HTTP) / WebSocket Server (WS)
    ↓
Apollo Server
    ↓ (context built per request)
Context: { user, loaders, isAuthenticated }
    ↓
Schema (typeDefs) → Resolvers
    ↓                    ↓
Query/Mutation      Subscription
    ↓                    ↓
Auth Check          PubSub Listen
    ↓                    ↓
DataLoader          WebSocket Push
    ↓
Mongoose Models
    ↓
MongoDB
```

---

## Quick Revision Table

| Concept | Kya Hai | Kab Use Karo |
|---------|---------|-------------|
| N+1 Problem | Extra queries nested data mein | Jab nested resolvers hain |
| DataLoader | Batch + cache queries | Har nested field resolver mein |
| Per-request loaders | Fresh cache har request pe | Context mein naye loaders |
| Cursor pagination | Efficient paging with cursor | Large datasets |
| `toCursor/fromCursor` | ID encode/decode Base64 | Pagination cursors |
| `hasNextPage` | Next page exists? | PageInfo mein |
| `withFilter` | Subscription filter | Category/ID wise filter |
| Apollo Plugin | Request lifecycle hooks | Logging, monitoring |
| Introspection OFF | Schema hide in production | Security |

---

## Aaj Kya Seekha?

1. **N+1 Problem** — nested resolvers mein extra queries, performance killer
2. **DataLoader** — batch + cache queries for N+1 solution
3. **Per-request loaders** — context mein fresh loaders har request pe
4. **Cursor pagination** — Base64 encoded cursors, hasNextPage, endCursor
5. **Performance monitoring** — Apollo plugins for slow query logging
6. **Production checklist** — introspection OFF, error formatting, rate limiting
7. **Complete architecture** — Client > Apollo > Context > Resolvers > DataLoader > MongoDB

> **Practice Time!** Phase 4 BONUS COMPLETE! Tum Day 1 se Day 100 tak aa gaye ho! REST APIs se lekar GraphQL subscriptions tak. Ab apne project mein GraphQL API add karo — schema design karo, resolvers likho, DataLoader lagao, aur production-ready banao. Full Stack Mastery ka safar jaari hai!
