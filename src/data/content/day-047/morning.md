# Day 47 Morning: MQTT Introduction + IoT Basics

> **Aaj ka plan:** Aaj hum MQTT protocol seekhenge — IoT ki duniya ka sabse popular messaging protocol. Publish/Subscribe pattern, broker, topics, QoS levels, retained messages, last will, aur real IoT use cases (smart farming, sensors) sab cover karenge.

---

## MQTT Kya Hai?

### Message Queuing Telemetry Transport

MQTT ek lightweight messaging protocol hai jo specially **IoT (Internet of Things)** devices ke liye design kiya gaya hai. Jahan bandwidth kam ho, network unreliable ho, device ki battery bachani ho — wahan MQTT best hai.

> **Socho Aise:** Socho tumhare khet mein 50 sensors lagaye hain — temperature, humidity, soil moisture. Ye chhote devices hain, battery pe chalte hain, internet bhi weak hai. HTTP se har baar bada request bhejein? Battery khatam ho jaayegi! MQTT lightweight hai — chhota message bhejo, kam battery use ho.

### MQTT vs HTTP

| Feature | HTTP | MQTT |
|---------|------|------|
| Pattern | Request-Response | Publish-Subscribe |
| Weight | Heavy (headers, methods) | Ultra lightweight |
| Connection | Har baar naya ya keep-alive | Persistent connection |
| Direction | Client asks, server responds | Dono taraf messages |
| Battery | Zyada use | Bahut kam use |
| Best For | Web APIs, browsers | IoT, sensors, embedded devices |
| Protocol | TCP port 80/443 | TCP port 1883/8883 |

> **Yaad Rakho:** MQTT ka header sirf 2 bytes ka hota hai! HTTP mein headers alone 200-800 bytes hote hain. IoT devices ke liye ye bahut bada difference hai.

---

## Publish/Subscribe Pattern

### Kaise Kaam Karta Hai?

MQTT mein koi direct connection nahi hota sender aur receiver ke beech. Sab kuch ek **Broker** ke through hota hai.

```
                    ┌──────────┐
Publisher ──────→   │  BROKER  │  ──────→ Subscriber 1
(Sensor)            │ (Server) │  ──────→ Subscriber 2
                    └──────────┘  ──────→ Subscriber 3
```

**3 Main Components:**

1. **Publisher** — jo message bhejta hai (e.g., sensor)
2. **Subscriber** — jo message sunta hai (e.g., dashboard)
3. **Broker** — beech mein baithke messages route karta hai

> **Socho Aise:** Broker = Radio Station. Publisher = RJ jo gaana bajata hai. Subscriber = Listener jo radio sun raha hai. RJ ko nahi pata kaun sun raha hai, listener ko nahi pata RJ kahan hai — dono sirf radio station (broker) se connected hain.

### Why Pub/Sub is Powerful

```
Traditional (Direct):
Device 1 ──→ Server
Device 2 ──→ Server
Device 3 ──→ Server
(Har device ko server ka address chahiye)

MQTT (Pub/Sub):
Device 1 ──→ Broker ──→ Dashboard
Device 2 ──→ Broker ──→ Mobile App
Device 3 ──→ Broker ──→ Alert System
(Devices ko pata nahi kaun sun raha hai — decoupled!)
```

> **Tip:** Pub/Sub pattern mein publisher aur subscriber ek doosre se completely independent hain. Publisher ko pata hi nahi kitne subscribers hain. Ye "decoupling" production mein bahut kaam aata hai.

---

## MQTT Broker

### Popular Brokers

| Broker | Type | Use Case |
|--------|------|----------|
| **Mosquitto** | Open-source, self-hosted | Learning, small projects |
| **HiveMQ** | Cloud + self-hosted | Production, enterprise |
| **EMQX** | Open-source, scalable | Large-scale IoT |
| **AWS IoT Core** | Cloud managed | AWS ecosystem |
| **test.mosquitto.org** | Free public broker | Testing aur learning |

> **Terminal Command:**
> ```bash
> # Mosquitto install karo (Windows)
> # Download: https://mosquitto.org/download/
> # Ya chocolatey se:
> choco install mosquitto
>
> # Ubuntu/WSL pe:
> sudo apt install mosquitto mosquitto-clients
>
> # Verify karo:
> mosquitto -v
> ```

> **Yaad Rakho:** Development ke liye `test.mosquitto.org` free public broker use kar sakte ho — koi install nahi chahiye. Production ke liye apna broker lagao.

---

## Topics — Messages Ka Address

### Topic Structure

MQTT mein messages **topics** pe publish hote hain. Topics ek hierarchy hain `/` se separated.

```
farm/field1/temperature       ← Field 1 ka temperature
farm/field1/humidity          ← Field 1 ki humidity
farm/field2/temperature       ← Field 2 ka temperature
farm/warehouse/door-status    ← Warehouse ka darwaza khula ya band
home/livingroom/light         ← Ghar ka living room light
home/kitchen/temperature      ← Kitchen ka temperature
```

### Topic Design Best Practices

```
Pattern: {project}/{location}/{device}/{measurement}

Examples:
smartfarm/field-north/sensor-01/temperature
smartfarm/field-north/sensor-01/moisture
smartfarm/field-south/pump-01/status
smartfarm/greenhouse/fan-01/speed
```

> **Socho Aise:** Topics = postal address system. Jaise "India/UP/Lucknow/MG-Road/House-42" — har level specific hota jaata hai. MQTT mein bhi `/` se levels banate hain.

### Topic Wildcards

Subscribers wildcards use karke multiple topics sun sakte hain:

```
+ (Single Level Wildcard):
farm/+/temperature     ← farm ke KISI BHI field ka temperature
                         Matches: farm/field1/temperature
                                  farm/field2/temperature
                         NOT:     farm/field1/sub/temperature

# (Multi Level Wildcard):
farm/#                  ← farm ke NEECHE SAB KUCH
                         Matches: farm/field1/temperature
                                  farm/field2/humidity
                                  farm/warehouse/door-status

farm/field1/#           ← field1 ke neeche sab kuch
                         Matches: farm/field1/temperature
                                  farm/field1/humidity
                                  farm/field1/moisture
```

> **Warning:** `#` wildcard bahut powerful hai — agar `#` subscribe karo toh SAARI messages aayengi. Production mein carefully use karo, warna flood ho jaayega!

---

## QoS Levels (Quality of Service)

### Message Delivery Guarantee

MQTT mein 3 QoS levels hain — kitni guarantee chahiye ki message pahunche:

| QoS | Name | Guarantee | Use Case |
|-----|------|-----------|----------|
| **0** | At most once | Fire and forget — shayad na pahunche | Temperature readings (ek miss ho toh theek) |
| **1** | At least once | Pakka pahunchega, par duplicate ho sakta | Alerts, important data |
| **2** | Exactly once | Ek baar pakka, na zyada na kam | Payment, critical commands |

```
QoS 0: Publisher ──message──→ Broker       (bas, koi confirm nahi)
QoS 1: Publisher ──message──→ Broker
        Publisher ←──PUBACK── Broker       (broker ne confirm kiya)
QoS 2: Publisher ──message──→ Broker
        Publisher ←──PUBREC── Broker       (received)
        Publisher ──PUBREL──→ Broker       (release)
        Publisher ←──PUBCOMP─ Broker       (complete — 4-step handshake)
```

> **Socho Aise:** QoS 0 = postcard daal diya, pahunche na pahunche. QoS 1 = registered post, receipt milti hai par galti se duplicate ho sakta. QoS 2 = court notice, proper delivery with full acknowledgment.

> **Tip:** IoT mein zyada tar QoS 0 ya 1 use hota hai. QoS 2 slow hai (4-step handshake) — sirf critical commands ke liye use karo.

---

## Retained Messages

### Last Known Value

Retained message broker pe save rehta hai. Jab naya subscriber connect kare, usse turant last value mil jaaye.

```
Scenario without retain:
Sensor publishes temperature = 35°C
(10 minute baad) Dashboard subscribes
Dashboard ko kuch nahi milta — wait karna padega next publish tak

Scenario with retain:
Sensor publishes temperature = 35°C (retain: true)
(10 minute baad) Dashboard subscribes
Dashboard ko TURANT milta hai: 35°C (retained message)
```

> **Example:** Socho kisan subah app khole — usse turant last known temperature dikhna chahiye, sensor ke next update ka wait nahi karna chahiye. Retained messages ye solve karte hain.

---

## Last Will and Testament (LWT)

### Device Offline Notification

Jab device connect kare, wo apna "last will" message set karta hai. Agar device suddenly disconnect ho (crash, battery dead, network lost), broker automatically ye message publish karta hai.

```
Device connects:
"Agar mein achanak disconnect ho jaau, toh ye message bhej dena:
  Topic: farm/sensor-01/status
  Message: 'offline'
"

(Device crashes)

Broker automatically publishes:
  Topic: farm/sensor-01/status
  Message: 'offline'

Dashboard receives: "Sensor-01 offline ho gaya!"
```

> **Yaad Rakho:** LWT sirf **unexpected** disconnect pe kaam karta hai. Agar device gracefully disconnect kare (proper DISCONNECT packet bheje), toh LWT publish nahi hota.

---

## IoT Use Cases

### Smart Farming Scenario

```
Khet mein sensors:
├── Temperature sensor → publish: farm/field1/temp
├── Humidity sensor    → publish: farm/field1/humidity
├── Soil moisture      → publish: farm/field1/moisture
├── Water pump         → subscribe: farm/field1/pump/command
└── Camera             → publish: farm/field1/camera/motion

Dashboard (subscribes):
├── farm/field1/#      → Sab data dekho
├── Alerts             → Moisture < 30% → pump chalu karo
└── History            → MongoDB mein save karo

Mobile App:
├── farm/+/temp        → Sab fields ka temperature
└── Push notification  → Alert aaye toh notify karo
```

### Other IoT Use Cases

| Domain | Devices | MQTT Topics Example |
|--------|---------|-------------------|
| Smart Home | Lights, AC, lock | `home/bedroom/light/status` |
| Factory | Machines, conveyor | `factory/line1/machine3/rpm` |
| Healthcare | Heart rate, BP | `hospital/room101/patient/heartrate` |
| Fleet | GPS, fuel level | `fleet/truck-42/gps/location` |
| Weather | Stations | `weather/delhi/temperature` |

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| MQTT | Lightweight IoT protocol | 2 byte header, persistent connection |
| Broker | Central message router | Mosquitto, HiveMQ, EMQX |
| Topic | Message ka address | `/` se hierarchy, `+` aur `#` wildcards |
| QoS 0 | Fire and forget | Fast but unreliable |
| QoS 1 | At least once | Reliable, possible duplicate |
| QoS 2 | Exactly once | Slowest but guaranteed |
| Retain | Last value save | Naye subscriber ko turant milta hai |
| LWT | Offline notification | Unexpected disconnect pe auto publish |

---

## Aaj Kya Seekha?

1. **MQTT** — IoT ke liye lightweight publish/subscribe messaging protocol
2. **Pub/Sub pattern** — publisher aur subscriber independent hain, broker route karta hai
3. **Topics** — hierarchical address system jaise `farm/field1/temp`
4. **Wildcards** — `+` ek level, `#` sab levels match karta hai
5. **QoS levels** — 0 (fast), 1 (reliable), 2 (guaranteed) — use case ke hisaab se choose karo
6. **Retained messages** — naye subscribers ko turant last value milta hai
7. **LWT** — device crash hone pe broker automatic offline notification bhejta hai

> **Practice Time!** Evening mein hum Mosquitto install karke terminal se publish/subscribe karenge, aur ek smart farm ke liye topic structure design karenge!
