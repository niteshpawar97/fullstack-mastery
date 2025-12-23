# Day 11 Morning: Node.js Introduction — Backend Ki Duniya Mein Pehla Kadam

> **Aaj ka plan:** Aaj hum samjhenge ki Node.js kya hai, ye kaise kaam karta hai, V8 engine ki power, REPL mode, pehla Node script, process object, aur global vs window ka farak. Aaj se hum "real backend developer" banne ki journey shuru karte hain!

---

## Node.js Kya Hai?

### Browser Se Bahar JavaScript

Ab tak humne JavaScript sirf browser mein chalaya hai. Lekin agar tumhe ek server banana ho? Database se baat karni ho? File system access karna ho? Browser ye sab nahi kar sakta.

**Node.js** ek **JavaScript runtime environment** hai jo tumhe JavaScript ko **browser ke bahar** — seedha apne computer pe — chalane deta hai.

> **Socho Aise:** Socho JavaScript ek talented chef hai jo sirf ek restaurant (browser) mein kaam kar sakta tha. Node.js ne usse apna khud ka restaurant (server) kholne ka mauka diya. Ab wo chef kahin bhi kaam kar sakta hai — kitchen, factory, ghar, sab jagah!

### Node.js Ka Short History

| Year | Event |
|------|-------|
| 2009 | Ryan Dahl ne Node.js banaya |
| 2010 | npm (Node Package Manager) aaya |
| 2015 | io.js merge hua, Node.js Foundation bani |
| 2023+ | Node.js v20+ LTS — stable aur fast |

> **Yaad Rakho:** Node.js ek language nahi hai! Ye ek **runtime** hai jo JavaScript ko server pe chalata hai. Language wahi hai — JavaScript. Bas environment naya hai.

---

## V8 Engine — Node.js Ka Dil

### V8 Kya Hai?

V8 ek **JavaScript engine** hai jo Google ne banaya hai — yahi Chrome browser ke andar bhi chalti hai. Node.js isi V8 engine ko use karta hai.

### V8 Kaise Kaam Karta Hai?

```
JavaScript Code → V8 Engine → Machine Code → CPU Execution
```

V8 tumhare JavaScript code ko **directly machine code** mein convert karta hai (JIT compilation). Isliye Node.js bahut fast hai.

> **Socho Aise:** V8 engine ek translator hai. Tum Hindi (JavaScript) mein bolo, wo seedha Machine Language mein translate kar deta hai — bina kisi beech ke step ke. Isliye conversation fast hota hai!

### Node.js Architecture

```
┌──────────────────────────────────┐
│         Your Node.js App         │
├──────────────────────────────────┤
│     Node.js Bindings (C++)       │
├──────────────┬───────────────────┤
│   V8 Engine  │  libuv (Async I/O)│
│  (Google C++)│  (Event Loop)      │
└──────────────┴───────────────────┘
```

- **V8** — JavaScript execute karta hai
- **libuv** — File system, networking, async operations handle karta hai
- **Node.js Bindings** — V8 aur libuv ko connect karta hai

---

## Kyon Node.js Backend Ke Liye?

### Node.js Ke Fayde

| Feature | Explanation |
|---------|------------|
| **Same Language** | Frontend aur Backend dono JavaScript — ek hi language seekho |
| **Non-blocking I/O** | Multiple requests handle karta hai bina ruke |
| **NPM Ecosystem** | 2 million+ packages available — har kaam ke liye library hai |
| **Fast** | V8 engine + event-driven architecture = speed |
| **Scalable** | Netflix, LinkedIn, Uber — sab use karte hain |

> **Socho Aise:** Ek kisan mandi mein hai. Blocking system mein — ek customer ka kaam khatam hone tak baaki sab wait karenge. Non-blocking system mein — kisan ek customer ka order leke processing mein bhej deta hai, aur turant agla customer handle karta hai. Node.js aisa hi kaam karta hai!

### Kahan Use Hota Hai Node.js?

- **REST APIs** — backend servers banana
- **Real-time apps** — chat applications (WhatsApp jaisi)
- **IoT devices** — sensor data process karna
- **CLI tools** — command line utilities
- **Microservices** — choti choti independent services

> **Example:** Socho tumhare gaon mein ek smart farming system hai. Sensor se temperature data aata hai (IoT), wo Node.js server pe jaata hai, database mein store hota hai, aur farmer ke phone pe alert jaata hai. Ye poora flow Node.js handle kar sakta hai!

---

## Node.js REPL — Interactive Playground

### REPL Kya Hai?

**R**ead **E**valuate **P**rint **L**oop — ye ek interactive mode hai jahan tum ek-ek line JavaScript likh ke turant result dekh sakte ho.

### REPL Start Karo

> **Terminal Command:**
> ```bash
> node
> ```

Ab tum Node.js REPL mein ho! Try karo:

```javascript
> 2 + 3
5

> "Namaste" + " " + "Duniya"
'Namaste Duniya'

> Math.max(10, 25, 7, 42, 3)
42

> const kisan = { naam: "Ramesh", crop: "Gehun" }
undefined

> kisan.naam
'Ramesh'

> Date.now()
1712188800000
```

### REPL Se Bahar Aana

```javascript
> .exit
// ya Ctrl + C do baar dabao
```

### REPL Useful Commands

| Command | Kya Karta Hai |
|---------|--------------|
| `.help` | Saare REPL commands dikhata hai |
| `.clear` | Context clear karta hai |
| `.exit` | REPL se bahar aata hai |
| `Tab` | Auto-complete suggestions |

> **Tip:** REPL mein chota code test karna best hai. Bada code hamesha .js file mein likho.

---

## Pehla Node.js Script

### Hello World — Server Style

Ek file banao: `hello.js`

```javascript
// hello.js - Pehla Node.js program
// Ye browser mein nahi, terminal mein chalega!

const appName = "Kisan Dashboard";
const version = "1.0.0";
const developer = "Aap!";

console.log("================================");
console.log(`  Welcome to ${appName}`);
console.log(`  Version: ${version}`);
console.log(`  Developer: ${developer}`);
console.log("================================");

// Current date-time
const abhi = new Date();
console.log(`\nServer started at: ${abhi.toLocaleString()}`);

// Simple calculation
const pricePerKg = 45;
const totalKg = 200;
const totalSale = pricePerKg * totalKg;
console.log(`\nAaj ki sale: ${totalKg} kg × ₹${pricePerKg} = ₹${totalSale}`);
```

> **Terminal Command:**
> ```bash
> node hello.js
> ```

> **Expected Output:**
> ```
> ================================
>   Welcome to Kisan Dashboard
>   Version: 1.0.0
>   Developer: Aap!
> ================================
>
> Server started at: 4/4/2026, 10:00:00 AM
>
> Aaj ki sale: 200 kg × ₹45 = ₹9000
> ```

> **Yaad Rakho:** Node.js mein `console.log` same kaam karta hai jaise browser mein — lekin output terminal mein dikhta hai, browser console mein nahi!

---

## Process Object — Node.js Ka Special Weapon

### process Kya Hai?

`process` ek **global object** hai Node.js mein jo tumhe running program ke baare mein information deta hai. Ye sirf Node.js mein available hai — browser mein nahi milega!

### Important process Properties

```javascript
// process-demo.js

// Node.js version
console.log("Node Version:", process.version);
// Output: Node Version: v20.x.x

// Operating System platform
console.log("Platform:", process.platform);
// Output: Platform: win32 (ya linux, darwin)

// Current working directory
console.log("Current Directory:", process.cwd());
// Output: Current Directory: C:\Users\...

// Process ID (har running program ka unique ID)
console.log("Process ID:", process.pid);
// Output: Process ID: 12345

// Memory usage (kitni RAM use ho rahi hai)
const memory = process.memoryUsage();
console.log("Memory (MB):", Math.round(memory.heapUsed / 1024 / 1024));
// Output: Memory (MB): 4

// Uptime (kitni der se chal raha hai - seconds mein)
console.log("Uptime:", process.uptime(), "seconds");
```

### process.argv — Command Line Arguments

Ye sabse useful property hai! Jab tum terminal se kuch values pass karte ho, wo `process.argv` mein milti hain.

```javascript
// args-demo.js
console.log("Saare Arguments:", process.argv);
```

> **Terminal Command:**
> ```bash
> node args-demo.js hello world 42
> ```

> **Expected Output:**
> ```
> Saare Arguments: [
>   'C:\\Program Files\\nodejs\\node.exe',   // Node.js ka path
>   'C:\\Users\\...\\args-demo.js',           // File ka path
>   'hello',                                  // Tumhara pehla argument
>   'world',                                  // Doosra argument
>   '42'                                      // Teesra argument
> ]
> ```

> **Yaad Rakho:** `process.argv[0]` hamesha Node ka path hota hai, `process.argv[1]` file ka path hota hai. Tumhare actual arguments `process.argv[2]` se shuru hote hain!

### Practical Example — Kisan Greeter

```javascript
// greeter.js - Command line se naam lo aur greet karo
const naam = process.argv[2];
const crop = process.argv[3];

if (naam && crop) {
    console.log(`\nNamaste ${naam}! 🌾`);
    console.log(`Aapki ${crop} ki fasal bahut achi hogi is saal!`);
} else {
    console.log("Usage: node greeter.js <naam> <crop>");
    console.log("Example: node greeter.js Ramesh Gehun");
}
```

> **Terminal Command:**
> ```bash
> node greeter.js Ramesh Gehun
> ```

### process.exit() — Program Band Karo

```javascript
// Kisi error pe program band karo
if (!process.argv[2]) {
    console.error("Error: Naam nahi diya!");
    process.exit(1);  // 1 = error se exit
}
// Normal exit
process.exit(0);  // 0 = sab theek hai
```

---

## Global vs Window — Bahut Important Difference!

### Browser Mein: `window` Object

Browser JavaScript mein `window` global object hai:
```javascript
// Browser mein (console mein try karo)
console.log(window.innerWidth);  // ✅ works in browser
console.log(window.location);    // ✅ works in browser
```

### Node.js Mein: `global` Object

Node.js mein `window` nahi hai! Yahan `global` object hai:
```javascript
// Node.js mein
console.log(global);  // ✅ works in Node.js
console.log(window);  // ❌ ReferenceError: window is not defined
```

### Comparison Table

| Feature | Browser | Node.js |
|---------|---------|---------|
| Global Object | `window` | `global` |
| DOM Access | `document` ✅ | Nahi ❌ |
| File System | Nahi ❌ | `fs` module ✅ |
| `console.log` | Console panel | Terminal |
| `setTimeout` | ✅ Available | ✅ Available |
| `fetch` | ✅ Built-in | ✅ (Node 18+) |
| `process` | Nahi ❌ | ✅ Available |
| `__dirname` | Nahi ❌ | ✅ Available |
| `require()` | Nahi ❌ | ✅ Available |

> **Yaad Rakho:** Node.js mein koi browser wali cheezein nahi hain — na DOM, na window, na document. Lekin Node.js mein file system access hai, operating system info hai, network capabilities hain — jo browser mein nahi milti!

### globalThis — Universal Solution

ES2020 mein `globalThis` aaya — ye dono jagah kaam karta hai:
```javascript
// Browser mein: globalThis === window (true)
// Node.js mein: globalThis === global (true)

console.log(globalThis);  // Dono jagah kaam karega!
```

---

## Quick Revision Table

| Concept | Key Point |
|---------|-----------|
| **Node.js** | JavaScript runtime — browser ke bahar JS chalata hai |
| **V8 Engine** | Google ka JS engine — code ko machine code mein convert karta hai |
| **REPL** | Interactive mode — ek-ek line test karo |
| **process** | Global object — running program ki info deta hai |
| **process.argv** | Command line se arguments receive karo |
| **process.exit()** | Program ko manually band karo |
| **global** | Node.js ka global object (browser mein `window` hota hai) |
| **globalThis** | Universal global object — har jagah kaam karta hai |
| **npm** | Node Package Manager — libraries install karo |
| **Non-blocking** | Ek kaam hone ka wait nahi karta, agla kaam shuru kar deta hai |

---

## Aaj Kya Seekha?

1. **Node.js** ek runtime hai, language nahi — JavaScript ko server pe chalata hai
2. **V8 engine** JavaScript ko fast machine code mein convert karta hai
3. **REPL** mein interactive coding kar sakte ho
4. **process** object se system info, arguments, memory sab mil jata hai
5. **process.argv** se command line se data le sakte ho
6. **global** Node.js ka top-level object hai, browser mein `window` hota hai
7. Node.js mein **DOM nahi hai**, lekin **file system access** hai

> **Tip:** Aaj evening mein hum in sab concepts ko practically use karenge. Abhi ek baar REPL khol ke 5-10 commands khud try karo!
