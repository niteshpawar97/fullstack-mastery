# Day 85 Morning: React — Routing + Forms

> **Aaj ka plan:** Aaj hum React Router seekhenge — multi-page navigation SPA mein kaise karte hain. BrowserRouter, Routes, Route, Link, useNavigate, useParams sab samjhenge. Phir form libraries (react-hook-form) aur form submission to API seekhenge. Dashboard ke liye routing bahut zaroori hai!

---

## React Router Kya Hai?

### Problem: SPA Mein Multiple Pages

React by default single page hai — ek `App` component, ek URL. Lekin humein chahiye:
- `/` — Home page
- `/products` — Products list
- `/products/123` — Product detail
- `/login` — Login page
- `/admin/dashboard` — Admin panel

React Router ye sab possible banata hai — bina page reload ke!

> **Socho Aise:** React Router ek traffic police hai. URL dekh ke decide karta hai — kaunsa component dikhana hai. `/products` aaya? Products page dikhao. `/login` aaya? Login page dikhao. Page reload nahi hota — sirf component swap hota hai!

### Installation

> **Terminal Command:**
```bash
npm install react-router-dom
```

---

## Basic Routing Setup

### `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// BrowserRouter se poore app ko wrap karo
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### `src/App.jsx`

```jsx
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Har Route ek URL = ek Component */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 404 — koi route match nahi hua */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
```

> **Yaad Rakho:** `Routes` ke andar `Route` components rakhte hain. `path` URL hai, `element` component hai. `path="*"` matlab "baaki sab" — ye 404 page ke liye hai!

---

## Navigation — Link + useNavigate

### Link Component (Declarative)

```jsx
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={{
      backgroundColor: '#2d3748', color: 'white',
      padding: '15px 30px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center'
    }}>
      <h1>Kisan Dashboard</h1>

      {/* Link — <a> tag ki jagah ye use karo */}
      <nav style={{ display: 'flex', gap: '20px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          Home
        </Link>
        <Link to="/products" style={{ color: 'white', textDecoration: 'none' }}>
          Products
        </Link>
        <Link to="/login" style={{ color: '#48bb78', textDecoration: 'none' }}>
          Login
        </Link>
        <Link to="/register" style={{ color: '#48bb78', textDecoration: 'none' }}>
          Register
        </Link>
      </nav>
    </header>
  );
};
```

> **Warning:** `<a href="/products">` mat use karo! Ye page reload karega. `<Link to="/products">` use karo — ye SPA navigation karega bina reload ke. Ye bahut important difference hai!

### useNavigate Hook (Programmatic)

```jsx
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // API call for login
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);

      // Programmatic navigation — login ke baad dashboard pe bhejo
      navigate('/');  // Home page pe jao
      // navigate('/admin/dashboard');  // Ya admin panel pe

    } catch (err) {
      setError('Login failed!');
    }
  };

  return <form onSubmit={handleLogin}>...</form>;
};
```

```jsx
// navigate ke options
navigate('/products');           // Forward jao
navigate(-1);                    // Back button jaisa
navigate(-2);                    // 2 pages peeche
navigate('/products', { replace: true });  // History replace karo (back se wapas nahi aa sakte)
```

---

## URL Parameters — useParams

### Dynamic Routes

```jsx
// Route definition — :id ek dynamic parameter hai
<Route path="/products/:id" element={<ProductDetailPage />} />

// ProductDetailPage — useParams se id nikalo
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';

const ProductDetailPage = () => {
  const { id } = useParams();  // URL se id nikalo — /products/abc123 → id = 'abc123'
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Product nahi mila!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);  // id change hone pe dobara fetch karo

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!product) return <p>Product nahi mila.</p>;

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        &larr; Back
      </button>
      <h1>{product.name}</h1>
      <p style={{ fontSize: '28px', fontWeight: 'bold' }}>Rs. {product.price}</p>
      <p>Category: {product.category}</p>
      <p>{product.description}</p>
      <p>Stock: {product.stock} units</p>
    </div>
  );
};
```

> **Socho Aise:** `:id` aise hai jaise function ka parameter. `/products/abc123` pe `id = 'abc123'` milega. Backend mein `req.params.id` karte the, React mein `useParams()` se nikaalte hain!

---

## Nested Routes

```jsx
// Admin section ke nested routes
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Nested routes — /admin ke andar */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />           {/* /admin */}
        <Route path="users" element={<AdminUsers />} />        {/* /admin/users */}
        <Route path="products" element={<AdminProducts />} />  {/* /admin/products */}
        <Route path="orders" element={<AdminOrders />} />      {/* /admin/orders */}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// AdminLayout — Outlet use karo nested routes ke liye
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: '250px', backgroundColor: '#2d3748', minHeight: '100vh', padding: '20px' }}>
        <h3 style={{ color: 'white' }}>Admin Panel</h3>
        <nav>
          <Link to="/admin" style={{ color: 'white', display: 'block', padding: '10px' }}>Dashboard</Link>
          <Link to="/admin/users" style={{ color: 'white', display: 'block', padding: '10px' }}>Users</Link>
          <Link to="/admin/products" style={{ color: 'white', display: 'block', padding: '10px' }}>Products</Link>
          <Link to="/admin/orders" style={{ color: 'white', display: 'block', padding: '10px' }}>Orders</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />  {/* Yahan nested route ka component render hoga */}
      </main>
    </div>
  );
};
```

> **Yaad Rakho:** `<Outlet />` wo jagah hai jahan nested (child) routes render hote hain. Ye ek "placeholder" hai — parent layout fix hai, sirf andar ka content change hota hai.

---

## 404 Page

### `src/pages/NotFoundPage.jsx`

```jsx
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <h1 style={{ fontSize: '120px', margin: 0, color: '#e2e8f0' }}>404</h1>
      <h2 style={{ color: '#4a5568' }}>Page Nahi Mila!</h2>
      <p style={{ color: '#718096', marginBottom: '30px' }}>
        Ye page exist nahi karta. Shayad URL galat hai.
      </p>
      <Link to="/" style={{
        backgroundColor: '#4299e1', color: 'white',
        padding: '12px 30px', borderRadius: '6px',
        textDecoration: 'none', fontSize: '16px',
      }}>
        Home Page Pe Jao
      </Link>
    </div>
  );
};

export default NotFoundPage;
```

---

## React Hook Form — Better Form Handling

### Install Karo

> **Terminal Command:**
```bash
npm install react-hook-form
```

### Basic Usage

```jsx
import { useForm } from 'react-hook-form';
import api from '../api/axios';

const LoginForm = () => {
  const {
    register,     // Input ko form se connect karta hai
    handleSubmit,  // Form submit handler
    formState: { errors, isSubmitting },  // Errors aur loading state
  } = useForm();

  // Form submit — data automatically milta hai
  const onSubmit = async (data) => {
    try {
      console.log('Form data:', data);
      // { email: "arjun@mail.com", password: "123456" }

      const response = await api.post('/auth/login', data);
      localStorage.setItem('token', response.data.token);
      // navigate to dashboard...

    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '400px', margin: '40px auto' }}>
      <h2>Login</h2>

      {/* Email — register se connect karo + validation rules */}
      <div style={{ marginBottom: '15px' }}>
        <label>Email:</label>
        <input
          type="email"
          {...register('email', {
            required: 'Email zaroori hai!',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Valid email daalo!'
            }
          })}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        {errors.email && <small style={{ color: 'red' }}>{errors.email.message}</small>}
      </div>

      {/* Password */}
      <div style={{ marginBottom: '15px' }}>
        <label>Password:</label>
        <input
          type="password"
          {...register('password', {
            required: 'Password zaroori hai!',
            minLength: { value: 6, message: 'Minimum 6 characters!' }
          })}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        {errors.password && <small style={{ color: 'red' }}>{errors.password.message}</small>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ width: '100%', padding: '12px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px' }}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

> **Tip:** `react-hook-form` ka fayda — kum re-renders, built-in validation, automatic error messages, aur `isSubmitting` state. Manual useState se form banana zyada code hai aur slower bhi!

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| BrowserRouter | Router wrapper | `<BrowserRouter><App /></BrowserRouter>` |
| Routes + Route | URL to Component mapping | `<Route path="/products" element={<Products />} />` |
| Link | Navigation bina reload | `<Link to="/products">Products</Link>` |
| useNavigate | Programmatic navigation | `navigate('/dashboard')` |
| useParams | URL se parameters nikalo | `/products/:id` → `useParams().id` |
| Nested Routes | Routes ke andar routes | `/admin/users`, `/admin/products` |
| Outlet | Nested route render point | Parent layout mein `<Outlet />` |
| 404 Page | `path="*"` catch-all route | Sab unmatched URLs ke liye |
| react-hook-form | Better form handling | `register`, `handleSubmit`, `errors` |

---

## Aaj Kya Seekha?

1. **React Router** se SPA mein multiple pages banate hain bina page reload ke
2. **Link** component `<a>` tag ki jagah use karo — SPA navigation ke liye
3. **useNavigate** se JavaScript code mein navigation control karo
4. **useParams** se URL parameters nikalo — dynamic pages ke liye
5. **Nested Routes** aur **Outlet** se layout with sub-pages banao
6. **404 page** `path="*"` se banta hai — unmatched URLs ke liye
7. **react-hook-form** se forms efficiently handle karo — less code, more features

> **Practice Time!** Evening mein hum complete multi-page app banayenge — Home, Products, Product Detail, Login, Register sab pages!
