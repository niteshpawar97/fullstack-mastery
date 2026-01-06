# Day 32 - Morning Session: Express Routing & Middleware

> **Aaj ka plan:**
> Aaj Express ki asli taaqat seekhenge — **Router** se code organize karna aur **Middleware** se har request ke beech mein kaam karna. Yeh do concepts Express ke backbone hain!

---

## Express Router Kya Hai?

Jab aapki app badi hoti hai, saare routes ek file mein rakhna mushkil hai. Router se hum routes ko alag-alag files mein organize kar sakte hain.

> **Socho Aise:**
> Socho ek bada hospital hai. Ek hi reception pe sab nahi ho sakta — alag departments hain: OPD, Emergency, Lab. Express Router bhi aise hi kaam karta hai — har module ke routes alag file mein!

### Bina Router (Sab ek file mein — Messy!)
```javascript
// server.js - sab kuch yahan (GALAT tarika)
app.get('/api/users', ...);
app.get('/api/users/:id', ...);
app.post('/api/users', ...);
app.get('/api/crops', ...);
app.get('/api/crops/:id', ...);
app.post('/api/crops', ...);
// 50 aur routes... chaos!
```

### Router ke saath (Clean!)
```javascript
// routes/userRoutes.js - Sirf user ke routes
// routes/cropRoutes.js - Sirf crop ke routes
// server.js - Sirf main setup
```

---

## Router Kaise Banayein

### Step 1: Route file banao

```javascript
// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Yahan "/api/users" likhne ki zaroorat nahi
// Sirf relative path likho
router.get('/', (req, res) => {
  res.json({ message: 'Saare users' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `User #${req.params.id}` });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Naya user banaya' });
});

// Router ko export karo
module.exports = router;
```

### Step 2: Main file mein use karo

```javascript
// server.js
const express = require('express');
const app = express();

// Route files import karo
const userRoutes = require('./routes/userRoutes');
const cropRoutes = require('./routes/cropRoutes');

// JSON parsing middleware
app.use(express.json());

// Routes mount karo — prefix ke saath
app.use('/api/users', userRoutes);   // /api/users/* routes
app.use('/api/crops', cropRoutes);   // /api/crops/* routes

app.listen(3000, () => console.log('Server ready!'));
```

> **Yaad Rakho:**
> `app.use('/api/users', userRoutes)` ka matlab hai — jo bhi request `/api/users` se start hoti hai, woh `userRoutes` file handle karegi. Router mein sirf relative path likhte hain (`/`, `/:id`).

---

## Route Parameters ( :id ) Deep Dive

```javascript
// routes/cropRoutes.js
const express = require('express');
const router = express.Router();

const crops = [
  { id: 1, name: 'Gehun', price: 2200 },
  { id: 2, name: 'Dhan', price: 1940 },
  { id: 3, name: 'Chana', price: 5230 }
];

// Multiple params bhi ho sakte hain
// /season/rabi/crop/1
router.get('/season/:season/crop/:cropId', (req, res) => {
  const { season, cropId } = req.params;
  res.json({
    season,
    cropId,
    message: `${season} season ka crop #${cropId}`
  });
});

// Specific crop by ID
router.get('/:id', (req, res) => {
  const crop = crops.find(c => c.id === Number(req.params.id));
  if (!crop) return res.status(404).json({ error: 'Crop nahi mila' });
  res.json({ crop });
});

module.exports = router;
```

---

## Middleware Kya Hai?

Middleware ek **function** hai jo request aur response ke **beech mein** run hota hai. Jaise ek chain hai — request aati hai, middleware kuch kaam karta hai, phir agle middleware ya route handler ke paas jaati hai.

> **Socho Aise:**
> Socho tum ek government office mein jaate ho:
> 1. **Gate pe guard** — ID check (Authentication middleware)
> 2. **Reception** — form bharo (Parsing middleware)
> 3. **Token counter** — token lo (Logging middleware)
> 4. **Officer** — actual kaam hota hai (Route handler)
>
> Har step ek middleware hai! Agar kisi step pe fail ho gaye, aage nahi ja sakte.

### Middleware Function Structure

```javascript
// Middleware ka basic format
const myMiddleware = (req, res, next) => {
  // Kuch kaam karo...
  console.log('Middleware chala!');

  // Agle middleware/route pe jaao
  next();
};
```

> **Warning:**
> Agar `next()` call nahi kiya, toh request **stuck** ho jayegi! Client ko kabhi response nahi milega aur timeout ho jayega.

---

## Built-in Middleware

### 1. express.json() — JSON Body Parse Karo

```javascript
// Bina iske req.body undefined rahega!
app.use(express.json());

app.post('/api/users', (req, res) => {
  console.log(req.body); // { name: "Ramesh", age: 35 }
  res.json({ received: req.body });
});
```

### 2. express.urlencoded() — Form Data Parse Karo

```javascript
// HTML forms se aane wala data parse karo
app.use(express.urlencoded({ extended: true }));
```

### 3. express.static() — Static Files Serve Karo

```javascript
// "public" folder ki files serve karo
app.use(express.static('public'));

// Ab http://localhost:3000/image.jpg
// automatically public/image.jpg serve karega
```

> **Tip:**
> `app.use()` se middleware **sabhi routes** pe lagta hai. Agar sirf specific route pe lagana hai, toh route mein directly daal do.

---

## Custom Middleware Banana

### Logger Middleware — Har Request Log Karo

```javascript
// middleware/logger.js
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  // Agle step pe jaao
  next();
};

module.exports = logger;
```

```javascript
// server.js mein use karo
const logger = require('./middleware/logger');
app.use(logger); // Saari requests pe chalega
```

> **Expected Output:**
> ```
> [2026-04-04T10:30:15.123Z] GET /api/users
> [2026-04-04T10:30:16.456Z] POST /api/crops
> [2026-04-04T10:30:17.789Z] GET /api/users/3
> ```

### Auth Check Middleware

```javascript
// middleware/authCheck.js
const authCheck = (req, res, next) => {
  // Header mein API key check karo
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== 'meri-secret-key-123') {
    return res.status(401).json({
      error: 'Unauthorized!',
      message: 'Valid API key chahiye header mein'
    });
  }

  // Key sahi hai, aage jaao
  console.log('Auth passed!');
  next();
};

module.exports = authCheck;
```

```javascript
// Sirf protected routes pe lagao
const authCheck = require('./middleware/authCheck');

// Sabhi /api/admin routes pe auth check
app.use('/api/admin', authCheck);

// Ya specific route pe
app.get('/api/secret', authCheck, (req, res) => {
  res.json({ secret: 'Yeh top secret data hai!' });
});
```

---

## Middleware Ka Order Matters!

```javascript
const express = require('express');
const app = express();

// 1. Pehle parsing middleware
app.use(express.json());

// 2. Phir logging middleware
app.use(logger);

// 3. Phir routes
app.use('/api/users', userRoutes);

// 4. Sabse last mein error handler
app.use(errorHandler);
```

> **Yaad Rakho:**
> Middleware **upar se neeche** order mein execute hota hai. Agar logger ko routes ke baad lagaoge, toh requests log nahi hongi! Sochke order rakho.

---

## next() Function Ka Kaam

```javascript
// next() ke bina - request ruk jayegi
const badMiddleware = (req, res, next) => {
  console.log('Yahan tak aaya...');
  // next() nahi hai - REQUEST STUCK!
};

// next() ke saath - request aage jayegi
const goodMiddleware = (req, res, next) => {
  console.log('Kaam ho gaya, aage bhejo');
  next(); // ZAROORI hai!
};

// Response bhej diya toh next() mat karo
const authMiddleware = (req, res, next) => {
  if (!req.headers.token) {
    return res.status(401).json({ error: 'No token!' });
    // Yahan next() NAHI chahiye kyunki response bhej diya
  }
  next(); // Token hai, aage jaao
};
```

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| `express.Router()` | Routes ko alag file mein organize | `const router = express.Router()` |
| `app.use(path, router)` | Router mount karo | `app.use('/api/users', userRoutes)` |
| `req.params` | URL ke dynamic parts | `/:id` → `req.params.id` |
| Middleware | Request-Response ke beech ka function | `(req, res, next) => {...}` |
| `next()` | Agle middleware pe jaao | Must call, warna stuck |
| `express.json()` | JSON body parse karo | `app.use(express.json())` |
| `express.static()` | Static files serve karo | `app.use(express.static('public'))` |
| Custom Middleware | Apna function banao | Logger, Auth check |
| Middleware Order | Upar se neeche chalta hai | Parse → Log → Routes → Error |

---

## Aaj Kya Seekha?

1. **Express Router** se routes ko alag files mein organize karte hain — clean code structure
2. **Route parameters** (`:id`) se dynamic URLs handle karte hain
3. **Middleware** request aur response ke beech mein kaam karta hai — jaise security guard
4. **Built-in middleware** — `express.json()`, `express.static()`, `express.urlencoded()`
5. **Custom middleware** — Logger, Auth check — apni zaroorat ke hisaab se banao
6. **next()** function zaroori hai middleware mein — iske bina request stuck ho jaati hai
7. **Middleware order** matters — pehle parsing, phir logging, phir routes, last mein error handling

> **Practice Time!**
> Evening session mein hum in sab concepts ko code mein implement karenge — route modules banayenge, logger middleware likhenge, aur error handling middleware create karenge!
