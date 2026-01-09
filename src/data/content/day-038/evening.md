# Day 38 Evening: JWT Practice — Generate, Verify & Simple Auth Flow

> **Aaj ka plan:** Ab hum haathon se JWT ke saath khelenge — tokens banayenge, verify karenge, bina verify ke decode karenge, aur ek simple authentication flow build karenge. Theory morning mein padh li, ab practice time!

---

## Setup — Project Banao

> **Terminal Command:**
```bash
mkdir jwt-practice && cd jwt-practice
npm init -y
npm install jsonwebtoken
```

Ek `index.js` file banao aur shuru karte hain.

---

## Practice 1: Token Generate Karo

```javascript
// index.js
const jwt = require('jsonwebtoken');

// Secret key define karo
const SECRET_KEY = 'meri-super-secret-key-2024';

// ---- Token banana ----

// Farmer app ke liye ek user ka token banao
const farmerToken = jwt.sign(
  {
    userId: 'farmer_001',
    name: 'Ramesh Yadav',
    role: 'farmer',
    village: 'Sultanpur'
  },
  SECRET_KEY,
  { expiresIn: '2h' }  // 2 ghante ke liye valid
);

console.log('=== Farmer Token ===');
console.log(farmerToken);
console.log('Token length:', farmerToken.length, 'characters');

// Admin ka token banao
const adminToken = jwt.sign(
  {
    userId: 'admin_001',
    name: 'Suresh Manager',
    role: 'admin',
    department: 'operations'
  },
  SECRET_KEY,
  { expiresIn: '1h' }  // 1 ghanta — admin ke liye kam time
);

console.log('\n=== Admin Token ===');
console.log(adminToken);
```

> **Expected Output:**
```
=== Farmer Token ===
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
Token length: 203 characters

=== Admin Token ===
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
```

> **Yaad Rakho:** Har JWT hamesha `eyJ` se start hota hai kyunki ye base64 encoded `{"alg"...` hai. Agar token `eyJ` se start nahi hota, toh kuch galat hai!

---

## Practice 2: Token Verify Karo

```javascript
// ---- Token verify karna ----

// Sahi secret key se verify karo
console.log('\n=== Token Verification ===');

try {
  const decoded = jwt.verify(farmerToken, SECRET_KEY);
  console.log('✅ Token VALID hai!');
  console.log('User ID:', decoded.userId);
  console.log('Name:', decoded.name);
  console.log('Role:', decoded.role);
  console.log('Issued At:', new Date(decoded.iat * 1000).toLocaleString());
  console.log('Expires At:', new Date(decoded.exp * 1000).toLocaleString());
} catch (err) {
  console.log('❌ Token INVALID hai!', err.message);
}

// Galat secret key se verify karo — FAIL hona chahiye
console.log('\n=== Wrong Secret Key Test ===');
try {
  const decoded = jwt.verify(farmerToken, 'galat-secret-key');
  console.log('✅ Token valid hai');
} catch (err) {
  console.log('❌ Token INVALID:', err.message);
  // "invalid signature" — kyunki secret key alag hai
}
```

> **Expected Output:**
```
=== Token Verification ===
✅ Token VALID hai!
User ID: farmer_001
Name: Ramesh Yadav
Role: farmer
Issued At: 4/4/2026, 10:30:00 AM
Expires At: 4/4/2026, 12:30:00 PM

=== Wrong Secret Key Test ===
❌ Token INVALID: invalid signature
```

> **Tip:** `iat` aur `exp` Unix timestamp mein hote hain (seconds since 1970). `new Date(timestamp * 1000)` se readable date milti hai — multiply by 1000 kyunki JS milliseconds mein kaam karta hai.

---

## Practice 3: Decode Without Verify

```javascript
// ---- Bina verify ke decode karna ----
// Ye sirf data padh ne ke liye hai — security ke liye nahi!

console.log('\n=== Decode Without Verify ===');

const decoded = jwt.decode(farmerToken);
console.log('Decoded payload:', decoded);
// { userId: 'farmer_001', name: 'Ramesh Yadav', ... }

// Header bhi dekh sakte ho
const full = jwt.decode(farmerToken, { complete: true });
console.log('\nHeader:', full.header);
// { alg: 'HS256', typ: 'JWT' }
console.log('Payload:', full.payload);
console.log('Signature:', full.signature);
```

> **Warning:** `jwt.decode()` **kabhi trust mat karo!** Ye sirf data padhta hai, verify nahi karta. Koi bhi fake token decode ho jaayega. Hamesha `jwt.verify()` use karo authentication ke liye.

```javascript
// Proof: fake token bhi decode ho jaata hai!
const fakePayload = Buffer.from(JSON.stringify({
  userId: 'hacker_001',
  role: 'admin'  // Khud ko admin bana liya!
})).toString('base64url');

const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.fake-signature`;

const fakeDecoded = jwt.decode(fakeToken);
console.log('\nFake token decoded:', fakeDecoded);
// Decode ho gaya! Lekin verify kabhi nahi hoga
```

---

## Practice 4: Expired Token Handle Karo

```javascript
// ---- Expired token test ----

// Bohot short expiry ka token banao — 1 second
const shortToken = jwt.sign(
  { userId: 'test_001', name: 'Test User' },
  SECRET_KEY,
  { expiresIn: '1s' }  // 1 second mein expire!
);

console.log('\n=== Expired Token Test ===');
console.log('Token abhi bana:', shortToken.substring(0, 30) + '...');

// 2 second wait karo
setTimeout(() => {
  try {
    jwt.verify(shortToken, SECRET_KEY);
    console.log('✅ Token valid hai');
  } catch (err) {
    console.log('❌ Token expired:', err.message);
    // "jwt expired" — token ka time khatam ho gaya
    console.log('Expired at:', new Date(err.expiredAt).toLocaleString());
  }
}, 2000);  // 2 second baad check karo
```

> **Expected Output:**
```
=== Expired Token Test ===
Token abhi bana: eyJhbGciOiJIUzI1NiIsInR5c...
❌ Token expired: jwt expired
Expired at: 4/4/2026, 10:30:01 AM
```

---

## Practice 5: Simple Auth Flow — Express ke Saath

```javascript
// auth-server.js
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET_KEY = 'mera-app-secret-key';

// Fake users database (baad mein real DB lagayenge)
const users = [
  { id: 1, email: 'ramesh@farm.com', password: '123456', name: 'Ramesh', role: 'farmer' },
  { id: 2, email: 'admin@farm.com', password: 'admin123', name: 'Admin', role: 'admin' }
];

// ---- LOGIN Route ----
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // User dhoondho
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Email ya password galat hai!'
    });
  }

  // Token banao
  const token = jwt.sign(
    { userId: user.id, name: user.name, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful!',
    token: token
  });
});

// ---- PROTECTED Route ----
app.get('/profile', (req, res) => {
  // Token header se nikalo
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token nahi diya! Pehle login karo.'
    });
  }

  // Token verify karo
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({
      success: true,
      message: `Welcome ${decoded.name}!`,
      user: decoded
    });
  } catch (err) {
    res.status(403).json({
      success: false,
      message: 'Token invalid ya expired hai!'
    });
  }
});

// ---- PUBLIC Route (no auth needed) ----
app.get('/public', (req, res) => {
  res.json({
    success: true,
    message: 'Ye public route hai — koi bhi access kar sakta hai!'
  });
});

app.listen(3000, () => {
  console.log('Auth server chal raha hai port 3000 pe!');
});
```

> **Terminal Command:**
```bash
npm install express
node auth-server.js
```

### Postman Se Test Karo:

**Step 1: Login**
```
POST http://localhost:3000/login
Body (JSON): { "email": "ramesh@farm.com", "password": "123456" }
→ Response mein token milega
```

**Step 2: Profile (with token)**
```
GET http://localhost:3000/profile
Headers: Authorization: Bearer <yahan token paste karo>
→ User ki info milegi
```

**Step 3: Profile (without token)**
```
GET http://localhost:3000/profile
→ 401 error — "Token nahi diya!"
```

> **Practice Time!** Ye exercises try karo:
> 1. Galat password se login karo — kya hota hai?
> 2. Token expire hone ke baad profile access karo
> 3. Token mein kuch change karke bhejo — kya verify hota hai?
> 4. Ek naya protected route `/dashboard` banao

---

## Quick Revision Table

| Concept | Code | Kya karta hai |
|---------|------|---------------|
| Token banana | `jwt.sign(payload, secret, options)` | Naya JWT generate karta hai |
| Token verify | `jwt.verify(token, secret)` | Token check + decode karta hai |
| Token decode | `jwt.decode(token)` | Sirf padhta hai, verify nahi karta |
| Expiry set | `{ expiresIn: '24h' }` | Token ki zindagi set karta hai |
| Header se nikalna | `req.headers['authorization'].split(' ')[1]` | Bearer token extract karta hai |

---

## Aaj Kya Seekha?

1. `jwt.sign()` se **token banate** hain — payload + secret + expiry
2. `jwt.verify()` se **token check** karte hain — invalid/expired pe error throw hota hai
3. `jwt.decode()` **sirf padhne ke liye** hai — security ke liye kabhi rely mat karo
4. Expired token pe **jwt expired** error aata hai
5. Auth flow: Login → Token milo → Har request mein bhejo → Server verify kare
6. Token **Authorization: Bearer** header mein bhejte hain

> **Kal ka preview:** Kal hum real register/login system banayenge bcrypt se password hashing ke saath, plus role-based access control!
