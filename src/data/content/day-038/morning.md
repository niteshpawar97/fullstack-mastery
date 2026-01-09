# Day 38 Morning: Authentication — JWT Basics

> **Aaj ka plan:** Aaj hum samjhenge ki authentication kya hota hai, authorization se kaise alag hai, sessions vs tokens ka funda, aur JWT (JSON Web Token) kaise kaam karta hai. Ye backend development ka sabse important topic hai — bina iske koi bhi real app bana nahi sakte.

---

## Authentication vs Authorization — Fark Samjho

### Authentication (कौन हो तुम?)

Authentication ka matlab hai — **verify karna ki user kaun hai**. Jab tum login karte ho (email + password dete ho), toh server check karta hai ki "haan ye sach mein wahi user hai."

### Authorization (क्या कर सakte हो?)

Authorization ka matlab hai — **check karna ki user ke paas permission hai ya nahi**. Login ke baad, kya ye user admin panel access kar sakta hai? Kya ye delete kar sakta hai?

> **Socho Aise:** Ek farmer cooperative ki building hai. Guard gate pe tumhara ID check karta hai — ye **Authentication** hai. Lekin andar jaake tum sirf apna godown access kar sakte ho, doosre ka nahi — ye **Authorization** hai.

| Concept | Matlab | Example |
|---------|--------|---------|
| Authentication | Kaun ho tum? | Login with email/password |
| Authorization | Kya kar sakte ho? | Admin can delete, User can only read |

> **Yaad Rakho:** Pehle Authentication hota hai, phir Authorization. Bina pehchaan ke permission ka koi matlab nahi.

---

## Sessions vs Tokens — Purana vs Naya Tarika

### Session-Based Auth (Purana Tarika)

1. User login karta hai
2. Server ek **session** create karta hai (server ki memory mein)
3. Server ek **session ID** cookie mein bhejta hai
4. Har request ke saath cookie jaata hai
5. Server session ID se user ko identify karta hai

**Problem:** Server ko har user ka session yaad rakhna padta hai. 10 lakh users = 10 lakh sessions in memory!

### Token-Based Auth (Naya Tarika — JWT)

1. User login karta hai
2. Server ek **token** banata hai (signed string)
3. Token client ko bhej deta hai
4. Client har request mein token bhejta hai (header mein)
5. Server token verify karta hai — **kuch yaad rakhne ki zaroorat nahi!**

> **Socho Aise:** Session-based auth aise hai jaise guard ke paas ek register hai — har entry check karta hai. Token-based auth aise hai jaise tumhare paas ek sealed letter hai jisme likha hai "ye authorized hai" — guard sirf seal check karta hai, register nahi dekhta.

| Feature | Session | Token (JWT) |
|---------|---------|-------------|
| Storage | Server mein | Client mein |
| Scalability | Mushkil (server memory) | Aasan (stateless) |
| Mobile friendly | Nahi (cookies issue) | Haan |
| Multiple servers | Problem hoti hai | Koi problem nahi |

---

## JWT Kya Hai? — Structure Samjho

### JWT = JSON Web Token

JWT ek **string** hai jo 3 parts se bani hoti hai, dot (.) se separated:

```
xxxxx.yyyyy.zzzzz
Header.Payload.Signature
```

### Part 1: Header

```json
{
  "alg": "HS256",    // Kaunsa algorithm use ho raha hai
  "typ": "JWT"       // Token ka type
}
```

### Part 2: Payload (Data)

```json
{
  "userId": "abc123",     // User ki ID
  "role": "admin",        // User ka role
  "name": "Ramesh",       // User ka naam
  "iat": 1700000000,      // Issued At — kab bana
  "exp": 1700086400       // Expiry — kab expire hoga
}
```

> **Warning:** Payload mein **kabhi password ya sensitive data mat rakho!** JWT decode karna bahut aasan hai — koi bhi padh sakta hai. Sirf wo data rakho jo public ho sakta hai.

### Part 3: Signature

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```

Signature ensure karta hai ki token **tamper nahi hua hai**. Agar koi payload change kare, toh signature match nahi karega.

> **Socho Aise:** JWT ek postcard jaisa hai — koi bhi padh sakta hai (payload). Lekin neeche ek official stamp hai (signature) — agar koi kuch bhi change kare toh stamp invalid ho jaayega.

---

## jsonwebtoken Package — Install & Use

### Installation

> **Terminal Command:**
```bash
npm install jsonwebtoken
```

### Token Sign Karna (Banana)

```javascript
const jwt = require('jsonwebtoken');

// Secret key — ye .env mein rakhna hai, code mein nahi!
const SECRET = 'mera-bohot-secret-key-hai-ye';

// Token banana (sign karna)
const token = jwt.sign(
  {
    userId: '12345',       // Payload data
    role: 'admin',         // User ka role
    name: 'Ramesh Kumar'   // User ka naam
  },
  SECRET,                  // Secret key se sign hoga
  {
    expiresIn: '24h'       // 24 ghante mein expire hoga
  }
);

console.log('Token bana:', token);
// eyJhbGciOiJIUzI1NiIs... (bohot lambi string)
```

### Token Verify Karna (Check Karna)

```javascript
// Token verify karna
try {
  const decoded = jwt.verify(token, SECRET);
  console.log('Token valid hai!');
  console.log('User data:', decoded);
  // { userId: '12345', role: 'admin', name: 'Ramesh Kumar', iat: ..., exp: ... }
} catch (error) {
  console.log('Token invalid hai ya expire ho gaya!');
  console.log('Error:', error.message);
}
```

> **Yaad Rakho:** `jwt.sign()` se token **banate** hain, `jwt.verify()` se token **check** karte hain. Dono mein same SECRET key lagti hai.

---

## Token Expiry — Kab Expire Hoga?

```javascript
// Alag alag expiry options
jwt.sign(payload, SECRET, { expiresIn: '1h' });    // 1 ghanta
jwt.sign(payload, SECRET, { expiresIn: '7d' });    // 7 din
jwt.sign(payload, SECRET, { expiresIn: '30m' });   // 30 minute
jwt.sign(payload, SECRET, { expiresIn: 60 * 60 }); // 3600 seconds = 1 hour
```

> **Tip:** Token expiry bohot important hai. Agar token kabhi expire nahi hoga, toh agar kisi ne chura liya toh hamesha ke liye use kar sakta hai. Short-lived tokens zyada secure hain.

| Use Case | Suggested Expiry |
|----------|-----------------|
| Access Token | 15 min - 1 hour |
| Refresh Token | 7 - 30 days |
| Password Reset Token | 10 - 30 minutes |
| Email Verification | 24 hours |

---

## Simple Auth Flow — Poora Picture

```
1. User → POST /login → { email, password }
2. Server → Password check karo
3. Server → Sahi hai? → JWT token banao → Client ko bhejo
4. Client → Token save karo (localStorage/cookie)
5. Client → Har request mein token bhejo (Authorization header)
6. Server → Token verify karo → Data bhejo / Reject karo
```

```javascript
// Authorization header ka format
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

const authHeader = req.headers['authorization'];
// "Bearer eyJhbGciOiJIUzI1NiIs..."

const token = authHeader && authHeader.split(' ')[1];
// "eyJhbGciOiJIUzI1NiIs..."
```

> **Yaad Rakho:** "Bearer" ek standard prefix hai. Token hamesha `Authorization: Bearer <token>` format mein bhejte hain.

---

## Quick Revision Table

| Topic | Key Point |
|-------|-----------|
| Authentication | User kaun hai — verify karna |
| Authorization | User kya kar sakta hai — permission check |
| Session Auth | Server mein store hota hai — scalable nahi |
| Token Auth | Client mein store hota hai — stateless |
| JWT Structure | Header.Payload.Signature |
| Header | Algorithm + Token type |
| Payload | User data (public info only!) |
| Signature | Tamper-proof seal |
| jwt.sign() | Token banana |
| jwt.verify() | Token check karna |
| expiresIn | Token ki expiry set karna |
| Bearer Token | Authorization header format |

---

## Aaj Kya Seekha?

1. **Authentication** = Pehchaan verify karna, **Authorization** = Permission check karna
2. **Sessions** server pe load daalte hain, **Tokens** stateless hain
3. JWT ke **3 parts** hain — Header, Payload, Signature
4. `jsonwebtoken` package se **sign** aur **verify** karte hain
5. Token mein **kabhi sensitive data mat rakho** — koi bhi decode kar sakta hai
6. **Expiry** hamesha set karo — security ke liye zaroori hai

> **Practice Time!** Evening session mein hum JWT banayenge, verify karenge, decode karenge bina verify ke, aur ek simple auth flow build karenge!
