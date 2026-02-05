# Day 74 Morning: Week 11 Revision — Nginx, PM2, CI/CD, AWS Services

> **Aaj ka plan:** Aaj revision day hai! Week 11 mein humne production deployment ke saare important tools seekhe — Nginx, PM2, CI/CD (GitHub Actions), aur AWS services (S3, RDS, IAM, Route53, CloudWatch, Lambda, Bull Queue). Sab kuch ek jagah revise karenge aur production deployment checklist banayenge.

---

## Day 68 Revision: Nginx — Reverse Proxy + SSL

### Key Concepts

```
Nginx = Web Server + Reverse Proxy
├── Static files serve karna (HTML, CSS, JS, images)
├── Reverse proxy (requests Node.js ko forward karna)
├── Load balancing (multiple backends mein distribute)
├── SSL termination (HTTPS handle karna)
└── Rate limiting (DDoS protection)
```

### Important Commands Revision

```bash
# Install
sudo apt install nginx -y

# Config test — HAMESHA reload se pehle!
sudo nginx -t

# Reload (zero downtime) vs Restart (downtime)
sudo systemctl reload nginx    # Production mein ye use karo
sudo systemctl restart nginx   # Avoid in production

# Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Reverse Proxy Config

```nginx
server {
    listen 80;
    server_name api.kisanapp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.kisanapp.com
sudo certbot renew --dry-run   # Auto-renewal test
```

> **Yaad Rakho:** Production mein Nginx + Node.js = industry standard. Nginx SSL handle karta hai, static files serve karta hai, aur Node.js ko direct internet se protect karta hai.

---

## Day 69 Revision: PM2 — Process Manager

### Key Concepts

```
PM2 = Production Process Manager
├── Auto-restart on crash
├── Cluster mode (all CPU cores use)
├── Zero downtime reload
├── Log management + rotation
├── Startup script (reboot pe auto-start)
└── Monitoring dashboard
```

### Essential Commands

```bash
# Start
pm2 start server.js --name "kisan-api"
pm2 start server.js -i max --name "kisan-api"  # Cluster mode

# Manage
pm2 list                  # Running apps dekho
pm2 reload kisan-api      # Zero downtime (PRODUCTION MEIN YE USE KARO)
pm2 restart kisan-api     # With downtime
pm2 stop kisan-api        # Stop
pm2 delete kisan-api      # Remove from PM2

# Logs
pm2 logs kisan-api --lines 50
pm2 flush                 # Clear logs

# Monitoring
pm2 monit                 # Real-time dashboard

# Startup + Save
pm2 startup               # Boot pe auto-start
pm2 save                  # Current state save
```

### Ecosystem Config

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'kisan-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

> **Yaad Rakho:** `pm2 reload` = zero downtime (ek ek instance rotate), `pm2 restart` = with downtime (sab ek saath). Production mein HAMESHA reload!

---

## Day 70 Revision: CI/CD with GitHub Actions

### Key Concepts

```
CI/CD Pipeline:
Push Code → [CI: Lint + Test] → Pass? → [CD: Deploy] → Production
                                 |
                               Fail? → Notification → Fix!
```

### Workflow Structure

```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm test

  deploy:
    needs: test                    # Test pass ke baad hi
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        run: |
          ssh -i key.pem ubuntu@${{ secrets.EC2_HOST }} \
            "cd /app && git pull && npm ci && pm2 reload all"
```

### Key Concepts Table

| Concept | Meaning |
|---------|---------|
| Workflow | YAML file in `.github/workflows/` |
| Job | Task group (runs-on a runner) |
| Step | Single action in a job |
| `needs:` | Job dependency |
| `secrets.X` | Encrypted variables |
| `matrix` | Multiple configs pe test |

> **Yaad Rakho:** Secrets mein sensitive data rakho (SSH keys, passwords). `npm ci` use karo `npm install` ki jagah CI mein (faster, deterministic).

---

## Day 71 Revision: AWS S3 + RDS

### S3 — Object Storage

```
S3 = Cloud File Storage
├── Buckets (containers — globally unique names)
├── Objects (files + metadata)
├── Presigned URLs (temporary secure access)
├── Static website hosting
└── 99.999999999% durability (11 nines!)
```

```javascript
// S3 operations summary
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Upload
await s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));

// Presigned URL (secure temporary access)
const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key }), { expiresIn: 3600 });
```

### RDS — Managed Database

```
RDS = Managed Database Service
├── MySQL, PostgreSQL, Aurora
├── Automatic backups
├── Auto patching
├── Read replicas
└── Connection pooling zaroori hai
```

```javascript
// RDS connection — pg Pool use karo
const pool = new Pool({
    host: process.env.RDS_HOST,
    port: 5432,
    database: 'kisanapp',
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    max: 20
});
```

---

## Day 72 Revision: IAM + Route53 + CloudWatch

### IAM — Security

```
IAM = Access Control
├── Users (people/bots)
├── Groups (user collections)
├── Roles (service permissions — EC2 ko S3 access)
├── Policies (JSON permission rules)
└── Principle: LEAST PRIVILEGE
```

### Route53 — DNS

```
Route53 = DNS Management
├── Hosted Zone (domain ke records)
├── A Record: domain → IP
├── CNAME: subdomain → domain
├── NS Records: registrar mein set karo
└── TTL: cache duration
```

### CloudWatch — Monitoring

```
CloudWatch = Monitoring + Alerts
├── Metrics (CPU, Network, etc.)
├── Alarms (threshold pe notification)
├── Logs (application logs cloud mein)
├── Dashboards (visual monitoring)
└── SNS integration (email/SMS alerts)
```

---

## Day 73 Revision: Lambda + Bull Queue

### Lambda — Serverless

```
Lambda = Function as a Service
├── Pay per execution (no idle cost)
├── Auto-scaling (0 to thousands)
├── Max 15 min execution time
├── Cold start: 300-500ms (Node.js)
├── Triggers: API Gateway, S3, SQS, Schedule
└── Best for: event-driven, short tasks
```

### Bull Queue — Background Jobs

```
Bull Queue = Redis-backed Job Queue
├── Instant response to user (job queued)
├── Worker processes job separately
├── Retry with exponential backoff
├── Delayed jobs (future execution)
├── Recurring jobs (cron schedule)
└── Jobs safe in Redis (survive crashes)
```

---

## Production Deployment Checklist

### Pre-Deployment

| # | Task | Status |
|---|------|--------|
| 1 | Code pe saare tests pass hain | `npm test` green |
| 2 | ESLint — koi errors nahi | `npm run lint` clean |
| 3 | Environment variables set hain | `.env` checked |
| 4 | Database migrations run hain | Schema up-to-date |
| 5 | Dependencies up-to-date | `npm audit` — no critical |
| 6 | Build successful hai | `npm run build` pass |

### Server Setup

| # | Task | Command/Action |
|---|------|---------------|
| 1 | EC2 instance running | AWS Console check |
| 2 | Security Groups configured | SSH(22), HTTP(80), HTTPS(443) |
| 3 | Nginx installed + configured | `nginx -t` pass |
| 4 | SSL certificate active | `certbot` certificates valid |
| 5 | PM2 installed + app running | `pm2 list` — online |
| 6 | PM2 startup script set | `pm2 startup` + `pm2 save` |
| 7 | Log rotation configured | `pm2-logrotate` installed |

### AWS Services

| # | Task | Status |
|---|------|--------|
| 1 | IAM roles configured (least privilege) | No admin access |
| 2 | S3 buckets created + policies set | Private by default |
| 3 | RDS instance running + backed up | Automated backups ON |
| 4 | Route53 DNS records configured | Domain resolving |
| 5 | CloudWatch alarms active | CPU, StatusCheck alarms |
| 6 | SNS notifications configured | Email alerts working |

### CI/CD Pipeline

| # | Task | Status |
|---|------|--------|
| 1 | CI workflow — lint + test on push | Green badge |
| 2 | CD workflow — deploy on merge to main | Auto-deploy working |
| 3 | GitHub Secrets configured | SSH key, server IP |
| 4 | Health check in deploy script | `curl` check after deploy |

---

## Architecture Diagram — Full Stack Production Setup

```
                    ┌─────────────────────────────────┐
                    │         GitHub Repository         │
                    │  Push → CI (lint+test) → CD       │
                    └──────────────┬──────────────────┘
                                   │ Deploy via SSH
                                   ▼
┌──────────┐    ┌─────────────────────────────────────┐
│  Route53  │───▶│           EC2 Instance               │
│  DNS      │    │                                       │
│  A Record │    │  ┌─────────┐    ┌──────────────────┐ │
└──────────┘    │  │  Nginx  │───▶│  PM2 + Node.js   │ │
                    │  │  :443   │    │  :3000 (cluster) │ │
┌──────────┐    │  │  SSL    │    │                    │ │
│CloudWatch│◀───│  └─────────┘    └──────────────────┘ │
│ Alarms   │    └──────────────┬──────────────────────┘
└──────────┘                   │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              ┌──────────┐         ┌──────────┐
              │  RDS     │         │  S3      │
              │  Database│         │  Storage │
              └──────────┘         └──────────┘
```

> **Yaad Rakho:** Ye architecture ek standard production setup hai. Interview mein ya real project mein ye diagram draw kar sako — bahut valuable hai!

---

## Quick Revision Table — Complete Week 11

| Day | Topic | Key Takeaway |
|-----|-------|-------------|
| 68 | Nginx | Reverse proxy + SSL — Node.js ko protect karta hai |
| 69 | PM2 | Process manager — auto-restart, cluster, zero downtime |
| 70 | CI/CD | GitHub Actions — automated testing + deployment |
| 71 | S3 + RDS | Cloud storage + managed database |
| 72 | IAM + Route53 + CloudWatch | Security + DNS + Monitoring |
| 73 | Lambda + Bull | Serverless functions + background jobs |
| 74 | Revision | Sab kuch ek saath — production ready! |

---

## Aaj Kya Seekha?

1. **Nginx** production mein Node.js ka bodyguard hai — reverse proxy, SSL, rate limiting
2. **PM2** apps ko crash-proof banata hai — cluster mode se full CPU use
3. **CI/CD** manual deployment khatam karta hai — push karo, sab automatic
4. **S3** files ke liye, **RDS** database ke liye — managed services = kam headache
5. **IAM** se security control, **Route53** se DNS, **CloudWatch** se monitoring
6. **Lambda** serverless tasks ke liye, **Bull Queue** background jobs ke liye
7. **Production checklist** follow karo — ek bhi step miss karna = potential disaster
8. Ye sab milke ek **professional, scalable, secure** application infrastructure banate hain
