# Day 69 Morning: PM2 — Process Manager for Node.js

> **Aaj ka plan:** Aaj hum PM2 seekhenge — Node.js ka sabse powerful process manager. Samjhenge ki production mein Node.js app ko kaise manage karte hain — auto-restart, cluster mode, log management, aur monitoring. Node.js app ko "production-ready" banana seekhenge.

---

## Process Manager Kyu Chahiye?

### Problem: `node server.js` Se Production Nahi Chalta

Jab tum simply `node server.js` run karte ho:

- Terminal band kiya? App bhi band ho gayi
- App crash hua? Koi restart nahi karega
- CPU ke saare cores use nahi ho rahe
- Logs manage nahi ho rahe
- Memory leak ka pata nahi chalta

> **Socho Aise:** Socho ek kisan ne ek pump lagaya khet mein. Agar kisan wahan khada raha tab hi pump chalega — ye toh practical nahi hai! Kisan ko ek **automatic controller** chahiye jo pump ko monitor kare, band ho jaye to restart kare, aur report de ki kitna paani gaya. PM2 wahi controller hai Node.js apps ke liye.

---

## PM2 Kya Hai?

PM2 (Process Manager 2) ek production-grade process manager hai Node.js ke liye:

| Feature | Description |
|---------|-------------|
| Auto Restart | App crash hone pe automatically restart |
| Cluster Mode | CPU ke saare cores use karo |
| Log Management | Logs organize aur rotate karo |
| Monitoring | CPU, Memory, requests real-time dekho |
| Startup Script | Server reboot pe apps auto-start |
| Zero Downtime | Reload without dropping connections |
| Ecosystem File | Multiple apps ek config se manage |

> **Yaad Rakho:** PM2 sirf Node.js ke liye nahi hai — Python, Ruby, PHP, ya koi bhi script PM2 se manage ho sakti hai!

---

## PM2 Install Karna

```bash
# Global install karo
npm install pm2 -g

# Version check karo
pm2 --version

# Completion setup (optional — tab suggestions ke liye)
pm2 completion install
```

---

## Basic PM2 Commands

### App Start Karna

```bash
# Simple start
pm2 start server.js

# Naam de ke start karo (recommended)
pm2 start server.js --name "kisan-api"

# Watch mode — file changes pe auto-restart
pm2 start server.js --name "kisan-api" --watch

# Environment variable ke saath
pm2 start server.js --name "kisan-api" --env production
```

### App Manage Karna

```bash
# Saari running apps dekho
pm2 list
# Ya short form
pm2 ls

# Specific app ki details
pm2 show kisan-api

# App restart karo
pm2 restart kisan-api

# App stop karo (process alive lekin requests handle nahi karega)
pm2 stop kisan-api

# App delete karo (PM2 list se hata do)
pm2 delete kisan-api

# Saari apps restart
pm2 restart all

# Saari apps delete
pm2 delete all
```

> **Tip:** PM2 mein apps ko naam ya ID se reference kar sakte ho. `pm2 restart 0` ya `pm2 restart kisan-api` — dono kaam karenge.

---

## Cluster Mode — CPU Cores Ka Full Use

### Single Process vs Cluster Mode

```
Single Mode (default):
CPU Core 1: [Node.js App] ← Sirf 1 core use ho raha hai
CPU Core 2: [Idle]
CPU Core 3: [Idle]
CPU Core 4: [Idle]

Cluster Mode:
CPU Core 1: [Node.js App - Instance 1]
CPU Core 2: [Node.js App - Instance 2]
CPU Core 3: [Node.js App - Instance 3]
CPU Core 4: [Node.js App - Instance 4]
← Saare cores kaam kar rahe hain!
```

> **Socho Aise:** Ek dukaan mein 1 counter hai — line lagi hai. Cluster mode = 4 counters khol do — sab customers jaldi serve honge!

### Cluster Mode Start Karna

```bash
# Saare CPU cores use karo
pm2 start server.js -i max --name "kisan-api"

# Specific number of instances
pm2 start server.js -i 4 --name "kisan-api"

# CPU cores se 1 kam (OS ke liye 1 core chhodo)
pm2 start server.js -i -1 --name "kisan-api"
```

### Zero Downtime Reload

```bash
# Graceful reload — ek ek instance restart hota hai
# Koi request drop nahi hoti!
pm2 reload kisan-api

# Restart vs Reload:
# restart = sab instances ek saath band → start (downtime aata hai)
# reload = ek ek instance rotate hota hai (zero downtime)
```

> **Yaad Rakho:** Production mein hamesha `pm2 reload` use karo, `pm2 restart` nahi. Reload se zero downtime milta hai!

---

## Ecosystem Config File

### ecosystem.config.js — Professional Way

```javascript
// ecosystem.config.js
// PM2 ka configuration file — sab settings ek jagah

module.exports = {
  apps: [
    {
      // App ka naam
      name: 'kisan-api',

      // Entry file
      script: './server.js',

      // Cluster mode mein kitne instances
      instances: 'max',          // Ya specific number: 4

      // Execution mode
      exec_mode: 'cluster',      // 'fork' ya 'cluster'

      // Auto restart on crash
      autorestart: true,

      // File changes pe restart (development mein useful)
      watch: false,              // Production mein false rakho

      // Max memory — isse zyada use kare to restart
      max_memory_restart: '1G',

      // Environment variables — development
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_HOST: 'localhost'
      },

      // Environment variables — production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: 'production-db.amazonaws.com'
      },

      // Log files
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs from all cluster instances
      merge_logs: true,

      // Graceful shutdown timeout (ms)
      kill_timeout: 5000,

      // Restart delay between crash restarts (ms)
      restart_delay: 4000,

      // Max restarts in time window
      max_restarts: 10,
      min_uptime: '10s'         // 10s se pehle crash = unstable
    }
  ]
};
```

### Ecosystem File Use Karna

```bash
# Development mode mein start
pm2 start ecosystem.config.js

# Production mode mein start
pm2 start ecosystem.config.js --env production

# Reload (zero downtime)
pm2 reload ecosystem.config.js --env production
```

> **Tip:** Ecosystem file ko Git mein commit karo — ye tumhari app ki "production config" hai. `.env` file ki tarah sensitive nahi hai (secrets env variables mein rakho, file mein nahi).

---

## Log Management

### Logs Dekhna

```bash
# Saari apps ke logs
pm2 logs

# Specific app ke logs
pm2 logs kisan-api

# Last 100 lines
pm2 logs kisan-api --lines 100

# Sirf error logs
pm2 logs kisan-api --err

# Logs clear karo
pm2 flush
```

### Log Rotation Setup

```bash
# pm2-logrotate module install karo
pm2 install pm2-logrotate

# Settings configure karo
pm2 set pm2-logrotate:max_size 10M     # Max file size
pm2 set pm2-logrotate:retain 7          # 7 files rakho
pm2 set pm2-logrotate:compress true     # Purani files compress karo
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Daily rotate
```

> **Warning:** Bina log rotation ke log files GB mein badh jaati hain aur disk full ho jata hai. Production mein log rotation MUST hai!

---

## Monitoring — pm2 monit

```bash
# Real-time dashboard
pm2 monit

# Quick status table
pm2 list

# Detailed app info
pm2 show kisan-api

# JSON format mein info (scripting ke liye)
pm2 jlist
```

### PM2 Plus (Web Dashboard)

```bash
# PM2 Plus se connect karo (free tier available)
pm2 plus

# Ye browser mein dashboard deta hai:
# - Real-time metrics
# - Historical data
# - Alerts
# - Remote management
```

---

## Startup Script — Server Reboot Pe Auto-Start

```bash
# Startup script generate karo
pm2 startup
# Ye ek command output karega — use copy-paste karke run karo
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Current running apps save karo
pm2 save

# Ab server reboot hone pe bhi apps auto-start hongi!

# Startup script hataana ho to:
pm2 unstartup systemd
```

> **Yaad Rakho:** `pm2 startup` sirf startup script banata hai. `pm2 save` current app list save karta hai. Dono zaroori hain — ek ke bina doosra kaam nahi karega!

---

## Quick Revision Table

| Command | Kya Karta Hai | Example |
|---------|--------------|---------|
| `pm2 start` | App start karo | `pm2 start server.js --name api` |
| `pm2 list` | Running apps dekho | `pm2 ls` |
| `pm2 restart` | App restart (with downtime) | `pm2 restart api` |
| `pm2 reload` | Zero downtime reload | `pm2 reload api` |
| `pm2 stop` | App stop karo | `pm2 stop api` |
| `pm2 delete` | App hata do PM2 se | `pm2 delete api` |
| `pm2 logs` | Logs dekho | `pm2 logs api --lines 50` |
| `pm2 monit` | Real-time monitoring | Dashboard dikhata hai |
| `pm2 startup` | Auto-start on reboot | Startup script generate karo |
| `pm2 save` | Current state save | Reboot ke baad restore ke liye |
| `-i max` | Cluster mode (all cores) | `pm2 start app.js -i max` |

---

## Aaj Kya Seekha?

1. **Process Manager** kyu chahiye — `node server.js` production ke liye safe nahi hai
2. **PM2** Node.js ka industry-standard process manager hai — auto-restart, monitoring, clustering sab built-in
3. **Cluster mode** se CPU ke saare cores use hote hain — `-i max` flag se
4. **ecosystem.config.js** se professional tarike se apps configure hoti hain — environments, memory limits, logs sab
5. **pm2 reload** zero downtime deta hai — production mein hamesha reload use karo, restart nahi
6. **Log rotation** setup karna zaroori hai — bina iske disk full ho jayegi
7. **pm2 startup + pm2 save** se server reboot pe bhi apps auto-start hoti hain
8. **pm2 monit** se real-time CPU, memory, aur request monitoring hoti hai
