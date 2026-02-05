# Day 71 Morning: AWS S3 + RDS — Cloud Storage & Managed Database

> **Aaj ka plan:** Aaj hum AWS ke do important services seekhenge — S3 (cloud storage jo files store karta hai) aur RDS (managed database jo tumhari database ko automatically manage karta hai). Dono production applications ke liye essential hain.

---

## AWS S3 — Simple Storage Service

### S3 Kya Hai?

S3 (Simple Storage Service) AWS ka object storage service hai — files (images, videos, documents, backups) cloud mein store karo. Unlimited storage, 99.999999999% durability (11 nines!).

> **Socho Aise:** Socho tumhare paas ek anant (infinite) size ka godown hai. Kuch bhi rakho — photos, documents, videos, backups. Kabhi kho nahi sakta (11 nines durability matlab 10 million files mein se 1 kho sakti hai 10,000 saal mein). Ye hai S3!

### S3 Ke Core Concepts

| Concept | Kya Hai | Example |
|---------|---------|---------|
| **Bucket** | Top-level container (folder jaisa) | `my-kisan-app-images` |
| **Object** | File + metadata | `profile-pic.jpg` (5MB) |
| **Key** | Object ka unique path | `users/123/profile-pic.jpg` |
| **Region** | Bucket kahan stored hai | `ap-south-1` (Mumbai) |
| **ACL** | Access control | Public, Private |
| **Versioning** | File ke purane versions rakho | Delete se bhi recover ho sakta hai |

### Bucket Naming Rules

```
- Globally unique hona chahiye (poori duniya mein)
- 3-63 characters
- Lowercase letters, numbers, hyphens
- Period (.) allowed but SSL ke saath issues
- IP address format nahi (192.168.1.1 nahi)

Good: kisan-app-images-2026
Bad:  KisanApp_Images (uppercase + underscore)
Bad:  my bucket (spaces not allowed)
```

---

## S3 Bucket Banana — AWS Console

### Step-by-Step

```
1. AWS Console → S3 → Create Bucket
2. Bucket name: kisan-app-uploads-yourname
3. Region: ap-south-1 (Mumbai — Indian users ke liye fast)
4. Block Public Access: ON (default — safe hai)
5. Versioning: Enable (recommended for important files)
6. Encryption: SSE-S3 (default encryption)
7. Create Bucket
```

---

## S3 File Upload — AWS SDK (Node.js)

### Setup

```bash
# AWS SDK install karo
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Upload File To S3

```javascript
// s3-operations.js
// S3 se files upload, download, delete karna

const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

// S3 Client banao
const s3Client = new S3Client({
    region: 'ap-south-1',          // Mumbai region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = 'kisan-app-uploads';

// File upload karo
async function uploadFile(filePath, s3Key) {
    const fileContent = fs.readFileSync(filePath);
    const contentType = getContentType(filePath);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,                 // S3 mein file ka path
        Body: fileContent,
        ContentType: contentType
    });

    const result = await s3Client.send(command);
    console.log(`File upload hua: ${s3Key}`);
    return result;
}

// Content type detect karo
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.json': 'application/json'
    };
    return types[ext] || 'application/octet-stream';
}

// Signed URL generate karo (temporary access)
async function getPresignedUrl(s3Key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
    });

    // 1 ghante ke liye valid URL (public access bina diye)
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    console.log(`Presigned URL (${expiresIn}s valid): ${url}`);
    return url;
}

// Bucket ki saari files list karo
async function listFiles(prefix = '') {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix              // Folder filter (e.g., 'users/123/')
    });

    const result = await s3Client.send(command);
    const files = result.Contents || [];
    files.forEach(file => {
        console.log(`${file.Key} — ${file.Size} bytes — ${file.LastModified}`);
    });
    return files;
}

// File delete karo
async function deleteFile(s3Key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
    });

    await s3Client.send(command);
    console.log(`File delete hua: ${s3Key}`);
}

module.exports = { uploadFile, getPresignedUrl, listFiles, deleteFile };
```

> **Yaad Rakho:** Presigned URL ka use karo jab temporary access dena ho. Bucket public mat karo — presigned URL time-limited aur secure hota hai!

---

## S3 Static Website Hosting

```
1. S3 Bucket → Properties → Static website hosting → Enable
2. Index document: index.html
3. Error document: error.html
4. Bucket Policy (public read):
```

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

> **Tip:** React/Vue/Angular ka build output (`npm run build`) S3 pe host kar sakte ho — serverless static hosting! CloudFront CDN laga do to worldwide fast delivery.

---

## CloudFront CDN — Quick Intro

```
Without CDN:
User (India) → S3 (Mumbai) ← Fast
User (USA)   → S3 (Mumbai) ← Slow (distance zyada)

With CloudFront CDN:
User (India) → Edge Location (Mumbai) → S3 ← Fast
User (USA)   → Edge Location (Virginia) → S3 ← Fast (cached copy)
```

CloudFront S3 ke content ko 400+ edge locations pe cache karta hai — duniya mein kahin se bhi fast access.

---

## AWS RDS — Managed Database

### RDS Kya Hai?

RDS (Relational Database Service) AWS ka managed database service hai. Tum sirf data pe focus karo — AWS backup, patching, scaling, replication sab handle karta hai.

> **Socho Aise:** Khud database manage karna = apna generator chalana (fuel, maintenance, repair sab tumhara kaam). RDS use karna = bijli board ka connection (sab kuch provider manage karta hai, tum sirf use karo).

### RDS Supported Databases

| Database | Use Case | Pricing |
|----------|----------|---------|
| MySQL | General purpose, WordPress | Free tier available |
| PostgreSQL | Complex queries, GIS data | Free tier available |
| MariaDB | MySQL compatible, open source | Free tier available |
| SQL Server | Enterprise apps, .NET | Expensive |
| Oracle | Legacy enterprise apps | Very expensive |
| Aurora | AWS optimized MySQL/PostgreSQL | 5x faster, slightly costly |

---

## RDS Instance Banana

### AWS Console Se

```
1. AWS Console → RDS → Create Database
2. Creation method: Standard Create
3. Engine: PostgreSQL (ya MySQL)
4. Template: Free tier (learning ke liye)
5. Settings:
   - DB instance identifier: kisan-db
   - Master username: admin
   - Master password: StrongPassword123!
6. Instance class: db.t3.micro (free tier)
7. Storage: 20 GB (free tier max)
8. Connectivity:
   - VPC: Default
   - Public access: Yes (development ke liye)
   - Security Group: New (port 5432 ya 3306 open karo)
9. Database name: kisanapp
10. Create Database (5-10 min lagega)
```

> **Warning:** Production mein "Public access: No" rakho! Database ko sirf private subnet se access karo. Public access sirf development/testing ke liye hai.

---

## RDS Se Connect Karna — Node.js

### PostgreSQL Connection

```bash
npm install pg
```

```javascript
// db/rds-connection.js
// RDS PostgreSQL se connect karna

const { Pool } = require('pg');

// Connection pool banao (har request pe naya connection nahi banana)
const pool = new Pool({
    host: process.env.RDS_HOST,         // e.g., kisan-db.abc123.ap-south-1.rds.amazonaws.com
    port: process.env.RDS_PORT || 5432,
    database: process.env.RDS_DATABASE, // kisanapp
    user: process.env.RDS_USER,         // admin
    password: process.env.RDS_PASSWORD,
    max: 20,                            // Maximum connections in pool
    idleTimeoutMillis: 30000,           // Idle connection timeout
    connectionTimeoutMillis: 5000       // Connection attempt timeout
});

// Connection test
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        console.log('RDS se connected!', result.rows[0].current_time);
        client.release(); // Connection wapas pool mein daal do
    } catch (err) {
        console.error('RDS connection failed:', err.message);
    }
}

// Table banao
async function createTables() {
    const query = `
        CREATE TABLE IF NOT EXISTS crops (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            season VARCHAR(50),
            min_price DECIMAL(10,2),
            max_price DECIMAL(10,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS farmers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            phone VARCHAR(15) UNIQUE,
            village VARCHAR(200),
            state VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
    console.log('Tables ban gaye RDS mein!');
}

module.exports = { pool, testConnection, createTables };
```

> **Yaad Rakho:** RDS ka endpoint (host) bahut lamba hota hai — `kisan-db.abc123xyz.ap-south-1.rds.amazonaws.com`. Ye `.env` file mein rakho, hardcode KABHI nahi!

---

## RDS Backups Aur Maintenance

### Automatic Backups

```
RDS Console → Modify → Backup:
- Backup retention: 7 days (free tier)
- Backup window: 03:00-04:00 UTC (low traffic time)
- Automated snapshots: Enable
```

### Manual Snapshot

```
RDS Console → Database → Actions → Take Snapshot
- Snapshot name: kisan-db-before-migration-2026
- Ye permanent rehta hai jab tak tum delete nahi karte
```

> **Tip:** Bada database change karne se pehle (migration, schema change) HAMESHA manual snapshot lo. Kuch galat ho jaye to restore kar sakte ho!

---

## Quick Revision Table

| Service | Kya Hai | Key Feature |
|---------|---------|-------------|
| S3 | Object storage (files) | Unlimited storage, 11 nines durability |
| Bucket | S3 container | Globally unique name |
| Object | S3 file | Key (path) + Value (content) |
| Presigned URL | Temporary file access link | Time-limited, secure |
| CloudFront | CDN | 400+ edge locations, fast delivery |
| RDS | Managed database | Auto backup, patching, scaling |
| Connection Pool | Database connections reuse | `pg` Pool — max connections set karo |
| Snapshot | Database backup | Manual ya automatic |

---

## Aaj Kya Seekha?

1. **S3** unlimited cloud storage hai — images, videos, documents, backups sab store karo
2. **Buckets** globally unique hone chahiye — naming convention follow karo
3. **AWS SDK** se Node.js se files upload, download, delete kar sakte ho
4. **Presigned URLs** se temporary secure access dete ho — bucket public karne ki zaroorat nahi
5. **S3 Static Hosting** se React/Vue apps host kar sakte ho — serverless!
6. **CloudFront CDN** se content worldwide fast deliver hota hai — edge locations pe cache
7. **RDS** managed database hai — backup, patching, scaling AWS karta hai
8. **Connection Pool** use karo — har request pe naya connection banana expensive hai
