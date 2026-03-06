# Day 98 Morning: GraphQL Intro — Schema, Queries & Type System

> **Aaj ka plan:** Aaj hum ek bilkul naya concept seekhenge — **GraphQL**! REST API mein tumne endpoints banaye the (`/api/users`, `/api/products`). GraphQL mein sirf EK endpoint hota hai aur client decide karta hai ki kya data chahiye! Jaise manddi mein tum bolo "mujhe sirf gehun ka bhav do" — poora rate card nahi, sirf jo chahiye wo!

---

## GraphQL Kya Hai?

```
REST API:
- Multiple endpoints: /api/users, /api/users/123, /api/products
- Server decide karta hai response shape
- Over-fetching: Zyada data aata hai (tumhe naam chahiye, poora profile aata hai)
- Under-fetching: Kam data aata hai (3 requests lagti hain)

GraphQL:
- EK endpoint: /graphql
- Client decide karta hai kya chahiye
- No over-fetching: Sirf requested fields aate hain
- No under-fetching: Ek query mein sab kuch
```

> **Socho Aise:** REST mein tum thali order karte ho — sab kuch aata hai chahe tum sirf daal chahte ho. GraphQL mein tum bolo "sirf daal do, roti do, chawal nahi" — exactly wohi aata hai!

---

## REST vs GraphQL — Example

```
REST — 3 separate requests chahiye:

GET /api/kisan/123           → { id, naam, phone, email, gaon, state, ... }
GET /api/kisan/123/fasals    → [{ id, naam, price, ... }, ...]
GET /api/kisan/123/orders    → [{ id, amount, status, ... }, ...]

GraphQL — 1 request mein sab kuch:

POST /graphql
{
  query: `{
    kisan(id: "123") {
      naam
      phone
      fasals {
        naam
        price
      }
      orders {
        amount
        status
      }
    }
  }`
}
```

> **Yaad Rakho:** GraphQL mein hamesha POST request hota hai `/graphql` pe. Query body mein jaati hai. Client ko exactly wohi fields milte hain jo maange — na zyada, na kam!

---

## SDL — Schema Definition Language

```graphql
# ========== SCALAR TYPES (Built-in) ==========
# String  — text
# Int     — integer number
# Float   — decimal number
# Boolean — true/false
# ID      — unique identifier (string internally)

# ========== CUSTOM TYPE — Object Type ==========
type Kisan {
  id: ID!                    # ! = required (non-null)
  naam: String!
  phone: String!
  email: String
  gaon: String!
  state: String!
  khetArea: Float!
  isVerified: Boolean!
  fasals: [Fasal!]!          # Array of Fasal — required
  createdAt: String!
}

type Fasal {
  id: ID!
  naam: String!
  category: FasalCategory!
  pricePerKg: Float!
  quantityKg: Float!
  kisan: Kisan!              # Relation — back to kisan
}

# ========== ENUM TYPE ==========
enum FasalCategory {
  ANAAJ
  SABZI
  PHAL
  MASALA
  DAIRY
}

# ========== INPUT TYPE — Mutation ke liye ==========
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
  gaon: String
  state: String
  khetArea: Float
}
```

> **Tip:** `!` matlab required (non-null). `[Fasal!]!` matlab array required hai AUR array ke andar bhi null nahi aa sakta. `[Fasal]` matlab array aa sakta hai ya null, andar bhi null aa sakta hai.

---

## Nullability Rules — Samajh Lo Ache Se

```graphql
# GraphQL nullability combinations:

String        # String ya null — nullable
String!       # Hamesha String — non-null

[String]      # null ya array (array mein null aa sakte hain)
[String]!     # Hamesha array (array mein null aa sakte hain)
[String!]     # null ya array (array mein null NAHI aa sakta)
[String!]!    # Hamesha array, andar bhi null NAHI (SAFEST!)
```

> **Socho Aise:** `!` matlab "guarantee hai milega". `[Fasal!]!` matlab "fasal list zaroor milegi, aur list mein har item bhi zaroor valid hoga." Jaise manddi guarantee de ki "saamaan aayega, aur sab quality checked hoga!"

---

## Query Type — Data Read Karo

```graphql
# ========== ROOT QUERY TYPE ==========
# Ye sab "read" operations hain — data fetch karo

type Query {
  # Ek kisan by ID
  kisan(id: ID!): Kisan

  # Sab kisans — with optional filters
  kisans(
    state: String
    isVerified: Boolean
    page: Int
    limit: Int
  ): [Kisan!]!

  # Ek fasal by ID
  fasal(id: ID!): Fasal

  # Search fasals
  searchFasals(
    category: FasalCategory
    minPrice: Float
    maxPrice: Float
  ): [Fasal!]!

  # Stats
  kisanCount: Int!
}
```

### Query Likhna Client Side

```graphql
# Example 1: Ek kisan ka naam aur phone
query GetKisan {
  kisan(id: "abc123") {
    naam
    phone
  }
}

# Example 2: Sab verified kisans with fasals
query GetVerifiedKisans {
  kisans(isVerified: true, limit: 10) {
    naam
    gaon
    state
    fasals {
      naam
      pricePerKg
    }
  }
}

# Example 3: Multiple queries ek saath
query Dashboard {
  totalKisans: kisanCount
  upKisans: kisans(state: "UP", limit: 5) {
    naam
    gaon
  }
  mpKisans: kisans(state: "MP", limit: 5) {
    naam
    gaon
  }
}
```

> **Yaad Rakho:** GraphQL mein field aliases use kar sakte ho (`totalKisans: kisanCount`). Ek hi query mein multiple operations bhi — REST mein ye possible nahi tha!

---

## Mutation Type — Data Create/Update/Delete

```graphql
# ========== ROOT MUTATION TYPE ==========
# Ye sab "write" operations hain — data change karo

type Mutation {
  # Create
  createKisan(input: CreateKisanInput!): Kisan!
  createFasal(kisanId: ID!, input: CreateFasalInput!): Fasal!

  # Update
  updateKisan(id: ID!, input: UpdateKisanInput!): Kisan!

  # Delete
  deleteKisan(id: ID!): Boolean!

  # Special actions
  verifyKisan(id: ID!): Kisan!
}

# Input types for mutations
input CreateFasalInput {
  naam: String!
  category: FasalCategory!
  pricePerKg: Float!
  quantityKg: Float!
}
```

### Mutation Likhna Client Side

```graphql
# Naya kisan register karo
mutation RegisterKisan {
  createKisan(input: {
    naam: "Ramu Yadav"
    phone: "9876543210"
    gaon: "Sultanpur"
    state: "UP"
    khetArea: 5.5
  }) {
    id
    naam
    isVerified
    createdAt
  }
}

# Kisan update karo
mutation UpdateKisan {
  updateKisan(id: "abc123", input: {
    khetArea: 8.0
    gaon: "Lucknow"
  }) {
    id
    naam
    khetArea
    gaon
  }
}
```

---

## Resolvers — Schema Ko Life Do

```typescript
// Resolvers har field ke liye data fetch karte hain
// Jaise schema blueprint hai — resolvers actual implementation

// Schema:  kisan(id: ID!): Kisan
// Resolver: actual database se data laao

const resolvers = {
  // Query resolvers
  Query: {
    // parent: parent object (root mein null)
    // args: client ne jo arguments bheje
    // context: shared data (db, user, etc.)
    // info: query metadata
    kisan: async (_parent: unknown, args: { id: string }, context: IContext) => {
      return await context.db.collection("kisans").findOne({ _id: args.id });
    },

    kisans: async (
      _parent: unknown,
      args: { state?: string; isVerified?: boolean },
      context: IContext,
    ) => {
      const filter: Record<string, unknown> = {};
      if (args.state) filter.state = args.state;
      if (args.isVerified !== undefined) filter.isVerified = args.isVerified;
      return await context.db.collection("kisans").find(filter).toArray();
    },
  },

  // Mutation resolvers
  Mutation: {
    createKisan: async (
      _parent: unknown,
      args: { input: CreateKisanInput },
      context: IContext,
    ) => {
      const result = await context.db.collection("kisans").insertOne({
        ...args.input,
        isVerified: false,
        createdAt: new Date().toISOString(),
      });
      return { id: result.insertedId, ...args.input };
    },
  },

  // Field resolver — nested data (fasals for a kisan)
  Kisan: {
    fasals: async (parent: IKisan, _args: unknown, context: IContext) => {
      // parent = current kisan object
      return await context.db
        .collection("fasals")
        .find({ kisanId: parent.id })
        .toArray();
    },
  },
};
```

> **Socho Aise:** Schema bolta hai "kisan ke paas fasals hain". Resolver bolta hai "ye rahe, database se laa ke diya". Schema = menu card, Resolver = chef jo actually khaana banata hai!

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| GraphQL | Query language for APIs | Single `/graphql` endpoint |
| SDL | Schema Definition Language | `type Kisan { naam: String! }` |
| Query | Data read (GET jaisa) | `{ kisan(id: "1") { naam } }` |
| Mutation | Data write (POST/PUT/DELETE) | `createKisan(input: {...})` |
| `!` (non-null) | Required field | `String!` = never null |
| `[Type!]!` | Required array, no nulls | `[Fasal!]!` |
| Enum | Fixed set of values | `enum FasalCategory { ANAAJ }` |
| Input type | Mutation arguments | `input CreateKisanInput { }` |
| Resolver | Schema implementation | DB query function |

---

## Aaj Kya Seekha?

1. **GraphQL** — ek endpoint, client decides data shape
2. **REST vs GraphQL** — over-fetching/under-fetching solve
3. **SDL** — type definitions with scalars, objects, enums, inputs
4. **Nullability** — `!` for non-null, `[Type!]!` for safe arrays
5. **Query type** — read operations define karo
6. **Mutation type** — write operations define karo
7. **Resolvers** — schema ko actual data se connect karo

> **Practice Time!** Evening mein Mutations deep dive karenge aur GraphQL Playground use karke live queries chalayenge. Schema sochte raho apne project ke liye!
