# Day 48 Evening: Practice — IoT Dashboard Backend

> **Aaj ka plan:** Aaj hum ek complete IoT dashboard backend banayenge — MQTT se sensor data receive karo, MongoDB mein store karo, REST API se history serve karo. Ek real-world IoT project!

---

## Project Overview

```
┌──────────┐    MQTT     ┌──────────────┐   MongoDB    ┌──────────┐
│ Sensors  │ ──────────→ │  Node.js     │ ──────────→ │ Database │
│ (Pub)    │             │  Backend     │              │          │
└──────────┘             │              │              └──────────┘
                         │  - MQTT Sub  │
┌──────────┐   REST API  │  - REST API  │
│ Frontend │ ←────────── │  - Express   │
│ Dashboard│             └──────────────┘
└──────────┘
```

---

## Project Setup

> **Terminal Command:**
> ```bash
> mkdir iot-dashboard && cd iot-dashboard
> npm init -y
> npm install express mongoose mqtt cors
> ```

### Folder Structure

```
iot-dashboard/
├── server.js              # Main server (Express + MQTT)
├── models/
│   └── SensorReading.js   # Sensor data schema
├── routes/
│   └── sensorRoutes.js    # REST API routes
├── mqtt/
│   └── mqttClient.js      # MQTT subscriber
├── simulator.js           # Fake sensor data publisher
├── package.json
└── .env
```

---

## Step 1: Sensor Model

```javascript
// models/SensorReading.js — Sensor data ka schema
const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  // Sensor location aur device info
  location: {
    type: String,
    required: true,
    index: true      // Location pe fast search
  },
  device: {
    type: String,
    required: true,
    index: true      // Device pe fast search
  },
  metric: {
    type: String,
    required: true,  // temperature, humidity, soil-moisture
    index: true
  },

  // Actual reading
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: ''
  },

  // MQTT topic (debugging ke liye useful)
  topic: String,

  // Timestamps
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true      // Time-based queries ke liye
  }
});

// Compound index — location + metric + time queries fast honge
sensorReadingSchema.index({ location: 1, metric: 1, receivedAt: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
```

> **Tip:** IoT data mein time-based queries bahut hoti hain — "last 1 hour ka data do", "aaj ka average do". Isliye `receivedAt` pe index zaroor lagao.

---

## Step 2: MQTT Client

```javascript
// mqtt/mqttClient.js — MQTT se sensor data receive karo
const mqtt = require('mqtt');
const SensorReading = require('../models/SensorReading');

// MQTT broker se connect karo
const BROKER_URL = 'mqtt://test.mosquitto.org';

function startMQTTClient() {
  const client = mqtt.connect(BROKER_URL, {
    clientId: 'iot-dashboard-' + Math.random().toString(16).slice(2, 8),
    clean: true,
    reconnectPeriod: 5000 // 5 sec mein reconnect
  });

  client.on('connect', () => {
    console.log('MQTT Broker se connected!');

    // Smart farm ke saare sensor data subscribe karo
    client.subscribe('smartfarm/#', { qos: 1 }, (err) => {
      if (err) console.error('Subscribe error:', err);
      else console.log('Subscribed to smartfarm/#');
    });
  });

  // Message receive hone pe MongoDB mein save karo
  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const parts = topic.split('/');
      // Topic format: smartfarm/{location}/{device}/{metric}

      if (parts.length < 4) return; // Invalid topic ignore

      const location = parts[1]; // field-north
      const device = parts[2];   // sensor-01
      const metric = parts[3];   // temperature

      // MongoDB mein save karo
      const reading = await SensorReading.create({
        location,
        device,
        metric,
        value: parseFloat(payload.value),
        unit: payload.unit || '',
        topic: topic,
        receivedAt: payload.ts ? new Date(payload.ts) : new Date()
      });

      console.log(`Saved: [${location}/${device}] ${metric}=${payload.value}`);

      // Alert check — temperature 40 se zyada ho toh warn karo
      if (metric === 'temperature' && payload.value > 40) {
        console.log(`ALERT: High temperature at ${location}/${device}: ${payload.value}°C`);
        // Yahan notification bhej sakte ho
      }

      // Moisture 25 se kam ho toh pump suggest karo
      if (metric === 'soil-moisture' && payload.value < 25) {
        console.log(`ALERT: Low moisture at ${location}/${device}: ${payload.value}%`);
      }

    } catch (err) {
      // JSON parse error ya DB error
      console.error('Message processing error:', err.message);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT error:', err.message);
  });

  client.on('reconnect', () => {
    console.log('MQTT reconnecting...');
  });

  return client; // Client return karo taaki baad mein use kar sakein
}

module.exports = { startMQTTClient };
```

> **Yaad Rakho:** MQTT messages bahut fast aate hain — har message pe MongoDB write hota hai. Production mein batching use karo (kuch messages ikkattha karke ek saath save karo) performance ke liye.

---

## Step 3: REST API Routes

```javascript
// routes/sensorRoutes.js — REST API for sensor data
const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');

// GET /api/sensors/latest — Sabse recent readings
router.get('/latest', async (req, res) => {
  try {
    // Har location/device/metric ka latest reading
    const latest = await SensorReading.aggregate([
      { $sort: { receivedAt: -1 } },
      {
        $group: {
          _id: { location: '$location', device: '$device', metric: '$metric' },
          value: { $first: '$value' },
          unit: { $first: '$unit' },
          receivedAt: { $first: '$receivedAt' }
        }
      },
      { $sort: { '_id.location': 1, '_id.device': 1 } }
    ]);

    res.json({ success: true, count: latest.length, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sensors/history/:location/:metric — Time-based history
router.get('/history/:location/:metric', async (req, res) => {
  try {
    const { location, metric } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    // Last X hours ka data
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await SensorReading.find({
      location,
      metric,
      receivedAt: { $gte: since }
    })
      .sort({ receivedAt: -1 })
      .limit(parseInt(limit))
      .select('value unit device receivedAt -_id')
      .lean();

    res.json({
      success: true,
      location,
      metric,
      period: `Last ${hours} hours`,
      count: readings.length,
      data: readings
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sensors/stats/:location/:metric — Average, min, max
router.get('/stats/:location/:metric', async (req, res) => {
  try {
    const { location, metric } = req.params;
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await SensorReading.aggregate([
      {
        $match: {
          location,
          metric,
          receivedAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          count: { $sum: 1 },
          lastReading: { $last: '$value' }
        }
      }
    ]);

    res.json({
      success: true,
      location,
      metric,
      period: `Last ${hours} hours`,
      stats: stats[0] || { avgValue: 0, minValue: 0, maxValue: 0, count: 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sensors/locations — Saari unique locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await SensorReading.distinct('location');
    res.json({ success: true, locations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```

> **Example:** API call examples:
> - `GET /api/sensors/latest` — sab sensors ki latest reading
> - `GET /api/sensors/history/field-north/temperature?hours=6` — last 6 hours
> - `GET /api/sensors/stats/field-north/temperature` — avg, min, max

---

## Step 4: Main Server

```javascript
// server.js — Express + MQTT saath mein
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startMQTTClient } = require('./mqtt/mqttClient');
const sensorRoutes = require('./routes/sensorRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// REST API routes
app.use('/api/sensors', sensorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mqtt: 'connected', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// MongoDB connect + Server start
const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/iot-dashboard')
  .then(() => {
    console.log('MongoDB connected');

    // MQTT client start karo
    startMQTTClient();

    // Express server start karo
    app.listen(PORT, () => {
      console.log(`IoT Dashboard API: http://localhost:${PORT}`);
      console.log('Endpoints:');
      console.log('  GET /api/sensors/latest');
      console.log('  GET /api/sensors/history/:location/:metric');
      console.log('  GET /api/sensors/stats/:location/:metric');
      console.log('  GET /api/sensors/locations');
    });
  })
  .catch(err => console.error('MongoDB error:', err));
```

---

## Step 5: Sensor Simulator

```javascript
// simulator.js — Fake sensor data generate karo
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://test.mosquitto.org', {
  clientId: 'sensor-simulator-' + Date.now()
});

// Sensors define karo
const sensors = [
  { location: 'field-north', device: 'sensor-01', metrics: ['temperature', 'humidity', 'soil-moisture'] },
  { location: 'field-south', device: 'sensor-02', metrics: ['temperature', 'humidity', 'soil-moisture'] },
  { location: 'greenhouse', device: 'sensor-03', metrics: ['temperature', 'humidity', 'co2-level'] }
];

// Random value generators
const generators = {
  'temperature': () => ({ value: (25 + Math.random() * 15).toFixed(1), unit: 'C' }),
  'humidity': () => ({ value: (40 + Math.random() * 40).toFixed(1), unit: '%' }),
  'soil-moisture': () => ({ value: (20 + Math.random() * 50).toFixed(1), unit: '%' }),
  'co2-level': () => ({ value: (300 + Math.random() * 200).toFixed(0), unit: 'ppm' })
};

client.on('connect', () => {
  console.log('Sensor simulator connected! Publishing every 5 seconds...');

  setInterval(() => {
    sensors.forEach(sensor => {
      sensor.metrics.forEach(metric => {
        const data = generators[metric]();
        const topic = `smartfarm/${sensor.location}/${sensor.device}/${metric}`;

        client.publish(topic, JSON.stringify({
          ...data,
          ts: new Date().toISOString()
        }), { qos: 1 });
      });
    });

    console.log(`[${new Date().toLocaleTimeString()}] Data published for ${sensors.length} sensors`);
  }, 5000);
});
```

---

## Step 6: Run Aur Test Karo

> **Terminal Command:**
> ```bash
> # Terminal 1: MongoDB start karo
> mongod
>
> # Terminal 2: Server start karo
> node server.js
>
> # Terminal 3: Simulator start karo
> node simulator.js
> ```

### API Test Karo

> **Terminal Command:**
> ```bash
> # Thodi der baad data aane do, phir test karo:
>
> # Latest readings
> curl http://localhost:3000/api/sensors/latest
>
> # Field-north temperature history (last 1 hour)
> curl "http://localhost:3000/api/sensors/history/field-north/temperature?hours=1"
>
> # Stats
> curl "http://localhost:3000/api/sensors/stats/field-north/temperature?hours=1"
>
> # Saari locations
> curl http://localhost:3000/api/sensors/locations
> ```

> **Expected Output (latest):**
> ```json
> {
>   "success": true,
>   "count": 9,
>   "data": [
>     {
>       "_id": { "location": "field-north", "device": "sensor-01", "metric": "temperature" },
>       "value": 35.2,
>       "unit": "C",
>       "receivedAt": "2026-04-04T10:30:00.000Z"
>     }
>   ]
> }
> ```

---

## Quick Revision Table

| Component | File | Role |
|-----------|------|------|
| Sensor Model | `models/SensorReading.js` | Data schema + indexes |
| MQTT Client | `mqtt/mqttClient.js` | Subscribe + save to DB |
| REST Routes | `routes/sensorRoutes.js` | API for dashboard |
| Main Server | `server.js` | Express + MongoDB + MQTT start |
| Simulator | `simulator.js` | Fake sensor data publisher |

---

## Aaj Kya Seekha?

1. **MQTT + MongoDB** — sensor data receive karke database mein store kiya
2. **REST API** — latest, history, stats endpoints banaye dashboard ke liye
3. **Aggregation** — latest reading per sensor, average/min/max stats nikale
4. **Sensor simulator** — fake data generator banaya testing ke liye
5. **Architecture** — MQTT (receive) + MongoDB (store) + Express (serve) ka combination
6. **Indexing** — time-based aur location-based queries ke liye indexes lagaye

> **Practice Time!** (1) WebSocket add karo — jab naya MQTT data aaye toh browser ko real-time push karo. (2) Alert API banao — "sab alerts list karo jahan temperature > 40". Kal aggregation pipeline deep dive karenge!
