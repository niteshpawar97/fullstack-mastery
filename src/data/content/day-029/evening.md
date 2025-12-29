# Day 29 Evening: CLI Task Manager — Search, Filter, Menu System & Colorful Output

> **Aaj ka plan:** Aaj hum project mein search/filter, sorting, interactive menu system, aur polished colorful output add karenge. Project ko usable tool banayenge!

---

## Interactive Menu System

```javascript
// src/Menu.js
// Interactive terminal menu — readline se user input lenge

const readlineSync = require('readline-sync');
const chalk = require('chalk');
const TaskManager = require('./TaskManager');
const Display = require('./Display');
const path = require('path');

class Menu {
  constructor() {
    const dataPath = path.join(__dirname, '..', 'data', 'tasks.json');
    this.taskManager = new TaskManager(dataPath);
  }

  // ─── Main Menu ───
  showMainMenu() {
    Display.showWelcome();

    // Stats dikhao pehle
    const stats = this.taskManager.getStats();
    if (stats.total > 0) {
      Display.showStats(stats);
    }

    const choices = [
      '📋 List All Tasks',
      '➕ Add New Task',
      '✏️  Update Task',
      '✅ Mark Task Done',
      '🗑️  Delete Task',
      '🔍 Search Tasks',
      '📊 Filter Tasks',
      '📈 Sort Tasks',
      '🧹 Clear Completed',
      '💾 Backup Data',
      '🚪 Exit'
    ];

    console.log('');
    const index = readlineSync.keyInSelect(choices, chalk.cyan('Kya karna hai?'), {
      cancel: false
    });

    return index;
  }

  // ─── Add Task ───
  handleAddTask() {
    Display.showHeader('Naya Task Add Karo');

    // Title — zaroori hai
    const title = readlineSync.question(chalk.cyan('  Task Title: '));
    if (!title.trim()) {
      Display.error('Title zaroori hai!');
      return;
    }

    // Description — optional
    const description = readlineSync.question(chalk.gray('  Description (optional): '));

    // Priority
    const priorities = ['low', 'medium', 'high'];
    const prIndex = readlineSync.keyInSelect(priorities, chalk.cyan('  Priority?'), {
      cancel: false
    });
    const priority = priorities[prIndex];

    // Category
    const categories = ['study', 'work', 'personal', 'health', 'other'];
    const catIndex = readlineSync.keyInSelect(categories, chalk.cyan('  Category?'), {
      cancel: false
    });
    const category = categories[catIndex];

    // Due Date — optional
    const dueDate = readlineSync.question(
      chalk.gray('  Due Date (YYYY-MM-DD, ya Enter skip): ')
    ) || null;

    // Tags — optional
    const tagsInput = readlineSync.question(
      chalk.gray('  Tags (comma separated, ya Enter skip): ')
    );
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Task add karo
    const result = this.taskManager.addTask({
      title, description, priority, category, dueDate, tags
    });

    if (result.success) {
      Display.success(`Task added successfully!`);
      Display.showTask(result.task);
    } else {
      Display.error(result.error);
    }

    this.#pauseAndContinue();
  }

  // ─── List Tasks ───
  handleListTasks() {
    const tasks = this.taskManager.getAllTasks();
    Display.showTaskList(tasks, 'All Tasks');
    this.#pauseAndContinue();
  }

  // ─── Update Task ───
  handleUpdateTask() {
    const tasks = this.taskManager.getAllTasks();
    if (tasks.length === 0) {
      Display.warn('Koi task nahi hai update karne ke liye!');
      this.#pauseAndContinue();
      return;
    }

    // Task list dikhao with numbers
    Display.showTaskList(tasks, 'Task Select Karo');

    const taskIndex = readlineSync.questionInt(
      chalk.cyan(`  Task number (1-${tasks.length}): `)
    ) - 1;

    if (taskIndex < 0 || taskIndex >= tasks.length) {
      Display.error('Galat number!');
      this.#pauseAndContinue();
      return;
    }

    const task = tasks[taskIndex];
    console.log(chalk.gray(`\n  Editing: "${task.title}"`));
    console.log(chalk.gray('  (Enter press karo jo nahi badalna)'));

    const updates = {};

    // Title
    const newTitle = readlineSync.question(
      chalk.cyan(`  Title [${task.title}]: `)
    );
    if (newTitle.trim()) updates.title = newTitle;

    // Status
    const statuses = ['pending', 'in-progress', 'done'];
    console.log(chalk.gray(`  Current status: ${task.status}`));
    const stIndex = readlineSync.keyInSelect(
      [...statuses, 'No change'],
      chalk.cyan('  Status?')
    );
    if (stIndex < statuses.length) updates.status = statuses[stIndex];

    // Priority
    const priorities = ['low', 'medium', 'high'];
    console.log(chalk.gray(`  Current priority: ${task.priority}`));
    const prIndex = readlineSync.keyInSelect(
      [...priorities, 'No change'],
      chalk.cyan('  Priority?')
    );
    if (prIndex < priorities.length) updates.priority = priorities[prIndex];

    // Description
    const newDesc = readlineSync.question(
      chalk.cyan(`  Description [${task.description || 'none'}]: `)
    );
    if (newDesc.trim()) updates.description = newDesc;

    // Apply updates
    if (Object.keys(updates).length === 0) {
      Display.info('Kuch change nahi kiya.');
    } else {
      const result = this.taskManager.updateTask(task.id, updates);
      if (result.success) {
        Display.success('Task updated!');
        Display.showTask(result.task);
      } else {
        Display.error(result.error);
      }
    }

    this.#pauseAndContinue();
  }

  // ─── Mark Done ───
  handleMarkDone() {
    // Sirf pending aur in-progress tasks dikhao
    const tasks = this.taskManager.getAllTasks().filter(t => t.status !== 'done');

    if (tasks.length === 0) {
      Display.success('Sab tasks complete hain! 🎉');
      this.#pauseAndContinue();
      return;
    }

    Display.showTaskList(tasks, 'Pending/In-Progress Tasks');

    const taskIndex = readlineSync.questionInt(
      chalk.cyan(`  Kaun sa task done hai? (1-${tasks.length}): `)
    ) - 1;

    if (taskIndex < 0 || taskIndex >= tasks.length) {
      Display.error('Galat number!');
      this.#pauseAndContinue();
      return;
    }

    const result = this.taskManager.markAsDone(tasks[taskIndex].id);
    if (result.success) {
      Display.success(`"${result.task.title}" marked as done! 🎉`);
    } else {
      Display.error(result.error);
    }

    this.#pauseAndContinue();
  }

  // ─── Delete Task ───
  handleDeleteTask() {
    const tasks = this.taskManager.getAllTasks();
    if (tasks.length === 0) {
      Display.warn('Koi task nahi hai delete karne ke liye!');
      this.#pauseAndContinue();
      return;
    }

    Display.showTaskList(tasks, 'Task Delete Karo');

    const taskIndex = readlineSync.questionInt(
      chalk.cyan(`  Delete kaun sa? (1-${tasks.length}): `)
    ) - 1;

    if (taskIndex < 0 || taskIndex >= tasks.length) {
      Display.error('Galat number!');
      this.#pauseAndContinue();
      return;
    }

    // Confirmation
    const confirm = readlineSync.keyInYNStrict(
      chalk.red(`  "${tasks[taskIndex].title}" delete karna hai? Pakka?`)
    );

    if (confirm) {
      const result = this.taskManager.deleteTask(tasks[taskIndex].id);
      if (result.success) {
        Display.success(`Task deleted: "${result.deletedTask.title}"`);
      } else {
        Display.error(result.error);
      }
    } else {
      Display.info('Delete cancel kiya.');
    }

    this.#pauseAndContinue();
  }

  // ─── Search ───
  handleSearch() {
    Display.showHeader('Search Tasks');

    const query = readlineSync.question(chalk.cyan('  Search query: '));
    if (!query.trim()) {
      Display.warn('Kuch toh likho search karne ke liye!');
      this.#pauseAndContinue();
      return;
    }

    const results = this.taskManager.searchTasks(query);
    Display.showTaskList(results, `Search Results: "${query}"`);
    this.#pauseAndContinue();
  }

  // ─── Filter ───
  handleFilter() {
    Display.showHeader('Filter Tasks');

    const filterOptions = ['By Status', 'By Priority', 'By Category', 'Overdue Tasks'];
    const fIndex = readlineSync.keyInSelect(filterOptions, chalk.cyan('Filter type?'), {
      cancel: 'Back'
    });

    let filtered = [];

    switch (fIndex) {
      case 0: // Status
        const statuses = ['pending', 'in-progress', 'done'];
        const sIdx = readlineSync.keyInSelect(statuses, chalk.cyan('Status?'));
        if (sIdx >= 0) filtered = this.taskManager.getTasksByStatus(statuses[sIdx]);
        break;

      case 1: // Priority
        const priorities = ['low', 'medium', 'high'];
        const pIdx = readlineSync.keyInSelect(priorities, chalk.cyan('Priority?'));
        if (pIdx >= 0) filtered = this.taskManager.getTasksByPriority(priorities[pIdx]);
        break;

      case 2: // Category
        const categories = ['study', 'work', 'personal', 'health', 'other'];
        const cIdx = readlineSync.keyInSelect(categories, chalk.cyan('Category?'));
        if (cIdx >= 0) filtered = this.taskManager.getTasksByCategory(categories[cIdx]);
        break;

      case 3: // Overdue
        filtered = this.taskManager.getAllTasks().filter(t => {
          if (!t.dueDate || t.status === 'done') return false;
          return new Date(t.dueDate) < new Date();
        });
        break;

      default:
        return;
    }

    Display.showTaskList(filtered, 'Filtered Results');
    this.#pauseAndContinue();
  }

  // ─── Sort ───
  handleSort() {
    Display.showHeader('Sort Tasks');

    const sortOptions = ['Date (newest first)', 'Date (oldest first)',
                         'Priority (high first)', 'Priority (low first)',
                         'Due Date (soonest first)', 'Title (A-Z)'];
    const sIndex = readlineSync.keyInSelect(sortOptions, chalk.cyan('Sort by?'), {
      cancel: 'Back'
    });

    let sorted = [];
    switch (sIndex) {
      case 0: sorted = this.taskManager.getSortedTasks('createdAt', 'desc'); break;
      case 1: sorted = this.taskManager.getSortedTasks('createdAt', 'asc'); break;
      case 2: sorted = this.taskManager.getSortedTasks('priority', 'desc'); break;
      case 3: sorted = this.taskManager.getSortedTasks('priority', 'asc'); break;
      case 4: sorted = this.taskManager.getSortedTasks('dueDate', 'asc'); break;
      case 5: sorted = this.taskManager.getSortedTasks('title', 'asc'); break;
      default: return;
    }

    Display.showTaskList(sorted, `Sorted: ${sortOptions[sIndex]}`);
    this.#pauseAndContinue();
  }

  // ─── Clear Completed ───
  handleClearCompleted() {
    const result = this.taskManager.clearCompleted();
    if (result.deletedCount > 0) {
      Display.success(`${result.deletedCount} completed tasks delete kiye!`);
    } else {
      Display.info('Koi completed task nahi tha.');
    }
    this.#pauseAndContinue();
  }

  // ─── Backup ───
  handleBackup() {
    const backed = this.taskManager.createBackup();
    if (backed) {
      Display.success('Backup created successfully!');
    } else {
      Display.error('Backup fail ho gaya!');
    }
    this.#pauseAndContinue();
  }

  // ─── Helper: Pause ───
  #pauseAndContinue() {
    console.log('');
    readlineSync.keyInPause(chalk.gray('  Enter press karo continue karne ke liye...'));
  }

  // ─── Main Loop ───
  run() {
    let running = true;

    while (running) {
      const choice = this.showMainMenu();

      switch (choice) {
        case 0: this.handleListTasks(); break;
        case 1: this.handleAddTask(); break;
        case 2: this.handleUpdateTask(); break;
        case 3: this.handleMarkDone(); break;
        case 4: this.handleDeleteTask(); break;
        case 5: this.handleSearch(); break;
        case 6: this.handleFilter(); break;
        case 7: this.handleSort(); break;
        case 8: this.handleClearCompleted(); break;
        case 9: this.handleBackup(); break;
        case 10:
          Display.info('Bye! Happy coding! 👋');
          running = false;
          break;
      }
    }
  }
}

module.exports = Menu;
```

---

## Entry Point — index.js

```javascript
// src/index.js
// App ka entry point — yahan se sab shuru hota hai

const Menu = require('./Menu');

try {
  const menu = new Menu();
  menu.run();
} catch (err) {
  console.error('\n❌ Fatal Error:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}
```

> **Terminal Command:**
> ```bash
> # App chalao!
> npm start
>
> # Ya development mode mein (auto-restart on changes)
> npm run dev
> ```

> **Expected Output:**
> ```
>   ╔══════════════════════════════════════╗
>   ║     📋 CLI Task Manager v1.0        ║
>   ║     Phase 1 Project                 ║
>   ╚══════════════════════════════════════╝
>
>   [1] 📋 List All Tasks
>   [2] ➕ Add New Task
>   [3] ✏️  Update Task
>   ...
>   Kya karna hai? [1...11]:
> ```

---

## Testing — Manual Test Script

```javascript
// tests/taskManager.test.js
// Manual tests — check karo sab kaam kar raha hai

const path = require('path');
const TaskManager = require('../src/TaskManager');
const fs = require('fs');

// Test file use karo — real data ko touch mat karo!
const testDataPath = path.join(__dirname, 'test_tasks.json');

// Cleanup before tests
if (fs.existsSync(testDataPath)) {
  fs.unlinkSync(testDataPath);
}

const tm = new TaskManager(testDataPath);
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ FAIL: ${name} — ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

console.log('\n📋 Running TaskManager Tests...\n');

// Test: Add task
test('Add a valid task', () => {
  const result = tm.addTask({ title: "Test task 1", priority: "high" });
  assert(result.success, "Should succeed");
  assert(result.task.title === "Test task 1", "Title should match");
  assert(result.task.status === "pending", "Default status = pending");
});

// Test: Add task with short title
test('Reject short title', () => {
  const result = tm.addTask({ title: "ab" });
  assert(!result.success, "Should fail");
  assert(result.error.includes("3 characters"), "Error should mention min length");
});

// Test: Add task with invalid priority
test('Reject invalid priority', () => {
  const result = tm.addTask({ title: "Valid title", priority: "ultra" });
  assert(!result.success, "Should fail");
});

// Test: Get all tasks
test('Get all tasks', () => {
  const tasks = tm.getAllTasks();
  assert(tasks.length >= 1, "Should have at least 1 task");
});

// Test: Update task
test('Update task status', () => {
  const tasks = tm.getAllTasks();
  const result = tm.updateTask(tasks[0].id, { status: "in-progress" });
  assert(result.success, "Should succeed");
  assert(result.task.status === "in-progress", "Status updated");
});

// Test: Search
test('Search tasks', () => {
  tm.addTask({ title: "Learn JavaScript basics" });
  const results = tm.searchTasks("JavaScript");
  assert(results.length >= 1, "Should find at least 1");
});

// Test: Delete task
test('Delete task', () => {
  const tasks = tm.getAllTasks();
  const countBefore = tasks.length;
  const result = tm.deleteTask(tasks[0].id);
  assert(result.success, "Should succeed");
  assert(tm.getAllTasks().length === countBefore - 1, "Count should decrease");
});

// Test: Stats
test('Get stats', () => {
  const stats = tm.getStats();
  assert(typeof stats.total === 'number', "Should have total");
  assert(typeof stats.pending === 'number', "Should have pending");
});

// Cleanup
fs.unlinkSync(testDataPath);

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
```

> **Terminal Command:**
> ```bash
> npm test
> # Output: 📋 Running TaskManager Tests...
> #   ✅ PASS: Add a valid task
> #   ✅ PASS: Reject short title
> #   ... aur tests
> #   Results: 8 passed, 0 failed
> ```

---

## Quick Revision Table

| Module | Kya Add Kiya | Key Feature |
|--------|-------------|-------------|
| Menu.js | Interactive menu system | readline-sync + switch/case |
| index.js | Entry point | Try-catch for fatal errors |
| Search | Title, description, tags mein | String.includes() |
| Filter | Status, priority, category, overdue | Array.filter() |
| Sort | Date, priority, due date, title | Array.sort() with comparator |
| Tests | Manual test script | assert-based testing |

---

## Aaj Kya Seekha?

1. **Interactive menu** — readline-sync se user input lena
2. **Search functionality** — multiple fields mein search karna
3. **Filter system** — status, priority, category, overdue
4. **Sort options** — multiple criteria se sort karna
5. **Entry point pattern** — index.js se app start karna
6. **Manual testing** — basic test functions likhna

> **Tip:** Kal project finish karenge — code cleanup, documentation, git best practices, aur code review. Aaj raat mein project ko chalao aur bugs dhundho!
