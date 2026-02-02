# Day 66 Evening: Practice — Launch EC2, Deploy Express + MongoDB

> **Aaj ka plan:** Ab full deployment karenge! EC2 instance launch karenge, SSH se connect karenge, Node.js + MongoDB install karenge, Express app deploy karenge, aur public IP se access karenge. Real production deployment!

---

## Step 1: EC2 Instance Launch (Recap + Do It!)

### AWS Console Pe Jaao

```
1. aws.amazon.com → Console login
2. Search: EC2 → Launch Instance

Settings:
  Name:          kisanbazaar-production
  AMI:           Ubuntu 22.04 LTS
  Instance Type: t2.micro (Free Tier)
  Key Pair:      kisanbazaar-key (download .pem)
  
  Security Group:
  ┌──────────┬──────┬───────────────┐
  │ Type     │ Port │ Source        │
  ├──────────┼──────┼───────────────┤
  │ SSH      │ 22   │ My IP        │
  │ HTTP     │ 80   │ Anywhere     │
  │ Custom   │ 3000 │ Anywhere     │
  │ Custom   │ 27017│ My IP        │ ← MongoDB (optional)
  └──────────┴──────┴───────────────┘
  
  Storage: 15 GB
  
3. Launch Instance!
4. Note karo: Public IPv4 Address
```

> **Warning:** MongoDB port (27017) ko "Anywhere" pe KABHI mat karo! Sirf "My IP" ya bilkul band rakhna. Warna koi bhi tumhare database mein ghus sakta hai!

---

## Step 2: SSH Connect

```bash
# Key file permission fix
chmod 400 kisanbazaar-key.pem

# SSH connect (apna IP daalo)
ssh -i "kisanbazaar-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

> **Terminal Command:**
> ```
> ssh -i "kisanbazaar-key.pem" ubuntu@52.xx.xx.xx
> ```

```bash
# Pehle system update karo (IMPORTANT!)
sudo apt update && sudo apt upgrade -y
```

---

## Step 3: Node.js Install Karo

```bash
# Node.js 18 LTS install karo
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version    # v18.x.x
npm --version     # 9.x.x+

# PM2 install karo (process manager)
sudo npm install -g pm2

# Git install karo
sudo apt install -y git
```

> **Expected Output:**
> ```
> ubuntu@ip-172-31-xx-xx:~$ node --version
> v18.19.0
> ubuntu@ip-172-31-xx-xx:~$ npm --version
> 10.2.3
> ```

---

## Step 4: MongoDB Install Karo

```bash
# MongoDB 7 install karo Ubuntu pe

# GPG key add karo
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Repository add karo
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install karo
sudo apt update
sudo apt install -y mongodb-org

# MongoDB start karo
sudo systemctl start mongod

# Boot pe auto-start enable karo
sudo systemctl enable mongod

# Status check karo
sudo systemctl status mongod
# Active: active (running) dikhna chahiye

# MongoDB shell test karo
mongosh
> db.version()    # 7.0.x
> exit
```

> **Expected Output:**
> ```
> ● mongod.service - MongoDB Database Server
>    Active: active (running) since ...
> ```

> **Yaad Rakho:** `sudo systemctl enable mongod` se MongoDB server restart hone pe automatically start hoga. Ye production mein zaroori hai!

---

## Step 5: Express App Deploy Karo

### Option A: Git Clone (Recommended)

```bash
# Agar code GitHub pe hai:
cd ~
git clone https://github.com/yourusername/kisanbazaar-api.git
cd kisanbazaar-api
npm install
```

### Option B: Direct Create

```bash
# Server pe directly app banao
cd ~
mkdir kisanbazaar-api && cd kisanbazaar-api
npm init -y
npm install express mongoose dotenv
```

### App Code

```javascript
// app.js — Production-ready Express app
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// MongoDB connect
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kisanbazaar';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('MongoDB error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  farmer: String
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Routes
app.get('/', (req, res) => {
  res.json({
    app: 'KisanBazaar API',
    status: 'live on AWS EC2!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort('-createdAt');
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product
app.post('/api/products', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product nahi mila!' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'OK',
    uptime: Math.round(process.uptime()) + ' seconds',
    database: dbStatus,
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`KisanBazaar API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});
```

---

## Step 6: PM2 Se Start Karo

```bash
# PM2 se app start karo
cd ~/kisanbazaar-api
pm2 start app.js --name kisanbazaar -i 1

# Status check karo
pm2 status

# Logs dekho — MongoDB connected dikhe
pm2 logs kisanbazaar

# Auto-restart on reboot setup
pm2 startup
# Jo command dikhe wo copy-paste karke run karo (sudo wala)

pm2 save
# Current processes save ho gaye
```

> **Expected Output:**
> ```
> ┌────────────┬────┬──────┬───────┬────────┬───────┐
> │ Name       │ id │ mode │ status│ cpu    │ memory│
> ├────────────┼────┼──────┼───────┼────────┼───────┤
> │ kisanbazaar│ 0  │ fork │ online│ 0%     │ 45 MB │
> └────────────┴────┴──────┴───────┴────────┴───────┘
> ```

---

## Step 7: Test Karo — Public IP Se!

```bash
# Apne laptop ke browser mein (EC2 ke andar nahi!):

# Health check
curl http://YOUR_EC2_IP:3000/
# { "app": "KisanBazaar API", "status": "live on AWS EC2!" }

# Health details
curl http://YOUR_EC2_IP:3000/api/health
# { "status": "OK", "database": "connected", ... }

# Product add karo
curl -X POST http://YOUR_EC2_IP:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Organic Wheat","category":"Grains","price":2500,"stock":100,"farmer":"Ramesh"}'

curl -X POST http://YOUR_EC2_IP:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Basmati Rice","category":"Grains","price":3500,"stock":200,"farmer":"Suresh"}'

# Products dekho
curl http://YOUR_EC2_IP:3000/api/products
# Sab products list ho jaayenge!
```

> **Expected Output:**
> ```json
> {
>   "success": true,
>   "count": 2,
>   "data": [
>     { "name": "Basmati Rice", "price": 3500, "farmer": "Suresh" },
>     { "name": "Organic Wheat", "price": 2500, "farmer": "Ramesh" }
>   ]
> }
> ```

> **Socho Aise:** Ab tumhara dost bhi apne phone se `http://YOUR_EC2_IP:3000/api/products` open karke ye data dekh sakta hai! Ye hai real deployment!

---

## Step 8: Useful PM2 + Server Commands

```bash
# PM2 monitoring dashboard
pm2 monit

# App restart karo (code update ke baad)
pm2 restart kisanbazaar

# Logs clear karo
pm2 flush

# Disk space check karo
df -h

# Memory usage check karo
free -m

# Running processes dekho
htop   # ya top

# MongoDB status check
sudo systemctl status mongod

# Server reboot karo (agar zaroorat ho)
sudo reboot
```

> **Practice Time!** Ye tasks complete karo:
> 1. EC2 pe app deploy karo (upar ke steps follow karo)
> 2. Browser se access karo — public IP + port 3000
> 3. 5 products add karo curl se
> 4. Products list fetch karo
> 5. Health check endpoint test karo
> 6. PM2 logs dekho — sab requests log ho rahi hain

---

## Common Issues + Solutions

| Problem | Solution |
|---------|----------|
| SSH permission denied | `chmod 400 key.pem` karo |
| Site not accessible | Security Group mein port 3000 add karo |
| MongoDB not starting | `sudo systemctl restart mongod` karo |
| App crash on restart | `pm2 startup` + `pm2 save` karo |
| Disk full | `df -h` check karo, purane logs delete karo |

---

## Quick Revision Table

| Step | Kya Kiya |
|------|----------|
| EC2 Launch | Ubuntu t2.micro instance banaya |
| Security Group | SSH (My IP), HTTP, Port 3000 allow kiya |
| SSH Connect | `.pem` key se remote login kiya |
| Node.js Install | v18 LTS install kiya server pe |
| MongoDB Install | MongoDB 7 install + start + enable kiya |
| App Deploy | Express app code server pe daala |
| PM2 Start | Background mein app chalaya + auto-restart setup |
| Test | Public IP:3000 se browser mein access kiya |

---

## Aaj Kya Seekha?

1. **EC2 instance** launch karna aa gaya — Ubuntu, t2.micro, security groups
2. **SSH** se remote server mein login karna seekha
3. Server pe **Node.js + MongoDB** install kiya
4. **Express app** deploy kiya aur **PM2** se manage kiya
5. **Public IP** se internet pe app access kiya — live deployment!
6. **PM2 startup + save** se server restart pe auto-start hota hai
7. Kal **revision day** hai — sab kuch revise karenge aur Docker project karenge!
