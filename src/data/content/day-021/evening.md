# Day 21 Evening: Mini Project — Task Manager CLI

> **Aaj ka plan:** Aaj hum ek "Task Manager CLI" banayenge jo Week 3 ke saare concepts use karega — async file operations (Promises), stack-based undo feature (DSA), closures (private state), aur proper error handling. Ye real-world project hai!

---

## Project Overview

### Kya Banayenge?

Ek command-line Task Manager jo:
- Tasks add/remove/complete kar sake
- File mein data save kare (async operations)
- Undo feature ho (Stack use karenge)
- Private state manage kare (Closures)
- Proper error handling ho (try/catch)

### Project Structure

```
task-manager/
├── index.js          ← Main entry point (CLI interface)
├── taskManager.js    ← Core logic (closures + private state)
├── fileHandler.js    ← Async file operations (promises)
├── undoManager.js    ← Stack-based undo (DSA)
├── data/
│   └── tasks.json    ← Task data file
└── package.json
```

> **Terminal Command:**
> ```bash
> mkdir task-manager && cd task-manager
> mkdir data
> npm init -y
> ```

---

## Step 1: Undo Manager — Stack Based (DSA)

```javascript
// undoManager.js

// Stack-based undo system — closure se private stack
function createUndoManager() {
  const undoStack = [];   // Private — undo actions
  const redoStack = [];   // Private — redo actions

  return {
    // Action record karo
    recordAction(action) {
      undoStack.push(action);
      // Naya action aaye to redo stack clear
      redoStack.length = 0;
      console.log(`📝 Action recorded: ${action.type} - "${action.task?.title || action.taskId}"`);
    },

    // Last action undo karo
    undo() {
      if (undoStack.length === 0) {
        console.log("⚠️ Nothing to undo!");
        return null;
      }
      const action = undoStack.pop();
      redoStack.push(action);
      console.log(`↩️ Undo: ${action.type} - "${action.task?.title || action.taskId}"`);
      return action;
    },

    // Last undo redo karo
    redo() {
      if (redoStack.length === 0) {
        console.log("⚠️ Nothing to redo!");
        return null;
      }
      const action = redoStack.pop();
      undoStack.push(action);
      console.log(`↪️ Redo: ${action.type} - "${action.task?.title || action.taskId}"`);
      return action;
    },

    // History dekho
    getHistory() {
      return {
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        lastAction: undoStack.length > 0 ? undoStack[undoStack.length - 1] : null
      };
    },

    // Clear history
    clear() {
      undoStack.length = 0;
      redoStack.length = 0;
      console.log("🗑️ Undo/Redo history cleared.");
    }
  };
}

module.exports = createUndoManager;
```

---

## Step 2: File Handler — Async Operations (Promises)

```javascript
// fileHandler.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// File se tasks load karo
async function loadTasks() {
  try {
    const data = await readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File nahi hai to empty list return karo
    if (error.code === 'ENOENT') {
      console.log("📁 No existing data found. Starting fresh!");
      return { tasks: [], lastId: 0 };
    }
    throw new Error(`Failed to load tasks: ${error.message}`);
  }
}

// Tasks ko file mein save karo
async function saveTasks(taskData) {
  try {
    const jsonData = JSON.stringify(taskData, null, 2);
    await writeFile(DATA_FILE, jsonData, 'utf8');
    console.log("💾 Tasks saved to file!");
    return true;
  } catch (error) {
    throw new Error(`Failed to save tasks: ${error.message}`);
  }
}

// Backup banao
async function createBackup() {
  try {
    const data = await readFile(DATA_FILE, 'utf8');
    const backupFile = path.join(
      __dirname, 'data',
      `tasks-backup-${Date.now()}.json`
    );
    await writeFile(backupFile, data, 'utf8');
    console.log(`📦 Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.log("⚠️ Backup failed:", error.message);
    return null;
  }
}

module.exports = { loadTasks, saveTasks, createBackup };
```

---

## Step 3: Task Manager — Core Logic (Closures)

```javascript
// taskManager.js
const { loadTasks, saveTasks } = require('./fileHandler');
const createUndoManager = require('./undoManager');

// Task Manager with closures — private state
function createTaskManager() {
  // Private state — closure mein enclosed
  let tasks = [];
  let lastId = 0;
  const undoManager = createUndoManager();

  // Initialize — file se data load karo
  async function initialize() {
    try {
      const data = await loadTasks();
      tasks = data.tasks || [];
      lastId = data.lastId || 0;
      console.log(`✅ Loaded ${tasks.length} tasks from file.`);
    } catch (error) {
      console.log("⚠️ Starting with empty task list.");
      tasks = [];
      lastId = 0;
    }
  }

  // Save current state to file
  async function saveState() {
    await saveTasks({ tasks, lastId });
  }

  return {
    initialize,

    // Task add karo
    async addTask(title, priority = "medium") {
      const task = {
        id: ++lastId,
        title,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
      };

      tasks.push(task);

      // Undo ke liye action record karo
      undoManager.recordAction({
        type: "ADD",
        task: { ...task }
      });

      await saveState();
      console.log(`✅ Task added: [${task.id}] "${title}" (${priority})`);
      return task;
    },

    // Task complete karo
    async completeTask(taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.log(`❌ Task #${taskId} not found!`);
        return false;
      }
      if (task.completed) {
        console.log(`⚠️ Task #${taskId} already completed!`);
        return false;
      }

      const previousState = { ...task };
      task.completed = true;
      task.completedAt = new Date().toISOString();

      undoManager.recordAction({
        type: "COMPLETE",
        taskId: task.id,
        previousState
      });

      await saveState();
      console.log(`✅ Task completed: [${task.id}] "${task.title}"`);
      return true;
    },

    // Task remove karo
    async removeTask(taskId) {
      const index = tasks.findIndex(t => t.id === taskId);
      if (index === -1) {
        console.log(`❌ Task #${taskId} not found!`);
        return false;
      }

      const removed = tasks.splice(index, 1)[0];

      undoManager.recordAction({
        type: "REMOVE",
        task: { ...removed },
        index
      });

      await saveState();
      console.log(`🗑️ Task removed: [${removed.id}] "${removed.title}"`);
      return true;
    },

    // Undo last action
    async undo() {
      const action = undoManager.undo();
      if (!action) return false;

      switch (action.type) {
        case "ADD":
          // Undo add = remove that task
          tasks = tasks.filter(t => t.id !== action.task.id);
          break;

        case "REMOVE":
          // Undo remove = add back at same position
          tasks.splice(action.index, 0, action.task);
          break;

        case "COMPLETE":
          // Undo complete = restore previous state
          const task = tasks.find(t => t.id === action.taskId);
          if (task) {
            Object.assign(task, action.previousState);
          }
          break;
      }

      await saveState();
      console.log("✅ Undo successful!");
      return true;
    },

    // List all tasks
    listTasks(filter = "all") {
      let filtered = tasks;

      if (filter === "pending") {
        filtered = tasks.filter(t => !t.completed);
      } else if (filter === "completed") {
        filtered = tasks.filter(t => t.completed);
      }

      if (filtered.length === 0) {
        console.log("📋 No tasks found!");
        return;
      }

      console.log("\n=== TASK LIST ===");
      console.log(`Showing: ${filter.toUpperCase()}\n`);

      filtered.forEach(task => {
        const status = task.completed ? "✅" : "⬜";
        const priority = {
          high: "🔴",
          medium: "🟡",
          low: "🟢"
        }[task.priority] || "⚪";

        console.log(`${status} [${task.id}] ${priority} ${task.title}`);
      });

      console.log(`\nTotal: ${filtered.length} tasks`);
      console.log(`Pending: ${tasks.filter(t => !t.completed).length}`);
      console.log(`Completed: ${tasks.filter(t => t.completed).length}`);
    },

    // Search tasks
    searchTasks(query) {
      const results = tasks.filter(t =>
        t.title.toLowerCase().includes(query.toLowerCase())
      );
      if (results.length === 0) {
        console.log(`🔍 No tasks matching "${query}"`);
        return [];
      }
      console.log(`🔍 Found ${results.length} tasks matching "${query}":`);
      results.forEach(t => {
        const status = t.completed ? "✅" : "⬜";
        console.log(`  ${status} [${t.id}] ${t.title}`);
      });
      return results;
    },

    // Stats
    getStats() {
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const pending = total - completed;
      const highPriority = tasks.filter(t => t.priority === "high" && !t.completed).length;

      return {
        total,
        completed,
        pending,
        highPriority,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        undoHistory: undoManager.getHistory()
      };
    },

    // Undo manager expose karo (limited)
    getUndoHistory: () => undoManager.getHistory()
  };
}

module.exports = createTaskManager;
```

---

## Step 4: Main Entry Point — CLI Interface

```javascript
// index.js
const createTaskManager = require('./taskManager');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function main() {
  const tm = createTaskManager();
  await tm.initialize();

  console.log("\n🗂️ === TASK MANAGER CLI ===");
  console.log("Commands: add, list, complete, remove, undo, search, stats, quit\n");

  let running = true;

  while (running) {
    const input = await prompt("\n> Enter command: ");
    const command = input.trim().toLowerCase();

    try {
      switch (command) {
        case "add": {
          const title = await prompt("  Task title: ");
          const priority = await prompt("  Priority (high/medium/low): ");
          await tm.addTask(
            title.trim(),
            ["high", "medium", "low"].includes(priority.trim()) ? priority.trim() : "medium"
          );
          break;
        }

        case "list": {
          const filter = await prompt("  Filter (all/pending/completed): ");
          tm.listTasks(filter.trim() || "all");
          break;
        }

        case "complete": {
          const id = await prompt("  Task ID: ");
          await tm.completeTask(parseInt(id));
          break;
        }

        case "remove": {
          const id = await prompt("  Task ID: ");
          await tm.removeTask(parseInt(id));
          break;
        }

        case "undo": {
          await tm.undo();
          break;
        }

        case "search": {
          const query = await prompt("  Search query: ");
          tm.searchTasks(query.trim());
          break;
        }

        case "stats": {
          const stats = tm.getStats();
          console.log("\n📊 === STATISTICS ===");
          console.log(`  Total tasks: ${stats.total}`);
          console.log(`  Completed: ${stats.completed}`);
          console.log(`  Pending: ${stats.pending}`);
          console.log(`  High priority pending: ${stats.highPriority}`);
          console.log(`  Completion rate: ${stats.completionRate}%`);
          console.log(`  Undo stack: ${stats.undoHistory.undoCount} actions`);
          break;
        }

        case "quit":
        case "exit": {
          console.log("\n👋 Bye! Tasks saved automatically.");
          running = false;
          break;
        }

        default:
          console.log("❓ Unknown command. Try: add, list, complete, remove, undo, search, stats, quit");
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  rl.close();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

---

## Step 5: Run Karo!

> **Terminal Command:**
> ```bash
> cd task-manager
> node index.js
> ```

### Test Workflow

```
> Enter command: add
  Task title: Complete Week 3 Revision
  Priority: high
✅ Task added: [1] "Complete Week 3 Revision" (high)

> Enter command: add
  Task title: Practice Closures
  Priority: medium
✅ Task added: [2] "Practice Closures" (medium)

> Enter command: add
  Task title: Build Mini Project
  Priority: high
✅ Task added: [3] "Build Mini Project" (high)

> Enter command: list
  Filter: all
=== TASK LIST ===
⬜ [1] 🔴 Complete Week 3 Revision
⬜ [2] 🟡 Practice Closures
⬜ [3] 🔴 Build Mini Project
Total: 3 tasks

> Enter command: complete
  Task ID: 1
✅ Task completed: [1] "Complete Week 3 Revision"

> Enter command: undo
↩️ Undo: COMPLETE
✅ Undo successful!

> Enter command: list
  Filter: all
⬜ [1] 🔴 Complete Week 3 Revision  (wapas pending!)
⬜ [2] 🟡 Practice Closures
⬜ [3] 🔴 Build Mini Project

> Enter command: stats
📊 === STATISTICS ===
  Total tasks: 3
  Completed: 0
  Pending: 3
  High priority pending: 2
  Completion rate: 0%
  Undo stack: 2 actions
```

---

## Concepts Used — Summary

| Concept | Where Used | How |
|---------|-----------|-----|
| **Closures** | taskManager.js | Private tasks array, lastId |
| **Stack (DSA)** | undoManager.js | Undo/Redo stacks |
| **Promises** | fileHandler.js | Async file read/write |
| **Async/Await** | index.js, taskManager.js | All async operations |
| **Error Handling** | Everywhere | try/catch blocks |
| **Array Methods** | taskManager.js | filter, find, findIndex, map |
| **Destructuring** | Multiple files | Object destructuring |
| **Module Pattern** | All files | require/module.exports |

---

## Bonus Challenges

> **Practice Time!** Ye features add karo:
> 1. **Due date** — task mein due date add karo, overdue tasks highlight karo
> 2. **Categories** — tasks ko categories mein organize karo (work, personal, study)
> 3. **Export** — tasks ko CSV format mein export karo
> 4. **Sort** — tasks ko priority ya date ke basis pe sort karo (sorting algorithm use karo!)
> 5. **Binary Search** — task ID se search karo (sorted array pe)

---

## Quick Revision Table

| File | Concept | Lines of Code |
|------|---------|---------------|
| undoManager.js | Stack (LIFO), Closures | ~60 lines |
| fileHandler.js | Promises, Async file I/O | ~50 lines |
| taskManager.js | Closures, Array methods, Error handling | ~150 lines |
| index.js | Async/Await, CLI interface | ~100 lines |

---

## Aaj Kya Seekha?

1. **Real project** banaya jo multiple concepts combine karta hai
2. **Closure** se private state manage kiya — tasks array bahar se accessible nahi
3. **Stack** se undo/redo feature implement kiya — LIFO principle
4. **Async file operations** — Promise-based file read/write
5. **Error handling** — har level pe try/catch
6. **Module pattern** — code ko alag files mein organize kiya
7. **CLI interface** — readline se interactive program banaya

> **Yaad Rakho:** Ye mini project Week 3 ka culmination hai. Isme DSA (Stack), Git workflow, Closures, Promises — sab saath mein kaam kar rahe hain. Real-world projects bhi aise hi bante hain — multiple concepts ka combination. Isko apne GitHub pe push karo — portfolio ke liye ek acha project hai!
