# Day 89 Morning: Final Project — Features, File Upload, WebSocket & Frontend

> **Aaj ka plan:** Aaj hum remaining features add karenge — Order APIs, file upload for product images, WebSocket notifications, aur React frontend pages. Backend aur frontend ko poora connect karenge!

---

## Task 1: Order APIs

### `backend/controllers/orderController.js`

```javascript
const Order = require('../models/Order');
const Product = require('../models/Product');

// POST /api/orders — Naya order create karo
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart mein koi item nahi hai!' });
    }

    // Har item ke liye product verify karo aur stock check karo
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      // Stock check
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} ka stock sirf ${product.stock} hai! ${item.quantity} nahi mil sakte.`
        });
      }

      // Stock reduce karo
      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
      });

      totalAmount += product.price * item.quantity;
    }

    // Order create karo
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
    });

    // WebSocket notification bhejo (agar setup hai)
    const io = req.app.get('io');
    if (io) {
      io.emit('new-order', {
        orderId: order._id,
        userName: req.user.name,
        amount: totalAmount,
        message: `Naya order aaya! Rs. ${totalAmount} — ${req.user.name}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order successfully placed!',
      data: order,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/my — Mere orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/orders/:id/status — Order status update (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status!' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order nahi mila!' });
    }

    // WebSocket se user ko notify karo
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.user._id}`).emit('order-update', {
        orderId: order._id,
        status: order.status,
        message: `Order #${order._id.toString().slice(-6)} ka status update: ${status}`,
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

### `backend/routes/orders.js`

```javascript
const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);  // Sab order routes login required

router.post('/', createOrder);
router.get('/my', getMyOrders);
router.put('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
```

> **Yaad Rakho:** Order create karte waqt stock bhi reduce ho raha hai. Aur WebSocket se admin ko real-time notification jaa rahi hai. Ye full stack integration ka example hai!

---

## Task 2: File Upload (Product Images)

### `backend/middleware/upload.js`

```javascript
const multer = require('multer');
const path = require('path');

// Multer storage — memory mein rakho (Cloudinary ko bhejne ke liye)
const storage = multer.memoryStorage();

// File filter — sirf images allow
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sirf JPEG, PNG, ya WebP images allowed hain!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB max
});

module.exports = upload;
```

### `backend/utils/cloudinary.js`

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Buffer se Cloudinary pe upload karo
exports.uploadToCloudinary = (buffer, folder = 'kisanmart') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 80 },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

exports.deleteFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};
```

### Upload Route Add Karo

```javascript
// routes/products.js mein add karo
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');

// POST /api/products/:id/images — Product images upload karo
router.post('/:id/images', protect, authorize('seller', 'admin'), upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product nahi mila!' });

    // Ownership check
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied!' });
    }

    // Upload all images to Cloudinary
    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer, 'kisanmart/products')
    );

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(r => r.secure_url);

    // Product mein images add karo
    product.images.push(...imageUrls);
    await product.save();

    res.status(200).json({
      success: true,
      message: `${imageUrls.length} images uploaded!`,
      data: { images: product.images },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## Task 3: WebSocket Setup (Real-time Notifications)

### `backend/socket/index.js`

```javascript
const { Server } = require('socket.io');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User apna room join kare (user-specific notifications ke liye)
    socket.on('join-room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Admin room join kare
    socket.on('join-admin', () => {
      socket.join('admin_room');
      console.log('Admin joined admin room');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = setupSocket;
```

### `server.js` mein Socket.io add karo

```javascript
// server.js mein ye add karo (mongoose.connect ke baad)
const setupSocket = require('./socket');
const io = setupSocket(server);
app.set('io', io);  // Har route mein accessible hoga req.app.get('io')
```

---

## Task 4: React Frontend Pages

### `frontend/src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // App load hone pe check karo — user logged in hai ya nahi
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.data);
        } catch {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.data);
    return data;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Register function
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('token', data.token);
    setUser(data.data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

> **Socho Aise:** AuthContext ek "global store" hai — poore app mein kahi bhi `useAuth()` se user ki info mil jayegi. Login/logout ek jagah manage hota hai, har component automatically update hota hai!

### `frontend/src/context/CartContext.jsx`

```jsx
import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Cart mein add karo
  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  // Cart se hatao
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product._id !== productId));
  };

  // Quantity update karo
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCartItems(prev =>
      prev.map(item =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Cart clear karo
  const clearCart = () => setCartItems([]);

  // Total calculate karo
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 0
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
      totalAmount, totalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
```

### `frontend/src/main.jsx` Update

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## Task 5: WebSocket Integration in React

### `frontend/src/hooks/useSocket.js`

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let socket = null;

export const useSocket = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Connect to WebSocket server
    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('WebSocket connected!');

      // User room join karo
      if (user) {
        socket.emit('join-room', user._id);
        if (user.role === 'admin') {
          socket.emit('join-admin');
        }
      }
    });

    // Order update sunno
    socket.on('order-update', (data) => {
      setNotifications(prev => [data, ...prev]);
    });

    // New order notification (admin ke liye)
    socket.on('new-order', (data) => {
      setNotifications(prev => [data, ...prev]);
    });

    // Cleanup
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);

  // Notification clear karo
  const clearNotifications = () => setNotifications([]);

  return { notifications, clearNotifications };
};
```

> **Tip:** WebSocket hooks reusable hain — kisi bhi component mein `useSocket()` call karo aur real-time notifications sunno. Socket.io client aur server dono setup ho gaye!

---

## Quick Revision Table

| Feature | Backend | Frontend | Real-time |
|---------|---------|----------|-----------|
| Orders | `/api/orders` CRUD | Cart + Checkout page | New order notification |
| File Upload | Multer + Cloudinary | Image upload form | N/A |
| WebSocket | Socket.io server | `useSocket` hook | Order updates |
| Auth Context | JWT APIs | AuthProvider | N/A |
| Cart Context | N/A | CartProvider | N/A |

---

## Aaj Kya Seekha?

1. **Order system** — create with stock validation, my orders, status update
2. **File upload** — Multer (memory storage) + Cloudinary integration
3. **WebSocket** — Socket.io server setup + React client hook
4. **AuthContext** — Global auth state management with useContext
5. **CartContext** — Cart operations (add, remove, update, total)
6. **Full stack integration** — Backend APIs + Frontend contexts + Real-time notifications

> **Practice Time!** Evening mein hum Docker, CI/CD, aur deployment karenge. Project ko production-ready banayenge!
