# Day 52 - Evening: Practice — Linked List Implementation

> **Aaj ka plan:**
> Ab hands-on karte hain! Poori SinglyLinkedList class build karenge, add/remove/find methods likhenge, list reverse karenge, aur cycle detection seekhenge.

---

## Task 1: SinglyLinkedList Class Banao

> **Practice Time!**
> Ek complete `SinglyLinkedList` class banao jo sab operations support kare.

```javascript
// Node class
class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

// Linked List class
class SinglyLinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  // Shuru mein add karo
  addFirst(data) {
    const newNode = new Node(data);
    newNode.next = this.head;
    this.head = newNode;
    this.size++;
    return this; // chaining ke liye
  }

  // End mein add karo
  addLast(data) {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = newNode;
    }
    this.size++;
    return this;
  }

  // Specific index pe add karo
  addAt(index, data) {
    // Boundary check
    if (index < 0 || index > this.size) {
      throw new Error(`Index ${index} out of bounds for size ${this.size}`);
    }
    if (index === 0) return this.addFirst(data);
    if (index === this.size) return this.addLast(data);

    const newNode = new Node(data);
    let current = this.head;
    // index-1 tak jao
    for (let i = 0; i < index - 1; i++) {
      current = current.next;
    }
    newNode.next = current.next;
    current.next = newNode;
    this.size++;
    return this;
  }

  // Pehla node hatao
  removeFirst() {
    if (!this.head) throw new Error("List is empty!");
    const data = this.head.data;
    this.head = this.head.next;
    this.size--;
    return data; // hataya hua data return karo
  }

  // Last node hatao
  removeLast() {
    if (!this.head) throw new Error("List is empty!");
    if (this.size === 1) return this.removeFirst();

    let current = this.head;
    // Second-last node tak jao
    while (current.next.next) {
      current = current.next;
    }
    const data = current.next.data;
    current.next = null; // last node ko disconnect karo
    this.size--;
    return data;
  }

  // Value se hatao
  remove(value) {
    if (!this.head) return false;
    if (this.head.data === value) {
      this.removeFirst();
      return true;
    }
    let current = this.head;
    while (current.next) {
      if (current.next.data === value) {
        current.next = current.next.next;
        this.size--;
        return true;
      }
      current = current.next;
    }
    return false; // nahi mila
  }

  // Value dhundho — index return karo
  find(value) {
    let current = this.head;
    let index = 0;
    while (current) {
      if (current.data === value) return index;
      current = current.next;
      index++;
    }
    return -1;
  }

  // Kya value exist karti hai?
  contains(value) {
    return this.find(value) !== -1;
  }

  // Index se value lo
  get(index) {
    if (index < 0 || index >= this.size) {
      throw new Error(`Index ${index} out of bounds`);
    }
    let current = this.head;
    for (let i = 0; i < index; i++) {
      current = current.next;
    }
    return current.data;
  }

  // List ko array mein convert karo
  toArray() {
    const arr = [];
    let current = this.head;
    while (current) {
      arr.push(current.data);
      current = current.next;
    }
    return arr;
  }

  // Print karo
  print() {
    console.log(this.toArray().join(" --> ") + " --> null");
  }

  // Size batao
  getSize() {
    return this.size;
  }

  // Khali hai ya nahi
  isEmpty() {
    return this.size === 0;
  }
}
```

> **Terminal Command:**
> ```bash
> node linkedList.js
> ```

---

## Task 2: Test Karo Apni Class

```javascript
// Testing
const list = new SinglyLinkedList();

// Add operations
list.addFirst(10);       // 10 --> null
list.addLast(30);        // 10 --> 30 --> null
list.addAt(1, 20);       // 10 --> 20 --> 30 --> null
list.addFirst(5);        // 5 --> 10 --> 20 --> 30 --> null
list.addLast(40);        // 5 --> 10 --> 20 --> 30 --> 40 --> null

list.print();
// 5 --> 10 --> 20 --> 30 --> 40 --> null

// Search operations
console.log("Find 20:", list.find(20));       // 2
console.log("Contains 30:", list.contains(30)); // true
console.log("Contains 99:", list.contains(99)); // false
console.log("Get index 3:", list.get(3));     // 30

// Remove operations
console.log("Remove first:", list.removeFirst()); // 5
list.print();  // 10 --> 20 --> 30 --> 40 --> null

console.log("Remove last:", list.removeLast());   // 40
list.print();  // 10 --> 20 --> 30 --> null

list.remove(20); // 20 hatao
list.print();  // 10 --> 30 --> null

console.log("Size:", list.getSize()); // 2
```

> **Expected Output:**
> ```
> 5 --> 10 --> 20 --> 30 --> 40 --> null
> Find 20: 2
> Contains 30: true
> Contains 99: false
> Get index 3: 30
> Remove first: 5
> 10 --> 20 --> 30 --> 40 --> null
> Remove last: 40
> 10 --> 20 --> 30 --> null
> 10 --> 30 --> null
> Size: 2
> ```

---

## Task 3: Reverse Linked List

> **Practice Time!**
> Yeh interview ka darling question hai. Iterative approach se reverse karo.

```javascript
// SinglyLinkedList class mein add karo
reverse() {
  let prev = null;      // pehle kuch nahi tha
  let current = this.head;
  let next = null;

  while (current !== null) {
    next = current.next;    // Step 1: agla node save karo
    current.next = prev;    // Step 2: pointer ulta karo
    prev = current;         // Step 3: prev aage badho
    current = next;         // Step 4: current aage badho
  }
  this.head = prev;         // naya head set karo
  return this;
}

// Test karo
const list2 = new SinglyLinkedList();
list2.addLast(1).addLast(2).addLast(3).addLast(4).addLast(5);

console.log("Before reverse:");
list2.print();  // 1 --> 2 --> 3 --> 4 --> 5 --> null

list2.reverse();

console.log("After reverse:");
list2.print();  // 5 --> 4 --> 3 --> 2 --> 1 --> null
```

> **Yaad Rakho:**
> Reverse ke 4 steps yaad rakho:
> 1. `next = current.next` (save next)
> 2. `current.next = prev` (flip arrow)
> 3. `prev = current` (move prev)
> 4. `current = next` (move current)
> Bas yahi loop chalta rehta hai!

---

## Task 4: Cycle Detection (Floyd's Algorithm)

> **Socho Aise:**
> Socho ek circular race track hai. Do runners hain — ek slow (1 step) aur ek fast (2 steps). Agar track circular hai toh fast runner slow ko zaroor pakad lega. Agar track straight hai toh fast runner end pe pahunch jaayega.

```javascript
// Cycle detect karo — Floyd's Tortoise and Hare
function hasCycle(head) {
  if (!head || !head.next) return false;

  let slow = head;     // Kachhua — 1 step
  let fast = head;     // Khargosh — 2 steps

  while (fast && fast.next) {
    slow = slow.next;          // 1 step
    fast = fast.next.next;     // 2 steps

    if (slow === fast) {
      return true;  // Mil gaye! Cycle hai
    }
  }
  return false; // Fast null pe pahunch gaya — no cycle
}

// Test: Normal list (no cycle)
const normalList = new SinglyLinkedList();
normalList.addLast(1).addLast(2).addLast(3);
console.log("Normal list has cycle:", hasCycle(normalList.head)); // false

// Test: Cycle wali list
const node1 = new Node(1);
const node2 = new Node(2);
const node3 = new Node(3);
const node4 = new Node(4);
node1.next = node2;
node2.next = node3;
node3.next = node4;
node4.next = node2;  // Cycle! 4 wapas 2 pe jaata hai

console.log("Cyclic list has cycle:", hasCycle(node1)); // true
```

> **Expected Output:**
> ```
> Normal list has cycle: false
> Cyclic list has cycle: true
> ```

---

## Task 5: Real-World Exercise — Farmer Order Queue

```javascript
// Farmer orders ka queue — linked list se
class OrderQueue {
  constructor() {
    this.list = new SinglyLinkedList();
  }

  // Naya order aaya
  addOrder(orderId, farmerName, product) {
    this.list.addLast({ orderId, farmerName, product, time: new Date() });
  }

  // Pehla order process karo (FIFO)
  processNext() {
    if (this.list.isEmpty()) {
      console.log("Koi order nahi hai!");
      return null;
    }
    const order = this.list.removeFirst();
    console.log(`Processing: Order #${order.orderId} - ${order.farmerName} - ${order.product}`);
    return order;
  }

  // Pending orders dekho
  showPending() {
    console.log(`Pending orders: ${this.list.getSize()}`);
    this.list.print();
  }
}

// Test
const queue = new OrderQueue();
queue.addOrder(101, "Ramesh", "Urea 50kg");
queue.addOrder(102, "Suresh", "DAP 25kg");
queue.addOrder(103, "Mahesh", "Seeds 10kg");

queue.showPending();
queue.processNext();  // Ramesh ka order process hoga
queue.processNext();  // Suresh ka order process hoga
queue.showPending();  // Sirf Mahesh ka bacha
```

> **Warning:**
> Yeh exercise samjhne ke liye hai ki linked list real problems mein kaise use hoti hai. Production mein tum proper queue library ya database use karoge, lekin concept same hai!

---

## Quick Revision

| Method | Kya Karta Hai | Time |
|---|---|---|
| `addFirst()` | Shuru mein add | O(1) |
| `addLast()` | End mein add | O(n) |
| `removeFirst()` | Pehla hatao | O(1) |
| `removeLast()` | Last hatao | O(n) |
| `find()` | Value dhundho | O(n) |
| `reverse()` | List ulta karo | O(n) |
| `hasCycle()` | Cycle detect karo | O(n) |

---

## Aaj Kya Seekha?

1. Complete SinglyLinkedList class banaya with add, remove, find methods
2. Reverse linked list implement kiya — 4 step pattern
3. Floyd's Cycle Detection — slow + fast pointer technique
4. Real-world example: order queue using linked list
5. Chaining pattern (`return this`) se methods chain kar sakte hain
6. Linked List ka use queue/stack implementation mein hota hai
