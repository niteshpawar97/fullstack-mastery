# Day 83 Morning: React — State, Props & Events

> **Aaj ka plan:** Aaj hum React ka sabse important concept seekhenge — **State**! Samjhenge ki useState hook kaise kaam karta hai, state updates kaise hote hain (immutable way), events kaise handle karte hain, controlled components kya hain, lifting state up, aur conditional rendering. Ye sab React ka backbone hai!

---

## State Kya Hai?

### Props vs State

| Feature | Props | State |
|---------|-------|-------|
| Kaun set karta hai? | Parent component | Component khud |
| Change ho sakta hai? | Nahi (read-only) | Haan (setState se) |
| Kab use karo? | Data pass karna hai | Data change hoga UI mein |
| Direction | Parent → Child | Component ke andar |

> **Socho Aise:** Props aise hain jaise tumhara naam — koi aur deta hai, tum change nahi kar sakte. State aise hai jaise tumhara mood — tum khud change karte ho, aur ye tumhari appearance (UI) change karta hai!

---

## useState Hook

### Syntax Samjho

```jsx
import { useState } from 'react';

function Counter() {
  // useState hook — state banata hai
  // count = current value (pehle 0)
  // setCount = function jo count update karega
  const [count, setCount] = useState(0);
  //     ^         ^                 ^
  //  variable   updater         initial value

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Badhaao (+1)
      </button>
    </div>
  );
}
```

> **Yaad Rakho:** `useState` ek array return karta hai — pehla element value hai, doosra updater function. Array destructuring se dono nikal lete hain. Initial value sirf pehli baar set hoti hai.

### Multiple States

```jsx
function ProductForm() {
  // Har cheez ke liye alag state
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('Grains');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <p>Product: {name}</p>
      <p>Price: ₹{price}</p>
      <p>Category: {category}</p>
      <p>Loading: {isLoading ? 'Haan' : 'Nahi'}</p>
    </div>
  );
}
```

---

## State Updates — Immutable Way

### GALAT Tarika vs SAHI Tarika

```jsx
function UserList() {
  const [users, setUsers] = useState(['Arjun', 'Priya', 'Rahul']);

  // GALAT ❌ — Direct mutation
  const addUserWrong = () => {
    users.push('Sneha');    // Array directly change kiya!
    setUsers(users);        // React ko pata nahi chalega
  };

  // SAHI ✅ — Naya array banao (spread operator)
  const addUser = () => {
    setUsers([...users, 'Sneha']);   // Naya array bana ke set kiya
  };

  // SAHI ✅ — Item remove karna (filter se naya array)
  const removeUser = (index) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  // SAHI ✅ — Object state update
  const [product, setProduct] = useState({ name: 'Wheat', price: 250 });

  const updatePrice = () => {
    setProduct({ ...product, price: 300 });  // Spread + override
  };

  return (
    <div>
      {users.map((user, index) => (
        <p key={index}>
          {user}
          <button onClick={() => removeUser(index)}>Delete</button>
        </p>
      ))}
      <button onClick={addUser}>Add Sneha</button>
    </div>
  );
}
```

> **Warning:** React mein state ko KABHI directly mutate mat karo! Hamesha naya array/object banao. React tabhi re-render karta hai jab reference change hota hai. Agar same reference hai toh React sochta hai — kuch badla nahi!

### Previous State Se Update (Functional Updates)

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // GALAT approach agar multiple updates hain
  const addThree = () => {
    setCount(count + 1);  // count abhi 0 hai
    setCount(count + 1);  // count abhi bhi 0 hai (batched!)
    setCount(count + 1);  // count abhi bhi 0 hai — result: 1
  };

  // SAHI approach — previous state use karo
  const addThreeCorrect = () => {
    setCount(prev => prev + 1);  // 0 → 1
    setCount(prev => prev + 1);  // 1 → 2
    setCount(prev => prev + 1);  // 2 → 3 ✅
  };

  return (
    <div>
      <h2>{count}</h2>
      <button onClick={addThreeCorrect}>+3</button>
    </div>
  );
}
```

> **Tip:** Jab bhi current state pe depend karke update karna ho, hamesha functional update (`prev => prev + 1`) use karo. Ye batching issues se bachata hai.

---

## Event Handling

### Common Events

```jsx
function EventDemo() {
  // onClick — Button click
  const handleClick = () => {
    console.log('Button dabaya!');
  };

  // onChange — Input mein typing
  const handleChange = (e) => {
    console.log('Typed:', e.target.value);  // Jo type kiya wo
  };

  // onSubmit — Form submit
  const handleSubmit = (e) => {
    e.preventDefault();  // Page reload rokko!
    console.log('Form submitted!');
  };

  return (
    <div>
      <button onClick={handleClick}>Click Me</button>

      <input onChange={handleChange} placeholder="Type karo..." />

      <form onSubmit={handleSubmit}>
        <input type="text" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
```

> **Yaad Rakho:** Events mein `e.preventDefault()` bahut zaroori hai forms mein! Bina iske page reload ho jayega aur SPA ka fayda khatam. Backend mein toh server handle karta tha, React mein hum khud handle karte hain.

### Event Mein Data Pass Karna

```jsx
function ProductList() {
  const products = ['Wheat', 'Rice', 'Mangoes'];

  // Arrow function se specific data pass karo
  const handleDelete = (productName) => {
    console.log(`${productName} delete ho raha hai!`);
  };

  return (
    <ul>
      {products.map((product, index) => (
        <li key={index}>
          {product}
          {/* Arrow function se argument pass karo */}
          <button onClick={() => handleDelete(product)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## Controlled Components (Forms)

### Controlled vs Uncontrolled

```jsx
function LoginForm() {
  // Controlled — React state mein value store hai
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // State mein already values hain — directly use karo
    console.log('Login:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}                        // State se value
        onChange={(e) => setEmail(e.target.value)}  // Har keystroke pe update
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

> **Socho Aise:** Controlled component mein React "boss" hai — wo decide karta hai input mein kya dikhega. `value` prop se React control karta hai, `onChange` se update hota hai. Ye two-way binding jaisa lagta hai lekin actually one-way hai — state → input → onChange → setState → re-render → input updated.

---

## Lifting State Up

### Problem: Sibling Components Ko Data Share Karna

```jsx
// Fahrenheit aur Celsius dono sync mein chahiye
// Solution: State ko parent mein rakho!

function TemperatureInput({ label, value, onChange }) {
  return (
    <div>
      <label>{label}: </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TemperatureConverter() {
  // State parent mein hai — "lifted up"
  const [celsius, setCelsius] = useState('');

  const fahrenheit = celsius ? (celsius * 9/5) + 32 : '';

  return (
    <div>
      <h3>Temperature Converter</h3>
      <TemperatureInput
        label="Celsius"
        value={celsius}
        onChange={setCelsius}
      />
      <TemperatureInput
        label="Fahrenheit"
        value={fahrenheit}
        onChange={(f) => setCelsius(((f - 32) * 5/9).toFixed(1))}
      />
      {celsius && <p>{celsius}°C = {fahrenheit}°F</p>}
    </div>
  );
}
```

> **Yaad Rakho:** Jab do components ko same data chahiye, toh state unke common parent mein rakho. Parent state own karta hai aur dono children ko props se deta hai. Isse "lifting state up" kehte hain.

---

## Conditional Rendering

```jsx
function Dashboard({ isLoggedIn, isAdmin, notifications }) {
  return (
    <div>
      {/* Ternary operator — if-else */}
      {isLoggedIn ? (
        <h2>Welcome back!</h2>
      ) : (
        <h2>Please login</h2>
      )}

      {/* && operator — sirf if (no else) */}
      {isAdmin && <button>Admin Panel</button>}

      {/* Multiple conditions */}
      {notifications.length > 0 && (
        <div className="badge">
          {notifications.length} new notifications
        </div>
      )}

      {/* Early return pattern (function ke andar) */}
    </div>
  );
}

// Loading state pattern
function ProductList({ products, isLoading, error }) {
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (products.length === 0) return <p>No products found.</p>;

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

> **Tip:** Conditional rendering ka pattern: Loading? Show spinner. Error? Show error. Empty? Show message. Data hai? Show data. Ye pattern har jagah use hota hai!

---

## Quick Revision Table

| Concept | Kya Hai | Syntax |
|---------|---------|--------|
| useState | State banata hai component mein | `const [x, setX] = useState(0)` |
| Immutable Update | Naya array/object banao, directly mutate mat karo | `setArr([...arr, newItem])` |
| Functional Update | Previous state se update | `setCount(prev => prev + 1)` |
| onClick | Button click handle | `onClick={handleClick}` |
| onChange | Input typing handle | `onChange={(e) => setX(e.target.value)}` |
| onSubmit | Form submit handle | `onSubmit={handleSubmit}` + `e.preventDefault()` |
| Controlled Input | React state controls input value | `value={state}` + `onChange` |
| Lifting State Up | Common parent mein state rakho | Parent owns state, children get props |
| Conditional Render | Condition pe UI dikhao/chupao | `{condition && <Component />}` |

---

## Aaj Kya Seekha?

1. **useState** hook se component mein changeable data rakh sakte hain
2. State updates **immutable** hone chahiye — hamesha naya copy banao
3. **Functional updates** (`prev => prev + 1`) batching issues se bachate hain
4. **Event handling** mein `e.preventDefault()` forms ke liye zaroori hai
5. **Controlled components** mein React input ki value control karta hai
6. **Lifting state up** — common parent mein state rakho jab siblings ko share karna ho
7. **Conditional rendering** se loading, error, empty states handle karo

> **Practice Time!** Evening mein hum counter app, todo list, form validation, aur temperature converter banayenge. Sab hands-on!
