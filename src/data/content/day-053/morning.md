# Day 53 - Morning: DSA — Trees & Graphs Basics

> **Aaj ka plan:**
> Aaj hum do powerful data structures seekhenge — Trees aur Graphs. Samjhenge tree terminology, Binary Search Tree (BST) operations, tree traversals, aur graph basics with BFS/DFS intro.

---

## Tree Kya Hai?

Socho ek family tree — ek root (dada ji), unke children (papa, chacha), unke children (tum, bhai). Yahi **Tree** data structure hai.

```
         CEO            <-- Root
        /    \
      CTO    CFO        <-- Children of Root
     /   \     \
   Dev1  Dev2  Accountant  <-- Leaf Nodes
```

> **Socho Aise:**
> Ek ped (tree) ulta latka do — root upar, leaves neeche. Computer science mein tree aisa hi hota hai. Real life mein — file system (folders ke andar folders), organization hierarchy, HTML DOM — sab trees hain!

---

## Tree Terminology

| Term | Meaning | Example |
|---|---|---|
| **Root** | Sabse upar wala node | CEO |
| **Parent** | Kisi node ka upar wala | CTO is parent of Dev1 |
| **Child** | Kisi node ke neeche wale | Dev1 is child of CTO |
| **Leaf** | Jiska koi child nahi | Dev1, Dev2, Accountant |
| **Edge** | Do nodes ka connection | CTO--Dev1 |
| **Height** | Root se sabse door leaf tak | 2 (CEO to Dev1) |
| **Depth** | Root se kisi node ki doori | Dev1 ki depth = 2 |
| **Subtree** | Kisi node ka apna chhota tree | CTO + Dev1 + Dev2 |
| **Siblings** | Same parent ke children | Dev1 aur Dev2 |

---

## Binary Tree vs Binary Search Tree

**Binary Tree:** Har node ke max 2 children — left aur right.

**Binary Search Tree (BST):** Binary Tree + ek rule:
- Left child **chhota** hoga parent se
- Right child **bada** hoga parent se

```
        50              <-- Root
       /  \
     30    70           <-- 30 < 50, 70 > 50
    /  \   /  \
  20   40 60   80       <-- Sab rule follow karte hain
```

> **Yaad Rakho:**
> BST ka rule: **Left < Parent < Right**. Yeh rule har node pe apply hota hai, sirf root pe nahi. Isi rule ki wajah se search fast hoti hai — O(log n).

---

## BST Implementation

```javascript
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;   // chhota value
    this.right = null;  // bada value
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  // INSERT — naya value daalo
  insert(value) {
    const newNode = new TreeNode(value);
    if (!this.root) {
      this.root = newNode;
      return this;
    }

    let current = this.root;
    while (true) {
      if (value === current.value) return this; // duplicate nahi chahiye
      if (value < current.value) {
        // Left jaao
        if (!current.left) {
          current.left = newNode;
          return this;
        }
        current = current.left;
      } else {
        // Right jaao
        if (!current.right) {
          current.right = newNode;
          return this;
        }
        current = current.right;
      }
    }
  }

  // SEARCH — value dhundho
  search(value) {
    let current = this.root;
    while (current) {
      if (value === current.value) return true;  // mil gaya!
      if (value < current.value) {
        current = current.left;   // left mein dhundho
      } else {
        current = current.right;  // right mein dhundho
      }
    }
    return false; // nahi mila
  }

  // FIND MIN — sabse chhoti value
  findMin() {
    if (!this.root) return null;
    let current = this.root;
    while (current.left) {
      current = current.left; // left-left-left jaate raho
    }
    return current.value;
  }

  // FIND MAX — sabse badi value
  findMax() {
    if (!this.root) return null;
    let current = this.root;
    while (current.right) {
      current = current.right; // right-right-right jaate raho
    }
    return current.value;
  }
}
```

---

## Tree Traversals — 3 Tarike

> **Socho Aise:**
> Socho tum ek garden mein ho. In, Pre, Post batata hai tum **root node ko kab visit karte ho** — beech mein, pehle, ya baad mein.

```
        50
       /  \
     30    70
    /  \   /
  20   40 60
```

### 1. Inorder (Left, Root, Right) — Sorted order milta hai!

```javascript
inorder(node = this.root, result = []) {
  if (node) {
    this.inorder(node.left, result);    // pehle left
    result.push(node.value);            // phir root
    this.inorder(node.right, result);   // phir right
  }
  return result;
}
// Output: [20, 30, 40, 50, 60, 70] — sorted!
```

### 2. Preorder (Root, Left, Right) — Copy banana ho toh

```javascript
preorder(node = this.root, result = []) {
  if (node) {
    result.push(node.value);            // pehle root
    this.preorder(node.left, result);   // phir left
    this.preorder(node.right, result);  // phir right
  }
  return result;
}
// Output: [50, 30, 20, 40, 70, 60]
```

### 3. Postorder (Left, Right, Root) — Delete karna ho toh

```javascript
postorder(node = this.root, result = []) {
  if (node) {
    this.postorder(node.left, result);  // pehle left
    this.postorder(node.right, result); // phir right
    result.push(node.value);            // phir root
  }
  return result;
}
// Output: [20, 40, 30, 60, 70, 50]
```

> **Tip:**
> Yaad rakhne ka trick: **In**order = Root **In** the middle. **Pre**order = Root comes **Pre** (first). **Post**order = Root comes **Post** (last).

---

## Graph Basics

Graph = Nodes (vertices) + Connections (edges). Tree ek special graph hai (no cycles).

```
    A --- B
    |   / |
    |  /  |
    C --- D
```

> **Socho Aise:**
> Social media socho — har person ek node, friendship ek edge. Facebook friendship = undirected (dono taraf). Twitter follow = directed (ek taraf). Yahi graph hai!

### Graph Types
- **Directed**: Edges ka direction hai (A --> B matlab A se B ja sakte, B se A nahi)
- **Undirected**: Dono taraf ja sakte (A --- B)
- **Weighted**: Edges pe weight/cost hai (distance, time)

### Adjacency List — Graph Represent Karna

```javascript
class Graph {
  constructor() {
    this.adjacencyList = {};  // har node ke neighbors
  }

  addVertex(vertex) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
    }
  }

  addEdge(v1, v2) {
    // Undirected graph — dono taraf add karo
    this.adjacencyList[v1].push(v2);
    this.adjacencyList[v2].push(v1);
  }

  display() {
    for (let vertex in this.adjacencyList) {
      console.log(`${vertex} --> ${this.adjacencyList[vertex].join(", ")}`);
    }
  }
}

// Farmer villages ka network
const network = new Graph();
network.addVertex("Village_A");
network.addVertex("Village_B");
network.addVertex("Village_C");
network.addEdge("Village_A", "Village_B");
network.addEdge("Village_B", "Village_C");
network.addEdge("Village_A", "Village_C");
network.display();
// Village_A --> Village_B, Village_C
// Village_B --> Village_A, Village_C
// Village_C --> Village_B, Village_A
```

---

## BFS & DFS — Graph Traverse Karna

**BFS (Breadth-First Search)** — Level by level, paani ki wave jaisi
**DFS (Depth-First Search)** — Ek raaste pe gahra jaao, phir backtrack karo

> **Socho Aise:**
> BFS = Tum ek stone paani mein fenko — waves circles mein failti hain (sabse paas wale pehle). DFS = Tum ek maze mein ho — ek raaste pe chalo jab tak dead end na aaye, phir wapas aao.

```javascript
// BFS — Queue use karta hai
bfs(start) {
  const visited = new Set();
  const queue = [start];
  const result = [];

  visited.add(start);

  while (queue.length > 0) {
    const vertex = queue.shift();  // pehla nikalo
    result.push(vertex);

    for (let neighbor of this.adjacencyList[vertex]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);  // queue mein daalo
      }
    }
  }
  return result;
}
```

---

## Quick Revision

| Concept | Key Point |
|---|---|
| Tree | Hierarchical structure, root se start |
| BST Rule | Left < Parent < Right |
| Inorder | Left, Root, Right — sorted milta hai |
| Preorder | Root, Left, Right — copy ke liye |
| Postorder | Left, Right, Root — delete ke liye |
| Graph | Nodes + Edges, cycles ho sakte hain |
| Adjacency List | Object mein neighbors store |
| BFS | Queue, level by level |
| DFS | Stack/Recursion, depth first |

---

## Aaj Kya Seekha?

1. Tree ek hierarchical data structure hai — root, children, leaf nodes
2. BST mein Left < Parent < Right rule follow hota hai
3. Inorder traversal sorted data deta hai — bahut useful
4. Graph nodes aur edges ka collection hai — social networks, maps, routes
5. BFS level-wise explore karta hai (queue), DFS depth-wise (stack)
6. Adjacency List se graph represent karna easy hai
