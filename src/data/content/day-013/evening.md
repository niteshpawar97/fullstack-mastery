# Day 13 Evening: HTTP Server Practice — Routes, Query Params & curl Testing

> **Practice Time!** Morning mein seekha HTTP protocol, methods, status codes, aur basic server. Ab hum ek full-featured server banayenge with dynamic routes, query parameters, aur curl se testing!

---

## Setup: Project Folder Banao

> **Terminal Command:**
> ```bash
> mkdir day13-http-server
> cd day13-http-server
> npm init -y
> git init
> code .
> ```

---

## Task 1: Kisan Market API Server

### Problem Statement

Ek HTTP server banao jo kisan market ka data serve kare — crops list, price check, search by name, aur JSON responses de.

### Solution

```javascript
// market-server.js — Kisan Market API
const http = require("http");
const url = require("url");  // URL parse karne ke liye built-in module

// Sample data — baad mein ye database se aayega
const crops = [
    { id: 1, name: "Tomato",   pricePerKg: 40, season: "Kharif", stock: 500 },
    { id: 2, name: "Onion",    pricePerKg: 30, season: "Kharif", stock: 800 },
    { id: 3, name: "Wheat",    pricePerKg: 25, season: "Rabi",   stock: 2000 },
    { id: 4, name: "Rice",     pricePerKg: 45, season: "Kharif", stock: 1500 },
    { id: 5, name: "Potato",   pricePerKg: 20, season: "Rabi",   stock: 1200 },
    { id: 6, name: "Cotton",   pricePerKg: 60, season: "Kharif", stock: 300 },
    { id: 7, name: "Sugarcane",pricePerKg: 3,  season: "Kharif", stock: 5000 },
    { id: 8, name: "Mustard",  pricePerKg: 55, season: "Rabi",   stock: 400 }
];

// Helper: JSON response bhejne ka function
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"  // CORS allow
    });
    res.end(JSON.stringify(data, null, 2));
}

// Helper: HTML response bhejne ka function
function sendHTML(res, statusCode, html) {
    res.writeHead(statusCode, {
        "Content-Type": "text/html; charset=utf-8"
    });
    res.end(html);
}

// Server banao
const server = http.createServer((req, res) => {
    // URL parse karo (query params nikalne ke liye)
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;  // /crops, /about etc.
    const query = parsedUrl.query;        // { search: "tomato", limit: "5" }
    const method = req.method;

    // Har request log karo
    console.log(`[${new Date().toLocaleTimeString()}] ${method} ${req.url}`);

    // ============ ROUTES ============

    // HOME — Welcome page
    if (pathname === "/" && method === "GET") {
        sendHTML(res, 200, `
        <html>
        <head>
            <title>Kisan Market API</title>
            <style>
                body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
                h1 { color: #2d7a3a; }
                a { color: #2d7a3a; text-decoration: none; }
                code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>🌾 Kisan Market API</h1>
            <p>Namaste! Available endpoints:</p>
            <ul>
                <li><a href="/api/crops">/api/crops</a> — Saari crops ki list</li>
                <li><a href="/api/crops?season=Kharif">/api/crops?season=Kharif</a> — Season filter</li>
                <li><a href="/api/crops?search=tom">/api/crops?search=tom</a> — Name se search</li>
                <li><a href="/api/crops?sort=price">/api/crops?sort=price</a> — Price se sort</li>
                <li><a href="/api/crops/1">/api/crops/1</a> — Single crop by ID</li>
                <li><a href="/api/stats">/api/stats</a> — Market statistics</li>
                <li><a href="/health">/health</a> — Server health check</li>
            </ul>
        </body>
        </html>
        `);
    }

    // API: All Crops (with query params)
    else if (pathname === "/api/crops" && method === "GET") {
        let result = [...crops];  // Copy banao

        // Search filter
        if (query.search) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(query.search.toLowerCase())
            );
        }

        // Season filter
        if (query.season) {
            result = result.filter(c =>
                c.season.toLowerCase() === query.season.toLowerCase()
            );
        }

        // Sort by price
        if (query.sort === "price") {
            result.sort((a, b) => a.pricePerKg - b.pricePerKg);
        }

        // Sort by name
        if (query.sort === "name") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Limit results
        if (query.limit) {
            result = result.slice(0, parseInt(query.limit));
        }

        sendJSON(res, 200, {
            status: "success",
            count: result.length,
            filters: {
                search: query.search || null,
                season: query.season || null,
                sort: query.sort || null,
                limit: query.limit || null
            },
            data: result
        });
    }

    // API: Single Crop by ID — /api/crops/3
    else if (pathname.startsWith("/api/crops/") && method === "GET") {
        const id = parseInt(pathname.split("/")[3]);
        const crop = crops.find(c => c.id === id);

        if (crop) {
            // Total value calculate karo
            const totalValue = crop.pricePerKg * crop.stock;
            sendJSON(res, 200, {
                status: "success",
                data: { ...crop, totalValue }
            });
        } else {
            sendJSON(res, 404, {
                status: "error",
                message: `Crop ID ${id} nahi mila!`
            });
        }
    }

    // API: Market Stats
    else if (pathname === "/api/stats" && method === "GET") {
        const totalCrops = crops.length;
        const avgPrice = crops.reduce((s, c) => s + c.pricePerKg, 0) / totalCrops;
        const totalStock = crops.reduce((s, c) => s + c.stock, 0);
        const mostExpensive = crops.reduce((max, c) =>
            c.pricePerKg > max.pricePerKg ? c : max
        );
        const cheapest = crops.reduce((min, c) =>
            c.pricePerKg < min.pricePerKg ? c : min
        );

        sendJSON(res, 200, {
            status: "success",
            stats: {
                totalCrops,
                averagePrice: `₹${avgPrice.toFixed(2)}/kg`,
                totalStock: `${totalStock} kg`,
                mostExpensive: `${mostExpensive.name} (₹${mostExpensive.pricePerKg}/kg)`,
                cheapest: `${cheapest.name} (₹${cheapest.pricePerKg}/kg)`,
                kharifCrops: crops.filter(c => c.season === "Kharif").length,
                rabiCrops: crops.filter(c => c.season === "Rabi").length
            }
        });
    }

    // Health Check
    else if (pathname === "/health" && method === "GET") {
        sendJSON(res, 200, {
            status: "healthy",
            uptime: process.uptime().toFixed(2) + " seconds",
            timestamp: new Date().toISOString(),
            memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
        });
    }

    // 404 — Route nahi mila
    else {
        sendJSON(res, 404, {
            status: "error",
            message: `Route "${method} ${pathname}" not found`,
            hint: "Try GET / for available endpoints"
        });
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log("╔══════════════════════════════════╗");
    console.log("║   🌾 Kisan Market API Server     ║");
    console.log("╠══════════════════════════════════╣");
    console.log(`║   Running on port ${PORT}            ║`);
    console.log(`║   http://localhost:${PORT}          ║`);
    console.log("╠══════════════════════════════════╣");
    console.log("║   Ctrl+C to stop                 ║");
    console.log("╚══════════════════════════════════╝");
});
```

> **Terminal Command:**
> ```bash
> node market-server.js
> ```

---

## Task 2: Browser Se Test Karo

Server chal raha hai to browser mein ye URLs try karo:

| URL | Kya Milega |
|-----|-----------|
| `http://localhost:3000/` | Welcome page with links |
| `http://localhost:3000/api/crops` | Saari crops JSON |
| `http://localhost:3000/api/crops?season=Rabi` | Sirf Rabi crops |
| `http://localhost:3000/api/crops?search=tom` | Tomato search |
| `http://localhost:3000/api/crops?sort=price` | Price se sorted |
| `http://localhost:3000/api/crops?sort=price&limit=3` | Top 3 cheapest |
| `http://localhost:3000/api/crops/2` | Onion details |
| `http://localhost:3000/api/crops/99` | 404 error |
| `http://localhost:3000/api/stats` | Market statistics |
| `http://localhost:3000/health` | Server health |

---

## Task 3: curl Se Test Karo

Ek nayi terminal window kholo (server band mat karo!) aur ye commands try karo:

```bash
# Basic GET request
curl http://localhost:3000/api/crops

# Pretty JSON output (pipe through python)
curl -s http://localhost:3000/api/crops | python -m json.tool

# Specific crop
curl http://localhost:3000/api/crops/1

# Search with query param
curl "http://localhost:3000/api/crops?search=wheat"

# Season filter
curl "http://localhost:3000/api/crops?season=Kharif"

# Stats
curl http://localhost:3000/api/stats

# Health check
curl http://localhost:3000/health

# Verbose output — poore headers dekho
curl -v http://localhost:3000/api/crops/1

# Non-existent route
curl http://localhost:3000/api/nothing
```

> **Tip:** Query parameters wali URLs ko quotes `" "` mein rakho, nahi to `&` se terminal confuse ho jayega!

---

## Task 4: Query Parameter Parser — Khud Samjho

### How Query Params Work

```
URL: /api/crops?search=tomato&season=Kharif&limit=5
                │               │             │
                ├─ search=tomato│             │
                                ├─ season=Kharif
                                              └─ limit=5
```

```javascript
// query-demo.js — Query params ko samjho
const url = require("url");

// Fake URL parse karo
const testUrl = "/api/crops?search=tomato&season=Kharif&limit=5";
const parsed = url.parse(testUrl, true);  // true = query ko object mein parse karo

console.log("Pathname:", parsed.pathname);
// Output: /api/crops

console.log("Query Object:", parsed.query);
// Output: { search: 'tomato', season: 'Kharif', limit: '5' }

console.log("Search param:", parsed.query.search);
// Output: tomato

// URL constructor (modern way)
const myUrl = new URL("http://localhost:3000/api/crops?search=onion&limit=3");
console.log("\nModern URL parse:");
console.log("  pathname:", myUrl.pathname);
console.log("  search param:", myUrl.searchParams.get("search"));
console.log("  limit param:", myUrl.searchParams.get("limit"));
```

> **Terminal Command:**
> ```bash
> node query-demo.js
> ```

---

## Task 5: POST Request Handle Karo

### Problem Statement

Server pe POST request bhejne ka setup karo — data receive karo aur process karo.

### Solution — POST Handler Add Karo

Apne `market-server.js` mein ye route add karo (404 wale block se pehle):

```javascript
// Ye code apne server mein add karo — concept samjho

// POST: Add new crop
if (pathname === "/api/crops" && method === "POST") {
    let body = "";

    // Data chunks mein aata hai — collect karo
    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    // Saara data aa gaya
    req.on("end", () => {
        try {
            const newCrop = JSON.parse(body);

            // Validation
            if (!newCrop.name || !newCrop.pricePerKg) {
                sendJSON(res, 400, {
                    status: "error",
                    message: "name aur pricePerKg dena zaroori hai!"
                });
                return;
            }

            // New crop add karo
            const crop = {
                id: crops.length + 1,
                name: newCrop.name,
                pricePerKg: newCrop.pricePerKg,
                season: newCrop.season || "Unknown",
                stock: newCrop.stock || 0
            };
            crops.push(crop);

            sendJSON(res, 201, {
                status: "success",
                message: "Nayi crop add ho gayi!",
                data: crop
            });
        } catch (err) {
            sendJSON(res, 400, {
                status: "error",
                message: "Invalid JSON data!"
            });
        }
    });
}
```

### curl Se POST Test Karo

```bash
# Nayi crop add karo
curl -X POST http://localhost:3000/api/crops \
  -H "Content-Type: application/json" \
  -d '{"name": "Mango", "pricePerKg": 80, "season": "Zaid", "stock": 200}'

# Check karo add hua ya nahi
curl http://localhost:3000/api/crops
```

> **Yaad Rakho:** POST request mein data `req.on("data")` aur `req.on("end")` events se milta hai — ye async hai kyunki data ek saath nahi, **chunks** mein aata hai!

---

## Task 6: Git Commit Karo

```bash
git add .
git status
git commit -m "Day 13: HTTP server - market API with routes, query params, POST handler, curl testing"
git log --oneline
```

---

## Mini Challenge: Time API Server

### Problem Statement

Ek server banao jo different time-related endpoints de:
- `GET /time` — current time
- `GET /date` — current date
- `GET /datetime` — date + time
- `GET /timestamp` — Unix timestamp
- `GET /countdown?to=2026-12-31` — kitne din bache

### Hint

```javascript
// time-server.js
const http = require("http");
const url = require("url");

// Tumhara code yahan...
// new Date() se saari info milegi
// Date.parse() se countdown calculate karo
// res.writeHead(200, { "Content-Type": "application/json" })
```

> **Practice Time!** Khud banao ye server! Har route pe JSON response do. Bonus: timezone support add karo.

---

## Quick Revision Table

| Task | Key Concepts |
|------|-------------|
| Market API | `http.createServer()`, routing with `if-else` |
| Query Params | `url.parse(req.url, true)`, `query.search` |
| JSON Response | `JSON.stringify()`, `Content-Type: application/json` |
| POST Handler | `req.on("data")`, `req.on("end")`, `JSON.parse(body)` |
| curl Testing | `curl -X POST`, `-H` headers, `-d` data |
| Status Codes | 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found) |

---

## Aaj Kya Seekha?

1. **http.createServer()** se Node.js mein server bana sakte ho
2. **Routing** — `req.url` aur `req.method` check karke different responses do
3. **Query Parameters** — URL mein `?key=value` se data pass hota hai
4. **JSON API** — `Content-Type: application/json` set karke JSON bhejo
5. **POST request** — data chunks mein aata hai, `req.on("data/end")` se handle karo
6. **curl** — terminal se HTTP requests bhejne ka powerful tool
7. **Status codes** — sahi code bhejma zaroori hai (200, 201, 400, 404)

> **Tip:** Kal Week 2 ka revision hai! SQL, MongoDB, Node.js, HTTP — sab revise karenge. Aaj ke server ko ek baar aur run karke saare routes test karo!
