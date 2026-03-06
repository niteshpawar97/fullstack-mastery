# Day 104 Evening: Hands-On — GraphQL API Project (Kisan Mandi)

> **Practice Time!** Ab hum ek complete GraphQL API banayenge — "Kisan Mandi" app jahan kisans, crops, aur orders manage karenge. Apollo Server use karenge jo Node.js ka most popular GraphQL framework hai.

---

## Setup: Project Initialize

> **Terminal Command:**
> ```bash
> mkdir kisan-mandi-graphql && cd kisan-mandi-graphql
> npm init -y
> npm install @apollo/server graphql
> ```

---

## Task 1: Schema Define Karo

```javascript
// schema.js
const typeDefs = `#graphql
  # Kisan type — kisan ki poori info
  type Kisan {
    id: ID!
    naam: String!
    gaon: String!
    phone: String!
    crops: [Crop!]!
    orders: [Order!]!
  }

  # Crop type — fasal ki info
  type Crop {
    id: ID!
    name: String!
    season: String!
    pricePerKg: Float!
    kisanId: ID!
  }

  # Order type — order ki info
  type Order {
    id: ID!
    kisanId: ID!
    kisan: Kisan
    items: [String!]!
    totalAmount: Float!
    status: OrderStatus!
    createdAt: String!
  }

  # Enum — fixed options
  enum OrderStatus {
    PENDING
    CONFIRMED
    SHIPPED
    DELIVERED
    CANCELLED
  }

  # Queries — data padhne ke liye
  type Query {
    # Saare kisans — optional filter gaon se
    kisans(gaon: String): [Kisan!]!
    # Ek kisan id se
    kisan(id: ID!): Kisan
    # Saare crops — optional filter season se
    crops(season: String): [Crop!]!
    # Saare orders
    orders(status: OrderStatus): [Order!]!
    # Ek order
    order(id: ID!): Order
    # Dashboard stats
    stats: DashboardStats!
  }

  # Dashboard stats
  type DashboardStats {
    totalKisans: Int!
    totalOrders: Int!
    totalRevenue: Float!
    topCrop: String
  }

  # Mutations — data change karne ke liye
  type Mutation {
    # Naya kisan register
    createKisan(naam: String!, gaon: String!, phone: String!): Kisan!
    # Nayi crop add
    addCrop(kisanId: ID!, name: String!, season: String!, pricePerKg: Float!): Crop!
    # Naya order
    createOrder(kisanId: ID!, items: [String!]!, totalAmount: Float!): Order!
    # Order status update
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
  }
`;

module.exports = typeDefs;
```

---

## Task 2: In-Memory Database Banao

```javascript
// database.js
// Demo ke liye in-memory data — production mein MongoDB/PostgreSQL hoga

let kisanCounter = 3;
let cropCounter = 4;
let orderCounter = 2;

const kisans = [
  { id: '1', naam: 'Ramesh Patil', gaon: 'Nashik', phone: '9876543210' },
  { id: '2', naam: 'Suresh Yadav', gaon: 'Pune', phone: '9876543211' },
  { id: '3', naam: 'Lakshmi Devi', gaon: 'Nashik', phone: '9876543212' },
];

const crops = [
  { id: '1', kisanId: '1', name: 'Tomato', season: 'Kharif', pricePerKg: 40 },
  { id: '2', kisanId: '1', name: 'Onion', season: 'Rabi', pricePerKg: 25 },
  { id: '3', kisanId: '2', name: 'Wheat', season: 'Rabi', pricePerKg: 30 },
  { id: '4', kisanId: '3', name: 'Cotton', season: 'Kharif', pricePerKg: 60 },
];

const orders = [
  { id: 'ORD-0001', kisanId: '1', items: ['Urea 50kg', 'DAP 25kg'], totalAmount: 3500, status: 'DELIVERED', createdAt: '2026-04-01T10:00:00Z' },
  { id: 'ORD-0002', kisanId: '2', items: ['Seeds Pack'], totalAmount: 800, status: 'PENDING', createdAt: '2026-04-03T14:30:00Z' },
];

module.exports = {
  kisans, crops, orders,
  getNextKisanId: () => String(++kisanCounter),
  getNextCropId: () => String(++cropCounter),
  getNextOrderId: () => `ORD-${String(++orderCounter).padStart(4, '0')}`,
};
```

---

## Task 3: Resolvers Likho

```javascript
// resolvers.js
const db = require('./database');

const resolvers = {
  // === QUERIES ===
  Query: {
    // Saare kisans — gaon filter optional
    kisans: (_, { gaon }) => {
      if (gaon) {
        return db.kisans.filter(k => k.gaon.toLowerCase() === gaon.toLowerCase());
      }
      return db.kisans;
    },

    // Ek kisan by ID
    kisan: (_, { id }) => {
      return db.kisans.find(k => k.id === id) || null;
    },

    // Saare crops — season filter optional
    crops: (_, { season }) => {
      if (season) {
        return db.crops.filter(c => c.season.toLowerCase() === season.toLowerCase());
      }
      return db.crops;
    },

    // Saare orders — status filter optional
    orders: (_, { status }) => {
      if (status) {
        return db.orders.filter(o => o.status === status);
      }
      return db.orders;
    },

    // Ek order by ID
    order: (_, { id }) => {
      return db.orders.find(o => o.id === id) || null;
    },

    // Dashboard stats
    stats: () => {
      const totalRevenue = db.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      // Sabse zyada crops kaunsi
      const cropCount = {};
      db.crops.forEach(c => {
        cropCount[c.name] = (cropCount[c.name] || 0) + 1;
      });
      const topCrop = Object.entries(cropCount).sort((a, b) => b[1] - a[1])[0];

      return {
        totalKisans: db.kisans.length,
        totalOrders: db.orders.length,
        totalRevenue,
        topCrop: topCrop ? topCrop[0] : null,
      };
    },
  },

  // === MUTATIONS ===
  Mutation: {
    createKisan: (_, { naam, gaon, phone }) => {
      const newKisan = { id: db.getNextKisanId(), naam, gaon, phone };
      db.kisans.push(newKisan);
      console.log(`[GraphQL] Naya kisan: ${naam} (${gaon})`);
      return newKisan;
    },

    addCrop: (_, { kisanId, name, season, pricePerKg }) => {
      // Kisan exist karta hai check karo
      const kisan = db.kisans.find(k => k.id === kisanId);
      if (!kisan) throw new Error(`Kisan ${kisanId} nahi mila!`);

      const newCrop = { id: db.getNextCropId(), kisanId, name, season, pricePerKg };
      db.crops.push(newCrop);
      console.log(`[GraphQL] Nayi crop: ${name} by ${kisan.naam}`);
      return newCrop;
    },

    createOrder: (_, { kisanId, items, totalAmount }) => {
      const kisan = db.kisans.find(k => k.id === kisanId);
      if (!kisan) throw new Error(`Kisan ${kisanId} nahi mila!`);

      const newOrder = {
        id: db.getNextOrderId(),
        kisanId,
        items,
        totalAmount,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      db.orders.push(newOrder);
      console.log(`[GraphQL] Naya order: ${newOrder.id} — Rs ${totalAmount}`);
      return newOrder;
    },

    updateOrderStatus: (_, { id, status }) => {
      const order = db.orders.find(o => o.id === id);
      if (!order) throw new Error(`Order ${id} nahi mila!`);
      order.status = status;
      console.log(`[GraphQL] Order ${id} status → ${status}`);
      return order;
    },
  },

  // === NESTED RESOLVERS ===
  Kisan: {
    // Kisan ke crops dhundho
    crops: (parent) => {
      return db.crops.filter(c => c.kisanId === parent.id);
    },
    // Kisan ke orders dhundho
    orders: (parent) => {
      return db.orders.filter(o => o.kisanId === parent.id);
    },
  },

  Order: {
    // Order ka kisan dhundho
    kisan: (parent) => {
      return db.kisans.find(k => k.id === parent.kisanId);
    },
  },
};

module.exports = resolvers;
```

> **Yaad Rakho:** Nested resolvers (Kisan.crops, Order.kisan) automatically resolve hote hain jab client wo nested data maange. Agar nahi maanga to resolver call hi nahi hoga — performance save!

---

## Task 4: Server Start Karo

```javascript
// server.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`Kisan Mandi GraphQL API chalu hai: ${url}`);
  console.log(`Playground kholo browser mein: ${url}`);
}

startServer();
```

> **Terminal Command:**
> ```bash
> node server.js
> # Output: Kisan Mandi GraphQL API chalu hai: http://localhost:4000/
> ```

---

## Task 5: Queries Test Karo (Playground mein)

Browser mein jaao: `http://localhost:4000`

```graphql
# Query 1: Saare kisans with crops
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

# Query 2: Nashik ke kisans
query {
  kisans(gaon: "Nashik") {
    naam
    phone
  }
}

# Query 3: Dashboard stats
query {
  stats {
    totalKisans
    totalOrders
    totalRevenue
    topCrop
  }
}

# Mutation 1: Naya kisan
mutation {
  createKisan(naam: "Govind Sharma", gaon: "Jaipur", phone: "9998887776") {
    id
    naam
  }
}

# Mutation 2: Order banao aur status update karo
mutation {
  createOrder(kisanId: "1", items: ["Tractor Rent", "Pesticide"], totalAmount: 12000) {
    id
    status
    kisan {
      naam
    }
  }
}
```

> **Expected Output:**
> ```json
> {
>   "data": {
>     "kisans": [
>       {
>         "naam": "Ramesh Patil",
>         "gaon": "Nashik",
>         "crops": [
>           { "name": "Tomato", "pricePerKg": 40 },
>           { "name": "Onion", "pricePerKg": 25 }
>         ]
>       }
>     ]
>   }
> }
> ```

---

## Mini Challenge

1. Ek **Subscription** add karo — jab naya order aaye to real-time notification
2. **Pagination** implement karo — `kisans(limit: 10, offset: 0)`
3. **Input validation** add karo — phone number 10 digits hona chahiye

---

## Quick Revision

| Concept | Kya Seekha |
|---------|-----------|
| Apollo Server | Node.js ka popular GraphQL framework |
| typeDefs | Schema define — types, queries, mutations |
| Resolvers | Functions jo data fetch/modify karte hain |
| Nested Resolvers | Related data automatically resolve hota hai |
| Playground | Browser mein queries test karo |
| Enum | Fixed set of values (OrderStatus) |

---

## Aaj Kya Seekha?

- Complete GraphQL API banaayi Apollo Server ke saath
- Schema design — types, queries, mutations, enums
- Resolvers — root resolvers + nested resolvers
- In-memory database se data serve kiya
- GraphQL Playground mein queries aur mutations test kiye
- Week 15 revision complete kiya
