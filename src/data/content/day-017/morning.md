# Day 17 Morning: DSA — Stack & Queue — LIFO Aur FIFO Samjho

> **Aaj ka plan:** Aaj hum do fundamental data structures seekhenge — **Stack** (LIFO) aur **Queue** (FIFO). Real-world examples se samjhenge, JavaScript mein classes banayenge, aur important operations (push, pop, enqueue, dequeue) implement karenge.

---

## Stack Kya Hai? — LIFO (Last In, First Out)

### Concept

Stack mein jo element **last mein aata hai, wo pehle bahar jaata hai**. Jaise books ka stack — upar wali kitab pehle uthate ho!

```
    ┌─────┐
    │  5  │  ← Top (ye pehle niklega)
    ├─────┤
    │  4  │
    ├──��──┤
    │  3  │
    ├���────┤
    │  2  │
    ├─────┤
    │  1  │  ← Bottom (ye last mein niklega)
    └─────┘
```

> **Socho Aise:** 
> - Roti ka stack — sabse upar wali roti pehle milti hai
> - Kapdon ka stack almari mein — upar se nikalte ho, upar se rakhte ho
> - Thali ka stack hotel mein — sabse upar wali thali pehle uthao

### Real-World Examples of Stack

| Example | Kaise Stack Hai |
|---------|----------------|
| **Browser Back Button** | Har page visit = push. Back = pop (last page aata hai) |
| **Ctrl+Z (Undo)** | Har action push hota hai. Undo = pop (last action reverse) |
| **Function Call Stack** | Jab function call hota hai = push. Return = pop |
| **Thali/Plate stack** | Last placed plate is first picked up |
| **Mobile app navigation** | Back button pichle screen pe le jaata hai |

> **Yaad Rakho:** Stack = **LIFO** — Last In, First Out. Jo last mein aaya, wo pehle jayega!

### Stack Operations

| Operation | Kya Karta Hai | Time Complexity |
|-----------|--------------|----------------|
| **push(item)** | Top pe element add karo | O(1) |
| **pop()** | Top se element nikalo | O(1) |
| **peek()** / **top()** | Top element dekho (nikalte nahi) | O(1) |
| **isEmpty()** | Stack khaali hai ya nahi | O(1) |
| **size()** | Kitne elements hain | O(1) |

> **Yaad Rakho:** Stack ki saari operations **O(1)** hain — constant time! Bahut fast.

---

## Stack Implementation — JavaScript Class

### Array-Based Stack

```javascript
// stack.js — Stack class implementation

class Stack {
    constructor() {
        this.items = [];   // Internal storage
    }

    // Push — top pe add karo
    push(item) {
        this.items.push(item);
        return this;  // Chaining ke liye
    }

    // Pop — top se nikalo
    pop() {
        if (this.isEmpty()) {
            return "Stack is empty! (Underflow)";
        }
        return this.items.pop();
    }

    // Peek — top element dekho (nikalte nahi)
    peek() {
        if (this.isEmpty()) {
            return "Stack is empty!";
        }
        return this.items[this.items.length - 1];
    }

    // isEmpty — khaali hai?
    isEmpty() {
        return this.items.length === 0;
    }

    // Size — kitne elements hain
    size() {
        return this.items.length;
    }

    // Clear — sab hata do
    clear() {
        this.items = [];
    }

    // Display — stack dikhao
    display() {
        if (this.isEmpty()) {
            console.log("  [Empty Stack]");
            return;
        }
        console.log("  --- TOP ---");
        for (let i = this.items.length - 1; i >= 0; i--) {
            console.log(`  | ${this.items[i]} |`);
        }
        console.log("  --- BOTTOM ---");
    }
}

// ===== TESTING =====
const stack = new Stack();

console.log("=== STACK DEMO ===\n");

// Push operations
stack.push(10);
stack.push(20);
stack.push(30);
stack.push(40);
console.log("After pushing 10, 20, 30, 40:");
stack.display();

// Peek
console.log("\nPeek (top element):", stack.peek());  // 40

// Pop
console.log("Pop:", stack.pop());   // 40
console.log("Pop:", stack.pop());   // 30
console.log("\nAfter 2 pops:");
stack.display();

// Size
console.log("\nSize:", stack.size());      // 2
console.log("Is Empty?", stack.isEmpty()); // false

// Export karo (doosri files mein use ke liye)
module.exports = Stack;
```

> **Terminal Command:**
> ```bash
> node stack.js
> ```

---

## Stack Use Case: Browser History

```javascript
// browser-history.js — Stack se browser back button simulate karo

class BrowserHistory {
    constructor() {
        this.backStack = [];    // Back button ke liye
        this.forwardStack = []; // Forward button ke liye
        this.currentPage = "home";
    }

    // Naya page visit karo
    visit(url) {
        this.backStack.push(this.currentPage);  // Current page back stack mein
        this.currentPage = url;
        this.forwardStack = [];  // Forward history clear (naya path)
        console.log(`📄 Visiting: ${url}`);
    }

    // Back button
    back() {
        if (this.backStack.length === 0) {
            console.log("⚠️  Cannot go back — no history!");
            return;
        }
        this.forwardStack.push(this.currentPage);
        this.currentPage = this.backStack.pop();
        console.log(`⬅️  Back to: ${this.currentPage}`);
    }

    // Forward button
    forward() {
        if (this.forwardStack.length === 0) {
            console.log("⚠️  Cannot go forward!");
            return;
        }
        this.backStack.push(this.currentPage);
        this.currentPage = this.forwardStack.pop();
        console.log(`➡��  Forward to: ${this.currentPage}`);
    }

    // Current status
    status() {
        console.log(`\n🌐 Current: ${this.currentPage}`);
        console.log(`⬅️  Back stack: [${this.backStack.join(" → ")}]`);
        console.log(`➡️  Forward stack: [${this.forwardStack.join(" → ")}]`);
    }
}

// Test karo
const browser = new BrowserHistory();

browser.visit("google.com");
browser.visit("github.com");
browser.visit("stackoverflow.com");
browser.visit("nodejs.org");
browser.status();

browser.back();   // stackoverflow.com
browser.back();   // github.com
browser.status();

browser.forward(); // stackoverflow.com
browser.status();

browser.visit("youtube.com");  // Naya path — forward history clear!
browser.status();
```

---

## Stack Use Case: Undo Feature

```javascript
// undo-demo.js — Text editor ka undo feature

class TextEditor {
    constructor() {
        this.content = "";
        this.history = [];  // Stack for undo
    }

    type(text) {
        this.history.push(this.content);  // Puraana state save karo
        this.content += text;
        console.log(`Typed: "${text}" → "${this.content}"`);
    }

    undo() {
        if (this.history.length === 0) {
            console.log("Nothing to undo!");
            return;
        }
        this.content = this.history.pop();
        console.log(`Undo → "${this.content}"`);
    }

    show() {
        console.log(`Current: "${this.content}"`);
    }
}

const editor = new TextEditor();
editor.type("Hello ");
editor.type("World ");
editor.type("from ");
editor.type("Node.js!");
editor.show();   // "Hello World from Node.js!"

editor.undo();   // "Hello World from "
editor.undo();   // "Hello World "
editor.show();   // "Hello World "
```

---

## Queue Kya Hai? — FIFO (First In, First Out)

### Concept

Queue mein jo element **pehle aata hai, wo pehle bahar jaata hai**. Jaise line mein khade log — pehle aaya, pehle gaya!

```
 Enqueue →  ┌───┬───┬───┬───┬───┐  → Dequeue
            │ 5 │ 4 │ 3 │ 2 │ 1 │
            └───┴───┴───┴───┴───┘
           Rear                Front
  (yahan add)           (yahan se niklo)
```

> **Socho Aise:**
> - Cinema ticket line — pehle aaya, pehle ticket milega
> - Printer queue — pehle bheja document pehle print hoga
> - Customer support — pehle call kiya, pehle response milega
> - Bus stop line — pehle aaya, pehle bus mein chadhega

### Real-World Examples of Queue

| Example | Kaise Queue Hai |
|---------|----------------|
| **Printer Queue** | Documents FIFO order mein print hote hain |
| **Ticket Counter** | Pehle aaye, pehle serve hue |
| **CPU Task Scheduler** | Processes turn-by-turn execute hote hain |
| **Message Queue** | Messages order mein process hote hain |
| **Video Buffering** | Data packets order mein aate hain |

> **Yaad Rakho:** Queue = **FIFO** — First In, First Out. Jo pehle aaya, wo pehle jayega!

### Queue Operations

| Operation | Kya Karta Hai | Time Complexity |
|-----------|--------------|----------------|
| **enqueue(item)** | Rear pe add karo | O(1) |
| **dequeue()** | Front se nikalo | O(1)* |
| **front()** / **peek()** | Front element dekho | O(1) |
| **isEmpty()** | Queue khaali hai? | O(1) |
| **size()** | Kitne elements hain | O(1) |

---

## Queue Implementation — JavaScript Class

```javascript
// queue.js — Queue class implementation

class Queue {
    constructor() {
        this.items = [];
    }

    // Enqueue — rear pe add karo
    enqueue(item) {
        this.items.push(item);
        return this;
    }

    // Dequeue — front se nikalo
    dequeue() {
        if (this.isEmpty()) {
            return "Queue is empty! (Underflow)";
        }
        return this.items.shift();  // Pehla element nikalo
    }

    // Front — pehla element dekho (nikalte nahi)
    front() {
        if (this.isEmpty()) {
            return "Queue is empty!";
        }
        return this.items[0];
    }

    // Rear — last element dekho
    rear() {
        if (this.isEmpty()) {
            return "Queue is empty!";
        }
        return this.items[this.items.length - 1];
    }

    // isEmpty
    isEmpty() {
        return this.items.length === 0;
    }

    // Size
    size() {
        return this.items.length;
    }

    // Clear
    clear() {
        this.items = [];
    }

    // Display
    display() {
        if (this.isEmpty()) {
            console.log("  [Empty Queue]");
            return;
        }
        console.log(`  Front → [${this.items.join(" | ")}] ← Rear`);
    }
}

// ===== TESTING =====
const queue = new Queue();

console.log("=== QUEUE DEMO ===\n");

// Enqueue
queue.enqueue("Customer 1");
queue.enqueue("Customer 2");
queue.enqueue("Customer 3");
queue.enqueue("Customer 4");
console.log("After enqueuing 4 customers:");
queue.display();

// Front
console.log("\nFront:", queue.front());  // Customer 1

// Dequeue
console.log("Dequeue:", queue.dequeue());  // Customer 1
console.log("Dequeue:", queue.dequeue());  // Customer 2
console.log("\nAfter 2 dequeues:");
queue.display();

// Size
console.log("\nSize:", queue.size());        // 2
console.log("Is Empty?", queue.isEmpty());  // false

module.exports = Queue;
```

> **Warning:** `Array.shift()` actually O(n) hai (saare elements shift hote hain). Real-world mein Linked List ya circular buffer se O(1) dequeue hota hai. Abhi ke liye array version theek hai.

---

## Queue Use Case: Printer Queue

```javascript
// printer-queue.js — Print job management

class PrinterQueue {
    constructor(printerName) {
        this.printerName = printerName;
        this.queue = [];
        this.currentJob = null;
        this.completedJobs = 0;
    }

    addJob(document, pages, user) {
        const job = {
            id: this.queue.length + this.completedJobs + 1,
            document,
            pages,
            user,
            addedAt: new Date().toLocaleTimeString()
        };
        this.queue.push(job);
        console.log(`📥 Job #${job.id} added: "${document}" (${pages} pages) by ${user}`);
    }

    processNext() {
        if (this.queue.length === 0) {
            console.log("📭 No jobs in queue!");
            return;
        }

        const job = this.queue.shift();
        this.currentJob = job;
        console.log(`🖨️  Printing Job #${job.id}: "${job.document}" (${job.pages} pages)`);

        // Simulate printing time (pages × 100ms)
        this.completedJobs++;
        this.currentJob = null;
        console.log(`✅ Job #${job.id} complete!`);
    }

    status() {
        console.log(`\n=== ${this.printerName} STATUS ===`);
        console.log(`Jobs in queue : ${this.queue.length}`);
        console.log(`Jobs completed: ${this.completedJobs}`);

        if (this.queue.length > 0) {
            console.log("\nPending Jobs:");
            this.queue.forEach((job, i) => {
                console.log(`  ${i + 1}. [#${job.id}] "${job.document}" — ${job.pages} pages (${job.user})`);
            });
        }
    }
}

// Test karo
const printer = new PrinterQueue("Office HP LaserJet");

printer.addJob("Report Q1.pdf", 15, "Rahul");
printer.addJob("Invoice.xlsx", 3, "Priya");
printer.addJob("Presentation.pptx", 25, "Amit");
printer.addJob("Letter.docx", 2, "Neha");

printer.status();

console.log("\n--- Processing ---");
printer.processNext();  // Report Q1.pdf
printer.processNext();  // Invoice.xlsx

printer.status();
```

---

## Stack vs Queue — Clear Comparison

| Feature | Stack (LIFO) | Queue (FIFO) |
|---------|-------------|-------------|
| **Order** | Last In, First Out | First In, First Out |
| **Add** | push() — top pe | enqueue() — rear pe |
| **Remove** | pop() — top se | dequeue() — front se |
| **View** | peek() — top element | front() — first element |
| **Real Example** | Browser back, Undo | Printer, Ticket line |
| **Visualization** | Vertical stack of plates | Horizontal queue of people |

```
STACK:                    QUEUE:
  ┌───┐                  
  │ C │ ← push/pop       enqueue → [A][B][C] → dequeue
  ├───┤                   
  │ B │                   Front = A (pehle nikle)
  ├───┤                   Rear = C (last mein aaya)
  │ A │
  └───┘
  Top = C (last mein aaya, pehle niklega)
```

---

## Function Call Stack — JavaScript Engine

```javascript
// call-stack-demo.js — JS ka internal stack samjho

function multiply(a, b) {
    return a * b;       // Step 4: Calculate, return, POP
}

function square(n) {
    return multiply(n, n);  // Step 3: Call multiply, PUSH
}

function printSquare(n) {
    const result = square(n);  // Step 2: Call square, PUSH
    console.log(result);       // Step 5: Print result
}

printSquare(5);  // Step 1: Call printSquare, PUSH

/*
Call Stack visualization:

Step 1: [printSquare(5)]
Step 2: [printSquare(5), square(5)]
Step 3: [printSquare(5), square(5), multiply(5,5)]
Step 4: [printSquare(5), square(5)]  ← multiply returned, POP
Step 5: [printSquare(5)]             ← square returned, POP
Step 6: []                           ← printSquare done, POP (stack empty)
*/
```

> **Yaad Rakho:** JavaScript ek **single-threaded** language hai — ek hi call stack hai. Isliye agar ek function bahut der tak chale (infinite loop), to poora program ruk jaata hai — "Stack Overflow"!

### Stack Overflow Example

```javascript
// ❌ YE MAT KARO — infinite recursion!
function badFunction() {
    badFunction();  // Khud ko call karta jaayega — stack full ho jayega!
}
// badFunction();  // RangeError: Maximum call stack size exceeded
```

---

## Quick Revision Table

| Concept | Key Point |
|---------|-----------|
| **Stack** | LIFO — Last In, First Out |
| **push()** | Stack ke top pe add karo |
| **pop()** | Stack ke top se nikalo |
| **peek()** | Top element dekho (nikalte nahi) |
| **Queue** | FIFO — First In, First Out |
| **enqueue()** | Queue ke rear pe add karo |
| **dequeue()** | Queue ke front se nikalo |
| **front()** | Pehla element dekho |
| **Call Stack** | JS engine ka internal stack for function calls |
| **Stack Overflow** | Jab stack full ho jaaye (infinite recursion) |
| **All ops O(1)** | Push, pop, enqueue, dequeue — sab constant time |

---

## Aaj Kya Seekha?

1. **Stack** = LIFO — last in first out — push/pop/peek operations
2. **Queue** = FIFO — first in first out — enqueue/dequeue/front operations
3. **Browser back button** Stack use karta hai
4. **Printer queue** Queue use karti hai
5. **JS Call Stack** — functions ek stack mein manage hote hain
6. **Stack Overflow** — infinite recursion se hota hai
7. **Saari operations O(1)** — Stack aur Queue bahut fast hain

> **Tip:** Evening mein hum Stack aur Queue classes implement karenge, bracket matching problem solve karenge, aur stack se string reverse karenge. Visualization yaad rakho!
