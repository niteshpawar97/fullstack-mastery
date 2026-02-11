# Day 87 Evening: Practice — Build Admin Dashboard UI + Connect to Backend

> **Aaj ka plan:** Ab hum complete admin dashboard build karenge! Dashboard page (stats cards), Users page (table with search), Product CRUD (add/edit/delete), sab backend API se connect karenge. Full stack mein frontend aur backend dono kaam karenge!

---

## Task 1: App.jsx mein Admin Routes Setup

### `src/App.jsx`

```jsx
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin routes — protected + layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<AdminProducts />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
```

---

## Task 2: Admin Dashboard Page (Stats + Recent Data)

### `src/pages/admin/AdminDashboard.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatsCard from '../../components/admin/StatsCard';

const AdminDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data fetch karo
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/admin/dashboard');
        setDashData(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Dashboard load nahi hua!');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading dashboard...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  if (!dashData) return null;

  const { cards, recentUsers, recentOrders, lowStockProducts } = dashData;

  return (
    <div>
      <h2 style={{ margin: '0 0 25px', color: '#2d3748' }}>Dashboard Overview</h2>

      {/* Stats Cards Row */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <StatsCard title="Total Users" value={cards.totalUsers} icon="👥" color="#4299e1" change={12} />
        <StatsCard title="Total Products" value={cards.totalProducts} icon="📦" color="#48bb78" change={8} />
        <StatsCard title="Total Orders" value={cards.totalOrders} icon="🛒" color="#ed8936" change={-3} />
        <StatsCard title="Revenue" value={`Rs. ${cards.totalRevenue?.toLocaleString()}`} icon="💰" color="#9f7aea" change={15} />
      </div>

      {/* Two column layout — Recent Users + Low Stock */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Recent Users */}
        <div style={{ flex: 1, minWidth: '350px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 15px', color: '#4a5568' }}>Recent Users</h3>
          {recentUsers?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#718096', fontSize: '13px', borderBottom: '1px solid #edf2f7' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#718096', fontSize: '13px', borderBottom: '1px solid #edf2f7' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#718096', fontSize: '13px', borderBottom: '1px solid #edf2f7' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user._id}>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>{user.name}</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px', color: '#718096' }}>{user.email}</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px', color: '#a0aec0' }}>
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#a0aec0' }}>Koi recent user nahi hai</p>
          )}
        </div>

        {/* Low Stock Alert */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 15px', color: '#e53e3e' }}>Low Stock Alert</h3>
          {lowStockProducts?.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {lowStockProducts.map(product => (
                <li key={product._id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid #edf2f7',
                }}>
                  <span>{product.name}</span>
                  <span style={{
                    backgroundColor: product.stock === 0 ? '#fed7d7' : '#fefcbf',
                    color: product.stock === 0 ? '#c53030' : '#975a16',
                    padding: '2px 10px', borderRadius: '20px', fontSize: '13px',
                  }}>
                    {product.stock} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#48bb78' }}>Sab products stock mein hain!</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 15px', color: '#4a5568' }}>Recent Orders</h3>
        {recentOrders?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', color: '#718096', fontSize: '13px' }}>Customer</th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#718096', fontSize: '13px' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#718096', fontSize: '13px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#718096', fontSize: '13px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order._id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '10px 8px' }}>{order.user?.name || 'Unknown'}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>Rs. {order.totalAmount}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                      backgroundColor: order.status === 'completed' ? '#c6f6d5' : order.status === 'pending' ? '#fefcbf' : '#fed7d7',
                      color: order.status === 'completed' ? '#276749' : order.status === 'pending' ? '#975a16' : '#9b2c2c',
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#a0aec0' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#a0aec0' }}>Koi recent order nahi hai</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
```

> **Expected Output:** Dashboard pe 4 colored stats cards, recent users table, low stock alert list, aur recent orders table dikhega. Sab data backend API se aa raha hai!

---

## Task 3: Users Management Page

### `src/pages/admin/AdminUsers.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import DataTable from '../../components/admin/DataTable';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Users fetch karo
  const fetchUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Users fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(currentPage); }, [currentPage]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => { setCurrentPage(1); fetchUsers(1); }, 500);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  // User status toggle
  const toggleStatus = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/status`);
      fetchUsers(currentPage);  // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Status change failed!');
    }
  };

  // Table columns define karo
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span style={{
          padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
          backgroundColor: row.role === 'admin' ? '#e9d8fd' : '#bee3f8',
          color: row.role === 'admin' ? '#6b46c1' : '#2b6cb0',
        }}>
          {row.role}
        </span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span style={{
          color: row.isActive ? '#48bb78' : '#fc8181',
          fontWeight: 'bold',
        }}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-IN')
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => toggleStatus(row._id)}
          style={{
            padding: '5px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer',
            backgroundColor: row.isActive ? '#fed7d7' : '#c6f6d5',
            color: row.isActive ? '#c53030' : '#276749', fontSize: '12px',
          }}
        >
          {row.isActive ? 'Deactivate' : 'Activate'}
        </button>
      )
    },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>User Management</h2>

      {/* Search + Filter bar */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Name ya email search karo..."
          style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p>Loading users...</p>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          pagination={pagination}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
```

---

## Task 4: Product CRUD Page

### `src/pages/admin/AdminProducts.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: '', stock: '', description: '' });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/products');
      setProducts(data.data || data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Form change handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit — create ya update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
      } else {
        await api.post('/products', formData);
      }
      fetchProducts();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed!');
    }
  };

  // Edit mode — form mein data bharo
  const startEdit = (product) => {
    setFormData({
      name: product.name, price: product.price,
      category: product.category, stock: product.stock,
      description: product.description || '',
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Product delete karna hai?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Delete failed!');
    }
  };

  // Form reset
  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', stock: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Products ({products.length})</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          style={{ padding: '10px 20px', backgroundColor: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
            <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
            <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
            <input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Stock" required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
          </div>
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '15px', minHeight: '80px' }} />
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ padding: '10px 25px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} style={{ padding: '10px 25px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Products Table */}
      {isLoading ? <p>Loading...</p> : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#718096' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#718096' }}>Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#718096' }}>Category</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#718096' }}>Stock</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#718096' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{product.name}</td>
                  <td style={{ padding: '12px 16px' }}>Rs. {product.price}</td>
                  <td style={{ padding: '12px 16px' }}>{product.category}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: product.stock < 10 ? '#e53e3e' : '#48bb78' }}>{product.stock}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => startEdit(product)} style={{ marginRight: '8px', padding: '5px 12px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(product._id)} style={{ padding: '5px 12px', backgroundColor: '#fff5f5', color: '#c53030', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
```

> **Socho Aise:** Product CRUD page mein sab ek jagah hai — list, add form, edit form, delete. Backend mein alag alag endpoints banaye the, frontend mein ek page se sab manage ho raha hai. Ye admin dashboard ka power hai!

---

## Quick Revision Table

| Page | Features | Backend API |
|------|----------|-------------|
| Dashboard | Stats cards, recent users/orders, low stock alert | `GET /admin/dashboard` |
| Users | Search, filter, pagination, activate/deactivate | `GET /admin/users`, `PUT /users/:id/status` |
| Products | Add, edit, delete, list with stock colors | CRUD on `/products` |
| Layout | Sidebar navigation, top bar, Outlet | React Router nested routes |

---

## Aaj Kya Seekha?

1. **Admin Layout** with sidebar navigation aur Outlet pattern
2. **Dashboard page** — stats cards + multiple data sections from one API call
3. **Users page** — search, filter by role, pagination, status toggle
4. **Product CRUD** — create/edit form toggle, delete with confirmation
5. **Full stack connection** — React frontend calling Express backend APIs
6. **Interceptors** handling auth automatically across all API calls

> **Practice Time!** Dashboard mein chart library (recharts ya chart.js) add karo revenue trend ke liye. Users page mein role change dropdown add karo. Kal se **Final Project** start hoga!
