# Day 33 - Morning Session: REST API Design Principles

> **Aaj ka plan:**
> Aaj hum API banana nahi, **design** karna seekhenge. REST architecture kya hai, endpoints kaise name karo, HTTP methods ka sahi use, status codes — yeh sab samjhenge. Ek ache API ka foundation design mein hota hai!

---

## REST Kya Hai?

REST = **RE**presentational **S**tate **T**ransfer

Yeh ek **architectural style** hai APIs banane ka. Yeh koi library ya framework nahi hai — yeh ek set of **rules/guidelines** hai.

> **Socho Aise:**
> Jaise traffic rules hain — red light pe ruko, green pe chalo. REST bhi APIs ke liye rules hai. Agar sab follow karein, toh sabko samajh aayega aur koi confusion nahi hoga.

### REST ke Core Principles

| Principle | Matlab | Example |
|-----------|--------|---------|
| **Client-Server** | Frontend aur Backend alag hain | React app + Express API |
| **Stateless** | Server ko yaad nahi ki pehle kya hua | Har request mein token bhejo |
| **Uniform Interface** | Sab API ek jaisa format follow karein | `/api/users`, `/api/products` |
| **Resource-Based** | Har cheez ek "resource" hai | User, Product, Order = resources |

---

## Resources Kya Hain?

API mein jo bhi data hai, woh ek **resource** hai. Har resource ka ek **URL (endpoint)** hota hai.

```
Real World              →  API Resource     →  Endpoint
-------------------------------------------------------------
Kisan (Farmer)          →  User             →  /api/users
Fasal (Crop)            →  Crop             →  /api/crops
Order                   →  Order            →  /api/orders
Mandi ka rate           →  Price            →  /api/prices
Product ki photo        →  Image            →  /api/images
```

> **Yaad Rakho:**
> Resource names hamesha **plural noun** (bahuvachan) mein hone chahiye:
> - `/api/users` (SAHI) not `/api/user` (GALAT)
> - `/api/crops` (SAHI) not `/api/getCrops` (GALAT)
> - `/api/orders` (SAHI) not `/api/createOrder` (GALAT)

---

## HTTP Methods — CRUD Mapping

Har operation ke liye ek specific HTTP method hota hai:

| CRUD Operation | HTTP Method | Meaning | Example |
|---------------|-------------|---------|---------|
| **C**reate | `POST` | Naya resource banao | Naya user register |
| **R**ead | `GET` | Data leke aao | Users ki list dekho |
| **U**pdate | `PUT` / `PATCH` | Data update karo | User ka naam badlo |
| **D**elete | `DELETE` | Data hatao | Account delete karo |

### PUT vs PATCH

```javascript
// PUT - Poora resource replace karo (saare fields bhejo)
// PUT /api/users/1
{
  "name": "Ramesh Kumar",    // Naam change kiya
  "role": "farmer",          // Baaki sab same
  "village": "Sultanpur",    // Sab fields bhejne padte hain
  "phone": "9876543210"
}

// PATCH - Sirf jo change karna hai woh bhejo
// PATCH /api/users/1
{
  "name": "Ramesh Kumar"     // Sirf naam bheja, baaki same rahega
}
```

> **Tip:**
> Real projects mein `PATCH` zyada use hota hai kyunki sirf changed fields bhejna efficient hai. Par `PUT` bhi bahut common hai.

---

## URL Naming Conventions

### Sahi Tarika (RESTful)

```
GET    /api/users              → Saare users lao
GET    /api/users/123          → User #123 lao
POST   /api/users              → Naya user banao
PUT    /api/users/123          → User #123 update karo
DELETE /api/users/123          → User #123 delete karo

GET    /api/users/123/orders   → User #123 ke orders
POST   /api/users/123/orders   → User #123 ka naya order banao
```

### Galat Tarika (Avoid karo!)

```
GET /api/getUsers              ❌ Verb mat daalo URL mein
GET /api/user                  ❌ Singular mat use karo
POST /api/createUser           ❌ HTTP method hi verb hai
GET /api/Users                 ❌ Capital letters mat use karo
GET /api/user_list             ❌ Underscore avoid karo
GET /api/get-all-users         ❌ Action URL mein mat likho
```

### Naming Rules

| Rule | Sahi | Galat |
|------|------|-------|
| Lowercase use karo | `/api/users` | `/api/Users` |
| Plural nouns | `/api/products` | `/api/product` |
| Hyphens use karo | `/api/crop-prices` | `/api/crop_prices` |
| Verbs mat daalo | `POST /api/users` | `POST /api/createUser` |
| Nesting for relations | `/api/users/1/orders` | `/api/user-orders?userId=1` |

---

## HTTP Status Codes

Status codes server ki response mein ek number hota hai jo batata hai ki request ka kya hua.

### Success Codes (2xx) — Sab Sahi

| Code | Name | Kab Use Karein |
|------|------|----------------|
| `200` | OK | GET successful, general success |
| `201` | Created | POST se naya resource bana |
| `204` | No Content | DELETE successful (koi body nahi) |

### Client Error (4xx) — Client Ki Galti

| Code | Name | Kab Use Karein |
|------|------|----------------|
| `400` | Bad Request | Galat data bheja (validation fail) |
| `401` | Unauthorized | Login nahi kiya / token nahi hai |
| `403` | Forbidden | Login hai par permission nahi hai |
| `404` | Not Found | Resource exist nahi karta |
| `409` | Conflict | Duplicate data (email already exists) |
| `422` | Unprocessable | Data format sahi par values galat |

### Server Error (5xx) — Server Ki Galti

| Code | Name | Kab Use Karein |
|------|------|----------------|
| `500` | Internal Server Error | Server mein kuch toot gaya |
| `503` | Service Unavailable | Server busy ya maintenance mein |

> **Socho Aise:**
> - **2xx** = "Sab badhiya!" (green signal)
> - **4xx** = "Tumhari galti hai bhai!" (client ne kuch galat kiya)
> - **5xx** = "Humari galti hai, sorry!" (server mein problem)

---

## API Versioning

Jab API update karo, purane clients toothne nahi chahiye. Versioning se yeh solve hota hai.

```
// Version 1 — current
GET /api/v1/users
GET /api/v1/crops

// Version 2 — naye features ke saath
GET /api/v2/users      → Extra fields added
GET /api/v2/crops      → Different response format
```

```javascript
// Express mein versioning
const v1UserRoutes = require('./routes/v1/userRoutes');
const v2UserRoutes = require('./routes/v2/userRoutes');

app.use('/api/v1/users', v1UserRoutes);
app.use('/api/v2/users', v2UserRoutes);
```

> **Tip:**
> Version 1 se start karo. Jab major changes aayein toh V2 banao. Purana V1 bhi kuch time tak chalta rahe.

---

## Request / Response Format

### Request Format (Client bhejta hai)

```http
POST /api/v1/users HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

{
  "name": "Ramesh Kumar",
  "role": "farmer",
  "village": "Sultanpur"
}
```

### Response Format (Server bhejta hai)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Ramesh Kumar",
    "role": "farmer",
    "village": "Sultanpur",
    "createdAt": "2026-04-04T10:30:00Z"
  },
  "message": "User successfully created"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation failed",
    "details": [
      { "field": "name", "message": "Name is required" },
      { "field": "role", "message": "Role must be farmer, trader, or admin" }
    ]
  }
}
```

> **Yaad Rakho:**
> Response format **consistent** rakhna bahut zaroori hai. Har response mein `success` field ho, data ya error ho — toh frontend developer khush rahega!

---

## Complete REST API Design Example — Blog System

```
Blog System Resources:
- Posts (articles)
- Comments (on posts)
- Users (authors)
- Categories

Endpoints:

USERS:
GET    /api/v1/users              → List all users
GET    /api/v1/users/:id          → Get one user
POST   /api/v1/users              → Create user (register)
PUT    /api/v1/users/:id          → Update user profile
DELETE /api/v1/users/:id          → Delete user

POSTS:
GET    /api/v1/posts              → List all posts
GET    /api/v1/posts/:id          → Get one post
POST   /api/v1/posts              → Create new post
PUT    /api/v1/posts/:id          → Update post
DELETE /api/v1/posts/:id          → Delete post

COMMENTS (nested under posts):
GET    /api/v1/posts/:id/comments     → Post ke saare comments
POST   /api/v1/posts/:id/comments     → Post pe naya comment
DELETE /api/v1/posts/:id/comments/:cid → Comment delete karo

CATEGORIES:
GET    /api/v1/categories          → All categories
POST   /api/v1/categories          → New category

FILTERING & PAGINATION:
GET /api/v1/posts?category=tech&page=2&limit=10&sort=-createdAt
```

---

## Quick Revision Table

| Concept | Rule | Example |
|---------|------|---------|
| Resource Names | Plural nouns, lowercase | `/api/users`, `/api/crops` |
| CRUD → HTTP | Create=POST, Read=GET, Update=PUT, Delete=DELETE | `POST /api/users` |
| Status 200 | Success — data mil gaya | `GET /api/users` sahi chala |
| Status 201 | Created — naya bana | `POST /api/users` success |
| Status 400 | Bad Request — galat input | Validation fail |
| Status 401 | Unauthorized — login karo | Token missing |
| Status 404 | Not Found — nahi mila | User ID galat |
| Status 500 | Server Error — bug hai | Code crash hua |
| Versioning | `/api/v1/` prefix | Future-proof API |
| Response Format | Consistent JSON structure | `{ success, data/error }` |

---

## Aaj Kya Seekha?

1. **REST** ek architectural style hai — rules/guidelines ka set, koi library nahi
2. **Resources** plural nouns mein hone chahiye — `/api/users`, `/api/products`
3. **HTTP methods** CRUD operations ke liye map hote hain — GET, POST, PUT/PATCH, DELETE
4. **Status codes** sahi use karna professional API ki pehchaan hai — 2xx, 4xx, 5xx
5. **URL naming** mein verbs avoid karo, lowercase use karo, hyphens for multi-word
6. **Versioning** se purane clients safe rehte hain jab API update hota hai
7. **Consistent response format** frontend developers ki zindagi easy bana deta hai

> **Practice Time!**
> Evening mein hum blog system ka REST API design implement karenge Express mein!
