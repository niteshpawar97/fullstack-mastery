# Day 84 Evening: Practice — API Integration, Product Cards, Search & Loading States

> **Aaj ka plan:** Ab hum real practice karenge! Backend API se products fetch karenge, sundar cards mein display karenge, loading spinner banayenge, error handling karenge, aur search functionality add karenge. Backend aur Frontend ko connect karte hain!

---

## Setup: Axios Instance Banao

### `src/api/axios.js`

```jsx
import axios from 'axios';

// Axios instance — base URL aur defaults set karo
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Tumhara Express backend
  timeout: 10000,
});

// Har request mein token add karo (agar hai toh)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

> **Tip:** Ye file ek baar banao, phir har component mein `import api from '../api/axios'` se use karo. Base URL baar baar likhne ki zaroorat nahi!

---

## Task 1: Loading Spinner Component

### `src/components/LoadingSpinner.jsx`

```jsx
// Reusable loading spinner
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
    }}>
      {/* CSS spinner — keyframes se rotate hoga */}
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #4299e1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ marginTop: '15px', color: '#718096' }}>{message}</p>

      {/* Inline keyframes — normally CSS file mein hota hai */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
```

---

## Task 2: Error Message Component

### `src/components/ErrorMessage.jsx`

```jsx
// Reusable error display
const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px',
      margin: '20px',
      backgroundColor: '#fff5f5',
      border: '1px solid #fc8181',
      borderRadius: '12px',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '10px' }}>!</div>
      <h3 style={{ color: '#c53030', marginBottom: '10px' }}>Kuch Galat Ho Gaya!</h3>
      <p style={{ color: '#718096', marginBottom: '20px' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 25px',
            backgroundColor: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Dobara Try Karo
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
```

---

## Task 3: Product Card Component (Enhanced)

### `src/components/ProductCard.jsx`

```jsx
// Enhanced product card — API data ke liye
const ProductCard = ({ product }) => {
  const { name, price, category, stock, description, image } = product;

  // Stock badge color
  const getStockBadge = () => {
    if (stock > 50) return { text: 'In Stock', bg: '#c6f6d5', color: '#276749' };
    if (stock > 10) return { text: 'Low Stock', bg: '#fefcbf', color: '#975a16' };
    return { text: 'Almost Out', bg: '#fed7d7', color: '#9b2c2c' };
  };

  const badge = getStockBadge();

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
      width: '280px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      transition: 'box-shadow 0.3s',
      backgroundColor: 'white',
    }}>
      {/* Image area */}
      <div style={{
        height: '180px',
        backgroundColor: '#edf2f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {image ? (
          <img src={image} alt={name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '64px' }}>📦</span>
        )}

        {/* Category badge — top right */}
        <span style={{
          position: 'absolute', top: '10px', right: '10px',
          backgroundColor: '#ebf8ff', color: '#2b6cb0',
          padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
        }}>
          {category}
        </span>
      </div>

      {/* Content area */}
      <div style={{ padding: '15px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{name}</h3>

        {description && (
          <p style={{ color: '#718096', fontSize: '14px', margin: '0 0 10px' }}>
            {description.substring(0, 80)}...
          </p>
        )}

        {/* Price aur stock */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d3748' }}>
            Rs. {price}
          </span>
          <span style={{
            padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
            backgroundColor: badge.bg, color: badge.color, fontWeight: 'bold',
          }}>
            {badge.text}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
```

---

## Task 4: Products Page — Full API Integration

### `src/pages/ProductsPage.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ProductsPage = () => {
  // States — data, loading, error
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search aur filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Products fetch karo — component mount pe
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Query params build karo
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      params.sort = sortBy;

      const response = await api.get('/products', { params });
      setProducts(response.data.data || response.data);

    } catch (err) {
      const message = err.response?.data?.message
        || err.message
        || 'Products load nahi ho paye!';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mount pe fetch karo
  useEffect(() => {
    fetchProducts();
  }, []);

  // Search ke liye debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);  // 500ms delay — debounce

    return () => clearTimeout(timer);  // Cleanup
  }, [searchTerm, selectedCategory, sortBy]);

  // Categories nikalo products se (unique)
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtered products count
  const filteredCount = products.length;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 5px' }}>Products</h2>
        <p style={{ color: '#718096' }}>
          {isLoading ? 'Loading...' : `${filteredCount} products found`}
        </p>
      </div>

      {/* Search + Filter bar */}
      <div style={{
        display: 'flex', gap: '15px', marginBottom: '25px',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Search input */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Product search karo..."
            style={{
              width: '100%', padding: '12px 16px', fontSize: '16px',
              border: '2px solid #e2e8f0', borderRadius: '8px',
            }}
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '12px 16px', fontSize: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '12px 16px', fontSize: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }}
        >
          <option value="name">Name (A-Z)</option>
          <option value="-name">Name (Z-A)</option>
          <option value="price">Price (Low)</option>
          <option value="-price">Price (High)</option>
        </select>
      </div>

      {/* Content area — Loading / Error / Empty / Data */}
      {isLoading ? (
        <LoadingSpinner message="Products load ho rahe hain..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#a0aec0' }}>
          <div style={{ fontSize: '64px' }}>🔍</div>
          <h3>Koi product nahi mila</h3>
          <p>Search ya filter change karke try karo</p>
        </div>
      ) : (
        /* Products grid */
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '20px',
          justifyContent: 'flex-start',
        }}>
          {products.map(product => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
```

> **Expected Output:** Search bar + category dropdown + sort dropdown dikhega. Products cards mein display honge. Loading ke waqt spinner, error pe retry button, empty pe message dikhega.

---

## Task 5: Mock Data (Agar Backend Nahi Chal Raha)

```jsx
// src/data/mockProducts.js — Testing ke liye fake data
export const mockProducts = [
  { _id: '1', name: 'Organic Wheat', price: 250, category: 'Grains', stock: 120, description: 'Premium quality organic wheat from Punjab farms' },
  { _id: '2', name: 'Basmati Rice', price: 400, category: 'Grains', stock: 80, description: 'Long grain basmati rice, aged for extra flavor' },
  { _id: '3', name: 'Fresh Mangoes', price: 150, category: 'Fruits', stock: 5, description: 'Alphonso mangoes from Ratnagiri' },
  { _id: '4', name: 'Organic Honey', price: 350, category: 'Dairy', stock: 45, description: 'Pure forest honey from Sundarbans' },
  { _id: '5', name: 'Fresh Tomatoes', price: 40, category: 'Vegetables', stock: 200, description: 'Farm fresh tomatoes, picked today' },
  { _id: '6', name: 'Desi Ghee', price: 550, category: 'Dairy', stock: 30, description: 'A2 cow ghee, traditional bilona method' },
  { _id: '7', name: 'Green Cardamom', price: 1200, category: 'Spices', stock: 15, description: 'Kerala premium green cardamom' },
  { _id: '8', name: 'Jaggery', price: 120, category: 'Sweeteners', stock: 90, description: 'Organic sugarcane jaggery from Maharashtra' },
];

// Usage: Agar API nahi chal raha toh mock data use karo
// const response = await api.get('/products');  // Real API
// setProducts(mockProducts);                     // Mock fallback
```

> **Socho Aise:** Mock data aise hai jaise rehearsal. Jab tak asli show (backend) ready nahi, tab tak practice data se kaam karo. Professional development mein yahi hota hai — frontend aur backend teams parallel kaam karti hain!

---

## App.jsx Update Karo

```jsx
import Header from './components/Header';
import Footer from './components/Footer';
import ProductsPage from './pages/ProductsPage';

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title="Kisan Dashboard" userName="Arjun" />
      <main style={{ flex: 1, backgroundColor: '#f7fafc' }}>
        <ProductsPage />
      </main>
      <Footer companyName="ArujaAgri" year={2026} />
    </div>
  );
}

export default App;
```

---

## Quick Revision Table

| Task | Component | Key Concept |
|------|-----------|-------------|
| Axios instance | `api/axios.js` | Base URL, interceptors, token |
| Loading spinner | `LoadingSpinner.jsx` | Reusable, CSS animation |
| Error message | `ErrorMessage.jsx` | Retry callback prop |
| Product card | `ProductCard.jsx` | Destructuring, conditional badge |
| Products page | `ProductsPage.jsx` | useEffect, API fetch, search, filter |
| Mock data | `mockProducts.js` | Fallback jab backend off ho |

---

## Aaj Kya Seekha?

1. **Axios instance** se base URL aur auth token centralize kiya
2. **useEffect + API call** pattern — mount pe data fetch karna
3. **Loading / Error / Empty / Data** — 4 states handle karna zaroori hai
4. **Search with debounce** — har keystroke pe API call nahi, 500ms wait karo
5. **Reusable components** — spinner, error message ek baar banao, har jagah use karo
6. **Mock data** se frontend testing possible hai bina backend ke

> **Practice Time!** Products page mein aur features add karo — pagination, price range filter, grid/list view toggle. Kal hum **React Router** aur multi-page navigation seekhenge!
