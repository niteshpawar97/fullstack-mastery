# Day 67 Morning: Week 10 Revision — System Design, Redis, Docker, AWS EC2

> **Aaj ka plan:** Aaj revision day hai! Poore week ka recap karenge — System Design (Monolith/Modular/Micro), Redis Caching, Docker + Docker Compose, aur AWS EC2 deployment. Common mistakes bhi cover karenge taaki production mein galti na ho!

---

## Week 10 Ka Overview

### Kya Seekha Is Week Mein?

| Day | Topic | Key Takeaway |
|-----|-------|-------------|
| Day 61 | System Design + Monolith | Software ka blueprint, ek unit mein sab kuch |
| Day 62 | Modular + Microservices | Module boundaries, independent services |
| Day 63 | Redis Caching | In-memory cache, 10-100x faster responses |
| Day 64 | Docker Basics | Containers, Dockerfile, image build |
| Day 65 | Docker Compose | Multi-container setup, volumes, networks |
| Day 66 | AWS EC2 | Cloud deployment, SSH, PM2, live app |

> **Yaad Rakho:** Is week mein tum developer se **DevOps engineer** ki taraf ek kadam badhe ho! Ab tumhe sirf code likhna nahi, deploy karna bhi aata hai.

---

## Revision 1: System Design — Architecture Patterns

### Monolithic Architecture

```
Ek building, ek floor, sab ek saath:

┌────────────────────────┐
│   MONOLITH             │
│ Auth + Products + Orders│
│ + Payments + Reviews   │
│                        │
│   Single Database      │
│   Single Deploy        │
│   Single Codebase      │
└────────────────────────┘

Best for: Small team, MVP, startup
Problem: Scaling, tight coupling
```

### Modular Monolith

```
Ek building, alag-alag rooms:

┌────────────────────────┐
│  ┌──────┐  ┌────────┐ │
│  │ Auth │  │Products│ │   Har module ka apna
│  │Module│  │ Module │ │   controller, service,
│  └──────┘  └────────┘ │   model, routes
│  ┌──────┐  ┌────────┐ │
│  │Orders│  │Payment │ │   Lekin ek deploy,
│  │Module│  │ Module │ │   ek database
│  └──────┘  └────────┘ │
│   Shared Database      │
└────────────────────────┘

Best for: Growing team, clear boundaries
Rule: Module doosre module ka model directly import nahi karega!
```

### Microservices

```
Alag-alag buildings:

┌──────┐  ┌────────┐  ┌──────┐
│ Auth │  │Products│  │Orders│
│ :3001│  │ :3002  │  │:3003 │
│ Own  │  │ Own    │  │ Own  │
│  DB  │  │  DB    │  │  DB  │
└──┬───┘  └───┬────┘  └──┬───┘
   └──────────┼──────────┘
        API Gateway
        
Communication: REST (sync) + Message Queue (async)
Best for: Large team (20+), high scale
Warning: Complex! Don't start with this!
```

### Decision Flow

```
Small team + MVP → MONOLITH
Growing app → MODULAR MONOLITH
Large scale + big team → MICROSERVICES

Golden Rule: Monolith → Modular → Micro (step by step evolve karo)
```

> **Socho Aise:** Architecture choose karna aise hai jaise ghar choose karna — akele ho to 1BHK kaafi, family hai to 2BHK, joint family hai to bungalow chahiye. Zaroorat ke hisaab se choose karo!

---

## Revision 2: Redis Caching

### Redis Kya Hai — Quick Recap

```
Redis = In-memory data store (RAM mein data)
Speed = 100,000+ operations per second
Port  = 6379

Data Types:
┌─────────────┬──────────────────────────────────┐
│ Strings     │ SET/GET — simple key-value        │
│ Hashes      │ HSET/HGETALL — object jaisa       │
│ Lists       │ LPUSH/LRANGE — ordered collection  │
│ Sets        │ SADD/SMEMBERS — unique values      │
│ Sorted Sets │ ZADD/ZREVRANGE — scored + sorted   │
└─────────────┴──────────────────────────────────┘
```

### Caching Pattern — Cache-Aside

```javascript
// Ye pattern yaad rakhna — interviews mein bhi puchha jaata hai!

async function getData(key) {
  // 1. Cache check
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);    // CACHE HIT

  // 2. DB se laao
  const data = await db.find(key);          // CACHE MISS

  // 3. Cache mein store (with TTL)
  await redis.set(key, JSON.stringify(data), { EX: 300 });

  return data;
}
```

### Important Rules

| Rule | Kyu |
|------|-----|
| Hamesha TTL set karo | Purana data serve na ho |
| Update pe cache delete karo | Stale data na dikhao |
| `KEYS *` production mein mat chalao | Server slow ho jaata hai |
| Cache failure pe app crash na ho | Graceful fallback to DB |

> **Tip:** Redis down ho jaaye to app crash nahi honi chahiye — simply database se data serve karo. Cache optional hai, database essential hai!

---

## Revision 3: Docker

### Core Concepts Quick Recap

```
Image     = Blueprint (read-only, shareable)
Container = Running instance (from image)
Dockerfile = Recipe to build image
Hub        = Public image registry (Docker Hub)

Ek image se multiple containers ban sakte hain
Container delete = data bhi delete (unless volume use karo)
```

### Dockerfile Template — Yaad Rakhne Wala

```dockerfile
FROM node:18-alpine        # Base image (lightweight!)
WORKDIR /app               # Working directory
COPY package*.json ./      # Package files pehle (cache layer)
RUN npm install            # Dependencies install
COPY . .                   # Code copy
EXPOSE 3000                # Port document
CMD ["node", "app.js"]     # Start command
```

### Essential Docker Commands

```bash
# Build
docker build -t myapp .

# Run
docker run -d -p 3000:3000 --name myapp myapp-image

# Status
docker ps                  # running containers
docker ps -a               # all containers

# Logs + Debug
docker logs myapp
docker exec -it myapp sh   # container ke andar jaao

# Cleanup
docker stop myapp
docker rm myapp
docker rmi myapp-image
docker system prune        # sab unused clean
```

### Docker Compose Template

```yaml
version: '3.8'
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - MONGO_URI=mongodb://mongo:27017/mydb
      - REDIS_URL=redis://redis:6379
    depends_on: [mongo, redis]
  
  mongo:
    image: mongo:7
    volumes: [mongo-data:/data/db]
  
  redis:
    image: redis:alpine

volumes:
  mongo-data:
```

```bash
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose up -d --build  # Rebuild + Start
docker-compose logs app       # Logs
```

> **Yaad Rakho:** Docker Compose mein service names = hostnames. `mongo` service ko `mongodb://mongo:27017` se access karo. IP address nahi chahiye!

---

## Revision 4: AWS EC2

### EC2 Setup Quick Recap

```
1. AWS Console → EC2 → Launch Instance
2. Ubuntu 22.04 + t2.micro (FREE TIER)
3. Security Group:
   - SSH (22) → My IP only
   - HTTP (80) → Anywhere
   - Custom (3000) → Anywhere
4. Key Pair → Download .pem file
5. Launch!
```

### SSH + Deploy

```bash
# Connect
chmod 400 key.pem
ssh -i "key.pem" ubuntu@PUBLIC_IP

# Install
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Deploy
git clone YOUR_REPO
cd your-app && npm install
pm2 start app.js --name myapp
pm2 startup && pm2 save

# Access
http://PUBLIC_IP:3000
```

---

## Common DevOps Mistakes (AVOID THESE!)

### Mistake 1: Secrets in Code

```javascript
// GALAT! Kabhi mat karo!
const MONGO_URI = "mongodb://admin:password123@server:27017/db";
const JWT_SECRET = "mysupersecretkey";

// SAHI! Environment variables use karo
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
```

> **Warning:** `.env` file kabhi git mein commit mat karo! `.gitignore` mein `.env` hamesha daalo.

### Mistake 2: Running as Root

```bash
# GALAT!
sudo node app.js          # Root user se mat chalao

# SAHI!
pm2 start app.js          # Normal user se chalao
```

### Mistake 3: No Error Handling in Production

```javascript
// GALAT! — App crash hoga unhandled errors pe
// Koi error handling nahi

// SAHI!
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Log karo, alert bhejo, gracefully shutdown
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
```

### Mistake 4: No Monitoring

```bash
# PM2 se logs aur monitoring
pm2 logs                  # Logs dekho
pm2 monit                 # Real-time monitoring

# Health check endpoint banao hamesha
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### Mistake 5: SSH Key Management

```bash
# GALAT!
chmod 777 key.pem         # Sab ke liye accessible — insecure!

# SAHI!
chmod 400 key.pem         # Sirf owner read kar sake

# Key ko kabhi:
# - Email se share mat karo
# - Git mein commit mat karo
# - Public folder mein mat rakho
```

### Mistake 6: Docker Image Size

```dockerfile
# GALAT! — Badi image (800MB+)
FROM node:18              # Full Ubuntu-based image

# SAHI! — Chhoti image (~165MB)
FROM node:18-alpine       # Alpine-based (lightweight)
```

---

## Week 10 Master Revision Table

| Topic | Key Command / Concept | Kab Use Karein |
|-------|----------------------|----------------|
| Monolith | Single codebase + deploy | MVP, small team |
| Modular | Modules with boundaries | Growing app |
| Microservices | Independent services + own DB | Large scale |
| Redis SET/GET | `SET key value EX 300` | Caching data |
| Cache-Aside | Check cache → miss → DB → store | Read-heavy APIs |
| Dockerfile | FROM + COPY + RUN + CMD | App ko containerize karo |
| docker build | `docker build -t name .` | Image banao |
| docker run | `docker run -d -p 3000:3000` | Container chalao |
| docker-compose | `docker-compose up -d` | Multi-container |
| EC2 SSH | `ssh -i key.pem ubuntu@IP` | Server login |
| PM2 | `pm2 start app.js` | Production process manager |

---

## Aaj Kya Seekha?

1. **System Design** mein 3 patterns: Monolith → Modular → Microservices
2. **Redis** 10-100x performance boost deta hai — Cache-Aside pattern yaad rakhna
3. **Docker** app + environment pack karta hai — "works everywhere" guarantee
4. **Docker Compose** multi-container management ko ek file mein simplify karta hai
5. **AWS EC2** pe deploy karna — SSH, Node.js, PM2, public IP
6. **Common mistakes** avoid karo — secrets in code, no monitoring, root user
7. Evening mein **mini project** — sab kuch combine karke Docker + EC2 deploy!
