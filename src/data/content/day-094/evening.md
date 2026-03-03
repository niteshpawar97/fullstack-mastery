# Day 94 Evening: Migrate JS to TypeScript — Models, Middleware, Controllers

> **Aaj ka plan:** Morning mein migration ki planning aur basic files convert kiye. Ab evening mein heavy lifting — Mongoose Models, Middleware, aur Controllers ko TypeScript mein convert karenge. Ye thoda tricky hai par ek baar samajh aa gaya toh bahut powerful hai!

---

## Mongoose Models Convert Karo

### JavaScript Model (Pehle)

```javascript
// PEHLE: src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  naam: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["kisan", "trader", "admin"], default: "kisan" },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

### TypeScript Model (Ab)

```typescript
// AB: src/models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

// Interface — document ka shape
export interface IUser extends Document {
  naam: string;
  email: string;
  phone: string;
  password: string;
  role: "kisan" | "trader" | "admin";
  isVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  // Instance methods bhi define karo
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Static methods ke liye interface
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// Schema define karo — type-safe
const userSchema = new Schema<IUser>(
  {
    naam: {
      type: String,
      required: [true, "Naam zaroori hai"],
      trim: true,
      minlength: [2, "Naam kam se kam 2 characters ka ho"]
    },
    email: {
      type: String,
      required: [true, "Email zaroori hai"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Valid email daalo"]
    },
    phone: {
      type: String,
      required: [true, "Phone number zaroori hai"]
    },
    password: {
      type: String,
      required: [true, "Password zaroori hai"],
      minlength: [6, "Password kam se kam 6 characters ka ho"],
      select: false // Query mein by default nahi aayega
    },
    role: {
      type: String,
      enum: ["kisan", "trader", "admin"],
      default: "kisan"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    avatar: {
      type: String
    }
  },
  { timestamps: true }
);

// Pre-save hook — password hash karo
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const salt: number = 10;
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method — password compare
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method — email se find karo
userSchema.statics.findByEmail = async function (
  email: string
): Promise<IUser | null> {
  return this.findOne({ email }).select("+password");
};

// Model export karo with proper types
const User = mongoose.model<IUser, IUserModel>("User", userSchema);
export default User;
```

> **Yaad Rakho:** Mongoose + TypeScript mein `IUser extends Document` zaroori hai. Ye Mongoose ko batata hai ki document ke paas kya fields aur methods hain. `IUserModel extends Model<IUser>` static methods ke liye hai.

---

## Product Model Convert Karo

```typescript
// src/models/Product.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  seller: mongoose.Types.ObjectId; // Reference to User
  rating: number;
  numReviews: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ["grain", "vegetable", "fruit", "dairy", "spice", "other"]
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Text search index
productSchema.index({ name: "text", description: "text" });

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
```

---

## Middleware Convert Karo

### Auth Middleware

```typescript
// src/middleware/auth.ts
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { AuthRequest } from "../types";

// JWT token se user verify karo
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Token header se lo
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token nahi mila — login karo pehle"
      });
      return;
    }

    // Token verify karo
    const secret: string = process.env.JWT_SECRET || "fallback";
    const decoded = jwt.verify(token, secret) as { id: string; role: string };

    // User find karo
    const user = await User.findById(decoded.id) as IUser | null;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User nahi mila — invalid token"
      });
      return;
    }

    // Request mein user attach karo
    req.user = {
      id: user._id.toString(),
      naam: user.naam,
      role: user.role as "kisan" | "trader" | "admin",
      email: user.email
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token invalid ya expire ho gaya"
    });
  }
};

// Role check middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Aapko ye action perform karne ki permission nahi hai"
      });
      return;
    }
    next();
  };
};
```

---

## Controllers Convert Karo

### User Controller

```typescript
// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";
import { generateToken } from "../utils/helpers";
import { AuthRequest, ApiResponse, CreateUserDTO, LoginDTO } from "../types";

// POST /api/v1/auth/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { naam, email, phone, password, role }: CreateUserDTO = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Is email se pehle se account hai"
      });
      return;
    }

    // Naya user banao
    const user: IUser = await User.create({
      naam,
      email,
      phone,
      password,
      role: role || "kisan"
    });

    // Token generate karo
    const token: string = generateToken(user._id.toString(), user.role);

    const response: ApiResponse<{ user: Partial<IUser>; token: string }> = {
      success: true,
      message: "Registration successful!",
      data: {
        user: {
          _id: user._id,
          naam: user.naam,
          email: user.email,
          role: user.role
        },
        token
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password }: LoginDTO = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email aur password dono zaroori hain"
      });
      return;
    }

    // User find karo with password
    const user = await User.findOne({ email }).select("+password") as IUser | null;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Email ya password galat hai"
      });
      return;
    }

    // Password compare karo
    const isMatch: boolean = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Email ya password galat hai"
      });
      return;
    }

    const token: string = generateToken(user._id.toString(), user.role);

    res.json({
      success: true,
      message: "Login successful!",
      data: { token, user: { _id: user._id, naam: user.naam, role: user.role } }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/users/profile
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const user = await User.findById(req.user.id) as IUser | null;

    if (!user) {
      res.status(404).json({ success: false, message: "User nahi mila" });
      return;
    }

    res.json({
      success: true,
      message: "Profile fetched",
      data: user
    });
  } catch (error) {
    next(error);
  }
};
```

> **Socho Aise:** Controller convert karna aise hai jaise recipe Hindi se English mein translate karna — steps same hain, bas language (types) add ho gayi. Logic nahi badla, sirf type safety aa gayi!

---

## Step 6: Gradually Strict Mode ON Karo

```json
// tsconfig.json — gradually strict options ON karo
{
  "compilerOptions": {
    // Phase 1 — pehle ye ON karo
    "noImplicitAny": true,        // "any" implicitly nahi chalega
    
    // Phase 2 — ye baad mein
    "strictNullChecks": true,     // null/undefined check zaroori
    
    // Phase 3 — final
    "strict": true                // Sab strict options ON
  }
}
```

---

## Quick Revision Table

| Component | Key Change | Tricky Part |
|-----------|-----------|-------------|
| Mongoose Model | `IUser extends Document` | Instance + Static methods types |
| Schema | `new Schema<IUser>()` | ObjectId references |
| Auth Middleware | `AuthRequest` type | jwt.verify return type casting |
| Controllers | Async + typed params | `next(error)` for error handling |
| Error Catch | `error: unknown` | `instanceof Error` check |
| Strict Mode | Gradually ON karo | `noImplicitAny` pehle |

---

## Aaj Kya Seekha?

1. **Model migration** — IUser extends Document, typed schema, typed methods
2. **Middleware migration** — AuthRequest, typed next function
3. **Controller migration** — async handlers, typed request/response
4. **Gradual strict** — step by step strict options ON karo
5. **Common patterns** — jwt.verify casting, mongoose ObjectId types
6. **Working state** — project hamesha runnable rahe during migration

> **Practice Time!** Apne KisanMart project ka ek controller pick karo aur TypeScript mein convert karo. Routes file bhi convert karo. Run karke test karo ki sab kaam kar raha hai!
