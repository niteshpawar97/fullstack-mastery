# Day 44 Evening: Mini Project — "Secure Blog API"

> **Aaj ka plan:** Ab hum poore week ka seekha hua ek project mein lagayenge — "Secure Blog API" jisme authentication (JWT + bcrypt), validation (Joi), pagination/search/filter, aur file upload (Multer) sab kuch hoga. Ye real-world project jaisa hai!

---

## Project Overview — "Secure Blog API"

### Features:
1. User **register/login** (bcrypt + JWT)
2. **Role-based access** — admin can manage all, author can manage own
3. Blog post **CRUD** with validation (Joi)
4. Blog **cover image upload** (Multer)
5. **Pagination, search, filter** by category/author
6. **Global error handler**

### API Endpoints:

| Method | Route | Auth? | Role | Description |
|--------|-------|-------|------|-------------|
| POST | `/api/auth/register` | No | - | Register |
| POST | `/api/auth/login` | No | - | Login |
| GET | `/api/auth/me` | Yes | Any | My profile |
| GET | `/api/blogs` | No | - | All blogs (paginated) |
| GET | `/api/blogs/:id` | No | - | Single blog |
| POST | `/api/blogs` | Yes | Any | Create blog |
| PUT | `/api/blogs/:id` | Yes | Owner/Admin | Update blog |
| DELETE | `/api/blogs/:id` | Yes | Owner/Admin | Delete blog |
| POST | `/api/blogs/:id/cover` | Yes | Owner/Admin | Upload cover image |

---

## Project Setup

> **Terminal Command:**
```bash
mkdir secure-blog-api && cd secure-blog-api
npm init -y
npm install express mongoose bcrypt jsonwebtoken joi multer dotenv
mkdir config models routes middleware schemas utils uploads uploads/covers
```

### .env File

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/secure-blog-api
JWT_SECRET=blog-api-super-secret-key-change-in-production-2024
JWT_EXPIRE=7d
NODE_ENV=development
```

---

## Step 1: Core Setup Files

```javascript
// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('DB Connection Failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Body parser
app.use(express.json());

// Static files — uploaded images serve karo
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connect
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blog'));

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Secure Blog API chal rahi hai!',
    endpoints: {
      auth: '/api/auth/register, /api/auth/login, /api/auth/me',
      blogs: '/api/blogs (GET, POST, PUT, DELETE)'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} nahi mila!` });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## Step 2: Models

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

```javascript
// models/Blog.js
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog ka title do'],
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: [true, 'Blog ka content likho'],
    minlength: 50  // Kam se kam 50 characters
  },
  category: {
    type: String,
    required: true,
    enum: ['technology', 'farming', 'business', 'health', 'education', 'lifestyle'],
    lowercase: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  coverImage: {
    type: String,     // Image ka path/URL
    default: null
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Text index for search
blogSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Blog', blogSchema);
```

---

## Step 3: Middleware Files

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token do! Format: Bearer <token>' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User exist nahi karta!' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expire ho gaya!' });
    }
    return res.status(401).json({ success: false, message: 'Token invalid hai!' });
  }
};
```

```javascript
// middleware/validate.js
module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return res.status(400).json({ success: false, message: 'Validation failed!', errors });
  }

  req.body = value;
  next();
};
```

```javascript
// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error!';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = `${Object.keys(err.keyValue)[0]} already exists!`;
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID: ${err.value}`;
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File bohot badi hai! Max 2MB allowed.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

---

## Step 4: Validation Schemas

```javascript
// schemas/auth.js
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({ 'any.required': 'Naam do', 'string.min': 'Naam 2+ characters' }),
  email: Joi.string().trim().lowercase().email().required()
    .messages({ 'string.email': 'Valid email do', 'any.required': 'Email do' }),
  password: Joi.string().min(6).max(128).required()
    .messages({ 'string.min': 'Password 6+ characters', 'any.required': 'Password do' })
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };
```

```javascript
// schemas/blog.js
const Joi = require('joi');

const createBlogSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required()
    .messages({ 'string.min': 'Title 5+ characters', 'any.required': 'Title do' }),
  content: Joi.string().min(50).required()
    .messages({ 'string.min': 'Content 50+ characters likho', 'any.required': 'Content likho' }),
  category: Joi.string().valid('technology', 'farming', 'business', 'health', 'education', 'lifestyle').required()
    .messages({ 'any.only': 'Valid category do', 'any.required': 'Category do' }),
  tags: Joi.array().items(Joi.string().trim().lowercase()).max(5).default([]),
  status: Joi.string().valid('draft', 'published').default('draft')
});

const updateBlogSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  content: Joi.string().min(50),
  category: Joi.string().valid('technology', 'farming', 'business', 'health', 'education', 'lifestyle'),
  tags: Joi.array().items(Joi.string().trim().lowercase()).max(5),
  status: Joi.string().valid('draft', 'published')
}).min(1).messages({ 'object.min': 'Kam se kam ek field do update ke liye!' });

module.exports = { createBlogSchema, updateBlogSchema };
```

---

## Step 5: Auth Routes

```javascript
// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/auth');

const router = express.Router();

// Register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email pehle se registered hai!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Welcome! Registration successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
});

// Login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Email ya password galat!' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
});

// Get my profile
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
```

---

## Step 6: Blog Routes (CRUD + Pagination + Upload)

```javascript
// routes/blog.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Blog = require('../models/Blog');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBlogSchema, updateBlogSchema } = require('../schemas/blog');

const router = express.Router();

// ---- Multer Config for Cover Images ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/covers/'),
  filename: (req, file, cb) => {
    cb(null, `blog-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Sirf image files allowed!'), false);
  },
  limits: { fileSize: 2 * 1024 * 1024 }  // 2MB max
});

// ---- GET ALL BLOGS (Public + Paginated + Search + Filter) ----
router.get('/', async (req, res, next) => {
  try {
    const filter = { status: 'published' };  // Sirf published blogs dikhao

    // Category filter
    if (req.query.category) filter.category = req.query.category.toLowerCase();

    // Author filter
    if (req.query.author) filter.author = req.query.author;

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [{ title: searchRegex }, { content: searchRegex }];
      delete filter.status;  // Search mein status filter hatao
    }

    // Tag filter
    if (req.query.tag) filter.tags = req.query.tag.toLowerCase();

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 50);
    const skip = (page - 1) * limit;

    // Sort
    let sort = '-createdAt';
    if (req.query.sortBy === 'views') sort = '-views';
    if (req.query.sortBy === 'title') sort = req.query.order === 'desc' ? '-title' : 'title';

    // Query execute
    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate('author', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-content')   // List mein poora content mat bhejo
        .lean(),
      Blog.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      currentPage: page,
      totalPages,
      totalBlogs: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      blogs
    });
  } catch (error) { next(error); }
});

// ---- GET SINGLE BLOG ----
router.get('/:id', async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },   // View count badhao
      { new: true }
    ).populate('author', 'name email avatar');

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog nahi mila!' });
    }

    res.json({ success: true, blog });
  } catch (error) { next(error); }
});

// ---- CREATE BLOG ----
router.post('/', authMiddleware, validate(createBlogSchema), async (req, res, next) => {
  try {
    const blog = await Blog.create({
      ...req.body,
      author: req.user._id  // Logged-in user = author
    });

    await blog.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Blog create ho gaya!',
      blog
    });
  } catch (error) { next(error); }
});

// ---- UPDATE BLOG (Owner ya Admin) ----
router.put('/:id', authMiddleware, validate(updateBlogSchema), async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog nahi mila!' });
    }

    // Ownership check — sirf author ya admin edit kar sakta hai
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Ye tumhara blog nahi hai! Sirf apna blog edit karo.'
      });
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('author', 'name email');

    res.json({ success: true, message: 'Blog updated!', blog: updated });
  } catch (error) { next(error); }
});

// ---- DELETE BLOG (Owner ya Admin) ----
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog nahi mila!' });
    }

    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission nahi hai!' });
    }

    // Cover image delete karo agar hai
    if (blog.coverImage && fs.existsSync(blog.coverImage)) {
      fs.unlinkSync(blog.coverImage);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog delete ho gaya!' });
  } catch (error) { next(error); }
});

// ---- UPLOAD COVER IMAGE ----
router.post('/:id/cover', authMiddleware, upload.single('cover'), async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      if (req.file) fs.unlinkSync(req.file.path);  // Cleanup
      return res.status(404).json({ success: false, message: 'Blog nahi mila!' });
    }

    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Permission nahi hai!' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file bhejo! Field: "cover"' });
    }

    // Purani image delete karo
    if (blog.coverImage && fs.existsSync(blog.coverImage)) {
      fs.unlinkSync(blog.coverImage);
    }

    // Nayi image set karo
    const imagePath = req.file.path.replace(/\\/g, '/');
    blog.coverImage = imagePath;
    await blog.save();

    res.json({
      success: true,
      message: 'Cover image upload ho gayi!',
      coverImage: imagePath,
      url: `${req.protocol}://${req.get('host')}/${imagePath}`
    });
  } catch (error) { next(error); }
});

// ---- MY BLOGS (logged-in user ke) ----
router.get('/my/posts', authMiddleware, async (req, res, next) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .sort('-createdAt')
      .select('title category status views createdAt');

    res.json({ success: true, count: blogs.length, blogs });
  } catch (error) { next(error); }
});

module.exports = router;
```

> **Warning:** `GET /my/posts` route ko `GET /:id` se **pehle** define karo, nahi toh Express "my" ko ID samjhega aur CastError aayega!

---

## Postman Se Test Karo — Complete Flow

### 1. Register 2 Users
```
POST /api/auth/register → { name: "Ramesh", email: "ramesh@blog.com", password: "Ramesh@1" }
POST /api/auth/register → { name: "Suresh", email: "suresh@blog.com", password: "Suresh@1" }
→ Save both tokens!
```

### 2. Create Blogs
```
POST /api/blogs (Ramesh ka token)
Body: {
  "title": "Modern Farming Techniques in India",
  "content": "Aaj hum modern farming ke baare mein baat karenge... (50+ chars)",
  "category": "farming",
  "tags": ["agriculture", "modern"],
  "status": "published"
}
→ 201: Blog created!
```

### 3. Upload Cover Image
```
POST /api/blogs/:blogId/cover (Ramesh ka token)
Body: form-data → Key: cover → Select image
→ 200: Cover image upload ho gayi!
```

### 4. Get All Blogs (Paginated)
```
GET /api/blogs?page=1&limit=5
GET /api/blogs?category=farming
GET /api/blogs?search=modern
GET /api/blogs?sortBy=views
```

### 5. Suresh Tries to Edit Ramesh's Blog
```
PUT /api/blogs/:rameshBlogId (Suresh ka token)
→ 403: "Ye tumhara blog nahi hai!"
```

### 6. Suresh Edits Own Blog (should work)
```
PUT /api/blogs/:sureshBlogId (Suresh ka token)
→ 200: Blog updated!
```

---

## Quick Revision Table — Project Summary

| Feature | Implementation |
|---------|---------------|
| Auth | JWT + bcrypt + role-based |
| Validation | Joi schemas + validate middleware |
| Pagination | skip/limit + Promise.all |
| Search | Regex on title + content |
| Filter | Category, tag, author |
| File Upload | Multer diskStorage + image filter |
| Error Handling | Global error handler |
| Ownership | author check before update/delete |
| Security | .env secrets, generic errors, input validation |

---

## Aaj Kya Seekha?

1. **Real-world API** mein auth, validation, pagination, file upload sab ek saath hota hai
2. **Ownership check** — user sirf apna data edit/delete kar sake
3. **Middleware chain** — auth → role → validate → handler → error handler
4. **Pagination + search + filter** ek hi endpoint mein combine hota hai
5. **File cleanup** — purani files delete karo naye upload ke pehle
6. **Route order** matters — `/my/posts` pehle, `/:id` baad mein

> **Congratulations!** Week 7 complete! Tumne ab professional-level API features seekh liye hain. Agle week mein hum advanced topics cover karenge — real-time features, caching, aur deployment!
