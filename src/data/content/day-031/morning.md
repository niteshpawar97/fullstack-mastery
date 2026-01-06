# Day 31 - Morning Session: Express.js Introduction

> **Aaj ka plan:**
> Aaj hum Node.js ke sabse popular framework — Express.js — se milenge. Raw `http` module se aage badh ke, Express ke saath professional web servers banana seekhenge.

---

## Express.js Kya Hai?

Express.js ek **fast, unopinionated, minimalist web framework** hai Node.js ke liye. Socho agar Node.js ek engine hai, toh Express uska steering wheel hai — control easy ho jaata hai.

> **Socho Aise:**
> Raw `http` module se server banana = cycle chalana.
> Express se server banana = car chalana.
> Dono se destination pahunchoge, par Express wala raasta comfortable hai!

### Express Kyun Use Karte Hain?

| Feature | Raw `http` Module | Express.js |
|---------|-------------------|------------|
| Routing | Manually `if-else` | `app.get()`, `app.post()` |
| Middleware | Nahi hai | Built-in support |
| JSON Parsing | Manual | `express.json()` |
| Static Files | Manual code | `express.static()` |
| Code Length | Bahut zyada | Bahut kam |
| Community | Limited | Massive ecosystem |

---

## Express Install Karna

> **Terminal Command:**
> ```bash
> # Naya project banao
> mkdir mera-express-app
> cd mera-express-app
> npm init -y
> 
> # Express install karo
> npm install express
> ```

Package.json mein `dependencies` mein express aa jayega:

```json
{
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

---

## Pehla Express App

```javascript
// index.js - Pehla Express server
const express = require('express');

// Express application banao
const app = express();

// Port define karo
const PORT = 3000;

// Pehla route - jab koi "/" pe aaye
app.get('/', (req, res) => {
  res.send('Namaste Duniya! Express chal raha hai! 🚀');
});

// Server start karo
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} pe`);
  console.log(`Browser mein jaao: http://localhost:${PORT}`);
});
```

> **Terminal Command:**
> ```bash
> node index.js
> ```

> **Expected Output:**
> ```
> Server chal raha hai port 3000 pe
> Browser mein jaao: http://localhost:3000
> ```

---

## Raw http vs Express — Code Comparison

### Raw http module se:
```javascript
// RAW http - lambi approach
const http = require('http');

const server = http.createServer((req, res) => {
  // Manually route check karo
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Home Page');
  } else if (req.url === '/about' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('About Page');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page nahi mila');
  }
});

server.listen(3000);
```

### Express se (same kaam):
```javascript
// EXPRESS - clean aur simple
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Home Page'));
app.get('/about', (req, res) => res.send('About Page'));

app.listen(3000);
```

> **Yaad Rakho:**
> Express internally raw `http` module hi use karta hai. Yeh uske upar ek powerful layer hai — jaise React DOM manipulation ke upar ek layer hai.

---

## app.get() — Routes Banana

```javascript
const express = require('express');
const app = express();

// Home route
app.get('/', (req, res) => {
  res.send('Home Page - Swagat hai!');
});

// About route
app.get('/about', (req, res) => {
  res.send('Yeh meri pehli Express app hai');
});

// Contact route
app.get('/contact', (req, res) => {
  res.send('Email: farmer@kisanmarket.com');
});

app.listen(3000, () => console.log('Server ready!'));
```

> **Tip:**
> Har `app.get()` ka pehla argument URL path hai aur doosra ek callback function hai jo `req` (request) aur `res` (response) leta hai.

---

## req aur res Objects Samajhna

### req (Request) — Client ne kya bheja?
```javascript
app.get('/search', (req, res) => {
  console.log(req.method);    // "GET"
  console.log(req.url);       // "/search?q=tomato"
  console.log(req.query);     // { q: "tomato" }
  console.log(req.headers);   // request headers
  console.log(req.ip);        // client ka IP address

  res.send('Search results aa rahe hain...');
});
```

### res (Response) — Server kya bhejega?
```javascript
app.get('/demo', (req, res) => {
  // Text bhejo
  res.send('Plain text response');

  // Ya HTML bhejo
  // res.send('<h1>HTML Response</h1>');

  // Ya JSON bhejo
  // res.json({ message: 'JSON response' });

  // Ya status code ke saath
  // res.status(404).send('Nahi mila!');
});
```

---

## Response Ke Tarike

### 1. res.send() — Text ya HTML
```javascript
app.get('/text', (req, res) => {
  res.send('Yeh plain text hai');
});

app.get('/html', (req, res) => {
  res.send('<h1>Yeh HTML hai</h1><p>Express se aaya</p>');
});
```

### 2. res.json() — JSON Data (API ke liye)
```javascript
app.get('/api/kisan', (req, res) => {
  // JSON response - API banane ke liye best
  res.json({
    name: 'Ramesh Kumar',
    crop: 'Wheat',
    village: 'Sultanpur',
    price_per_quintal: 2200
  });
});
```

### 3. res.status() — Status Code Set Karo
```javascript
app.get('/api/product/:id', (req, res) => {
  const productId = req.params.id;

  // Agar product nahi mila
  if (!productId) {
    return res.status(400).json({
      error: 'Product ID do pehle!'
    });
  }

  // Success response
  res.status(200).json({
    id: productId,
    name: 'Organic Tomato',
    price: 40
  });
});
```

> **Yaad Rakho:**
> `res.json()` automatically `Content-Type: application/json` header set kar deta hai. `res.send()` mein manually karna padta hai agar JSON bhej rahe ho.

---

## Query Parameters Padhna

```javascript
// URL: /api/crops?season=kharif&state=UP
app.get('/api/crops', (req, res) => {
  const season = req.query.season;  // "kharif"
  const state = req.query.state;    // "UP"

  res.json({
    message: `${state} ke ${season} crops`,
    filters: req.query
  });
});
```

> **Example:**
> Browser mein jaao: `http://localhost:3000/api/crops?season=rabi&state=MP`
> Response milega:
> ```json
> {
>   "message": "MP ke rabi crops",
>   "filters": { "season": "rabi", "state": "MP" }
> }
> ```

---

## Nodemon — Auto Restart

Har baar code change pe `node index.js` run karna boring hai. Nodemon use karo!

> **Terminal Command:**
> ```bash
> # Globally install karo
> npm install -g nodemon
> 
> # Ab nodemon se run karo
> nodemon index.js
> ```

> **Tip:**
> Package.json mein script add karo:
> ```json
> "scripts": {
>   "start": "node index.js",
>   "dev": "nodemon index.js"
> }
> ```
> Ab `npm run dev` se server start hoga aur code save karte hi restart hoga!

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| `express()` | Express app banata hai | `const app = express()` |
| `app.get()` | GET route define karta hai | `app.get('/home', handler)` |
| `app.listen()` | Server start karta hai | `app.listen(3000)` |
| `req.query` | URL ke query params | `?name=ravi` → `req.query.name` |
| `req.params` | Route parameters | `/:id` → `req.params.id` |
| `res.send()` | Text/HTML response | `res.send('Hello')` |
| `res.json()` | JSON response | `res.json({ key: val })` |
| `res.status()` | HTTP status code | `res.status(404)` |
| `nodemon` | Auto-restart tool | `nodemon index.js` |

---

## Aaj Kya Seekha?

1. **Express.js** Node.js ka sabse popular web framework hai — fast aur simple
2. **Raw http vs Express** — Express routing, middleware, aur response handling ko bahut easy banata hai
3. **app.get()** se GET routes banate hain aur **app.listen()** se server start hota hai
4. **req** object mein client ki request ki info hoti hai (query, params, headers)
5. **res** object se response bhejte hain — `send()`, `json()`, `status()` methods
6. **Nodemon** se development mein auto-restart milta hai — har save pe server khud restart hota hai

> **Practice Time!**
> Evening session mein hum multiple routes wala Express server banayenge, query params handle karenge, aur JSON APIs likhenge. Ready raho!
