# Day 104 Morning: Week 15 Revision + GraphQL API Intro

> **Aaj ka plan:** Pehle Week 15 ka quick revision karenge (Microservices, Communication, Gateway), phir GraphQL ka intro — REST ke alternative jo Facebook ne banaya aur aaj har jagah use hota hai.

---

## Week 15 Quick Revision

### Microservices Architecture (Day 101)

```
Monolith:  [Auth + Orders + Payment + Notification] → Ek hi app
Microservices: [Auth] [Orders] [Payment] [Notification] → Alag-alag apps

Key Rules:
1. Database per service — doosri service ka DB touch mat karo
2. Single responsibility — ek service ek kaam
3. Health check — /health endpoint har service mein
4. Independent deployment — ek service update karna ho to baaki ko mat chhuo
```

### Communication Patterns (Day 102)

```
Synchronous (REST):
  Order Service ──HTTP──> Payment Service ──HTTP──> Response
  Problem: Tight coupling, cascading failure

Asynchronous (Queue):
  Order Service ──Message──> [Queue] ──> Payment Worker
  Benefit: Loose coupling, fire & forget, reliable
```

### API Gateway (Day 103)

```
Client ──> [API Gateway :3000] ──> Kisan Service :3001
                                ──> Order Service :3002
                                ──> Payment Service :3003

Gateway handles: Routing, Auth, Rate Limiting, Logging
```

> **Yaad Rakho:** In teen concepts ko solid samajh lo — ye microservices ka foundation hai. Aage RabbitMQ, Kafka, Kubernetes sab isi pe build hoga.

---

## GraphQL Kya Hai?

### REST Ki Problem

```
// User profile chahiye + uske orders + har order ki items
// REST mein 3 alag API calls lagti hain:

GET /api/users/123           → User data
GET /api/users/123/orders    → User ke orders
GET /api/orders/456/items    → Order ki items

// 3 round trips! Mobile pe slow hai
// Aur har response mein extra data bhi aata hai jo chahiye nahi
```

### GraphQL Ka Solution

```graphql
# Ek hi request mein sab kuch maango — sirf wo jo chahiye!
query {
  user(id: "123") {
    naam
    email
    orders {
      id
      amount
      items {
        name
        price
      }
    }
  }
}
```

> **Socho Aise:** REST ek thali hai — sab kuch milta hai chahe chahiye ya nahi. GraphQL ek buffet hai — sirf wo lo jo khana hai!

---

## REST vs GraphQL Comparison

| Feature | REST | GraphQL |
|---------|------|---------|
| Endpoint | Multiple (`/users`, `/orders`) | Single (`/graphql`) |
| Data fetching | Fixed response structure | Client decide kare kya chahiye |
| Over-fetching | Haan — extra data aata hai | Nahi — sirf requested fields |
| Under-fetching | Haan — multiple calls lagti hain | Nahi — ek query mein sab |
| Versioning | `/api/v1/`, `/api/v2/` | Schema evolve hota hai — no versions |
| Caching | Easy (HTTP caching) | Thoda complex |
| Learning curve | Simple | Thoda steep initially |

---

## GraphQL Core Concepts

### 1. Schema — API Ka Blueprint

```graphql
# Schema define karta hai ki kya data available hai

# Types define karo
type Kisan {
  id: ID!
  naam: String!
  gaon: String!
  phone: String
  crops: [Crop!]!
}

type Crop {
  id: ID!
  name: String!
  season: String!
  pricePerKg: Float!
}

type Order {
  id: ID!
  kisan: Kisan!
  items: [String!]!
  amount: Float!
  status: String!
}

# Query type — data padhne ke liye (GET jaisa)
type Query {
  kisans: [Kisan!]!
  kisan(id: ID!): Kisan
  orders: [Order!]!
  order(id: ID!): Order
}

# Mutation type — data change karne ke liye (POST/PUT/DELETE jaisa)
type Mutation {
  createKisan(naam: String!, gaon: String!, phone: String): Kisan!
  createOrder(kisanId: ID!, items: [String!]!, amount: Float!): Order!
  updateOrderStatus(id: ID!, status: String!): Order!
}
```

> **Yaad Rakho:** GraphQL mein `!` matlab required/non-null. `[Kisan!]!` matlab non-null array of non-null Kisans.

### 2. Query — Data Read Karo

```graphql
# Sirf naam aur gaon chahiye — phone nahi
query {
  kisans {
    naam
    gaon
  }
}

# Response:
{
  "data": {
    "kisans": [
      { "naam": "Ramesh", "gaon": "Nashik" },
      { "naam": "Suresh", "gaon": "Pune" }
    ]
  }
}
```

### 3. Mutation — Data Change Karo

```graphql
# Naya kisan register karo
mutation {
  createKisan(naam: "Mahesh", gaon: "Nagpur", phone: "9876543210") {
    id
    naam
    gaon
  }
}

# Response:
{
  "data": {
    "createKisan": {
      "id": "3",
      "naam": "Mahesh",
      "gaon": "Nagpur"
    }
  }
}
```

### 4. Resolvers — Logic Behind Schema

```javascript
// Resolver — har field ke liye data kahan se aayega
const resolvers = {
  Query: {
    // kisans query ka resolver
    kisans: () => {
      return db.kisans.findAll(); // Database se fetch karo
    },
    // Ek kisan — id se dhundho
    kisan: (parent, args) => {
      return db.kisans.findById(args.id);
    },
  },
  Mutation: {
    // Naya kisan banao
    createKisan: (parent, args) => {
      return db.kisans.create({
        naam: args.naam,
        gaon: args.gaon,
        phone: args.phone
      });
    },
  },
  // Nested resolver — Kisan ke crops
  Kisan: {
    crops: (parent) => {
      // parent.id use karke crops dhundho
      return db.crops.findByKisanId(parent.id);
    }
  }
};
```

> **Tip:** Resolver ek function hai jo batata hai ki data kahan se aayega — database se, cache se, ya doosri API se.

---

## GraphQL + Microservices

### Approach 1: GraphQL as API Gateway

```
Client ──GraphQL Query──> [GraphQL Gateway]
                              │
                    ┌─────────┼──────────┐
                    ▼         ▼          ▼
              Kisan API   Order API   Payment API
              (REST)      (REST)      (REST)
```

### Approach 2: Schema Stitching / Federation

```
# Har service ka apna GraphQL schema
Kisan Service → Kisan schema
Order Service → Order schema

# Gateway sab ko merge karta hai
GraphQL Gateway → Combined schema (Apollo Federation)
```

> **Yaad Rakho:** GraphQL API Gateway ke taur pe use hota hai microservices mein — client ko ek endpoint milta hai, gateway internally alag-alag services se data fetch karta hai.

---

## GraphQL Playground

GraphQL ke saath ek built-in playground milta hai jahan queries test kar sakte ho — Postman ki tarah lekin better.

```
URL: http://localhost:4000/graphql

# Left panel mein query likho:
query {
  kisans {
    naam
    gaon
    crops {
      name
      pricePerKg
    }
  }
}

# Play button dabao — right panel mein result aayega!
```

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| GraphQL | API query language — client decide kare kya data chahiye |
| Schema | API ka blueprint — types + queries + mutations |
| Query | Data padhna (GET jaisa) |
| Mutation | Data change karna (POST/PUT/DELETE jaisa) |
| Resolver | Function jo batata hai data kahan se aayega |
| Over-fetching | REST problem — extra data aata hai |
| Under-fetching | REST problem — multiple calls lagti hain |
| Playground | Browser mein GraphQL queries test karo |

---

## Aaj Kya Seekha?

- Week 15 ka complete revision — microservices, communication, gateway
- GraphQL kya hai aur REST se kaise alag hai
- Schema, Query, Mutation aur Resolver concepts
- GraphQL microservices ke saath kaise use hota hai
- GraphQL Playground for testing
