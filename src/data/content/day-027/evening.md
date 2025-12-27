# Day 27 Evening: Shell Scripting Practice — Backup, Log Analyzer & Automation

> **Aaj ka plan:** Subah humne Linux commands aur shell scripting basics seekhe. Ab hum real-world scripts likhenge — backup script, log analyzer, file management automation, aur cron job setup karenge.

---

## Project 1: Automated Backup Script

### backup.sh — Project Files Ka Backup

```bash
#!/bin/bash
# =============================================
# Automated Backup Script
# Ye script project folder ka backup banata hai
# =============================================

# Variables — apne hisaab se change karo
PROJECT_DIR="/home/kisan/myproject"
BACKUP_DIR="/home/kisan/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="backup_${DATE}.tar.gz"
MAX_BACKUPS=7  # Sirf last 7 backups rakho

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function: Log message
log() {
  echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Check karo project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  error "Project directory nahi mili: $PROJECT_DIR"
  exit 1
fi

# Step 2: Backup directory banao agar nahi hai
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  log "Backup directory banayi: $BACKUP_DIR"
fi

# Step 3: Backup banao
log "Backup shuru ho raha hai..."
log "Source: $PROJECT_DIR"
log "Destination: $BACKUP_DIR/$BACKUP_NAME"

# tar se compress karo — node_modules exclude karo!
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  -C "$(dirname $PROJECT_DIR)" \
  "$(basename $PROJECT_DIR)" 2>/dev/null

# Check hua ya nahi
if [ $? -eq 0 ]; then
  SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | awk '{print $1}')
  log "Backup complete! Size: $SIZE"
else
  error "Backup fail ho gaya!"
  exit 1
fi

# Step 4: Purane backups delete karo
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
if [ $BACKUP_COUNT -gt $MAX_BACKUPS ]; then
  DELETE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
  warn "Purane $DELETE_COUNT backups delete ho rahe hain..."
  ls -1t "$BACKUP_DIR"/backup_*.tar.gz | tail -n $DELETE_COUNT | xargs rm -f
  log "Cleanup done! $MAX_BACKUPS backups rakhe hain."
fi

# Step 5: Summary
log "=== Backup Summary ==="
log "Total backups: $(ls -1 "$BACKUP_DIR"/backup_*.tar.gz | wc -l)"
log "Latest: $BACKUP_NAME"
log "All backups:"
ls -lh "$BACKUP_DIR"/backup_*.tar.gz | awk '{print "   ", $5, $9}'
```

> **Terminal Command:**
> ```bash
> # Script ko executable banao
> chmod +x backup.sh
>
> # Chalao
> ./backup.sh
>
> # Cron se daily raat 2 baje backup
> # crontab -e mein add karo:
> # 0 2 * * * /home/kisan/backup.sh >> /home/kisan/backup.log 2>&1
> ```

> **Tip:** Hamesha `node_modules` aur `.git` exclude karo backup se — ye bahut bade hote hain aur recreate ho sakte hain!

---

## Project 2: Log Analyzer Script

### log_analyzer.sh — Server Logs Ka Analysis

```bash
#!/bin/bash
# =============================================
# Log Analyzer Script
# Server logs analyze karke report banata hai
# =============================================

LOG_FILE="${1:-/var/log/access.log}"  # Argument se file lo, ya default
REPORT_FILE="log_report_$(date +%Y-%m-%d).txt"

# Check file exists
if [ ! -f "$LOG_FILE" ]; then
  echo "Log file nahi mili: $LOG_FILE"
  echo "Usage: ./log_analyzer.sh <log_file_path>"
  exit 1
fi

echo "====================================="
echo "   LOG ANALYSIS REPORT"
echo "   File: $LOG_FILE"
echo "   Date: $(date)"
echo "====================================="

# Total requests
TOTAL=$(wc -l < "$LOG_FILE")
echo ""
echo "📊 Total Requests: $TOTAL"

# HTTP Methods breakdown
echo ""
echo "📋 HTTP Methods:"
echo "─────────────────"
grep -oE "(GET|POST|PUT|DELETE|PATCH)" "$LOG_FILE" | \
  sort | uniq -c | sort -rn | \
  while read count method; do
    PERCENT=$((count * 100 / TOTAL))
    echo "   $method: $count ($PERCENT%)"
  done

# Status codes
echo ""
echo "📋 Status Codes:"
echo "─────────────────"
grep -oE "HTTP/[0-9.]+ [0-9]{3}" "$LOG_FILE" | \
  awk '{print $2}' | sort | uniq -c | sort -rn | head -10 | \
  while read count status; do
    case $status in
      2*) ICON="✅" ;;
      3*) ICON="🔄" ;;
      4*) ICON="⚠️" ;;
      5*) ICON="🔴" ;;
      *)  ICON="❓" ;;
    esac
    echo "   $ICON $status: $count requests"
  done

# Top 10 IP addresses
echo ""
echo "📋 Top 10 IP Addresses:"
echo "─────────────────────────"
awk '{print $1}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -10 | \
  while read count ip; do
    echo "   $ip: $count requests"
  done

# Top 10 requested URLs
echo ""
echo "📋 Top 10 URLs:"
echo "─────────────────"
awk '{print $7}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -10 | \
  while read count url; do
    echo "   $url: $count hits"
  done

# Error rate
echo ""
ERROR_COUNT=$(grep -cE "HTTP/[0-9.]+ [45][0-9]{2}" "$LOG_FILE" 2>/dev/null || echo 0)
if [ $TOTAL -gt 0 ]; then
  ERROR_RATE=$((ERROR_COUNT * 100 / TOTAL))
  echo "⚡ Error Rate: $ERROR_COUNT/$TOTAL ($ERROR_RATE%)"
  if [ $ERROR_RATE -gt 10 ]; then
    echo "   🔴 HIGH ERROR RATE! Investigation needed!"
  elif [ $ERROR_RATE -gt 5 ]; then
    echo "   🟡 Warning: Error rate above 5%"
  else
    echo "   🟢 Error rate normal"
  fi
fi

# Busiest hours
echo ""
echo "📋 Busiest Hours:"
echo "─────────────────"
awk -F'[' '{print $2}' "$LOG_FILE" | awk -F: '{print $2":00"}' | \
  sort | uniq -c | sort -rn | head -5 | \
  while read count hour; do
    echo "   $hour — $count requests"
  done

echo ""
echo "====================================="
echo "Report saved to: $REPORT_FILE"
echo "====================================="
```

> **Terminal Command:**
> ```bash
> chmod +x log_analyzer.sh
> ./log_analyzer.sh access.log
>
> # Output ko file mein bhi save karo
> ./log_analyzer.sh access.log | tee log_report.txt
> ```

---

## Project 3: File Management Automation

### file_manager.sh — Project Cleanup & Organization

```bash
#!/bin/bash
# =============================================
# File Management Automation
# Project mein cleanup aur organization karta hai
# =============================================

TARGET_DIR="${1:-.}"  # Argument ya current directory

echo "🗂️  File Manager - Target: $TARGET_DIR"
echo ""

# Function: Find large files
find_large_files() {
  echo "📦 Large Files (>10MB):"
  echo "───────────────────────"
  find "$TARGET_DIR" -type f -size +10M 2>/dev/null | while read file; do
    SIZE=$(du -sh "$file" | awk '{print $1}')
    echo "   $SIZE — $file"
  done
  echo ""
}

# Function: Find duplicate extensions
file_stats() {
  echo "📊 File Type Statistics:"
  echo "───────────────────────"
  find "$TARGET_DIR" -type f 2>/dev/null | \
    awk -F. '{print $NF}' | sort | uniq -c | sort -rn | head -15 | \
    while read count ext; do
      echo "   .$ext: $count files"
    done
  echo ""
}

# Function: Find empty files and directories
find_empty() {
  echo "🗑️  Empty Files:"
  echo "───────────────"
  EMPTY_FILES=$(find "$TARGET_DIR" -type f -empty 2>/dev/null | wc -l)
  echo "   Found: $EMPTY_FILES empty files"
  find "$TARGET_DIR" -type f -empty 2>/dev/null | head -10

  echo ""
  echo "🗑️  Empty Directories:"
  echo "───────────────────────"
  EMPTY_DIRS=$(find "$TARGET_DIR" -type d -empty 2>/dev/null | wc -l)
  echo "   Found: $EMPTY_DIRS empty directories"
  find "$TARGET_DIR" -type d -empty 2>/dev/null | head -10
  echo ""
}

# Function: Find old log files
find_old_logs() {
  echo "📜 Log Files (older than 7 days):"
  echo "──────────────────────────────────"
  find "$TARGET_DIR" -name "*.log" -mtime +7 2>/dev/null | while read file; do
    SIZE=$(du -sh "$file" | awk '{print $1}')
    MOD=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1)
    echo "   $SIZE | $MOD | $file"
  done
  echo ""
}

# Function: Node.js project cleanup
node_cleanup() {
  echo "🧹 Node.js Cleanup Suggestions:"
  echo "────────────────────────────────"

  # node_modules size
  if [ -d "$TARGET_DIR/node_modules" ]; then
    NM_SIZE=$(du -sh "$TARGET_DIR/node_modules" 2>/dev/null | awk '{print $1}')
    echo "   node_modules size: $NM_SIZE"
    echo "   💡 Tip: 'rm -rf node_modules && npm install' se refresh karo"
  fi

  # .env check
  if [ -f "$TARGET_DIR/.env" ]; then
    echo "   ⚠️  .env file found — make sure it's in .gitignore!"
    if [ -f "$TARGET_DIR/.gitignore" ]; then
      if grep -q ".env" "$TARGET_DIR/.gitignore"; then
        echo "   ✅ .env is in .gitignore"
      else
        echo "   🔴 .env is NOT in .gitignore! Add it NOW!"
      fi
    fi
  fi

  # package-lock check
  if [ -f "$TARGET_DIR/package-lock.json" ] && [ -f "$TARGET_DIR/yarn.lock" ]; then
    echo "   ⚠️  Both package-lock.json and yarn.lock found — ek hi rakho!"
  fi
  echo ""
}

# Menu
echo "Select an option:"
echo "1) All checks"
echo "2) Large files only"
echo "3) File statistics"
echo "4) Empty files/dirs"
echo "5) Old logs"
echo "6) Node.js cleanup"
read -p "Choice (1-6): " CHOICE

case $CHOICE in
  1)
    find_large_files
    file_stats
    find_empty
    find_old_logs
    node_cleanup
    ;;
  2) find_large_files ;;
  3) file_stats ;;
  4) find_empty ;;
  5) find_old_logs ;;
  6) node_cleanup ;;
  *) echo "Galat choice! 1-6 mein se choose karo." ;;
esac
```

---

## Cron Job Setup: Practical Examples

### Step 1: Cron Jobs Configure Karo

> **Terminal Command:**
> ```bash
> # Cron editor kholo
> crontab -e
>
> # Ye lines add karo:
>
> # ─── Daily Backups (Roz raat 2 baje) ───
> 0 2 * * * /home/kisan/scripts/backup.sh >> /home/kisan/logs/backup.log 2>&1
>
> # ─── Log Cleanup (Har Monday subah 6 baje) ───
> 0 6 * * 1 find /home/kisan/logs -name "*.log" -mtime +30 -delete
>
> # ─── Health Check (Har 5 minute) ───
> */5 * * * * /home/kisan/scripts/health_check.sh
>
> # ─── Disk Usage Alert (Har ghante) ───
> 0 * * * * /home/kisan/scripts/disk_alert.sh
>
> # Save karke exit (Vim: :wq, Nano: Ctrl+O, Ctrl+X)
> ```

### health_check.sh — Server Health Monitor

```bash
#!/bin/bash
# Simple health check for Node.js server

URL="http://localhost:3000/health"
LOG_FILE="/home/kisan/logs/health.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# HTTP request bhejo
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 5)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "$TIMESTAMP | ✅ Server UP | Status: $HTTP_CODE" >> "$LOG_FILE"
else
  echo "$TIMESTAMP | 🔴 Server DOWN | Status: $HTTP_CODE" >> "$LOG_FILE"

  # Server restart attempt
  echo "$TIMESTAMP | Restarting server..." >> "$LOG_FILE"
  cd /home/kisan/myproject && node server.js &
fi
```

### disk_alert.sh — Disk Space Monitor

```bash
#!/bin/bash
# Disk usage check karo

THRESHOLD=80
USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

if [ $USAGE -gt $THRESHOLD ]; then
  echo "$TIMESTAMP | ⚠️ ALERT: Disk usage $USAGE% (threshold: $THRESHOLD%)"
  # Yahan notification bhej sakte ho — email, slack webhook, etc.
fi
```

> **Yaad Rakho:** Cron jobs mein hamesha full path use karo — `node` ki jagah `/usr/bin/node`, `npm` ki jagah `/usr/bin/npm`. Cron ka PATH alag hota hai!

---

## Quick Revision Table

| Script | Kya Karta Hai | Key Commands Used |
|--------|--------------|-------------------|
| backup.sh | Project backup + cleanup | `tar`, `find`, `du`, `wc` |
| log_analyzer.sh | Server log analysis | `grep`, `awk`, `sort`, `uniq` |
| file_manager.sh | Project cleanup | `find`, `du`, `stat`, `grep` |
| health_check.sh | Server monitoring | `curl`, `cron` |
| disk_alert.sh | Disk space alert | `df`, `awk`, `cron` |

---

## Aaj Kya Seekha?

1. **Backup script** — tar compress, exclude patterns, old backup cleanup
2. **Log analyzer** — grep/awk/sort se log analysis
3. **File management** — find/du se project cleanup
4. **Cron jobs** — scheduled automation setup
5. **Health check** — server monitoring via curl
6. **Script best practices** — error handling, logging, colors

> **Tip:** Kal Week 4 ka revision hai — Phase 1 ke saare topics revise karenge aur Phase 1 Project ka planning shuru karenge. Aaj tak jo seekha hai wo achhe se yaad karo!
