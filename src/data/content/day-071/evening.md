# Day 71 Evening: Practice — S3 File Upload + RDS Database Connect

> **Aaj ka plan:** Ab hum hands-on practice karenge — S3 bucket banayenge, files upload karenge AWS SDK se, RDS instance configure karenge, aur Express app ko RDS se connect karenge.

---

## Practice 1: S3 Bucket Banao Aur Configure Karo

### Step 1 — AWS CLI Se Bucket Create

```bash
# AWS CLI configure karo (agar nahi kiya to)
aws configure
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: xxxx...
# Default region: ap-south-1
# Default output format: json

# Bucket banao
aws s3 mb s3://kisan-app-uploads-yourname --region ap-south-1

# Buckets list dekho
aws s3 ls

# Bucket ki files dekho (abhi empty hai)
aws s3 ls s3://kisan-app-uploads-yourname/
```

### Step 2 — CLI Se File Upload/Download

```bash
# Ek test file banao
echo "Ye test file hai kisan app ke liye" > test-file.txt

# S3 pe upload karo
aws s3 cp test-file.txt s3://kisan-app-uploads-yourname/test/test-file.txt

# S3 se download karo
aws s3 cp s3://kisan-app-uploads-yourname/test/test-file.txt downloaded-file.txt

# Folder sync karo (local → S3)
mkdir -p uploads
echo "file1" > uploads/file1.txt
echo "file2" > uploads/file2.txt
aws s3 sync ./uploads/ s3://kisan-app-uploads-yourname/uploads/

# S3 bucket ki files dekho
aws s3 ls s3://kisan-app-uploads-yourname/ --recursive
```

> **Expected Output:**
```
2026-04-04 10:00:00  36 test/test-file.txt
2026-04-04 10:01:00   6 uploads/file1.txt
2026-04-04 10:01:00   6 uploads/file2.txt
```

---

## Practice 2: Express App Mein S3 Upload API

### Step 1 — Project Setup

```bash
mkdir -p ~/kisan-s3-app && cd ~/kisan-s3-app
npm init -y
npm install express multer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner dotenv
```

### Step 2 — Environment Variables

```bash
# .env file banao
cat > .env << 'EOF'
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=kisan-app-uploads-yourname
PORT=3000
EOF
```

### Step 3 — S3 Upload Service

```javascript
// services/s3Service.js
// S3 operations ka service layer

require('dotenv').config();
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET = process.env.S3_BUCKET_NAME;

// File upload karo S3 pe
async function uploadToS3(file, folder = 'general') {
    // Unique filename banao (timestamp + original name)
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
    });

    await s3Client.send(command);

    return {
        key: key,
        url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        size: file.size
    };
}

// Presigned URL generate karo (secure temporary access)
async function getFileUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
}

// Folder ki files list karo
async function listFiles(folder = '') {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: folder
    });
    const result = await s3Client.send(command);
    return (result.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
    }));
}

// File delete karo
async function deleteFromS3(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
    });
    await s3Client.send(command);
    return { deleted: true, key };
}

module.exports = { uploadToS3, getFileUrl, listFiles, deleteFromS3 };
```

### Step 4 — Express API Routes

```javascript
// server.js
// Express app with S3 file upload API

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { uploadToS3, getFileUrl, listFiles, deleteFromS3 } = require('./services/s3Service');

const app = express();
app.use(express.json());

// Multer setup — memory storage (S3 pe bhejne ke liye)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: (req, file, cb) => {
        // Sirf images allow karo
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Sirf JPEG, PNG, WebP files allowed hain'));
        }
    }
});

// File upload route
app.post('/api/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Koi file select nahi ki' });
        }

        // S3 pe upload karo
        const result = await uploadToS3(req.file, 'crops');
        res.json({
            success: true,
            message: 'File upload ho gayi!',
            data: result
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload fail hua' });
    }
});

// Presigned URL generate karo
app.get('/api/files/:key(*)', async (req, res) => {
    try {
        const url = await getFileUrl(req.params.key);
        res.json({ success: true, url, expiresIn: '1 hour' });
    } catch (err) {
        res.status(500).json({ error: 'URL generate nahi hua' });
    }
});

// Files list karo
app.get('/api/files', async (req, res) => {
    try {
        const folder = req.query.folder || '';
        const files = await listFiles(folder);
        res.json({ success: true, count: files.length, data: files });
    } catch (err) {
        res.status(500).json({ error: 'Files list nahi aayi' });
    }
});

// File delete karo
app.delete('/api/files/:key(*)', async (req, res) => {
    try {
        const result = await deleteFromS3(req.params.key);
        res.json({ success: true, message: 'File delete ho gayi', data: result });
    } catch (err) {
        res.status(500).json({ error: 'Delete fail hua' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server port ${PORT} pe chal raha hai`));
```

### Step 5 — Test Karo

```bash
# Server start karo
node server.js

# File upload test karo
curl -X POST http://localhost:3000/api/upload \
  -F "photo=@/path/to/test-image.jpg"

# Files list dekho
curl http://localhost:3000/api/files?folder=crops

# Presigned URL get karo
curl http://localhost:3000/api/files/crops/1234-test.jpg
```

> **Expected Output:**
```json
{
    "success": true,
    "message": "File upload ho gayi!",
    "data": {
        "key": "crops/1712200000-test-image.jpg",
        "url": "https://kisan-app-uploads.s3.ap-south-1.amazonaws.com/crops/...",
        "size": 45678
    }
}
```

---

## Practice 3: RDS Instance Setup Aur Connect

### Step 1 — RDS Instance Banao (Console Se)

```
AWS Console → RDS → Create Database
- Engine: PostgreSQL 16
- Template: Free tier
- DB identifier: kisan-db
- Master username: admin
- Master password: KisanDb2026Secure!
- Instance: db.t3.micro
- Storage: 20 GB
- Public access: Yes (testing ke liye)
- Security Group: kisan-db-sg (port 5432 open karo)
- Initial database: kisanapp
- Create Database
```

> **Warning:** RDS instance banane mein 5-10 minutes lagte hain. Status "Available" hone ka wait karo.

### Step 2 — Security Group Configure

```
EC2 Console → Security Groups → kisan-db-sg → Edit Inbound Rules:
- Type: PostgreSQL
- Port: 5432
- Source: Your IP (ya EC2 ka Security Group)
```

### Step 3 — Node.js Se Connect

```bash
# pg library install karo
cd ~/kisan-s3-app
npm install pg
```

```javascript
// db/database.js
// RDS PostgreSQL connection + operations

require('dotenv').config();
const { Pool } = require('pg');

// Connection pool
const pool = new Pool({
    host: process.env.RDS_HOST,     // kisan-db.xxxxx.ap-south-1.rds.amazonaws.com
    port: 5432,
    database: 'kisanapp',
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000
});

// Tables banao
async function initDatabase() {
    const query = `
        CREATE TABLE IF NOT EXISTS crops (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            season VARCHAR(50) NOT NULL,
            min_price DECIMAL(10,2),
            max_price DECIMAL(10,2),
            image_key VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS farmers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            phone VARCHAR(15) UNIQUE NOT NULL,
            village VARCHAR(200),
            state VARCHAR(100) DEFAULT 'UP',
            created_at TIMESTAMP DEFAULT NOW()
        );
    `;
    await pool.query(query);
    console.log('Database tables ready!');
}

// Crop add karo
async function addCrop(name, season, minPrice, maxPrice) {
    const query = `
        INSERT INTO crops (name, season, min_price, max_price)
        VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await pool.query(query, [name, season, minPrice, maxPrice]);
    return result.rows[0];
}

// Saari crops list karo
async function getCrops() {
    const result = await pool.query('SELECT * FROM crops ORDER BY created_at DESC');
    return result.rows;
}

// Connection test
async function testConnection() {
    const result = await pool.query('SELECT NOW() as time, version() as pg_version');
    console.log('RDS Connected:', result.rows[0]);
    return result.rows[0];
}

module.exports = { pool, initDatabase, addCrop, getCrops, testConnection };
```

### Step 4 — .env Update

```bash
# .env mein RDS details add karo
cat >> .env << 'EOF'
RDS_HOST=kisan-db.xxxxx.ap-south-1.rds.amazonaws.com
RDS_USER=admin
RDS_PASSWORD=KisanDb2026Secure!
EOF
```

### Step 5 — Test Connection

```javascript
// test-rds.js
// RDS connection test script

const { testConnection, initDatabase, addCrop, getCrops } = require('./db/database');

async function main() {
    // Connection test
    await testConnection();

    // Tables banao
    await initDatabase();

    // Sample data add karo
    await addCrop('Gehu', 'Rabi', 2000, 2500);
    await addCrop('Dhan', 'Kharif', 1800, 2200);

    // Data fetch karo
    const crops = await getCrops();
    console.log('Saari crops:', crops);

    process.exit(0);
}

main().catch(console.error);
```

```bash
node test-rds.js
```

> **Expected Output:**
```
RDS Connected: { time: 2026-04-04T10:00:00.000Z, pg_version: 'PostgreSQL 16.x ...' }
Database tables ready!
Saari crops: [
  { id: 1, name: 'Gehu', season: 'Rabi', min_price: 2000, ... },
  { id: 2, name: 'Dhan', season: 'Kharif', min_price: 1800, ... }
]
```

---

## Quick Revision Table

| Task | Command/Tool | Notes |
|------|-------------|-------|
| S3 bucket create | `aws s3 mb s3://name` | Globally unique name |
| File upload (CLI) | `aws s3 cp file s3://bucket/key` | Fast for scripts |
| File upload (SDK) | `PutObjectCommand` | App mein use karo |
| Presigned URL | `getSignedUrl()` | Temporary secure access |
| RDS create | AWS Console | Free tier: db.t3.micro |
| RDS connect | `pg` Pool | Connection pool use karo |
| RDS test | `SELECT NOW()` | Connection verify |
| File type filter | Multer `fileFilter` | Security ke liye zaroori |

---

## Aaj Kya Seekha?

1. **S3 bucket** AWS CLI se banaya aur files upload/download kiya
2. **AWS SDK** se Express app mein file upload API banai — multer + S3 integration
3. **Presigned URLs** se secure temporary file access diya — bucket public nahi karna padta
4. **RDS PostgreSQL** instance banaya AWS Console se — free tier mein
5. **pg Pool** se Node.js ko RDS se connect kiya — connection pooling important hai
6. **Tables create** kiye aur CRUD operations kiye RDS pe
7. **Environment variables** mein credentials rakhe — `.env` file mein, code mein KABHI nahi
8. S3 (file storage) + RDS (database) = complete backend data layer for production apps
