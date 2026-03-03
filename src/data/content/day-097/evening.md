# Day 97 Evening: Typed Task Manager API — Mini Project (REVISION)

> **Aaj ka plan:** Ab poora TypeScript knowledge use karke ek complete **Typed Task Manager API** banayenge! Express + TypeScript + Mongoose + Zod — sab ek saath. Jaise kisan apni poori fasal ek saath manddi mein le jaata hai — waise hum sab TS concepts ek project mein!

---

## Project Setup

> **Terminal Command:**
```bash
# Project folder banao
mkdir typed-task-manager && cd typed-task-manager
npm init -y

# Dependencies install karo
npm install express mongoose dotenv zod
npm install --save-dev typescript ts-node-dev @types/express @types/node

# TypeScript init
npx tsc --init
```

### Folder Structure

```
typed-task-manager/
├── src/
│   ├── config/
│   │   └── db.ts              # MongoDB connection
│   ├── models/
│   │   └── Task.ts            # Mongoose typed model
│   ├── schemas/
│   │   └── task.schema.ts     # Zod validation
│   ├── routes/
│   │   └── task.routes.ts     # Express routes
│   ├── controllers/
│   │   └── task.controller.ts # Route handlers
│   ├── middleware/
│   │   └── validate.ts        # Zod middleware
│   ├── types/
│   │   └── index.ts           # Shared types
│   └── index.ts               # Entry point
├── tsconfig.json
├── .env
└── package.json
```

---

## Step 1: Types Define Karo

```typescript
// src/types/index.ts — Shared types for entire project

// Task priority levels
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Task status lifecycle
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  DONE = "done",
  CANCELLED = "cancelled",
}

// Base task interface — plain data
export interface ITaskBase {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  tags: string[];
  isCompleted: boolean;
}

// API response wrapper — generic
export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  count?: number;
}

// Pagination query params
export interface IPaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

// Filter query params
export interface ITaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  isCompleted?: string;   // "true" / "false" — query mein string aata hai
  tag?: string;
}
```

> **Yaad Rakho:** Types ko alag file mein rakhne se poore project mein reuse hoti hain. Single source of truth — ek jagah change karo, sab jagah reflect ho!

---

## Step 2: Mongoose Typed Model

```typescript
// src/models/Task.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { ITaskBase, TaskPriority, TaskStatus } from "../types";

// Document interface — Mongoose document + base data
export interface ITaskDocument extends ITaskBase, Document {
  createdAt: Date;
  updatedAt: Date;
  // Instance method
  markAsComplete(): Promise<ITaskDocument>;
}

// Model interface — static methods
export interface ITaskModel extends Model<ITaskDocument> {
  findOverdue(): Promise<ITaskDocument[]>;
  getStatusCounts(): Promise<Record<TaskStatus, number>>;
}

// Schema define karo — typed!
const taskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, "Title zaroori hai"],
      trim: true,
      maxlength: [200, "Title 200 characters se zyada nahi"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [2000, "Description 2000 characters se zyada nahi"],
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date zaroori hai"],
    },
    tags: {
      type: [String],
      default: [],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automatic
  },
);

// Instance method — task complete karo
taskSchema.methods.markAsComplete = async function (): Promise<ITaskDocument> {
  this.isCompleted = true;
  this.status = TaskStatus.DONE;
  return this.save();
};

// Static method — overdue tasks dhundho
taskSchema.statics.findOverdue = async function (): Promise<ITaskDocument[]> {
  return this.find({
    dueDate: { $lt: new Date() },
    isCompleted: false,
    status: { $ne: TaskStatus.CANCELLED },
  }).sort({ dueDate: 1 });
};

// Static method — status wise count
taskSchema.statics.getStatusCounts = async function (): Promise<
  Record<string, number>
> {
  const counts = await this.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  // Array ko object mein convert karo
  const result: Record<string, number> = {};
  counts.forEach((item: { _id: string; count: number }) => {
    result[item._id] = item.count;
  });
  return result;
};

// Index for common queries
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ tags: 1 });

const Task = mongoose.model<ITaskDocument, ITaskModel>("Task", taskSchema);
export default Task;
```

---

## Step 3: Zod Validation Schemas

```typescript
// src/schemas/task.schema.ts
import { z } from "zod";
import { TaskPriority, TaskStatus } from "../types";

// Create task validation
export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Title zaroori hai" })
      .min(1, "Title khali nahi ho sakta")
      .max(200, "Title 200 characters se zyada nahi"),
    description: z.string().max(2000).optional().default(""),
    priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
    dueDate: z
      .string({ required_error: "Due date zaroori hai" })
      .datetime("Valid ISO date do"),
    tags: z.array(z.string()).optional().default([]),
  }),
});

// Update task validation — sab optional
export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    isCompleted: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Valid MongoDB ID do"),
  }),
});

// Types infer karo — DRY!
export type CreateTaskInput = z.infer<typeof createTaskSchema>["body"];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>["body"];
```

---

## Step 4: Validation Middleware

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

// Generic Zod validation middleware
export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod errors ko readable format mein bhejo
        const errors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
        return;
      }
      next(error);
    }
  };
```

---

## Step 5: Controllers

```typescript
// src/controllers/task.controller.ts
import { Request, Response } from "express";
import Task, { ITaskDocument } from "../models/Task";
import { IApiResponse, ITaskFilters, IPaginationQuery } from "../types";
import { CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema";

// CREATE task
export const createTask = async (
  req: Request<{}, {}, CreateTaskInput>,
  res: Response<IApiResponse<ITaskDocument>>,
): Promise<void> => {
  const task = await Task.create({
    ...req.body,
    dueDate: new Date(req.body.dueDate), // string to Date
  });
  res.status(201).json({
    success: true,
    data: task,
    message: "Task created successfully!",
  });
};

// GET ALL tasks with filters + pagination
export const getAllTasks = async (
  req: Request<{}, {}, {}, IPaginationQuery & ITaskFilters>,
  res: Response<IApiResponse<ITaskDocument[]>>,
): Promise<void> => {
  const { page = "1", limit = "10", sortBy = "createdAt", order = "desc" } = req.query;
  const { status, priority, isCompleted, tag } = req.query;

  // Filter build karo — typed!
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (isCompleted) filter.isCompleted = isCompleted === "true";
  if (tag) filter.tags = tag;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === "asc" ? 1 : -1;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limitNum),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: tasks,
    message: `${total} tasks found`,
    count: total,
  });
};

// GET task by ID
export const getTaskById = async (
  req: Request<{ id: string }>,
  res: Response<IApiResponse<ITaskDocument | null>>,
): Promise<void> => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404).json({
      success: false,
      data: null,
      message: "Task nahi mila!",
    });
    return;
  }
  res.json({ success: true, data: task, message: "Task found" });
};

// UPDATE task
export const updateTask = async (
  req: Request<{ id: string }, {}, UpdateTaskInput>,
  res: Response<IApiResponse<ITaskDocument | null>>,
): Promise<void> => {
  const updates: Record<string, unknown> = { ...req.body };
  if (req.body.dueDate) {
    updates.dueDate = new Date(req.body.dueDate);
  }
  const task = await Task.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!task) {
    res.status(404).json({ success: false, data: null, message: "Task nahi mila!" });
    return;
  }
  res.json({ success: true, data: task, message: "Task updated!" });
};

// DELETE task
export const deleteTask = async (
  req: Request<{ id: string }>,
  res: Response<IApiResponse<null>>,
): Promise<void> => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    res.status(404).json({ success: false, data: null, message: "Task nahi mila!" });
    return;
  }
  res.json({ success: true, data: null, message: "Task deleted!" });
};

// GET overdue tasks — static method use
export const getOverdueTasks = async (
  _req: Request,
  res: Response<IApiResponse<ITaskDocument[]>>,
): Promise<void> => {
  const tasks = await Task.findOverdue();
  res.json({
    success: true,
    data: tasks,
    message: `${tasks.length} overdue tasks`,
    count: tasks.length,
  });
};

// GET status counts — aggregation
export const getStatusCounts = async (
  _req: Request,
  res: Response<IApiResponse<Record<string, number>>>,
): Promise<void> => {
  const counts = await Task.getStatusCounts();
  res.json({ success: true, data: counts, message: "Status counts" });
};
```

> **Socho Aise:** Har controller typed hai — Request ka body, params, query sab typed. Response bhi typed. Koi galti se wrong data return kare toh TypeScript compile time pe pakad lega!

---

## Step 6: Routes + Entry Point

```typescript
// src/routes/task.routes.ts
import { Router } from "express";
import { validate } from "../middleware/validate";
import { createTaskSchema, updateTaskSchema } from "../schemas/task.schema";
import * as taskController from "../controllers/task.controller";

const router = Router();

router.get("/", taskController.getAllTasks);
router.get("/overdue", taskController.getOverdueTasks);
router.get("/stats", taskController.getStatusCounts);
router.get("/:id", taskController.getTaskById);
router.post("/", validate(createTaskSchema), taskController.createTask);
router.put("/:id", validate(updateTaskSchema), taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
```

```typescript
// src/index.ts — Entry point
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import taskRoutes from "./routes/task.routes";

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);
const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/task-manager";

// Middleware
app.use(express.json());

// Routes
app.use("/api/tasks", taskRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected!");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
};

startServer();
```

> **Expected Output:**
```
MongoDB connected!
Server running on port 3000
```

---

## Quick Revision Table

| Layer | File | TypeScript Feature Used |
|-------|------|------------------------|
| Types | `types/index.ts` | Enums, Interfaces, Generics |
| Model | `models/Task.ts` | Document interface, Model interface |
| Schema | `schemas/task.schema.ts` | Zod + `z.infer` |
| Middleware | `middleware/validate.ts` | Generic function, ZodError |
| Controller | `controllers/task.controller.ts` | Typed Request/Response |
| Routes | `routes/task.routes.ts` | Router typing |
| Entry | `index.ts` | async/await typed |

---

## Aaj Kya Seekha?

1. **Full TypeScript project** — end-to-end typed Express + Mongoose API
2. **Typed Mongoose model** — Document + Model interfaces, methods, statics
3. **Zod validation** — runtime validation with compile-time type inference
4. **Typed controllers** — Request generics for body, params, query
5. **Generic API response** — `IApiResponse<T>` for consistent responses
6. **Enum-driven design** — TaskPriority, TaskStatus as enums
7. **Mini project complete** — Typed Task Manager ready to test!

> **Practice Time!** Kal se GraphQL shuru hoga! Aaj ye Task Manager API run karo, Postman se test karo, aur koi bhi `any` use hua ho toh hata do. TypeScript week complete!
