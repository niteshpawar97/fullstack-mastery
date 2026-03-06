# Day 98 Evening: GraphQL Mutations, Variables & Playground Deep Dive

> **Aaj ka plan:** Morning mein GraphQL ka concept, schema, types seekha. Ab evening mein mutations deeply, GraphQL variables, fragments, aur Playground hands-on karenge! Jaise subah manddi ka map dekha — ab actually manddi mein ghum ke dekhenge!

---

## GraphQL Variables — Dynamic Queries

```graphql
# GALAT — hardcoded values (like SQL injection risk!)
query {
  kisan(id: "abc123") {
    naam
  }
}

# SAHI — Variables use karo (safe + reusable)
query GetKisan($kisanId: ID!) {
  kisan(id: $kisanId) {
    naam
    phone
    state
  }
}

# Variables JSON mein bhejo (alag se):
# {
#   "kisanId": "abc123"
# }
```

> **Yaad Rakho:** Variables hamesha `$` se start hote hain. Type bhi define karo (`$kisanId: ID!`). Variables client se safely pass hote hain — string interpolation kabhi mat karo GraphQL mein!

---

## Mutations with Variables — Proper Way

```graphql
# CREATE — naya kisan register karo
mutation CreateKisan($input: CreateKisanInput!) {
  createKisan(input: $input) {
    id
    naam
    phone
    isVerified
    createdAt
  }
}

# Variables:
# {
#   "input": {
#     "naam": "Ramu Yadav",
#     "phone": "9876543210",
#     "gaon": "Sultanpur",
#     "state": "UP",
#     "khetArea": 5.5
#   }
# }

# UPDATE — kisan details update
mutation UpdateKisan($id: ID!, $input: UpdateKisanInput!) {
  updateKisan(id: $id, input: $input) {
    id
    naam
    khetArea
    gaon
  }
}

# Variables:
# {
#   "id": "abc123",
#   "input": {
#     "khetArea": 8.0,
#     "gaon": "Lucknow"
#   }
# }

# DELETE — kisan hata do
mutation DeleteKisan($id: ID!) {
  deleteKisan(id: $id)
}

# Variables:
# {
#   "id": "abc123"
# }
```

> **Socho Aise:** Variables waise hain jaise function parameters. Function ek baar likho, alag-alag values ke saath call karo. Mutations bhi ek baar likho, variables change karo — reusable!

---

## Fragments — Reusable Field Sets

```graphql
# Fragment define karo — common fields group
fragment KisanBasicInfo on Kisan {
  id
  naam
  phone
  state
  isVerified
}

fragment FasalInfo on Fasal {
  id
  naam
  category
  pricePerKg
  quantityKg
}

# Fragment use karo — DRY (Don't Repeat Yourself)!
query Dashboard {
  # UP ke kisans
  upKisans: kisans(state: "UP", limit: 5) {
    ...KisanBasicInfo
    khetArea
    fasals {
      ...FasalInfo
    }
  }

  # MP ke kisans
  mpKisans: kisans(state: "MP", limit: 5) {
    ...KisanBasicInfo
    khetArea
    fasals {
      ...FasalInfo
    }
  }
}
```

> **Tip:** Fragments se same fields baar baar likhne ki zaroorat nahi. Ek baar define karo, `...FragmentName` se spread karo — jaise JavaScript mein object spread!

---

## Inline Fragments — Union/Interface Types

```graphql
# Union type — search result mein different types aa sakte hain
union SearchResult = Kisan | Fasal | Order

type Query {
  search(query: String!): [SearchResult!]!
}

# Client side — inline fragments se type check karo
query Search($q: String!) {
  search(query: $q) {
    ... on Kisan {
      naam
      phone
      state
    }
    ... on Fasal {
      naam
      pricePerKg
      category
    }
    ... on Order {
      orderId
      amount
      status
    }
  }
}
```

---

## GraphQL Playground / Apollo Sandbox

```
GraphQL Playground kya hai?
- Browser mein GraphQL test karo (Postman jaisa, but better)
- Auto-complete milta hai schema se
- Docs automatically generate hote hain
- Variables, headers sab set kar sakte ho

Tools:
1. Apollo Sandbox  — https://studio.apollographql.com/sandbox
2. GraphiQL        — Built-in with many servers
3. Altair GraphQL  — Desktop app
4. Insomnia        — REST + GraphQL dono
```

> **Terminal Command:**
```bash
# Apollo Server start karo — Sandbox automatically milega
npm run dev

# Browser mein jaao:
# http://localhost:4000/graphql  — Apollo Sandbox
```

### Playground mein Kya Kya Test Karo

```graphql
# 1. Schema explore karo — right side mein Docs tab
# 2. Query likho — auto-complete use karo
# 3. Variables tab mein JSON do
# 4. Headers tab mein Authorization token do

# Test query:
query {
  __schema {
    types {
      name
      kind
    }
  }
}

# Ye introspection query hai — poora schema dikhata hai!
# Production mein introspection OFF karna best practice
```

---

## Error Handling in GraphQL

```graphql
# GraphQL errors — REST se alag!
# REST mein: HTTP status codes (404, 500, etc.)
# GraphQL mein: HAMESHA 200 OK, errors array mein

# Successful response:
{
  "data": {
    "kisan": {
      "naam": "Ramu",
      "phone": "9876543210"
    }
  }
}

# Error response — data null, errors array mein details:
{
  "data": {
    "kisan": null
  },
  "errors": [
    {
      "message": "Kisan not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["kisan"],
      "extensions": {
        "code": "NOT_FOUND",
        "http": { "status": 404 }
      }
    }
  ]
}
```

```typescript
// Resolver mein error throw karo
import { GraphQLError } from "graphql";

const resolvers = {
  Query: {
    kisan: async (_: unknown, args: { id: string }, ctx: IContext) => {
      const kisan = await ctx.db.collection("kisans").findOne({ _id: args.id });

      if (!kisan) {
        // GraphQL error — structured format mein
        throw new GraphQLError("Kisan nahi mila!", {
          extensions: {
            code: "NOT_FOUND",
            argumentName: "id",
          },
        });
      }

      return kisan;
    },
  },

  Mutation: {
    createKisan: async (_: unknown, args: { input: CreateKisanInput }, ctx: IContext) => {
      // Duplicate check
      const existing = await ctx.db
        .collection("kisans")
        .findOne({ phone: args.input.phone });

      if (existing) {
        throw new GraphQLError("Is phone number se kisan pehle se registered hai!", {
          extensions: {
            code: "DUPLICATE_ENTRY",
            field: "phone",
          },
        });
      }

      // Create kisan
      const result = await ctx.db.collection("kisans").insertOne({
        ...args.input,
        isVerified: false,
        createdAt: new Date().toISOString(),
      });

      return { id: result.insertedId, ...args.input, isVerified: false };
    },
  },
};
```

> **Warning:** GraphQL mein HTTP status code hamesha 200 hota hai (mostly). Errors `errors` array mein aate hain. `extensions.code` se error type identify karo. REST ki tarah 404 ya 500 nahi milega!

---

## Operation Names — Best Practice

```graphql
# GALAT — anonymous query
query {
  kisans { naam }
}

# SAHI — named operations (debugging + caching mein help)
query GetAllKisans {
  kisans { naam }
}

mutation CreateNewKisan($input: CreateKisanInput!) {
  createKisan(input: $input) { id }
}

# Benefits of naming:
# 1. Server logs mein query name dikhta hai
# 2. Apollo DevTools mein identify hota hai
# 3. Multiple operations ek document mein — name se select karo
# 4. Performance monitoring mein track hota hai
```

---

## Directives — Conditional Fields

```graphql
# @include — field sirf tab include karo jab condition true
# @skip — field skip karo jab condition true

query GetKisan($id: ID!, $includeFasals: Boolean!) {
  kisan(id: $id) {
    naam
    phone
    state
    # Fasals sirf tab aayenge jab $includeFasals = true
    fasals @include(if: $includeFasals) {
      naam
      pricePerKg
    }
  }
}

# Variables:
# { "id": "abc123", "includeFasals": true }
# ya
# { "id": "abc123", "includeFasals": false }
```

> **Socho Aise:** Directives aise hain jaise restaurant mein bolo "salad extra chahiye toh do, nahi toh mat dena". Client decide karta hai conditional data lena ya nahi!

---

## Quick Revision Table

| Concept | Kya Hai | Syntax |
|---------|---------|--------|
| Variables | Dynamic query values | `$naam: String!` |
| Fragments | Reusable field groups | `fragment X on Type { }` |
| Inline Fragments | Union type handling | `... on Kisan { naam }` |
| Operation Name | Named query/mutation | `query GetKisan { }` |
| Directives | Conditional fields | `@include(if: $flag)` |
| Introspection | Schema explore | `__schema { types { } }` |
| GraphQLError | Structured errors | `extensions.code` |
| Playground | Browser IDE | Apollo Sandbox |

---

## Aaj Kya Seekha?

1. **Variables** — `$var: Type!` se dynamic, safe queries
2. **Fragments** — reusable field sets with `...FragmentName`
3. **Inline fragments** — union/interface types handle karo
4. **Playground** — Apollo Sandbox mein live testing
5. **Error handling** — `GraphQLError` with extensions aur error codes
6. **Operation names** — debugging + monitoring ke liye zaroori
7. **Directives** — `@include`, `@skip` for conditional data fetching

> **Practice Time!** Kal Apollo Server + Express + MongoDB setup karenge — real GraphQL API! Aaj ye queries Playground mein practice karo mentally. Schema socho apne project ke liye!
