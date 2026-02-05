# Day 68 Evening: Practice — Nginx Reverse Proxy + SSL Setup

> **Aaj ka plan:** Ab hum hands-on practice karenge — EC2 pe Nginx install karenge, Express app ke liye reverse proxy configure karenge, aur SSL setup karke HTTPS enable karenge. Full production-ready setup!

---

## Practice 1: Nginx Install Aur Basic Setup

### Step 1 — EC2 Pe Nginx Install Karo

```bash
# SSH se EC2 pe connect karo
ssh -i my-key.pem ubuntu@your-ec2-ip

# System update karo
sudo apt update && sudo apt upgrade -y

# Nginx install karo
sudo apt install nginx -y

# Status check karo
sudo systemctl status nginx
```

> **Expected Output:**
```
● nginx.service - A high performance web server
   Active: active (running) since ...
```

### Step 2 — Firewall Configure Karo

```bash
# UFW firewall mein Nginx allow karo
sudo ufw allow 'Nginx Full'    # Port 80 + 443 dono
sudo ufw enable
sudo ufw status

# Ya agar UFW nahi use kar rahe to EC2 Security Group mein:
# Inbound Rule: HTTP (80) — Source: 0.0.0.0/0
# Inbound Rule: HTTPS (443) — Source: 0.0.0.0/0
```

### Step 3 — Default Page Verify Karo

```bash
# Browser mein apna EC2 public IP dalo
# http://your-ec2-ip
# "Welcome to nginx!" page dikhna chahiye

# Terminal se bhi check kar sakte ho
curl http://localhost
```

> **Tip:** Agar page nahi dikh raha to pehle Security Group check karo — port 80 open hona chahiye!

---

## Practice 2: Express App Banao Aur Chalaao

### Step 1 — Simple Express API

```bash
# Project folder banao
mkdir -p ~/kisan-api && cd ~/kisan-api

# Node.js project initialize karo
npm init -y
npm install express
```

```javascript
// ~/kisan-api/server.js
// Kisan App API — production ke liye tayyar

const express = require('express');
const app = express();
const PORT = 3000; // Ye port sirf internal hai, bahar se Nginx handle karega

app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        server: 'Kisan API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Fasal data route
app.get('/api/crops', (req, res) => {
    // Sample crop data
    const crops = [
        { id: 1, name: 'Gehu (Wheat)', season: 'Rabi', price: 2275 },
        { id: 2, name: 'Dhan (Rice)', season: 'Kharif', price: 2183 },
        { id: 3, name: 'Makka (Corn)', season: 'Kharif', price: 1962 }
    ];
    res.json({ success: true, data: crops });
});

// Mandi price route
app.get('/api/mandi/:crop', (req, res) => {
    const { crop } = req.params;
    // Mandi ka live price (sample data)
    res.json({
        crop: crop,
        mandi: 'Azadpur Mandi, Delhi',
        price: Math.floor(Math.random() * 3000) + 1000,
        unit: 'per quintal',
        date: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Kisan API chal raha hai port ${PORT} pe`);
});
```

```bash
# App start karo (background mein)
node server.js &

# Test karo
curl http://localhost:3000/health
curl http://localhost:3000/api/crops
```

> **Expected Output:**
```json
{"status":"healthy","server":"Kisan API","uptime":5.123,"timestamp":"2026-04-04T10:00:00.000Z"}
```

---

## Practice 3: Nginx Reverse Proxy Configure Karo

### Step 1 — Site Config File Banao

```bash
# Default config hata do (optional)
sudo rm /etc/nginx/sites-enabled/default

# Naya config file banao
sudo nano /etc/nginx/sites-available/kisan-api
```

```nginx
# /etc/nginx/sites-available/kisan-api
# Kisan API ke liye Nginx reverse proxy config

# Rate limiting zone define karo (DDoS protection)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80;
    server_name your-domain.com;        # Apna domain ya EC2 IP dalo

    # Access aur error logs
    access_log /var/log/nginx/kisan-api-access.log;
    error_log /var/log/nginx/kisan-api-error.log;

    # Max upload size (file uploads ke liye)
    client_max_body_size 10M;

    # API routes — Node.js ko forward karo
    location / {
        # Rate limiting lagao
        limit_req zone=api_limit burst=20 nodelay;

        # Reverse proxy to Node.js
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Important headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files directly Nginx se serve karo (faster)
    location /static/ {
        alias /var/www/kisan-api/static/;
        expires 30d;                     # Browser caching
        add_header Cache-Control "public, immutable";
    }

    # Health check — Nginx level
    location /nginx-health {
        return 200 'Nginx is healthy\n';
        add_header Content-Type text/plain;
    }
}
```

### Step 2 — Config Enable Aur Test Karo

```bash
# Symlink banao
sudo ln -s /etc/nginx/sites-available/kisan-api /etc/nginx/sites-enabled/

# Config test karo — BAHUT IMPORTANT!
sudo nginx -t
```

> **Expected Output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

```bash
# Nginx reload karo (restart se better — zero downtime)
sudo systemctl reload nginx

# Test karo — ab port 80 se access hoga
curl http://localhost/health
curl http://localhost/api/crops
curl http://localhost/nginx-health
```

> **Yaad Rakho:** `reload` aur `restart` mein fark hai — reload gracefully config update karta hai bina connections drop kiye. Restart poora server band karke start karta hai.

---

## Practice 4: SSL Setup With Let's Encrypt

### Prerequisites

```bash
# Domain hona chahiye jo EC2 IP pe point kare
# DNS A record: your-domain.com → your-ec2-ip

# Verify karo ki domain resolve ho raha hai
nslookup your-domain.com
```

### Step 1 — Certbot Install Aur SSL Generate

```bash
# Certbot install karo
sudo apt install certbot python3-certbot-nginx -y

# SSL certificate generate karo (interactive process)
sudo certbot --nginx -d your-domain.com

# Ye poochega:
# 1. Email address (renewal notifications ke liye)
# 2. Terms of service agree
# 3. HTTP → HTTPS redirect karna hai? (YES select karo)
```

> **Tip:** Certbot automatically Nginx config modify kar deta hai — SSL lines add karta hai aur HTTP-to-HTTPS redirect setup karta hai.

### Step 2 — Verify HTTPS

```bash
# HTTPS test karo
curl https://your-domain.com/health

# SSL certificate details dekho
curl -vI https://your-domain.com 2>&1 | grep -i "ssl\|cert\|subject"

# Auto-renewal test karo
sudo certbot renew --dry-run
```

> **Expected Output:**
```
Congratulations! Your certificate and chain have been saved.
```

### Step 3 — Auto-Renewal Verify

```bash
# Certbot automatically cron job set karta hai
# Check karo
sudo systemctl list-timers | grep certbot

# Manual renewal test
sudo certbot renew --dry-run
```

> **Warning:** SSL certificate 90 din mein expire hota hai. Certbot ka timer har 12 ghante check karta hai — agar 30 din se kam bache hain to renew kar deta hai.

---

## Practice 5: Nginx Logs Aur Debugging

### Logs Dekhna

```bash
# Access log — kaun kaun aa raha hai
sudo tail -f /var/log/nginx/kisan-api-access.log

# Error log — kya errors aa rahe hain
sudo tail -f /var/log/nginx/kisan-api-error.log

# Specific error search karo
sudo grep "502" /var/log/nginx/kisan-api-error.log
```

### Common Errors Aur Solutions

```bash
# 502 Bad Gateway — Node.js app chal nahi raha
# Solution: Node.js app start karo
node ~/kisan-api/server.js &

# 403 Forbidden — Permission issue
# Solution: File permissions fix karo
sudo chmod 755 /var/www/kisan-api/

# 413 Request Entity Too Large — File too big
# Solution: client_max_body_size badhao
# client_max_body_size 50M;

# Config test fail — syntax error
# Solution: nginx -t se error location dekho aur fix karo
sudo nginx -t
```

> **Practice Time!** Apna Node.js app band karo (`kill %1`) aur browser mein site open karo — 502 error dikhega. Phir app wapas start karo aur reload karo — samjho ki error kaise aata hai aur kaise fix hota hai.

---

## Quick Revision Table

| Task | Command | Notes |
|------|---------|-------|
| Nginx install | `sudo apt install nginx -y` | Ubuntu/Debian pe |
| Config test | `sudo nginx -t` | Hamesha reload se pehle |
| Reload (graceful) | `sudo systemctl reload nginx` | Zero downtime |
| Restart (full) | `sudo systemctl restart nginx` | Connections drop honge |
| Site enable | `ln -s sites-available/x sites-enabled/` | Symlink banao |
| SSL install | `sudo certbot --nginx -d domain.com` | Automatic config update |
| SSL renew test | `sudo certbot renew --dry-run` | Renewal check |
| Access log | `tail -f /var/log/nginx/access.log` | Live requests dekho |
| Error log | `tail -f /var/log/nginx/error.log` | Debugging ke liye |

---

## Aaj Kya Seekha?

1. EC2 pe **Nginx install** karna aur basic setup karna seekha
2. **Express app** ke liye reverse proxy config likha — `proxy_pass` se traffic forward hota hai
3. **Rate limiting** se DDoS protection lagayi — `limit_req_zone` directive use ki
4. **SSL certificate** Let's Encrypt se free mein generate kiya — Certbot ek command mein sab kar deta hai
5. **HTTP to HTTPS redirect** automatic ho jata hai Certbot se
6. **Nginx logs** se debugging karna seekha — 502, 403, 413 errors samjhe
7. `nginx -t` hamesha reload se pehle run karo — config error se site down ho sakti hai
8. Production mein **Nginx + Node.js** ka combination industry standard hai
