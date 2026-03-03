# Day 92 Morning: TypeScript with Node.js + Express Setup

> **Aaj ka plan:** Kal TypeScript ke basics seekhe — types, interfaces, enums. Aaj hum TypeScript ko Node.js aur Express ke saath use karenge! Real backend project mein TypeScript kaise lagta hai — wo aaj seekhenge. Jaise tractor mein naya engine lagana — same kaam, par zyada powerful!

---

## TypeScript + Node.js Project Setup

### Step 1: Project Initialize Karo

> **Terminal Command:**
```bash
# Naya project banao
mkdir kisanmart-ts && cd kisanmart-ts
npm init -y

# TypeScript + Node types install karo
npm install typescript ts-node @types/node --save-dev

# Express + types install karo
npm install express
npm install @types/express --save-dev

# Dotenv for environment variables
npm install dotenv
npm install @types/dotenv --save-dev

# Nodemon for auto-restart
npm install nodemon --save-dev
```

### Step 2: tsconfig.json Configure Karo

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "watch": "tsc --watch"
  }
}
```

> **Yaad Rakho:** `ts-node` directly TypeScript run karta hai bina compile kiye — development ke liye. Production mein pehle `tsc` se compile karo, phir `node dist/app.js` se run karo.

---

## Folder Structure

```
kisanmart-ts/
├── src/
│   ├── app.ts                  # Entry point
│   ├── config/
│   │   └── database.ts         # DB connection
│   ├── controllers/
│   │   └── kisan.controller.ts # Route handlers
│   ├── middleware/
│   │   └── errorHandler.ts     # Error middleware
│   ├── models/
│   │   └── kisan.model.ts      # Mongoose models
│   ├── routes/
│   │   └── kisan.routes.ts     # Express routes
│   ├── types/
│   │   └── index.ts            # Custom type definitions
│   └── utils/
│       └── helpers.ts          # Utility functions
├── dist/                        # Compiled JS (auto generated)
├── tsconfig.json
├── package.json
└── .env
```

---

## Express App TypeScript Mein

### Entry Point — app.ts

```typescript
// src/app.ts
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";

// Environment variables load karo
dotenv.config();

// Express app banao — type Application
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || "5000");

// Middleware — body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route — typed Request aur Response
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "KisanMart TypeScript API chal rahi hai!",
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Server start karo
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} pe`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
```

> **Socho Aise:** Pehle JavaScript mein `const app = express()` likhte the — TypeScript mein `const app: Application = express()` likhte hain. Bas itna farak hai — lekin ab editor tumhe har method ka suggestion dega!

---

## Custom Types Define Karo

### types/index.ts

```typescript
// src/types/index.ts

// API Response ka standard format
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;              // Generic — koi bhi type ho sakta hai
  error?: string;
  pagination?: PaginationInfo;
}

// Pagination info
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Kisan interface
export interface IKisan {
  _id?: string;
  naam: string;
  phone: string;
  gaon: string;
  district: string;
  state: string;
  khetArea: number;
  fasalList: string[];
  isOrganic: boolean;
  isVerified: boolean;
  rating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create Kisan — kuch fields optional hain
export interface CreateKisanInput {
  naam: string;
  phone: string;
  gaon: string;
  district: string;
  state: string;
  khetArea: number;
  fasalList?: string[];
  isOrganic?: boolean;
}

// Update Kisan — sab fields optional (Partial jaisa)
export interface UpdateKisanInput {
  naam?: string;
  phone?: string;
  gaon?: string;
  district?: string;
  state?: string;
  khetArea?: number;
  fasalList?: string[];
  isOrganic?: boolean;
}

// Query params for filtering
export interface KisanQueryParams {
  page?: number;
  limit?: number;
  state?: string;
  isOrganic?: boolean;
  sortBy?: string;
  order?: "asc" | "desc";
}

// Environment variables ka type
export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
}
```

> **Tip:** Ek `types/` folder banao aur sabhi custom types yahan rakho. Ye clean code ka rule hai — types alag, logic alag.

---

## Typed Routes Banao

### routes/kisan.routes.ts

```typescript
// src/routes/kisan.routes.ts
import { Router } from "express";
import {
  getAllKisans,
  getKisanById,
  createKisan,
  updateKisan,
  deleteKisan
} from "../controllers/kisan.controller";

const router: Router = Router();

// CRUD routes — typed controllers use honge
router.get("/", getAllKisans);
router.get("/:id", getKisanById);
router.post("/", createKisan);
router.put("/:id", updateKisan);
router.delete("/:id", deleteKisan);

export default router;
```

### App mein Routes Register Karo

```typescript
// src/app.ts mein add karo
import kisanRoutes from "./routes/kisan.routes";

// Routes mount karo
app.use("/api/v1/kisans", kisanRoutes);
```

---

## Typed Controllers

### controllers/kisan.controller.ts

```typescript
// src/controllers/kisan.controller.ts
import { Request, Response } from "express";
import { ApiResponse, IKisan, CreateKisanInput } from "../types";

// Dummy data — baad mein MongoDB se aayega
let kisans: IKisan[] = [
  {
    _id: "1",
    naam: "Ramesh Kumar",
    phone: "9876543210",
    gaon: "Sultanpur",
    district: "Sultanpur",
    state: "UP",
    khetArea: 5.5,
    fasalList: ["Gehun", "Chawal"],
    isOrganic: true,
    isVerified: true,
    rating: 4.5
  }
];

// GET /api/v1/kisans — Sabhi kisans lao
export const getAllKisans = (req: Request, res: Response): void => {
  const response: ApiResponse<IKisan[]> = {
    success: true,
    message: "Sabhi kisans mil gaye",
    data: kisans
  };
  res.json(response);
};

// GET /api/v1/kisans/:id — Ek kisan lao
export const getKisanById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const kisan = kisans.find(k => k._id === id);

  if (!kisan) {
    const response: ApiResponse = {
      success: false,
      message: "Kisan nahi mila",
      error: `ID ${id} se koi kisan nahi hai`
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<IKisan> = {
    success: true,
    message: "Kisan mil gaya",
    data: kisan
  };
  res.json(response);
};

// POST /api/v1/kisans — Naya kisan banao
export const createKisan = (req: Request, res: Response): void => {
  const input: CreateKisanInput = req.body;

  // Validation — TypeScript compile time pe check karta hai
  // Runtime pe bhi check zaroori hai
  if (!input.naam || !input.phone) {
    res.status(400).json({
      success: false,
      message: "Naam aur phone zaroori hai"
    });
    return;
  }

  const newKisan: IKisan = {
    _id: String(Date.now()),
    naam: input.naam,
    phone: input.phone,
    gaon: input.gaon,
    district: input.district,
    state: input.state,
    khetArea: input.khetArea,
    fasalList: input.fasalList || [],
    isOrganic: input.isOrganic || false,
    isVerified: false,
    rating: 0
  };

  kisans.push(newKisan);

  const response: ApiResponse<IKisan> = {
    success: true,
    message: "Naya kisan register ho gaya!",
    data: newKisan
  };
  res.status(201).json(response);
};

// PUT /api/v1/kisans/:id — Kisan update karo
export const updateKisan = (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = kisans.findIndex(k => k._id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: "Kisan nahi mila" });
    return;
  }

  kisans[index] = { ...kisans[index], ...req.body };
  res.json({ success: true, message: "Kisan updated", data: kisans[index] });
};

// DELETE /api/v1/kisans/:id — Kisan delete karo
export const deleteKisan = (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = kisans.findIndex(k => k._id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: "Kisan nahi mila" });
    return;
  }

  kisans.splice(index, 1);
  res.json({ success: true, message: "Kisan delete ho gaya" });
};
```

---

## Quick Revision Table

| Concept | JavaScript Mein | TypeScript Mein |
|---------|----------------|-----------------|
| App create | `const app = express()` | `const app: Application = express()` |
| Route handler | `(req, res) => {}` | `(req: Request, res: Response): void => {}` |
| Types file | Nahi hota | `src/types/index.ts` |
| Compile | Direct run | `tsc` se compile, phir run |
| Dev run | `nodemon app.js` | `nodemon --exec ts-node src/app.ts` |
| Type packages | Nahi chahiye | `@types/express`, `@types/node` |

---

## Aaj Kya Seekha?

1. **TS + Node setup** — typescript, ts-node, @types packages install karo
2. **tsconfig.json** — strict mode, outDir, rootDir configure karo
3. **Express app** — Application, Request, Response types import karo
4. **Custom types** — types/ folder mein interfaces define karo
5. **Typed routes** — Router type use karo
6. **Typed controllers** — Request, Response typed, ApiResponse generic

> **Practice Time!** Evening mein typed middleware, error handling, aur Request ko extend karna seekhenge. Abhi tak ka code run karo — `npm run dev` se!
