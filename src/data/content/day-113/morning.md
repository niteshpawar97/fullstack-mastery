# Day 113 Morning: Load Testing — Artillery & k6 Introduction

> **Aaj ka plan:** Aaj hum seekhenge ki apne API ko production jaane se pehle load test kaise karte hain. Artillery aur k6 — dono tools sikhenge. Pata chalega ki tumhara app kitne users handle kar sakta hai!

---

## Load Testing Kyu Zaroori Hai?

### Bina Load Test Ke Kya Hota Hai

```
Development mein: "Sab kuch fast hai, 50ms response!" 😊
Production mein (1000 users): "Server crash ho gaya!" 😭
```

> **Socho Aise:** Ek naya bridge bana hai. Kya tum bina test kiye uspe 1000 trucks bhejna chahoge? Nahi na! Pehle test karoge ki kitna weight handle kar sakta hai. Load testing wahi hai — tumhare API ka stress test!

### Types of Testing

| Type | Kya Karta Hai | Example |
|------|--------------|---------|
| Load Test | Normal expected load simulate | 500 users 5 min ke liye |
| Stress Test | Limit se zyada load daalo | 5000 users ek saath |
| Spike Test | Achanak se load badhao | 0 → 3000 users in 10 seconds |
| Soak Test | Lamba time tak load do | 200 users 2 hours ke liye |
| Breakpoint Test | Jab tak tute nahi tab tak | 100, 500, 1000, 2000... badhate jaao |

---

## Artillery — Easy Load Testing Tool

### Installation

```bash
npm install -g artillery
```

### Basic Test — Command Line Se

```bash
# Simple quick test — 10 users, 5 seconds
artillery quick --count 10 --num 5 http://localhost:3000/api/products

# --count 10  → 10 virtual users
# --num 5     → har user 5 requests bhejega
```

> **Expected Output:**
```
All VUs finished.
Summary report:
  http.requests: 50
  http.codes.200: 50
  http.response_time:
    min: 12
    max: 145
    median: 23
    p95: 89
    p99: 132
```

### Artillery Config File — Real Test

```yaml
# load-test.yml — Detailed test configuration
config:
  target: "http://localhost:3000"  # API ka URL
  phases:
    # Phase 1: Warm up — dheere dheere users badhao
    - duration: 30        # 30 seconds
      arrivalRate: 5      # 5 users per second aayenge
      name: "Warm up"
    
    # Phase 2: Normal load — steady users
    - duration: 60        # 1 minute
      arrivalRate: 20     # 20 users per second
      name: "Normal Load"
    
    # Phase 3: Peak load — zyada users
    - duration: 30
      arrivalRate: 50     # 50 users per second!
      name: "Peak Load"
    
    # Phase 4: Spike — achanak se load badhao
    - duration: 10
      arrivalRate: 100    # 100 users per second!
      name: "Spike!"
  
  # Response time thresholds — isse zyada toh fail
  ensure:
    thresholds:
      - http.response_time.p99: 500   # 99th percentile < 500ms
      - http.response_time.p95: 200   # 95th percentile < 200ms

scenarios:
  - name: "Farmer Product Browsing"
    flow:
      # Step 1: Products list dekho
      - get:
          url: "/api/products"
          headers:
            Accept: "application/json"
      
      # Step 2: Thoda wait karo (real user ki tarah)
      - think: 2  # 2 second pause
      
      # Step 3: Ek specific product dekho
      - get:
          url: "/api/products/1"
      
      # Step 4: Order place karo
      - post:
          url: "/api/orders"
          json:
            farmerId: "F001"
            product: "Wheat Seeds"
            quantity: 50
            pricePerUnit: 120
          headers:
            Content-Type: "application/json"
```

```bash
# Test run karo
artillery run load-test.yml

# HTML report ke saath
artillery run --output report.json load-test.yml
artillery report report.json --output report.html
```

> **Tip:** `think` parameter bahut important hai. Real users instantly next request nahi bhejte — wo page padhte hain, scroll karte hain. Bina think ke test unrealistic results dega!

---

## Artillery Mein Dynamic Data

```yaml
# Har request mein different data bhejo — realistic test
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
  
  # CSV file se test data load karo
  payload:
    path: "./test-data/farmers.csv"
    fields:
      - "farmerId"
      - "farmerName"
      - "product"

scenarios:
  - name: "Dynamic Order Flow"
    flow:
      - post:
          url: "/api/orders"
          json:
            farmerId: "{{ farmerId }}"
            farmerName: "{{ farmerName }}"
            product: "{{ product }}"
            quantity: "{{ $randomNumber(10, 500) }}"
```

Test data CSV file:
```csv
farmerId,farmerName,product
F001,Ramesh Kumar,Wheat
F002,Suresh Singh,Rice
F003,Priya Devi,Cotton
F004,Amit Patel,Sugarcane
```

> **Yaad Rakho:** Real load test mein varied data use karo. Agar har request same data bhejogi toh cache hit hoga aur results misleading honge!

---

## Important Metrics Samjho

### Response Time Percentiles

```
p50 (Median): 50% requests isse fast hain
p95:          95% requests isse fast hain  ← Most important!
p99:          99% requests isse fast hain
Max:          Sabse slow request

Example:
p50: 25ms   → "Normal users ko 25ms lagta hai"
p95: 150ms  → "95% users ko 150ms se kam lagta hai"
p99: 800ms  → "1% users ko 800ms tak lag sakta hai" ⚠️
Max: 5000ms → "Kisi ek bechare ko 5 second laga" 💀
```

> **Yaad Rakho:** p95 pe focus karo, average pe nahi! Average misleading hota hai — agar 99 requests 10ms mein aayein aur 1 request 10 seconds le, toh average 109ms dikhega lekin reality mein ek user bahut suffer kara!

### Throughput (Requests Per Second)

```
RPS = Total Requests / Total Time

Good: 1000+ RPS — tumhara API fast hai
Okay: 100-1000 RPS — acceptable for most apps  
Bad:  <100 RPS — optimization chahiye
```

---

## Quick Revision Table

| Metric | Kya Hai | Good Value |
|--------|---------|-----------|
| p50 | Median response time | < 50ms |
| p95 | 95th percentile | < 200ms |
| p99 | 99th percentile | < 500ms |
| RPS | Requests per second | > 500 |
| Error Rate | Failed requests % | < 0.1% |
| Throughput | Data transfer rate | Depends on payload |

---

## Aaj Kya Seekha?

1. **Load testing** production jaane se pehle zaroori hai — nahi toh real users pe crash hoga
2. **Artillery** easy aur powerful load testing tool hai Node.js ecosystem mein
3. **Phases** se realistic traffic patterns simulate karo — warm up, normal, peak, spike
4. **p95 response time** sabse important metric hai — average pe mat jaao
5. **Dynamic data** use karo tests mein — same data se cache hit hoga aur results galat aayenge

> **Practice Time!** Apne kisi Express API ke liye ek Artillery config file likho jo 4 phases mein test kare. CSV file banao 10 farmers ke data ke saath. Run karo aur HTML report generate karo!
