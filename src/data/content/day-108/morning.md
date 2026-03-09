# Day 108 Morning: Kubernetes Intro — Architecture, Pods & Deployments

> **Aaj ka plan:** Aaj hum Kubernetes (K8s) seekhenge — container orchestration ka king. Samjhenge ki K8s kyun chahiye, architecture kya hai, Pods kya hain, aur Deployments kaise kaam karte hain replicas aur rolling updates ke saath.

---

## Container Orchestration Kyun Chahiye?

Docker se tum containers bana lete ho. Lekin jab production mein 50-100 containers hain...

| Problem | Bina K8s | K8s Ke Saath |
|---------|----------|-------------|
| Container crash ho gaya | Manually restart karo | Auto-restart ho jaata hai |
| Zyada traffic aa gaya | Manually naye containers banao | Auto-scale ho jaata hai |
| Update karna hai | Downtime lagega | Zero-downtime rolling update |
| Load balancing | Nginx manually setup | Built-in hai |
| Health check | Khud likhna padega | Liveness/Readiness probes |
| Multiple servers pe deploy | Manual SSH + docker | Ek command se sab servers |

> **Socho Aise:** Docker ek dabba (container) hai. Kubernetes ek warehouse manager hai jo hazaron dabbon ko organize, monitor, aur manage karta hai — koi dabba toot jaye to naya bana deta hai!

---

## Kubernetes Architecture

```
┌─────────────────────────────────────────────────┐
│                MASTER NODE (Control Plane)       │
│                                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │API Server│  │ Scheduler │  │ Controller   │  │
│  │(kubectl  │  │(Pod kahan │  │ Manager      │  │
│  │ se baat) │  │ chalega?) │  │(desired state│  │
│  └──────────┘  └───────────┘  │ maintain)    │  │
│                                └──────────────┘  │
│  ┌──────────┐                                    │
│  │  etcd    │  (Key-value store — sab data)      │
│  └──────────┘                                    │
└─────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│   WORKER NODE 1  │  │   WORKER NODE 2  │
│                  │  │                  │
│ ┌─────┐ ┌─────┐ │  │ ┌─────┐ ┌─────┐ │
│ │Pod 1│ │Pod 2│ │  │ │Pod 3│ │Pod 4│ │
│ └─────┘ └─────┘ │  │ └─────┘ └─────┘ │
│                  │  │                  │
│ ┌──────────────┐ │  │ ┌──────────────┐ │
│ │   kubelet    │ │  │ │   kubelet    │ │
│ │(Node agent)  │ │  │ │(Node agent)  │ │
│ └──────────────┘ │  │ └──────────────┘ │
│ ┌──────────────┐ │  │ ┌──────────────┐ │
│ │  kube-proxy  │ │  │ │  kube-proxy  │ │
│ │(Networking)  │ │  │ │(Networking)  │ │
│ └──────────────┘ │  │ └──────────────┘ │
└──────────────────┘  └──────────────────┘
```

| Component | Kya Karta Hai |
|-----------|--------------|
| **API Server** | Sab commands yahan aate hain (kubectl isse baat karta hai) |
| **Scheduler** | Naya pod kaunse node pe chalega decide karta hai |
| **Controller Manager** | Desired state maintain karta hai (3 replicas chahiye to 3 rahenge) |
| **etcd** | Cluster ka brain — saara configuration data store |
| **kubelet** | Har node pe agent — pods manage karta hai |
| **kube-proxy** | Networking handle karta hai — traffic route karta hai |

> **Yaad Rakho:** Master node sochta hai (decisions), Worker nodes kaam karte hain (containers chalate hain). Production mein usually 3 master nodes hote hain high availability ke liye.

---

## Pod — Kubernetes Ki Sabse Chhoti Unit

Pod ek ya zyada containers ka group hai jo saath chalte hain.

```
┌──────────────── Pod ────────────────┐
│                                      │
│  ┌────────────┐  ┌────────────┐     │
│  │ Container 1│  │ Container 2│     │
│  │ (Node app) │  │ (Sidecar)  │     │
│  └────────────┘  └────────────┘     │
│                                      │
│  Shared: Network (IP), Storage       │
└──────────────────────────────────────┘
```

> **Socho Aise:** Pod ek kamra hai. Us kamre mein ek ya zyada log (containers) reh sakte hain. Sab log same address share karte hain (same IP), same kitchen use karte hain (same storage).

### Pod YAML Manifest

```yaml
# pod.yaml — Ek simple pod define karo
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod           # Pod ka naam
  labels:
    app: my-app               # Label — identify karne ke liye
spec:
  containers:
    - name: my-app             # Container ka naam
      image: node:18-alpine   # Docker image
      ports:
        - containerPort: 3000  # App kis port pe sun raha hai
      resources:
        limits:
          memory: "256Mi"      # Maximum RAM
          cpu: "500m"          # Maximum CPU (500 milli = 0.5 core)
```

> **Warning:** Production mein direct Pod mat banao — hamesha Deployment use karo! Pod crash hoga to koi restart nahi karega. Deployment auto-restart karta hai.

---

## Deployment — Pods Ka Smart Manager

Deployment pods ko manage karta hai — replicas, updates, rollbacks sab handle karta hai.

```yaml
# deployment.yaml — App ka deployment define karo
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
  labels:
    app: my-app
spec:
  replicas: 3                  # 3 copies chalao hamesha
  selector:
    matchLabels:
      app: my-app              # In labels wale pods manage karo
  template:                    # Pod ka template — ye create hoga
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: my-app:1.0.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "128Mi"  # Minimum chahiye
              cpu: "250m"
            limits:
              memory: "256Mi"  # Maximum use kar sakta hai
              cpu: "500m"
```

### Deployment Kya Karta Hai?

```
Deployment: "3 replicas chahiye"
     │
     ▼
ReplicaSet: "3 pods maintain karunga"
     │
     ├──> Pod 1 (running ✅)
     ├──> Pod 2 (running ✅)
     └──> Pod 3 (crashed ❌) ──> Auto recreate ──> Pod 3-new (running ✅)
```

> **Yaad Rakho:** Deployment > ReplicaSet > Pods. Tum sirf Deployment banao, baaki K8s khud handle karega.

---

## Rolling Update — Zero Downtime Deploy

```yaml
# deployment.yaml mein strategy section
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # Update mein 1 extra pod bana sakta hai
      maxUnavailable: 0    # 0 pods band honge — zero downtime!
```

```
Rolling Update Process (v1 → v2):

Step 1: [v1] [v1] [v1]           ← Sab v1 chal raha hai
Step 2: [v1] [v1] [v1] [v2]     ← Ek v2 pod start hua
Step 3: [v1] [v1] [v2]          ← Ek v1 pod hata diya
Step 4: [v1] [v1] [v2] [v2]     ← Ek aur v2 aaya
Step 5: [v1] [v2] [v2]          ← Ek aur v1 gaya
Step 6: [v2] [v2] [v2]          ← Sab v2 ho gaye! ✅
```

> **Tip:** `maxUnavailable: 0` + `maxSurge: 1` = sabse safe strategy. Pehle naya pod chalu hota hai, phir purana band. User ko kuch pata nahi chalta!

---

## kubectl — K8s Ka Command Line Tool

> **Terminal Command:**
> ```bash
> # Deployment banao
> kubectl apply -f deployment.yaml
>
> # Pods dekho
> kubectl get pods
>
> # Deployment status dekho
> kubectl get deployments
>
> # Pod ki details dekho
> kubectl describe pod my-app-pod
>
> # Pod ke logs dekho
> kubectl logs my-app-pod
>
> # Pod mein jaao (shell)
> kubectl exec -it my-app-pod -- /bin/sh
>
> # Replicas badhao
> kubectl scale deployment my-app-deployment --replicas=5
>
> # Image update karo (rolling update trigger)
> kubectl set image deployment/my-app-deployment my-app=my-app:2.0.0
>
> # Rollback karo
> kubectl rollout undo deployment/my-app-deployment
>
> # Update status dekho
> kubectl rollout status deployment/my-app-deployment
> ```

---

## Quick Revision Table

| Concept | Kya Hai | Key Command/File |
|---------|---------|-----------------|
| Kubernetes | Container orchestration platform | Auto-scale, self-heal, rolling update |
| Master Node | Control plane — decisions | API Server, Scheduler, Controller, etcd |
| Worker Node | Containers chalata hai | kubelet, kube-proxy |
| Pod | Sabse chhoti deploy unit | 1 ya zyada containers ka group |
| Deployment | Pods ka manager | Replicas, rolling update, rollback |
| ReplicaSet | Pods ki count maintain karta hai | Deployment automatically banata hai |
| Rolling Update | Zero-downtime deploy | maxSurge + maxUnavailable |
| kubectl | K8s CLI tool | `kubectl apply/get/describe/logs` |
| Labels | Pods identify karne ka tag | `app: my-app` |

---

## Aaj Kya Seekha?

1. **Kubernetes** container orchestration ka standard hai — auto-restart, auto-scale, rolling updates
2. **Master node** decisions leta hai, **Worker nodes** containers chalate hain
3. **Pod** Kubernetes ki sabse chhoti unit hai — 1+ containers ka group
4. **Deployment** pods ko manage karta hai — replicas maintain, auto-restart, rolling updates
5. **Rolling update** se zero-downtime deployment hota hai
6. **kubectl** se sab manage hota hai — apply, get, describe, logs, scale
