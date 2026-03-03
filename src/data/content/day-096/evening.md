# Day 96 Evening: ESLint + Prettier with TypeScript — Clean Code Setup

> **Aaj ka plan:** Ab hum apne TypeScript project mein ESLint aur Prettier setup karenge. Linting + formatting = clean, consistent, bug-free code! Jaise manddi mein grading system hota hai fasal ke liye — ESLint tumhare code ko grade karta hai!

---

## ESLint Kya Hai? Prettier Kya Hai?

```
ESLint:
- Code QUALITY check karta hai
- Bugs pakadta hai (unused vars, no-any, etc.)
- Rules define karte ho — follow nahi kiya toh ERROR
- "Ye code galat hai" bolta hai

Prettier:
- Code FORMATTING karta hai
- Tabs vs spaces, semicolons, quotes — sab consistent
- Opinionated — ek hi style force karta hai
- "Ye code ugly hai" bolta hai aur fix kar deta hai
```

> **Socho Aise:** ESLint police hai — galti pakadti hai. Prettier barber hai — code ko clean trim deta hai. Dono saath mein kaam karein toh code ekdum first class!

---

## Step 1: Install Dependencies

> **Terminal Command:**
```bash
# ESLint + TypeScript plugin
npm install --save-dev eslint @eslint/js typescript-eslint

# Prettier + ESLint integration
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier

# Type definitions (agar zaroorat ho)
npm install --save-dev @types/node
```

---

## Step 2: ESLint Flat Config — eslint.config.mjs

```javascript
// eslint.config.mjs — ESLint v9+ flat config
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // Base JS rules
  eslint.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommendedTypeChecked,

  // Prettier conflict disable karo
  prettierConfig,

  // ========== CUSTOM RULES ==========
  {
    languageOptions: {
      parserOptions: {
        project: true,             // tsconfig.json automatically pick
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ===== NO ANY — MOST IMPORTANT =====
      "@typescript-eslint/no-explicit-any": "error",   // any likhna = ERROR
      "@typescript-eslint/no-unsafe-assignment": "error", // any assign = ERROR
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",

      // ===== TYPE SAFETY =====
      "@typescript-eslint/explicit-function-return-type": "warn", // Return type likho
      "@typescript-eslint/no-floating-promises": "error",         // await bhoolna = ERROR
      "@typescript-eslint/no-misused-promises": "error",          // Promise galat use
      "@typescript-eslint/strict-boolean-expressions": "warn",    // if(value) pe strict

      // ===== CLEAN CODE =====
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",       // _req, _next allowed
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "interface", format: ["PascalCase"], prefix: ["I"] },
        { selector: "typeAlias", format: ["PascalCase"] },
        { selector: "enum", format: ["PascalCase"] },
        { selector: "enumMember", format: ["UPPER_CASE"] },
      ],

      // ===== BEST PRACTICES =====
      "@typescript-eslint/prefer-nullish-coalescing": "warn",  // ?? use karo
      "@typescript-eslint/prefer-optional-chain": "warn",      // ?. use karo
      "no-console": ["warn", { allow: ["warn", "error"] }],   // console.log hatao
    },
  },

  // ===== TEST FILES — RELAXED RULES =====
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",   // Tests mein any chalega
      "no-console": "off",
    },
  },

  // ===== IGNORE PATTERNS =====
  {
    ignores: ["dist/", "node_modules/", "*.js", "coverage/"],
  }
);
```

> **Yaad Rakho:** ESLint v9 mein flat config use hota hai (`eslint.config.mjs`). Purana `.eslintrc.json` deprecated hai. Hamesha naye projects mein flat config use karo!

---

## Step 3: Prettier Config — .prettierrc

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### .prettierignore

```
dist/
node_modules/
coverage/
*.md
```

---

## Step 4: package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/",
    "typecheck": "tsc --noEmit",
    "check:all": "npm run typecheck && npm run lint && npm run format:check",
    "build": "tsc",
    "dev": "ts-node-dev --respawn src/index.ts"
  }
}
```

> **Terminal Command:**
```bash
# Sab checks ek saath chalao
npm run check:all

# Auto fix karo
npm run lint:fix && npm run format
```

---

## No-Any Rule — Deep Dive

```typescript
// ===== BAD: any ka use =====

// 1. Function param mein any — GALAT
function processData(data: any) {    // ESLint ERROR!
  return data.name;                  // Unsafe member access
}

// 2. Variable mein any — GALAT
const response: any = await fetch(); // ESLint ERROR!

// 3. Return type any — GALAT
function getData(): any {            // ESLint ERROR!
  return { naam: "Ramu" };
}

// ===== GOOD: Proper types =====

// 1. Interface define karo
interface IKisanData {
  naam: string;
  phone: string;
}

function processData(data: IKisanData): string {
  return data.naam;   // Type-safe!
}

// 2. Generic use karo jab type pata nahi
function parseJSON<T>(json: string): T {
  return JSON.parse(json) as T;
}
const kisan = parseJSON<IKisanData>('{"naam":"Ramu","phone":"9876543210"}');

// 3. unknown use karo any ki jagah
function safeProcess(data: unknown): string {
  // Type guard ZAROORI hai unknown ke saath
  if (typeof data === "object" && data !== null && "naam" in data) {
    return (data as IKisanData).naam;
  }
  return "Unknown";
}
```

> **Warning:** `any` TypeScript ka sabse bada dushman hai. Jab bhi `any` likhne ka mann kare — sochho: "Kya main interface bana sakta hoon? Generic use kar sakta hoon? `unknown` chalega?" 99% time answer haan hoga!

---

## Husky + lint-staged — Pre-commit Hooks

> **Terminal Command:**
```bash
# Husky install karo — git hooks manage
npm install --save-dev husky lint-staged
npx husky init

# .husky/pre-commit file automatically banega
```

### .husky/pre-commit

```bash
npx lint-staged
```

### package.json mein lint-staged

```json
{
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

> **Tip:** Husky + lint-staged ka matlab — jab bhi `git commit` karo, sirf changed files pe ESLint + Prettier chalega. Galat code commit hone se pehle pakda jaayega!

---

## VS Code Settings — Auto Fix on Save

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

---

## TS Project Template — Complete Structure

```
my-ts-project/
├── src/
│   ├── config/
│   │   └── index.ts          # Environment config
│   ├── middleware/
│   │   ├── auth.ts           # JWT auth middleware
│   │   ├── validate.ts       # Zod validation
│   │   └── errorHandler.ts   # Global error handler
│   ├── models/
│   │   └── Kisan.ts          # Mongoose typed model
│   ├── routes/
│   │   └── kisan.routes.ts   # Express routes
│   ├── services/
│   │   └── kisan.service.ts  # Business logic
│   ├── types/
│   │   ├── index.d.ts        # Global type declarations
│   │   └── express.d.ts      # Express type augmentation
│   ├── utils/
│   │   └── ApiResponse.ts    # Standard response helper
│   └── index.ts              # Entry point
├── dist/                      # Compiled output
├── tsconfig.json
├── eslint.config.mjs
├── .prettierrc
├── .prettierignore
├── .env
├── .gitignore
└── package.json
```

---

## Quick Revision Table

| Tool | Kya Karta Hai | Config File |
|------|--------------|-------------|
| ESLint | Code quality + bugs | `eslint.config.mjs` |
| Prettier | Code formatting | `.prettierrc` |
| `eslint-config-prettier` | Conflicts resolve | ESLint config mein |
| `no-explicit-any` | any ban karo | ESLint rule |
| `no-floating-promises` | await bhoolna pakdo | ESLint rule |
| Husky | Git hooks manage | `.husky/pre-commit` |
| lint-staged | Sirf changed files lint | `package.json` |
| `tsc --noEmit` | Type check without build | CLI command |

---

## Aaj Kya Seekha?

1. **ESLint flat config** — v9+ ka naya `eslint.config.mjs` setup
2. **TypeScript ESLint** — `typescript-eslint` plugin for type-aware rules
3. **No-Any rule** — `any` se bachne ke tarike: interfaces, generics, unknown
4. **Prettier** — consistent formatting automatic
5. **Husky + lint-staged** — pre-commit pe auto lint aur format
6. **VS Code integration** — save pe auto fix
7. **Project template** — professional TS project structure

> **Practice Time!** Kal Week 14 revision hai aur Typed Task Manager API banayenge. Aaj apne existing project mein ESLint + Prettier setup karo aur `no-any` rule ON karo!
