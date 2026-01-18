# Day 58 - Evening: Phase 2 Project — WebSocket + Real-Time Features

> **Aaj ka plan:**
> Project mein real-time features add karenge — order status updates via WebSocket aur notification system banayenge. Jab seller order status change kare, customer ko turant pata chale!

---

## Task 1: WebSocket Setup (Socket.io)

```bash
npm install socket.io
```

```javascript
// src/config/socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("./index");

let io;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware — token verify karo
  io.use((socket, next) => {
    const token = socket.handshake.auth.token ||
                  socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token zaroori hai"));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // User ko apne room mein join karo
    socket.join(`user_${socket.userId}`);

    // Seller ko seller room mein
    if (socket.userRole === "seller" || socket.userRole === "admin") {
      socket.join("sellers");
    }

    // Admin room
    if (socket.userRole === "admin") {
      socket.join("admins");
    }

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Ping test
    socket.on("ping_server", (callback) => {
      callback({ status: "ok", time: new Date().toISOString() });
    });
  });

  console.log("WebSocket server ready");
  return io;
};

// IO instance access karne ke liye
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

module.exports = { setupSocket, getIO };
```

> **Yaad Rakho:**
> WebSocket pe bhi authentication lagao! Bina auth ke koi bhi connect karke sensitive data sun sakta hai. `socket.handshake.auth.token` se JWT verify karo — same pattern jaise HTTP middleware mein karte hain.

---

## Task 2: Server.js Update

```javascript
// src/server.js — updated with WebSocket
const http = require("http");
const app = require("./app");
const connectDB = require("./config/database");
const { setupSocket } = require("./config/socket");
const config = require("./config");

const startServer = async () => {
  await connectDB();

  // HTTP server banao (Socket.io ke liye zaroori)
  const server = http.createServer(app);

  // WebSocket setup
  setupSocket(server);

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.env}]`);
    console.log(`WebSocket ready on same port`);
  });
};

startServer();
```

---

## Task 3: Order Status Real-Time Notification

```javascript
// src/controllers/orderController.js mein updateOrderStatus update karo
const { getIO } = require("../config/socket");

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["confirmed", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status`);
    }

    const order = await Order.findById(req.params.id);
    if (!order) throw ApiError.notFound("Order nahi mila");

    if (["delivered", "cancelled"].includes(order.status)) {
      throw ApiError.badRequest(`Order already ${order.status} hai`);
    }

    const oldStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status changed to ${status}`,
    });

    // Cancel pe stock restore
    if (status === "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await order.save();

    // --- REAL-TIME NOTIFICATION ---
    const io = getIO();

    // Customer ko notify karo
    io.to(`user_${order.customer}`).emit("order_status_update", {
      orderId: order._id,
      oldStatus,
      newStatus: status,
      note: note || `Your order is now ${status}`,
      timestamp: new Date().toISOString(),
    });

    // Status wise different messages
    const statusMessages = {
      confirmed: "Order confirm ho gaya! Seller prepare kar raha hai.",
      shipped: "Order ship ho gaya! Raste mein hai.",
      delivered: "Order deliver ho gaya! Enjoy karo!",
      cancelled: "Order cancel ho gaya.",
    };

    // Push notification event
    io.to(`user_${order.customer}`).emit("notification", {
      type: "order_update",
      title: "Order Update",
      message: statusMessages[status],
      orderId: order._id,
      read: false,
      timestamp: new Date().toISOString(),
    });

    // Admin ko bhi notify karo
    io.to("admins").emit("admin_order_update", {
      orderId: order._id,
      customerId: order.customer,
      status,
      timestamp: new Date().toISOString(),
    });

    ApiResponse.success(res, { order }, "Order status updated!");
  } catch (error) {
    next(error);
  }
};
```

> **Socho Aise:**
> Jaise Swiggy/Zomato pe order status change hota hai toh turant app pe notification aata hai — same cheez hum bana rahe hain. Seller status change kare, customer ko TURANT pata chale bina page refresh kiye.

---

## Task 4: New Order Notification to Sellers

```javascript
// src/controllers/orderController.js — createOrder mein add karo

exports.createOrder = async (req, res, next) => {
  try {
    // ... (existing order creation code) ...

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      statusHistory: [{ status: "pending", note: "Order placed" }],
    });

    // Populate karo for notification
    await order.populate("customer", "name email");

    // --- REAL-TIME: Sellers ko notify karo ---
    const io = getIO();

    io.to("sellers").emit("new_order", {
      orderId: order._id,
      customerName: order.customer.name,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
      timestamp: new Date().toISOString(),
    });

    // Admin dashboard update
    io.to("admins").emit("dashboard_update", {
      type: "new_order",
      data: {
        orderId: order._id,
        amount: order.totalAmount,
      },
    });

    ApiResponse.created(res, { order }, "Order placed!");
  } catch (error) {
    next(error);
  }
};
```

---

## Task 5: Notification System

```javascript
// src/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["order_update", "new_order", "review", "system"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed }, // extra data (orderId, etc.)
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete old notifications (30 din baad)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);
```

```javascript
// src/controllers/notificationController.js
const Notification = require("../models/Notification");
const ApiResponse = require("../utils/apiResponse");

// Meri notifications lao
exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort("-createdAt")
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// Notification read mark karo
exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    ApiResponse.success(res, null, "Marked as read");
  } catch (error) {
    next(error);
  }
};

// Saari notifications read mark karo
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    ApiResponse.success(res, null, "All marked as read");
  } catch (error) {
    next(error);
  }
};
```

```javascript
// src/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getMyNotifications, markAsRead, markAllRead,
} = require("../controllers/notificationController");

router.get("/", authenticate, getMyNotifications);
router.put("/:id/read", authenticate, markAsRead);
router.put("/read-all", authenticate, markAllRead);

module.exports = router;
```

---

## Task 6: Notification Helper

```javascript
// src/utils/notify.js
// Reusable notification helper — DB save + WebSocket emit
const Notification = require("../models/Notification");
const { getIO } = require("../config/socket");

const sendNotification = async (userId, { type, title, message, data }) => {
  try {
    // Database mein save karo (persistent)
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
    });

    // Real-time emit karo (instant)
    const io = getIO();
    io.to(`user_${userId}`).emit("notification", {
      id: notification._id,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error("Notification send error:", error.message);
  }
};

module.exports = { sendNotification };
```

### Usage in Controllers

```javascript
// Kisi bhi controller mein use karo
const { sendNotification } = require("../utils/notify");

// Order confirm hone pe
await sendNotification(order.customer, {
  type: "order_update",
  title: "Order Confirmed!",
  message: `Order #${order._id} confirm ho gaya hai.`,
  data: { orderId: order._id, status: "confirmed" },
});

// Naya review aane pe seller ko
await sendNotification(product.seller, {
  type: "review",
  title: "New Review!",
  message: `${user.name} ne ${product.name} pe review diya.`,
  data: { productId: product._id, rating: review.rating },
});
```

> **Tip:**
> Notification do jagah save karo — database (persistent, page refresh pe bhi dikhe) aur WebSocket (instant, real-time). Agar user offline hai toh database mein saved rahega, online aane pe dekhega.

---

## Task 7: Client-Side Connection Example

```javascript
// Frontend mein kaise connect karenge (reference ke liye)
// Yeh frontend code hai — sirf samjhne ke liye

import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: localStorage.getItem("token"), // JWT token bhejo
  },
});

// Connection events
socket.on("connect", () => {
  console.log("Connected to server!");
});

// Order status update sunno
socket.on("order_status_update", (data) => {
  console.log(`Order ${data.orderId}: ${data.oldStatus} --> ${data.newStatus}`);
  // UI update karo — toast notification dikhao
  showToast(data.note);
});

// Notifications sunno
socket.on("notification", (data) => {
  console.log("New notification:", data.title);
  // Bell icon pe badge dikhao
  updateNotificationBadge(data);
});

// Sellers ke liye: new order alert
socket.on("new_order", (data) => {
  console.log("New order received!", data);
  // Sound play karo, dashboard update karo
  playOrderSound();
  refreshOrderList();
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
```

---

## Quick Revision

| Task | Kya Banaya |
|---|---|
| Socket.io Setup | Auth middleware, room system |
| Server Update | HTTP server with WebSocket |
| Order Status | Real-time notification to customer |
| New Order | Sellers ko instant alert |
| Notification Model | DB persistent notifications |
| Notification API | Get, Mark Read, Mark All Read |
| Notify Helper | Reusable: DB save + WebSocket emit |
| Client Example | Frontend connection reference |

---

## Aaj Kya Seekha?

1. Socket.io setup kiya with JWT authentication
2. Room-based system — user rooms, seller room, admin room
3. Order status change pe real-time notification
4. New order pe sellers ko instant alert
5. Notification system — database + WebSocket combo
6. Reusable sendNotification helper banaya
