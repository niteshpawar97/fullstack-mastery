# Day 68 Morning: Nginx — Reverse Proxy + SSL

> **Aaj ka plan:** Aaj hum Nginx seekhenge — duniya ka sabse powerful web server jo reverse proxy, load balancing, aur SSL handle karta hai. Samjhenge ki Nginx kya hai, kaise install hota hai, aur Node.js app ko production mein kaise serve karte hain HTTPS ke saath.

---

## Nginx Kya Hai?

### Web Server Jo Har Jagah Hai

Nginx (pronounced "Engine-X") ek high-performance web server hai jo 2004 mein Igor Sysoev ne banaya tha. Aaj duniya ki 30%+ websites Nginx use karti hain — Netflix, Airbnb, WordPress.com sab Nginx pe chalte hain.

> **Socho Aise:** Socho ek badi factory hai jahan bahut saare workers (Node.js apps) kaam kar rahe hain. Nginx us factory ka **security guard + receptionist** hai — har visitor (HTTP request) ko check karta hai aur sahi worker ke paas bhejta hai. Koi directly worker ke paas nahi ja sakta.

### Web Server vs Reverse Proxy

| Feature | Web Server | Reverse Proxy |
|---------|-----------|---------------|
| Kaam | Static files serve karna (HTML, CSS, JS, images) | Client requests ko backend server tak forward karna |
| Example | Apache serving HTML pages | Nginx forwarding requests to Node.js |
| Direct Access | Client seedha server se baat karta hai | Client ko backend ka pata hi nahi hota |
| Use Case | Simple websites | Complex applications with multiple backends |

> **Yaad Rakho:** Nginx dono kaam kar sakta hai — web server bhi aur reverse proxy bhi. Production mein hum dono features use karte hain!

---

## Forward Proxy vs Reverse Proxy

```
Forward Proxy (Client side):
Client → [Proxy] → Internet → Server
(VPN jaisa — client ki identity chhupata hai)

Reverse Proxy (Server side):
Client → Internet → [Nginx] → Backend Server(s)
(Server ki identity chhupata hai — client ko sirf Nginx dikhta hai)
```

> **Socho Aise:** Forward proxy = tum mask pehen ke bahar jaate ho (tumhari identity hidden). Reverse proxy = company ka receptionist — bahar wale ko sirf receptionist dikhta hai, andar kaun hai pata nahi.

---

## Nginx Install Karna

### Ubuntu/EC2 pe Installation

> **Terminal Command:**
```bash
# System update karo
sudo apt update

# Nginx install karo
sudo apt install nginx -y

# Nginx start karo
sudo systemctl start nginx

# Boot pe auto-start enable karo
sudo systemctl enable nginx

# Status check karo
sudo systemctl status nginx
```

### Verify Installation

```bash
# Browser mein ya curl se check karo
curl http://localhost
# "Welcome to nginx!" page dikhega
```

> **Tip:** EC2 pe Nginx install karne ke baad Security Group mein port 80 (HTTP) aur 443 (HTTPS) open karna mat bhoolna!

---

## Nginx Configuration Samjho

### File Structure

```
/etc/nginx/
├── nginx.conf              # Main config file
├── sites-available/        # Saare available site configs
│   └── default             # Default site config
├── sites-enabled/          # Active site configs (symlinks)
│   └── default → ../sites-available/default
├── conf.d/                 # Additional config files
└── mime.types              # File type mappings
```

### nginx.conf — Main Config

```nginx
# /etc/nginx/nginx.conf

# Kitne worker processes chalayein (CPU cores ke hisaab se)
worker_processes auto;

# Events block — connection handling
events {
    # Ek worker kitne connections handle karega
    worker_connections 1024;
}

# HTTP block — saari HTTP settings
http {
    # File types include karo
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging settings
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance settings
    sendfile on;              # Efficient file transfer
    keepalive_timeout 65;     # Connection reuse time

    # Site configs include karo
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

> **Yaad Rakho:** Nginx config mein har directive semicolon (;) se end hoti hai aur blocks curly braces {} mein hote hain. Ek bhi semicolon miss hua to Nginx start nahi hoga!

---

## Server Blocks (Virtual Hosts)

### Ek Server Pe Multiple Sites

```nginx
# /etc/nginx/sites-available/myapp

server {
    listen 80;                          # Port 80 pe suno
    server_name myapp.com www.myapp.com; # Domain name

    # Static files serve karo
    root /var/www/myapp;                # Website ki root directory
    index index.html;                    # Default file

    # Location blocks — URL patterns handle karo
    location / {
        try_files $uri $uri/ =404;      # File dhundho, nahi mili to 404
    }

    # Images ke liye caching
    location /images/ {
        expires 30d;                     # 30 din cache karo
    }

    # Error page customize karo
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

### Site Enable Karna

```bash
# Symlink banao sites-enabled mein
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/

# Config test karo (bahut important!)
sudo nginx -t

# Nginx reload karo
sudo systemctl reload nginx
```

> **Warning:** Hamesha `nginx -t` run karo reload se pehle. Agar config mein error hai to Nginx crash ho jayega aur site down ho jayegi!

---

## Reverse Proxy Setup — Node.js App Ke Liye

### Sabse Important Configuration

```nginx
# /etc/nginx/sites-available/node-app

server {
    listen 80;
    server_name api.kisanapp.com;       # Tumhara domain

    # Reverse proxy — saari requests Node.js ko bhejo
    location / {
        proxy_pass http://localhost:3000;  # Node.js app ka address
        proxy_http_version 1.1;

        # WebSocket support ke liye zaroori headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Original client info forward karo
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache off karo API ke liye
        proxy_cache_bypass $http_upgrade;
    }
}
```

> **Socho Aise:** Bina Nginx ke tumhara Node.js app port 3000 pe chalta hai — `http://server-ip:3000`. Nginx lagane ke baad wahi app `http://api.kisanapp.com` pe access hota hai — professional aur secure!

---

## SSL/TLS — HTTPS Setup

### SSL Kya Hai?

SSL (Secure Sockets Layer) / TLS (Transport Layer Security) ek encryption protocol hai jo client aur server ke beech ke data ko encrypt karta hai.

> **Socho Aise:** HTTP = postcard (koi bhi padh sakta hai), HTTPS = sealed envelope (sirf sender aur receiver padh sakte hain).

### Let's Encrypt + Certbot

Let's Encrypt free SSL certificates deta hai. Certbot ek tool hai jo automatically certificate install karta hai.

```bash
# Certbot install karo
sudo apt install certbot python3-certbot-nginx -y

# SSL certificate generate + install karo (automatic!)
sudo certbot --nginx -d api.kisanapp.com -d www.kisanapp.com

# Auto-renewal test karo
sudo certbot renew --dry-run
```

### Certbot Kya Karta Hai Automatically

```nginx
# Certbot ye config automatically add kar deta hai:

server {
    listen 443 ssl;                     # HTTPS port
    server_name api.kisanapp.com;

    # SSL certificate paths
    ssl_certificate /etc/letsencrypt/live/api.kisanapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kisanapp.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        # ... baaki proxy headers
    }
}

# HTTP ko HTTPS pe redirect karo
server {
    listen 80;
    server_name api.kisanapp.com;
    return 301 https://$server_name$request_uri;  # Permanent redirect
}
```

> **Yaad Rakho:** Let's Encrypt certificates 90 din mein expire hote hain. Certbot ka cron job automatically renew karta hai — `sudo certbot renew` command se.

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| Nginx | High-performance web server + reverse proxy | `sudo apt install nginx` |
| Reverse Proxy | Client requests ko backend tak forward karta hai | `proxy_pass http://localhost:3000` |
| Server Block | Virtual host — ek server pe multiple sites | `server { listen 80; server_name ...; }` |
| Location Block | URL pattern matching | `location /api/ { ... }` |
| SSL/TLS | Data encryption — HTTP ko HTTPS banata hai | Let's Encrypt se free certificate |
| Certbot | Automatic SSL certificate tool | `sudo certbot --nginx -d domain.com` |
| nginx -t | Config syntax test | Hamesha reload se pehle run karo |

---

## Aaj Kya Seekha?

1. **Nginx** duniya ka sabse popular reverse proxy + web server hai
2. **Reverse proxy** client aur backend ke beech ek secure layer hai — client ko backend ka direct access nahi milta
3. **nginx.conf** main config file hai — worker_processes, events, http blocks hote hain
4. **Server blocks** se ek server pe multiple domains host kar sakte ho
5. **Location blocks** se different URL patterns ke liye different behavior set kar sakte ho
6. **proxy_pass** directive Node.js app ko Nginx ke peeche chhupa deti hai
7. **Let's Encrypt + Certbot** se free SSL certificate milta hai — HTTPS setup 1 command mein
8. Production mein **HTTPS mandatory** hai — SEO, security, aur user trust ke liye
