# Day 92 Evening: TypeScript — Typed Middleware, Error Handling, Request Extension

> **Aaj ka plan:** Morning mein Express + TypeScript ka basic setup kiya. Ab evening mein advanced cheezein — middleware ko type-safe banana, custom error handling, aur Request object mein apna data add karna (jaise JWT user info). Ye real production apps mein hota hai!

---

## Custom Middleware with Types

### Logger Middleware

```typescript
// src/middleware/logger.ts
import { Request, Response, NextFunction } from "express";

// Middleware ka type — Request, Response, NextFunction
const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Response finish hone pe log karo
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${res.statusCode} (${duration}ms)`
    );
  });
  
  next(); // Agle middleware pe jao
};

export default logger;
```

### Validation Middleware

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";

// Generic validation middleware — koi bhi route pe use karo
interface ValidationRule {
  field: string;
  type: "string" | "number" | "boolean" | "email";
  required: boolean;
  minLength?: number;
  maxLength?: number;
}

const validate = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Required check
      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push(`${rule.field} zaroori hai`);
        continue;
      }

      if (value === undefined) continue; // Optional aur nahi diya — skip

      // Type check
      if (rule.type === "email" && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${rule.field} valid email hona chahiye`);
        }
      } else if (typeof value !== rule.type && rule.type !== "email") {
        errors.push(`${rule.field} ka type ${rule.type} hona chahiye`);
      }

      // Length check
      if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
        errors.push(`${rule.field} kam se kam ${rule.minLength} characters ka ho`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
      return;
    }

    next();
  };
};

export default validate;

// Usage in routes:
// router.post("/", validate([
//   { field: "naam", type: "string", required: true, minLength: 2 },
//   { field: "phone", type: "string", required: true },
//   { field: "khetArea", type: "number", required: true }
// ]), createKisan);
```

> **Socho Aise:** Middleware aise hai jaise manddi ka gate — har truck (request) ko pehle check hota hai, phir andar jaane dete hain. TypeScript se wo check aur bhi strict ho jaata hai!

---

## Request Object Extend Karna

JWT authentication mein hum `req.user` mein user data daalte hain. Par TypeScript ko nahi pata ki `req.user` exist karta hai. Toh batana padta hai.

### Method 1: Declaration Merging

```typescript
// src/types/express.d.ts — Declaration file
// Express ke Request interface mein naye fields add karo

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      naam: string;
      role: "kisan" | "trader" | "admin";
      email: string;
    };
    requestId?: string;
  }
}
```

### Method 2: Custom Request Interface

```typescript
// src/types/index.ts mein add karo
import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    naam: string;
    role: "kisan" | "trader" | "admin";
    email: string;
  };
}
```

### Auth Middleware with Extended Request

```typescript
// src/middleware/auth.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

// JWT verify karke user info request mein daalo
const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Token nahi mila — pehle login karo"
    });
    return;
  }

  try {
    // JWT verify (simplified — actual mein jwt.verify use karo)
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    // Decoded data req.user mein daalo
    req.user = {
      id: "user-123",
      naam: "Ramesh Kumar",
      role: "kisan",
      email: "ramesh@example.com"
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token invalid hai ya expire ho gaya"
    });
  }
};

// Role-based access control
const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authenticate pehle" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Aapka role "${req.user.role}" — ye kaam sirf ${allowedRoles.join(", ")} kar sakta hai`
      });
      return;
    }

    next();
  };
};

export { authenticate, authorize };
```

> **Yaad Rakho:** `req.headers.authorization?.split(" ")[1]` mein `?` optional chaining hai. Agar authorization header nahi hai toh undefined return hoga, error nahi aayega.

---

## Custom Error Handling

### Custom Error Classes

```typescript
// src/utils/AppError.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Ye planned error hai, crash nahi

    // Prototype chain fix karo
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Specific error classes
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} nahi mila`, 404);
  }
}

export class ValidationError extends AppError {
  errors: string[];
  
  constructor(errors: string[]) {
    super("Validation failed", 400);
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authenticate pehle karo") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Aapko ye karne ki permission nahi hai") {
    super(message, 403);
  }
}
```

### Global Error Handler Middleware

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
  errors?: string[];
}

const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let message = "Server mein kuch gadbad ho gayi";

  // AppError check — humara custom error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Response banao
  const response: ErrorResponse = {
    success: false,
    message
  };

  // Development mein zyada info do
  if (process.env.NODE_ENV === "development") {
    response.error = err.message;
    response.stack = err.stack;
  }

  // Validation error ke liye extra info
  if ("errors" in err) {
    response.errors = (err as any).errors;
  }

  console.error(`[ERROR] ${statusCode} — ${message}`);
  res.status(statusCode).json(response);
};

export default errorHandler;
```

### Controller Mein Error Use Karo

```typescript
// Controller mein — clean error handling
import { NotFoundError, ValidationError } from "../utils/AppError";

export const getKisanById = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const kisan = kisans.find(k => k._id === id);

    if (!kisan) {
      throw new NotFoundError("Kisan");
      // Ye errorHandler middleware mein jayega
    }

    res.json({ success: true, data: kisan });
  } catch (error) {
    next(error); // Error middleware ko bhejo
  }
};
```

---

## Async Handler Wrapper

```typescript
// src/middleware/asyncHandler.ts
import { Request, Response, NextFunction } from "express";

// Async functions ke liye try-catch wrapper
// Har controller mein try-catch likhne ki zaroorat nahi
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;

// Usage:
// export const getAllKisans = asyncHandler(async (req, res, next) => {
//   const kisans = await KisanModel.find();
//   res.json({ success: true, data: kisans });
// });
// Koi bhi error automatically error middleware mein jayega!
```

> **Tip:** `asyncHandler` pattern use karo har async controller ke liye. Isse har jagah try-catch nahi likhna padta — cleaner code!

---

## App.ts — Sab Jodo

```typescript
// src/app.ts — Complete version
import express, { Application } from "express";
import dotenv from "dotenv";
import logger from "./middleware/logger";
import errorHandler from "./middleware/errorHandler";
import kisanRoutes from "./routes/kisan.routes";

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000");

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger); // Har request log hogi

// Routes
app.use("/api/v1/kisans", kisanRoutes);

// 404 handler — koi route match nahi hua
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} nahi mili`
  });
});

// Global error handler — sabse last mein
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

---

## Quick Revision Table

| Concept | Kya Karta Hai | File |
|---------|--------------|------|
| Logger middleware | Request log karta hai | `middleware/logger.ts` |
| Validation middleware | Input validate karta hai | `middleware/validate.ts` |
| Auth middleware | JWT verify + role check | `middleware/auth.ts` |
| Request extend | `req.user` add karna | `types/express.d.ts` |
| AppError class | Custom error classes | `utils/AppError.ts` |
| Error handler | Global error middleware | `middleware/errorHandler.ts` |
| Async handler | Try-catch wrapper | `middleware/asyncHandler.ts` |

---

## Aaj Kya Seekha?

1. **Typed middleware** — Request, Response, NextFunction types use karo
2. **Validation middleware** — generic rules-based validation banao
3. **Request extend** — declaration merging se `req.user` add karo
4. **Auth middleware** — JWT verify + role-based access TypeScript mein
5. **Custom errors** — AppError class hierarchy banao
6. **Error handler** — global error middleware with proper types
7. **Async handler** — try-catch wrapper pattern

> **Practice Time!** Apne KisanMart project mein ek rate limiter middleware banao TypeScript mein — jo `req.ip` se track kare ki kitne requests aa rahe hain!
