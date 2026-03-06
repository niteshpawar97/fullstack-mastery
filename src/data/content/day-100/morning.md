# Day 100 Morning: GraphQL Advanced — Subscriptions & Real-Time with graphql-ws

> **Aaj ka plan:** Day 100! Centurion! Aaj hum GraphQL ke advanced topics cover karenge — **Subscriptions** for real-time updates, **cursor-based pagination**, aur **nested resolvers**! Jaise manddi mein live rate board hota hai — prices real-time update hote hain — waise GraphQL Subscriptions!

---

## Subscriptions Kya Hain?

```
Query     = Ek baar data maango, ek baar mile (GET jaisa)
Mutation  = Data change karo, result mile (POST/PUT jaisa)
Subscription = REAL-TIME — data change hone pe AUTOMATICALLY mile (WebSocket)

Real world examples:
- Live fasal price updates
- Naye order ki notification
- Chat messages
- Kisan verification status
```

> **Socho Aise:** Query = manddi jaake bhav pucho ek baar. Subscription = manddi ka rate board jo har 5 minute mein apne aap update hota hai — tum baitha ke dekhte raho!

---

## graphql-ws Setup

> **Terminal Command:**
```bash
# WebSocket library install karo
npm install graphql-ws ws
npm install --save-dev @types/ws
```

### Schema mein Subscription Type

```graphql
# typeDefs mein add karo

# ========== SUBSCRIPTION TYPE ==========
type Subscription {
  # Nayi fasal add hone pe notification
  fasalAdded(category: FasalCategory): Fasal!

  # Kisan verify hone pe notification
  kisanVerified: Kisan!

  # Price update hone pe notification
  priceUpdated(fasalId: ID): Fasal!
}
```

---

## PubSub — Event System

```typescript
// src/graphql/pubsub.ts
// PubSub = Publish-Subscribe pattern
// Publisher: event bhejta hai
// Subscriber: event sunta hai

// Simple in-memory PubSub (development ke liye)
// Production mein Redis PubSub use karo!

import { PubSub } from "graphql-subscriptions";

// Ek shared PubSub instance
export const pubsub = new PubSub();

// Event names — constants mein rakho (typo se bacho)
export const EVENTS = {
  FASAL_ADDED: "FASAL_ADDED",
  KISAN_VERIFIED: "KISAN_VERIFIED",
  PRICE_UPDATED: "PRICE_UPDATED",
} as const;
```

> **Terminal Command:**
```bash
# PubSub library install karo
npm install graphql-subscriptions
```

> **Warning:** `PubSub` from `graphql-subscriptions` sirf single server ke liye hai (in-memory). Production mein multiple servers hain toh **Redis PubSub** use karo (`graphql-redis-subscriptions`).

---

## Subscription Resolvers

```typescript
// src/graphql/resolvers.ts mein add karo

import { pubsub, EVENTS } from "./pubsub";
import { withFilter } from "graphql-subscriptions";

export const resolvers = {
  // ... Query aur Mutation resolvers (pehle se hain)

  Subscription: {
    // Simple subscription — har nayi fasal pe fire
    fasalAdded: {
      subscribe: (_: unknown, args: { category?: string }) => {
        // Agar category filter hai — sirf wohi category ki fasals
        if (args.category) {
          return withFilter(
            () => pubsub.asyncIterableIterator(EVENTS.FASAL_ADDED),
            (payload: { fasalAdded: { category: string } }) => {
              return payload.fasalAdded.category === args.category;
            },
          )();
        }
        // Bina filter — sab fasals
        return pubsub.asyncIterableIterator(EVENTS.FASAL_ADDED);
      },
    },

    // Kisan verified hone pe
    kisanVerified: {
      subscribe: () => pubsub.asyncIterableIterator(EVENTS.KISAN_VERIFIED),
    },

    // Price update hone pe
    priceUpdated: {
      subscribe: (_: unknown, args: { fasalId?: string }) => {
        if (args.fasalId) {
          return withFilter(
            () => pubsub.asyncIterableIterator(EVENTS.PRICE_UPDATED),
            (payload: { priceUpdated: { id: string } }) => {
              return payload.priceUpdated.id === args.fasalId;
            },
          )();
        }
        return pubsub.asyncIterableIterator(EVENTS.PRICE_UPDATED);
      },
    },
  },

  Mutation: {
    // Fasal create mein — event PUBLISH karo
    createFasal: async (
      _: unknown,
      args: { input: { naam: string; category: string; pricePerKg: number; quantityKg: number } },
      context: IContext,
    ): Promise<IFasalDocument> => {
      requireVerified(context);

      const fasal = await Fasal.create({
        ...args.input,
        kisanId: context.user!.id,
      });

      // Event publish karo — subscribers ko milega!
      await pubsub.publish(EVENTS.FASAL_ADDED, {
        fasalAdded: fasal, // Key = subscription field name
      });

      return fasal;
    },

    // Verify kisan mein — event publish karo
    verifyKisan: async (
      _: unknown,
      args: { id: string },
    ): Promise<IKisanDocument | null> => {
      const kisan = await Kisan.findByIdAndUpdate(
        args.id,
        { isVerified: true },
        { new: true },
      );

      if (kisan) {
        // Publish verification event
        await pubsub.publish(EVENTS.KISAN_VERIFIED, {
          kisanVerified: kisan,
        });
      }

      return kisan;
    },

    // Price update mutation
    updateFasalPrice: async (
      _: unknown,
      args: { id: string; newPrice: number },
      context: IContext,
    ): Promise<IFasalDocument | null> => {
      requireAuth(context);

      const fasal = await Fasal.findByIdAndUpdate(
        args.id,
        { pricePerKg: args.newPrice },
        { new: true },
      );

      if (fasal) {
        // Price update event publish karo
        await pubsub.publish(EVENTS.PRICE_UPDATED, {
          priceUpdated: fasal,
        });
      }

      return fasal;
    },
  },
};
```

> **Yaad Rakho:** `pubsub.publish(EVENT_NAME, { subscriptionFieldName: data })` — payload mein key EXACTLY subscription field name hona chahiye. `fasalAdded` subscription ke liye payload mein `fasalAdded` key zaroori!

---

## Server mein WebSocket Setup

```typescript
// src/index.ts — Updated with WebSocket support
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
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

  // HTTP server banao (WebSocket ke liye zaroori)
  const httpServer = createServer(app);

  // Executable schema banao (WebSocket ke liye)
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // WebSocket server banao — subscriptions ke liye
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql", // Same path as HTTP
  });

  // graphql-ws server start karo
  const wsServerCleanup = useServer(
    {
      schema,
      // WebSocket connection pe context
      context: async (ctx) => {
        // WebSocket mein headers connectionParams mein aate hain
        const token = ctx.connectionParams?.authorization as string | undefined;
        // Token se user identify karo (simplified)
        return { user: null, isAuthenticated: false, token: token || null };
      },
      // Connection lifecycle hooks
      onConnect: async () => {
        console.log("WebSocket client connected!");
      },
      onDisconnect: async () => {
        console.log("WebSocket client disconnected");
      },
    },
    wsServer,
  );

  // Apollo Server banao
  const server = new ApolloServer<IContext>({
    schema,
    plugins: [
      // HTTP server shutdown properly
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // WebSocket server shutdown properly
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsServerCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, { context: buildContext }),
  );

  const PORT = parseInt(process.env.PORT || "4000", 10);
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kisan-graphql";

  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected!");

  httpServer.listen(PORT, () => {
    console.log(`HTTP  server: http://localhost:${PORT}/graphql`);
    console.log(`WS    server: ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
```

> **Terminal Command:**
```bash
# Extra dependency for schema building
npm install @graphql-tools/schema
```

---

## Client Side — Subscription Use

```graphql
# Apollo Sandbox / Client mein subscription test karo

subscription WatchNewFasals {
  fasalAdded(category: SABZI) {
    id
    naam
    pricePerKg
    category
    kisan {
      naam
      gaon
    }
  }
}

# Ye subscription OPEN rahega — jab bhi nayi SABZI fasal add hogi
# toh data automatically aayega!

# Doosre tab mein mutation chalao:
mutation AddFasal {
  createFasal(input: {
    naam: "Tamatar"
    category: SABZI
    pricePerKg: 40
    quantityKg: 500
  }) {
    id
    naam
  }
}
# Pehle tab mein subscription result dikhega!
```

> **Expected Output:**
```json
{
  "data": {
    "fasalAdded": {
      "id": "abc123",
      "naam": "Tamatar",
      "pricePerKg": 40,
      "category": "SABZI",
      "kisan": {
        "naam": "Ramu Yadav",
        "gaon": "Sultanpur"
      }
    }
  }
}
```

---

## Cursor-Based Pagination — Better Than Offset

```graphql
# Offset pagination — SLOW for large data
# Page 1000 = skip 999 * limit = database bohot kaam karti hai

# Cursor pagination — FAST always!
# "Ye item ke baad wale do" — index use hota hai

# Schema mein:
type FasalEdge {
  node: Fasal!        # Actual data
  cursor: String!     # Unique pointer (encoded ID)
}

type FasalConnection {
  edges: [FasalEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  fasalsPaginated(
    first: Int       # Kitne chahiye (forward)
    after: String    # Cursor ke baad wale (forward)
    last: Int        # Peeche kitne (backward)
    before: String   # Cursor se pehle wale (backward)
  ): FasalConnection!
}
```

---

## Quick Revision Table

| Concept | Kya Hai | Use Case |
|---------|---------|----------|
| Subscription | Real-time updates | Live price updates |
| PubSub | Event publish/subscribe | In-memory event system |
| `graphql-ws` | WebSocket protocol | Client-server real-time |
| `withFilter` | Subscription filter | Category-wise filter |
| `publish()` | Event bhejo | Mutation ke baad fire |
| `asyncIterableIterator()` | Event suno | Subscription resolver mein |
| Cursor pagination | Efficient paging | Large datasets |
| `FasalConnection` | Relay-style response | edges + pageInfo |

---

## Aaj Kya Seekha?

1. **Subscriptions** — real-time data with WebSocket protocol
2. **PubSub** — publish-subscribe event pattern for subscriptions
3. **graphql-ws** — WebSocket server setup with Apollo
4. **withFilter** — subscription events filter karo (category, ID)
5. **Server setup** — HTTP + WebSocket dono ek saath
6. **Cursor pagination** — efficient paging with cursors vs offset
7. **Connection pattern** — Relay-style edges + pageInfo response

> **Practice Time!** Evening mein Authentication in GraphQL, DataLoader for N+1, aur complete advanced patterns dekhenge. Abhi subscription test karo — do browser tabs mein!
