# Day 110 Evening: Scale, Rolling Update, Monitor & Dashboard

> **Aaj ka plan:** Evening mein deployed app ko scale karenge, rolling update se new version deploy karenge, pods monitor karenge, aur Kubernetes Dashboard UI explore karenge. Phase 4 BONUS ka grand finale!

---

## Scaling — Replicas Badhao/Ghatao

### Command Line Se Scale

> **Terminal Command:**
> ```bash
> # Current state dekho
> kubectl get deployments
> # NAME       READY   UP-TO-DATE   AVAILABLE
> # demo-app   3/3     3            3
>
> # 5 replicas pe scale karo
> kubectl scale deployment demo-app --replicas=5
>
> # Dekho — 2 naye pods aa rahe hain
> kubectl get pods -w   # -w = watch mode (live updates)
>
> # Scale down — 2 replicas
> kubectl scale deployment demo-app --replicas=2
>
> # Extra pods terminate ho rahe hain
> kubectl get pods
> ```

### YAML Se Scale

```yaml
# deployment.yaml mein replicas badlo
spec:
  replicas: 5    # 3 se 5 kiya
```

> **Terminal Command:**
> ```bash
> # YAML update karke apply karo
> kubectl apply -f k8s/deployment.yaml
> ```

> **Socho Aise:** Festival sale aa rahi hai? `replicas: 10` kardo. Sale khatam? `replicas: 3` wapas. Kubernetes automatically pods manage karega.

---

## Rolling Update — New Version Deploy

### Step 1: App Update Karo

```javascript
// app.js — Version 2.0.0 mein naya feature
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '2.0.0' });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Kubernetes! v2 mein naya feature!',
    pod: process.env.HOSTNAME,
    version: '2.0.0',            // Version update kiya
    newFeature: 'Dark Mode',     // Naya feature add kiya
  });
});

app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Laptop', price: 75000, discount: '10%' },  // Discount add kiya
    { id: 2, name: 'Phone', price: 25000, discount: '5%' },
    { id: 3, name: 'Headphones', price: 3000, discount: '15%' },
  ]);
});

app.listen(PORT, () => console.log(`v2.0.0 running on port ${PORT}`));
```

### Step 2: Naya Image Build Karo

> **Terminal Command:**
> ```bash
> # Minikube Docker env mein ho confirm karo
> eval $(minikube docker-env)
>
> # New version ka image build karo
> docker build -t k8s-demo-app:2.0.0 .
>
> # Verify karo
> docker images | grep k8s-demo
> # k8s-demo-app   2.0.0   ...
> # k8s-demo-app   1.0.0   ...
> ```

### Step 3: Rolling Update Trigger Karo

> **Terminal Command:**
> ```bash
> # Method 1: kubectl set image (quick way)
> kubectl set image deployment/demo-app demo-app=k8s-demo-app:2.0.0
>
> # Method 2: YAML mein image version update karke apply
> # (image: k8s-demo-app:2.0.0 karo deployment.yaml mein)
> kubectl apply -f k8s/deployment.yaml
>
> # Rolling update live dekho
> kubectl rollout status deployment/demo-app
> ```

> **Expected Output:**
> ```
> Waiting for deployment "demo-app" rollout to finish:
>   1 out of 3 new replicas have been updated...
>   2 out of 3 new replicas have been updated...
>   3 out of 3 new replicas have been updated...
>   Waiting for 1 old replicas to terminate...
> deployment "demo-app" successfully rolled out
> ```

---

## Rolling Update Live Dekho

> **Terminal Command:**
> ```bash
> # Ek terminal mein pods watch karo
> kubectl get pods -w
> ```

```
# Ye dikhega live:
NAME                        READY   STATUS              AGE
demo-app-7d9f8b6c4-abc12   1/1     Running             10m   ← v1
demo-app-7d9f8b6c4-def34   1/1     Running             10m   ← v1
demo-app-7d9f8b6c4-ghi56   1/1     Running             10m   ← v1
demo-app-8e5a7c3b2-new01   0/1     ContainerCreating   0s    ← v2 aa raha hai!
demo-app-8e5a7c3b2-new01   1/1     Running             3s    ← v2 ready!
demo-app-7d9f8b6c4-abc12   1/1     Terminating         10m   ← v1 ja raha hai
demo-app-8e5a7c3b2-new02   0/1     ContainerCreating   0s    ← next v2
... (jab tak sab v2 nahi ho jaate)
```

> **Tip:** Curl se baar baar hit karo — pehle v1 response aayega, phir mix mein v1 aur v2 dono, phir sirf v2. Zero downtime!

---

## Rollback — Galti Ho Gayi? Wapas Jaao!

> **Terminal Command:**
> ```bash
> # Rollout history dekho
> kubectl rollout history deployment/demo-app
>
> # Ek step peeche jaao (previous version)
> kubectl rollout undo deployment/demo-app
>
> # Specific revision pe jaao
> kubectl rollout undo deployment/demo-app --to-revision=1
>
> # Check karo — wapas v1 aa gaya
> curl http://192.168.49.2:30080/
> ```

> **Yaad Rakho:** Rollback bhi rolling update jaisa hota hai — zero downtime. K8s purane ReplicaSet ko wapas scale up karta hai aur naye ko scale down.

---

## Monitor Pods — Logs & Events

### Pod Logs Dekho

> **Terminal Command:**
> ```bash
> # Ek pod ke logs
> kubectl logs demo-app-8e5a7c3b2-new01
>
> # Live logs (follow mode)
> kubectl logs -f demo-app-8e5a7c3b2-new01
>
> # Sab pods ke logs ek saath (label se)
> kubectl logs -l app=demo-app --all-containers=true
>
> # Previous pod ke logs (crash investigate)
> kubectl logs demo-app-8e5a7c3b2-new01 --previous
> ```

### Pod Details & Events

> **Terminal Command:**
> ```bash
> # Pod ki full detail
> kubectl describe pod demo-app-8e5a7c3b2-new01
>
> # Events section sabse important hai — errors yahan dikhte hain:
> # Events:
> #   Type    Reason     Message
> #   Normal  Scheduled  Successfully assigned to minikube
> #   Normal  Pulled     Container image pulled
> #   Normal  Created    Created container
> #   Normal  Started    Started container
>
> # Cluster level events
> kubectl get events --sort-by='.lastTimestamp'
>
> # Resource usage dekho (CPU/Memory)
> kubectl top pods
> kubectl top nodes
> ```

---

## Pod Ke Andar Jaao (Debugging)

> **Terminal Command:**
> ```bash
> # Pod mein shell kholo
> kubectl exec -it demo-app-8e5a7c3b2-new01 -- /bin/sh
>
> # Andar se check karo
> # ls
> # cat package.json
> # env | grep NODE
> # wget -qO- http://localhost:3000/health
> # exit
>
> # Ek command run karo bina shell khole
> kubectl exec demo-app-8e5a7c3b2-new01 -- env
> kubectl exec demo-app-8e5a7c3b2-new01 -- wget -qO- http://localhost:3000/
> ```

---

## Kubernetes Dashboard — Visual UI

> **Terminal Command:**
> ```bash
> # Dashboard enable karo
> minikube dashboard
> # Browser automatically khul jayega!
>
> # Ya sirf URL lo
> minikube dashboard --url
> ```

Dashboard mein ye sab dikh jayega:

```
┌─────────────────────────────────────────────┐
│          Kubernetes Dashboard               │
│                                              │
│  Workloads:                                 │
│  ├── Deployments (demo-app: 3/3 ready)     │
│  ├── Pods (3 running, 0 pending)           │
│  └── Replica Sets (2 — v1 aur v2)         │
│                                              │
│  Services:                                   │
│  └── demo-app-service (NodePort: 30080)    │
│                                              │
│  Config:                                     │
│  ├── Config Maps                            │
│  └── Secrets                                │
│                                              │
│  [Graphs: CPU usage, Memory usage]          │
└─────────────────────────────────────────────┘
```

> **Tip:** Dashboard mein pods pe click karke logs dekh sakte ho, exec kar sakte ho, delete kar sakte ho — sab GUI se. Beginners ke liye bahut helpful hai!

---

## Cleanup — Sab Saaf Karo

> **Terminal Command:**
> ```bash
> # Sab resources delete karo
> kubectl delete -f k8s/
>
> # Ya individually
> kubectl delete deployment demo-app
> kubectl delete service demo-app-service
>
> # Minikube band karo
> minikube stop
>
> # Minikube cluster delete karo (sab data jayega)
> minikube delete
> ```

---

## Complete Workflow Summary

```
1. minikube start
        │
2. eval $(minikube docker-env)
        │
3. docker build -t app:1.0.0 .
        │
4. kubectl apply -f k8s/
        │
5. minikube service app-service
        │
6. kubectl scale deployment app --replicas=5
        │
7. docker build -t app:2.0.0 .
        │
8. kubectl set image deployment/app app=app:2.0.0
        │
9. kubectl rollout status deployment/app
        │
10. kubectl rollout undo deployment/app  (agar kuch galat ho)
        │
11. minikube dashboard  (visual monitoring)
        │
12. minikube stop  (kaam khatam)
```

---

## Quick Revision Table

| Operation | Command | Kya Hota Hai |
|-----------|---------|-------------|
| Scale up | `kubectl scale --replicas=5` | Zyada pods chalao |
| Scale down | `kubectl scale --replicas=2` | Pods kam karo |
| Rolling update | `kubectl set image ...` | Zero-downtime deploy |
| Rollout status | `kubectl rollout status` | Update progress dekho |
| Rollback | `kubectl rollout undo` | Previous version pe jaao |
| Logs | `kubectl logs -f pod-name` | Live logs dekho |
| Exec | `kubectl exec -it pod -- /bin/sh` | Pod mein jaao |
| Describe | `kubectl describe pod` | Details + events |
| Top | `kubectl top pods` | CPU/Memory usage |
| Dashboard | `minikube dashboard` | Visual UI kholdo |
| Cleanup | `kubectl delete -f k8s/` | Sab hata do |

---

## Phase 4 BONUS Complete! Kya Seekha Poore Phase Mein?

```
Day 106: RabbitMQ + Node.js ──> Producer, Consumer, ACK, Work Queues, DLQ
Day 107: Kafka Basics ──> Topics, Partitions, Consumer Groups, KafkaJS
Day 108: Kubernetes Intro ──> Pods, Deployments, Services (ClusterIP/NodePort/LB)
Day 109: K8s Config ──> ConfigMaps, Secrets, Ingress, PV, Probes, Limits
Day 110: K8s Hands-on ──> Minikube, Deploy, Scale, Update, Monitor, Dashboard
```

> **Yaad Rakho:** Message queues (RabbitMQ/Kafka) se services asynchronously baat karte hain. Kubernetes se wo services reliably deploy, scale, aur manage hote hain. Ye dono milke modern backend architecture ki neev hain!

---

## Aaj Kya Seekha?

1. **kubectl scale** se pods ko dynamically scale up/down kar sakte hain
2. **Rolling update** se zero-downtime deployment hota hai — users ko pata bhi nahi chalta
3. **Rollback** ek command mein previous version pe le jaata hai
4. **kubectl logs, describe, exec** se debugging hoti hai
5. **Minikube dashboard** visual monitoring deta hai — GUI lovers ke liye perfect
6. **Phase 4 BONUS complete** — ab tum message queues aur container orchestration dono samajhte ho!
