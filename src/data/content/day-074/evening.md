# Day 74 Evening: Mini Project — Full Deployment Pipeline

> **Aaj ka plan:** Aaj hum ek complete deployment pipeline banayenge — Dockerized app ko GitHub Actions CI/CD se EC2 pe deploy karenge Nginx + PM2 + SSL ke saath. Ye ek real-world production deployment hai!

---

## Project Overview

### Kya Banayenge?

```
Kisan API — Production Deployment Pipeline

Architecture:
┌────────────┐     ┌──────────┐     ┌─────────────────────────┐
│  Developer  │────▶│  GitHub  │────▶│  EC2 (Production)       │
│  git push   │     │  Actions │     │  Nginx → PM2 → Node.js  │
└────────────┘     │  CI/CD   │     │  Docker (optional)       │
                    └──────────┘     └─────────────────────────┘

Pipeline Steps:
1. Developer pushes code to GitHub
2. CI: Lint + Test (automated)
3. CD: SSH to EC2, pull code, restart app
4. Nginx serves via HTTPS
5. PM2 manages Node.js in cluster mode
```

---

## Step 1: Project Structure Banao

```bash
mkdir -p ~/kisan-production && cd ~/kisan-production

# Project structure
mkdir -p src tests config .github/workflows logs
```

```
kisan-production/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── src/
│   ├── app.js
│   ├── server.js
│   └── routes/
│       ├── health.js
│       └── crops.js
├── tests/
│   └── app.test.js
├── config/
│   └── nginx.conf
├── Dockerfile
├── docker-compose.yml
├── ecosystem.config.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Step 2: Application Code

```javascript
// src/app.js
// Main Express application

const express = require('express');
const healthRoutes = require('./routes/health');
const cropRoutes = require('./routes/crops');

const app = express();

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/crops', cropRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route nahi mila', path: req.url });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
});

module.exports = app;
```

```javascript
// src/routes/health.js
// Health check routes

const router = require('express').Router();

router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        pid: process.pid
    });
});

module.exports = router;
```

```javascript
// src/routes/crops.js
// Crop data routes

const router = require('express').Router();

// Sample database (production mein RDS se aayega)
const crops = [
    { id: 1, name: 'Gehu (Wheat)', season: 'Rabi', price: 2275, unit: 'per quintal' },
    { id: 2, name: 'Dhan (Rice)', season: 'Kharif', price: 2183, unit: 'per quintal' },
    { id: 3, name: 'Makka (Corn)', season: 'Kharif', price: 1962, unit: 'per quintal' },
    { id: 4, name: 'Sarson (Mustard)', season: 'Rabi', price: 5650, unit: 'per quintal' },
    { id: 5, name: 'Chana (Gram)', season: 'Rabi', price: 5440, unit: 'per quintal' }
];

// GET /api/crops — saari crops
router.get('/', (req, res) => {
    const { season } = req.query;
    let result = crops;

    // Season filter
    if (season) {
        result = crops.filter(c => c.season.toLowerCase() === season.toLowerCase());
    }

    res.json({ success: true, count: result.length, data: result });
});

// GET /api/crops/:id — specific crop
router.get('/:id', (req, res) => {
    const crop = crops.find(c => c.id === parseInt(req.params.id));
    if (!crop) {
        return res.status(404).json({ error: 'Crop nahi mili' });
    }
    res.json({ success: true, data: crop });
});

module.exports = router;
```

```javascript
// src/server.js
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Kisan API running | Port: ${PORT} | ENV: ${process.env.NODE_ENV || 'development'} | PID: ${process.pid}`);
});
```

---

## Step 3: Tests Likho

```javascript
// tests/app.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Health Check', () => {
    test('GET /health — returns healthy status', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('healthy');
        expect(res.body.uptime).toBeDefined();
    });
});

describe('Crops API', () => {
    test('GET /api/crops — returns all crops', async () => {
        const res = await request(app).get('/api/crops');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/crops?season=Rabi — filters by season', async () => {
        const res = await request(app).get('/api/crops?season=Rabi');
        expect(res.statusCode).toBe(200);
        res.body.data.forEach(crop => {
            expect(crop.season).toBe('Rabi');
        });
    });

    test('GET /api/crops/1 — returns specific crop', async () => {
        const res = await request(app).get('/api/crops/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toContain('Gehu');
    });

    test('GET /api/crops/999 — returns 404', async () => {
        const res = await request(app).get('/api/crops/999');
        expect(res.statusCode).toBe(404);
    });
});

describe('404 Handler', () => {
    test('GET /random — returns 404', async () => {
        const res = await request(app).get('/random-route');
        expect(res.statusCode).toBe(404);
    });
});
```

---

## Step 4: Docker Setup

```dockerfile
# Dockerfile
# Production-ready Node.js Docker image

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Non-root user banao (security ke liye)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Dependencies copy karo
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Logs folder banao
RUN mkdir -p logs && chown -R appuser:appgroup /app

# Non-root user switch
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

EXPOSE 3000

CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
# Development + Production compose

version: '3.8'

services:
  kisan-api:
    build: .
    container_name: kisan-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - APP_VERSION=1.0.0
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Step 5: PM2 Ecosystem Config

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'kisan-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      APP_VERSION: '1.0.0'
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};
```

---

## Step 6: Nginx Config

```nginx
# config/nginx.conf
# Production Nginx config — EC2 pe /etc/nginx/sites-available/ mein copy karo

upstream kisan_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name kisanapp.com www.kisanapp.com api.kisanapp.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.kisanapp.com;

    # SSL (Certbot ye paths set karega)
    ssl_certificate /etc/letsencrypt/live/api.kisanapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kisanapp.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;

    # Logs
    access_log /var/log/nginx/kisan-api-access.log;
    error_log /var/log/nginx/kisan-api-error.log;

    # Max body size
    client_max_body_size 10M;

    # API proxy
    location / {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://kisan_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Nginx health
    location /nginx-health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

---

## Step 7: CI/CD Workflows

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

```yaml
# .github/workflows/cd.yml
name: CD — Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm test

  deploy:
    name: Deploy to EC2
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: SSH Setup
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy
        env:
          HOST: ${{ secrets.EC2_HOST }}
          USER: ${{ secrets.EC2_USER }}
        run: |
          ssh -i ~/.ssh/deploy_key $USER@$HOST << 'DEPLOY'
            set -e

            echo "=== Deployment Start ==="
            cd /home/ubuntu/kisan-api

            # Latest code pull
            git pull origin main

            # Dependencies install
            npm ci --production

            # PM2 reload (zero downtime)
            pm2 reload ecosystem.config.js --env production

            # Health check (3 attempts)
            for i in 1 2 3; do
              sleep 2
              if curl -sf http://localhost:3000/health > /dev/null; then
                echo "Health check passed! (attempt $i)"
                break
              fi
              if [ $i -eq 3 ]; then
                echo "Health check FAILED after 3 attempts!"
                exit 1
              fi
            done

            echo "=== Deployment Complete ==="
          DEPLOY
```

---

## Step 8: Support Files

```bash
# .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
logs/
coverage/
*.pem
EOF
```

```bash
# .env.example
cat > .env.example << 'EOF'
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0
EOF
```

```json
// package.json scripts
{
    "scripts": {
        "start": "node src/server.js",
        "dev": "nodemon src/server.js",
        "test": "jest --verbose --forceExit",
        "lint": "eslint src/ tests/"
    }
}
```

---

## Step 9: EC2 Server Setup (One-Time)

```bash
# EC2 pe SSH karo
ssh -i my-key.pem ubuntu@ec2-ip

# System update
sudo apt update && sudo apt upgrade -y

# Node.js 20 install
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# PM2 install
sudo npm install pm2 -g

# Nginx install
sudo apt install nginx -y

# Git clone karo
cd /home/ubuntu
git clone https://github.com/USERNAME/kisan-production.git kisan-api
cd kisan-api
npm ci --production

# PM2 se start + startup
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save

# Nginx config copy
sudo cp config/nginx.conf /etc/nginx/sites-available/kisan-api
sudo ln -s /etc/nginx/sites-available/kisan-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# SSL setup
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.kisanapp.com
```

---

## Step 10: Test Full Pipeline

```bash
# Local mein code change karo aur push karo
echo "// Updated" >> src/app.js
git add .
git commit -m "feat: test deployment pipeline"
git push origin main

# GitHub Actions tab mein dekho:
# 1. CI job chalega (lint + test)
# 2. Test pass hone pe CD job chalega
# 3. EC2 pe code update hoga
# 4. PM2 reload karega
# 5. Health check pass hoga

# Verify karo
curl https://api.kisanapp.com/health
```

> **Expected Output:**
```json
{
    "status": "healthy",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 15,
    "timestamp": "2026-04-04T18:00:00.000Z"
}
```

> **Practice Time!** Ye poora pipeline setup karo. Intentionally ek test fail karke dekho — CI red hona chahiye aur deploy NAHI hona chahiye. Phir fix karo aur green hone do!

---

## Quick Revision Table

| Component | Role | Config Location |
|-----------|------|-----------------|
| Express App | API server | `src/app.js` |
| Jest Tests | Automated testing | `tests/app.test.js` |
| Dockerfile | Container build | `./Dockerfile` |
| PM2 | Process management | `ecosystem.config.js` |
| Nginx | Reverse proxy + SSL | `/etc/nginx/sites-available/` |
| CI Workflow | Lint + Test on push | `.github/workflows/ci.yml` |
| CD Workflow | Deploy on merge | `.github/workflows/cd.yml` |
| Certbot | SSL certificate | Auto-configured |
| CloudWatch | Monitoring | AWS Console |

---

## Aaj Kya Seekha?

1. **Full deployment pipeline** banaya — code push se production deploy tak sab automated
2. **Docker** se app containerize kiya — consistent environment everywhere
3. **CI workflow** lint + test karta hai har push pe — broken code production mein nahi jayega
4. **CD workflow** test pass hone pe EC2 pe deploy karta hai — zero manual intervention
5. **PM2 cluster mode** se saare CPU cores use hote hain — `pm2 reload` zero downtime deta hai
6. **Nginx** reverse proxy + SSL + security headers + rate limiting — production-grade
7. **Health check** deploy ke baad verify karta hai ki app sahi chal rahi hai
8. Ye COMPLETE production setup hai — professional projects mein exactly yahi hota hai!
