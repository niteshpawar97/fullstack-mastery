# Day 87 Morning: Admin Dashboard — Frontend (React)

> **Aaj ka plan:** Aaj hum React mein admin dashboard frontend banayenge! Sidebar + main content layout, stats cards, tables with pagination, CRUD operations frontend se, token management (localStorage), aur Axios interceptors for auth. Backend APIs ko React se consume karenge!

---

## Dashboard Layout — Sidebar + Main Content

### Layout Structure

```
+--------------------------------------------+
|              HEADER (Top Bar)               |
+--------+-----------------------------------+
|        |                                     |
| SIDE   |        MAIN CONTENT                 |
| BAR    |   (Stats, Tables, Forms)            |
|        |                                     |
| - Dash |                                     |
| - Users|                                     |
| - Prods|                                     |
| - Stats|                                     |
|        |                                     |
+--------+-----------------------------------+
```

### `src/layouts/AdminLayout.jsx`

```jsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar menu items
  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/products', label: 'Products', icon: '📦' },
    { path: '/admin/orders', label: 'Orders', icon: '🛒' },
  ];

  // Active link check
  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        backgroundColor: '#1a202c',
        color: 'white',
        padding: '20px 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#48bb78' }}>Admin Panel</h2>
          <small style={{ color: '#718096' }}>Kisan Dashboard</small>
        </div>

        {/* Menu items */}
        <nav>
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                color: isActive(item.path) ? '#48bb78' : '#a0aec0',
                textDecoration: 'none',
                backgroundColor: isActive(item.path) ? 'rgba(72,187,120,0.1)' : 'transparent',
                borderLeft: isActive(item.path) ? '3px solid #48bb78' : '3px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout button — bottom mein */}
        <div style={{ position: 'absolute', bottom: '20px', width: '100%', padding: '0 20px' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '12px', backgroundColor: '#e53e3e',
            color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
          }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main style={{
        flex: 1,
        marginLeft: '250px',
        backgroundColor: '#f7fafc',
        minHeight: '100vh',
      }}>
        {/* Top bar */}
        <div style={{
          padding: '15px 30px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, color: '#2d3748' }}>
            {menuItems.find(i => isActive(i.path))?.label || 'Admin'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Admin User</span>
            <div style={{
              width: '35px', height: '35px', borderRadius: '50%',
              backgroundColor: '#48bb78', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>A</div>
          </div>
        </div>

        {/* Page content — Outlet renders nested routes */}
        <div style={{ padding: '30px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
```

> **Socho Aise:** AdminLayout ek frame hai — sidebar fix hai, top bar fix hai. Sirf beech ka content (Outlet) change hota hai jab navigation karo. Ye React Router ka nested routes + Outlet pattern hai!

---

## Stats Cards Component

### `src/components/admin/StatsCard.jsx`

```jsx
const StatsCard = ({ title, value, icon, color, change }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
      flex: '1 1 220px',
      minWidth: '220px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#718096', fontSize: '14px', margin: '0 0 8px' }}>
            {title}
          </p>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#2d3748' }}>
            {value}
          </h2>
          {/* Growth/decline indicator */}
          {change && (
            <small style={{
              color: change > 0 ? '#48bb78' : '#fc8181',
              fontWeight: 'bold',
            }}>
              {change > 0 ? '+' : ''}{change}% from last month
            </small>
          )}
        </div>
        <div style={{
          fontSize: '32px',
          backgroundColor: `${color}15`,
          padding: '10px',
          borderRadius: '10px',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
```

---

## Token Management + Axios Interceptors

### `src/api/axios.js` (Enhanced)

```jsx
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
});

// REQUEST interceptor — har request mein token add karo
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

// RESPONSE interceptor — 401 pe auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized — token expired ya invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Agar already login page pe nahi ho toh redirect karo
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

> **Yaad Rakho:** Interceptors ka fayda — har component mein manually token add nahi karna padta. Aur agar token expire ho gaya toh automatically login page pe redirect ho jaoge. Ek jagah likho, har jagah kaam kare!

---

## Table with Pagination Component

### `src/components/admin/DataTable.jsx`

```jsx
const DataTable = ({ columns, data, pagination, onPageChange }) => {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f7fafc' }}>
              {columns.map(col => (
                <th key={col.key} style={{
                  padding: '14px 16px', textAlign: 'left',
                  fontSize: '14px', color: '#718096',
                  borderBottom: '2px solid #e2e8f0',
                  fontWeight: '600',
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                  Koi data nahi mila
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row._id || index} style={{ borderBottom: '1px solid #edf2f7' }}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: '12px 16px', fontSize: '14px' }}>
                      {/* Custom render ya simple value */}
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{
          padding: '16px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid #e2e8f0',
        }}>
          <span style={{ color: '#718096', fontSize: '14px' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              style={{
                padding: '8px 16px', borderRadius: '6px',
                border: '1px solid #e2e8f0', cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
                backgroundColor: pagination.hasPrev ? 'white' : '#f7fafc',
              }}
            >
              Previous
            </button>
            <span style={{ padding: '8px 16px', color: '#4a5568' }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              style={{
                padding: '8px 16px', borderRadius: '6px',
                border: '1px solid #e2e8f0', cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                backgroundColor: pagination.hasNext ? 'white' : '#f7fafc',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
```

> **Tip:** `col.render` ek custom render function hai — isse column mein buttons, badges, formatted dates kuch bhi dikha sakte ho. Table component ek baar banao, har jagah use karo!

---

## CRUD Operations from Frontend

### Product CRUD Pattern

```jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // READ — Products fetch karo
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/products');
      setProducts(data.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // CREATE — Naya product banao
  const createProduct = async (formData) => {
    try {
      await api.post('/products', formData);
      fetchProducts();    // List refresh karo
      setShowForm(false); // Form band karo
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed!');
    }
  };

  // UPDATE — Product edit karo
  const updateProduct = async (id, formData) => {
    try {
      await api.put(`/products/${id}`, formData);
      fetchProducts();
      setEditingProduct(null);
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed!');
    }
  };

  // DELETE — Product delete karo
  const deleteProduct = async (id) => {
    if (!window.confirm('Sach mein delete karna hai?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();  // List refresh karo
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed!');
    }
  };

  // ... render table + form
};
```

> **Yaad Rakho:** CRUD pattern = fetch (useEffect) + create/update/delete (API call + refresh list). Har operation ke baad `fetchProducts()` call karo taaki list updated dikhhe. `window.confirm()` delete se pehle confirmation ke liye use karo!

---

## Auth Token Check — Protected Route Component

### `src/components/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  // Token nahi hai — login page pe bhejo
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

// App.jsx mein use karo:
// <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
```

---

## Quick Revision Table

| Concept | Kya Hai | Where Used |
|---------|---------|------------|
| AdminLayout | Sidebar + Outlet pattern | `/admin` nested routes |
| StatsCard | Dashboard summary card | Dashboard page |
| DataTable | Reusable table + pagination | Users, Products pages |
| Axios interceptors | Auto token + auto logout | `api/axios.js` |
| CRUD from frontend | API calls + list refresh | Product/User management |
| ProtectedRoute | Auth check wrapper | Admin routes |
| localStorage | Token storage | Login/Logout |

---

## Aaj Kya Seekha?

1. **Admin layout** — sidebar + main content with React Router Outlet
2. **StatsCard component** — reusable dashboard cards with icons and colors
3. **Axios interceptors** — automatic token management and 401 handling
4. **DataTable** — reusable table with pagination, custom column rendering
5. **CRUD pattern** — fetch + create + update + delete from React frontend
6. **ProtectedRoute** — redirect to login if no token

> **Practice Time!** Evening mein hum complete admin dashboard banayenge — user table, product CRUD, stats display, aur backend API connection!
