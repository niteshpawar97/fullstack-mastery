# Day 17 Evening: Stack & Queue Practice — Bracket Matching, Reverse String & More

> **Practice Time!** Morning mein seekha Stack (LIFO) aur Queue (FIFO). Ab inhe implement karenge aur classic problems solve karenge — bracket matching, string reverse, aur real-world simulations!

---

## Setup: Project Folder Banao

> **Terminal Command:**
> ```bash
> mkdir day17-stack-queue
> cd day17-stack-queue
> git init
> code .
> ```

---

## Task 1: Complete Stack Class with Extra Features

### Problem Statement

Ek production-ready Stack class banao with min tracking, toArray, aur print features.

### Solution

```javascript
// Stack.js — Enhanced Stack class

class Stack {
    constructor(maxSize = Infinity) {
        this.items = [];
        this.maxSize = maxSize;  // Optional max size limit
    }

    push(item) {
        if (this.items.length >= this.maxSize) {
            console.log(`Stack Overflow! Max size: ${this.maxSize}`);
            return false;
        }
        this.items.push(item);
        return true;
    }

    pop() {
        if (this.isEmpty()) {
            console.log("Stack Underflow! Stack is empty.");
            return undefined;
        }
        return this.items.pop();
    }

    peek() {
        if (this.isEmpty()) return undefined;
        return this.items[this.items.length - 1];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    isFull() {
        return this.items.length >= this.maxSize;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }

    toArray() {
        return [...this.items];  // Copy return karo
    }

    // Stack mein koi element hai?
    contains(item) {
        return this.items.includes(item);
    }

    print() {
        if (this.isEmpty()) {
            console.log("[Empty Stack]");
            return;
        }
        console.log("┌─────────┐");
        for (let i = this.items.length - 1; i >= 0; i--) {
            const marker = i === this.items.length - 1 ? " ← TOP" : "";
            console.log(`│ ${String(this.items[i]).padEnd(7)} │${marker}`);
            if (i > 0) console.log("├─────────┤");
        }
        console.log("└─────────┘");
    }
}

// ===== TESTING =====
console.log("=== ENHANCED STACK ===\n");

const stack = new Stack(5);  // Max 5 elements

stack.push("A");
stack.push("B");
stack.push("C");
stack.push("D");
stack.push("E");
stack.print();

stack.push("F");  // Stack Overflow!

console.log("\nContains 'C'?", stack.contains("C"));  // true
console.log("Is Full?", stack.isFull());  // true
console.log("To Array:", stack.toArray());

stack.pop();
stack.pop();
console.log("\nAfter 2 pops:");
stack.print();

module.exports = Stack;
```

> **Terminal Command:**
> ```bash
> node Stack.js
> ```

---

## Task 2: Complete Queue Class

### Solution

```javascript
// Queue.js — Enhanced Queue class

class Queue {
    constructor(maxSize = Infinity) {
        this.items = [];
        this.maxSize = maxSize;
    }

    enqueue(item) {
        if (this.items.length >= this.maxSize) {
            console.log("Queue is full!");
            return false;
        }
        this.items.push(item);
        return true;
    }

    dequeue() {
        if (this.isEmpty()) {
            console.log("Queue is empty!");
            return undefined;
        }
        return this.items.shift();
    }

    front() {
        if (this.isEmpty()) return undefined;
        return this.items[0];
    }

    rear() {
        if (this.isEmpty()) return undefined;
        return this.items[this.items.length - 1];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }

    toArray() {
        return [...this.items];
    }

    print() {
        if (this.isEmpty()) {
            console.log("[Empty Queue]");
            return;
        }
        const items = this.items.map(String).join(" → ");
        console.log(`Front [${items}] Rear`);
    }
}

// ===== TESTING =====
console.log("=== ENHANCED QUEUE ===\n");

const queue = new Queue();

queue.enqueue("Task A");
queue.enqueue("Task B");
queue.enqueue("Task C");
queue.enqueue("Task D");
queue.print();  // Front [Task A → Task B → Task C → Task D] Rear

console.log("Front:", queue.front());  // Task A
console.log("Rear:", queue.rear());    // Task D

queue.dequeue();
queue.dequeue();
console.log("\nAfter 2 dequeues:");
queue.print();

module.exports = Queue;
```

---

## Task 3: Bracket Matching Problem (Stack Classic!)

### Problem Statement

Ek string diya hai brackets ke saath — check karo ki brackets **valid** hain ya nahi.

Valid: `()`, `[]`, `{}`, `({[]})`, `()[]{}`
Invalid: `(]`, `([)]`, `{(}`, `(((`

### Approach

1. String mein ek ek character dekho
2. Agar opening bracket hai `(`, `[`, `{` — stack mein push karo
3. Agar closing bracket hai `)`, `]`, `}` — stack se pop karo aur match check karo
4. End mein stack empty hona chahiye

### Solution

```javascript
// bracket-matching.js — Stack se bracket validation
const Stack = require("./Stack");

function isValidBrackets(str) {
    const stack = new Stack();

    // Matching pairs define karo
    const matchingPairs = {
        ")": "(",
        "]": "[",
        "}": "{"
    };

    const openBrackets = new Set(["(", "[", "{"]);
    const closeBrackets = new Set([")", "]", "}"]);

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (openBrackets.has(char)) {
            // Opening bracket — push karo
            stack.push(char);
        }
        else if (closeBrackets.has(char)) {
            // Closing bracket — pop karke match check karo
            if (stack.isEmpty()) {
                return {
                    valid: false,
                    reason: `Extra closing bracket '${char}' at position ${i}`
                };
            }

            const top = stack.pop();
            if (top !== matchingPairs[char]) {
                return {
                    valid: false,
                    reason: `Mismatch: '${top}' opened but '${char}' closed at position ${i}`
                };
            }
        }
        // Non-bracket characters ignore karo
    }

    if (!stack.isEmpty()) {
        return {
            valid: false,
            reason: `${stack.size()} bracket(s) not closed: ${stack.toArray().join(", ")}`
        };
    }

    return { valid: true, reason: "All brackets matched!" };
}

// ===== TESTING =====
console.log("=== BRACKET MATCHING ===\n");

const testCases = [
    "()",
    "()[]{}",
    "({[]})",
    "(]",
    "([)]",
    "{(}",
    "(((",
    "",
    "function sum(a, b) { return (a + b); }",
    "arr[i] = obj.method({key: 'value'})",
    "if (x > 0) { console.log([1,2,3]) }",
    "((())",
    "Hello World (no brackets issue)",
    "{ [ ( ] ) }"
];

testCases.forEach(test => {
    const result = isValidBrackets(test);
    const status = result.valid ? "✅ VALID  " : "❌ INVALID";
    console.log(`${status} | "${test}"`);
    if (!result.valid) {
        console.log(`            └── ${result.reason}`);
    }
});
```

> **Terminal Command:**
> ```bash
> node bracket-matching.js
> ```

> **Expected Output:**
> ```
> ✅ VALID   | "()"
> ✅ VALID   | "()[]"
> ✅ VALID   | "({[]})"
> ❌ INVALID | "(]"
>             └── Mismatch: '(' opened but ']' closed at position 1
> ❌ INVALID | "((("
>             └── 3 bracket(s) not closed: (, (, (
> ```

> **Yaad Rakho:** Bracket matching interview ka **bahut common** question hai. Stack perfect fit hai is problem ke liye!

---

## Task 4: Reverse String with Stack

### Problem Statement

Stack use karke string reverse karo.

### Solution

```javascript
// reverse-string.js — Stack se string reverse karo
const Stack = require("./Stack");

// Method 1: Stack se reverse
function reverseWithStack(str) {
    const stack = new Stack();

    // Saare characters push karo
    for (const char of str) {
        stack.push(char);
    }

    // Pop karke reversed string banao
    let reversed = "";
    while (!stack.isEmpty()) {
        reversed += stack.pop();
    }

    return reversed;
}

// Method 2: Built-in methods (comparison ke liye)
function reverseBuiltIn(str) {
    return str.split("").reverse().join("");
}

// Method 3: Loop se
function reverseLoop(str) {
    let reversed = "";
    for (let i = str.length - 1; i >= 0; i--) {
        reversed += str[i];
    }
    return reversed;
}

// ===== TESTING =====
console.log("=== REVERSE STRING ===\n");

const testStrings = [
    "Hello",
    "Namaste",
    "Stack",
    "racecar",
    "12345",
    "JavaScript"
];

testStrings.forEach(str => {
    const reversed = reverseWithStack(str);
    const isPalindrome = str.toLowerCase() === reversed.toLowerCase();
    console.log(`"${str}" → "${reversed}" ${isPalindrome ? "(Palindrome!)" : ""}`);
});

// Reverse words in a sentence (order reverse, words intact)
function reverseWords(sentence) {
    const stack = new Stack();
    const words = sentence.split(" ");

    words.forEach(word => stack.push(word));

    const reversed = [];
    while (!stack.isEmpty()) {
        reversed.push(stack.pop());
    }

    return reversed.join(" ");
}

console.log("\n=== REVERSE WORDS ===\n");
console.log(reverseWords("I love JavaScript"));
// Output: "JavaScript love I"
console.log(reverseWords("Kisan mandi mein gaya"));
// Output: "gaya mein mandi Kisan"
```

---

## Task 5: Kisan Mandi Queue Simulation

### Problem Statement

Mandi mein kisan aate hain, line mein lagte hain, turn by turn serve hote hain. Queue se simulate karo.

### Solution

```javascript
// mandi-queue.js — Kisan mandi ka queue system
const Queue = require("./Queue");

class MandiCounter {
    constructor(counterName) {
        this.counterName = counterName;
        this.queue = new Queue();
        this.servedCount = 0;
        this.totalWaitTime = 0;
    }

    // Kisan aaya — line mein lago
    arrival(kisanName, crop, quantity) {
        const token = {
            tokenNo: this.queue.size() + this.servedCount + 1,
            kisanName,
            crop,
            quantity,
            arrivalTime: Date.now()
        };

        this.queue.enqueue(token);
        console.log(`🎫 Token #${token.tokenNo}: ${kisanName} — ${quantity}kg ${crop} (Line position: ${this.queue.size()})`);
        return token.tokenNo;
    }

    // Agla kisan serve karo
    serveNext() {
        if (this.queue.isEmpty()) {
            console.log("📭 Line khaali hai! Koi kisan nahi.");
            return null;
        }

        const kisan = this.queue.dequeue();
        this.servedCount++;

        const waitTime = ((Date.now() - kisan.arrivalTime) / 1000).toFixed(1);
        this.totalWaitTime += parseFloat(waitTime);

        console.log(`\n🏪 Serving Token #${kisan.tokenNo}: ${kisan.kisanName}`);
        console.log(`   Crop: ${kisan.crop} | Quantity: ${kisan.quantity}kg`);
        console.log(`   Wait time: ${waitTime}s`);

        return kisan;
    }

    // Status
    status() {
        console.log(`\n╔══════════════════════════════╗`);
        console.log(`║  ${this.counterName.padEnd(26)}║`);
        console.log(`╠══════════════════════════════╣`);
        console.log(`║  In Queue    : ${String(this.queue.size()).padEnd(13)}║`);
        console.log(`║  Served      : ${String(this.servedCount).padEnd(13)}║`);

        if (this.servedCount > 0) {
            const avgWait = (this.totalWaitTime / this.servedCount).toFixed(1);
            console.log(`║  Avg Wait    : ${(avgWait + "s").padEnd(13)}║`);
        }

        console.log(`╚══════════════════════════════╝`);

        if (this.queue.size() > 0) {
            console.log("\nWaiting list:");
            this.queue.toArray().forEach((k, i) => {
                console.log(`  ${i + 1}. Token #${k.tokenNo} — ${k.kisanName} (${k.quantity}kg ${k.crop})`);
            });
        }
    }
}

// ===== SIMULATION =====
console.log("=== KISAN MANDI QUEUE ===\n");

const counter = new MandiCounter("Counter 1 - Sabzi Mandi");

// Kisan aate hain
counter.arrival("Ramesh Patil", "Tomato", 500);
counter.arrival("Suresh Yadav", "Onion", 300);
counter.arrival("Dinesh Kumar", "Potato", 800);
counter.arrival("Kamal Singh", "Wheat", 1000);
counter.arrival("Priya Devi", "Cotton", 200);

counter.status();

// Serve karo
counter.serveNext();
counter.serveNext();

counter.status();

// Aur kisan aaye
counter.arrival("Ravi Sharma", "Rice", 600);

counter.serveNext();
counter.status();
```

> **Terminal Command:**
> ```bash
> node mandi-queue.js
> ```

---

## Task 6: Stack-Based Expression Evaluator (Bonus)

### Problem Statement

Postfix expression evaluate karo using Stack.

```javascript
// postfix-eval.js — Stack se math expression solve karo
const Stack = require("./Stack");

// Postfix (Reverse Polish Notation) evaluation
// "3 4 +" means 3 + 4 = 7
// "3 4 + 2 *" means (3 + 4) * 2 = 14
function evaluatePostfix(expression) {
    const stack = new Stack();
    const tokens = expression.split(" ");

    console.log(`\nExpression: ${expression}`);
    console.log("Steps:");

    for (const token of tokens) {
        if (!isNaN(token)) {
            // Number hai — push karo
            stack.push(parseFloat(token));
            console.log(`  Push ${token} → Stack: [${stack.toArray().join(", ")}]`);
        } else {
            // Operator hai — do numbers pop karo, calculate karo, result push karo
            const b = stack.pop();  // Doosra number (top pe)
            const a = stack.pop();  // Pehla number

            let result;
            switch (token) {
                case "+": result = a + b; break;
                case "-": result = a - b; break;
                case "*": result = a * b; break;
                case "/": result = a / b; break;
            }

            stack.push(result);
            console.log(`  ${a} ${token} ${b} = ${result} → Stack: [${stack.toArray().join(", ")}]`);
        }
    }

    return stack.pop();
}

// Test karo
console.log("=== POSTFIX EXPRESSION EVALUATOR ===");

console.log("\nResult:", evaluatePostfix("3 4 +"));           // 7
console.log("\nResult:", evaluatePostfix("3 4 + 2 *"));       // 14
console.log("\nResult:", evaluatePostfix("5 1 2 + 4 * + 3 -")); // 14
// Explanation: 5 + ((1 + 2) * 4) - 3 = 5 + 12 - 3 = 14
```

---

## Task 7: Git Commit

```bash
git add .
git status
git commit -m "Day 17: Stack & Queue - bracket matching, string reverse, mandi queue, postfix evaluator"
git log --oneline
```

---

## Mini Challenges

> **Practice Time!** Khud solve karo:

### Challenge 1: Min Stack

Ek special stack banao jahan `getMin()` O(1) mein minimum element de — bina poora stack scan kiye!

```javascript
// Hint: Ek extra stack rakho jo har step pe minimum track kare
class MinStack {
    constructor() {
        this.stack = [];
        this.minStack = [];  // Ye hamesha current minimum track karega
    }

    push(val) {
        this.stack.push(val);
        // minStack mein current minimum push karo
        // Tumhara code yahan...
    }

    getMin() {
        // O(1) mein minimum return karo
        // Tumhara code yahan...
    }
}
```

### Challenge 2: Queue Using Two Stacks

Do stacks use karke ek queue implement karo! (Popular interview question)

```javascript
// Hint: Ek stack enqueue ke liye, doosra dequeue ke liye
// Jab dequeue karo — agar stack2 empty hai to stack1 se sab pop karke stack2 mein push karo
class QueueFromStacks {
    constructor() {
        this.stack1 = [];  // enqueue ke liye
        this.stack2 = [];  // dequeue ke liye
    }

    enqueue(item) {
        // Tumhara code...
    }

    dequeue() {
        // Tumhara code...
    }
}
```

### Challenge 3: Hot Potato Game

Bachche circle mein khade hain, ek potato pass hote rehti hai. Har n-th pass pe wo bachcha out hoga. Last standing wins!

```javascript
// Hint: Queue use karo — dequeue karo, enqueue karo (circular rotation)
// Har n-th element ko permanently remove karo
function hotPotato(names, num) {
    // Tumhara code yahan...
    // Return: winner ka naam
}

hotPotato(["Rahul", "Priya", "Amit", "Neha", "Ravi"], 3);
```

---

## Quick Revision Table

| Problem | Data Structure | Key Insight |
|---------|---------------|-------------|
| Bracket Matching | Stack | Open = push, Close = pop + match |
| String Reverse | Stack | Push all, then pop all |
| Browser History | 2 Stacks | Back stack + Forward stack |
| Undo Feature | Stack | Save state before each action |
| Printer Queue | Queue | FIFO — pehle aaya, pehle print |
| Mandi Counter | Queue | Token system with FIFO serving |
| Postfix Eval | Stack | Numbers push, operator pe pop-calculate-push |
| Min Stack | 2 Stacks | Extra stack for minimum tracking |
| Queue from Stacks | 2 Stacks | Transfer between stacks for FIFO |

---

## Aaj Kya Seekha?

1. **Stack class** complete implementation with push, pop, peek, size, overflow
2. **Queue class** complete implementation with enqueue, dequeue, front, rear
3. **Bracket matching** — Stack ka classic application, interview favorite
4. **String reverse** — Push all characters, pop for reversed string
5. **Real-world simulations** — Mandi queue, printer queue, browser history
6. **Postfix evaluation** — Stack se mathematical expressions solve karo
7. **Stack + Queue** — do fundamental data structures jo har jagah use hote hain

> **Tip:** Week 3 mein hum Express.js framework seekhenge — real REST APIs banayenge! Stack aur Queue ke concepts database operations, task queues, aur middleware mein bahut kaam aayenge. Aaj ke challenges zaroor solve karo — especially "Queue from Two Stacks" — ye Google, Amazon interviews mein puchha jaata hai!
