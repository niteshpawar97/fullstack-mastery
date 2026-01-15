# Day 52 - Morning: DSA — Linked Lists

> **Aaj ka plan:**
> Aaj hum seekhenge Linked List — ek aisi data structure jo array se bilkul alag kaam karti hai. Samjhenge Node kya hota hai, Singly Linked List kaise banate hain, aur kab array use karna chahiye aur kab linked list.

---

## Linked List Kya Hai?

Socho tumhare paas ek train hai. Har dabba (coach) ek **Node** hai. Har dabbe mein do cheezein hain:
1. **Data** — passengers (actual value)
2. **Next pointer** — agla dabba kaunsa hai (address of next node)

```
[Data | Next] --> [Data | Next] --> [Data | Next] --> null
```

> **Socho Aise:**
> Array ek apartment building hai — sab rooms side by side, numbered. Linked List ek treasure hunt hai — har clue mein agla location likha hai. Tumhe pehle se poora map nahi milta.

---

## Node Structure

Har node ek simple object hai:

```javascript
// Ek Node ka structure
class Node {
  constructor(data) {
    this.data = data;   // actual value store hoga
    this.next = null;    // agla node ka reference (shuru mein null)
  }
}

// Node banate hain
const node1 = new Node(10);
const node2 = new Node(20);
const node3 = new Node(30);

// Nodes ko connect karte hain
node1.next = node2;  // 10 --> 20
node2.next = node3;  // 20 --> 30
// Ab chain: 10 --> 20 --> 30 --> null
```

---

## Singly Linked List — Full Implementation

```javascript
class SinglyLinkedList {
  constructor() {
    this.head = null;   // list ka pehla node
    this.size = 0;      // kitne nodes hain
  }

  // --- INSERT Operations ---

  // Shuru mein add karo (O(1))
  insertAtHead(data) {
    const newNode = new Node(data);
    newNode.next = this.head;  // naya node purane head ko point kare
    this.head = newNode;       // naya node ab head hai
    this.size++;
  }

  // End mein add karo (O(n))
  insertAtTail(data) {
    const newNode = new Node(data);
    if (!this.head) {
      // List khali hai toh head bana do
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;  // last node tak jao
      }
      current.next = newNode;    // last node ke baad add karo
    }
    this.size++;
  }

  // Specific position pe add karo (O(n))
  insertAt(data, index) {
    if (index < 0 || index > this.size) {
      console.log("Invalid index!");
      return;
    }
    if (index === 0) return this.insertAtHead(data);

    const newNode = new Node(data);
    let current = this.head;
    // index-1 position tak jao
    for (let i = 0; i < index - 1; i++) {
      current = current.next;
    }
    newNode.next = current.next;  // naya node agla point kare
    current.next = newNode;       // pichla node naye ko point kare
    this.size++;
  }

  // --- DELETE Operations ---

  // Shuru se hatao (O(1))
  deleteFromHead() {
    if (!this.head) return null;
    const data = this.head.data;
    this.head = this.head.next;  // head agla node ban gaya
    this.size--;
    return data;
  }

  // Value se hatao (O(n))
  deleteByValue(value) {
    if (!this.head) return false;

    // Agar head hi delete karna hai
    if (this.head.data === value) {
      this.head = this.head.next;
      this.size--;
      return true;
    }

    let current = this.head;
    while (current.next) {
      if (current.next.data === value) {
        current.next = current.next.next; // skip karo us node ko
        this.size--;
        return true;
      }
      current = current.next;
    }
    return false; // value mili nahi
  }

  // --- SEARCH Operation ---

  // Value dhundho (O(n))
  search(value) {
    let current = this.head;
    let index = 0;
    while (current) {
      if (current.data === value) return index;
      current = current.next;
      index++;
    }
    return -1; // nahi mila
  }

  // --- REVERSE Operation ---

  // List ulta karo (O(n))
  reverse() {
    let prev = null;
    let current = this.head;
    let next = null;

    while (current) {
      next = current.next;    // agla save karo
      current.next = prev;    // direction ulta karo
      prev = current;         // prev aage badho
      current = next;         // current aage badho
    }
    this.head = prev; // naya head
  }

  // List print karo
  print() {
    let current = this.head;
    const elements = [];
    while (current) {
      elements.push(current.data);
      current = current.next;
    }
    console.log(elements.join(" --> ") + " --> null");
  }
}
```

> **Yaad Rakho:**
> Reverse karna sabse important operation hai — interview mein 100% poocha jaata hai. `prev`, `current`, `next` teen pointers ka dance hai — har step mein direction ulta hota hai.

---

## Doubly Linked List — Concept

Doubly Linked List mein har node ke **do pointers** hote hain:

```javascript
class DoublyNode {
  constructor(data) {
    this.data = data;
    this.prev = null;   // pichla node
    this.next = null;   // agla node
  }
}
// null <-- [Prev | Data | Next] <--> [Prev | Data | Next] --> null
```

> **Socho Aise:**
> Singly Linked List = one-way road (sirf aage ja sakte ho). Doubly Linked List = two-way road (aage bhi peeche bhi ja sakte ho). Jaise browser ka back/forward button.

---

## Array vs Linked List — Comparison

| Feature | Array | Linked List |
|---|---|---|
| **Memory** | Continuous block | Scattered nodes |
| **Access by index** | O(1) — direct | O(n) — traverse karna padta |
| **Insert at start** | O(n) — shift karna padta | O(1) — sirf pointer change |
| **Insert at end** | O(1) amortized | O(n) — tail tak jaana padta |
| **Delete** | O(n) — shift karna padta | O(1) if node reference hai |
| **Memory usage** | Kam (sirf data) | Zyada (data + pointer) |
| **Cache friendly** | Haan (continuous) | Nahi (scattered) |

> **Tip:**
> Real world mein arrays zyada use hote hain kyunki cache-friendly hain. Linked lists tab use karo jab frequent insert/delete at beginning chahiye — jaise message queue, undo history, ya LRU cache.

---

## Kab Kya Use Karein?

**Array use karo jab:**
- Random access chahiye (index se access)
- Size mostly fixed hai
- Simple iteration chahiye

**Linked List use karo jab:**
- Frequent insertion/deletion at beginning
- Size bahut change hota hai
- Stack/Queue implement karna hai
- Memory continuous nahi mil rahi

> **Example:**
> Farmer app mein sensor readings store karna hai — Array best hai (sequential data, index access). Lekin agar ek message queue banana hai jahan new messages aate hain aur purane process hoke delete hote hain — Linked List better hai.

---

## Quick Revision

| Concept | Key Point |
|---|---|
| Node | Data + Next pointer |
| Head | List ka pehla node |
| Insert at Head | O(1) — sabse fast |
| Insert at Tail | O(n) — traverse karna padta |
| Search | O(n) — linear traverse |
| Reverse | 3 pointers: prev, current, next |
| Doubly LL | Prev + Next dono pointers |
| vs Array | LL = dynamic size, fast insert; Array = fast access |

---

## Aaj Kya Seekha?

1. Linked List ek chain of nodes hai — har node data + next pointer rakhta hai
2. Singly Linked List mein sirf forward ja sakte ho, Doubly mein dono taraf
3. Insert at head O(1) hai — bahut fast
4. Reverse karna = pointer direction ulta karna
5. Array better for access, Linked List better for dynamic insert/delete
6. Real-world use: message queues, browser history, undo systems
