# Day 57 - Evening: Phase 2 Project — Setup, Models & Auth System

> **Aaj ka plan:**
> Ab building start karte hain! Project setup karenge, database models banayenge, aur complete auth system (register/login/roles) implement karenge.

---

## Task 1: Project Setup

> **Practice Time!**
> Project initialize karo with proper structure.

```bash
# Project create karo
mkdir farmer-ecommerce-api && cd farmer-ecommerce-api
npm init -y

# Dependencies install karo
npm install express mongoose dotenv bcryptjs jsonwebtoken \
  helmet cors express-rate-limit cookie-parser multer joi \
  swagger-jsdoc swagger-ui-express

# Dev dependencies
npm install -D nodemon

# Folder structure banao
mkdir -p src/{config,models,controllers,routes,middleware,validators,utils}
mkdir -p uploads .github/workflows docs/postman
```

### package.json scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

### .env file

```bash
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/farmer_ecommerce
JWT_SECRET=farmer_ecom_super_secret_key_2024
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
MAX_FILE_SIZE=5242880
```

### .gitignore

```
node_modules/
.env
uploads/*
!uploads/.gitkeep
```

> **Terminal Command:**
> ```bash
> git init && git add . && git commit -m "initial: project setup with folder structure"
> ```

---

## Task 2: Config & Database Connection

```javascript
// src/config/index.js
require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cors: {
    origins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3000"],
  },
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
};

// Required env vars check
const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`FATAL: Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

module.exports = config;
```

```javascript
// src/config/database.js
const mongoose = require("mongoose");
const config = require("./index");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## Task 3: Utility Classes

```javascript
// src/utils/apiResponse.js
// Standard response format — consistency ke liye
class ApiResponse {
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data, message = "Created successfully") {
    return this.success(res, data, message, 201);
  }

  static paginated(res, data, pagination) {
    return res.status(200).json({
      success: true,
      count: data.length,
      ...pagination,
      data,
    });
  }
}

module.exports = ApiResponse;
```

```javascript
// src/utils/apiError.js
// Custom error class — proper error handling ke liye
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // yeh expected error hai
  }

  static badRequest(message = "Bad request") {
    return new ApiError(message, 400);
  }

  static unauthorized(message = "Not authenticated") {
    return new ApiError(message, 401);
  }

  static forbidden(message = "Not authorized") {
    return new ApiError(message, 403);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(message, 404);
  }

  static conflict(message = "Already exists") {
    return new ApiError(message, 409);
  }
}

module.exports = ApiError;
```

---

## Task 4: User Model

```javascript
// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name zaroori hai"],
      trim: true,
      maxlength: [50, "Name 50 characters se zyada nahi ho sakta"],
    },
    email: {
      type: String,
      required: [true, "Email zaroori hai"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Valid email daalo"],
    },
    password: {
      type: String,
      required: [true, "Password zaroori hai"],
      minlength: [6, "Password kam se kam 6 characters"],
      select: false, // default mein password nahi aayega query mein
    },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Valid Indian phone number daalo"],
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    avatar: {
      type: String,
      default: "default-avatar.png",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto
  }
);

// Save se pehle password hash karo
userSchema.pre("save", async function (next) {
  // Sirf tab hash karo jab password change hua ho
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password match check karo
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// JWT token generate karo
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

module.exports = mongoose.model("User", userSchema);
```

> **Yaad Rakho:**
> `select: false` password pe lagao — jab bhi User query karoge, password nahi aayega. Jab chahiye toh explicitly `.select("+password")` likho. Security best practice hai.

---

## Task 5: Auth Middleware

```javascript
// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config");
const ApiError = require("../utils/apiError");

// JWT token verify karo
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Header se token lo
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Ya cookie se lo
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized("Token nahi mila. Login karo.");
    }

    // Token verify karo
    const decoded = jwt.verify(token, config.jwt.secret);

    // User dhundho
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("User nahi mila ya inactive hai.");
    }

    req.user = user; // request mein user attach karo
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(ApiError.unauthorized("Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Token expire ho gaya. Login karo."));
    }
    next(error);
  }
};

// Role check karo
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(
        `${req.user.role} role ko yeh access nahi hai`
      ));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

---

## Task 6: Auth Controller & Routes

```javascript
// src/controllers/authController.js
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Email already exists?
    const existing = await User.findOne({ email });
    if (existing) throw ApiError.conflict("Email already registered hai");

    // User banao
    const user = await User.create({ name, email, password, phone, role });
    const token = user.generateToken();

    // Password response mein mat bhejo
    const userResponse = { id: user._id, name: user.name, email: user.email, role: user.role };

    ApiResponse.created(res, { user: userResponse, token }, "Registration successful!");
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest("Email aur password daalo");
    }

    // User dhundho (password bhi chahiye)
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw ApiError.unauthorized("Galat email ya password");

    // Password check karo
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized("Galat email ya password");

    const token = user.generateToken();
    const userResponse = { id: user._id, name: user.name, email: user.email, role: user.role };

    ApiResponse.success(res, { user: userResponse, token }, "Login successful!");
  } catch (error) {
    next(error);
  }
};

// Get My Profile
exports.getMe = async (req, res, next) => {
  try {
    ApiResponse.success(res, { user: req.user });
  } catch (error) {
    next(error);
  }
};

// Update Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ["name", "phone", "address"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    ApiResponse.success(res, { user }, "Profile updated!");
  } catch (error) {
    next(error);
  }
};
```

```javascript
// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.put("/update-profile", authenticate, updateProfile);

module.exports = router;
```

---

## Task 7: App & Server Setup

```javascript
// src/app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const config = require("./config");

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Static files (uploads)
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", env: config.env });
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Server Error",
    ...(config.env === "development" && { stack: err.stack }),
  });
});

module.exports = app;
```

```javascript
// src/server.js
const app = require("./app");
const connectDB = require("./config/database");
const config = require("./config");

const startServer = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.env}]`);
  });
};

startServer();
```

> **Terminal Command:**
> ```bash
> npm run dev
> ```

> **Expected Output:**
> ```
> MongoDB connected: localhost
> Server running on port 3000 [development]
> ```

---

## Quick Revision

| Task | Kya Banaya |
|---|---|
| Project Setup | Folder structure, packages, .env |
| Config | Centralized config with validation |
| Database | MongoDB connection with mongoose |
| User Model | Schema, password hash, JWT generation |
| Auth Middleware | Token verify, role authorization |
| Auth Controller | Register, Login, Profile |
| Auth Routes | POST register/login, GET me |
| Error Handling | ApiError + ApiResponse classes |

---

## Aaj Kya Seekha?

1. Project planning se building tak ka flow samjha
2. MVC folder structure setup kiya
3. User model banaya — bcrypt hash, JWT methods
4. Auth middleware — token verify + role check
5. Complete auth system — register, login, profile
6. Error handling pattern — ApiError + ApiResponse
