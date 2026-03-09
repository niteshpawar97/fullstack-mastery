# Day 108 Evening: Kubernetes Services — ClusterIP, NodePort, LoadBalancer

> **Aaj ka plan:** Evening mein Kubernetes Services seekhenge — Pods tak kaise pahunche? ClusterIP, NodePort, aur LoadBalancer kya hain? YAML manifests likhenge aur kubectl commands practice karenge.

---

## Kyun Chahiye Service?

Pods ke IPs change hote rehte hain — Pod crash hua, naya bana, naya IP mila. Isse direct Pod IP pe baat nahi kar sakte.

```
WITHOUT Service:
Client ──> Pod IP: 10.1.0.5 ──> Pod crash! ──> Naya Pod IP: 10.1.0.9 ──> ❌ Connection fail

WITH Service:
Client ──> Service: my-app-svc ──> Pod 1 (10.1.0.5)
                                ──> Pod 2 (10.1.0.6)  (load balanced)
                                ──> Pod 3 (10.1.0.7)
```

> **Socho Aise:** Pod ek employee hai jiska phone number badal sakta hai. Service ek company ka landline hai — number fix hai, call aaye to available employee ko forward ho jaati hai.

---

## Service Types — Teen Tarike

| Type | Access From | Use Case | Port Range |
|------|------------|----------|------------|
| **ClusterIP** | Cluster ke andar hi | Service-to-service communication | Internal |
| **NodePort** | Bahar se node IP + port | Dev/testing, direct access | 30000-32767 |
| **LoadBalancer** | Bahar se public IP | Production, cloud provider | Any |

```
Internet
   │
   ▼
┌──────────────────────────────────────┐
│ LoadBalancer (Cloud ka public IP)    │
│            │                          │
│    ┌───────┴────────┐                │
│    │   NodePort     │                │
│    │  (Node pe port)│                │
│    │       │        │                │
│    │ ┌─────┴──────┐ │                │
│    │ │ ClusterIP  │ │                │
│    │ │(Internal IP)│ │                │
│    │ │     │      │ │                │
│    │ │  [Pods]    │ │                │
│    │ └────────────┘ │                │
│    └────────────────┘                │
└──────────────────────────────────────┘
```

> **Yaad Rakho:** LoadBalancer ke andar NodePort hai, NodePort ke andar ClusterIP hai. Ye layers hain — upar wali layer neeche wali ko include karti hai.

---

## ClusterIP Service — Internal Communication

```yaml
# clusterip-service.yaml — Cluster ke andar access ke liye
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: ClusterIP            # Default type (likh bhi sakte ho, chhod bhi sakte ho)
  selector:
    app: my-backend           # In labels wale pods ko target karo
  ports:
    - protocol: TCP
      port: 80                # Service ka port (dusre pods isse use karenge)
      targetPort: 3000        # Pod ke andar app kis port pe hai
```

```
# Cluster ke andar koi bhi pod aise access karega:
http://backend-service:80
# ya full DNS:
http://backend-service.default.svc.cluster.local:80
```

> **Tip:** ClusterIP sabse common hai. Frontend pod se backend pod ko call karna ho to ClusterIP use karo. Bahar ki duniya ko access nahi milega.

---

## NodePort Service — Development Access

```yaml
# nodeport-service.yaml — Bahar se access ke liye (dev/test)
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  type: NodePort
  selector:
    app: my-frontend
  ports:
    - protocol: TCP
      port: 80                # Service port (cluster ke andar)
      targetPort: 3000        # Pod ka port
      nodePort: 30080         # Node pe ye port khulega (30000-32767)
```

> **Terminal Command:**
> ```bash
> # Apply karo
> kubectl apply -f nodeport-service.yaml
>
> # Ab access karo browser se
> # http://<NODE-IP>:30080
> # Minikube mein:
> minikube service frontend-service --url
> ```

> **Warning:** Production mein NodePort mat use karo! Port range limited hai (30000-32767), aur security ke liye bhi acha nahi hai. Dev/testing ke liye theek hai.

---

## LoadBalancer Service — Production Ready

```yaml
# loadbalancer-service.yaml — Production ke liye (cloud)
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: LoadBalancer
  selector:
    app: my-api
  ports:
    - protocol: TCP
      port: 80                # Public port
      targetPort: 3000        # Pod ka port
```

```
# Cloud provider automatically public IP assign karega
# kubectl get svc api-service
# NAME          TYPE           EXTERNAL-IP     PORT(S)
# api-service   LoadBalancer   34.107.52.123   80:31234/TCP
```

> **Socho Aise:** LoadBalancer cloud provider (AWS/GCP/Azure) se ek public IP mangta hai. Jaise Zomato ka ek fixed address hai — traffic aaye to kitchen (pods) mein distribute ho jaaye.

---

## Complete Example — Deployment + Service

```yaml
# complete-app.yaml — Deployment aur Service ek file mein
apiVersion: apps/v1
kind: Deployment
metadata:
  name: express-app
  labels:
    app: express-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: express-app
  template:
    metadata:
      labels:
        app: express-app
    spec:
      containers:
        - name: express-app
          image: express-app:1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"

---
# Ek file mein multiple resources --- se separate karo
apiVersion: v1
kind: Service
metadata:
  name: express-service
spec:
  type: NodePort
  selector:
    app: express-app          # Deployment ke pods ka label match karo
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
      nodePort: 30300
```

> **Terminal Command:**
> ```bash
> # Dono ek saath apply ho jayenge
> kubectl apply -f complete-app.yaml
>
> # Check karo
> kubectl get deployments
> kubectl get pods
> kubectl get services
>
> # Sab ek saath dekho
> kubectl get all
> ```

---

## kubectl Commands — Services Ke Liye

> **Terminal Command:**
> ```bash
> # Sab services dekho
> kubectl get svc
>
> # Service ki detail
> kubectl describe svc express-service
>
> # Service ke endpoints dekho (kaunse pods connected hain)
> kubectl get endpoints express-service
>
> # Service delete karo
> kubectl delete svc express-service
>
> # File se delete karo
> kubectl delete -f complete-app.yaml
>
> # Port forward — local machine se pod access (debugging)
> kubectl port-forward pod/express-app-xyz 3000:3000
>
> # Service port forward
> kubectl port-forward svc/express-service 8080:80
> ```

---

## Service Discovery — Pods Ek Dusre Ko Kaise Dhundhte Hain

```javascript
// backend-pod ke andar se database-service ko call karo
// K8s automatic DNS banata hai!
const dbUrl = 'mongodb://database-service:27017/mydb';

// Ya environment variables se (K8s inject karta hai)
// DATABASE_SERVICE_SERVICE_HOST=10.96.0.15
// DATABASE_SERVICE_SERVICE_PORT=27017
```

```
Pod A (frontend)
   │
   │ http://backend-service:80
   ▼
Service: backend-service (ClusterIP: 10.96.0.100)
   │
   ├──> Pod B1 (backend, 10.1.0.5:3000)
   ├──> Pod B2 (backend, 10.1.0.6:3000)
   └──> Pod B3 (backend, 10.1.0.7:3000)
```

> **Yaad Rakho:** K8s mein DNS automatic kaam karta hai. Service ka naam hi hostname hai — `http://service-name:port`. Koi hardcoded IP nahi chahiye!

---

## Multi-Service Architecture Example

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │  LoadBalancer    │
              │  (api-gateway)  │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
  ┌────────────┐ ┌────────────┐ ┌────────────┐
  │ user-svc   │ │ order-svc  │ │ product-svc│
  │ ClusterIP  │ │ ClusterIP  │ │ ClusterIP  │
  │   │        │ │   │        │ │   │        │
  │ [Pods x3]  │ │ [Pods x3]  │ │ [Pods x2]  │
  └────────────┘ └────────────┘ └────────────┘
         │             │             │
         └──────┬──────┘─────────────┘
                ▼
         ┌────────────┐
         │  mongo-svc  │
         │  ClusterIP  │
         │  [Pods x1]  │
         └────────────┘
```

---

## Quick Revision Table

| Concept | Kya Hai | Kab Use Karo |
|---------|---------|-------------|
| Service | Pods ke liye stable endpoint | Hamesha — direct pod IP mat use karo |
| ClusterIP | Internal IP (default) | Service-to-service calls |
| NodePort | Node pe port kholta hai | Dev/testing, quick access |
| LoadBalancer | Cloud se public IP | Production, external traffic |
| selector | Kaunse pods target karo | Labels se match karta hai |
| port | Service ka port | Bahar se isse call karenge |
| targetPort | Pod ke andar app ka port | Container mein app ka port |
| DNS | Auto service discovery | `http://service-name:port` |
| port-forward | Local se pod/service access | Debugging ke liye |
| endpoints | Service se connected pods | `kubectl get endpoints` |

---

## Aaj Kya Seekha?

1. **Service** pods ko stable endpoint deta hai — IP change hone se koi fark nahi padta
2. **ClusterIP** internal communication ke liye (default, sabse common)
3. **NodePort** bahar se access ke liye (dev/test, port 30000-32767)
4. **LoadBalancer** production mein external traffic ke liye (cloud provider se IP milta hai)
5. **DNS discovery** automatic hai — service naam = hostname
6. **Labels + Selectors** se service pods ko dhundta hai
