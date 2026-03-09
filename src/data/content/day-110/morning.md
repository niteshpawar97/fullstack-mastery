# Day 110 Morning: Deploy App to Kubernetes — Minikube Setup & YAML Manifests

> **Aaj ka plan:** Aaj hands-on karenge! Minikube install karke local Kubernetes cluster banayenge, apni Express app ka Docker image banayenge, Deployment aur Service YAML likhenge, aur app ko K8s pe deploy karenge.

---

## Minikube Kya Hai?

Minikube ek **local Kubernetes cluster** hai — tumhare laptop pe ek mini K8s environment. Production wali sab features test kar sakte ho bina cloud ke.

```
┌─────────────────────────────────┐
│         Tumhara Laptop          │
│                                  │
│  ┌───────────────────────────┐  │
│  │       Minikube VM         │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  K8s Master + Worker │  │  │
│  │  │  (Single Node)       │  │  │
│  │  │  Pods, Services...   │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## Step 1: Minikube Install Karo

> **Terminal Command:**
> ```bash
> # Windows (winget se)
> winget install Kubernetes.minikube
>
> # Ya chocolatey se
> choco install minikube
>
> # macOS
> brew install minikube
>
> # Linux
> curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
> sudo install minikube-linux-amd64 /usr/local/bin/minikube
>
> # kubectl bhi install karo (agar nahi hai)
> # Windows:
> winget install Kubernetes.kubectl
> # macOS:
> brew install kubectl
> ```

> **Terminal Command:**
> ```bash
> # Minikube start karo (Docker driver use karega)
> minikube start --driver=docker
>
> # Check karo — sab theek hai?
> minikube status
> kubectl cluster-info
> kubectl get nodes
> ```

> **Expected Output:**
> ```
> minikube
> type: Control Plane
> host: Running
> kubelet: Running
> apiserver: Running
>
> NAME       STATUS   ROLES           AGE   VERSION
> minikube   Ready    control-plane   1m    v1.28.0
> ```

---

## Step 2: Express App Banao

```javascript
// app.js — Simple Express app deploy ke liye
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint (K8s probes ke liye)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Kubernetes!',
    pod: process.env.HOSTNAME,        // K8s automatically set karta hai
    version: process.env.APP_VERSION || '1.0.0',
    nodeEnv: process.env.NODE_ENV,
  });
});

// Products endpoint
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Laptop', price: 75000 },
    { id: 2, name: 'Phone', price: 25000 },
    { id: 3, name: 'Headphones', price: 3000 },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} pe`);
});
```

```dockerfile
# Dockerfile — App ka image banao
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

# Non-root user (security)
USER node

CMD ["node", "app.js"]
```

```json
// package.json
{
  "name": "k8s-demo-app",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

---

## Step 3: Docker Image Banao (Minikube Ke Liye)

> **Yaad Rakho:** Minikube ka apna Docker daemon hai. Agar tum local Docker se image banao to Minikube ko nahi milegi. Pehle Minikube ke Docker environment mein switch karo!

> **Terminal Command:**
> ```bash
> # Minikube ke Docker environment mein jaao
> eval $(minikube docker-env)
>
> # Ab image banao — ye Minikube ke andar build hogi
> docker build -t k8s-demo-app:1.0.0 .
>
> # Check karo image ban gayi
> docker images | grep k8s-demo
> ```

> **Tip:** `eval $(minikube docker-env)` sirf current terminal ke liye kaam karta hai. Naya terminal khologe to phir se run karna padega.

---

## Step 4: Deployment YAML Likho

```yaml
# k8s/deployment.yaml — App ka Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
  labels:
    app: demo-app
spec:
  replicas: 3                    # 3 copies chalao
  selector:
    matchLabels:
      app: demo-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                # Update mein 1 extra pod
      maxUnavailable: 0          # Zero downtime
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      containers:
        - name: demo-app
          image: k8s-demo-app:1.0.0
          imagePullPolicy: Never   # Local image use karo (Minikube)
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: APP_VERSION
              value: "1.0.0"
          resources:
            requests:
              memory: "64Mi"
              cpu: "100m"
            limits:
              memory: "128Mi"
              cpu: "250m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

> **Warning:** `imagePullPolicy: Never` Minikube ke liye zaroori hai — warna K8s DockerHub se image pull karne ki koshish karega aur fail hoga (kyunki ye local image hai).

---

## Step 5: Service YAML Likho

```yaml
# k8s/service.yaml — App ko bahar se access karne ke liye
apiVersion: v1
kind: Service
metadata:
  name: demo-app-service
spec:
  type: NodePort
  selector:
    app: demo-app              # Deployment ke pods se match
  ports:
    - protocol: TCP
      port: 80                 # Service ka port
      targetPort: 3000         # Pod mein app ka port
      nodePort: 30080          # Bahar se access port
```

---

## Step 6: Deploy Karo!

> **Terminal Command:**
> ```bash
> # Directory structure banao
> mkdir -p k8s
> # (deployment.yaml aur service.yaml k8s folder mein daalo)
>
> # Deploy karo
> kubectl apply -f k8s/deployment.yaml
> kubectl apply -f k8s/service.yaml
>
> # Ya ek saath sab files apply karo
> kubectl apply -f k8s/
>
> # Status dekho
> kubectl get deployments
> kubectl get pods
> kubectl get services
> ```

> **Expected Output:**
> ```
> NAME       READY   UP-TO-DATE   AVAILABLE   AGE
> demo-app   3/3     3            3           30s
>
> NAME                        READY   STATUS    RESTARTS   AGE
> demo-app-7d9f8b6c4-abc12   1/1     Running   0          30s
> demo-app-7d9f8b6c4-def34   1/1     Running   0          30s
> demo-app-7d9f8b6c4-ghi56   1/1     Running   0          30s
> ```

---

## Step 7: App Access Karo

> **Terminal Command:**
> ```bash
> # Minikube se service URL lo
> minikube service demo-app-service --url
> # Output: http://192.168.49.2:30080
>
> # Ya direct browser kholdo
> minikube service demo-app-service
>
> # curl se test karo
> curl http://192.168.49.2:30080/
> curl http://192.168.49.2:30080/api/products
> curl http://192.168.49.2:30080/health
> ```

> **Expected Output:**
> ```json
> {
>   "message": "Hello from Kubernetes!",
>   "pod": "demo-app-7d9f8b6c4-abc12",
>   "version": "1.0.0",
>   "nodeEnv": "production"
> }
> ```

> **Practice Time!** Multiple baar curl karo aur dekho — `pod` field alag alag aayega! K8s load balance kar raha hai different pods pe.

---

## Quick Revision Table

| Step | Command | Kya Hota Hai |
|------|---------|-------------|
| Minikube start | `minikube start` | Local K8s cluster shuru |
| Docker env | `eval $(minikube docker-env)` | Minikube ka Docker use karo |
| Image build | `docker build -t app:1.0.0 .` | App ka image banao |
| Deploy | `kubectl apply -f k8s/` | Sab YAML apply karo |
| Pods dekho | `kubectl get pods` | Running pods list |
| Access app | `minikube service svc-name` | Browser mein kholdo |
| imagePullPolicy | `Never` | Local image use karo |
| NodePort | `30080` | Bahar se access port |

---

## Aaj Kya Seekha?

1. **Minikube** local laptop pe Kubernetes cluster chalata hai
2. **eval $(minikube docker-env)** se Minikube ke Docker mein image build hoti hai
3. **imagePullPolicy: Never** Minikube mein local images ke liye zaroori hai
4. **Deployment YAML** mein replicas, probes, resources sab define karo
5. **Service YAML** se app ko bahar se access milta hai
6. **kubectl apply -f** se sab deploy ho jaata hai — ek command!
