# Day 112 Evening: Advanced Profiling — Heap Snapshots & CPU Optimization

> **Aaj ka plan:** Evening mein hum Chrome DevTools se heap snapshots lenge, CPU-heavy code optimize karenge, aur production-ready monitoring setup karenge. Hands-on debugging session!

---

## Chrome DevTools Se Node.js Debug Karo

### Heap Snapshot Lena

Heap snapshot ek photo hai memory ki — kaunsa object kitni memory le raha hai, sab dikhta hai.

```bash
# Node.js ko inspect mode mein start karo
node --inspect server.js

# Output aayega:
# Debugger listening on ws://127.0.0.1:9229/...
```

Ab Chrome browser mein jaao:
1. `chrome://inspect` kholo
2. "Remote Target" mein tumhara Node app dikhega
3. "inspect" pe click karo
4. Memory tab → "Take Heap Snapshot"

> **Socho Aise:** Heap snapshot lena aise hai jaise godown ka photo lo — kaunsa saamaan kitni jagah le raha hai, kya unnecessary pada hai, sab dikhai dega!

---

## Programmatic Heap Snapshot

```typescript
// Production mein Chrome DevTools nahi khol sakte
// Programmatically snapshot lo
import v8 from 'v8';
import fs from 'fs';

// Endpoint banao — jab chahiye tab snapshot lo
app.get('/debug/heap-snapshot', (req, res) => {
  const snapshotFile = `/tmp/heap-${Date.now()}.heapsnapshot`;
  
  // Snapshot write karo file mein
  const snapshotStream = v8.writeHeapSnapshot(snapshotFile);
  
  console.log(`Heap snapshot saved: ${snapshotStream}`);
  res.json({ 
    message: 'Snapshot saved!', 
    file: snapshotStream,
    tip: 'Chrome DevTools mein load karo analysis ke liye'
  });
});

// Periodic memory check — alert bhejo agar memory zyada ho
setInterval(() => {
  const used = process.memoryUsage();
  const heapUsedMB = used.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > 500) { // 500MB se zyada
    console.error(`MEMORY ALERT: Heap used ${heapUsedMB.toFixed(2)} MB!`);
    // Yahan alert bhejo — Slack, PagerDuty, etc.
    v8.writeHeapSnapshot(`/tmp/high-memory-${Date.now()}.heapsnapshot`);
  }
}, 30000); // Har 30 second check karo
```

> **Warning:** Heap snapshot lena ek heavy operation hai — production mein frequently mat lo. Sirf jab memory issue investigate karna ho tab lo!

---

## CPU Profiling — Slow Functions Dhundho

### Flame Graph Samjho

```
|---- functionA (40% CPU) ----|
     |-- funcB (20%) --|-- funcC (20%) --|
                            |-- funcD (15%) --|

// Jo function sabse wide hai — wo sabse zyada CPU khata hai
// funcA 40% CPU use kar rahi hai
// funcD deeply nested hai aur 15% le rahi hai
```

### Code Level CPU Optimization

```typescript
// SLOW — O(n²) algorithm
// Farmer data mein duplicate products dhundho
function findDuplicatesSlow(products: string[]): string[] {
  const duplicates: string[] = [];
  
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      if (products[i] === products[j] && !duplicates.includes(products[i])) {
        duplicates.push(products[i]);
      }
    }
  }
  return duplicates;
}
// 10,000 products → 100,000,000 comparisons! 💀

// FAST — O(n) algorithm using Set
function findDuplicatesFast(products: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  
  for (const product of products) {
    if (seen.has(product)) {
      duplicates.add(product); // Set.has() is O(1)
    }
    seen.add(product);
  }
  return [...duplicates];
}
// 10,000 products → 10,000 operations! ⚡
```

### Benchmark Karo — Kitna Fast Hua?

```typescript
// Performance measurement — console.time se
function benchmark() {
  const products = Array.from(
    { length: 50000 }, 
    (_, i) => `Product-${i % 10000}` // Kuch duplicates honge
  );
  
  console.time('Slow method');
  findDuplicatesSlow(products);
  console.timeEnd('Slow method');
  // Slow method: 4523.456ms
  
  console.time('Fast method');
  findDuplicatesFast(products);
  console.timeEnd('Fast method');
  // Fast method: 3.214ms
  // 1400x faster! 🚀
}
```

> **Yaad Rakho:** Algorithm optimization sabse bada performance gain deta hai. O(n²) ko O(n) banana — koi caching ya scaling is kadar improvement nahi de sakta!

---

## Event Loop Monitoring

```typescript
// Event loop lag detect karo — agar lag zyada hai toh CPU overloaded hai
import { monitorEventLoopDelay } from 'perf_hooks';

// Histogram banao — event loop delay measure karega
const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

// Har 5 second pe stats dekho
setInterval(() => {
  const stats = {
    min: `${(histogram.min / 1e6).toFixed(2)}ms`,
    max: `${(histogram.max / 1e6).toFixed(2)}ms`,
    mean: `${(histogram.mean / 1e6).toFixed(2)}ms`,
    p99: `${(histogram.percentile(99) / 1e6).toFixed(2)}ms`,
  };
  
  console.log('Event Loop Stats:', stats);
  
  // Agar mean 100ms se zyada hai toh problem hai
  if (histogram.mean / 1e6 > 100) {
    console.warn('EVENT LOOP BLOCKED! Check CPU-heavy operations.');
  }
  
  histogram.reset();
}, 5000);
```

> **Expected Output:**
```
Event Loop Stats: { min: '0.12ms', max: '2.45ms', mean: '0.89ms', p99: '1.87ms' }
```
Healthy app mein mean < 10ms hona chahiye. 100ms+ matlab serious problem!

---

## Worker Threads — CPU Work Offload Karo

```typescript
// Heavy CPU work ko main thread se hatao
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (isMainThread) {
  // Main thread — API serve karta hai
  app.get('/api/report', async (req, res) => {
    // Heavy report generation worker thread mein karo
    const result = await runInWorker('./reportGenerator.js', {
      farmerId: req.query.farmerId,
      dateRange: req.query.range,
    });
    
    res.json(result);
  });
  
  function runInWorker(file: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(file, { workerData: data });
      worker.on('message', resolve);   // Result mila
      worker.on('error', reject);      // Error aayi
    });
  }
  
} else {
  // Worker thread — heavy computation yahan
  const data = workerData;
  
  // CPU-intensive report generation
  const report = generateHeavyReport(data);
  
  // Result main thread ko bhejo
  parentPort?.postMessage(report);
}
```

> **Tip:** Worker threads sirf CPU-heavy kaam ke liye use karo (image processing, PDF generation, data analysis). I/O operations (database, file read) ke liye async/await kaafi hai!

---

## Production Monitoring Setup

```typescript
// Simple but effective monitoring middleware
function performanceMonitor() {
  return (req: any, res: any, next: any) => {
    const start = process.hrtime.bigint();
    const startMemory = process.memoryUsage().heapUsed;
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e6; // ms mein
      const memoryDiff = process.memoryUsage().heapUsed - startMemory;
      
      // Slow requests log karo — baad mein investigate karo
      if (duration > 1000) {
        console.warn(`SLOW REQUEST: ${req.method} ${req.url} — ${duration.toFixed(2)}ms`);
      }
      
      // Memory spike log karo
      if (memoryDiff > 10 * 1024 * 1024) { // 10MB+ increase
        console.warn(`MEMORY SPIKE: ${req.method} ${req.url} — +${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
      }
    });
    
    next();
  };
}

app.use(performanceMonitor());
```

---

## Quick Revision Table

| Technique | Use Case | Tool |
|-----------|----------|------|
| Heap Snapshot | Memory leak investigate karna | Chrome DevTools, v8 module |
| Flame Graph | CPU bottleneck dhundhna | Clinic.js, Chrome DevTools |
| Event Loop Monitor | Event loop blocking detect | perf_hooks module |
| Worker Threads | CPU work offload karna | worker_threads module |
| console.time() | Quick benchmark | Built-in Node.js |
| Performance Middleware | Request-level monitoring | Custom Express middleware |

---

## Aaj Kya Seekha?

1. **Heap snapshots** se memory leak ka exact source dhundh sakte ho
2. **Algorithm optimization** (O(n²) → O(n)) sabse bada performance gain deta hai
3. **Event loop monitoring** se pata chalta hai ki app overloaded hai ya nahi
4. **Worker threads** CPU-heavy kaam ko main thread se hatate hain
5. Production mein **performance middleware** lagao jo slow requests aur memory spikes log kare

> **Practice Time!** Apne kisi purane Express project mein `performanceMonitor` middleware add karo. Phir Artillery se load test karo aur dekho kaunse endpoints slow hain. Fix karne ki koshish karo!
