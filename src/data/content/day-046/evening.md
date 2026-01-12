# Day 46 Evening: Practice — Build a Real-time Chat App

> **Aaj ka plan:** Aaj hum ek complete real-time chat app banayenge — room join, messages, online users list, aur typing indicator. Full working project!

---

## Project Setup

> **Terminal Command:**
> ```bash
> mkdir chat-app && cd chat-app
> npm init -y
> npm install express socket.io mongoose
> ```

### Folder Structure

```
chat-app/
├── server.js           # Main server
├── models/
│   └── Message.js      # Message schema
├── public/
│   ├── index.html      # Chat UI
│   └── style.css       # Styling
├── package.json
└── .env
```

---

## Step 1: Message Model

```javascript
// models/Message.js — Message ka schema
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true  // Room ke hisaab se fast search
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'system'],  // system = join/leave messages
    default: 'text'
  }
}, {
  timestamps: true  // createdAt, updatedAt automatic
});

module.exports = mongoose.model('Message', messageSchema);
```

---

## Step 2: Server Code

```javascript
// server.js — Poora chat server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files
app.use(express.static('public'));

// MongoDB connect
mongoose.connect('mongodb://localhost:27017/chat-app')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ========== Users Track Karo ==========
const onlineUsers = new Map(); // socketId -> { username, room }

// Helper — room ke online users ki list
function getRoomUsers(room) {
  const userList = [];
  onlineUsers.forEach((user, socketId) => {
    if (user.room === room) {
      userList.push({ socketId, username: user.username });
    }
  });
  return userList;
}

// ========== Socket.IO Events ==========
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // === 1. Room Join Karo ===
  socket.on('join-room', async ({ username, room }) => {
    // User track karo
    onlineUsers.set(socket.id, { username, room });

    // Socket.IO room join
    socket.join(room);
    console.log(`${username} joined room: ${room}`);

    // System message save karo
    await Message.create({
      room, username: 'System',
      message: `${username} room mein aaya`,
      type: 'system'
    });

    // Purane messages bhejo (last 50)
    const history = await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    socket.emit('message-history', history.reverse());

    // Room ko batao naya user aaya
    socket.to(room).emit('new-message', {
      username: 'System',
      message: `${username} room mein aaya`,
      type: 'system',
      createdAt: new Date()
    });

    // Online users list update karo
    io.to(room).emit('online-users', getRoomUsers(room));
  });

  // === 2. Message Bhejo ===
  socket.on('send-message', async (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    // Database mein save karo
    const saved = await Message.create({
      room: user.room,
      username: user.username,
      message: data.message,
      type: 'text'
    });

    // Poore room ko bhejo
    io.to(user.room).emit('new-message', {
      username: user.username,
      message: data.message,
      type: 'text',
      createdAt: saved.createdAt
    });
  });

  // === 3. Typing Indicator ===
  socket.on('typing', () => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    // Sender ke alawa sabko batao
    socket.to(user.room).emit('user-typing', {
      username: user.username
    });
  });

  socket.on('stop-typing', () => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    socket.to(user.room).emit('user-stop-typing', {
      username: user.username
    });
  });

  // === 4. Disconnect ===
  socket.on('disconnect', async () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      console.log(`${user.username} disconnected from ${user.room}`);

      // System message
      await Message.create({
        room: user.room,
        username: 'System',
        message: `${user.username} chala gaya`,
        type: 'system'
      });

      // Room ko batao
      socket.to(user.room).emit('new-message', {
        username: 'System',
        message: `${user.username} chala gaya`,
        type: 'system',
        createdAt: new Date()
      });

      // User remove karo
      onlineUsers.delete(socket.id);

      // Online list update karo
      io.to(user.room).emit('online-users', getRoomUsers(user.room));
    }
  });
});

// Server start
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Chat server running: http://localhost:${PORT}`);
});
```

> **Yaad Rakho:** Har message MongoDB mein save hota hai. Jab naya user join kare, pehle history load hoti hai phir real-time messages aate hain.

---

## Step 3: Client HTML

```html
<!-- public/index.html — Chat UI -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Real-time Chat App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Login Screen -->
  <div id="login-screen">
    <h1>Chat App mein Aao</h1>
    <input type="text" id="usernameInput" placeholder="Apna naam likho" />
    <input type="text" id="roomInput" placeholder="Room ka naam (e.g. kisan-mandi)" />
    <button id="joinBtn">Join Room</button>
  </div>

  <!-- Chat Screen -->
  <div id="chat-screen" style="display:none;">
    <div id="header">
      <h2>Room: <span id="roomName"></span></h2>
      <span id="typingIndicator"></span>
    </div>
    <div id="sidebar">
      <h3>Online Users</h3>
      <ul id="userList"></ul>
    </div>
    <div id="messages"></div>
    <div id="inputArea">
      <input type="text" id="msgInput" placeholder="Message likho..." />
      <button id="sendBtn">Bhejo</button>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    let currentUser = '';
    let currentRoom = '';

    // DOM elements
    const loginScreen = document.getElementById('login-screen');
    const chatScreen = document.getElementById('chat-screen');
    const messagesEl = document.getElementById('messages');
    const userListEl = document.getElementById('userList');
    const typingEl = document.getElementById('typingIndicator');
    const msgInput = document.getElementById('msgInput');

    // ===== JOIN ROOM =====
    document.getElementById('joinBtn').addEventListener('click', () => {
      currentUser = document.getElementById('usernameInput').value.trim();
      currentRoom = document.getElementById('roomInput').value.trim();
      if (!currentUser || !currentRoom) return alert('Naam aur room dono bharo!');

      socket.emit('join-room', { username: currentUser, room: currentRoom });
      loginScreen.style.display = 'none';
      chatScreen.style.display = 'flex';
      document.getElementById('roomName').textContent = currentRoom;
    });

    // ===== MESSAGE HISTORY =====
    socket.on('message-history', (messages) => {
      messagesEl.innerHTML = '';
      messages.forEach(msg => addMessage(msg));
    });

    // ===== NEW MESSAGE =====
    socket.on('new-message', (msg) => addMessage(msg));

    function addMessage(msg) {
      const div = document.createElement('div');
      div.className = msg.type === 'system' ? 'msg system' : 'msg';
      const time = new Date(msg.createdAt).toLocaleTimeString();

      if (msg.type === 'system') {
        div.textContent = `[${time}] ${msg.message}`;
      } else {
        const isMine = msg.username === currentUser;
        div.className += isMine ? ' mine' : ' other';
        div.innerHTML = `<strong>${msg.username}</strong> <small>${time}</small><br>${msg.message}`;
      }
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // ===== SEND MESSAGE =====
    function sendMessage() {
      const msg = msgInput.value.trim();
      if (!msg) return;
      socket.emit('send-message', { message: msg });
      socket.emit('stop-typing');
      msgInput.value = '';
    }

    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    msgInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // ===== TYPING INDICATOR =====
    let typingTimer;
    msgInput.addEventListener('input', () => {
      socket.emit('typing');
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => socket.emit('stop-typing'), 2000);
    });

    const typingUsers = new Set();
    socket.on('user-typing', ({ username }) => {
      typingUsers.add(username);
      updateTypingUI();
    });
    socket.on('user-stop-typing', ({ username }) => {
      typingUsers.delete(username);
      updateTypingUI();
    });
    function updateTypingUI() {
      if (typingUsers.size === 0) typingEl.textContent = '';
      else if (typingUsers.size === 1) typingEl.textContent = `${[...typingUsers][0]} likh raha hai...`;
      else typingEl.textContent = `${typingUsers.size} log likh rahe hain...`;
    }

    // ===== ONLINE USERS =====
    socket.on('online-users', (users) => {
      userListEl.innerHTML = '';
      users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u.username + (u.username === currentUser ? ' (Tum)' : '');
        userListEl.appendChild(li);
      });
    });
  </script>
</body>
</html>
```

---

## Step 4: CSS Styling

```css
/* public/style.css */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; background: #f4f4f4; }

#login-screen {
  max-width: 400px; margin: 100px auto; text-align: center;
  background: white; padding: 30px; border-radius: 10px;
}
#login-screen input { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ccc; border-radius: 5px; }
#login-screen button { width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }

#chat-screen { display: flex; flex-wrap: wrap; max-width: 800px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; height: 80vh; }
#header { width: 100%; padding: 10px 15px; background: #4CAF50; color: white; display: flex; justify-content: space-between; align-items: center; }
#typingIndicator { font-size: 12px; font-style: italic; }
#sidebar { width: 200px; background: #e8e8e8; padding: 10px; overflow-y: auto; }
#sidebar h3 { margin-bottom: 10px; }
#userList { list-style: none; }
#userList li { padding: 5px; margin: 3px 0; background: white; border-radius: 3px; }
#messages { flex: 1; padding: 10px; overflow-y: auto; height: calc(80vh - 110px); }
.msg { padding: 8px; margin: 5px; border-radius: 8px; max-width: 70%; }
.msg.system { text-align: center; color: #999; font-style: italic; max-width: 100%; }
.msg.mine { background: #DCF8C6; margin-left: auto; }
.msg.other { background: #f0f0f0; }
#inputArea { width: 100%; display: flex; padding: 10px; background: #f9f9f9; }
#msgInput { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
#sendBtn { padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; margin-left: 5px; cursor: pointer; }
```

---

## Step 5: Run Aur Test Karo

> **Terminal Command:**
> ```bash
> # Pehle MongoDB chalu karo (alag terminal mein)
> mongod
>
> # Phir server start karo
> node server.js
> ```

> **Expected Output:**
> ```
> MongoDB connected
> Chat server running: http://localhost:3000
> ```

### Test Steps:

1. Tab 1: Username = "Ramesh", Room = "kisan-mandi" se join karo
2. Tab 2: Username = "Suresh", Room = "kisan-mandi" se join karo
3. Dono mein messages bhejo — real-time dikhenge
4. Typing karo — doosre tab mein "likh raha hai..." dikhega
5. Ek tab band karo — "chala gaya" message aayega

> **Tip:** Tab 3 mein alag room join karo (e.g. "fruits-market") — us room ke messages "kisan-mandi" mein nahi dikhenge. Rooms properly isolate karte hain!

---

## Quick Revision Table

| Feature | Server Event | Client Event |
|---------|-------------|--------------|
| Join Room | `join-room` | Login pe emit |
| Send Message | `send-message` | Input + Enter |
| Message History | `message-history` | Join pe receive |
| New Message | `new-message` | Real-time display |
| Typing | `typing` / `stop-typing` | Input pe debounced |
| Online Users | `online-users` | Sidebar update |
| Disconnect | Auto `disconnect` | Connection close |

---

## Aaj Kya Seekha?

1. **Complete chat server** — rooms, messages, online users, typing indicator sab implement kiya
2. **MongoDB integration** — messages persist hote hain, history load hoti hai
3. **User tracking** — Map se online users track kiye, room-wise filter kiya
4. **Typing indicator** — debounced events se real-time "typing" status dikhaya
5. **Client UI** — login screen, chat screen, message display, online users sidebar
6. **Testing** — multiple tabs se real-time communication verify kiya

> **Practice Time!** Extra challenges: (1) Private message feature add karo — kisi user pe click karke DM bhejo. (2) Message mein emoji support add karo. (3) "Seen" indicator add karo — message padha gaya toh blue tick dikhe!
