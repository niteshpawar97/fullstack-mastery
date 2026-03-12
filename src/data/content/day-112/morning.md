# Day 112 Morning: Performance Optimization — Profiling & Memory Leaks

> **Aaj ka plan:** Aaj hum seekhenge ki Node.js application slow kyu hoti hai, memory leaks kaise detect karte hain, aur profiling tools se bottlenecks kaise dhundhte hain. Production mein ye skills bahut critical hain!

---

## Performance Kyu Important Hai?

### Real-World Scenario

Socho tumhara farmer marketplace app hai. 100 users pe sab smooth hai. Lekin jab 10,000 farmers ek saath login karte hain toh:
- API responses 5 seconds le rahe hain (pehle 200ms the)
- Server ka memory badhta ja raha hai (memory leak!)
- Eventually server crash ho jaata hai

> **Socho Aise:** Jaise ek nali (pipe) mein paani beh raha hai. Chhoti nali mein zyada paani daaloge toh pressure badhega aur nali phoot sakti hai. Performance optimization matlab — nali ko moti karo ya paani ka flow manage karo!

---

## Node.js Mein Performance Bottlenecks

### Common Culprits

| Bottleneck | Kya Hota Hai | Example |
|-----------|-------------|---------|
| CPU-bound work | Heavy computation event loop block karta hai | Image processing, encryption |
| Memory Leak | Memory allocate hoti hai lekin free nahi hoti | Global arrays mein data push karna |
| Blocking I/O | Synchronous operations sab kuch rok deti hain | `fs.readFileSync` in request handler |
| N+1 Queries | Database ko baar baar call karna loop mein | User ke har order ke liye alag query |
| Unoptimized Queries | Database query slow hai | Index missing, full table scan |

> **Warning:** Node.js single-threaded hai! Agar tum CPU-heavy kaam main thread pe karo toh poora server ruk jaayega. Koi bhi user ka request process nahi hoga.

---

## Memory Leaks Samjho

### Memory Leak Kya Hai?

Normal flow:
```
Variable create → Use karo → Function khatam → Garbage Collector free kare ✅
```

Memory Leak:
```
Variable create → Use karo → Reference abhi bhi hai → GC free NAHI kar sakta ❌
```

### Common Memory Leak Patterns

```typescript
// PATTERN 1: Global array mein push karte rehna
// YE GALAT HAI — memory badhti jaayegi!
const requestLogs: any[] = []; // Global variable

app.get('/api/data', (req, res) => {
  // Har request pe log push ho raha hai
  // Lekin kabhi clear nahi ho raha!
  requestLogs.push({
    url: req.url,
    time: new Date(),
    headers: req.headers, // Bada object hai ye
  });
  
  res.json({ data: 'some data' });
});

// 1 lakh requests ke baad requestLogs mein 1 lakh entries hongi
// Memory usage: 100MB → 500MB → 1GB → CRASH!
```

```typescript
// SAHI TARIKA — Bounded cache use karo
const MAX_LOGS = 1000;
const requestLogs: any[] = [];

app.get('/api/data', (req, res) => {
  requestLogs.push({
    url: req.url,
    time: new Date(),
  });
  
  // Purane logs hatao — memory bounded rahegi
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.shift(); // Sabse purana hatao
  }
  
  res.json({ data: 'some data' });
});
```

> **Yaad Rakho:** Har cheez jo global scope mein hai aur grow hoti jaati hai — wo potential memory leak hai. Arrays, Maps, Sets — sab pe nazar rakho!

---

## Pattern 2: Event Listener Leak

```typescript
// GALAT — Har request pe naya listener add ho raha hai
app.get('/api/stream', (req, res) => {
  // Ye listener kabhi remove nahi hoga!
  process.on('data-update', (data) => {
    res.write(JSON.stringify(data));
  });
});
// 1000 requests = 1000 listeners = memory leak!

// SAHI TARIKA — Listener remove karo jab zaroorat na ho
app.get('/api/stream', (req, res) => {
  const handler = (data: any) => {
    res.write(JSON.stringify(data));
  };
  
  process.on('data-update', handler);
  
  // Jab connection band ho, listener hatao
  req.on('close', () => {
    process.removeListener('data-update', handler);
    console.log('Listener remove kiya — memory free!');
  });
});
```

> **Tip:** Node.js warning deta hai jab ek emitter pe 10+ listeners lag jaate hain: `MaxListenersExceededWarning`. Ye almost hamesha memory leak ka sign hai!

---

## Pattern 3: Closure Leak

```typescript
// GALAT — Closure bade object ko hold kar rahi hai
function processData() {
  const hugeData = Buffer.alloc(100 * 1024 * 1024); // 100MB data
  
  // Ye function hugeData ka reference hold karega
  // Jab tak timer chale, 100MB free nahi hoga!
  setInterval(() => {
    console.log('Data size:', hugeData.length);
  }, 1000);
}

// SAHI — Sirf needed data extract karo
function processData() {
  const hugeData = Buffer.alloc(100 * 1024 * 1024);
  const dataSize = hugeData.length; // Sirf size le lo
  // Ab hugeData GC kar sakta hai!
  
  setInterval(() => {
    console.log('Data size:', dataSize); // Sirf number hold hai
  }, 1000);
}
```

---

## Profiling Tools — Bottleneck Dhundho

### Tool 1: Node.js Built-in Profiler

```bash
# V8 profiler ke saath app start karo
node --prof server.js

# Load generate karo (artillery ya curl se)
# Phir profile analyze karo
node --prof-process isolate-*.log > profile.txt
```

### Tool 2: process.memoryUsage()

```typescript
// Memory monitoring endpoint — production mein bahut useful
app.get('/health/memory', (req, res) => {
  const memory = process.memoryUsage();
  
  res.json({
    rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,        // Total memory
    heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`, // V8 heap total
    heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,  // V8 heap used
    external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`,  // C++ objects
    arrayBuffers: `${(memory.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
  });
});
```

> **Expected Output:**
```json
{
  "rss": "45.23 MB",
  "heapTotal": "18.50 MB",
  "heapUsed": "15.32 MB",
  "external": "1.24 MB",
  "arrayBuffers": "0.12 MB"
}
```

### Tool 3: Clinic.js (Best Visual Tool)

```bash
# Install karo
npm install -g clinic

# Doctor — overall health check
clinic doctor -- node server.js

# Flame — CPU profiling (flame graph)
clinic flame -- node server.js

# Bubbleprof — async operations visualize
clinic bubbleprof -- node server.js
```

> **Tip:** `clinic flame` sabse useful hai. Ye ek flame graph banata hai jismein clearly dikhta hai ki kaunsa function kitna time le raha hai. Jo function sabse wide hai wo sabse zyada CPU use kar raha hai!

---

## Quick Revision Table

| Problem | Detection Tool | Fix |
|---------|---------------|-----|
| Memory Leak | `process.memoryUsage()`, Heap Snapshot | Bounded collections, remove listeners |
| CPU Bottleneck | Clinic Flame, `--prof` | Worker threads, optimize algorithm |
| Slow I/O | Clinic Doctor | Async operations, caching |
| Event Listener Leak | `emitter.listenerCount()` | `removeListener` on cleanup |
| N+1 Queries | Query logging | Eager loading, batch queries |

---

## Aaj Kya Seekha?

1. **Memory leaks** tab hoti hain jab allocated memory free nahi hoti — global arrays, event listeners, closures main culprits hain
2. **Bounded collections** use karo — size limit lagao arrays/maps pe
3. **Event listeners** hamesha remove karo jab zaroorat khatam ho
4. **process.memoryUsage()** se real-time memory monitor kar sakte ho
5. **Clinic.js** best visual profiling tool hai Node.js ke liye

> **Practice Time!** Ek Express app banao jismein deliberately memory leak ho (global array mein push karo). Phir `/health/memory` endpoint se memory badhte hue dekho. Phir fix karo aur difference dekho!
