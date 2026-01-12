# Day 48 Morning: MQTT with Node.js + QoS + Topics

> **Aaj ka plan:** Aaj hum Node.js mein MQTT use karenge — mqtt.js package se broker se connect, publish, subscribe karenge. Topic wildcards practically use karenge, QoS samjhenge, aur MQTT vs WebSocket compare karenge.

---

## mqtt.js Package

### Installation

> **Terminal Command:**
> ```bash
> mkdir mqtt-nodejs && cd mqtt-nodejs
> npm init -y
> npm install mqtt
> ```

`mqtt.js` Node.js ka sabse popular MQTT client library hai. Browser mein bhi chal sakta hai (WebSocket over MQTT).

---

## Broker Se Connect Karo

### Basic Connection

```javascript
// connect.js — Broker se connect karo
const mqtt = require('mqtt');

// Public test broker se connect
const client = mqtt.connect('mqtt://test.mosquitto.org', {
  clientId: 'node-client-' + Math.random().toString(16).slice(2, 8),
  clean: true,          // Clean session — purani subscriptions mat rakho
  connectTimeout: 4000, // 4 second mein connect nahi hua toh error
  reconnectPeriod: 1000 // 1 second baad reconnect try karo
});

// Connected!
client.on('connect', () => {
  console.log('Broker se connected!');
});

// Error handle karo
client.on('error', (err) => {
  console.error('Connection error:', err.message);
});

// Reconnect
client.on('reconnect', () => {
  console.log('Reconnecting...');
});

// Connection close
client.on('close', () => {
  console.log('Connection band ho gayi');
});
```

> **Yaad Rakho:** `clientId` unique hona chahiye. Agar do clients same clientId se connect karein toh pehla wala disconnect ho jaayega — broker ek clientId ke liye sirf ek connection allow karta hai.

### Connection Options Detail

```javascript
const options = {
  clientId: 'kisan-dashboard-001',  // Unique ID
  clean: true,                       // true = session clear, false = resume
  connectTimeout: 4000,              // Timeout in ms
  reconnectPeriod: 1000,             // Auto reconnect interval
  username: 'myuser',                // Auth (agar broker mein setup hai)
  password: 'mypassword',            // Auth password
  will: {                            // Last Will Testament
    topic: 'devices/dashboard-001/status',
    payload: JSON.stringify({ status: 'offline' }),
    qos: 1,
    retain: true
  }
};

const client = mqtt.connect('mqtt://broker-address:1883', options);
```

> **Tip:** `clean: false` rakhne se broker tumhari subscriptions yaad rakhega — agar disconnect hoke wapas aao toh phir se subscribe nahi karna padega, aur beech ke missed messages bhi mil sakte hain (QoS 1/2 ke saath).

---

## Publish — Message Bhejo

### Basic Publish

```javascript
// publish.js — Messages publish karo
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');

client.on('connect', () => {
  console.log('Connected! Publishing messages...');

  // Simple string message
  client.publish('smartfarm/field1/temperature', '35.5');

  // JSON message — IoT mein ye zyada common hai
  const sensorData = {
    value: 35.5,
    unit: 'celsius',
    sensor: 'DHT22',
    timestamp: new Date().toISOString()
  };
  client.publish(
    'smartfarm/field1/temperature',
    JSON.stringify(sensorData)  // JSON ko string mein convert karo
  );

  // QoS ke saath publish
  client.publish(
    'smartfarm/alerts/critical',
    JSON.stringify({ alert: 'Temperature too high!', value: 45 }),
    { qos: 1 }  // At least once delivery
  );

  // Retained message — naye subscribers ko turant mile
  client.publish(
    'smartfarm/field1/status',
    JSON.stringify({ status: 'active', lastSeen: new Date() }),
    { qos: 1, retain: true }  // Retained + QoS 1
  );
});
```

### Periodic Publishing (Sensor Simulation)

```javascript
// sensor-simulator.js — Har 5 second mein data bhejo
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');

client.on('connect', () => {
  console.log('Sensor simulator started!');

  // Har 5 second mein sensor data publish karo
  setInterval(() => {
    // Random sensor values generate karo
    const data = {
      temperature: (25 + Math.random() * 15).toFixed(1),  // 25-40°C
      humidity: (40 + Math.random() * 40).toFixed(1),      // 40-80%
      soilMoisture: (20 + Math.random() * 50).toFixed(1),  // 20-70%
      timestamp: new Date().toISOString()
    };

    // Alag-alag topics pe publish karo
    const baseTopic = 'smartfarm/field-north/sensor-01';

    client.publish(`${baseTopic}/temperature`,
      JSON.stringify({ value: data.temperature, unit: 'C' }));

    client.publish(`${baseTopic}/humidity`,
      JSON.stringify({ value: data.humidity, unit: '%' }));

    client.publish(`${baseTopic}/soil-moisture`,
      JSON.stringify({ value: data.soilMoisture, unit: '%' }));

    console.log(`Published: temp=${data.temperature}°C, ` +
      `humid=${data.humidity}%, moisture=${data.soilMoisture}%`);
  }, 5000);
});
```

> **Terminal Command:**
> ```bash
> node sensor-simulator.js
> ```

---

## Subscribe — Messages Suno

### Basic Subscribe

```javascript
// subscriber.js — Messages receive karo
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');

client.on('connect', () => {
  console.log('Connected! Subscribing...');

  // Ek topic subscribe karo
  client.subscribe('smartfarm/field-north/sensor-01/temperature', (err) => {
    if (err) console.error('Subscribe failed:', err);
    else console.log('Subscribed to temperature!');
  });

  // Multiple topics ek saath subscribe karo
  client.subscribe([
    'smartfarm/field-north/sensor-01/humidity',
    'smartfarm/field-north/sensor-01/soil-moisture'
  ], { qos: 1 }, (err) => {
    if (err) console.error('Subscribe failed:', err);
    else console.log('Subscribed to humidity & moisture!');
  });
});

// Message receive karo
client.on('message', (topic, message) => {
  // message Buffer hota hai — string mein convert karo
  const payload = message.toString();

  try {
    const data = JSON.parse(payload); // JSON parse karo
    console.log(`Topic: ${topic}`);
    console.log(`Data:`, data);
    console.log('---');
  } catch (e) {
    // Agar JSON nahi hai toh plain string
    console.log(`Topic: ${topic}, Message: ${payload}`);
  }
});
```

> **Yaad Rakho:** `message` event mein jo `message` parameter aata hai wo **Buffer** hota hai, string nahi. Hamesha `message.toString()` karo pehle.

---

## Topic Wildcards in Node.js

### Wildcard Subscriptions

```javascript
// wildcard-subscriber.js — Wildcards use karo
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');

client.on('connect', () => {
  // + wildcard — kisi bhi sensor ka temperature
  client.subscribe('smartfarm/+/+/temperature', (err) => {
    if (!err) console.log('Subscribed: all temperature readings');
  });

  // # wildcard — field-north ke neeche sab kuch
  client.subscribe('smartfarm/field-north/#', (err) => {
    if (!err) console.log('Subscribed: everything in field-north');
  });

  // Alerts suno
  client.subscribe('smartfarm/alerts/#', (err) => {
    if (!err) console.log('Subscribed: all alerts');
  });
});

client.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString());

  // Topic parse karke samjho kya data aaya
  const parts = topic.split('/');
  // parts = ['smartfarm', 'field-north', 'sensor-01', 'temperature']

  const location = parts[1];  // field-north
  const device = parts[2];    // sensor-01
  const metric = parts[3];    // temperature

  console.log(`[${location}/${device}] ${metric}: ${payload.value}${payload.unit || ''}`);

  // Alert check karo
  if (parts[1] === 'alerts') {
    console.log('ALERT:', payload);
    // Yahan notification bhej sakte ho
  }
});
```

> **Socho Aise:** Topic ko `/` se split karke tum data categorize kar sakte ho. Ye pattern IoT backend mein bahut use hota hai — topic se pata chalta hai data kahan se aaya.

---

## QoS in Practice

### QoS Levels Side by Side

```javascript
// qos-demo.js — QoS levels ka practical difference
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');

client.on('connect', () => {
  // QoS 0 — Temperature (ek miss ho toh koi baat nahi)
  client.publish(
    'demo/qos0',
    JSON.stringify({ temp: 35, qos: 0 }),
    { qos: 0 }  // Fire and forget
  );

  // QoS 1 — Alert (zaroor pahunchna chahiye)
  client.publish(
    'demo/qos1',
    JSON.stringify({ alert: 'High temp!', qos: 1 }),
    { qos: 1 },  // At least once
    (err) => {
      // Callback — broker ne acknowledge kiya
      if (!err) console.log('QoS 1 message delivered & acknowledged!');
    }
  );

  // QoS 2 — Critical command (ek baar hi hona chahiye)
  client.publish(
    'demo/qos2',
    JSON.stringify({ command: 'shutdown-pump', qos: 2 }),
    { qos: 2 },  // Exactly once
    (err) => {
      if (!err) console.log('QoS 2 message delivered exactly once!');
    }
  );
});
```

### QoS Subscribe Side

```javascript
// Subscriber ka QoS bhi matter karta hai
client.subscribe('demo/qos1', { qos: 1 }, (err, granted) => {
  // granted array batata hai actual granted QoS
  console.log('Granted QoS:', granted[0].qos);
  // Agar broker QoS 1 support karta hai toh 1 milega
  // Warna downgrade ho sakta hai
});
```

> **Warning:** Final QoS = min(publisher QoS, subscriber QoS). Agar publisher QoS 2 pe bheje lekin subscriber QoS 0 pe sun raha hai, toh effective QoS 0 hoga!

---

## MQTT vs WebSocket Comparison

### Kab Kya Use Karein?

| Feature | MQTT | WebSocket |
|---------|------|-----------|
| **Purpose** | IoT device communication | Browser real-time |
| **Pattern** | Pub/Sub (topic based) | Direct bidirectional |
| **Protocol** | MQTT over TCP (port 1883) | WS over HTTP (port 80/443) |
| **Client** | IoT devices, sensors | Browsers, web apps |
| **Message Size** | Ultra small (2 byte header) | Larger (frames) |
| **QoS** | Built-in (0, 1, 2) | No built-in QoS |
| **Offline** | Retained msgs, clean session | No offline support |
| **Broker** | Required (Mosquitto, etc.) | No broker needed |
| **Rooms** | Topics + wildcards | Socket.IO rooms |
| **Best For** | Sensors, IoT, M2M | Chat, dashboards, gaming |

### Can They Work Together?

```
IoT Sensor ──MQTT──→ Broker ──→ Node.js Backend ──WebSocket──→ Browser Dashboard
                                     │
                                     ↓
                                  MongoDB
                                 (History)
```

> **Yaad Rakho:** MQTT aur WebSocket competitors nahi hain — dono saath kaam kar sakte hain! Sensors MQTT se data bhejein, backend receive kare, MongoDB mein save kare, aur WebSocket se browser dashboard ko real-time push kare.

---

## Handling Messages — Best Practices

```javascript
// message-handler.js — Production-ready message handling
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');

// Topic handlers ka registry
const handlers = {
  'temperature': (location, device, data) => {
    console.log(`[TEMP] ${location}/${device}: ${data.value}°C`);
    if (data.value > 40) {
      console.log('HIGH TEMP ALERT!');
      // Alert bhejo ya pump on karo
    }
  },
  'humidity': (location, device, data) => {
    console.log(`[HUMID] ${location}/${device}: ${data.value}%`);
  },
  'soil-moisture': (location, device, data) => {
    console.log(`[MOISTURE] ${location}/${device}: ${data.value}%`);
    if (data.value < 30) {
      console.log('LOW MOISTURE — Irrigation needed!');
      // Pump command publish karo
      client.publish(`smartfarm/${location}/pump-01/command`,
        JSON.stringify({ action: 'on', duration: 15 }));
    }
  }
};

client.on('message', (topic, message) => {
  try {
    const parts = topic.split('/');
    const location = parts[1];
    const device = parts[2];
    const metric = parts[3];
    const data = JSON.parse(message.toString());

    // Correct handler call karo
    if (handlers[metric]) {
      handlers[metric](location, device, data);
    } else {
      console.log(`Unknown metric: ${metric}`, data);
    }
  } catch (err) {
    console.error('Message processing error:', err.message);
  }
});
```

> **Tip:** Topic-based routing pattern use karo — har topic type ke liye alag handler function. Ye code clean aur maintainable rakhta hai. Ek bade `if-else` chain se bahut better hai.

---

## Quick Revision Table

| Concept | Code | Key Point |
|---------|------|-----------|
| Connect | `mqtt.connect('mqtt://host')` | clientId unique rakhna |
| Publish | `client.publish(topic, msg, opts)` | msg string hona chahiye |
| Subscribe | `client.subscribe(topic, opts)` | Array bhi de sakte ho |
| Message | `client.on('message', cb)` | message Buffer hai, toString karo |
| QoS | `{ qos: 1 }` | 0=fast, 1=reliable, 2=guaranteed |
| Retain | `{ retain: true }` | Naye subscriber ko turant mile |
| Wildcard | `+` single, `#` multi | Subscribe mein use karo |
| LWT | `will: { topic, payload }` | Connect options mein set karo |

---

## Aaj Kya Seekha?

1. **mqtt.js** — Node.js mein MQTT client kaise use karte hain
2. **Connect** — broker se connect with options (clientId, clean, LWT)
3. **Publish** — topics pe messages bhejne ke tarike (QoS, retain)
4. **Subscribe** — wildcards se multiple topics ek saath suno
5. **Message handling** — topic-based routing pattern
6. **QoS practical** — kab 0, kab 1, kab 2 use karna hai
7. **MQTT vs WebSocket** — dono ka role alag hai, saath kaam kar sakte hain

> **Practice Time!** Evening mein hum complete IoT dashboard backend banayenge — MQTT se sensor data receive karo, MongoDB mein store karo, REST API se history serve karo. Full project!
