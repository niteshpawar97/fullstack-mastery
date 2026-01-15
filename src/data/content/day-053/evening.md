# Day 53 - Evening: Practice — BST, Traversals & Graph BFS

> **Aaj ka plan:**
> Hands-on time! BST class implement karenge with traversals, simple graph banayenge, aur BFS run karenge ek real-world problem pe.

---

## Task 1: Complete BST Class

> **Practice Time!**
> BST class banao with insert, search, delete, aur teeno traversals.

```javascript
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  // Insert value
  insert(value) {
    const newNode = new TreeNode(value);
    if (!this.root) {
      this.root = newNode;
      return this;
    }
    let current = this.root;
    while (true) {
      if (value === current.value) return this;
      if (value < current.value) {
        if (!current.left) { current.left = newNode; return this; }
        current = current.left;
      } else {
        if (!current.right) { current.right = newNode; return this; }
        current = current.right;
      }
    }
  }

  // Search — kya value hai tree mein?
  search(value) {
    let current = this.root;
    while (current) {
      if (value === current.value) return current;
      current = value < current.value ? current.left : current.right;
    }
    return null; // nahi mila
  }

  // Inorder Traversal — sorted order
  inorder(node = this.root, result = []) {
    if (node) {
      this.inorder(node.left, result);
      result.push(node.value);
      this.inorder(node.right, result);
    }
    return result;
  }

  // Preorder Traversal
  preorder(node = this.root, result = []) {
    if (node) {
      result.push(node.value);
      this.preorder(node.left, result);
      this.preorder(node.right, result);
    }
    return result;
  }

  // Postorder Traversal
  postorder(node = this.root, result = []) {
    if (node) {
      this.postorder(node.left, result);
      this.postorder(node.right, result);
      result.push(node.value);
    }
    return result;
  }

  // Level Order Traversal (BFS on tree)
  levelOrder() {
    if (!this.root) return [];
    const result = [];
    const queue = [this.root];

    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return result;
  }

  // Tree ki height nikalo
  height(node = this.root) {
    if (!node) return -1; // empty tree ki height -1
    const leftHeight = this.height(node.left);
    const rightHeight = this.height(node.right);
    return Math.max(leftHeight, rightHeight) + 1;
  }

  // Sabse chhoti value
  findMin(node = this.root) {
    while (node.left) node = node.left;
    return node.value;
  }

  // Sabse badi value
  findMax(node = this.root) {
    while (node.right) node = node.right;
    return node.value;
  }

  // Delete value (advanced)
  delete(value, node = this.root) {
    if (!node) return null;

    if (value < node.value) {
      node.left = this.delete(value, node.left);
    } else if (value > node.value) {
      node.right = this.delete(value, node.right);
    } else {
      // Case 1: Leaf node — seedha hatao
      if (!node.left && !node.right) return null;
      // Case 2: Ek child — child ko upar lao
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      // Case 3: Do children — inorder successor dhundho
      const minRight = this.findMin(node.right);
      node.value = minRight;
      node.right = this.delete(minRight, node.right);
    }
    return node;
  }
}
```

---

## Task 2: BST Test Karo

```javascript
const tree = new BST();

// Insert values
[50, 30, 70, 20, 40, 60, 80].forEach(v => tree.insert(v));

// Tree structure:
//         50
//        /  \
//      30    70
//     /  \  /  \
//   20  40 60  80

console.log("Inorder:", tree.inorder());
console.log("Preorder:", tree.preorder());
console.log("Postorder:", tree.postorder());
console.log("Level Order:", tree.levelOrder());
console.log("Height:", tree.height());
console.log("Min:", tree.findMin());
console.log("Max:", tree.findMax());
console.log("Search 40:", tree.search(40) ? "Found!" : "Not found");
console.log("Search 99:", tree.search(99) ? "Found!" : "Not found");
```

> **Expected Output:**
> ```
> Inorder: [20, 30, 40, 50, 60, 70, 80]
> Preorder: [50, 30, 20, 40, 70, 60, 80]
> Postorder: [20, 40, 30, 60, 80, 70, 50]
> Level Order: [50, 30, 70, 20, 40, 60, 80]
> Height: 2
> Min: 20
> Max: 80
> Search 40: Found!
> Search 99: Not found
> ```

---

## Task 3: BST Delete Test

```javascript
// Delete test
console.log("\n--- Delete Operations ---");

// Delete leaf (20)
tree.root = tree.delete(20);
console.log("After deleting 20:", tree.inorder());

// Delete node with 1 child — 70 hatao (socho 60 ya 80 ek child ban jaaye)
tree.root = tree.delete(70);
console.log("After deleting 70:", tree.inorder());

// Delete node with 2 children (30)
tree.root = tree.delete(30);
console.log("After deleting 30:", tree.inorder());
```

> **Expected Output:**
> ```
> --- Delete Operations ---
> After deleting 20: [30, 40, 50, 60, 70, 80]
> After deleting 70: [30, 40, 50, 60, 80]
> After deleting 30: [40, 50, 60, 80]
> ```

> **Yaad Rakho:**
> BST delete ke 3 cases:
> 1. Leaf node — seedha null karo
> 2. Ek child — child ko promote karo
> 3. Do children — inorder successor (right subtree ka min) se replace karo

---

## Task 4: Graph Class with BFS

> **Practice Time!**
> Graph class banao aur BFS implement karo.

```javascript
class Graph {
  constructor() {
    this.adjacencyList = {};
  }

  addVertex(vertex) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
    }
    return this;
  }

  addEdge(v1, v2) {
    if (!this.adjacencyList[v1]) this.addVertex(v1);
    if (!this.adjacencyList[v2]) this.addVertex(v2);
    this.adjacencyList[v1].push(v2);
    this.adjacencyList[v2].push(v1);
    return this;
  }

  // BFS — Breadth First Search
  bfs(start) {
    const visited = new Set();
    const queue = [start];
    const result = [];

    visited.add(start);

    while (queue.length > 0) {
      const vertex = queue.shift();
      result.push(vertex);

      for (const neighbor of this.adjacencyList[vertex]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return result;
  }

  // DFS — Depth First Search (iterative)
  dfs(start) {
    const visited = new Set();
    const stack = [start];
    const result = [];

    visited.add(start);

    while (stack.length > 0) {
      const vertex = stack.pop();  // stack se nikalo (LIFO)
      result.push(vertex);

      for (const neighbor of this.adjacencyList[vertex]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    return result;
  }

  // Shortest Path — BFS se (unweighted graph)
  shortestPath(start, end) {
    const visited = new Set();
    const queue = [[start, [start]]]; // [vertex, path]
    visited.add(start);

    while (queue.length > 0) {
      const [vertex, path] = queue.shift();

      if (vertex === end) return path; // rasta mil gaya!

      for (const neighbor of this.adjacencyList[vertex]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
    return null; // koi rasta nahi
  }

  display() {
    for (const vertex in this.adjacencyList) {
      console.log(`${vertex} --> ${this.adjacencyList[vertex].join(", ")}`);
    }
  }
}
```

---

## Task 5: Graph Test — Delivery Route

```javascript
// Delivery route network
const deliveryNetwork = new Graph();

// Cities add karo
deliveryNetwork.addEdge("Delhi", "Agra");
deliveryNetwork.addEdge("Delhi", "Jaipur");
deliveryNetwork.addEdge("Agra", "Lucknow");
deliveryNetwork.addEdge("Jaipur", "Udaipur");
deliveryNetwork.addEdge("Lucknow", "Varanasi");
deliveryNetwork.addEdge("Agra", "Jaipur");

console.log("--- Delivery Network ---");
deliveryNetwork.display();

console.log("\nBFS from Delhi:", deliveryNetwork.bfs("Delhi"));
console.log("DFS from Delhi:", deliveryNetwork.dfs("Delhi"));

// Shortest path dhundho
const path = deliveryNetwork.shortestPath("Delhi", "Varanasi");
console.log("\nShortest path Delhi to Varanasi:", path);
console.log("Stops:", path ? path.length - 1 : "No route");
```

> **Expected Output:**
> ```
> --- Delivery Network ---
> Delhi --> Agra, Jaipur
> Agra --> Delhi, Lucknow, Jaipur
> Jaipur --> Delhi, Udaipur, Agra
> Lucknow --> Agra, Varanasi
> Udaipur --> Jaipur
> Varanasi --> Lucknow
>
> BFS from Delhi: [Delhi, Agra, Jaipur, Lucknow, Udaipur, Varanasi]
> DFS from Delhi: [Delhi, Jaipur, Agra, Lucknow, Varanasi, Udaipur]
>
> Shortest path Delhi to Varanasi: [Delhi, Agra, Lucknow, Varanasi]
> Stops: 3
> ```

> **Tip:**
> BFS shortest path deta hai unweighted graph mein kyunki yeh level-by-level explore karta hai. Google Maps bhi similar algorithms use karta hai (Dijkstra — weighted version).

---

## Quick Revision

| Concept | Key Point |
|---|---|
| BST Insert | Left < Parent < Right rule follow karo |
| BST Delete | 3 cases: leaf, 1 child, 2 children |
| Inorder | Sorted output deta hai |
| Level Order | BFS on tree — queue use karo |
| Graph BFS | Queue + visited set |
| Graph DFS | Stack + visited set |
| Shortest Path | BFS se milta hai (unweighted graph) |

---

## Aaj Kya Seekha?

1. Complete BST class banaya — insert, search, delete, traversals
2. Delete ke 3 cases samjhe — leaf, one child, two children
3. Level order traversal = BFS on tree
4. Graph class banaya with adjacency list
5. BFS aur DFS dono implement kiye — queue vs stack difference
6. Shortest path BFS se nikala — real delivery route example
