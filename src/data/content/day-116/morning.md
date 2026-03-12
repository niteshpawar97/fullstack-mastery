# Day 116 Morning: Advanced Error Handling — Operational vs Programmer Errors

> **Aaj ka plan:** Aaj hum production-grade error handling seekhenge. Do tarah ki errors hoti hain — Operational (expected) aur Programmer (bugs). Phir Circuit Breaker pattern implement karenge jo tumhare system ko cascading failures se bachata hai.

---

## Error Ki Do Duniyayein

### Operational Errors vs Programmer Errors

```
┌─────────────────────────────────────────────────────┐
│              ERRORS KI DUNIYA                        │
├──────────────────────┬──────────────────────────────┤
│  OPERATIONAL         │  PROGRAMMER                   │
│  (Expected problems) │  (Bugs in code)               │
├──────────────────────┼──────────────────────────────┤
│  DB connection fail  │  undefined.property access    │
│  API timeout         │  Wrong function arguments     │
│  Invalid user input  │  Missing await                │
│  File not found      │  Type mismatch                │
│  Network error       │  Logic error in algorithm     │
├──────────────────────┼──────────────────────────────┤
│  HANDLE gracefully   │  FIX the code                 │
│  Retry / Fallback    │  Crash + Log + Deploy fix     │
└──────────────────────┴──────────────────────────────┘
```

> **Yaad Rakho:** Operational errors handle karo gracefully — retry, fallback, user ko proper message do. Programmer errors ka solution hai — code fix karo, crash hone do taaki pata chale bug hai!

---

## Custom Error Classes — Professional Approach

```typescript
// errors/AppError.ts — Base error class banao
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean; // Ye key differentiator hai
  public readonly errorCode: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true // Default operational hai
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// Specific error types — har ek ka apna matlab
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(
      `${resource} with id ${id} not found`, // Descriptive message
      404,
      'RESOURCE_NOT_FOUND',
      true // Operational — ye expected hai
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_FAILED', true);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 503, 'DATABASE_ERROR', true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(serviceName: string, originalError: Error) {
    super(
      `${serviceName} service failed: ${originalError.message}`,
      502,
      'EXTERNAL_SERVICE_FAILED',
      true
    );
  }
}
```

> **Socho Aise:** Jaise hospital mein patients ko categories mein divide karte hain — Emergency, General, ICU — waise hi errors ko categories mein rakho. Har category ka treatment alag hota hai!

---

## Global Error Handler — Ek Jagah Se Sab Handle

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Agar hamari custom AppError hai toh
  if (err instanceof AppError) {
    // Operational error — gracefully handle karo
    if (err.isOperational) {
      logger.warn({
        errorCode: err.errorCode,
        message: err.message,
        path: req.path,
        method: req.method,
      });

      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.errorCode,
          message: err.message,
        },
      });
    }
  }

  // Programmer error ya unknown error — ye serious hai!
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // Production mein stack trace mat bhejo user ko
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error' // Generic message user ke liye
      : err.message;            // Dev mein actual error dikhao

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
}
```

> **Warning:** Production mein KABHI bhi stack trace ya internal error details user ko mat bhejo. Hackers ko information mil jaati hai. Sirf generic "Internal server error" bhejo!

---

## Uncaught Exceptions & Unhandled Rejections

```typescript
// app.ts — Process level errors pakdo
// Ye tab trigger hota hai jab koi synchronous error catch nahi hua
process.on('uncaughtException', (error: Error) => {
  logger.fatal({
    type: 'UNCAUGHT_EXCEPTION',
    message: error.message,
    stack: error.stack,
  });

  // Graceful shutdown — connections close karo, phir exit
  gracefulShutdown('uncaughtException').then(() => {
    process.exit(1); // Non-zero exit code — process manager restart karega
  });
});

// Ye tab trigger hota hai jab koi Promise reject ho aur .catch na ho
process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({
    type: 'UNHANDLED_REJECTION',
    reason: reason instanceof Error ? reason.message : String(reason),
  });

  // Same treatment — crash karo taaki PM2/Docker restart kare
  gracefulShutdown('unhandledRejection').then(() => {
    process.exit(1);
  });
});

// Graceful shutdown function — connections band karo orderly
async function gracefulShutdown(signal: string) {
  logger.info(`Graceful shutdown started — reason: ${signal}`);

  // Naye requests band karo
  server.close();

  // DB connections close karo
  await mongoose.connection.close();

  // Redis disconnect karo
  await redisClient.quit();

  logger.info('Graceful shutdown complete');
}
```

> **Tip:** PM2 ya Docker use karte ho toh process crash hone pe automatic restart hota hai. Isliye programmer errors pe crash karna safe hai — system recover ho jaata hai!

---

## Retry with Exponential Backoff

```typescript
// utils/retry.ts — Smart retry mechanism
interface RetryOptions {
  maxRetries: number;     // Kitni baar try karein
  baseDelay: number;      // Pehli baar kitna wait (ms)
  maxDelay: number;       // Maximum wait time (ms)
  backoffFactor: number;  // Har baar kitna multiply karein
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,          // Jo function retry karna hai
  options: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,      // 1 second
    maxDelay: 30000,      // 30 seconds max
    backoffFactor: 2,     // Har baar double
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn(); // Try karo — success pe return
    } catch (error: any) {
      lastError = error;

      // Kya ye retryable error hai?
      if (!isRetryable(error)) {
        throw error; // Non-retryable toh seedha throw karo
      }

      if (attempt === options.maxRetries) {
        break; // Last attempt fail — ab throw karenge
      }

      // Delay calculate karo — exponential + jitter
      const delay = Math.min(
        options.baseDelay * Math.pow(options.backoffFactor, attempt) +
          Math.random() * 1000, // Jitter — sab clients ek saath retry na karein
        options.maxDelay
      );

      console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

// Kaunse errors retry karne laayak hain?
function isRetryable(error: any): boolean {
  // Network errors — haan retry karo
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
  // 5xx server errors — haan retry karo
  if (error.response?.status >= 500) return true;
  // 429 Too Many Requests — haan, thoda wait karke retry karo
  if (error.response?.status === 429) return true;
  // 4xx client errors — nahi, tumhara request hi galat hai
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

> **Socho Aise:** Retry ka pattern aise samjho — phone pe call kiya, busy hai. 1 second baad try karo. Phir 2 second. Phir 4 second. Phir 8 second. Agar 5 baar baad bhi busy hai toh chod do — "service unavailable" bol do!

---

## Quick Revision Table

| Concept | Kya Hai | Kab Use Karein |
|---------|---------|----------------|
| Operational Error | Expected failures (network, DB) | Gracefully handle karo |
| Programmer Error | Code bugs | Fix karo, crash hone do |
| AppError class | Custom error hierarchy | Har error categorize karo |
| Global handler | Ek centralized error catcher | Express middleware mein |
| Uncaught Exception | Sync error catch nahi hua | Process exit + restart |
| Unhandled Rejection | Promise reject without catch | Process exit + restart |
| Exponential Backoff | Retry with increasing delay | External service calls |
| Jitter | Random delay added | Thundering herd se bachne ke liye |

---

## Aaj Kya Seekha?

1. **Operational errors** expected hain — gracefully handle karo (retry, fallback, user message)
2. **Programmer errors** bugs hain — code fix karo, crash hone do taaki pata chale
3. **Custom AppError class** se errors categorize karo — `isOperational` flag se differentiate karo
4. **Global error handler** ek jagah pe sabhi errors handle karta hai — clean aur consistent
5. **Exponential backoff + jitter** se retry karo — server pe load reduce hota hai

> **Practice Time!** Apne Express app mein custom AppError classes banao (NotFoundError, ValidationError, DatabaseError). Global error handler middleware lagao. Ek route mein deliberately error throw karo aur dekho response kaise aata hai!
