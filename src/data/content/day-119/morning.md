# Day 119 Morning: Dockerize All Microservices + Docker Compose

> **Aaj ka plan:** PROJECT DAY Part 2! Aaj hum sab microservices ko Dockerize karenge, docker-compose se local environment chalayenge, aur Kubernetes manifests likhenge. Real DevOps workflow seekhenge!

---

## Why Docker for Microservices?

```
WITHOUT Docker:
  Developer A: "Mere machine pe chal raha hai!" 
  Developer B: "Meri pe nahi chal raha! Node version alag hai."
  Ops Team:    "Production pe kuch aur hi error aa raha hai..."
  
WITH Docker:
  Sab jagah SAME container chalta hai — laptop, staging, production.
  "It works on my machine" problem SOLVED forever!
```

> **Socho Aise:** Docker container aise hai jaise dabba band lunch box. Andar sab kuch hai — khana (code), bartan (dependencies), masala (config). Chahe ghar le jao ya office — lunch same taste ka hoga!

---

## Step 1: Dockerfile for Each Service

```dockerfile
# user-service/Dockerfile — Ek service ka Dockerfile
# Multi-stage build — production image chhoti hogi

# ===== STAGE 1: BUILD =====
FROM node:20-alpine AS builder
# Alpine image use karo — size kam (50MB vs 900MB)

WORKDIR /app

# Pehle package files copy karo — caching ke liye
COPY package*.json ./
RUN npm ci
# npm ci = clean install — lockfile se exact versions install karo

# Shared types bhi copy karo
COPY ../shared /shared

# Source code copy karo
COPY . .

# TypeScript compile karo
RUN npm run build

# ===== STAGE 2: PRODUCTION =====
FROM node:20-alpine AS production

WORKDIR /app

# Sirf production dependencies install karo
COPY package*.json ./
RUN npm ci --only=production

# Build output copy karo — source code nahi chahiye production mein
COPY --from=builder /app/dist ./dist

# Non-root user banao — security ke liye
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Health check define karo — Docker ko pata chale service healthy hai
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

> **Yaad Rakho:** Multi-stage build se final image mein sirf compiled JS aur production dependencies hain. TypeScript compiler, devDependencies, source code — sab stage 1 mein reh jaata hai. Image size 80% kam hoti hai!

---

## Step 2: .dockerignore — Kya Copy Na Karo

```
# .dockerignore — har service folder mein rakhna
node_modules
dist
.env
.git
*.md
*.test.ts
coverage
.nyc_output
```

> **Tip:** `.dockerignore` file se build context chhota hota hai aur build fast hota hai. `node_modules` toh bilkul copy mat karo — container ke andar fresh install hoga!

---

## Step 3: Docker Compose — Sab Ek Command Se

```yaml
# docker-compose.yml — Root folder mein rakhna
version: '3.8'

services:
  # ===== INFRASTRUCTURE =====
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"     # AMQP protocol
      - "15672:15672"   # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: secret123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq    # Data persist karo
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===== SERVICES =====
  gateway:
    build: ./gateway
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=super-secret-key-change-in-production
      - USER_SERVICE_URL=http://user-service:3001
      - PRODUCT_SERVICE_URL=http://product-service:3002
      - ORDER_SERVICE_URL=http://order-service:3003
    depends_on:
      user-service:
        condition: service_healthy
      product-service:
        condition: service_healthy
      order-service:
        condition: service_healthy
    restart: unless-stopped

  user-service:
    build: ./user-service
    ports:
      - "3001:3001"
    environment:
      - RABBITMQ_URL=amqp://admin:secret123@rabbitmq:5672
      - JWT_SECRET=super-secret-key-change-in-production
      - REDIS_URL=redis://redis:6379
    depends_on:
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    # Docker Compose mein service name hi hostname hai
    # "rabbitmq" likhoge toh rabbitmq container ka IP resolve hoga

  product-service:
    build: ./product-service
    ports:
      - "3002:3002"
    environment:
      - RABBITMQ_URL=amqp://admin:secret123@rabbitmq:5672
      - REDIS_URL=redis://redis:6379
    depends_on:
      rabbitmq:
        condition: service_healthy
    restart: unless-stopped

  order-service:
    build: ./order-service
    ports:
      - "3003:3003"
    environment:
      - RABBITMQ_URL=amqp://admin:secret123@rabbitmq:5672
      - PRODUCT_SERVICE_URL=http://product-service:3002
      - REDIS_URL=redis://redis:6379
    depends_on:
      rabbitmq:
        condition: service_healthy
      product-service:
        condition: service_healthy
    restart: unless-stopped

  notification-service:
    build: ./notification-service
    ports:
      - "3004:3004"
    environment:
      - RABBITMQ_URL=amqp://admin:secret123@rabbitmq:5672
    depends_on:
      rabbitmq:
        condition: service_healthy
    restart: unless-stopped

# Named volumes — data persist hota hai container restart pe
volumes:
  rabbitmq_data:
  redis_data:
```

> **Warning:** `depends_on` sirf container start order control karta hai, service ready hone ki guarantee nahi deta. Isliye `condition: service_healthy` use karo — healthcheck pass hone ke BAAD hi dependent service start hoga!

---

## Step 4: Docker Commands — Daily Use

```bash
> **Terminal Command:**
# Sab services build aur start karo (detached mode)
docker compose up -d --build

# Logs dekho — sab services ke
docker compose logs -f

# Sirf ek service ke logs
docker compose logs -f order-service

# Service restart karo (code change ke baad)
docker compose restart user-service

# Ek service rebuild karo
docker compose up -d --build user-service

# Sab band karo
docker compose down

# Sab band karo + volumes delete karo (fresh start)
docker compose down -v

# Running containers dekho
docker compose ps

# Kisi container ke andar jaao (debugging ke liye)
docker compose exec user-service sh
```

---

## Step 5: Environment-Specific Compose Files

```yaml
# docker-compose.dev.yml — Development overrides
version: '3.8'

services:
  user-service:
    build:
      context: ./user-service
      target: builder     # Dev mein builder stage use karo (source maps)
    volumes:
      - ./user-service/src:/app/src  # Hot reload — code change karo, auto restart
    command: npx ts-node-dev --respawn src/index.ts
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug

  product-service:
    volumes:
      - ./product-service/src:/app/src
    command: npx ts-node-dev --respawn src/index.ts
    environment:
      - NODE_ENV=development

  order-service:
    volumes:
      - ./order-service/src:/app/src
    command: npx ts-node-dev --respawn src/index.ts
    environment:
      - NODE_ENV=development

  notification-service:
    volumes:
      - ./notification-service/src:/app/src
    command: npx ts-node-dev --respawn src/index.ts
    environment:
      - NODE_ENV=development
```

```bash
> **Terminal Command:**
# Development mein dono files merge karke chalao
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Code save karo → Auto restart hoga → No rebuild needed!
```

> **Tip:** Development mein volume mount karo — code change pe container restart nahi karna padta. `ts-node-dev` file watch karta hai aur auto restart karta hai. Fast development loop!

---

## Docker Networking Explained

```
┌──────── Docker Network: microservices-project_default ────────┐
│                                                                │
│  gateway (3000) ──→ user-service (3001)                       │
│                 ──→ product-service (3002)                     │
│                 ──→ order-service (3003)                       │
│                                                                │
│  Services ek dusre ko service name se call karte hain:        │
│  http://user-service:3001  (NOT localhost!)                    │
│  http://product-service:3002                                   │
│                                                                │
│  RabbitMQ: amqp://rabbitmq:5672                               │
│  Redis: redis://redis:6379                                     │
│                                                                │
│  Host machine se access: localhost:3000 (gateway)             │
└────────────────────────────────────────────────────────────────┘
```

> **Yaad Rakho:** Docker Compose mein services ek dusre ko **service name** se call karte hain — `localhost` nahi! Container ke andar `localhost` matlab us container ka apna IP hai, doosra container nahi!

---

## Quick Revision Table

| Concept | Kya Hai | Why Important |
|---------|---------|--------------|
| Multi-stage build | Build + Production stage | Image size 80% kam |
| .dockerignore | Files exclude from build | Faster build, smaller context |
| docker-compose | Multi-container orchestration | Ek command se sab start |
| depends_on + healthy | Service start order | Dependencies ready hone pe start |
| Volume mounts | Host → Container file sync | Hot reload development mein |
| Named volumes | Persistent data storage | DB data container restart pe safe |
| Service networking | DNS by service name | Container-to-container communication |
| HEALTHCHECK | Container health monitoring | Auto-restart unhealthy containers |

---

## Aaj Kya Seekha?

1. **Multi-stage Dockerfile** se production image chhoti aur secure hoti hai
2. **Docker Compose** se 5 services + RabbitMQ + Redis ek command se start hote hain
3. **Service names** Docker network mein DNS resolve hote hain — `localhost` nahi use karna
4. **Health checks** se dependent services ready hone pe hi start hote hain
5. **Volume mounts** development mein code change pe auto-reload dete hain

> **Practice Time!** Sab services ke Dockerfiles banao aur docker-compose.yml likho. `docker compose up -d --build` run karo. `docker compose ps` se verify karo sab healthy hain. Phir Postman se Gateway (localhost:3000) pe test karo — user register, product create, order place!
