# Day 64 Evening: Practice — Dockerize a Node.js Express App

> **Aaj ka plan:** Ab haath gande karenge! Ek Express app ko Docker mein package karenge — Dockerfile likhenge, image build karenge, container run karenge, aur browser se test karenge.

---

## Project Setup

### Step 1: Express App Banao

```bash
# Naya folder banao
mkdir docker-express-demo && cd docker-express-demo

# npm init karo
npm init -y

# Dependencies install karo
npm install express mongoose dotenv
```

> **Terminal Command:**
> ```
> mkdir docker-express-demo && cd docker-express-demo && npm init -y
> ```

### Step 2: Express App Code

```javascript
// src/app.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Namaste! Docker Express App chal raha hai!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Products route (simple)
app.get('/api/products', (req, res) => {
  // Demo data — real app mein DB se aayega
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Organic Wheat', price: 2500, farmer: 'Ramesh' },
      { id: 2, name: 'Basmati Rice', price: 3500, farmer: 'Suresh' },
      { id: 3, name: 'Fresh Tomato', price: 800, farmer: 'Mahesh' }
    ]
  });
});

// POST route — test karne ke liye
app.post('/api/products', (req, res) => {
  const { name, price, farmer } = req.body;
  res.status(201).json({
    success: true,
    message: `${name} product add ho gaya!`,
    data: { name, price, farmer }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Server mein kuch gadbad hai!' });
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server chal raha hai port ${PORT} pe!`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

> **Yaad Rakho:** `app.listen(PORT, '0.0.0.0')` mein `0.0.0.0` zaroori hai Docker ke liye! Agar sirf `localhost` use karoge to container ke bahar se access nahi hoga.

---

## Step 3: Dockerfile Likho

```dockerfile
# Dockerfile
# Node.js Express App ka Docker Image

# Step 1: Base image — Node 18 Alpine (chhoti size, ~175MB)
FROM node:18-alpine

# Step 2: App ke liye working directory banao
WORKDIR /app

# Step 3: Package files pehle copy karo (layer caching ke liye)
COPY package*.json ./

# Step 4: Dependencies install karo (production only)
RUN npm install --production
# --production se devDependencies install nahi hongi (size kam)

# Step 5: Baaki sab code copy karo
COPY . .

# Step 6: Environment variable set karo
ENV NODE_ENV=production
ENV PORT=3000

# Step 7: Port expose karo (documentation ke liye)
EXPOSE 3000

# Step 8: Container start hone pe ye command chale
CMD ["node", "src/app.js"]
```

### .dockerignore File Banao

```
# .dockerignore
node_modules
npm-debug.log*
.env
.git
.gitignore
README.md
docker-compose.yml
.DS_Store
*.md
```

> **Tip:** `.dockerignore` mein `node_modules` daalna bahut important hai — iske bina host ka `node_modules` container mein copy ho jaayega, jo galat OS ke liye ho sakta hai!

---

## Step 4: Image Build Karo

```bash
# Image build karo
docker build -t kisanbazaar-api .
```

> **Terminal Command:**
> ```
> docker build -t kisanbazaar-api .
> ```

> **Expected Output:**
> ```
> [+] Building 25.3s (10/10) FINISHED
>  => [1/5] FROM node:18-alpine
>  => [2/5] WORKDIR /app
>  => [3/5] COPY package*.json ./
>  => [4/5] RUN npm install --production
>  => [5/5] COPY . .
>  => exporting to image
>  => => naming to docker.io/library/kisanbazaar-api
> ```

```bash
# Image ban gayi? Check karo
docker images
# Output:
# REPOSITORY        TAG       SIZE
# kisanbazaar-api   latest    ~165MB
# node              18-alpine ~175MB
```

> **Socho Aise:** Dhyan do — image size sirf ~165MB hai. Agar Ubuntu base use karte to 800MB+ hoti! Alpine base use karna best practice hai.

---

## Step 5: Container Run Karo

```bash
# Container start karo
docker run -d -p 3000:3000 --name kb-api kisanbazaar-api
#          -d    = background mein chale
#          -p    = port mapping (host 3000 → container 3000)
#          --name = container ka naam

# Check karo — chal raha hai?
docker ps
# CONTAINER ID   IMAGE            STATUS       PORTS
# a1b2c3d4e5     kisanbazaar-api  Up 3 sec     0.0.0.0:3000->3000/tcp
```

> **Terminal Command:**
> ```
> docker run -d -p 3000:3000 --name kb-api kisanbazaar-api
> ```

### Container Logs Dekho

```bash
# Logs check karo
docker logs kb-api
# Output:
# Server chal raha hai port 3000 pe!
# Environment: production

# Real-time logs follow karo
docker logs -f kb-api
# Ctrl+C se exit karo
```

---

## Step 6: Test Karo!

### Browser Se Test

```bash
# Browser mein jaao: http://localhost:3000

# Ya curl use karo:

# Health check
curl http://localhost:3000/
# Output: { "message": "Namaste! Docker Express App chal raha hai!", ... }

# Products list
curl http://localhost:3000/api/products
# Output: { "success": true, "data": [...] }

# Product add karo
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Organic Cotton", "price": 5000, "farmer": "Dinesh"}'
# Output: { "success": true, "message": "Organic Cotton product add ho gaya!" }
```

> **Expected Output:**
> ```json
> {
>   "message": "Namaste! Docker Express App chal raha hai!",
>   "environment": "production",
>   "timestamp": "2026-04-04T10:30:00.000Z"
> }
> ```

---

## Step 7: Container Ke Andar Jaao

```bash
# Container ke andar shell open karo
docker exec -it kb-api sh

# Ab tum container ke andar ho! Dekho kya hai:
/app $ ls
# node_modules  package-lock.json  package.json  src

/app $ cat package.json
# Package.json dikhega

/app $ node -v
# v18.x.x

/app $ exit
# Container se bahar aa gaye
```

> **Practice Time!** Container ke andar jaao aur ye check karo:
> 1. `pwd` — working directory kya hai?
> 2. `ls node_modules` — kaunsi dependencies installed hain?
> 3. `env` — environment variables dekho

---

## Step 8: Environment Variables Ke Saath Run Karo

```bash
# Pehle purana container stop aur delete karo
docker stop kb-api && docker rm kb-api

# Naye environment variables ke saath run karo
docker run -d \
  -p 4000:3000 \
  -e NODE_ENV=staging \
  -e PORT=3000 \
  -e APP_NAME=KisanBazaar \
  --name kb-api-staging \
  kisanbazaar-api

# Test karo — ab port 4000 pe access hoga
curl http://localhost:4000/
# Output: { "environment": "staging", ... }
```

> **Yaad Rakho:** `-p 4000:3000` matlab host ka port 4000 → container ke port 3000. Browser mein `localhost:4000` use karna hoga. Same image se multiple containers alag ports pe chala sakte ho!

---

## Step 9: Multiple Containers Ek Image Se

```bash
# Production container — port 3000
docker run -d -p 3000:3000 -e NODE_ENV=production --name kb-prod kisanbazaar-api

# Staging container — port 4000  
docker run -d -p 4000:3000 -e NODE_ENV=staging --name kb-staging kisanbazaar-api

# Development container — port 5000
docker run -d -p 5000:3000 -e NODE_ENV=development --name kb-dev kisanbazaar-api

# Teeno containers chal rahe hain!
docker ps
# 3 containers dikhenge alag-alag ports pe
```

> **Socho Aise:** Ek hi image se teen environments chal rahe hain — production, staging, development. Ye Docker ka power hai! Ek recipe se teen dishes ban gayi.

---

## Cleanup

```bash
# Sab containers stop karo
docker stop kb-prod kb-staging kb-dev

# Sab containers delete karo
docker rm kb-prod kb-staging kb-dev

# Image delete karo (optional)
docker rmi kisanbazaar-api

# Sab saaf karo (unused sab delete)
docker system prune -f
```

---

## Quick Revision Table

| Step | Command | Kya Kiya |
|------|---------|----------|
| Build | `docker build -t name .` | Dockerfile se image banaya |
| Run | `docker run -d -p 3000:3000 name` | Container start kiya |
| Logs | `docker logs container-name` | Container ke logs dekhe |
| Shell | `docker exec -it name sh` | Container ke andar gaye |
| Stop | `docker stop name` | Container roka |
| Remove | `docker rm name` | Container delete kiya |
| List | `docker ps` | Running containers dekhe |
| Env | `-e KEY=value` | Environment variable pass kiya |

---

## Aaj Kya Seekha?

1. **Dockerfile** likhna seekh gaye — FROM, WORKDIR, COPY, RUN, CMD
2. **Image build** karna aur **container run** karna aa gaya
3. **Port mapping** (-p host:container) se bahar se access hota hai
4. Container ke andar **shell** se debug kar sakte hain (`docker exec -it`)
5. **Environment variables** se same image different configurations mein chala sakte hain
6. Ek image se **multiple containers** alag ports pe chal sakte hain
7. Kal **Docker Compose** seekhenge — multiple containers ek saath manage karna!
