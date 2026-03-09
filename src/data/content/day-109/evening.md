# Day 109 Evening: Persistent Volumes, Health Probes & Resource Limits

> **Aaj ka plan:** Evening mein seekhenge — Pod restart hone pe data kaise bachaye (Persistent Volumes), K8s ko kaise bataye ki app healthy hai (Probes), aur CPU/RAM limits kaise set kare ki ek pod poora node na kha jaaye.

---

## Persistent Volumes — Data Survive Pod Restarts

Pod mein jo data hai wo Pod ke saath khatam ho jaata hai. Database, file uploads — sab ud jayega. Persistent Volume (PV) se data safe rehta hai.

```
WITHOUT PV:
Pod (MongoDB) ──crash──> Data lost forever! ❌

WITH PV:
Pod (MongoDB) ──> [Persistent Volume (Disk)]
     │                    │
   crash                  Data safe! ✅
     │                    │
New Pod (MongoDB) ──> [Same Persistent Volume]
                         Data wapas mil gaya!
```

> **Socho Aise:** Pod ek laptop hai, Persistent Volume ek external hard disk. Laptop kharab ho gaya? Naya laptop lo, external hard disk lagao — sab data wahi hai!

---

## PV Architecture — 3 Pieces

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│     Pod      │────>│ PersistentVolume │────>│  Actual Disk │
│ (volumeMount)│     │    Claim (PVC)    │     │ (PV - cloud  │
│              │     │  "Mujhe 5GB       │     │  disk, NFS,  │
│              │     │   chahiye"        │     │  local path) │
└──────────────┘     └──────────────────┘     └──────────────┘
     App              Request/Ticket           Physical Storage
```

| Component | Role | Analogy |
|-----------|------|---------|
| **PersistentVolume (PV)** | Actual storage resource | Warehouse mein rack |
| **PersistentVolumeClaim (PVC)** | Storage ki demand | "Mujhe itni jagah do" ticket |
| **StorageClass** | Storage ka type | "Fast SSD ya cheap HDD?" |

---

## PVC + Deployment Example

```yaml
# pvc.yaml — Storage ki demand
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongo-data-pvc
spec:
  accessModes:
    - ReadWriteOnce        # Ek node pe ek pod read/write kar sakta hai
  resources:
    requests:
      storage: 5Gi         # 5 GB chahiye
  # storageClassName: standard  # Cloud mein automatic provisioning
```

```yaml
# mongo-deployment.yaml — MongoDB with persistent storage
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
        - name: mongodb
          image: mongo:7
          ports:
            - containerPort: 27017
          volumeMounts:
            - name: mongo-storage
              mountPath: /data/db        # MongoDB yahan data rakhta hai
          env:
            - name: MONGO_INITDB_ROOT_USERNAME
              valueFrom:
                secretKeyRef:
                  name: mongo-secrets
                  key: username
            - name: MONGO_INITDB_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mongo-secrets
                  key: password
      volumes:
        - name: mongo-storage
          persistentVolumeClaim:
            claimName: mongo-data-pvc    # PVC ka naam
```

> **Terminal Command:**
> ```bash
> # PVC banao pehle
> kubectl apply -f pvc.yaml
>
> # Status dekho
> kubectl get pvc
> # NAME             STATUS   VOLUME     CAPACITY   ACCESS MODES
> # mongo-data-pvc   Bound    pv-xxxxx   5Gi        RWO
>
> # Deployment apply karo
> kubectl apply -f mongo-deployment.yaml
> ```

| Access Mode | Matlab | Use Case |
|------------|--------|----------|
| ReadWriteOnce (RWO) | Ek node pe read/write | Single pod databases |
| ReadOnlyMany (ROX) | Multiple nodes pe read only | Shared config, static files |
| ReadWriteMany (RWX) | Multiple nodes pe read/write | Shared file uploads (NFS) |

> **Warning:** `ReadWriteMany` sab cloud providers support nahi karte. AWS EBS sirf RWO deta hai. RWX ke liye EFS ya NFS chahiye.

---

## Health Probes — App Healthy Hai Ya Nahi?

K8s ko batao kaise check kare ki tumhara app theek chal raha hai.

### 3 Types of Probes

| Probe | Kya Check Karta Hai | Fail Hone Pe |
|-------|--------------------|-|
| **Liveness** | App zinda hai? | Pod restart hoga |
| **Readiness** | App traffic lene ko ready hai? | Traffic band hoga (Service se hata dega) |
| **Startup** | App start hua? | Liveness/Readiness wait karenge |

```
App start ho raha hai...
   │
   ├── Startup Probe: "Shuru hua?" ──> Haan ──> Ab Liveness/Readiness shuru
   │                                  ──> Nahi ──> Wait karo (timeout tak)
   │
   ├── Liveness Probe: "Zinda hai?" ──> Haan ──> Theek hai
   │                                 ──> Nahi ──> RESTART pod!
   │
   └── Readiness Probe: "Ready hai?" ──> Haan ──> Traffic bhejo
                                      ──> Nahi ──> Traffic mat bhejo
```

> **Socho Aise:** Liveness = "Doctor check kar raha hai ki patient zinda hai?" (nahi to emergency!). Readiness = "Patient walk kar sakta hai?" (nahi to wheelchair pe rakho, discharge mat karo).

---

## Probes YAML Configuration

```yaml
# deployment-with-probes.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: my-app:1.0.0
          ports:
            - containerPort: 3000

          # Liveness Probe — zinda hai?
          livenessProbe:
            httpGet:
              path: /health          # Ye endpoint 200 return kare
              port: 3000
            initialDelaySeconds: 15  # Start ke baad 15 sec wait karo
            periodSeconds: 20        # Har 20 sec check karo
            failureThreshold: 3      # 3 baar fail = restart

          # Readiness Probe — traffic lene ko ready hai?
          readinessProbe:
            httpGet:
              path: /ready           # DB connected hai? Cache warm hai?
              port: 3000
            initialDelaySeconds: 5   # 5 sec baad check shuru
            periodSeconds: 10        # Har 10 sec check karo
            failureThreshold: 3      # 3 baar fail = traffic band

          # Startup Probe — slow-starting apps ke liye
          startupProbe:
            httpGet:
              path: /health
              port: 3000
            failureThreshold: 30     # 30 attempts tak wait karo
            periodSeconds: 10        # Har 10 sec = total 300 sec max
```

### Node.js Health Endpoints

```javascript
// health.js — Express app mein health endpoints
const express = require('express');
const app = express();
const mongoose = require('mongoose');

// Liveness — basic check, app zinda hai
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'alive', uptime: process.uptime() });
});

// Readiness — deep check, dependencies bhi theek hain
app.get('/ready', async (req, res) => {
  try {
    // Database connected hai?
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'not ready', db: 'disconnected' });
    }

    // Redis/cache check (agar use kar rahe ho)
    // await redis.ping();

    res.status(200).json({ status: 'ready', db: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

> **Tip:** Liveness probe simple rakho (app chal raha hai?). Readiness probe mein dependencies check karo (DB, cache connected hai?). Dono alag endpoints pe rakho!

---

## Resource Limits — CPU/RAM Control

Bina limits ke ek pod poore node ki RAM kha sakta hai aur baaki pods crash ho jayenge.

```yaml
spec:
  containers:
    - name: my-app
      image: my-app:1.0.0
      resources:
        # Requests — minimum chahiye (scheduling ke liye)
        requests:
          memory: "128Mi"    # 128 MB minimum RAM
          cpu: "250m"        # 0.25 CPU core minimum

        # Limits — maximum use kar sakta hai
        limits:
          memory: "512Mi"    # 512 MB se zyada nahi
          cpu: "1000m"       # 1 CPU core se zyada nahi
```

| Field | Matlab | Kya Hota Hai |
|-------|--------|-------------|
| **requests.memory** | Minimum RAM chahiye | Scheduler iske basis pe node choose karta hai |
| **requests.cpu** | Minimum CPU chahiye | Guaranteed milega |
| **limits.memory** | Maximum RAM | Cross kiya to Pod **OOMKilled** (killed!) |
| **limits.cpu** | Maximum CPU | Cross kiya to **throttle** (slow ho jayega) |

> **Yaad Rakho:** Memory limit cross karne pe Pod kill hota hai (OOMKilled). CPU limit cross karne pe sirf slow hota hai (throttled). Memory limit hamesha lagao — CPU limit optional hai lekin recommended.

```
CPU Units:
1000m = 1 CPU core
500m  = 0.5 CPU core
250m  = 0.25 CPU core

Memory Units:
128Mi = 128 MiB (Mebibytes)
1Gi   = 1 GiB (Gibibytes)
512M  = 512 MB (Megabytes)
```

---

## Resource Limits Best Practices

```yaml
# Small microservice (Node.js API)
resources:
  requests: { memory: "128Mi", cpu: "100m" }
  limits:   { memory: "256Mi", cpu: "500m" }

# Medium service (with DB connections)
resources:
  requests: { memory: "256Mi", cpu: "250m" }
  limits:   { memory: "512Mi", cpu: "1000m" }

# Heavy worker (image processing, ML)
resources:
  requests: { memory: "512Mi", cpu: "500m" }
  limits:   { memory: "2Gi",  cpu: "2000m" }
```

> **Warning:** Agar requests bahut zyada set karo to pods schedule nahi honge (node pe jagah nahi milegi). Agar limits bahut kam rakho to OOMKilled hoga. Monitor karo aur tune karo!

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| PersistentVolume (PV) | Actual storage | Cloud disk, NFS, local |
| PersistentVolumeClaim (PVC) | Storage request | "Mujhe 5GB chahiye" |
| ReadWriteOnce (RWO) | Single node access | Databases ke liye |
| Liveness Probe | App zinda hai? | Fail = Pod restart |
| Readiness Probe | Traffic le sakta hai? | Fail = Service se hata do |
| Startup Probe | App start hua? | Slow apps ke liye grace period |
| requests | Minimum resources | Scheduling ke liye use hota hai |
| limits | Maximum resources | Memory exceed = OOMKilled |
| OOMKilled | Out of Memory kill | Memory limit cross kiya |
| Throttled | CPU slow kar diya | CPU limit cross kiya |

---

## Aaj Kya Seekha?

1. **PersistentVolume** se data Pod restart pe bhi safe rehta hai
2. **PVC** storage ki demand hai — K8s automatically PV assign karta hai
3. **Liveness Probe** check karta hai app zinda hai — fail pe restart
4. **Readiness Probe** check karta hai app ready hai — fail pe traffic band
5. **Resource requests** minimum guarantee hai, **limits** maximum cap hai
6. Memory limit cross = **OOMKilled**, CPU limit cross = **throttled**
