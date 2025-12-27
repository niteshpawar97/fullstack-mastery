# Day 27 Morning: Linux Deep Dive + Shell Scripting

> **Aaj ka plan:** Aaj hum Linux ka deep dive karenge — file permissions (chmod, chown), processes manage karna, piping, grep, awk, sed, aur shell scripting (variables, loops, conditions). Cron jobs bhi sikhenge. Ye sab backend development mein daily kaam aata hai!

---

## File Permissions: chmod & chown

### Linux Mein Permission System

Har file/folder ke 3 level ke permissions hote hain:

| Level | Kaun? | Symbol |
|-------|-------|--------|
| **Owner** | File ka maalik | `u` (user) |
| **Group** | Owner ke group ke log | `g` (group) |
| **Others** | Baaki sab | `o` (others) |

Har level ke 3 types ke permissions:

| Permission | Symbol | Number | Matlab |
|-----------|--------|--------|--------|
| Read | `r` | 4 | Padh sakta hai |
| Write | `w` | 2 | Likh/edit sakta hai |
| Execute | `x` | 1 | Chala sakta hai (script/program) |

> **Socho Aise:** Socho ek kisan ka khet hai. Owner (kisan) — sab kar sakta hai (rwx = 7). Group (family) — dekh aur kaam kar sakte hain (rx = 5). Others (bahar wale) — sirf dekh sakte hain (r = 4). Permission = 754

### chmod — Permissions Badalna

> **Terminal Command:**
> ```bash
> # Permissions dekhna
> ls -la
> # Output: -rwxr-xr-- 1 kisan family 1024 Apr 03 server.js
> #         |---|---|---|
> #          u    g   o
> #         rwx  r-x  r--  = 754
>
> # Numeric method — sabse common
> chmod 755 server.js    # Owner: rwx, Group: r-x, Others: r-x
> chmod 644 config.json  # Owner: rw-, Group: r--, Others: r--
> chmod 700 secret.sh    # Owner: rwx, Group: ---, Others: ---
>
> # Symbolic method
> chmod u+x script.sh     # Owner ko execute permission do
> chmod g-w config.json    # Group se write permission hatao
> chmod o+r readme.txt     # Others ko read permission do
> chmod a+x deploy.sh      # All (sab) ko execute permission do
>
> # Recursive — folder ke andar sab pe apply
> chmod -R 755 myproject/  # Poore folder pe
> ```

### chown — Owner Badalna

> **Terminal Command:**
> ```bash
> # File ka owner badalna
> sudo chown kisan server.js          # Owner badla
> sudo chown kisan:developers server.js # Owner aur group dono badle
> sudo chown :developers server.js     # Sirf group badla
>
> # Recursive
> sudo chown -R kisan:team myproject/  # Poore folder ka owner badlo
> ```

> **Yaad Rakho:** Web server files ke liye common permissions: Files = `644`, Directories = `755`, Scripts = `755`, Private keys = `600`. Kabhi bhi `777` mat do — security risk hai!

---

## Processes: ps, top, kill

### Running Processes Dekhna

> **Terminal Command:**
> ```bash
> # Apne processes dekhna
> ps aux
>
> # Specific process dhundhna
> ps aux | grep node
> # Output: kisan 12345  0.5  1.2  node server.js
>
> # Real-time monitoring — Task Manager jaisa
> top
> # Ya better version
> htop
>
> # Sirf Node processes
> ps -ef | grep node
>
> # Process tree — parent-child relationship
> pstree
> ```

### Process Control

> **Terminal Command:**
> ```bash
> # Background mein chalana
> node server.js &          # & lagane se background mein chalta hai
> # [1] 12345              # Process ID milta hai
>
> # Background processes dekhna
> jobs
>
> # Foreground mein laana
> fg %1
>
> # Process kill karna
> kill 12345               # Graceful shutdown (SIGTERM)
> kill -9 12345            # Force kill (SIGKILL) — jab graceful kaam na kare
>
> # Naam se kill karna
> killall node             # Saare node processes band
> pkill -f "server.js"     # Pattern match karke kill
>
> # Port pe kya chal raha hai?
> lsof -i :3000            # Port 3000 pe kaun hai?
> netstat -tlnp | grep 3000
> ```

> **Warning:** `kill -9` sirf tab use karo jab normal `kill` kaam na kare. Force kill se process cleanup nahi kar paata (temp files, connections close nahi hote).

---

## Piping (|) aur Redirection

### Pipe — Ek Command Ka Output Dusre Ko Do

> **Socho Aise:** Pipe (`|`) ek nali jaisa hai — pehle command ka paani (output) dusre command ke khet (input) mein jaata hai.

> **Terminal Command:**
> ```bash
> # Pipe examples
> ls -la | head -10          # Pehle 10 lines dikhao
> cat server.log | wc -l     # Kitni lines hain count karo
> ps aux | grep node | wc -l # Kitne node processes hain?
>
> # Multiple pipes — chain bana sakte ho
> cat access.log | grep "POST" | sort | uniq -c | sort -rn | head -5
> # Ye kya karta hai:
> # 1. File padho
> # 2. Sirf POST requests filter karo
> # 3. Sort karo
> # 4. Duplicate count karo
> # 5. Reverse sort (zyada pehle)
> # 6. Top 5 dikhao
> ```

### Redirection — Output ko File Mein Bhejo

> **Terminal Command:**
> ```bash
> # Output file mein likho (overwrite)
> echo "Server started" > server.log
>
> # Output file mein add karo (append)
> echo "New request" >> server.log
>
> # Error ko alag file mein bhejo
> node server.js 2> error.log
>
> # Dono (output + error) ek file mein
> node server.js > all.log 2>&1
>
> # Output kahi mat dikhao (discard)
> node script.js > /dev/null 2>&1
> ```

---

## grep — Text Search Ka Raaja

> **Terminal Command:**
> ```bash
> # Basic search
> grep "error" server.log           # "error" dhundho log mein
> grep -i "error" server.log        # Case insensitive search
> grep -n "error" server.log        # Line number ke saath
> grep -c "error" server.log        # Kitni baar mila? Count do
>
> # Recursive — poore folder mein dhundho
> grep -r "TODO" ./src/             # src folder mein saare TODOs
> grep -rn "console.log" ./src/     # Line numbers ke saath
>
> # Regex patterns
> grep -E "error|warn" server.log   # "error" YA "warn"
> grep -E "^2024" server.log        # Lines jo "2024" se shuru hoti hain
> grep -v "DEBUG" server.log        # Lines jo "DEBUG" NAHI contain karti
>
> # Context dikhao
> grep -A 3 "error" server.log      # Error ke baad 3 lines
> grep -B 2 "error" server.log      # Error ke pehle 2 lines
> grep -C 2 "error" server.log      # Pehle aur baad 2 lines
> ```

> **Tip:** `grep -rn "pattern" .` — ye command har developer ko yaad hona chahiye. Poore project mein kuch bhi dhundh sakta hai!

---

## awk — Text Processing Powerhouse

> **Terminal Command:**
> ```bash
> # awk columns extract karta hai (default separator: space)
>
> # Specific column print karo
> ps aux | awk '{print $1, $11}'     # User aur command name
> ls -la | awk '{print $5, $9}'      # File size aur naam
>
> # CSV file process karo
> # data.csv: naam,umar,shehar
> awk -F ',' '{print $1, $3}' data.csv  # Naam aur shehar
>
> # Condition ke saath
> awk -F ',' '$2 > 30 {print $1}' data.csv  # 30 se zyada umar wale
>
> # Sum calculate karo
> ls -la | awk '{total += $5} END {print "Total:", total, "bytes"}'
>
> # Pattern match
> awk '/error/ {print NR, $0}' server.log  # "error" wali lines with number
> ```

---

## sed — Stream Editor

> **Terminal Command:**
> ```bash
> # Find and replace
> sed 's/old/new/' file.txt           # Pehla occurrence replace
> sed 's/old/new/g' file.txt          # SAB occurrences replace
> sed -i 's/old/new/g' file.txt       # File mein directly change karo (-i = in place)
>
> # Specific line delete
> sed '5d' file.txt                   # 5th line delete
> sed '/pattern/d' file.txt           # Pattern match hone wali lines delete
>
> # Line insert karo
> sed '3i\New line here' file.txt     # 3rd line ke pehle insert
> sed '3a\New line after' file.txt    # 3rd line ke baad insert
>
> # Real use case — config change
> sed -i 's/PORT=3000/PORT=8080/g' .env
> sed -i 's/DEBUG=true/DEBUG=false/g' config.txt
> ```

> **Warning:** `sed -i` directly file change karta hai — pehle backup bana lo! `sed -i.bak` use karo toh `.bak` backup ban jaayega.

---

## Shell Scripting Basics

### Variables

```bash
#!/bin/bash
# Variables — koi space mat dena = ke aas paas!
NAME="Ravi"
AGE=25
PROJECT_DIR="/home/kisan/myapp"

# Variable use karna — $ lagao
echo "Hello, $NAME! Aap $AGE saal ke ho."
echo "Project path: ${PROJECT_DIR}/src"

# Command ka output variable mein
CURRENT_DATE=$(date)
FILE_COUNT=$(ls | wc -l)
echo "Aaj ki date: $CURRENT_DATE"
echo "Files: $FILE_COUNT"

# Read user input
read -p "Apna naam batao: " USER_NAME
echo "Welcome, $USER_NAME!"
```

### Conditions (if/else)

```bash
#!/bin/bash
# File check
FILE="/home/kisan/server.js"

if [ -f "$FILE" ]; then
  echo "File exists!"
elif [ -d "$FILE" ]; then
  echo "Ye toh directory hai!"
else
  echo "File nahi mili!"
fi

# Number comparison
DISK_USAGE=85

if [ $DISK_USAGE -gt 90 ]; then
  echo "🔴 CRITICAL: Disk almost full!"
elif [ $DISK_USAGE -gt 70 ]; then
  echo "🟡 WARNING: Disk usage high: ${DISK_USAGE}%"
else
  echo "🟢 OK: Disk usage normal: ${DISK_USAGE}%"
fi

# String comparison
SERVER_STATUS="running"
if [ "$SERVER_STATUS" == "running" ]; then
  echo "Server chal raha hai"
fi
```

### Loops

```bash
#!/bin/bash
# For loop
for i in 1 2 3 4 5; do
  echo "Count: $i"
done

# Range loop
for i in $(seq 1 10); do
  echo "Number: $i"
done

# Files pe loop
for file in *.js; do
  echo "JS file found: $file"
done

# While loop
COUNT=0
while [ $COUNT -lt 5 ]; do
  echo "Iteration: $COUNT"
  COUNT=$((COUNT + 1))
done

# File line by line padhna
while IFS= read -r line; do
  echo "Line: $line"
done < input.txt
```

---

## Cron Jobs: Scheduled Tasks

### Cron Syntax

```
┌───── Minute (0-59)
│ ┌───── Hour (0-23)
│ │ ┌───── Day of Month (1-31)
│ │ │ ┌───── Month (1-12)
│ │ │ │ ┌───── Day of Week (0-7, 0=7=Sunday)
│ │ │ │ │
* * * * *  command
```

> **Terminal Command:**
> ```bash
> # Cron jobs dekhna
> crontab -l
>
> # Cron jobs edit karna
> crontab -e
>
> # Examples:
> # Har minute
> * * * * * echo "Hello" >> /tmp/cron.log
>
> # Har ghante
> 0 * * * * /home/kisan/backup.sh
>
> # Roz subah 6 baje
> 0 6 * * * /home/kisan/daily-report.sh
>
> # Har Monday subah 9 baje
> 0 9 * * 1 /home/kisan/weekly-backup.sh
>
> # Har mahine ki 1 tarik ko
> 0 0 1 * * /home/kisan/monthly-cleanup.sh
>
> # Har 5 minute mein
> */5 * * * * /home/kisan/health-check.sh
> ```

> **Yaad Rakho:** Cron job mein full paths use karo — cron ke paas aapka PATH environment nahi hota!

---

## Quick Revision Table

| Command | Kya Karta Hai | Example |
|---------|--------------|---------|
| `chmod` | Permissions change | `chmod 755 script.sh` |
| `chown` | Owner change | `chown user:group file` |
| `ps aux` | Processes dikhao | `ps aux \| grep node` |
| `kill` | Process band karo | `kill -9 12345` |
| `\|` (pipe) | Output ko chain karo | `cat log \| grep error` |
| `grep` | Text search | `grep -rn "TODO" ./src/` |
| `awk` | Column extract | `awk '{print $1}' file` |
| `sed` | Find & replace | `sed -i 's/old/new/g' file` |
| `crontab` | Schedule tasks | `crontab -e` |

---

## Aaj Kya Seekha?

1. **File permissions** — chmod (change permissions), chown (change owner)
2. **Process management** — ps, top, kill, background jobs
3. **Piping & Redirection** — commands ko chain karna, output file mein bhejna
4. **grep** — powerful text search (regex support)
5. **awk** — column-based text processing
6. **sed** — stream editing, find & replace
7. **Shell scripting** — variables, conditions, loops
8. **Cron jobs** — scheduled task automation

> **Practice Time!** Evening mein hum real shell scripts likhenge — backup script, log analyzer, aur cron job setup karenge!
