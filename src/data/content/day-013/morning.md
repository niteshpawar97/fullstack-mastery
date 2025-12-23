# Day 13 Morning: HTTP Basics + Pehla Node.js Server — Internet Kaise Kaam Karta Hai

> **Aaj ka plan:** Aaj hum samjhenge ki HTTP protocol kya hai, request-response cycle kaise kaam karta hai, status codes, HTTP methods, aur Node.js ke `http` module se apna pehla server banayenge with routing!

---

## HTTP Kya Hai?

### HyperText Transfer Protocol

HTTP ek **protocol** (set of rules) hai jo batata hai ki browser (client) aur server ke beech data kaise transfer hoga.

> **Socho Aise:** Socho tum ek restaurant mein ho. Tum waiter ko order dete ho (request) — waiter kitchen mein jaata hai, chef khana banata hai, waiter tumhe khana le ke aata hai (response). HTTP bhi aise hi kaam karta hai — tumhara browser waiter hai, server kitchen hai!

### Request-Response Cycle

```
┌──────────┐                           ┌──────────┐
│          │  ──── HTTP Request ────>   │          │
│  Client  │                           │  Server  │
│ (Browser)│  <── HTTP Response ────   │ (Node.js)│
│          │                           │          │
└──────────┘                           └──────────┘
```

1. **Client** (browser/app) ek **Request** bhejta hai
2. **Server** request process karta hai
3. **Server** ek **Response** wapas bhejta hai
4. **Client** response ko display karta hai

> **Example:** Jab tum browser mein `google.com` type karte ho:
> 1. Browser Google ke server ko HTTP Request bhejta hai
> 2. Google ka server HTML page bana ke Response bhejta hai
> 3. Browser wo HTML render karta hai — tumhe Google dikhta hai

---

## HTTP Request Kya Hota Hai?

Har request mein ye hota hai:

### 1. HTTP Method (Kya Karna Hai)

| Method | Kaam | Real-World Example |
|--------|------|-------------------|
| **GET** | Data lao (read) | "Meri profile dikhao" |
| **POST** | Naya data banao (create) | "Naya order place karo" |
| **PUT** | Poora data update karo | "Mera address badlo" |
| **PATCH** | Partial update | "Sirf phone number update karo" |
| **DELETE** | Data mitao | "Ye order cancel karo" |

> **Socho Aise:** Kisan mandi ke terms mein:
> - **GET** = "Aaj tomato ka rate kya hai?" (sirf puchh rahe ho)
> - **POST** = "500 kg tomato bechna hai — naya entry karo" (nayi cheez bana rahe ho)
> - **PUT** = "Wo entry galat thi, 600 kg hai — poora update karo"
> - **DELETE** = "Wo entry cancel karo" (mitana hai)

### 2. URL (Kahan Bhej Rahe Ho)

```
https://api.example.com/students/42?format=json
  │         │              │     │      │
  │         │              │     │      └── Query Parameter
  │         │              │     └── Resource ID
  │         │              └── Path (route)
  │         └── Domain (server address)
  └── Protocol (https = secure)
```

### 3. Headers (Extra Information)

```
Content-Type: application/json      ← Data ka format
Authorization: Bearer token123      ← Authentication
User-Agent: Chrome/120              ← Kaun bhej raha hai
Accept: text/html                   ← Kya chahiye response mein
```

### 4. Body (Data — sirf POST/PUT/PATCH mein)

```json
{
    "name": "Rahul",
    "age": 20,
    "course": "Full Stack"
}
```

---

## HTTP Response Kya Hota Hai?

Server ka jawab:

### 1. Status Code (Kya Hua)

| Range | Matlab | Example |
|-------|--------|---------|
| **1xx** | Information | 100 Continue |
| **2xx** | Success ✅ | 200 OK, 201 Created |
| **3xx** | Redirect ↗️ | 301 Moved, 304 Not Modified |
| **4xx** | Client Error ❌ | 400 Bad Request, 404 Not Found |
| **5xx** | Server Error 💥 | 500 Internal Error, 503 Service Down |

### Important Status Codes — Yaad Karo!

| Code | Name | Matlab |
|------|------|--------|
| **200** | OK | Sab theek hai, data le lo |
| **201** | Created | Naya resource ban gaya |
| **204** | No Content | Kaam ho gaya, lekin kuch return nahi karna |
| **400** | Bad Request | Tumne galat data bheja |
| **401** | Unauthorized | Login nahi kiya / token galat |
| **403** | Forbidden | Permission nahi hai |
| **404** | Not Found | Page/resource nahi mila |
| **500** | Internal Server Error | Server mein kuch toot gaya |

> **Yaad Rakho:** 
> - **2xx** = Kaam ho gaya (khush raho!)
> - **4xx** = Tumhari galti hai (client side)
> - **5xx** = Server ki galti hai (backend developer dekhega)

> **Socho Aise:** 
> - **200** = Waiter khana le aaya (sab theek!)
> - **404** = "Sorry sir, ye dish available nahi hai" (not found)
> - **401** = "Sir pehle membership card dikhao" (unauthorized)
> - **500** = "Kitchen mein aag lag gayi" (server crashed!)

### 2. Response Headers + Body

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 85

{
    "status": "success",
    "data": { "name": "Rahul", "grade": "A" }
}
```

---

## Node.js http Module — Pehla Server!

### Basic Server — Hello World

```javascript
// server.js — Pehla Node.js HTTP server
const http = require("http");

// Server banao
const server = http.createServer((req, res) => {
    // req = incoming request ki info
    // res = response jo hum bhejenge

    // Response header set karo
    res.writeHead(200, { "Content-Type": "text/plain" });

    // Response body bhejo
    res.end("Namaste Duniya! Ye mera pehla server hai!");
});

// Server start karo port 3000 pe
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server chal raha hai: http://localhost:${PORT}`);
    console.log("Band karne ke liye Ctrl+C dabao");
});
```

> **Terminal Command:**
> ```bash
> node server.js
> ```

Ab browser mein jao: `http://localhost:3000` — tumhe "Namaste Duniya!" dikhega!

> **Yaad Rakho:**
> - `req` (request) — client ne kya bheja
> - `res` (response) — hum kya bhej rahe hain
> - `res.writeHead()` — status code aur headers set karo
> - `res.end()` — response bhejo aur connection band karo
> - Server band karne ke liye terminal mein `Ctrl + C` dabao

---

## Request Object (req) — Client Ne Kya Bheja?

```javascript
const server = http.createServer((req, res) => {
    // Request ki information
    console.log("Method:", req.method);       // GET, POST, etc.
    console.log("URL:", req.url);             // /about, /api/students
    console.log("Headers:", req.headers);     // Object with all headers

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`Tumne ${req.method} request bheja ${req.url} pe`);
});
```

---

## Routing Basics — Alag Alag Pages

### Simple Router

```javascript
// router-server.js — Multiple routes wala server
const http = require("http");

const server = http.createServer((req, res) => {
    const url = req.url;
    const method = req.method;

    console.log(`${method} ${url}`);  // Terminal mein request log karo

    // Route handling
    if (url === "/" && method === "GET") {
        // Home page
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
            <html>
            <head><title>Kisan Dashboard</title></head>
            <body>
                <h1>🌾 Kisan Dashboard</h1>
                <p>Namaste! Aapka swagat hai.</p>
                <ul>
                    <li><a href="/about">About</a></li>
                    <li><a href="/crops">Crops</a></li>
                    <li><a href="/contact">Contact</a></li>
                </ul>
            </body>
            </html>
        `);
    }
    else if (url === "/about" && method === "GET") {
        // About page
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
            <html>
            <body>
                <h1>About Kisan Dashboard</h1>
                <p>Ye ek simple farming management tool hai.</p>
                <a href="/">🏠 Home</a>
            </body>
            </html>
        `);
    }
    else if (url === "/crops" && method === "GET") {
        // Crops data (JSON response)
        const crops = [
            { name: "Tomato", price: 40, season: "Kharif" },
            { name: "Wheat", price: 25, season: "Rabi" },
            { name: "Onion", price: 30, season: "Kharif" },
            { name: "Rice", price: 35, season: "Kharif" }
        ];
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success", data: crops }, null, 2));
    }
    else if (url === "/contact" && method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
            <html>
            <body>
                <h1>Contact Us</h1>
                <p>Email: kisan@dashboard.com</p>
                <p>Phone: +91 98765 43210</p>
                <a href="/">🏠 Home</a>
            </body>
            </html>
        `);
    }
    else {
        // 404 — Page not found
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
            <html>
            <body>
                <h1>404 - Page Not Found!</h1>
                <p>"${url}" ye page nahi mila.</p>
                <a href="/">🏠 Home pe jao</a>
            </body>
            </html>
        `);
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Kisan Dashboard server chal raha hai!`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`\nAvailable routes:`);
    console.log(`  GET /        — Home page`);
    console.log(`  GET /about   — About page`);
    console.log(`  GET /crops   — Crops data (JSON)`);
    console.log(`  GET /contact — Contact page`);
    console.log(`\nBand karne ke liye: Ctrl+C`);
});
```

> **Terminal Command:**
> ```bash
> node router-server.js
> ```

Ab browser mein try karo:
- `http://localhost:3000/` — Home page
- `http://localhost:3000/about` — About page
- `http://localhost:3000/crops` — JSON data
- `http://localhost:3000/xyz` — 404 page

---

## Content Types — Kya Bhej Rahe Ho?

| Content-Type | Kab Use Karo |
|-------------|-------------|
| `text/plain` | Simple text response |
| `text/html` | HTML page bhej rahe ho |
| `application/json` | JSON data (API response) |
| `text/css` | CSS stylesheet |
| `image/png` | PNG image |

> **Yaad Rakho:** Content-Type galat set karo to browser confuse ho jayega. JSON bhej rahe ho to `application/json` set karo, HTML bhej rahe ho to `text/html`.

---

## curl — Terminal Se Server Test Karo

Browser ke alawa `curl` command se bhi server test kar sakte ho:

```bash
# Simple GET request
curl http://localhost:3000/

# GET request with headers visible
curl -v http://localhost:3000/crops

# POST request (abhi sirf syntax dekho)
curl -X POST http://localhost:3000/api/data -H "Content-Type: application/json" -d '{"name":"test"}'
```

> **Tip:** Real backend development mein Postman ya curl use karte hain testing ke liye, browser sirf GET requests ke liye easy hai.

---

## Quick Revision Table

| Concept | Key Point |
|---------|-----------|
| **HTTP** | Client-Server ke beech data transfer ka protocol |
| **Request** | Client bhejta hai — method, url, headers, body |
| **Response** | Server bhejta hai — status code, headers, body |
| **GET** | Data lao (read only) |
| **POST** | Naya data create karo |
| **PUT/PATCH** | Data update karo |
| **DELETE** | Data delete karo |
| **200** | OK — sab theek |
| **404** | Not Found — page nahi mila |
| **500** | Server Error — server toot gaya |
| **http.createServer()** | Node.js mein server banao |
| **req.url** | Client ne kaunsa page maanga |
| **req.method** | GET/POST/PUT/DELETE |
| **res.writeHead()** | Status code + headers set karo |
| **res.end()** | Response bhejo |

---

## Aaj Kya Seekha?

1. **HTTP** ek protocol hai — client request bhejta hai, server response deta hai
2. **HTTP Methods** — GET (read), POST (create), PUT (update), DELETE (remove)
3. **Status Codes** — 2xx (success), 4xx (client error), 5xx (server error)
4. **Node.js http module** se server bana sakte ho bina kisi framework ke
5. **Routing** — `req.url` check karke different pages serve kar sakte ho
6. **Content-Type** header batata hai ki data kis format mein hai
7. **curl** se terminal se server test kar sakte ho

> **Tip:** Evening mein hum ek full server banayenge multiple routes ke saath, query params handle karenge, aur curl se test karenge. HTTP samajhna backend ka foundation hai!
