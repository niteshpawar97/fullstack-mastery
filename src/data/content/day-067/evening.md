# Day 67 Evening: Mini Project — Dockerize Phase 2 App + Deploy to EC2

> **Aaj ka plan:** Aaj sab kuch combine karenge! Phase 2 ka project (Express + MongoDB) ko Docker mein package karenge, Redis caching add karenge, Docker Compose se manage karenge, aur EC2 pe deploy karenge. Ye hai real-world DevOps workflow!

---

## Project Goal

```
Phase 2 project (Express API + MongoDB) ko:
1. Dockerize karo (Dockerfile likho)
2. Redis caching add karo
3. Docker Compose se sab manage karo (app + MongoDB + Redis)
4. EC2 pe deploy karo
5. Internet se access karo — live production!

Final Architecture:
┌─────────────────────────────────────────┐
│              AWS EC2                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         DOCKER COMPOSE          │   │
│  │                                  │   │
│  │  ┌────────┐ ┌──────�� ┌──────┐ │   │
│  │  │Express │ │Mongo │ │Redis │ │   │
│  │  │  :3000 │ │:27017│ │:6379 │ ��   │
│  │  └────────┘ └──────┘ └──────┘ │   │
│  └─────────────────────────────────┘   │
│                                         │
└───────────────┬─────────────────────────┘
                │
         Public IP:3000
         (Internet Access)
```

---

## Step 1: Project Structure Finalize Karo

```
kisanbazaar-production/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── redis.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── controllers/
│   │   ├── authController.js
��   │   ├── productController.js
│   │   └── orderController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├─�� productRoutes.js
│   │   └��─ orderRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ���── cache.js          # NEW — Redis cache middleware
│   └── app.js
├── Dockerfile
├���─ docker-compose.yml
├── docker-compose.dev.yml
├── .dockerignore
├── .env.example
├── seed.js
└── package.json
```

---

## Step 2: Cache Middleware Banao

```javascript
// src/middleware/cache.js
// Reusable cache middleware — kisi bhi route pe lagao!

const { redisClient } = require('../config/redis');

function cacheMiddleware(keyPrefix, ttlSeconds = 300) {
  return async (req, res, next) => {
    // Cache key banao — route + query params se
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        console.log(`CACHE HIT: ${cacheKey}`);
        return res.json({
          source: 'cache',
          ...JSON.parse(cached)
        });
      }
      
      // Cache miss — original response ko intercept karo
      console.log(`CACHE MISS: ${cacheKey}`);
      
      // res.json ko override karo taaki response cache ho sake
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        // Cache mein store karo
        await redisClient.set(cacheKey, JSON.stringify(data), {
          EX: ttlSeconds
        });
        // Original response bhejo
        return originalJson({ source: 'database', ...data });
      };
      
      next();
      
    } catch (error) {
      // Redis down hai to bina cache ke continue karo
      console.error('Cache error (continuing without cache):', error.message);
      next();
    }
  };
}

// Cache invalidate helper
async function invalidateCache(pattern) {
  try {
    // Pattern matching keys delete karo
    const keys = await redisClient.keys(`${pattern}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cache invalidated: ${keys.length} keys deleted for ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error.message);
  }
}

module.exports = { cacheMiddleware, invalidateCache };
```

> **Tip:** Cache middleware reusable hai — kisi bhi GET route pe `cacheMiddleware('products', 300)` lagao aur caching auto ho jaayegi!

---

## Step 3: Dockerfile (Production Ready)

```dockerfile
# Dockerfile — Production ready

# Stage 1: Dependencies install
FROM node:18-alpine AS builder

WORKDIR /app

# Package files copy karo
COPY package*.json ./

# Production dependencies only
RUN npm ci --only=production

# Stage 2: Final image (clean)
FROM node:18-alpine

# Security: non-root user banao
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Dependencies copy karo builder stage se
COPY --from=builder /app/node_modules ./node_modules

# App code copy karo
COPY . .

# Non-root user switch karo
USER appuser

# Port expose
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start
CMD ["node", "src/app.js"]
```

> **Yaad Rakho:** Multi-stage build use kiya hai — pehle stage mein dependencies install hoti hain, doosre stage mein sirf production code jaata hai. Image size chhoti rehti hai!

```
# .dockerignore
node_modules
npm-debug.log*
.env
.git
.gitignore
*.md
docker-compose*.yml
.DS_Store
tests/
coverage/
.nyc_output/
```

---

## Step 4: Docker Compose Files

```yaml
# docker-compose.yml — Production
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: kb-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URI=mongodb://mongo:27017/kisanbazaar
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET:-defaultsecretchangeme}
    depends_on:
      mongo:
        condition: service_started
      redis:
        condition: service_started
    restart: unless-stopped
    networks:
      - app-network

  mongo:
    image: mongo:7
    container_name: kb-mongo
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped
    networks:
      - app-network
    # Production mein port expose mat karo (security)
    # ports:
    #   - "27017:27017"

  redis:
    image: redis:alpine
    container_name: kb-redis
    command: redis-server --maxmemory 100mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - app-network

volumes:
  mongo-data:
    driver: local
  redis-data:
    driver: local

networks:
  app-network:
    driver: bridge
```

> **Warning:** Production mein MongoDB ka port bahar expose MAT karo! Sirf app container access kare MongoDB ko internal network se. Security ke liye ye bahut important hai!

```yaml
# docker-compose.dev.yml — Development
version: '3.8'

services:
  app:
    build: .
    container_name: kb-app-dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - MONGO_URI=mongodb://mongo:27017/kisanbazaar-dev
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret-key
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json
    command: npx nodemon src/app.js
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    container_name: kb-mongo-dev
    ports:
      - "27017:27017"
    volumes:
      - mongo-dev-data:/data/db

  redis:
    image: redis:alpine
    container_name: kb-redis-dev
    ports:
      - "6379:6379"

volumes:
  mongo-dev-data:
```

---

## Step 5: Local Test Karo

```bash
# Development mein test karo pehle
docker-compose -f docker-compose.dev.yml up -d --build

# Status check
docker-compose -f docker-compose.dev.yml ps

# Logs check — sab connected?
docker-compose -f docker-compose.dev.yml logs app

# Test endpoints
curl http://localhost:3000/
curl http://localhost:3000/api/health
curl http://localhost:3000/api/products

# Seed data (agar seed.js hai)
docker-compose -f docker-compose.dev.yml exec app node seed.js

# Sab sahi chal raha hai? Production build test karo
docker-compose -f docker-compose.dev.yml down
docker-compose up -d --build
curl http://localhost:3000/api/health
```

> **Expected Output:**
> ```json
> {
>   "status": "OK",
>   "database": "connected",
>   "cache": "connected",
>   "uptime": "15 seconds"
> }
> ```

---

## Step 6: EC2 Pe Deploy Karo

### EC2 Pe Docker Install Karo

```bash
# SSH into EC2
ssh -i "kisanbazaar-key.pem" ubuntu@YOUR_EC2_IP

# Docker install karo
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Docker Compose install karo
sudo apt install -y docker-compose-plugin

# User ko docker group mein add karo (sudo ke bina docker chale)
sudo usermod -aG docker $USER

# Logout karke dobaara login karo (group apply ho)
exit
ssh -i "kisanbazaar-key.pem" ubuntu@YOUR_EC2_IP

# Verify
docker --version
docker compose version
```

### Code EC2 Pe Laao

```bash
# Option 1: Git clone
cd ~
git clone https://github.com/yourusername/kisanbazaar-production.git
cd kisanbazaar-production

# Option 2: SCP se files copy
# Apne laptop se (EC2 ke andar nahi):
scp -i "kisanbazaar-key.pem" -r ./kisanbazaar-production ubuntu@YOUR_EC2_IP:~/
```

### Docker Compose Se Deploy

```bash
# EC2 pe:
cd ~/kisanbazaar-production

# .env file banao (secrets ke liye)
cat > .env << 'EOF'
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
EOF

# Production build + start
docker compose up -d --build

# Status check
docker compose ps

# Logs check
docker compose logs -f app
```

> **Terminal Command:**
> ```
> docker compose up -d --build
> ```

> **Expected Output:**
> ```
> [+] Running 3/3
>  ✔ Container kb-redis  Started
>  ✔ Container kb-mongo  Started
>  ✔ Container kb-app    Started
> ```

---

## Step 7: Internet Se Test Karo!

```bash
# Apne laptop ke browser mein:
http://YOUR_EC2_IP:3000

# API test karo
curl http://YOUR_EC2_IP:3000/api/health
# { "status": "OK", "database": "connected", "cache": "connected" }

# Products add karo
curl -X POST http://YOUR_EC2_IP:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Organic Wheat","price":2500,"farmer":"Ramesh"}'

# Products fetch — pehli baar database se, doosri baar cache se
curl http://YOUR_EC2_IP:3000/api/products
# { "source": "database", ... }

curl http://YOUR_EC2_IP:3000/api/products
# { "source": "cache", ... }    ← Redis working!
```

> **Practice Time!** Ye checklist complete karo:
> - [ ] Docker Compose locally kaam kar raha hai
> - [ ] EC2 pe Docker install hai
> - [ ] Code EC2 pe hai (git clone ya scp)
> - [ ] `docker compose up -d` successful
> - [ ] Browser se PUBLIC_IP:3000 access ho raha hai
> - [ ] Products CRUD kaam kar raha hai
> - [ ] Redis caching kaam kar rahi hai (source: cache dikhna chahiye)
> - [ ] Health check endpoint sab services "connected" dikha raha hai

---

## Useful EC2 + Docker Commands

```bash
# Logs monitor karo
docker compose logs -f

# App restart karo (code update ke baad)
git pull origin main
docker compose up -d --build

# Disk space check
df -h
docker system df        # Docker ka space usage

# Cleanup unused Docker data
docker system prune -f

# MongoDB backup lelo
docker compose exec mongo mongodump --out /data/backup
```

---

## Quick Revision Table

| Step | Kya Kiya |
|------|----------|
| Cache Middleware | Reusable Redis cache middleware banaya |
| Dockerfile | Multi-stage, non-root user, health check |
| docker-compose.yml | Production — app + mongo + redis, no exposed DB ports |
| docker-compose.dev.yml | Development — hot reload, exposed ports |
| Local Test | Dev compose se sab test kiya |
| EC2 Docker Install | Docker + Docker Compose EC2 pe install kiya |
| Deploy | `docker compose up -d --build` — sab live! |
| Test | Public IP se API access + Redis caching verify |

---

## Aaj Kya Seekha?

1. **Phase 2 project ko Dockerize** kiya — Dockerfile + docker-compose
2. **Redis cache middleware** banaya — reusable, kisi bhi route pe lagao
3. **Multi-stage Docker build** se image size optimize ki
4. **Production** mein DB ports expose nahi karte — security!
5. **EC2 pe Docker install** karke `docker compose` se deploy kiya
6. Ek command (`docker compose up -d`) se **poora stack live** ho gaya
7. Is week mein developer se **DevOps-ready developer** ban gaye!

> **Socho Aise:** Ab tum sirf code nahi likhte — tum apna code package karte ho (Docker), cloud pe deploy karte ho (EC2), caching lagate ho (Redis), aur production-ready app banate ho. Ye skills har company chahti hai!
