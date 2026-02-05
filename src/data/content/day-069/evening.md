# Day 69 Evening: Practice — PM2 Se Express App Manage Karna

> **Aaj ka plan:** Ab hum hands-on practice karenge — Express app ko PM2 se manage karenge, cluster mode setup karenge, log rotation lagayenge, ecosystem file likhenge, aur PM2 deploy feature use karenge.

---

## Practice 1: PM2 Se App Start Aur Manage

### Step 1 — PM2 Install Aur Basic Commands

```bash
# PM2 global install karo
npm install pm2 -g

# Verify
pm2 --version

# Pehle se koi app chal rahi ho to saaf karo
pm2 delete all
```

### Step 2 — Express App Start Karo

```bash
# Project folder mein jao (kal wala kisan-api)
cd ~/kisan-api

# PM2 se start karo — naam dena important hai
pm2 start server.js --name "kisan-api"

# List dekho
pm2 list
```

> **Expected Output:**
```
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┐
│ id  │ name         │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┤
│ 0   │ kisan-api    │ default     │ 1.0.0   │ fork    │ 12345    │ 5s     │ 0    │ online    │ 0.1%     │ 45.2mb   │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┘
```

### Step 3 — Basic Management Commands Practice

```bash
# App ki detailed info dekho
pm2 show kisan-api

# App stop karo
pm2 stop kisan-api
# List mein status "stopped" dikhega

# Wapas start karo
pm2 start kisan-api

# Restart karo
pm2 restart kisan-api

# API test karo
curl http://localhost:3000/health
```

> **Practice Time!** Ye saari commands ek ek karke try karo aur `pm2 list` se status changes observe karo. Samjho ki stop, start, aur restart mein kya fark hai.

---

## Practice 2: Auto-Restart Test Karo

### Crash Simulation

```javascript
// ~/kisan-api/crash-test.js
// PM2 ke auto-restart feature ko test karne ke liye

const express = require('express');
const app = express();

let requestCount = 0;

app.get('/', (req, res) => {
    requestCount++;
    console.log(`Request #${requestCount} received`);

    // Har 5th request pe crash karo (testing ke liye)
    if (requestCount % 5 === 0) {
        console.log('BOOM! App crash ho rahi hai...');
        process.exit(1); // App crash!
    }

    res.json({ message: 'Chal raha hai', requests: requestCount });
});

app.listen(3001, () => {
    console.log('Crash test app port 3001 pe');
});
```

```bash
# Crash test app start karo
pm2 start crash-test.js --name "crash-test"

# 5 baar request bhejo
for i in {1..8}; do
    curl http://localhost:3001/ 2>/dev/null
    echo ""
    sleep 1
done

# Dekho kitni baar restart hua
pm2 list
# "↺" column mein restart count dikhega
```

> **Expected Output:**
```
# 5th request pe app crash hoga
# PM2 automatically restart karega
# ↺ column mein "1" (ya zyada) dikhega
```

> **Yaad Rakho:** PM2 ka `↺` column restart count dikhata hai. Agar ye bahut jaldi badh raha hai to app mein serious bug hai — fix karo!

---

## Practice 3: Cluster Mode Setup

### Step 1 — Cluster Mode Start

```bash
# Pehle purani apps clean karo
pm2 delete all

# Cluster mode mein start (CPU cores check karo pehle)
nproc  # Kitne CPU cores hain

# Saare cores use karo
pm2 start server.js --name "kisan-api" -i max

# List dekho — multiple instances dikhenge
pm2 list
```

> **Expected Output:**
```
┌─────┬──────────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id  │ name         │ mode    │ pid      │ uptime │ ↺    │ status    │
├─────┼──────────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0   │ kisan-api    │ cluster │ 1001     │ 5s     │ 0    │ online    │
│ 1   │ kisan-api    │ cluster │ 1002     │ 5s     │ 0    │ online    │
│ 2   │ kisan-api    │ cluster │ 1003     │ 5s     │ 0    │ online    │
│ 3   │ kisan-api    │ cluster │ 1004     │ 5s     │ 0    │ online    │
└─────┴──────────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

### Step 2 — Zero Downtime Reload Test

```bash
# Server.js mein kuch change karo (response message update)
# Phir zero downtime reload karo

pm2 reload kisan-api

# Reload ke dauraan requests bhejo — koi fail nahi honi chahiye
for i in {1..20}; do
    curl -s http://localhost:3000/health | head -c 50
    echo ""
done
```

### Step 3 — Instances Scale Karo

```bash
# Instances badhao
pm2 scale kisan-api +2   # 2 aur instances add

# Instances ghatao
pm2 scale kisan-api 2    # Sirf 2 rakh do

# Check karo
pm2 list
```

> **Tip:** Load ke hisaab se instances scale kar sakte ho. Peak hours mein zyada, raat mein kam — ye basic auto-scaling hai.

---

## Practice 4: Ecosystem File Banao

### Step 1 — Config File Create Karo

```javascript
// ~/kisan-api/ecosystem.config.js
// Production-ready PM2 configuration

module.exports = {
  apps: [
    {
      name: 'kisan-api',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // Environment — Development
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },

      // Environment — Production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },

      // Logs config
      error_file: './logs/kisan-api-error.log',
      out_file: './logs/kisan-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart behavior
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,

      // Graceful shutdown handle karo
      listen_timeout: 8000,
      shutdown_with_message: true
    }
  ]
};
```

### Step 2 — Ecosystem File Se Deploy

```bash
# Logs folder banao
mkdir -p ~/kisan-api/logs

# Pehle purane processes hata do
pm2 delete all

# Ecosystem file se start — development mode
pm2 start ecosystem.config.js
pm2 list

# Production mode mein start
pm2 delete all
pm2 start ecosystem.config.js --env production

# Verify environment
pm2 env 0 | grep NODE_ENV
```

> **Expected Output:**
```
NODE_ENV: production
```

---

## Practice 5: Log Management Aur Rotation

### Logs Dekhna

```bash
# Live logs (saari apps)
pm2 logs

# Specific app ke logs — last 50 lines
pm2 logs kisan-api --lines 50

# Sirf errors
pm2 logs kisan-api --err --lines 20

# Timestamp ke saath
pm2 logs kisan-api --timestamp

# Logs clear karo
pm2 flush
```

### Log Rotation Install Karo

```bash
# pm2-logrotate module install karo
pm2 install pm2-logrotate

# Settings configure karo
pm2 set pm2-logrotate:max_size 10M       # 10MB pe rotate
pm2 set pm2-logrotate:retain 7            # 7 purani files rakho
pm2 set pm2-logrotate:compress true       # Compress karo
pm2 set pm2-logrotate:workerInterval 30   # Check interval (seconds)
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Daily midnight

# Settings verify karo
pm2 get pm2-logrotate
```

---

## Practice 6: Startup Script + PM2 Monitoring

### Auto-Start Setup

```bash
# Startup command generate karo
pm2 startup
# Output mein jo command aaye, use EXACTLY copy-paste karke run karo
# Example output:
# sudo env PATH=$PATH:/usr/bin/node pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Current state save karo
pm2 save

# Verify — server reboot karo (optional pe EC2 pe try karo)
# sudo reboot
# SSH wapas karo
# pm2 list — apps running dikhni chahiye!
```

### Real-Time Monitoring

```bash
# Terminal dashboard
pm2 monit

# Ye dikhata hai:
# - Har instance ka CPU aur Memory usage
# - Logs real-time
# - Custom metrics (agar add kiye hain)

# Exit: Ctrl+C
```

> **Practice Time!** `pm2 monit` chala ke rakh do aur doosre terminal se API pe requests bhejo. Dekho ki CPU aur memory kaise change hote hain.

---

## Quick Revision Table

| Task | Command | Notes |
|------|---------|-------|
| Cluster mode start | `pm2 start app.js -i max` | Saare cores use |
| Zero downtime reload | `pm2 reload app-name` | Production ke liye best |
| Ecosystem file start | `pm2 start ecosystem.config.js` | Config file se |
| Production mode | `--env production` | Environment switch |
| Log rotation install | `pm2 install pm2-logrotate` | Disk full se bachao |
| Startup script | `pm2 startup` + `pm2 save` | Reboot pe auto-start |
| Scale instances | `pm2 scale app-name 4` | Runtime mein scale |
| Monitor dashboard | `pm2 monit` | Real-time metrics |
| Flush logs | `pm2 flush` | Purane logs clear |

---

## Aaj Kya Seekha?

1. **PM2 se app manage** karna seekha — start, stop, restart, delete commands
2. **Auto-restart** feature test kiya — crash hone pe PM2 khud restart karta hai
3. **Cluster mode** se saare CPU cores use kiye — `-i max` se maximum performance
4. **Zero downtime reload** se production mein bina downtime ke code update hota hai
5. **ecosystem.config.js** se professional config likhi — environments, logs, memory limits sab ek file mein
6. **Log rotation** setup kiya — `pm2-logrotate` se disk full hone se bachao
7. **Startup script** se server reboot pe bhi apps auto-start hoti hain — `pm2 startup` + `pm2 save`
8. **pm2 monit** se real-time monitoring — CPU, memory, logs sab ek dashboard mein
