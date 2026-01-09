# Day 43 Evening: Practice — File Upload with Multer + S3 Simulation

> **Aaj ka plan:** Ab hum user profile picture upload ka feature build karenge — Multer se file receive karenge, type aur size validate karenge, locally store karenge, aur S3 upload ko simulate karenge. Poora flow test karenge Postman se.

---

## Project Structure Update

```
auth-system/
├── uploads/                  ← NEW (uploaded files yahan jayengi)
│   └── avatars/              ← NEW (profile pictures)
├── config/
│   ├── db.js
│   └── multer.js             ← NEW (multer configuration)
├── routes/
│   ├── auth.js
│   ├── product.js
│   └── upload.js             ← NEW
└── ... (baaki same)
```

> **Terminal Command:**
```bash
npm install multer
mkdir -p uploads/avatars
touch config/multer.js routes/upload.js
```

---

## Step 1: Multer Configuration

```javascript
// config/multer.js
const multer = require('multer');
const path = require('path');

// ---- Allowed file types ----
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB

// ---- Disk Storage (local) ----
const diskStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Alag folders for alag purposes
    let uploadPath = 'uploads/';

    if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/avatars/';
    } else if (file.fieldname === 'blogImage') {
      uploadPath = 'uploads/blogs/';
    }

    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Format: userId-timestamp.extension
    // Agar user logged in hai toh userId use karo
    const userId = req.user ? req.user._id : 'anonymous';
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${userId}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

// ---- Memory Storage (S3 ke liye) ----
const memStorage = multer.memoryStorage();

// ---- File Filter ----
const imageFilter = (req, file, cb) => {
  // Mimetype check
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(`'${file.mimetype}' allowed nahi hai! Sirf JPEG, PNG, GIF, WebP bhejo.`),
      false
    );
  }

  // Extension check (double validation)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  if (!allowedExts.includes(ext)) {
    return cb(
      new Error(`'${ext}' extension allowed nahi hai!`),
      false
    );
  }

  cb(null, true);  // File ok hai
};

// ---- Export different upload configs ----

// Local disk upload
const uploadLocal = multer({
  storage: diskStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
});

// Memory upload (S3 simulation ke liye)
const uploadMemory = multer({
  storage: memStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
});

module.exports = { uploadLocal, uploadMemory, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE };
```

---

## Step 2: User Model Update — Avatar Field

```javascript
// models/User.js — avatar field add karo
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Naam dena zaroori hai'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email dena zaroori hai'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password dena zaroori hai'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  avatar: {
    type: String,           // File path ya URL store hoga
    default: null           // Koi default nahi
  }
}, { timestamps: true });
```

---

## Step 3: Upload Routes

```javascript
// routes/upload.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { uploadLocal, uploadMemory } = require('../config/multer');

// ---- PROFILE PICTURE UPLOAD (Local Storage) ----
router.post('/avatar',
  authMiddleware,                          // Login zaroori hai
  uploadLocal.single('avatar'),            // 'avatar' field se ek file
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Image file bhejo! Field name "avatar" hona chahiye.'
        });
      }

      // Purani avatar delete karo (agar hai toh)
      if (req.user.avatar) {
        const oldPath = req.user.avatar;
        // File exist karti hai toh delete karo
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log('Purani avatar delete ho gayi:', oldPath);
        }
      }

      // User mein naya avatar path save karo
      const avatarPath = req.file.path.replace(/\\/g, '/');  // Windows path fix
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: avatarPath },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Profile picture upload ho gayi!',
        user,
        file: {
          originalName: req.file.originalname,
          savedAs: req.file.filename,
          path: avatarPath,
          size: `${(req.file.size / 1024).toFixed(2)} KB`,
          type: req.file.mimetype,
          url: `${req.protocol}://${req.get('host')}/${avatarPath}`
        }
      });
    } catch (error) {
      // Agar error aaye toh uploaded file delete karo
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ---- MULTIPLE PHOTOS UPLOAD ----
router.post('/photos',
  authMiddleware,
  uploadLocal.array('photos', 5),          // 'photos' field se max 5 files
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Kam se kam ek photo bhejo!'
        });
      }

      const uploadedFiles = req.files.map(file => ({
        originalName: file.originalname,
        savedAs: file.filename,
        path: file.path.replace(/\\/g, '/'),
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.mimetype
      }));

      res.json({
        success: true,
        message: `${req.files.length} photos upload ho gayi!`,
        files: uploadedFiles
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ---- S3 UPLOAD SIMULATION ----
router.post('/avatar-s3',
  authMiddleware,
  uploadMemory.single('avatar'),           // Memory storage — buffer mein
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Image file bhejo!'
        });
      }

      // S3 upload simulate karo
      // Real S3 mein: await uploadToS3(req.file)
      const simulatedS3Key = `avatars/${req.user._id}-${Date.now()}${path.extname(req.file.originalname)}`;
      const simulatedS3Url = `https://my-farm-app-bucket.s3.ap-south-1.amazonaws.com/${simulatedS3Key}`;

      console.log('S3 Simulation:');
      console.log('  Buffer size:', req.file.buffer.length, 'bytes');
      console.log('  S3 Key:', simulatedS3Key);
      console.log('  S3 URL:', simulatedS3Url);

      // Simulation ke liye locally save karo
      const localPath = `uploads/avatars/${path.basename(simulatedS3Key)}`;
      fs.writeFileSync(localPath, req.file.buffer);

      // User update karo
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: simulatedS3Url },  // S3 URL save karo
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Avatar S3 pe upload ho gayi (simulated)!',
        user,
        s3: {
          bucket: 'my-farm-app-bucket',
          key: simulatedS3Key,
          url: simulatedS3Url,
          size: `${(req.file.size / 1024).toFixed(2)} KB`
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ---- DELETE AVATAR ----
router.delete('/avatar',
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.user.avatar) {
        return res.status(400).json({
          success: false,
          message: 'Koi avatar set nahi hai!'
        });
      }

      // Local file delete karo (agar exist karti hai)
      if (fs.existsSync(req.user.avatar)) {
        fs.unlinkSync(req.user.avatar);
      }

      // Database se avatar hatao
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: null },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Avatar delete ho gayi!',
        user
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
```

---

## Step 4: Server Mein Routes Add + Error Handle

```javascript
// server.js — update
const uploadRoutes = require('./routes/upload');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Static files
app.use('/api/upload', uploadRoutes);

// Multer error handling — global error handler mein add karo
// middleware/errorHandler.js mein ye add karo:

// ---- Multer Errors ----
if (err.code === 'LIMIT_FILE_SIZE') {
  statusCode = 400;
  message = 'File bohot badi hai! Maximum 5MB allowed.';
}
if (err.code === 'LIMIT_FILE_COUNT') {
  statusCode = 400;
  message = 'Bohot zyada files! Maximum 5 files allowed.';
}
if (err.code === 'LIMIT_UNEXPECTED_FILE') {
  statusCode = 400;
  message = 'Galat field name! Expected field names check karo.';
}
if (err.message && err.message.includes('allowed nahi hai')) {
  statusCode = 400;
  // Multer file filter se aaya hai — message already set hai
}
```

---

## Postman Se Test Karo

### Test 1: Upload Avatar (Local)
```
POST http://localhost:3000/api/upload/avatar
Headers: Authorization: Bearer <token>
Body: form-data
  Key: avatar (type: File)
  Value: Select a .jpg or .png file

→ 200: "Profile picture upload ho gayi!"
→ File path aur URL milega
```

### Test 2: Upload Wrong File Type
```
POST http://localhost:3000/api/upload/avatar
Body: form-data → Key: avatar → Select a .pdf file

→ 400: "'application/pdf' allowed nahi hai! Sirf JPEG, PNG, GIF, WebP bhejo."
```

### Test 3: Upload Large File (>5MB)
```
POST http://localhost:3000/api/upload/avatar
Body: form-data → Key: avatar → Select a 10MB image

→ 400: "File bohot badi hai! Maximum 5MB allowed."
```

### Test 4: Multiple Photos
```
POST http://localhost:3000/api/upload/photos
Headers: Authorization: Bearer <token>
Body: form-data
  Key: photos (type: File) → Select 3 images

→ 200: "3 photos upload ho gayi!"
```

### Test 5: S3 Simulation
```
POST http://localhost:3000/api/upload/avatar-s3
Headers: Authorization: Bearer <token>
Body: form-data → Key: avatar → Select image

→ 200: S3 bucket, key, URL info milegi
```

### Test 6: View Uploaded File
```
Open browser: http://localhost:3000/uploads/avatars/<filename>.jpg
→ Image dikhni chahiye
```

### Test 7: Delete Avatar
```
DELETE http://localhost:3000/api/upload/avatar
Headers: Authorization: Bearer <token>
→ 200: "Avatar delete ho gayi!"
```

> **Practice Time!** Ye exercises try karo:
> 1. 6 files ek saath upload karo — `LIMIT_FILE_COUNT` error check karo
> 2. Without login file upload karo — kya hota hai?
> 3. Avatar upload ke baad phir se upload karo — purani file delete hui ya nahi?
> 4. Blog image upload ke liye alag route banao (`/upload/blog-image`)
> 5. File ka actual content type check karo (magic bytes)

---

## File Upload Flow Summary

```
Client (Postman/Frontend)
    │
    ├── POST /api/upload/avatar
    ├── Content-Type: multipart/form-data
    ├── Authorization: Bearer <token>
    └── Body: avatar = [image file]
         │
         ▼
    authMiddleware
    (Token verify → req.user set)
         │
         ▼
    Multer Middleware
    (File receive → validate type/size → save to disk/memory)
         │
         ▼
    Route Handler
    (req.file se info lo → DB update → response bhejo)
         │
         ▼
    Response: { success, file info, URL }
```

---

## Quick Revision Table

| Task | Code | Result |
|------|------|--------|
| Single upload | `upload.single('avatar')` | `req.file` |
| Multiple upload | `upload.array('photos', 5)` | `req.files` (array) |
| File type check | `fileFilter` function | Accept/Reject |
| File size limit | `limits: { fileSize: 5MB }` | Error if exceeded |
| Disk save | `multer.diskStorage()` | `req.file.path` |
| Memory save | `multer.memoryStorage()` | `req.file.buffer` |
| Old file delete | `fs.unlinkSync(path)` | File removed |
| Static serve | `express.static('uploads')` | Files accessible via URL |
| S3 upload | `PutObjectCommand` | Cloud URL |

---

## Aaj Kya Seekha?

1. **Multer** se Node.js mein files receive karte hain
2. **diskStorage** local save ke liye, **memoryStorage** cloud upload ke liye
3. **File validation** — type (mimetype + extension) aur size dono check karo
4. **single()**, **array()**, **fields()** — different upload patterns
5. **Purani file delete** karo naye upload ke pehle (disk space bachao)
6. **S3** production mein files store karne ka standard tarika hai

> **Kal ka preview:** Kal revision day hai! Poore week ka recap karenge — JWT, bcrypt, roles, validation, pagination, file upload — sab ek jagah. Plus ek mini project banayenge — "Secure Blog API"!
