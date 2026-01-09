# Day 43 Morning: File Upload — Multer + S3 Basics

> **Aaj ka plan:** Aaj hum seekhenge ki file upload kaise kaam karta hai web mein, multipart/form-data kya hai, Multer package se Node.js mein files receive kaise karte hain, file validation (size, type), single vs multiple upload, aur AWS S3 pe files store karne ka concept.

---

## File Upload — Kaise Kaam Karta Hai?

### Normal JSON Request vs File Upload

```javascript
// ❌ Normal JSON request — file nahi bhej sakte
POST /api/users
Content-Type: application/json
{ "name": "Ramesh", "avatar": "???" }  // Image kaise bhejein?

// ✅ File upload — multipart/form-data use hota hai
POST /api/users
Content-Type: multipart/form-data
-- name: Ramesh
-- avatar: [binary file data]
```

### multipart/form-data Kya Hai?

Jab form mein file (image, PDF, etc.) bhejni ho, toh request ka format `multipart/form-data` hota hai. Isme data **parts mein** divided hota hai — text fields alag, file data alag.

> **Socho Aise:** Normal JSON request ek simple letter hai — sirf text. Multipart/form-data ek courier parcel hai jisme text letter bhi hai aur ek package (file) bhi hai — dono saath mein packed hain lekin alag-alag compartments mein.

---

## Multer Package — Introduction

### Multer Kya Hai?

Multer ek **Node.js middleware** hai jo `multipart/form-data` handle karta hai — matlab files receive karta hai.

> **Terminal Command:**
```bash
npm install multer
```

### Multer Ka Kaam:

1. Client se file receive karna
2. File ko server pe save karna (disk ya memory mein)
3. File ki info `req.file` mein dena (filename, size, mimetype)

---

## Disk Storage — Local Machine Pe Save

```javascript
const multer = require('multer');
const path = require('path');

// ---- Storage configuration ----
const storage = multer.diskStorage({
  // Kahan save hoga?
  destination: function(req, file, cb) {
    cb(null, 'uploads/');  // 'uploads' folder mein save hoga
  },
  // Kya naam hoga file ka?
  filename: function(req, file, cb) {
    // unique naam banao — timestamp + random number + original extension
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
    // Result: 1712345678901-987654321.jpg
  }
});

// Multer instance banao
const upload = multer({ storage: storage });
```

> **Yaad Rakho:** `uploads/` folder pehle se exist karna chahiye. Nahi toh error aayega.

> **Terminal Command:**
```bash
mkdir uploads
```

---

## Memory Storage — RAM Mein Rakh

```javascript
// Memory storage — file RAM mein rehti hai (buffer ke roop mein)
// S3 ya cloud pe upload karte waqt useful hai
const memoryStorage = multer.memoryStorage();

const uploadToMemory = multer({ storage: memoryStorage });

// req.file.buffer mein file ka data milta hai
// Isse directly S3 pe bhej sakte hain
```

| Feature | Disk Storage | Memory Storage |
|---------|-------------|----------------|
| File saved | Server ki hard disk pe | RAM mein (buffer) |
| Use case | Local file storage | Cloud upload (S3, etc.) |
| Speed | Fast for local | Fast for cloud upload |
| Memory usage | Low (disk pe hai) | High (RAM mein hai) |
| Access | `req.file.path` | `req.file.buffer` |

---

## File Validation — Size & Type Check

### Kyu Validate Karna Zaroori Hai?

1. **Koi bhi file** upload ho sakti hai — .exe, .php (security risk!)
2. **Badi file** server ka disk/memory bhar sakti hai
3. **Wrong type** — avatar ke liye image chahiye, PDF nahi

```javascript
// ---- File filter (type check) ----
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);   // Accept — file ok hai
  } else {
    cb(new Error(`File type '${file.mimetype}' allowed nahi hai! Sirf JPEG, PNG, GIF, WebP upload karo.`), false);
  }
};

// ---- Complete Multer config with validation ----
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // Maximum 5MB (bytes mein)
    files: 5                     // Maximum 5 files ek request mein
  }
});
```

> **Warning:** File validation sirf mimetype check se poori nahi hoti. Koi `.exe` file ko `.jpg` rename karke bhej sakta hai. Production mein file ka actual content (magic bytes) bhi check karo.

```javascript
// Extra security — file extension bhi check karo
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ext = path.extname(file.originalname).toLowerCase();

if (!allowedExtensions.includes(ext)) {
  cb(new Error('Invalid file extension!'), false);
}
```

---

## Single File Upload

```javascript
// ---- Single file upload route ----
// 'avatar' — form field ka naam jo client bhejega
router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  // req.file mein file ki info milti hai
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Koi file nahi bheji!'
    });
  }

  console.log('File info:', req.file);
  /*
  {
    fieldname: 'avatar',
    originalname: 'my-photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: 'uploads/',
    filename: '1712345678901-987654321.jpg',
    path: 'uploads/1712345678901-987654321.jpg',
    size: 245678  // bytes mein
  }
  */

  res.json({
    success: true,
    message: 'File upload ho gayi!',
    file: {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      path: req.file.path,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,  // KB mein convert
      type: req.file.mimetype
    }
  });
});
```

---

## Multiple File Upload

```javascript
// ---- Multiple files (same field) ----
// 'photos' field mein maximum 5 files
router.post('/upload-photos', upload.array('photos', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Koi file nahi bheji!' });
  }

  const uploadedFiles = req.files.map(file => ({
    originalName: file.originalname,
    fileName: file.filename,
    size: `${(file.size / 1024).toFixed(2)} KB`
  }));

  res.json({
    success: true,
    message: `${req.files.length} files upload ho gayi!`,
    files: uploadedFiles
  });
});

// ---- Multiple fields (different names) ----
router.post('/upload-docs',
  upload.fields([
    { name: 'avatar', maxCount: 1 },     // 1 avatar
    { name: 'documents', maxCount: 3 }    // 3 documents
  ]),
  (req, res) => {
    const avatar = req.files['avatar'] ? req.files['avatar'][0] : null;
    const documents = req.files['documents'] || [];

    res.json({
      success: true,
      avatar: avatar ? avatar.filename : 'No avatar',
      documents: documents.map(d => d.filename)
    });
  }
);
```

| Method | Use Case | Access |
|--------|----------|--------|
| `upload.single('fieldName')` | Ek file | `req.file` |
| `upload.array('fieldName', max)` | Multiple files (same field) | `req.files` (array) |
| `upload.fields([...])` | Multiple fields | `req.files['fieldName']` |
| `upload.none()` | Sirf text fields, no file | `req.body` |

---

## AWS S3 — Cloud Storage Basics

### S3 Kya Hai?

Amazon S3 (Simple Storage Service) ek **cloud storage** hai jahan tum files (images, videos, PDFs) store kar sakte ho. Files ko URL se access kar sakte ho.

> **Socho Aise:** Tumhare computer ki hard disk limited hai — 500 GB. Lekin S3 ek unlimited cloud godown hai jahan tum lakhs of files rakh sakte ho aur duniya mein kahin se bhi access kar sakte ho.

### S3 Key Concepts

| Term | Matlab |
|------|--------|
| Bucket | Folder jaisa — files ka container |
| Object | Har file ek object hai |
| Key | File ka path/naam bucket mein |
| Region | Kahan store hoga (ap-south-1 = Mumbai) |
| ACL | Access control — public ya private |
| Pre-signed URL | Temporary link jo expire hota hai |

### AWS SDK Setup

```javascript
// npm install @aws-sdk/client-s3

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// S3 client banao
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',       // Mumbai
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// File upload function
async function uploadToS3(file) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,        // Bucket ka naam
    Key: `uploads/${Date.now()}-${file.originalname}`,  // File path in bucket
    Body: file.buffer,                          // File ka data (memory storage se)
    ContentType: file.mimetype,                 // image/jpeg, image/png
    // ACL: 'public-read'  // Public access (optional — depends on bucket policy)
  };

  const command = new PutObjectCommand(params);
  const result = await s3Client.send(command);

  // File ka public URL
  const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

  return {
    url: fileUrl,
    key: params.Key,
    result
  };
}
```

### Route Mein S3 Upload

```javascript
// Memory storage use karo S3 ke liye
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/upload-s3', uploadMemory.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File do!' });
    }

    // S3 pe upload karo
    const s3Result = await uploadToS3(req.file);

    res.json({
      success: true,
      message: 'File S3 pe upload ho gayi!',
      url: s3Result.url,
      key: s3Result.key
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'S3 upload failed!',
      error: error.message
    });
  }
});
```

> **Tip:** AWS account nahi hai? Koi baat nahi — evening practice mein hum local storage se kaam chalayenge aur S3 upload ko simulate karenge. Real S3 baad mein seekhenge jab deploy karenge.

---

## Static Files Serve Karna

```javascript
// server.js mein add karo — uploaded files access karne ke liye
const path = require('path');

// 'uploads' folder ko publicly accessible banao
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ab files access ho sakti hain:
// http://localhost:3000/uploads/1712345678901-987654321.jpg
```

> **Warning:** Production mein uploaded files ko directly serve mat karo. CDN (CloudFront) ya S3 pre-signed URLs use karo — faster aur secure hai.

---

## Quick Revision Table

| Topic | Key Point |
|-------|-----------|
| multipart/form-data | File upload ka content type |
| Multer | Node.js middleware for file handling |
| diskStorage | File ko server disk pe save karo |
| memoryStorage | File ko RAM mein rakh (cloud upload ke liye) |
| fileFilter | File type check (mimetype) |
| limits.fileSize | Maximum file size in bytes |
| upload.single() | Ek file upload — `req.file` |
| upload.array() | Multiple files — `req.files` |
| upload.fields() | Multiple fields — `req.files['name']` |
| S3 Bucket | Cloud storage container |
| PutObjectCommand | S3 pe file upload karne ka command |
| express.static() | Uploaded files serve karne ke liye |

---

## Aaj Kya Seekha?

1. **multipart/form-data** file upload ke liye zaroori hai
2. **Multer** Node.js mein files receive karne ka standard tarika hai
3. **diskStorage** local pe save karta hai, **memoryStorage** RAM mein rakhta hai
4. **File validation** — size aur type dono check karo (security ke liye)
5. **Single/Multiple upload** — `single()`, `array()`, `fields()` methods
6. **AWS S3** cloud storage hai — scalable aur accessible from anywhere

> **Practice Time!** Evening mein hum user profile picture upload karenge, file type/size validate karenge, locally store karenge, aur S3 upload simulate karenge!
