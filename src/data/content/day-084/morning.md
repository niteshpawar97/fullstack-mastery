# Day 84 Morning: React — useEffect Hook + API Integration (Axios)

> **Aaj ka plan:** Aaj hum React ka doosra sabse important hook seekhenge — **useEffect**! Samjhenge ki side effects kya hain, dependency array kaise kaam karti hai, cleanup function kyu zaroori hai, Axios se API calls kaise karte hain, loading/error states, aur API data ko beautifully display kaise karte hain.

---

## Side Effects Kya Hain?

### Pure Function vs Side Effect

```jsx
// PURE function — sirf input se output, koi bahar ka kaam nahi
function add(a, b) {
  return a + b;  // Predictable, no side effects
}

// SIDE EFFECT — bahar ki duniya se interact karna
// - API call karna
// - localStorage mein data save karna
// - Document title change karna
// - Timer/interval set karna
// - WebSocket connection banana
```

> **Socho Aise:** Pure function aise hai jaise calculator — 2+2 dalo, 4 aayega, hamesha. Side effect aise hai jaise phone call — bahar ki duniya se baat ho rahi hai, result predict nahi kar sakte.

React mein side effects ko handle karne ke liye **useEffect** hook use karte hain.

---

## useEffect Hook

### Basic Syntax

```jsx
import { useState, useEffect } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Ye code component render hone ke BAAD chalta hai
    console.log('Component render hua!');
    document.title = 'My App';  // Side effect!
  });

  return <div>{data}</div>;
}
```

### Dependency Array — Kab Chalega useEffect?

```jsx
// 1. Koi dependency array nahi — HAR render pe chalega
useEffect(() => {
  console.log('Har render pe chalunga!');
});
// ⚠️ Ye dangerous hai — infinite loop ho sakta hai!

// 2. Empty array [] — SIRF pehli baar (mount pe)
useEffect(() => {
  console.log('Sirf ek baar chalunga — component mount pe!');
}, []);
// ✅ API calls ke liye PERFECT!

// 3. Dependencies ke saath — jab dependency change ho
useEffect(() => {
  console.log(`Count badla: ${count}`);
}, [count]);
// ✅ Sirf jab count change hoga tabhi chalega

// 4. Multiple dependencies
useEffect(() => {
  console.log('Name ya age mein se koi bhi badla!');
}, [name, age]);
```

> **Yaad Rakho:** Dependency array useEffect ka "watchlist" hai. Empty `[]` matlab "sirf mount pe ek baar". Dependencies matlab "ye values change hone pe dobara chalo". Koi array nahi matlab "har render pe chalo" (avoid karo!).

### Practical Examples

```jsx
function DocumentTitleUpdater() {
  const [count, setCount] = useState(0);

  // Document title update karo jab count change ho
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}

function LocalStorageSaver() {
  const [theme, setTheme] = useState(() => {
    // Initial value localStorage se lo
    return localStorage.getItem('theme') || 'light';
  });

  // Theme change hone pe localStorage mein save karo
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Current: {theme} — Toggle karo
    </button>
  );
}
```

---

## Cleanup Function — Safai Karo!

### Kyu Zaroori Hai?

Jab component unmount hota hai (screen se hat jata hai), toh running timers, subscriptions, event listeners band karne padhe hain. Warna memory leak hoga!

```jsx
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Side effect: interval start karo
    const intervalId = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // Cleanup function: interval band karo jab component hat jaye
    return () => {
      clearInterval(intervalId);
      console.log('Timer saaf kiya! Memory leak nahi hoga.');
    };
  }, []);  // Empty array — sirf mount pe start, unmount pe cleanup

  return <p>Timer: {seconds} seconds</p>;
}

function WindowResizeTracker() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Event listener add karo
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    // Cleanup: listener hatao
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <p>Window width: {windowWidth}px</p>;
}
```

> **Warning:** Cleanup function na likhna = memory leak! Jab bhi `setInterval`, `setTimeout`, `addEventListener`, ya WebSocket connection use karo useEffect mein, toh cleanup function ZAROOR likho!

---

## Axios — HTTP Client for API Calls

### Axios Install Karo

> **Terminal Command:**
```bash
npm install axios
```

### Axios vs Fetch

| Feature | Fetch (built-in) | Axios |
|---------|-------------------|-------|
| Syntax | Verbose (2 step) | Clean (1 step) |
| JSON parse | Manual `.json()` | Automatic |
| Error handling | Sirf network error | HTTP errors bhi catch karta hai |
| Interceptors | Nahi | Haan (auth tokens ke liye) |
| Request cancel | AbortController | Built-in cancel token |

```jsx
// Fetch — verbose
const res = await fetch('/api/products');
const data = await res.json();  // Manual JSON parse

// Axios — clean
const { data } = await axios.get('/api/products');  // Auto JSON parse
```

---

## API Se Data Fetch Karna — Complete Pattern

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function ProductList() {
  // 3 important states — data, loading, error
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Component mount hone pe API call karo
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Tumhare Express backend se data lo
        const response = await axios.get('http://localhost:5000/api/products');

        setProducts(response.data.data);  // API response mein data key
        console.log('Products loaded:', response.data.data.length);

      } catch (err) {
        // Error handle karo
        console.error('API Error:', err);
        setError(err.response?.data?.message || 'Kuch galat ho gaya!');

      } finally {
        // Loading band karo (success ya error dono mein)
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);  // Empty array — sirf ek baar fetch karo

  // Conditional rendering — 3 states handle karo
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div className="spinner"></div>
        <p>Products load ho rahe hain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        <h3>Error!</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (products.length === 0) {
    return <p style={{ textAlign: 'center' }}>Koi product nahi mila.</p>;
  }

  return (
    <div>
      <h2>Products ({products.length})</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {products.map(product => (
          <div key={product._id} style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '15px',
            width: '250px'
          }}>
            <h3>{product.name}</h3>
            <p>Price: Rs. {product.price}</p>
            <p>Category: {product.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

> **Yaad Rakho:** Ye **Loading → Error → Empty → Data** pattern har API call mein use hota hai. Isse memorize karo — professional React developers yahi pattern follow karte hain!

---

## Axios Instance — Base URL + Default Config

```jsx
// src/api/axios.js — Ek baar configure karo, har jagah use karo
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Base URL set karo
  timeout: 10000,                         // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — har request mein token add karo
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — errors globally handle karo
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — login page pe bhejo
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

> **Tip:** Axios interceptors bahut powerful hain! Request interceptor mein auth token automatically add hota hai. Response interceptor mein 401 error globally handle hota hai. Isse har component mein manually token add nahi karna padta!

---

## useEffect Mein Dependency Change Pe Fetch

```jsx
function SearchProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Jab searchTerm ya category badle, dobara fetch karo
  useEffect(() => {
    // Debounce ke liye — 500ms wait karo typing ke baad
    const timer = setTimeout(async () => {
      if (searchTerm.length < 2 && searchTerm.length > 0) return;

      setIsLoading(true);
      try {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (category !== 'all') params.category = category;

        const { data } = await axios.get('/api/products', { params });
        setProducts(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    // Cleanup: purana timer cancel karo (debounce)
    return () => clearTimeout(timer);
  }, [searchTerm, category]);  // Ye change hone pe effect chalega

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All Categories</option>
        <option value="Grains">Grains</option>
        <option value="Fruits">Fruits</option>
      </select>

      {isLoading ? <p>Searching...</p> : (
        <ul>
          {products.map(p => <li key={p._id}>{p.name} - Rs. {p.price}</li>)}
        </ul>
      )}
    </div>
  );
}
```

> **Socho Aise:** Debounce aise hai jaise elevator ka darwaza — jab tak log aa rahe hain, darwaza khula rahega. Jab 500ms tak koi nahi aaya, tab band hoga (API call hogi). Isse har keystroke pe API call nahi hoti!

---

## Quick Revision Table

| Concept | Kya Hai | Kab Use Karo |
|---------|---------|--------------|
| useEffect | Side effects handle karo | API calls, timers, DOM changes |
| `[]` dependency | Sirf mount pe chale | Initial data fetch |
| `[count]` dependency | count change pe chale | Dependent data fetch |
| Cleanup function | Resources free karo | Timers, listeners, subscriptions |
| Axios | HTTP client library | API calls (better than fetch) |
| Axios instance | Pre-configured Axios | Base URL, auth tokens |
| Interceptors | Automatic request/response modify | Auth token, error handling |
| Loading/Error/Data | 3-state pattern | Har API call mein |
| Debounce | Delay se call karo | Search input, typing |

---

## Aaj Kya Seekha?

1. **useEffect** side effects ke liye hai — API calls, timers, localStorage
2. **Dependency array** decide karta hai effect kab chalega
3. **Cleanup function** memory leaks rokta hai — timers/listeners band karo
4. **Axios** fetch se better hai — auto JSON parse, interceptors, clean syntax
5. **Loading → Error → Empty → Data** pattern har API component mein use karo
6. **Axios interceptors** se auth token automatically har request mein jaata hai
7. **Debounce** se unnecessary API calls rokho — search inputs mein important

> **Practice Time!** Evening mein hum real backend API se products fetch karenge, cards mein display karenge, loading spinner banayenge, aur search functionality implement karenge!
