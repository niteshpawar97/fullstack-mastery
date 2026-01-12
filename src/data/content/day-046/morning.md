# Day 46 Morning: Real-time Chat Application Architecture

> **Aaj ka plan:** Aaj hum ek professional real-time chat app ki architecture samjhenge — rooms, private messaging, online users tracking, typing indicators, message history, aur scaling ka concept. Ye sab milke ek production-ready chat system banate hain.

---

## Chat Application Architecture

### Components Samjho

Ek real-time chat app mein kya-kya chahiye:

```
┌─────────────┐     WebSocket      ┌─────────────┐     Database
│   Client     │ ←──────────────→  │   Server     │ ←──────────→  MongoDB
│  (Browser)   │                   │ (Socket.IO)  │
│              │                   │              │
│ - UI         │                   │ - Auth       │
│ - Events     │                   │ - Rooms      │
│ - Display    │                   │ - Broadcast  │
└─────────────┘                   └─────────────┘
```

> **Socho Aise:** Chat app ek digital baithak hai. Room = kamra, Users = log jo baithe hain, Messages = baatein, Typing indicator = jab koi bolne wala ho toh haath uthaye.

### Features List

| Feature | Description | Event Name |
|---------|-------------|------------|
| Join Room | User kisi room mein jaaye | `join-room` |
| Leave Room | User room chhode | `leave-room` |
| Send Message | Message bheje | `send-message` |
| Private Message | Sirf ek user ko bheje | `private-message` |
| Online Users | Kaun-kaun online hai | `online-users` |
| Typing Indicator | Kaun likh raha hai | `typing` / `stop-typing` |
| Message History | Purane messages dikhaao | `message-history` |

---

## Rooms Architecture

### Room Management

Har room ek alag conversation space hai. Ek user multiple rooms mein ho sakta hai.

```javascript
// Room management ka structure
const rooms = new Map(); // Room ka data track karo

// Room ka data structure
// rooms = {
//   'kisan-mandi': {
//     name: 'Kisan Mandi',
//     users: Set(['userId1', 'userId2']),
//     createdAt: Date
//   }
// }

function createRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      name: roomName,
      users: new Set(),
      createdAt: new Date()
    });
  }
  return rooms.get(roomName);
}

function addUserToRoom(roomName, userId) {
  const room = createRoom(roomName);
  room.users.add(userId);
  return room;
}

function removeUserFromRoom(roomName, userId) {
  const room = rooms.get(roomName);
  if (room) {
    room.users.delete(userId);
    // Agar room khali ho gaya toh delete karo
    if (room.users.size === 0) {
      rooms.delete(roomName);
    }
  }
}
```

> **Yaad Rakho:** Socket.IO ke built-in rooms use karo connection ke liye (`socket.join`), lekin apna alag `Map` bhi rakho user data track karne ke liye — kyunki Socket.IO rooms mein user metadata nahi hota.

---

## Private Messaging

### Ek User Ko Direct Message

Private message ke liye target user ka `socket.id` chahiye:

```javascript
// Server side — private message handle karo
socket.on('private-message', ({ targetId, message }) => {
  // Target user ko bhejo
  io.to(targetId).emit('private-message', {
    from: socket.id,
    fromUsername: users.get(socket.id)?.username,
    message: message,
    timestamp: new Date()
  });

  // Sender ko bhi confirm bhejo
  socket.emit('private-message-sent', {
    to: targetId,
    message: message,
    timestamp: new Date()
  });
});
```

> **Socho Aise:** Private message = kaan mein baat karna. Room message = sabke saamne bolna. `io.to(socketId)` se ek specific user ko target kar sakte ho.

### Socket ID vs User ID

```javascript
// Users track karne ka system
const users = new Map(); // socketId -> user info

io.on('connection', (socket) => {
  // User register kare
  socket.on('register', (username) => {
    users.set(socket.id, {
      username: username,
      socketId: socket.id,
      rooms: new Set(),
      joinedAt: new Date()
    });
    console.log(`${username} registered with ID: ${socket.id}`);
  });

  // Disconnect pe clean up
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      // Sab rooms se remove karo
      user.rooms.forEach(room => removeUserFromRoom(room, socket.id));
      users.delete(socket.id);
    }
  });
});
```

> **Warning:** `socket.id` har reconnection pe badal jaata hai. Production mein user ka apna unique ID (database se) use karo, socket.id sirf connection identify karne ke liye.

---

## Online Users Tracking

### Kaun Online Hai?

```javascript
// Online users list bhejo
function broadcastOnlineUsers(roomName) {
  const room = rooms.get(roomName);
  if (!room) return;

  // Room ke users ki list banao
  const onlineList = [];
  room.users.forEach(socketId => {
    const user = users.get(socketId);
    if (user) {
      onlineList.push({
        socketId: socketId,
        username: user.username,
        joinedAt: user.joinedAt
      });
    }
  });

  // Room ke sabko bhejo
  io.to(roomName).emit('online-users', {
    room: roomName,
    users: onlineList,
    count: onlineList.length
  });
}

// Jab user join ya leave kare, list update karo
socket.on('join-room', (roomName) => {
  socket.join(roomName);
  addUserToRoom(roomName, socket.id);

  const user = users.get(socket.id);
  if (user) user.rooms.add(roomName);

  // Updated list sabko bhejo
  broadcastOnlineUsers(roomName);
});
```

> **Example:** WhatsApp group mein upar dikhta hai "5 participants" — waise hi humara `online-users` event kaam karta hai. Koi aaye ya jaaye, list update ho jaaye.

---

## Typing Indicators

### "User is typing..." Feature

```javascript
// Server side — typing events relay karo
socket.on('typing', ({ room }) => {
  const user = users.get(socket.id);
  // Sender ke alawa room ke sabko batao
  socket.to(room).emit('user-typing', {
    username: user?.username || 'Unknown',
    socketId: socket.id,
    room: room
  });
});

socket.on('stop-typing', ({ room }) => {
  const user = users.get(socket.id);
  socket.to(room).emit('user-stop-typing', {
    username: user?.username || 'Unknown',
    socketId: socket.id,
    room: room
  });
});
```

### Client Side — Debounced Typing

```javascript
// Client side — typing detect karo with debounce
let typingTimer;
const TYPING_DELAY = 2000; // 2 second baad stop-typing

msgInput.addEventListener('input', () => {
  // Typing start batao
  socket.emit('typing', { room: currentRoom });

  // Timer reset karo
  clearTimeout(typingTimer);

  // 2 second baad stop-typing bhejo
  typingTimer = setTimeout(() => {
    socket.emit('stop-typing', { room: currentRoom });
  }, TYPING_DELAY);
});
```

> **Yaad Rakho:** Debounce zaroori hai! Bina debounce ke har keypress pe "typing" event jaayega — server pe unnecessary load. 2 second ka delay rakho — agar 2 second tak kuch na type kare toh "stop-typing" bhejo.

---

## Message History

### Messages Store Karo MongoDB Mein

```javascript
const mongoose = require('mongoose');

// Message schema
const messageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  senderUsername: String,
  message: { type: String, required: true },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Message save karo jab aaye
socket.on('send-message', async ({ room, message }) => {
  const user = users.get(socket.id);

  // Database mein save karo
  const newMsg = await Message.create({
    room,
    sender: socket.id,
    senderUsername: user?.username,
    message,
    type: 'text'
  });

  // Room mein broadcast karo
  io.to(room).emit('new-message', {
    id: newMsg._id,
    sender: socket.id,
    senderUsername: user?.username,
    message,
    timestamp: newMsg.timestamp
  });
});

// Purane messages load karo jab room join kare
socket.on('load-history', async ({ room, limit = 50 }) => {
  const messages = await Message.find({ room })
    .sort({ timestamp: -1 }) // Naye pehle
    .limit(limit)
    .lean();

  // Purane pehle dikhane ke liye reverse karo
  socket.emit('message-history', {
    room,
    messages: messages.reverse()
  });
});
```

> **Tip:** Messages ko hamesha database mein save karo. WebSocket sirf real-time delivery ke liye hai — agar user offline tha toh message history se load hoga.

---

## Scaling WebSocket Servers

### Problem: Multiple Server Instances

Jab traffic badhta hai toh multiple server instances chalate hain. Problem: User A server-1 pe hai, User B server-2 pe — dono ke beech message kaise jaayega?

```
User A ──→ Server 1 ──┐
                       ├──→ ??? Message kaise pahunchega?
User B ──→ Server 2 ──┘
```

### Solution: Redis Adapter

```javascript
// npm install @socket.io/redis-adapter redis
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

async function setupRedisAdapter() {
  const pubClient = createClient({ url: 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  // Redis adapter attach karo
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter connected — scaling ready!');
}
```

> **Socho Aise:** Redis adapter = ek central announcement board. Server 1 pe message aaye toh Redis board pe likha jaata hai — Server 2 padh leta hai aur apne users ko deliver karta hai.

---

## Quick Revision Table

| Concept | Implementation | Key Point |
|---------|---------------|-----------|
| Rooms | `socket.join()` + custom Map | Socket.IO rooms + apna metadata |
| Private Message | `io.to(socketId).emit()` | Target ka socketId chahiye |
| Online Users | Map + Set tracking | Join/leave pe list broadcast karo |
| Typing Indicator | Debounced input events | 2 sec delay, stop-typing auto |
| Message History | MongoDB mein save | Join pe last 50 messages load karo |
| Scaling | Redis Adapter | Multiple servers ke beech sync |

---

## Aaj Kya Seekha?

1. **Chat architecture** — rooms, users, messages ka system design
2. **Private messaging** — `io.to(socketId).emit()` se specific user ko bhejo
3. **Online users** — Map + Set se track karo, join/leave pe broadcast karo
4. **Typing indicator** — debounced events se "is typing" feature banao
5. **Message history** — MongoDB mein save karo, room join pe load karo
6. **Scaling** — Redis adapter se multiple server instances mein sync karo

> **Practice Time!** Evening mein hum ye saari features milake ek complete chat app banayenge — join room, send message, online users, typing indicator. Sab kuch working!
