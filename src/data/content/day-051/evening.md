# Day 51 Evening: Mini Project — IoT Sensor Dashboard

> **Aaj ka plan:** Aaj hum Week 8 ka capstone project banayenge — "IoT Sensor Dashboard" — MQTT se sensor data receive karo, MongoDB mein store karo, WebSocket se browser ko real-time push karo, aur REST API se history serve karo. Sab kuch ek project mein!

---

## Project Architecture

```
┌───────────┐   MQTT    ┌─────────────────────────┐   MongoDB
│  Sensors  │ ────────→ │     Node.js Backend      │ ─────────→ DB
│(Simulator)│           │                          │
└───────────┘           │  ┌─ MQTT Subscriber      │
                        │  ├─ Express REST API     │
┌───────────┐  WebSocket│  ├─ Socket.IO Server     │
│  Browser  │ ←────────→│  └─ Alert Engine         │
│ Dashboard │           │                          │
└───────────┘  REST API └─────────────────────────┘
               ────────→
```

> **Socho Aise:** Ye project ek real smart farm monitoring system hai. Sensors data bhejte hain (MQTT), backend save karta hai (MongoDB), dashboard real-time dikhata hai (WebSocket), aur purana data API se milta hai (REST).

---

## Project Setup

> **Terminal Command:**
> ```bash
> mkdir iot-sensor-dashboard && cd iot-sensor-dashboard
> npm init -y
> npm install express socket.io mongoose mqtt cors
> ```

### Folder Structure

```
iot-sensor-dashboard/
├── server.js               # Main entry point
├── config/
│   └── db.js               # MongoDB connection
├── models/
│   └── SensorData.js       # Schema
├── services/
│   ├── mqttService.js      # MQTT subscriber
│   └── alertService.js     # Alert logic
├── routes/
│   └── api.js              # REST endpoints
├── public/
│   └── index.html          # Dashboard UI
├── simulator.js            # Fake sensors
└── package.json
```

---

## Step 1: Database Config & Model

```javascript
// config/db.js — MongoDB connect karo
const mongoose = require('mongoose');

async function connectDB() {
  await mongoose.connect('mongodb://localhost:27017/iot-dashboard');
  console.log('MongoDB connected');
}

module.exports = connectDB;
```

```javascript
// models/SensorData.js — Sensor reading schema
const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  location: { type: String, required: true },
  device: { type: String, required: true },
  metric: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, default: '' },
  isAlert: { type: Boolean, default: false },
  alertType: String
}, { timestamps: true }); // createdAt auto

// Indexes — queries fast karne ke liye
sensorDataSchema.index({ location: 1, metric: 1, createdAt: -1 });
sensorDataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 }); // 7 din baad auto-delete

module.exports = mongoose.model('SensorData', sensorDataSchema);
```

> **Tip:** TTL index lagaya — 7 din purana IoT data automatically delete ho jaayega. Ye sensor data ke liye bahut zaroori hai warna database bahut bada ho jaayega.

---

## Step 2: MQTT Service

```javascript
// services/mqttService.js — MQTT se data receive karo
const mqtt = require('mqtt');
const SensorData = require('../models/SensorData');
const { checkAlerts } = require('./alertService');

let ioInstance = null; // Socket.IO reference

function setIO(io) {
  ioInstance = io;
}

function startMQTT() {
  const client = mqtt.connect('mqtt://test.mosquitto.org', {
    clientId: `dashboard-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000
  });

  client.on('connect', () => {
    console.log('MQTT connected to broker');
    // Saare sensor topics subscribe karo
    client.subscribe('smartfarm/#', { qos: 1 });
  });

  client.on('message', async (topic, message) => {
    try {
      const parts = topic.split('/');
      if (parts.length < 4) return;

      const payload = JSON.parse(message.toString());
      const location = parts[1];
      const device = parts[2];
      const metric = parts[3];
      const value = parseFloat(payload.value);

      // Alert check karo
      const alert = checkAlerts(metric, value);

      // MongoDB mein save karo
      const reading = await SensorData.create({
        location, device, metric, value,
        unit: payload.unit || '',
        isAlert: alert.isAlert,
        alertType: alert.type
      });

      // WebSocket se browser ko real-time push karo
      if (ioInstance) {
        // Latest reading sabko bhejo
        ioInstance.emit('sensor-update', {
          location, device, metric, value,
          unit: payload.unit || '',
          timestamp: reading.createdAt
        });

        // Agar alert hai toh alag event bhejo
        if (alert.isAlert) {
          ioInstance.emit('alert', {
            location, device, metric, value,
            alertType: alert.type,
            message: alert.message,
            timestamp: reading.createdAt
          });
        }
      }
    } catch (err) {
      console.error('MQTT message error:', err.message);
    }
  });

  client.on('error', (err) => console.error('MQTT error:', err.message));
  client.on('reconnect', () => console.log('MQTT reconnecting...'));

  return client;
}

module.exports = { startMQTT, setIO };
```

---

## Step 3: Alert Service

```javascript
// services/alertService.js — Alert logic
// Thresholds define karo — kab alert dena hai
const THRESHOLDS = {
  temperature: { min: 10, max: 40, unit: 'C' },
  humidity: { min: 30, max: 85, unit: '%' },
  'soil-moisture': { min: 25, max: 80, unit: '%' },
  'co2-level': { min: 200, max: 1000, unit: 'ppm' }
};

function checkAlerts(metric, value) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return { isAlert: false };

  if (value > threshold.max) {
    return {
      isAlert: true,
      type: 'HIGH',
      message: `${metric} bahut zyada hai: ${value}${threshold.unit} (max: ${threshold.max}${threshold.unit})`
    };
  }

  if (value < threshold.min) {
    return {
      isAlert: true,
      type: 'LOW',
      message: `${metric} bahut kam hai: ${value}${threshold.unit} (min: ${threshold.min}${threshold.unit})`
    };
  }

  return { isAlert: false };
}

module.exports = { checkAlerts, THRESHOLDS };
```

> **Example:** Temperature 45C aaye toh alert: "temperature bahut zyada hai: 45C (max: 40C)". Soil moisture 15% aaye toh alert: "soil-moisture bahut kam hai: 15% (min: 25%)".

---

## Step 4: REST API Routes

```javascript
// routes/api.js — REST API endpoints
const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');

// GET /api/dashboard — Latest reading per sensor
router.get('/dashboard', async (req, res) => {
  const latest = await SensorData.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { location: '$location', device: '$device', metric: '$metric' },
        value: { $first: '$value' },
        unit: { $first: '$unit' },
        isAlert: { $first: '$isAlert' },
        updatedAt: { $first: '$createdAt' }
      }
    },
    { $sort: { '_id.location': 1, '_id.metric': 1 } }
  ]);
  res.json({ success: true, data: latest });
});

// GET /api/history/:location/:metric?hours=6
router.get('/history/:location/:metric', async (req, res) => {
  const { location, metric } = req.params;
  const hours = parseInt(req.query.hours) || 24;
  const since = new Date(Date.now() - hours * 3600000);

  const data = await SensorData.find({
    location, metric, createdAt: { $gte: since }
  }).sort({ createdAt: 1 }).select('value unit createdAt -_id').lean();

  res.json({ success: true, location, metric, period: `${hours}h`, data });
});

// GET /api/stats/:location/:metric
router.get('/stats/:location/:metric', async (req, res) => {
  const { location, metric } = req.params;
  const hours = parseInt(req.query.hours) || 24;
  const since = new Date(Date.now() - hours * 3600000);

  const stats = await SensorData.aggregate([
    { $match: { location, metric, createdAt: { $gte: since } } },
    {
      $group: {
        _id: null,
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
        latest: { $last: '$value' }
      }
    },
    { $project: { _id: 0, avg: { $round: ['$avg', 1] }, min: 1, max: 1, count: 1, latest: 1 } }
  ]);
  res.json({ success: true, location, metric, stats: stats[0] || {} });
});

// GET /api/alerts — Recent alerts
router.get('/alerts', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const alerts = await SensorData.find({ isAlert: true })
    .sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ success: true, data: alerts });
});

module.exports = router;
```

---

## Step 5: Main Server (Sab Jodo)

```javascript
// server.js — Express + Socket.IO + MQTT sab connect karo
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { startMQTT, setIO } = require('./services/mqttService');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(require('cors')());
app.use(express.json());
app.use(express.static('public'));

// REST API
app.use('/api', apiRoutes);

// WebSocket — client connect hone pe
io.on('connection', (socket) => {
  console.log('Dashboard connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Dashboard disconnected:', socket.id);
  });
});

// Sab start karo
const PORT = 3000;

async function startServer() {
  // 1. Database connect
  await connectDB();

  // 2. Socket.IO reference set karo MQTT service mein
  setIO(io);

  // 3. MQTT subscriber start karo
  startMQTT();

  // 4. HTTP server start karo
  server.listen(PORT, () => {
    console.log(`IoT Dashboard: http://localhost:${PORT}`);
    console.log('API Endpoints:');
    console.log('  GET /api/dashboard   — Latest readings');
    console.log('  GET /api/history/:location/:metric');
    console.log('  GET /api/stats/:location/:metric');
    console.log('  GET /api/alerts      — Recent alerts');
  });
}

startServer().catch(console.error);
```

---

## Step 6: Dashboard UI

```html
<!-- public/index.html — Real-time Dashboard -->
<!DOCTYPE html>
<html>
<head>
  <title>IoT Sensor Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial; background: #1a1a2e; color: #eee; padding: 20px; }
    h1 { text-align: center; margin-bottom: 20px; color: #4ecca3; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
    .card { background: #16213e; padding: 15px; border-radius: 10px; border-left: 4px solid #4ecca3; }
    .card.alert { border-left-color: #e74c3c; animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
    .card h3 { font-size: 14px; color: #888; margin-bottom: 5px; }
    .card .value { font-size: 32px; font-weight: bold; color: #4ecca3; }
    .card .value.danger { color: #e74c3c; }
    .card .meta { font-size: 11px; color: #555; margin-top: 5px; }
    #alerts { max-height: 200px; overflow-y: auto; background: #16213e; padding: 10px; border-radius: 10px; margin-top: 20px; }
    .alert-item { padding: 5px 10px; margin: 3px 0; background: #2d142c; border-left: 3px solid #e74c3c; border-radius: 3px; font-size: 13px; }
    #status { text-align: center; margin-bottom: 15px; font-size: 13px; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
    .dot.green { background: #4ecca3; } .dot.red { background: #e74c3c; }
  </style>
</head>
<body>
  <h1>IoT Sensor Dashboard</h1>
  <p id="status"><span class="dot green"></span> Connecting...</p>
  <div class="grid" id="sensorGrid"></div>
  <h2 style="margin-top:20px; color:#e74c3c;">Recent Alerts</h2>
  <div id="alerts"><p style="color:#555;">Koi alert nahi abhi...</p></div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const sensorGrid = document.getElementById('sensorGrid');
    const alertsEl = document.getElementById('alerts');
    const statusEl = document.getElementById('status');
    const cards = {}; // Track sensor cards

    socket.on('connect', () => {
      statusEl.innerHTML = '<span class="dot green"></span> Connected — Live data aa raha hai';
      // Initial data load karo REST API se
      fetch('/api/dashboard').then(r => r.json()).then(d => {
        d.data.forEach(item => updateCard(
          item._id.location, item._id.device, item._id.metric,
          item.value, item.unit, item.updatedAt, item.isAlert
        ));
      });
    });

    socket.on('disconnect', () => {
      statusEl.innerHTML = '<span class="dot red"></span> Disconnected!';
    });

    // Real-time sensor update
    socket.on('sensor-update', (data) => {
      updateCard(data.location, data.device, data.metric,
        data.value, data.unit, data.timestamp, false);
    });

    // Alert aaya!
    socket.on('alert', (data) => {
      // Card ko alert style do
      const key = `${data.location}-${data.device}-${data.metric}`;
      if (cards[key]) {
        cards[key].classList.add('alert');
        cards[key].querySelector('.value').classList.add('danger');
        setTimeout(() => {
          cards[key].classList.remove('alert');
          cards[key].querySelector('.value').classList.remove('danger');
        }, 5000);
      }

      // Alert list mein add karo
      const div = document.createElement('div');
      div.className = 'alert-item';
      const time = new Date(data.timestamp).toLocaleTimeString();
      div.textContent = `[${time}] ${data.message}`;
      alertsEl.prepend(div);

      // Zyada purane alerts hatao
      while (alertsEl.children.length > 20) alertsEl.removeChild(alertsEl.lastChild);
    });

    function updateCard(location, device, metric, value, unit, timestamp, isAlert) {
      const key = `${location}-${device}-${metric}`;
      let card = cards[key];

      if (!card) {
        card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <h3>${location} / ${device}</h3>
          <div class="metric">${metric}</div>
          <div class="value">--</div>
          <div class="meta">Loading...</div>`;
        sensorGrid.appendChild(card);
        cards[key] = card;
      }

      const v = parseFloat(value);
      card.querySelector('.value').textContent = `${v} ${unit}`;
      card.querySelector('.meta').textContent = `Updated: ${new Date(timestamp).toLocaleTimeString()}`;
    }
  </script>
</body>
</html>
```

---

## Step 7: Sensor Simulator

```javascript
// simulator.js — Fake sensors (same as Day 48, with alerts)
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org', {
  clientId: `sim-${Date.now()}`
});

const sensors = [
  { loc: 'field-north', dev: 'sensor-01', metrics: { temperature: [20,45,'C'], humidity: [35,90,'%'], 'soil-moisture': [15,75,'%'] }},
  { loc: 'field-south', dev: 'sensor-02', metrics: { temperature: [22,42,'C'], humidity: [40,85,'%'], 'soil-moisture': [20,70,'%'] }},
  { loc: 'greenhouse',  dev: 'sensor-03', metrics: { temperature: [25,50,'C'], humidity: [50,95,'%'], 'co2-level': [250,1200,'ppm'] }}
];

client.on('connect', () => {
  console.log('Simulator started! Publishing every 5 seconds...');
  setInterval(() => {
    sensors.forEach(s => {
      Object.entries(s.metrics).forEach(([metric, [min, max, unit]]) => {
        const value = (min + Math.random() * (max - min)).toFixed(1);
        const topic = `smartfarm/${s.loc}/${s.dev}/${metric}`;
        client.publish(topic, JSON.stringify({ value, unit, ts: new Date().toISOString() }), { qos: 1 });
      });
    });
    console.log(`[${new Date().toLocaleTimeString()}] Data published`);
  }, 5000);
});
```

---

## Run the Complete System

> **Terminal Command:**
> ```bash
> # Terminal 1: MongoDB
> mongod
>
> # Terminal 2: Main server
> node server.js
>
> # Terminal 3: Sensor simulator
> node simulator.js
>
> # Browser: http://localhost:3000
> ```

> **Expected Output:**
> ```
> Terminal 2:
>   MongoDB connected
>   MQTT connected to broker
>   IoT Dashboard: http://localhost:3000
>   Dashboard connected: abc123
>
> Browser:
>   Cards dikhenge har sensor ke liye
>   Values har 5 second update honge
>   Alerts red flash honge
> ```

---

## Quick Revision Table

| Component | Technology | Role |
|-----------|-----------|------|
| Sensors | MQTT Publisher | Data generate |
| Broker | Mosquitto/HiveMQ | Message routing |
| Backend (MQTT) | mqtt.js subscriber | Data receive |
| Backend (DB) | Mongoose | Data store |
| Backend (API) | Express REST | History serve |
| Backend (RT) | Socket.IO | Real-time push |
| Frontend | HTML + JS | Dashboard display |
| Alerts | Custom service | Threshold checks |

---

## Aaj Kya Seekha?

1. **Full-stack IoT project** — MQTT + MongoDB + WebSocket + REST API ek project mein
2. **Data flow** — Sensor → MQTT → Node.js → MongoDB + WebSocket → Browser
3. **Alert system** — threshold-based alerts with real-time notification
4. **TTL Index** — purana sensor data auto-delete hota hai
5. **Aggregation** — dashboard ke liye latest readings + stats
6. **Architecture** — services pattern se code organized rakha (mqttService, alertService, routes)

> **Practice Time!** Is project ko extend karo: (1) Device status page banao — kaun online hai kaun offline. (2) CSV export feature add karo — selected time range ka data download. (3) Chart library (Chart.js) se line graph banao temperature trends ke liye. Week 8 complete!
