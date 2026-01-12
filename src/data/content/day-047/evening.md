# Day 47 Evening: Practice — Mosquitto Setup, Publish/Subscribe, Smart Farm Topics

> **Aaj ka plan:** Aaj hum Mosquitto broker install karenge, terminal se MQTT messages publish/subscribe karenge, aur ek smart farm ke liye complete topic structure design karenge.

---

## Step 1: Mosquitto Install Karo

### Windows Installation

> **Terminal Command:**
> ```bash
> # Option 1: Chocolatey se (recommended)
> choco install mosquitto
>
> # Option 2: Manual download
> # https://mosquitto.org/download/ se download karo
> # Install karo → default path: C:\Program Files\mosquitto
> ```

### Ubuntu/WSL Installation

> **Terminal Command:**
> ```bash
> sudo apt update
> sudo apt install mosquitto mosquitto-clients -y
>
> # Mosquitto service start karo
> sudo systemctl start mosquitto
> sudo systemctl enable mosquitto
>
> # Status check karo
> sudo systemctl status mosquitto
> ```

> **Expected Output:**
> ```
> ● mosquitto.service - Mosquitto MQTT Broker
>      Active: active (running)
> ```

### Verify Installation

> **Terminal Command:**
> ```bash
> # Version check
> mosquitto -v
>
> # Client tools check
> mosquitto_pub --help
> mosquitto_sub --help
> ```

> **Tip:** Agar Mosquitto service already chal rahi hai aur tum `mosquitto -v` karo toh port conflict error aayega. Us case mein sirf service chalne do, directly clients use karo.

---

## Step 2: Terminal Se Publish/Subscribe

### Basic Publish & Subscribe

Do terminals kholo — ek mein subscribe karo, doosre mein publish karo:

**Terminal 1 — Subscriber (Sunne wala):**

> **Terminal Command:**
> ```bash
> # test.mosquitto.org (free public broker) se subscribe karo
> mosquitto_sub -h test.mosquitto.org -t "mytest/hello" -v
> ```

**Terminal 2 — Publisher (Bhejne wala):**

> **Terminal Command:**
> ```bash
> # Message publish karo
> mosquitto_pub -h test.mosquitto.org -t "mytest/hello" -m "Namaste from MQTT!"
> ```

> **Expected Output (Terminal 1):**
> ```
> mytest/hello Namaste from MQTT!
> ```

> **Yaad Rakho:** `-h` = host (broker address), `-t` = topic, `-m` = message, `-v` = verbose (topic bhi dikhao message ke saath).

### Multiple Messages Bhejo

**Terminal 2:**

> **Terminal Command:**
> ```bash
> # Alag alag messages bhejo
> mosquitto_pub -h test.mosquitto.org -t "mytest/hello" -m "Temperature: 35°C"
> mosquitto_pub -h test.mosquitto.org -t "mytest/hello" -m "Humidity: 65%"
> mosquitto_pub -h test.mosquitto.org -t "mytest/hello" -m "Soil Moisture: 42%"
> ```

Terminal 1 mein teeno messages turant dikhenge!

---

## Step 3: Wildcards Practice

### Single Level Wildcard (+)

**Terminal 1 — Subscribe with `+`:**

> **Terminal Command:**
> ```bash
> # Kisi bhi field ka temperature suno
> mosquitto_sub -h test.mosquitto.org -t "smartfarm/+/temperature" -v
> ```

**Terminal 2 — Alag fields pe publish karo:**

> **Terminal Command:**
> ```bash
> mosquitto_pub -h test.mosquitto.org -t "smartfarm/field1/temperature" -m "32"
> mosquitto_pub -h test.mosquitto.org -t "smartfarm/field2/temperature" -m "28"
> mosquitto_pub -h test.mosquitto.org -t "smartfarm/greenhouse/temperature" -m "38"
> ```

> **Expected Output (Terminal 1):**
> ```
> smartfarm/field1/temperature 32
> smartfarm/field2/temperature 28
> smartfarm/greenhouse/temperature 38
> ```

### Multi Level Wildcard (#)

**Terminal 1:**

> **Terminal Command:**
> ```bash
> # Farm ke neeche SAB KUCH suno
> mosquitto_sub -h test.mosquitto.org -t "smartfarm/#" -v
> ```

**Terminal 2:**

> **Terminal Command:**
> ```bash
> mosquitto_pub -h test.mosquitto.org -t "smartfarm/field1/temperature" -m "32"
> mosquitto_pub -h test.mosquitto.org -t "smartfarm/field1/humidity" -m "65"
> mosquitto_pub -h test.mosquitto.org -t "smartfarm/warehouse/door" -m "open"
> mosquitto_pub -h test.mosquitto.org -t "smartfarm/pump/status" -m "off"
> ```

> **Expected Output:**
> ```
> smartfarm/field1/temperature 32
> smartfarm/field1/humidity 65
> smartfarm/warehouse/door open
> smartfarm/pump/status off
> ```

> **Socho Aise:** `+` = ek hi level pe koi bhi naam (jaise ek folder mein koi bhi file). `#` = sab kuch neeche tak (jaise ek folder aur uske andar ke sab subfolders + files).

---

## Step 4: QoS Practice

### QoS 0 vs QoS 1

**Terminal 1 — QoS 1 pe subscribe:**

> **Terminal Command:**
> ```bash
> mosquitto_sub -h test.mosquitto.org -t "qos-test/data" -q 1 -v
> ```

**Terminal 2 — QoS levels ke saath publish:**

> **Terminal Command:**
> ```bash
> # QoS 0 — fire and forget
> mosquitto_pub -h test.mosquitto.org -t "qos-test/data" -m "QoS 0 message" -q 0
>
> # QoS 1 — at least once delivery
> mosquitto_pub -h test.mosquitto.org -t "qos-test/data" -m "QoS 1 message" -q 1
>
> # QoS 2 — exactly once
> mosquitto_pub -h test.mosquitto.org -t "qos-test/data" -m "QoS 2 message" -q 2
> ```

> **Yaad Rakho:** `-q` flag se QoS level set hota hai. Subscriber aur Publisher dono ka QoS level matter karta hai — broker dono mein se jo CHHOTA hai wo use karta hai.

---

## Step 5: Retained Message Practice

**Terminal 2 — Retained message publish karo:**

> **Terminal Command:**
> ```bash
> # -r flag = retained message
> mosquitto_pub -h test.mosquitto.org -t "farm/sensor1/temp" -m "35" -r
> ```

**Terminal 1 — 10 second baad subscribe karo:**

> **Terminal Command:**
> ```bash
> # Thodi der baad subscribe karo — phir bhi message milega!
> mosquitto_sub -h test.mosquitto.org -t "farm/sensor1/temp" -v
> ```

> **Expected Output:**
> ```
> farm/sensor1/temp 35
> ```

Message publish hone ke baad bhi subscribe kiya — phir bhi mila! Ye retained message ki power hai.

> **Tip:** Retained message clear karne ke liye empty message publish karo with retain flag: `mosquitto_pub -h test.mosquitto.org -t "farm/sensor1/temp" -m "" -r`

---

## Step 6: Smart Farm Topic Structure Design

### Complete Topic Hierarchy

```
smartfarm/                              # Root
├── field-north/                        # North field
│   ├── sensor-01/
│   │   ├── temperature                 # °C mein
│   │   ├── humidity                    # % mein
│   │   └── soil-moisture               # % mein
│   ├── sensor-02/
│   │   ├── temperature
│   │   ├── humidity
│   │   └── soil-moisture
│   └── pump-01/
│       ├── status                      # on/off
│       └── command                     # on/off command bhejo
│
├── field-south/
│   ├── sensor-01/
│   │   ├── temperature
│   │   └── soil-moisture
│   └── sprinkler-01/
│       ├── status
│       └── command
│
├── greenhouse/
│   ├── sensor-01/
│   │   ├── temperature
│   │   ├── humidity
│   │   └── co2-level
│   ├── fan-01/
│   │   ├── status
│   │   └── speed                       # 0-100%
│   └── light-01/
│       ├── status
│       └── brightness
│
├── warehouse/
│   ├── door/status                     # open/closed
│   ├── temperature
│   └── weight-scale/reading            # kg mein
│
└── alerts/                             # System alerts
    ├── critical                        # Urgent alerts
    ├── warning                         # Warnings
    └── info                            # Information
```

### Message Format (JSON)

```bash
# Sensor data publish karo JSON format mein
mosquitto_pub -h test.mosquitto.org \
  -t "smartfarm/field-north/sensor-01/temperature" \
  -m '{"value": 35.2, "unit": "celsius", "timestamp": "2026-04-04T10:30:00Z"}'

mosquitto_pub -h test.mosquitto.org \
  -t "smartfarm/field-north/sensor-01/soil-moisture" \
  -m '{"value": 42, "unit": "percent", "timestamp": "2026-04-04T10:30:00Z"}'

# Pump command bhejo
mosquitto_pub -h test.mosquitto.org \
  -t "smartfarm/field-north/pump-01/command" \
  -m '{"action": "on", "duration": 30, "unit": "minutes"}'

# Alert bhejo
mosquitto_pub -h test.mosquitto.org \
  -t "smartfarm/alerts/warning" \
  -m '{"source": "field-north/sensor-01", "type": "low-moisture", "value": 15, "threshold": 30}'
```

> **Example:** Dashboard subscribe karega `smartfarm/#` — sab data milega. Mobile app subscribe karega `smartfarm/alerts/#` — sirf alerts milenge. Pump controller subscribe karega `smartfarm/+/pump-01/command` — sirf pump commands milenge.

---

## Simulation Script

Ek bash script banao jo fake sensor data publish kare:

```bash
#!/bin/bash
# simulate-sensors.sh — Fake sensor data generator

BROKER="test.mosquitto.org"
BASE_TOPIC="smartfarm/field-north/sensor-01"

while true; do
  # Random temperature (25-40)
  TEMP=$(( RANDOM % 16 + 25 ))
  # Random humidity (40-80)
  HUMID=$(( RANDOM % 41 + 40 ))
  # Random moisture (20-70)
  MOISTURE=$(( RANDOM % 51 + 20 ))
  
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  mosquitto_pub -h $BROKER -t "$BASE_TOPIC/temperature" \
    -m "{\"value\": $TEMP, \"unit\": \"celsius\", \"ts\": \"$TIMESTAMP\"}"
  
  mosquitto_pub -h $BROKER -t "$BASE_TOPIC/humidity" \
    -m "{\"value\": $HUMID, \"unit\": \"percent\", \"ts\": \"$TIMESTAMP\"}"
    
  mosquitto_pub -h $BROKER -t "$BASE_TOPIC/soil-moisture" \
    -m "{\"value\": $MOISTURE, \"unit\": \"percent\", \"ts\": \"$TIMESTAMP\"}"
  
  echo "Published: temp=$TEMP, humidity=$HUMID, moisture=$MOISTURE"
  sleep 5  # Har 5 second mein publish
done
```

> **Terminal Command:**
> ```bash
> chmod +x simulate-sensors.sh
> ./simulate-sensors.sh
> ```

---

## Quick Revision Table

| Command | Kya Karta Hai | Example |
|---------|---------------|---------|
| `mosquitto_sub` | Messages suno | `-h broker -t topic -v` |
| `mosquitto_pub` | Message bhejo | `-h broker -t topic -m msg` |
| `-h` | Broker host | `test.mosquitto.org` |
| `-t` | Topic specify karo | `farm/field1/temp` |
| `-m` | Message content | `"35"` or JSON |
| `-q` | QoS level (0,1,2) | `-q 1` |
| `-r` | Retained message | `-r` flag add karo |
| `-v` | Verbose (show topic) | Subscribe mein use karo |
| `+` wildcard | Ek level match | `farm/+/temp` |
| `#` wildcard | Sab levels match | `farm/#` |

---

## Aaj Kya Seekha?

1. **Mosquitto install** kiya aur verify kiya
2. **Terminal se pub/sub** — `mosquitto_pub` aur `mosquitto_sub` commands seekhe
3. **Wildcards** — `+` (single level) aur `#` (multi level) practically use kiye
4. **QoS levels** — `-q` flag se different QoS test kiye
5. **Retained messages** — `-r` flag se last known value save kiya
6. **Smart Farm topic structure** — hierarchical topic design kiya production-ready
7. **Simulation script** — bash script se fake sensor data generate kiya

> **Practice Time!** Apne liye ek alag topic structure design karo — smart home ya smart factory ka. Kam se kam 15 topics banao with proper hierarchy. Kal hum Node.js se MQTT use karenge!
