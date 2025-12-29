# Day 28 Evening: Phase 1 Project Start — CLI Task Manager Architecture & Setup

> **Aaj ka plan:** Ab Phase 1 ka project shuru karte hain! Hum ek "CLI Task Manager with JSON Storage" banayenge. Aaj architecture design karenge aur project structure set up karenge. Ye project Phase 1 mein seekhe saare concepts use karega!

---

## Project Overview

### Kya Banayenge?

Ek command-line task manager jo:
- Tasks **add, list, update, delete** kar sake (CRUD)
- Tasks ko **JSON file** mein store kare
- **Search aur filter** kar sake (by status, priority, date)
- **Sorting** support kare
- **Colorful output** dikhaaye (chalk library se)
- **Menu system** ho interactive use ke liye

> **Socho Aise:** Ye ek digital diary jaisi hai — jaise kisan apni fasal ka hisaab rakhta hai, waise hum apne tasks ka hisaab rakhenge. Lekin terminal mein, bina kisi UI ke!

### Technologies Used

| Tech | Kahan Use Hoga |
|------|---------------|
| Node.js | Runtime environment |
| JSON | Data storage (file-based) |
| fs module | File read/write |
| chalk | Colorful terminal output |
| readline | User input handling |
| OOP (Classes) | Code structure |
| Error Handling | Robust operations |
| Git | Version control |

---

## Architecture Design

### Folder Structure

```
cli-task-manager/
├── package.json          # Project config
├── .gitignore            # Git ignore rules
├── README.md             # Project description
├── data/
│   └── tasks.json        # Task data storage
├── src/
│   ├── index.js          # Entry point — app start
│   ├── TaskManager.js    # Main class — CRUD operations
│   ├── FileHandler.js    # JSON file read/write
│   ├── Display.js        # Terminal output formatting
│   ├── Menu.js           # Interactive menu system
│   └── validators.js     # Input validation functions
└── tests/
    └── taskManager.test.js  # Manual tests
```

> **Yaad Rakho:** Har file ka ek clear kaam hai — isko "Separation of Concerns" kehte hain. Code modular hona chahiye!

### Data Model — Task Object

```javascript
// Ek task kaisa dikhega JSON mein
{
  "id": "task_1717171717171",       // Unique ID (timestamp based)
  "title": "Node.js project complete karo",
  "description": "Phase 1 ka CLI project finish karna hai",
  "status": "pending",              // pending | in-progress | done
  "priority": "high",               // low | medium | high
  "category": "study",              // study | work | personal
  "createdAt": "2026-04-04T10:30:00.000Z",
  "updatedAt": "2026-04-04T10:30:00.000Z",
  "dueDate": "2026-04-06",
  "tags": ["nodejs", "project"]
}
```

---

## Step 1: Project Setup

> **Terminal Command:**
> ```bash
> # Project folder banao
> mkdir cli-task-manager
> cd cli-task-manager
>
> # npm init
> npm init -y
>
> # Dependencies install karo
> npm install chalk@4.1.2 readline-sync
>
> # Dev dependencies
> npm install --save-dev nodemon
>
> # Folders banao
> mkdir -p src data tests
>
> # Git init
> git init
> ```

> **Tip:** Hum `chalk@4.1.2` use kar rahe hain kyunki version 5+ ESM-only hai. CommonJS (require) ke saath version 4 best hai.

### .gitignore

```
node_modules/
data/tasks.json
.env
*.log
.DS_Store
```

### package.json Scripts

```json
{
  "name": "cli-task-manager",
  "version": "1.0.0",
  "description": "CLI Task Manager with JSON Storage — Phase 1 Project",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "node tests/taskManager.test.js"
  }
}
```

---

## Step 2: FileHandler Class

```javascript
// src/FileHandler.js
// Ye class JSON file ko read/write karti hai

const fs = require('fs');
const path = require('path');

class FileHandler {
  constructor(filePath) {
    // Data file ka path set karo
    this.filePath = filePath;
    // Agar file nahi hai toh banao
    this.#ensureFileExists();
  }

  // Private method — file exist check karo
  #ensureFileExists() {
    try {
      // Directory check
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // File check
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
        console.log("📁 Data file created:", this.filePath);
      }
    } catch (err) {
      console.error("File setup mein error:", err.message);
    }
  }

  // Saara data padho
  readAll() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error("File read error:", err.message);
      return [];
    }
  }

  // Saara data likho (overwrite)
  writeAll(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error("File write error:", err.message);
      return false;
    }
  }

  // Ek item add karo
  append(item) {
    const data = this.readAll();
    data.push(item);
    return this.writeAll(data);
  }

  // Backup banao
  backup() {
    try {
      const backupPath = this.filePath.replace('.json', `_backup_${Date.now()}.json`);
      fs.copyFileSync(this.filePath, backupPath);
      console.log("💾 Backup created:", backupPath);
      return true;
    } catch (err) {
      console.error("Backup error:", err.message);
      return false;
    }
  }
}

module.exports = FileHandler;
```

---

## Step 3: Validators

```javascript
// src/validators.js
// Input validation functions — clean aur reusable

const VALID_STATUSES = ['pending', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_CATEGORIES = ['study', 'work', 'personal', 'health', 'other'];

// Title validate karo
function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: "Title zaroori hai!" };
  }
  title = title.trim();
  if (title.length < 3) {
    return { valid: false, error: "Title kam se kam 3 characters ka hona chahiye!" };
  }
  if (title.length > 100) {
    return { valid: false, error: "Title 100 characters se zyada nahi ho sakta!" };
  }
  return { valid: true, value: title };
}

// Status validate karo
function validateStatus(status) {
  status = status.toLowerCase().trim();
  if (!VALID_STATUSES.includes(status)) {
    return {
      valid: false,
      error: `Status sirf ye ho sakta hai: ${VALID_STATUSES.join(', ')}`
    };
  }
  return { valid: true, value: status };
}

// Priority validate karo
function validatePriority(priority) {
  priority = priority.toLowerCase().trim();
  if (!VALID_PRIORITIES.includes(priority)) {
    return {
      valid: false,
      error: `Priority sirf ye ho sakti hai: ${VALID_PRIORITIES.join(', ')}`
    };
  }
  return { valid: true, value: priority };
}

// Date validate karo
function validateDate(dateStr) {
  if (!dateStr) return { valid: true, value: null }; // Optional hai
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Date format galat hai! Use: YYYY-MM-DD" };
  }
  return { valid: true, value: dateStr };
}

module.exports = {
  validateTitle,
  validateStatus,
  validatePriority,
  validateDate,
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_CATEGORIES
};
```

---

## Step 4: TaskManager Class (Skeleton)

```javascript
// src/TaskManager.js
// Main class — saari business logic yahan hogi

const FileHandler = require('./FileHandler');
const {
  validateTitle, validateStatus,
  validatePriority, validateDate
} = require('./validators');

class TaskManager {
  constructor(dataPath) {
    this.fileHandler = new FileHandler(dataPath);
  }

  // Unique ID generate karo
  #generateId() {
    return 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  // ─── CREATE ───
  addTask(title, description = '', priority = 'medium', category = 'other', dueDate = null) {
    // Validate
    const titleCheck = validateTitle(title);
    if (!titleCheck.valid) throw new Error(titleCheck.error);

    const priorityCheck = validatePriority(priority);
    if (!priorityCheck.valid) throw new Error(priorityCheck.error);

    // Naya task object banao
    const task = {
      id: this.#generateId(),
      title: titleCheck.value,
      description,
      status: 'pending',
      priority: priorityCheck.value,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate,
      tags: []
    };

    this.fileHandler.append(task);
    return task;
  }

  // ─── READ ───
  getAllTasks() {
    return this.fileHandler.readAll();
  }

  getTaskById(id) {
    const tasks = this.getAllTasks();
    return tasks.find(t => t.id === id) || null;
  }

  // ─── UPDATE ───
  updateTask(id, updates) {
    const tasks = this.getAllTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Task nahi mila!");

    // Allowed updates only
    const allowed = ['title', 'description', 'status', 'priority', 'category', 'dueDate', 'tags'];
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        tasks[index][key] = updates[key];
      }
    }
    tasks[index].updatedAt = new Date().toISOString();

    this.fileHandler.writeAll(tasks);
    return tasks[index];
  }

  // ─── DELETE ───
  deleteTask(id) {
    const tasks = this.getAllTasks();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) throw new Error("Task nahi mila!");
    this.fileHandler.writeAll(filtered);
    return true;
  }

  // Kal aur methods add karenge — search, filter, sort
}

module.exports = TaskManager;
```

---

## Step 5: Initial Commit

> **Terminal Command:**
> ```bash
> git add .
> git commit -m "Initial setup: project structure, FileHandler, validators, TaskManager skeleton"
> ```

> **Yaad Rakho:** Chhote-chhote meaningful commits karo — "fixed stuff" jaisa message kabhi mat likho. Commit message se pata chalna chahiye kya change hua.

---

## Quick Revision Table

| Component | File | Responsibility |
|-----------|------|---------------|
| FileHandler | src/FileHandler.js | JSON file CRUD operations |
| Validators | src/validators.js | Input validation |
| TaskManager | src/TaskManager.js | Business logic (CRUD) |
| Display | src/Display.js | Terminal output (kal banayenge) |
| Menu | src/Menu.js | Interactive menu (kal banayenge) |
| Index | src/index.js | Entry point (kal banayenge) |

---

## Aaj Kya Seekha?

1. **Project architecture** — folder structure aur separation of concerns
2. **Data model design** — task object ka schema sochna
3. **FileHandler** — JSON file ko safely read/write karna
4. **Validators** — input ko validate karna before processing
5. **TaskManager skeleton** — CRUD operations ka structure
6. **Modular code** — har file ka ek clear responsibility

> **Tip:** Kal hum project implementation karenge — search, filter, colorful output, aur interactive menu add karenge. Architecture sahi ho toh coding aasaan ho jaati hai!
