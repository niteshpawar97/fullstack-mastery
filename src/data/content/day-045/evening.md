# Day 45 Evening: Practice — Basic WebSocket Server with Socket.IO

> **Aaj ka plan:** Aaj hum hands-on practice karenge — Socket.IO se WebSocket server banayenge, client connect karenge, messages bhejenge aur receive karenge. Real code likhenge!

---

## Project Setup

### Folder Structure Banao

> **Terminal Command:**
> ```bash
> mkdir websocket-practice && cd websocket-practice
> npm init -y
> npm install express socket.io
> ```

```
websocket-practice/
├── server.js          # WebSocket server
├── public/
│   └── index.html     # Client page (browser)
├── package.json
└── node_modules/
```

> **Tip:** Hum `public` folder mein HTML file rakhenge jo browser mein open hogi. Socket.IO apna client library automatically serve karta hai.

---

## Step 1: Basic Server Banao

```javascript
// server.js — Pehla WebSocket server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files serve karo (public folder se)
app.use(express.static('public'));

// ============ WebSocket Logic ============

// Jab koi user connect ho
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Welcome message bhejo sirf is user ko
  socket.emit('welcome', {
    message: 'Server se swagat hai! Tum connected ho.',
    yourId: socket.id
  });

  // Baaki sabko batao ki naya user aaya
  socket.broadcast.emit('user-joined', {
    message: `Naya user aaya: ${socket.id}`,
    totalUsers: io.engine.clientsCount
  });

  // Jab client message bheje
  socket.on('chat-message', (data) => {
    console.log(`📩 Message from ${socket.id}:`, data);

    // Sabko bhejo (sender ko bhi) — taaki sabke screen pe dikhe
    io.emit('chat-message', {
      userId: socket.id,
      message: data.message,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  // Jab user disconnect ho
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    io.emit('user-left', {
      message: `User chala gaya: ${socket.id}`,
      totalUsers: io.engine.clientsCount
    });
  });
});

// Server start karo
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

> **Yaad Rakho:** `io.engine.clientsCount` se pata chalta hai kitne users connected hain abhi.

---

## Step 2: Client HTML Page Banao

```html
<!-- public/index.html — Browser client -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSocket Chat</title>
  <style>
    body { font-family: Arial; max-width: 600px; margin: 20px auto; }
    #messages { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; }
    .msg { margin: 5px 0; padding: 5px; background: #f0f0f0; border-radius: 5px; }
    .system { color: #888; font-style: italic; }
    #msgInput { width: 75%; padding: 8px; }
    #sendBtn { width: 20%; padding: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>WebSocket Chat Demo</h1>
  <p>Status: <span id="status">Connecting...</span></p>
  <div id="messages"></div>
  <br>
  <input type="text" id="msgInput" placeholder="Message likho..." />
  <button id="sendBtn">Bhejo</button>

  <!-- Socket.IO client library (server automatically serve karta hai) -->
  <script src="/socket.io/socket.io.js"></script>
  <script>
    // Server se connect karo
    const socket = io();

    const statusEl = document.getElementById('status');
    const messagesEl = document.getElementById('messages');
    const msgInput = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');

    // Helper — message display karo
    function addMessage(text, isSystem = false) {
      const div = document.createElement('div');
      div.className = isSystem ? 'msg system' : 'msg';
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight; // Auto scroll
    }

    // ---- Events ----

    // Connected!
    socket.on('welcome', (data) => {
      statusEl.textContent = `Connected (${data.yourId})`;
      statusEl.style.color = 'green';
      addMessage(data.message, true);
    });

    // Naya user aaya
    socket.on('user-joined', (data) => {
      addMessage(`${data.message} (Total: ${data.totalUsers})`, true);
    });

    // Chat message aaya
    socket.on('chat-message', (data) => {
      const prefix = data.userId === socket.id ? '🟢 Tum' : `🔵 ${data.userId.slice(0, 6)}`;
      addMessage(`[${data.timestamp}] ${prefix}: ${data.message}`);
    });

    // User chala gaya
    socket.on('user-left', (data) => {
      addMessage(`${data.message} (Total: ${data.totalUsers})`, true);
    });

    // Disconnect
    socket.on('disconnect', () => {
      statusEl.textContent = 'Disconnected!';
      statusEl.style.color = 'red';
      addMessage('Connection lost! Reconnecting...', true);
    });

    // ---- Message bhejo ----
    function sendMessage() {
      const msg = msgInput.value.trim();
      if (!msg) return;

      // Server ko bhejo
      socket.emit('chat-message', { message: msg });
      msgInput.value = '';
    }

    sendBtn.addEventListener('click', sendMessage);
    msgInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>
```

> **Tip:** `/socket.io/socket.io.js` — ye file Socket.IO server khud serve karta hai. Tumhe manually download nahi karni padti.

---

## Step 3: Run Karo Aur Test Karo

> **Terminal Command:**
> ```bash
> node server.js
> ```

> **Expected Output:**
> ```
> 🚀 Server running on http://localhost:3000
> ```

### Testing Steps:

1. Browser mein `http://localhost:3000` kholo — pehla tab
2. Ek aur tab mein `http://localhost:3000` kholo — doosra user
3. Dono tabs mein messages bhejke dekho
4. Ek tab band karo — doosre mein "user left" dikhega

> **Yaad Rakho:** Multiple tabs = multiple users. Har tab ek alag `socket.id` paata hai.

---

## Step 4: Rooms Feature Add Karo

Ab server mein rooms add karte hain — users alag-alag rooms mein join kar sakein:

```javascript
// server.js mein add karo — connection ke andar

socket.on('join-room', (roomName) => {
  socket.join(roomName);
  console.log(`${socket.id} joined room: ${roomName}`);

  // Room ke sabko batao
  io.to(roomName).emit('room-notification', {
    message: `${socket.id.slice(0, 6)} room "${roomName}" mein aaya`,
    room: roomName
  });
});

socket.on('room-message', ({ room, message }) => {
  // Sirf us room mein bhejo
  io.to(room).emit('chat-message', {
    userId: socket.id,
    message: message,
    room: room,
    timestamp: new Date().toLocaleTimeString()
  });
});
```

### Client Side Room Join:

```javascript
// Client mein add karo
function joinRoom(roomName) {
  socket.emit('join-room', roomName);
  addMessage(`Tum room "${roomName}" mein join ho gaye`, true);
}

function sendRoomMessage(room, message) {
  socket.emit('room-message', { room, message });
}

// Example usage
// joinRoom('farmers');
// sendRoomMessage('farmers', 'Tamatar ka bhav kya hai?');
```

> **Socho Aise:** Ek mandi app mein — "Vegetables" room, "Fruits" room, "Grains" room. Har kisan apni category ke room mein join kare aur sirf relevant updates dekhe.

---

## Common Mistakes & Debugging

| Mistake | Problem | Solution |
|---------|---------|----------|
| `app.listen()` use karna | Socket.IO kaam nahi karega | `server.listen()` use karo |
| Client pe `io()` call bhoolna | Connection nahi banega | `const socket = io();` likho |
| `emit` aur `on` confuse karna | Messages nahi aayenge | `emit` = bhejo, `on` = suno |
| Room join kiye bina room message | Kisi ko nahi jaayega | Pehle `join` phir `emit` |

> **Warning:** Kabhi bhi `io.emit` use karo jab sabko bhejna ho. `socket.emit` sirf ek user ko bhejta hai. Galat method = message lost!

---

## Quick Revision Table

| Concept | Code | Kya Karta Hai |
|---------|------|---------------|
| Server setup | `new Server(httpServer)` | Socket.IO server banata hai |
| Client connect | `const socket = io()` | Server se connect karta hai |
| Send message | `socket.emit('event', data)` | Event fire karta hai |
| Listen event | `socket.on('event', callback)` | Event sunta hai |
| Join room | `socket.join('room')` | Room mein daalta hai |
| Room message | `io.to('room').emit(...)` | Room ke sabko bhejta hai |
| Broadcast | `socket.broadcast.emit(...)` | Sender chhod ke sabko |

---

## Aaj Kya Seekha?

1. **Socket.IO server** kaise setup karte hain Express ke saath
2. **Client-side** connection kaise banate hain browser mein
3. **Events** — `emit` se bhejo, `on` se suno — dono taraf kaam karta hai
4. **Rooms** — users ko groups mein organize karna aur room-specific messages
5. **Debugging** — common mistakes aur unke solutions
6. **Real-time chat** ka basic flow — connect, send, receive, disconnect

> **Practice Time!** Apne code mein ye try karo: (1) Username enter karne ka feature add karo connect hone pe. (2) "User is typing..." indicator add karo. Kal hum poora chat app banayenge!
