# Day 89 Evening: Dockerize, CI/CD & Deploy to AWS

> **Aaj ka plan:** Aaj hum KisanMart project ko production-ready banayenge! Docker se containerize karenge, GitHub Actions se CI/CD pipeline banayenge, AWS EC2 pe deploy karenge, aur Nginx + SSL configure karenge. Real world deployment!

---

## Task 1: Dockerize the Application

### `backend/Dockerfile`

```dockerfile
# Node.js base image
FROM node:20-alpine

# Working directory set karo
WORKDIR /app

# Package files pehle copy karo (caching ke liye)
COPY package*.json ./

# Dependencies install karo (production only)
RUN npm ci --only=production

# Baaki code copy karo
COPY . .

# Port expose karo
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Server start karo
CMD ["node", "server.js"]
```

### `frontend/Dockerfile`

```dockerfile
# Stage 1: Build karo
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx se serve karo
FROM nginx:alpine

# Nginx config copy karo
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build output copy karo
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### `frontend/nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing — sab requests index.html pe bhejo
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API requests backend pe proxy karo
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### `docker-compose.yml` (Root folder mein)

```yaml
version: '3.8'

services:
  # MongoDB database
  mongodb:
    image: mongo:7
    container_name: kisanmart-db
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: kisanmart

  # Backend API
  backend:
    build: ./backend
    container_name: kisanmart-api
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb://mongodb:27017/kisanmart
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRE=7d
      - NODE_ENV=production
    depends_on:
      - mongodb

  # Frontend (Nginx)
  frontend:
    build: ./frontend
    container_name: kisanmart-web
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

> **Terminal Command:**
```bash
# Sab containers build aur start karo
docker-compose up --build -d

# Status check karo
docker-compose ps

# Logs dekho
docker-compose logs -f backend

# Band karo
docker-compose down
```

> **Yaad Rakho:** `docker-compose up --build -d` se teen containers chalenge — MongoDB, Backend, Frontend. `-d` detached mode hai (background mein chalega). Multi-stage build frontend mein use kiya — pehle build, phir Nginx se serve.

---

## Task 2: CI/CD with GitHub Actions

### `.github/workflows/deploy.yml`

```yaml
name: KisanMart CI/CD

# Kab chalega — main branch pe push hone pe
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Job 1: Test karo
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - name: Code checkout karo
        uses: actions/checkout@v4

      - name: Node.js setup karo
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Backend dependencies install karo
        run: cd backend && npm ci

      - name: Tests run karo
        run: cd backend && npm test
        env:
          MONGODB_URI: mongodb://localhost:27017/kisanmart_test
          JWT_SECRET: test_secret_key
          NODE_ENV: test

  # Job 2: Build + Deploy (sirf main branch pe)
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Code checkout karo
        uses: actions/checkout@v4

      - name: SSH se server pe deploy karo
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/kisanmart
            git pull origin main
            docker-compose down
            docker-compose up --build -d
            echo "Deployment successful!"
```

### GitHub Secrets Setup Karo

```
GitHub repo → Settings → Secrets → Actions → New secret:

EC2_HOST     = 13.233.xxx.xxx (tumhara EC2 IP)
EC2_USER     = ubuntu
EC2_SSH_KEY  = (tumhari .pem file ka content)
JWT_SECRET   = production_super_secret_key
```

> **Socho Aise:** CI/CD aise hai jaise factory ka conveyor belt — code push karo, automatically test hoga, pass hua toh deploy ho jayega. Manual deployment ki zaroorat nahi!

---

## Task 3: Deploy to AWS EC2

### EC2 Instance Setup

```bash
# 1. AWS Console se EC2 instance launch karo
#    - AMI: Ubuntu 22.04 LTS
#    - Instance type: t2.micro (free tier) ya t2.small
#    - Security Group: Port 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (API) kholo

# 2. SSH se connect karo
ssh -i "kisanmart-key.pem" ubuntu@13.233.xxx.xxx

# 3. Server pe Docker install karo
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git

# 4. Docker ko bina sudo chalane do
sudo usermod -aG docker ubuntu
# Logout aur login dobara karo

# 5. Project clone karo
git clone https://github.com/yourusername/kisanmart.git
cd kisanmart

# 6. .env file banao
nano backend/.env
# (Production values daalo)

# 7. Docker se start karo
docker-compose up --build -d

# 8. Check karo
docker-compose ps
curl http://localhost:5000/api/health
```

---

## Task 4: Nginx + SSL (HTTPS) on EC2

### Main Nginx Config (EC2 host pe)

```bash
# Nginx install karo EC2 pe (Docker ke bahar wala)
sudo apt install -y nginx certbot python3-certbot-nginx
```

### `/etc/nginx/sites-available/kisanmart`

```nginx
server {
    listen 80;
    server_name kisanmart.yourdomain.com;

    # HTTP to HTTPS redirect (SSL ke baad enable karo)
    # return 301 https://$host$request_uri;

    # Frontend serve karo
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

```bash
# Config enable karo
sudo ln -s /etc/nginx/sites-available/kisanmart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL certificate (Let's Encrypt — FREE!)
sudo certbot --nginx -d kisanmart.yourdomain.com
# Automatic HTTPS setup ho jayega!

# Auto-renewal test
sudo certbot renew --dry-run
```

> **Tip:** Let's Encrypt se free SSL certificate milta hai. Certbot automatically Nginx config update karta hai aur HTTPS enable karta hai. Certificate 90 din ka hota hai — auto-renewal set karo!

---

## Task 5: Final Testing Checklist

```
Production Testing:
[x] Health check — /api/health response OK
[x] Register new user — POST /api/auth/register
[x] Login — POST /api/auth/login → Token milna chahiye
[x] Get products — GET /api/products
[x] Create product (with auth) — POST /api/products
[x] Upload image — POST /api/products/:id/images
[x] Create order — POST /api/orders
[x] Admin dashboard — GET /api/admin/dashboard
[x] WebSocket — Real-time notification aani chahiye
[x] Frontend pages — Home, Products, Login, Admin sab open ho
[x] HTTPS working — Green lock icon browser mein
[x] Mobile responsive — Phone pe bhi sahi dikhe
```

### Monitoring Commands

```bash
# Docker container status
docker-compose ps

# Logs real-time
docker-compose logs -f backend

# Resource usage
docker stats

# Disk space
df -h

# Restart agar kuch issue ho
docker-compose restart backend
```

---

## Quick Revision Table

| Step | Tool | Kya Kiya |
|------|------|----------|
| Containerize | Docker | Backend + Frontend + MongoDB |
| Compose | docker-compose | Multi-container orchestration |
| CI/CD | GitHub Actions | Auto test + deploy on push |
| Server | AWS EC2 | Ubuntu server with Docker |
| Reverse Proxy | Nginx | Route traffic to containers |
| SSL | Certbot/Let's Encrypt | Free HTTPS certificate |
| Testing | Manual + Automated | All endpoints verified |

---

## Aaj Kya Seekha?

1. **Docker** — Backend, Frontend, MongoDB sab containerized
2. **Multi-stage build** — Frontend mein pehle build, phir Nginx serve
3. **docker-compose** — Multiple containers ek command se manage
4. **GitHub Actions CI/CD** — Push pe auto test + deploy
5. **AWS EC2 deployment** — Server setup, Docker install, project deploy
6. **Nginx reverse proxy** — Frontend + API + WebSocket routing
7. **SSL/HTTPS** — Certbot se free Let's Encrypt certificate

> **Practice Time!** Production mein sab test karo. Logs check karo errors ke liye. Domain name setup karo agar hai. Kal **Final Day** — course completion aur career guidance!
