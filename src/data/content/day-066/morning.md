# Day 66 Morning: AWS EC2 — Deploy First App

> **Aaj ka plan:** Aaj cloud computing ki duniya mein entry! AWS kya hai samjhenge, EC2 (virtual server) pe app deploy karna seekhenge — instance launch se lekar public IP pe app access karne tak. Pehli baar tumhara app internet pe live hoga!

---

## Cloud Computing Basics

### Kyu Chahiye Cloud?

Pehle agar tumhe server chahiye hota tha to:
1. Physical server khareedna padta (Rs 50,000+)
2. Rack mein lagana padta
3. Internet connection dena padta
4. 24/7 electricity ensure karna padta
5. Cooling, security, maintenance — sab karna padta

> **Socho Aise:** Socho tum ek farmer ho. Pehle apna tractor khareedna padta tha (bahut mehenga). Ab Uber-for-tractors hai — jab chahiye tab use karo, per hour paisa do. Cloud computing bhi waisa hi hai — server khareedne ki zaroorat nahi, rent pe lo!

### Cloud Computing = On-Demand IT Resources

| Traditional Server | Cloud Server |
|-------------------|-------------|
| Buy hardware (lakhs) | Pay per hour (pennies) |
| Setup mein weeks | Ready in minutes |
| Fixed capacity | Scale up/down anytime |
| Maintenance tumhara | Provider ka kaam |
| One location | Available globally |

---

## AWS (Amazon Web Services) Overview

### Duniya Ka Sabse Bada Cloud Provider

AWS Amazon ka cloud platform hai — 200+ services provide karta hai. Major services:

| Service | Kya Karta Hai | Analogy |
|---------|--------------|---------|
| EC2 | Virtual servers (compute) | Rent pe computer |
| S3 | File storage (objects) | Online hard drive |
| RDS | Managed database | Database as a service |
| Lambda | Serverless functions | Code chalo bina server ke |
| CloudFront | CDN (fast content delivery) | Duniya bhar mein copies |
| Route 53 | DNS management | Domain name service |

> **Yaad Rakho:** Aaj hum sirf **EC2** focus karenge — ye sabse fundamental AWS service hai. EC2 = ek virtual computer jo cloud mein chalta hai.

---

## EC2 (Elastic Compute Cloud)

### Virtual Server in the Cloud

EC2 ek **virtual machine (VM)** hai jo AWS ke data center mein chalta hai. Tum isko apna server ki tarah use kar sakte ho — Node.js chalao, MongoDB chalao, kuch bhi!

### EC2 Key Concepts

#### 1. Instance Types — Kitna Powerful Server Chahiye?

| Type | vCPU | RAM | Use Case | Cost (approx) |
|------|------|-----|----------|---------------|
| t2.micro | 1 | 1 GB | Learning, small apps | FREE (12 months) |
| t2.small | 1 | 2 GB | Small production apps | ~$0.023/hour |
| t2.medium | 2 | 4 GB | Medium apps | ~$0.046/hour |
| t3.large | 2 | 8 GB | Production workloads | ~$0.083/hour |

> **Tip:** `t2.micro` 12 months tak FREE hai (Free Tier)! Learning ke liye perfect. Monthly ~750 hours free — matlab poora mahina free!

#### 2. AMI (Amazon Machine Image) — Kaunsa OS?

AMI ek pre-configured OS image hai. Jaise:
- **Amazon Linux 2023** — AWS ka recommended Linux (lightweight)
- **Ubuntu 22.04 LTS** — Popular, bahut sab log use karte hain
- **Windows Server** — Agar Windows chahiye

> **Yaad Rakho:** Hum **Ubuntu 22.04 LTS** use karenge — ye sabse widely used hai aur documentation bahut milti hai.

#### 3. Security Groups — Firewall Rules

Security Group ek **firewall** hai jo decide karta hai ki kaunsa traffic allowed hai.

```
Security Group Rules:

Inbound (bahar se andar):
┌──────────┬──────────┬───────────────┐
│ Protocol │ Port     │ Source        │
├──────────┼──────────┼───────────────┤
│ SSH      │ 22       │ My IP only   │  ← SSH access (sirf tum)
│ HTTP     │ 80       │ 0.0.0.0/0   │  ← Web traffic (sabke liye)
│ HTTPS    │ 443      │ 0.0.0.0/0   │  ← Secure traffic
│ Custom   │ 3000     │ 0.0.0.0/0   │  ← Express app port
└──────────┴──────────┴───────────────┘

Outbound (andar se bahar):
All traffic allowed (default)
```

> **Warning:** SSH port (22) ko `0.0.0.0/0` (sab ke liye open) KABHI mat karo! Sirf "My IP" select karo. Warna hackers try karenge tumhare server pe login karne ki!

#### 4. Key Pairs — SSH Login Ka Taala-Chaabi

```
Key Pair = Private Key + Public Key

Public Key  → EC2 instance pe stored hai (taala)
Private Key → Tumhare laptop pe hai (chaabi) 
             (.pem file download hoti hai)

SSH login:
ssh -i "my-key.pem" ubuntu@ec2-public-ip
        ↑ chaabi          ↑ server address
```

> **Yaad Rakho:** `.pem` file bahut important hai — isko safe rakhna! Agar kho gayi to server mein login nahi ho paayega. Kabhi share mat karo aur git mein commit mat karo!

---

## Step-by-Step: EC2 Instance Launch

### Step 1: AWS Console Login

1. Jao [aws.amazon.com](https://aws.amazon.com)
2. "Create an AWS Account" — free tier mein sign up karo
3. Console login karo

### Step 2: EC2 Dashboard

1. Search bar mein "EC2" type karo
2. "Launch Instance" click karo

### Step 3: Configuration

```
Name:           kisanbazaar-server
AMI:            Ubuntu 22.04 LTS (Free tier eligible)
Instance Type:  t2.micro (Free tier eligible)
Key Pair:       Create new → "kisanbazaar-key" → Download .pem file

Network Settings:
  ☑ Allow SSH traffic from → My IP
  ☑ Allow HTTP traffic from internet
  ☑ Allow HTTPS traffic from internet

Storage:        8 GB (free tier allows up to 30 GB)
```

### Step 4: Security Group Add Custom Port

```
Edit Security Group → Add Rule:
Type:       Custom TCP
Port Range: 3000
Source:     0.0.0.0/0 (Anywhere IPv4)

Ye rule add karo taaki Express app (port 3000) access ho sake
```

### Step 5: Launch!

"Launch Instance" click karo. 1-2 minute mein instance ready ho jaayega.

> **Expected Output:**
> ```
> Instance State: Running
> Public IPv4:    52.xx.xx.xx (tumhara unique IP)
> ```

---

## SSH Into EC2

### Key File Permission Fix (Important!)

```bash
# Windows (Git Bash / WSL):
chmod 400 kisanbazaar-key.pem

# Ye zaroori hai — bina iske SSH error dega
# "Permissions 0644 are too open" error aayega
```

### SSH Connect

```bash
# EC2 mein login karo
ssh -i "kisanbazaar-key.pem" ubuntu@52.xx.xx.xx
#                                    ↑ apna public IP daalo

# Pehli baar "fingerprint" confirm karna hoga
# Type: yes
```

> **Terminal Command:**
> ```
> ssh -i "kisanbazaar-key.pem" ubuntu@YOUR_PUBLIC_IP
> ```

> **Expected Output:**
> ```
> Welcome to Ubuntu 22.04 LTS
> ubuntu@ip-172-xx-xx-xx:~$
> ```

Badhai ho! Tum ab ek cloud server ke andar ho!

---

## EC2 Pe Node.js Install Karo

```bash
# System update karo (hamesha pehle karo)
sudo apt update && sudo apt upgrade -y

# Node.js install karo (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify karo
node --version
# v18.x.x

npm --version
# 9.x.x ya 10.x.x

# PM2 install karo (process manager — app ko background mein chalata hai)
sudo npm install -g pm2

# Git install karo (code clone ke liye)
sudo apt install -y git
```

> **Tip:** **PM2** bahut important hai! Ye Node.js app ko background mein chalata hai, crash hone pe auto-restart karta hai, aur logs manage karta hai. Production mein hamesha PM2 use karo!

---

## Express App Deploy Karo

```bash
# Simple app banao (ya git clone karo)
mkdir kisanbazaar-api && cd kisanbazaar-api
npm init -y
npm install express

# App code likho
cat > app.js << 'EOF'
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({
    message: 'Namaste! KisanBazaar API live hai AWS pe!',
    server: 'EC2 Ubuntu',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# PM2 se start karo (background mein chalega)
pm2 start app.js --name kisanbazaar

# Status check karo
pm2 status
# Output:
# ┌──────────────┬────┬─────────┬──────┬───────┐
# │ Name         │ id │ status  │ cpu  │ memory│
# ├──────────────┼────┼─────────┼──────┼───────┤
# │ kisanbazaar  │ 0  │ online  │ 0%   │ 35MB  │
# └──────────────┴────┴─────────┴──────┴───────┘

# Logs dekho
pm2 logs kisanbazaar
```

---

## Browser Se Access Karo!

```
Browser mein jao:
http://52.xx.xx.xx:3000

(52.xx.xx.xx ki jagah apna EC2 public IP daalo)
```

> **Expected Output:**
> ```json
> {
>   "message": "Namaste! KisanBazaar API live hai AWS pe!",
>   "server": "EC2 Ubuntu",
>   "timestamp": "2026-04-04T15:30:00.000Z"
> }
> ```

Tumhara app **internet pe live hai!** Duniya mein koi bhi ye URL open karke tumhara API access kar sakta hai!

> **Socho Aise:** Ye moment bahut special hai — tumhara pehla app cloud pe deploy hua. Ek farmer bhi apne phone se ye URL open karke data dekh sakta hai!

---

## PM2 Essential Commands

```bash
# App start karo
pm2 start app.js --name myapp

# App stop karo
pm2 stop myapp

# App restart karo
pm2 restart myapp

# Logs dekho
pm2 logs myapp

# Status dekho
pm2 status

# App delete karo PM2 se
pm2 delete myapp

# Server restart pe auto-start setup
pm2 startup
pm2 save
```

> **Yaad Rakho:** `pm2 startup` + `pm2 save` bahut important hai — isse agar EC2 restart ho to PM2 automatically tumhare apps dobaara start kar dega!

---

## Quick Revision Table

| Concept | Explanation |
|---------|------------|
| Cloud Computing | Server rent pe lo — buy karne ki zaroorat nahi |
| AWS EC2 | Virtual server in the cloud |
| t2.micro | Free tier instance — 1 vCPU, 1GB RAM |
| AMI | Server ka OS image (Ubuntu, Amazon Linux) |
| Security Group | Firewall rules — kaunsa traffic allowed |
| Key Pair | SSH login ke liye .pem file (private key) |
| SSH | `ssh -i key.pem ubuntu@IP` — remote login |
| PM2 | Node.js process manager — background run + auto-restart |
| Public IP | Internet se access karne ka address |

---

## Aaj Kya Seekha?

1. **Cloud computing** = on-demand IT resources — rent pe server
2. **AWS EC2** virtual server hai — minutes mein ready
3. **t2.micro** 12 months free hai — learning ke liye perfect
4. **Security Groups** firewall hai — SSH port ko restrict karo!
5. **Key Pair** (.pem file) se SSH login hota hai — safe rakhna!
6. **PM2** production mein Node.js apps manage karta hai
7. Tumhara pehla app **internet pe live** hai — congratulations!
