# Day 29 Morning: Phase 1 Project — CRUD, File Storage & Modular Code

> **Aaj ka plan:** Aaj hum CLI Task Manager ka implementation karenge — CRUD operations complete karenge, file-based storage solid banayenge, modular code structure maintain karenge, input validation aur error handling add karenge.

---

## TaskManager Complete Implementation

### Kal ka skeleton aaj fill karenge! Pehle FileHandler aur validators ready hain, ab TaskManager mein saari logic add karte hain.

```javascript
// src/TaskManager.js — Complete Implementation

const FileHandler = require('./FileHandler');
const {
  validateTitle, validateStatus,
  validatePriority, validateDate,
  VALID_STATUSES, VALID_PRIORITIES, VALID_CATEGORIES
} = require('./validators');

class TaskManager {
  #fileHandler;

  constructor(dataPath) {
    this.#fileHandler = new FileHandler(dataPath);
  }

  // ─── Private Helpers ───

  #generateId() {
    return 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  #getCurrentTimestamp() {
    return new Date().toISOString();
  }

  // ─── CREATE ───
  addTask({ title, description = '', priority = 'medium', category = 'other', dueDate = null, tags = [] }) {
    // Validation
    const titleCheck = validateTitle(title);
    if (!titleCheck.valid) {
      return { success: false, error: titleCheck.error };
    }

    const priorityCheck = validatePriority(priority);
    if (!priorityCheck.valid) {
      return { success: false, error: priorityCheck.error };
    }

    if (dueDate) {
      const dateCheck = validateDate(dueDate);
      if (!dateCheck.valid) {
        return { success: false, error: dateCheck.error };
      }
    }

    const task = {
      id: this.#generateId(),
      title: titleCheck.value,
      description: description.trim(),
      status: 'pending',
      priority: priorityCheck.value,
      category: VALID_CATEGORIES.includes(category) ? category : 'other',
      createdAt: this.#getCurrentTimestamp(),
      updatedAt: this.#getCurrentTimestamp(),
      dueDate: dueDate || null,
      tags: Array.isArray(tags) ? tags : []
    };

    const saved = this.#fileHandler.append(task);
    if (saved) {
      return { success: true, task };
    }
    return { success: false, error: "Task save nahi ho paya!" };
  }

  // ─── READ (Multiple) ───
  getAllTasks() {
    return this.#fileHandler.readAll();
  }

  getTasksByStatus(status) {
    const check = validateStatus(status);
    if (!check.valid) return [];
    return this.getAllTasks().filter(t => t.status === check.value);
  }

  getTasksByPriority(priority) {
    const check = validatePriority(priority);
    if (!check.valid) return [];
    return this.getAllTasks().filter(t => t.priority === check.value);
  }

  getTasksByCategory(category) {
    return this.getAllTasks().filter(t => t.category === category);
  }

  // ─── READ (Single) ───
  getTaskById(id) {
    const tasks = this.getAllTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return { success: false, error: "Task nahi mila!" };
    return { success: true, task };
  }

  // ─── UPDATE ───
  updateTask(id, updates) {
    const tasks = this.getAllTasks();
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      return { success: false, error: "Task nahi mila!" };
    }

    // Har field ko validate karo agar update mein hai
    if (updates.title) {
      const check = validateTitle(updates.title);
      if (!check.valid) return { success: false, error: check.error };
      tasks[index].title = check.value;
    }

    if (updates.description !== undefined) {
      tasks[index].description = updates.description.trim();
    }

    if (updates.status) {
      const check = validateStatus(updates.status);
      if (!check.valid) return { success: false, error: check.error };
      tasks[index].status = check.value;
    }

    if (updates.priority) {
      const check = validatePriority(updates.priority);
      if (!check.valid) return { success: false, error: check.error };
      tasks[index].priority = check.value;
    }

    if (updates.dueDate) {
      const check = validateDate(updates.dueDate);
      if (!check.valid) return { success: false, error: check.error };
      tasks[index].dueDate = check.value;
    }

    if (updates.category) {
      tasks[index].category = VALID_CATEGORIES.includes(updates.category)
        ? updates.category : tasks[index].category;
    }

    if (updates.tags) {
      tasks[index].tags = Array.isArray(updates.tags) ? updates.tags : tasks[index].tags;
    }

    // Timestamp update
    tasks[index].updatedAt = this.#getCurrentTimestamp();

    const saved = this.#fileHandler.writeAll(tasks);
    if (saved) {
      return { success: true, task: tasks[index] };
    }
    return { success: false, error: "Update save nahi hua!" };
  }

  // Status shortcut methods
  markAsDone(id) {
    return this.updateTask(id, { status: 'done' });
  }

  markAsInProgress(id) {
    return this.updateTask(id, { status: 'in-progress' });
  }

  // ─── DELETE ───
  deleteTask(id) {
    const tasks = this.getAllTasks();
    const taskToDelete = tasks.find(t => t.id === id);

    if (!taskToDelete) {
      return { success: false, error: "Task nahi mila!" };
    }

    const filtered = tasks.filter(t => t.id !== id);
    const saved = this.#fileHandler.writeAll(filtered);

    if (saved) {
      return { success: true, deletedTask: taskToDelete };
    }
    return { success: false, error: "Delete nahi ho paya!" };
  }

  // Delete all completed tasks
  clearCompleted() {
    const tasks = this.getAllTasks();
    const remaining = tasks.filter(t => t.status !== 'done');
    const deletedCount = tasks.length - remaining.length;
    this.#fileHandler.writeAll(remaining);
    return { success: true, deletedCount };
  }

  // ─── SEARCH ───
  searchTasks(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    query = query.toLowerCase().trim();
    return this.getAllTasks().filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // ─── SORT ───
  getSortedTasks(sortBy = 'createdAt', order = 'desc') {
    const tasks = this.getAllTasks();

    // Priority ka numeric value
    const priorityValue = { high: 3, medium: 2, low: 1 };
    const statusValue = { 'in-progress': 3, pending: 2, done: 1 };

    return tasks.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'priority':
          valA = priorityValue[a.priority] || 0;
          valB = priorityValue[b.priority] || 0;
          break;
        case 'status':
          valA = statusValue[a.status] || 0;
          valB = statusValue[b.status] || 0;
          break;
        case 'dueDate':
          valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case 'title':
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        default: // createdAt
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
      }

      if (order === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
  }

  // ─── STATISTICS ───
  getStats() {
    const tasks = this.getAllTasks();
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      highPriority: tasks.filter(t => t.priority === 'high').length,
      mediumPriority: tasks.filter(t => t.priority === 'medium').length,
      lowPriority: tasks.filter(t => t.priority === 'low').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        return new Date(t.dueDate) < new Date();
      }).length
    };
  }

  // ─── BACKUP ───
  createBackup() {
    return this.#fileHandler.backup();
  }
}

module.exports = TaskManager;
```

> **Yaad Rakho:** Har method ek consistent response pattern return karta hai: `{ success: true/false, data/error }`. Isse error handling aasaan ho jaati hai!

---

## Display Module — Colorful Terminal Output

```javascript
// src/Display.js
// Terminal mein sundar output dikhane ke liye

const chalk = require('chalk');

class Display {
  // Task ko sundar format mein dikhao
  static showTask(task, index = null) {
    const statusIcon = {
      'pending': chalk.yellow('○'),
      'in-progress': chalk.blue('◑'),
      'done': chalk.green('●')
    };

    const priorityColor = {
      'high': chalk.red.bold,
      'medium': chalk.yellow,
      'low': chalk.gray
    };

    const num = index !== null ? chalk.gray(`${index + 1}.`) : '';
    const icon = statusIcon[task.status] || '?';
    const title = task.status === 'done'
      ? chalk.strikethrough.gray(task.title)
      : chalk.white.bold(task.title);
    const priority = priorityColor[task.priority](`[${task.priority.toUpperCase()}]`);

    console.log(`  ${num} ${icon} ${title} ${priority}`);

    if (task.description) {
      console.log(`     ${chalk.gray(task.description)}`);
    }

    // Due date dikhaao — overdue ho toh red mein
    if (task.dueDate) {
      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
      const dateStr = isOverdue
        ? chalk.red(`⚠ Due: ${task.dueDate} (OVERDUE!)`)
        : chalk.cyan(`📅 Due: ${task.dueDate}`);
      console.log(`     ${dateStr}`);
    }

    if (task.tags.length > 0) {
      console.log(`     ${chalk.magenta('Tags:')} ${task.tags.map(t => chalk.cyan(`#${t}`)).join(' ')}`);
    }

    console.log(`     ${chalk.gray(`ID: ${task.id} | Created: ${new Date(task.createdAt).toLocaleDateString()}`)}`);
    console.log('');
  }

  // Task list dikhao
  static showTaskList(tasks, title = 'Tasks') {
    console.log('');
    Display.showHeader(title);

    if (tasks.length === 0) {
      console.log(chalk.yellow('  Koi task nahi mila!\n'));
      return;
    }

    tasks.forEach((task, i) => Display.showTask(task, i));
    console.log(chalk.gray(`  ─── Total: ${tasks.length} tasks ───\n`));
  }

  // Header dikhao
  static showHeader(text) {
    console.log(chalk.cyan.bold(`\n  ═══ ${text} ═══\n`));
  }

  // Success message
  static success(msg) {
    console.log(chalk.green(`  ✅ ${msg}`));
  }

  // Error message
  static error(msg) {
    console.log(chalk.red(`  ❌ ${msg}`));
  }

  // Warning message
  static warn(msg) {
    console.log(chalk.yellow(`  ⚠️  ${msg}`));
  }

  // Info message
  static info(msg) {
    console.log(chalk.blue(`  ℹ️  ${msg}`));
  }

  // Statistics dikhao
  static showStats(stats) {
    Display.showHeader('Task Statistics');
    console.log(`  📊 Total Tasks:    ${chalk.bold(stats.total)}`);
    console.log(`  ${chalk.yellow('○')} Pending:        ${stats.pending}`);
    console.log(`  ${chalk.blue('◑')} In Progress:    ${stats.inProgress}`);
    console.log(`  ${chalk.green('●')} Completed:      ${stats.done}`);
    console.log('');
    console.log(`  ${chalk.red('!')} High Priority:  ${stats.highPriority}`);
    console.log(`  ${chalk.yellow('!')} Medium Priority: ${stats.mediumPriority}`);
    console.log(`  ${chalk.gray('!')} Low Priority:   ${stats.lowPriority}`);
    if (stats.overdue > 0) {
      console.log(`  ${chalk.red.bold('⚠')} Overdue:        ${chalk.red.bold(stats.overdue)}`);
    }
    console.log('');
  }

  // Welcome screen
  static showWelcome() {
    console.clear();
    console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════════╗
  ║     📋 CLI Task Manager v1.0        ║
  ║     Phase 1 Project                 ║
  ╚══════════════════════════════════════╝
    `));
  }
}

module.exports = Display;
```

---

## Input Validation in Action

### Kaise Use Hoga?

```javascript
// Ye pattern har jagah use hoga
const result = taskManager.addTask({
  title: "Node.js revision karo",
  description: "Phase 1 ke saare topics revise karne hain",
  priority: "high",
  category: "study",
  dueDate: "2026-04-06"
});

if (result.success) {
  Display.success(`Task added: ${result.task.title}`);
  Display.showTask(result.task);
} else {
  Display.error(result.error);
}

// Galat input doge toh error aayega — crash nahi hoga!
const bad = taskManager.addTask({ title: "ab" }); // Too short
// { success: false, error: "Title kam se kam 3 characters ka hona chahiye!" }

const bad2 = taskManager.addTask({ title: "Good title", priority: "ultra" }); // Invalid
// { success: false, error: "Priority sirf ye ho sakti hai: low, medium, high" }
```

> **Yaad Rakho:** Kabhi bhi user input pe blindly trust mat karo! Hamesha validate karo pehle. Ye backend development ka golden rule hai.

---

## Error Handling Pattern

```javascript
// Har operation mein try-catch use karo

class TaskManager {
  // Kisi bhi method mein unexpected error aaye toh crash na ho
  safeExecute(operation, ...args) {
    try {
      return operation.call(this, ...args);
    } catch (err) {
      return { success: false, error: `Unexpected error: ${err.message}` };
    }
  }
}

// Usage pattern
function handleAddTask(userInput) {
  try {
    const result = taskManager.addTask(userInput);

    if (result.success) {
      Display.success(`Task added: "${result.task.title}"`);
    } else {
      Display.error(result.error);
    }
  } catch (err) {
    // Ye kabhi nahi aana chahiye agar TaskManager sahi se bana hai
    Display.error(`Something went wrong: ${err.message}`);
  }
}
```

> **Warning:** `try-catch` ke bina agar JSON parse fail ho gaya, file corrupt ho gayi, ya disk full ho gaya — app crash ho jaayegi. Hamesha error handling karo!

---

## Git Commit Strategy

> **Terminal Command:**
> ```bash
> # Feature by feature commit karo
> git add src/TaskManager.js
> git commit -m "feat: complete TaskManager CRUD with validation"
>
> git add src/Display.js
> git commit -m "feat: add Display module for colorful terminal output"
>
> # Commit message format:
> # feat: naya feature
> # fix: bug fix
> # refactor: code restructure
> # docs: documentation
> # test: testing
> ```

---

## Quick Revision Table

| Module | Methods | Key Pattern |
|--------|---------|-------------|
| TaskManager | addTask, getAll, update, delete | `{ success, task/error }` response |
| TaskManager | search, sort, stats | filter + sort + reduce |
| Display | showTask, showList, success, error | chalk colors + icons |
| Validators | validateTitle, Status, Priority | `{ valid, value/error }` pattern |
| FileHandler | readAll, writeAll, append, backup | JSON file operations |

---

## Aaj Kya Seekha?

1. **Complete CRUD** — Create, Read, Update, Delete operations
2. **Input validation** — har input ko validate karo before processing
3. **Error handling** — try-catch + consistent response pattern
4. **Display module** — chalk se colorful, readable terminal output
5. **Modular code** — har file ka ek clear responsibility
6. **Git commit strategy** — chhote, meaningful commits

> **Practice Time!** Evening mein search, filter, sorting, interactive menu, aur chalk se colorful output complete karenge!
