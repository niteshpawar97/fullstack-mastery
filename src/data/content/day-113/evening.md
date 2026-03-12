# Day 113 Evening: k6 Load Testing & Benchmarking Strategies

> **Aaj ka plan:** Ab hum k6 seekhenge — Grafana ka powerful load testing tool jo JavaScript mein tests likhne deta hai. Plus benchmarking strategies sikhenge jo production mein kaam aayengi.

---

## k6 Kya Hai?

k6 Grafana Labs ka open-source load testing tool hai. Artillery se powerful hai kyunki:
- Tests JavaScript mein likhte ho (familiar!)
- Built-in checks aur thresholds
- Grafana dashboards se integrate hota hai
- CLI-friendly — CI/CD pipeline mein easy

> **Socho Aise:** Artillery ek basic weighing machine hai — weight bata dega. k6 ek full body scanner hai — weight, muscle, fat, bone density — sab bata dega!

### Installation

```bash
# macOS
brew install k6

# Windows (chocolatey)
choco install k6

# Docker se bhi chal sakta hai
docker run -i grafana/k6 run - < test.js
```

---

## k6 Test Likhna Seekho

### Basic Test

```javascript
// load-test.js — k6 test file
import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration — stages mein load define karo
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // 30s mein 0→20 users
    { duration: '1m', target: 50 },   // 1min tak 50 users steady
    { duration: '30s', target: 100 }, // 30s mein 50→100 users
    { duration: '1m', target: 100 },  // 1min tak 100 users steady
    { duration: '30s', target: 0 },   // 30s mein 100→0 users (ramp down)
  ],
  
  // Thresholds — ye pass hona chahiye
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // Response time limits
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
    'checks': ['rate>0.99'],                        // 99% checks pass hone chahiye
  },
};

// Ye function har virtual user ke liye bar bar chalega
export default function () {
  // Step 1: Products list fetch karo
  const productsRes = http.get('http://localhost:3000/api/products');
  
  // Check karo — response sahi hai ya nahi
  check(productsRes, {
    'products status 200': (r) => r.status === 200,
    'products response < 200ms': (r) => r.timings.duration < 200,
    'products list not empty': (r) => JSON.parse(r.body).length > 0,
  });
  
  sleep(1); // 1 second wait — real user simulate
  
  // Step 2: Ek product ki detail dekho
  const detailRes = http.get('http://localhost:3000/api/products/1');
  
  check(detailRes, {
    'detail status 200': (r) => r.status === 200,
    'has product name': (r) => JSON.parse(r.body).name !== undefined,
  });
  
  sleep(2); // User product padh raha hai
  
  // Step 3: Order place karo
  const orderPayload = JSON.stringify({
    farmerId: `F${Math.floor(Math.random() * 1000)}`,
    product: 'Wheat Seeds',
    quantity: Math.floor(Math.random() * 100) + 1,
    pricePerUnit: 120,
  });
  
  const orderRes = http.post(
    'http://localhost:3000/api/orders',
    orderPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(orderRes, {
    'order created': (r) => r.status === 201 || r.status === 202,
    'order has id': (r) => JSON.parse(r.body).orderId !== undefined,
  });
  
  sleep(1);
}
```

```bash
# Test run karo
k6 run load-test.js

# JSON output ke saath — CI/CD mein useful
k6 run --out json=results.json load-test.js
```

> **Expected Output:**
```
     scenarios: (100.00%) 1 scenario, 100 max VUs, 3m30s max duration
     
     ✓ products status 200
     ✓ products response < 200ms
     ✓ products list not empty
     ✓ detail status 200
     ✓ order created
     
     checks.....................: 99.45% ✓ 12834  ✗ 71
     http_req_duration..........: avg=45ms  min=8ms  p(95)=156ms  p(99)=342ms
     http_req_failed............: 0.23%  ✓ 30     ✗ 12905
     http_reqs..................: 12935  71.86/s
     vus........................: 100    min=0    max=100
```

---

## Advanced k6 Features

### Custom Metrics

```javascript
// Custom metrics track karo — business-specific
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

// Custom metrics define karo
const orderCreated = new Counter('orders_created');     // Kitne orders bane
const orderLatency = new Trend('order_creation_time');  // Order banane ka time
const orderSuccess = new Rate('order_success_rate');    // Success percentage
const activeOrders = new Gauge('active_orders');        // Current active orders

export default function () {
  const start = Date.now();
  
  const res = http.post('http://localhost:3000/api/orders', orderPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const duration = Date.now() - start;
  
  // Custom metrics update karo
  orderCreated.add(1);                          // Order count +1
  orderLatency.add(duration);                   // Time record karo
  orderSuccess.add(res.status === 201);         // Success ya nahi
  activeOrders.add(Math.floor(Math.random() * 50)); // Current gauge
  
  sleep(1);
}
```

### Scenario-Based Testing

```javascript
// Multiple scenarios — different user behaviors
export const options = {
  scenarios: {
    // Scenario 1: Farmers browsing products
    browsing_farmers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      exec: 'browsingFlow',      // Kaunsa function chalega
    },
    
    // Scenario 2: Farmers placing orders (kam users)
    ordering_farmers: {
      executor: 'constant-arrival-rate',
      rate: 10,                   // 10 orders per second
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 20,
      exec: 'orderingFlow',
    },
    
    // Scenario 3: Admin checking reports
    admin_reports: {
      executor: 'per-vu-iterations',
      vus: 5,                     // Sirf 5 admins
      iterations: 10,             // Har admin 10 reports dekhega
      exec: 'adminFlow',
    },
  },
};

// Alag-alag flows define karo
export function browsingFlow() {
  http.get('http://localhost:3000/api/products');
  sleep(3); // Farmers dheere browse karte hain
}

export function orderingFlow() {
  http.post('http://localhost:3000/api/orders', orderPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  sleep(1);
}

export function adminFlow() {
  http.get('http://localhost:3000/api/admin/reports');
  sleep(5); // Admin report padhta hai
}
```

> **Tip:** Real applications mein alag-alag users alag-alag kaam karte hain. Scenarios se tum ye realistic pattern simulate kar sakte ho — 80% log browse karte hain, 15% order dete hain, 5% admin hote hain.

---

## Benchmarking Strategy

### Step-by-Step Approach

```
Step 1: Baseline establish karo (current performance)
Step 2: Target define karo (kitna fast chahiye)
Step 3: Bottleneck dhundho (profiling se)
Step 4: Optimize karo (code/infra fix)
Step 5: Re-benchmark karo (improvement verify)
Step 6: Repeat until target meet ho
```

### Benchmarking Checklist

```typescript
// API endpoint benchmarking script
import http from 'k6/http';
import { check } from 'k6';

const ENDPOINTS = [
  { name: 'GET Products', method: 'GET', url: '/api/products' },
  { name: 'GET Product by ID', method: 'GET', url: '/api/products/1' },
  { name: 'POST Order', method: 'POST', url: '/api/orders', body: '{"farmerId":"F1"}' },
  { name: 'GET Orders', method: 'GET', url: '/api/orders' },
  { name: 'GET Health', method: 'GET', url: '/health' },
];

// Har endpoint individually test karo
export default function () {
  for (const endpoint of ENDPOINTS) {
    const res = endpoint.method === 'GET'
      ? http.get(`http://localhost:3000${endpoint.url}`)
      : http.post(`http://localhost:3000${endpoint.url}`, endpoint.body, {
          headers: { 'Content-Type': 'application/json' },
        });
    
    check(res, {
      [`${endpoint.name} - status OK`]: (r) => r.status < 400,
      [`${endpoint.name} - fast`]: (r) => r.timings.duration < 200,
    });
  }
  
  // Kaafi sleep — har iteration mein sab endpoints test ho
}
```

---

## Artillery vs k6 — Kab Kya Use Karein?

| Feature | Artillery | k6 |
|---------|----------|-----|
| Language | YAML + JS plugins | JavaScript |
| Learning Curve | Easy | Medium |
| Custom Metrics | Limited | Powerful |
| CI/CD Integration | Good | Excellent |
| Grafana Dashboard | Manual | Built-in |
| Scenarios | Basic | Advanced |
| Cloud Service | Artillery Cloud | Grafana Cloud k6 |
| Best For | Quick tests, simple APIs | Complex scenarios, microservices |

> **Yaad Rakho:** Chhoti team aur simple APIs ke liye Artillery kaafi hai. Bade projects, complex scenarios, aur CI/CD automation ke liye k6 better choice hai.

---

## Quick Revision Table

| Concept | Kya Hai | Tool |
|---------|---------|------|
| Load Test | Normal traffic simulate | Artillery/k6 |
| Stress Test | Breaking point dhundho | k6 ramping-vus |
| Spike Test | Sudden traffic burst | k6 scenarios |
| Soak Test | Long duration test | Both tools |
| p95 | 95% requests isse fast | Key metric |
| Threshold | Pass/fail criteria | k6 thresholds |
| Check | Response validation | k6 check() |
| Custom Metric | Business-specific tracking | k6 Counter/Trend/Rate |

---

## Aaj Kya Seekha?

1. **k6** JavaScript mein load tests likhne deta hai — powerful aur flexible
2. **Stages** se realistic traffic patterns banao — ramp up, steady, ramp down
3. **Checks** se response validate karo — status code, body content, response time
4. **Thresholds** se automatic pass/fail criteria set karo — CI/CD mein useful
5. **Scenarios** se multiple user behaviors simultaneously simulate karo
6. **Artillery** quick tests ke liye, **k6** complex scenarios ke liye

> **Practice Time!** k6 install karo aur ek test likho jo tumhare API ke 3 endpoints test kare. 2 scenarios banao — "normal users" aur "power users". Thresholds set karo aur dekho pass hote hain ya nahi!
