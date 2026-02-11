# Day 85 Evening: Practice — Multi-Page App with Routing + Forms

> **Aaj ka plan:** Ab hum complete multi-page application banayenge! Home, Products, Product Detail, Login, Register — sab pages banayenge, routing setup karenge, forms with validation likhenge, aur navigation implement karenge.

---

## Task 1: Project Setup + Dependencies

> **Terminal Command:**
```bash
# Agar naya project chahiye toh
npm create vite@latest kisan-app -- --template react
cd kisan-app
npm install

# Zaroori packages install karo
npm install react-router-dom react-hook-form axios
```

### Folder Structure

```
src/
├── api/
│   └── axios.js           # Axios instance
├── components/
│   ├── Header.jsx          # Navigation bar
│   ├── Footer.jsx          # Footer
│   ├── ProductCard.jsx     # Product card
│   └── ProtectedRoute.jsx  # Auth check wrapper
├── pages/
│   ├── HomePage.jsx        # Landing page
│   ├── ProductsPage.jsx    # Products listing
│   ├── ProductDetailPage.jsx # Single product
│   ├── LoginPage.jsx       # Login form
│   ├── RegisterPage.jsx    # Register form
│   └── NotFoundPage.jsx    # 404 page
├── App.jsx
└── main.jsx
```

---

## Task 2: Router Setup in main.jsx + App.jsx

### `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
      {/* Header har page pe dikhega */}
      <Header />

      {/* Routes — URL ke hisab se page dikhao */}
      <main style={{ flex: 1, backgroundColor: '#f7fafc' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer har page pe dikhega */}
      <Footer />
    </div>
  );
}

export default App;
```

---

## Task 3: Navigation Header with Active Link

### `src/components/Header.jsx`

```jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();   // Current URL pata karo
  const navigate = useNavigate();

  // Check karo user logged in hai ya nahi
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Active link style helper
  const linkStyle = (path) => ({
    color: location.pathname === path ? '#48bb78' : 'white',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: location.pathname === path ? 'rgba(72, 187, 120, 0.1)' : 'transparent',
    fontWeight: location.pathname === path ? 'bold' : 'normal',
  });

  return (
    <header style={{
      backgroundColor: '#2d3748', padding: '12px 30px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      {/* Logo */}
      <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
        <h2 style={{ margin: 0 }}>Kisan App</h2>
      </Link>

      {/* Navigation links */}
      <nav style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <Link to="/" style={linkStyle('/')}>Home</Link>
        <Link to="/products" style={linkStyle('/products')}>Products</Link>

        {isLoggedIn ? (
          <button onClick={handleLogout}
            style={{ padding: '8px 16px', backgroundColor: '#fc8181', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" style={linkStyle('/login')}>Login</Link>
            <Link to="/register" style={{
              ...linkStyle('/register'),
              backgroundColor: '#48bb78', color: 'white', fontWeight: 'bold',
            }}>
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
```

> **Tip:** `useLocation()` se current URL pata chalta hai — active link highlight karne ke liye use karo. Professional apps mein active navigation bahut important UX hai!

---

## Task 4: Home Page

### `src/pages/HomePage.jsx`

```jsx
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      {/* Hero section */}
      <section style={{
        backgroundColor: '#2d3748', color: 'white',
        padding: '80px 30px', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
          Kisan Dashboard
        </h1>
        <p style={{ fontSize: '20px', color: '#a0aec0', marginBottom: '30px' }}>
          Fresh farm products direct from kisans to your doorstep
        </p>
        <Link to="/products" style={{
          backgroundColor: '#48bb78', color: 'white',
          padding: '15px 40px', borderRadius: '8px',
          textDecoration: 'none', fontSize: '18px',
        }}>
          Browse Products
        </Link>
      </section>

      {/* Features section */}
      <section style={{ padding: '60px 30px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Kyu Choose Karein?</h2>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🌾', title: 'Organic Products', desc: 'Chemical-free farming se fresh products' },
            { icon: '🚚', title: 'Fast Delivery', desc: '24 hours mein aapke ghar' },
            { icon: '💰', title: 'Best Prices', desc: 'Seedha kisan se — no middleman' },
          ].map((feature, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '30px',
              border: '1px solid #e2e8f0', borderRadius: '12px', width: '280px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p style={{ color: '#718096' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
```

---

## Task 5: Login Page with react-hook-form

### `src/pages/LoginPage.jsx`

```jsx
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api/axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // Form submit handler
  const onSubmit = async (data) => {
    try {
      setServerError('');
      const response = await api.post('/auth/login', data);

      // Token save karo
      localStorage.setItem('token', response.data.token);

      // Home page pe redirect karo
      navigate('/');

    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed! Dobara try karo.');
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto', padding: '30px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Login</h2>

      {/* Server error dikhao */}
      {serverError && (
        <div style={{
          backgroundColor: '#fff5f5', color: '#c53030',
          padding: '12px', borderRadius: '6px', marginBottom: '20px',
          border: '1px solid #fc8181',
        }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            {...register('email', {
              required: 'Email zaroori hai!',
              pattern: { value: /^\S+@\S+$/i, message: 'Valid email daalo!' }
            })}
            placeholder="arjun@example.com"
            style={{
              width: '100%', padding: '12px', borderRadius: '6px',
              border: errors.email ? '2px solid #fc8181' : '1px solid #e2e8f0', fontSize: '16px',
            }}
          />
          {errors.email && <small style={{ color: '#c53030' }}>{errors.email.message}</small>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            {...register('password', {
              required: 'Password zaroori hai!',
              minLength: { value: 6, message: 'Minimum 6 characters!' }
            })}
            placeholder="Password daalo..."
            style={{
              width: '100%', padding: '12px', borderRadius: '6px',
              border: errors.password ? '2px solid #fc8181' : '1px solid #e2e8f0', fontSize: '16px',
            }}
          />
          {errors.password && <small style={{ color: '#c53030' }}>{errors.password.message}</small>}
        </div>

        {/* Submit button */}
        <button type="submit" disabled={isSubmitting} style={{
          width: '100%', padding: '14px', backgroundColor: '#4299e1',
          color: 'white', border: 'none', borderRadius: '6px',
          fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
        }}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Register link */}
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>
        Account nahi hai? <Link to="/register" style={{ color: '#4299e1' }}>Register karo</Link>
      </p>
    </div>
  );
};

export default LoginPage;
```

---

## Task 6: Register Page

### `src/pages/RegisterPage.jsx`

```jsx
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api/axios';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm();

  // Password watch karo — confirm password match karne ke liye
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setServerError('');
      // confirmPassword hatao before sending
      const { confirmPassword, ...submitData } = data;

      await api.post('/auth/register', submitData);
      setSuccess(true);

      // 2 seconds baad login page pe bhejo
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed!');
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '64px' }}>&#10003;</div>
        <h2 style={{ color: '#48bb78' }}>Registration Successful!</h2>
        <p>Login page pe redirect ho rahe ho...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '30px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Register</h2>

      {serverError && (
        <div style={{ backgroundColor: '#fff5f5', color: '#c53030', padding: '12px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #fc8181' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Name */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name</label>
          <input {...register('name', { required: 'Naam zaroori hai!', minLength: { value: 2, message: 'Minimum 2 characters!' } })}
            placeholder="Full name" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
          {errors.name && <small style={{ color: 'red' }}>{errors.name.message}</small>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input type="email" {...register('email', { required: 'Email zaroori hai!', pattern: { value: /^\S+@\S+$/i, message: 'Valid email daalo!' } })}
            placeholder="email@example.com" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
          {errors.email && <small style={{ color: 'red' }}>{errors.email.message}</small>}
        </div>

        {/* Phone */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone</label>
          <input type="tel" {...register('phone', { pattern: { value: /^\d{10}$/, message: '10 digit number daalo!' } })}
            placeholder="9876543210" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
          {errors.phone && <small style={{ color: 'red' }}>{errors.phone.message}</small>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input type="password" {...register('password', { required: 'Password zaroori hai!', minLength: { value: 6, message: 'Minimum 6 characters!' } })}
            placeholder="Min 6 characters" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
          {errors.password && <small style={{ color: 'red' }}>{errors.password.message}</small>}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Confirm Password</label>
          <input type="password" {...register('confirmPassword', {
            required: 'Password confirm karo!',
            validate: value => value === password || 'Passwords match nahi kar rahe!'
          })}
            placeholder="Password dobara daalo" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
          {errors.confirmPassword && <small style={{ color: 'red' }}>{errors.confirmPassword.message}</small>}
        </div>

        <button type="submit" disabled={isSubmitting} style={{
          width: '100%', padding: '14px', backgroundColor: '#48bb78',
          color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>
        Already registered? <Link to="/login" style={{ color: '#4299e1' }}>Login karo</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
```

> **Yaad Rakho:** `watch('password')` se real-time mein password ki value milti hai. Isse confirm password field mein `validate` function se match check kar sakte ho. react-hook-form ye sab easy banata hai!

---

## Quick Revision Table

| Page | Route | Key Features |
|------|-------|-------------|
| Home | `/` | Hero section, features, CTA buttons |
| Products | `/products` | API fetch, search, filter, cards |
| Product Detail | `/products/:id` | useParams, single product fetch |
| Login | `/login` | react-hook-form, API auth, token save |
| Register | `/register` | Validation, password match, success redirect |
| 404 | `*` | Catch-all route, back to home link |

---

## Aaj Kya Seekha?

1. **React Router** setup — BrowserRouter, Routes, Route ka complete flow
2. **Header navigation** with active link highlighting using `useLocation`
3. **Home page** with hero section aur feature cards
4. **Login form** with react-hook-form, API integration, token storage
5. **Register form** with password confirmation validation using `watch`
6. **Page navigation** — Link for declarative, useNavigate for programmatic

> **Practice Time!** Product Detail page ko complete karo (morning mein template diya tha). NotFoundPage banao. Ek ProtectedRoute component banao jo check kare user logged in hai ya nahi. Kal hum **Admin Dashboard APIs** banayenge!
