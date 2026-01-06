# Day 33 - Evening Session: REST API Design Practice

> **Aaj ka plan:**
> Morning mein REST ki theory seekhi, ab implement karte hain! Ek complete Blog System ka REST API design karenge aur Express mein basic routes likhenge.

---

## Task 1: Blog API — Endpoints Design

Pehle paper pe (ya comment mein) saare endpoints likh lo:

```javascript
/*
 ╔══════════════════════════════════════════════════════════════╗
 ║              BLOG SYSTEM — REST API DESIGN                  ║
 ╠══════════════════════════════════════════════════════════════╣
 ║                                                              ║
 ║  POSTS (Articles):                                           ║
 ║  GET    /api/v1/posts              → Saare posts             ║
 ║  GET    /api/v1/posts/:id          → Ek post                 ║
 ║  POST   /api/v1/posts              → Naya post banao         ║
 ║  PUT    /api/v1/posts/:id          → Post update karo        ║
 ║  DELETE /api/v1/posts/:id          → Post delete karo        ║
 ║                                                              ║
 ║  COMMENTS (Post ke under):                                   ║
 ║  GET    /api/v1/posts/:id/comments → Post ke comments        ║
 ║  POST   /api/v1/posts/:id/comments → Naya comment            ║
 ║  DELETE /api/v1/posts/:postId/comments/:commentId → Delete   ║
 ║                                                              ║
 ║  USERS:                                                      ║
 ║  GET    /api/v1/users              → Saare users             ║
 ║  GET    /api/v1/users/:id          → Ek user                 ║
 ║  POST   /api/v1/users              → Register                ║
 ║                                                              ║
 ╚══════════════════════════════════════════════════════════════╝
*/
```

---

## Project Setup

> **Terminal Command:**
> ```bash
> mkdir blog-api && cd blog-api
> npm init -y
> npm install express nodemon
> mkdir routes middleware data
> touch server.js
> touch routes/postRoutes.js routes/commentRoutes.js routes/userRoutes.js
> touch middleware/logger.js middleware/errorHandler.js
> touch data/db.js
> ```

---

## Task 2: Dummy Database

```javascript
// data/db.js — In-memory data (baad mein real DB use karenge)
const users = [
  { id: 1, name: 'Ramesh Kumar', email: 'ramesh@blog.com', role: 'author' },
  { id: 2, name: 'Priya Singh', email: 'priya@blog.com', role: 'author' },
  { id: 3, name: 'Amit Verma', email: 'amit@blog.com', role: 'admin' }
];

const posts = [
  {
    id: 1,
    title: 'Organic Farming Kaise Karein',
    body: 'Organic farming mein chemical fertilizer nahi use hota...',
    authorId: 1,
    category: 'farming',
    createdAt: '2026-04-01T10:00:00Z'
  },
  {
    id: 2,
    title: 'Mandi Bhav Kaise Check Karein',
    body: 'Government ki portal pe jaake mandi bhav dekh sakte hain...',
    authorId: 2,
    category: 'market',
    createdAt: '2026-04-02T14:00:00Z'
  },
  {
    id: 3,
    title: 'Drip Irrigation Setup Guide',
    body: 'Drip irrigation se 40% paani bach ta hai...',
    authorId: 1,
    category: 'technology',
    createdAt: '2026-04-03T09:00:00Z'
  }
];

const comments = [
  { id: 1, postId: 1, userId: 2, text: 'Bahut acchi jaankari!', createdAt: '2026-04-01T12:00:00Z' },
  { id: 2, postId: 1, userId: 3, text: 'Kya yeh UP mein kaam karega?', createdAt: '2026-04-01T14:00:00Z' },
  { id: 3, postId: 2, userId: 1, text: 'Mandi portal ka link de do', createdAt: '2026-04-02T16:00:00Z' }
];

// Export karo taaki routes mein use kar sakein
module.exports = { users, posts, comments };
```

---

## Task 3: Post Routes — Full CRUD

```javascript
// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const { posts, users } = require('../data/db');

// GET /api/v1/posts — Saare posts (with filtering & sorting)
router.get('/', (req, res) => {
  let result = [...posts];

  // Category se filter karo
  if (req.query.category) {
    result = result.filter(p => p.category === req.query.category);
  }

  // Author se filter karo
  if (req.query.authorId) {
    result = result.filter(p => p.authorId === Number(req.query.authorId));
  }

  // Pagination — default page=1, limit=10
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginated = result.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    count: paginated.length,
    total: result.length,
    page,
    totalPages: Math.ceil(result.length / limit),
    data: paginated
  });
});

// GET /api/v1/posts/:id — Ek post with author info
router.get('/:id', (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));

  if (!post) {
    return res.status(404).json({
      success: false,
      error: { code: 404, message: 'Post nahi mila' }
    });
  }

  // Author ki info bhi attach karo
  const author = users.find(u => u.id === post.authorId);

  res.status(200).json({
    success: true,
    data: { ...post, author: author || null }
  });
});

// POST /api/v1/posts — Naya post banao
router.post('/', (req, res) => {
  const { title, body, authorId, category } = req.body;

  // Validation
  const errors = [];
  if (!title) errors.push({ field: 'title', message: 'Title zaroori hai' });
  if (!body) errors.push({ field: 'body', message: 'Body zaroori hai' });
  if (!authorId) errors.push({ field: 'authorId', message: 'Author ID zaroori hai' });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { code: 400, message: 'Validation failed', details: errors }
    });
  }

  // Author exist karta hai?
  const author = users.find(u => u.id === Number(authorId));
  if (!author) {
    return res.status(404).json({
      success: false,
      error: { code: 404, message: 'Author ID galat hai — user nahi mila' }
    });
  }

  const newPost = {
    id: posts.length + 1,
    title,
    body,
    authorId: Number(authorId),
    category: category || 'general',
    createdAt: new Date().toISOString()
  };

  posts.push(newPost);

  // 201 Created — naya resource bana
  res.status(201).json({
    success: true,
    message: 'Post ban gaya!',
    data: newPost
  });
});

// PUT /api/v1/posts/:id — Post update karo
router.put('/:id', (req, res) => {
  const postIndex = posts.findIndex(p => p.id === Number(req.params.id));

  if (postIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 404, message: 'Post nahi mila update karne ke liye' }
    });
  }

  const { title, body, category } = req.body;

  // Update karo — jo fields aaye woh change karo
  if (title) posts[postIndex].title = title;
  if (body) posts[postIndex].body = body;
  if (category) posts[postIndex].category = category;
  posts[postIndex].updatedAt = new Date().toISOString();

  res.status(200).json({
    success: true,
    message: 'Post update ho gaya!',
    data: posts[postIndex]
  });
});

// DELETE /api/v1/posts/:id — Post delete karo
router.delete('/:id', (req, res) => {
  const postIndex = posts.findIndex(p => p.id === Number(req.params.id));

  if (postIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 404, message: 'Post nahi mila delete karne ke liye' }
    });
  }

  posts.splice(postIndex, 1);

  // 204 No Content — delete mein body nahi bhejte
  // Par message dikhana ho toh 200 use karo
  res.status(200).json({
    success: true,
    message: 'Post delete ho gaya!',
    data: {}
  });
});

module.exports = router;
```

> **Yaad Rakho:**
> DELETE ke baad `204 No Content` ya `200 OK` dono sahi hain. Agar confirmation message bhejni hai toh 200 use karo, warna 204 mein koi body nahi hoti.

---

## Task 4: Comment Routes (Nested Resource)

```javascript
// routes/commentRoutes.js
const express = require('express');
// mergeParams: true — parent route ke params inherit karo
const router = express.Router({ mergeParams: true });
const { comments, posts } = require('../data/db');

// GET /api/v1/posts/:id/comments — Post ke saare comments
router.get('/', (req, res) => {
  const postId = Number(req.params.id);

  // Post exist karta hai?
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({
      success: false,
      error: { code: 404, message: 'Post nahi mila' }
    });
  }

  // Post ke comments filter karo
  const postComments = comments.filter(c => c.postId === postId);

  res.status(200).json({
    success: true,
    postId,
    count: postComments.length,
    data: postComments
  });
});

// POST /api/v1/posts/:id/comments — Naya comment
router.post('/', (req, res) => {
  const postId = Number(req.params.id);
  const { userId, text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: { code: 400, message: 'Comment text zaroori hai' }
    });
  }

  const newComment = {
    id: comments.length + 1,
    postId,
    userId: Number(userId) || 0,
    text,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);

  res.status(201).json({
    success: true,
    message: 'Comment add ho gaya!',
    data: newComment
  });
});

module.exports = router;
```

> **Tip:**
> `express.Router({ mergeParams: true })` zaroori hai nested routes mein. Iske bina `req.params.id` (parent ka `:id`) accessible nahi hoga.

---

## Task 5: Main Server File

```javascript
// server.js
const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Simple logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Routes import
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

// API Info — root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Blog API',
    version: 'v1',
    endpoints: {
      posts: 'GET /api/v1/posts',
      singlePost: 'GET /api/v1/posts/:id',
      postComments: 'GET /api/v1/posts/:id/comments',
      createPost: 'POST /api/v1/posts',
      createComment: 'POST /api/v1/posts/:id/comments'
    }
  });
});

// Mount routes — versioned URLs
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/posts/:id/comments', commentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: `${req.originalUrl} route nahi mila`,
      hint: 'GET / pe jaake available endpoints dekho'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { code: 500, message: 'Server mein kuch gadbad ho gayi' }
  });
});

app.listen(PORT, () => {
  console.log(`Blog API v1 chal raha hai: http://localhost:${PORT}`);
});
```

> **Terminal Command:**
> ```bash
> npm run dev
> ```

Test these endpoints:
```
GET  http://localhost:3000/api/v1/posts
GET  http://localhost:3000/api/v1/posts?category=farming
GET  http://localhost:3000/api/v1/posts/1
GET  http://localhost:3000/api/v1/posts/1/comments
POST http://localhost:3000/api/v1/posts  (body: {"title":"Test","body":"Hello","authorId":1})
POST http://localhost:3000/api/v1/posts/1/comments  (body: {"userId":2,"text":"Nice!"})
```

---

## Quick Revision Table

| Concept | Implementation | Why |
|---------|---------------|-----|
| Plural nouns | `/api/v1/posts` | RESTful convention |
| Versioning | `/api/v1/` prefix | Future-proof |
| Nested routes | `/posts/:id/comments` | Relationships dikhata hai |
| `mergeParams` | `Router({ mergeParams: true })` | Parent params inherit karo |
| Pagination | `?page=1&limit=10` | Zyada data handle karo |
| Validation | Check required fields | Bad data reject karo |
| Status 201 | `res.status(201)` | Resource created |
| Status 404 | Resource not found | Clear error message |
| Consistent format | `{ success, data/error }` | Frontend ko asaani |

---

## Aaj Kya Seekha?

1. **REST API design** pehle paper pe karo — endpoints list banao, phir code karo
2. **Nested resources** (`/posts/:id/comments`) se relationships dikhte hain
3. **Pagination** badi lists ke liye zaroori hai — `page` aur `limit` query params
4. **Validation** har POST/PUT mein karo — galat data database mein nahi jaana chahiye
5. **Consistent response format** (`success`, `data`, `error`) professional API ki pehchaan hai
6. **mergeParams: true** nested Router mein parent ke params access karne ke liye zaroori hai

> **Practice Time!**
> Apna ek API design karo — jaise Library System (books, authors, borrowings) ya School System (students, subjects, marks). Kal Mongoose ke saath real database connect karenge!
