# Day 109 Morning: Kubernetes ConfigMaps, Secrets & Ingress

> **Aaj ka plan:** Aaj seekhenge ki app configuration aur sensitive data (passwords, API keys) Kubernetes mein kaise manage karte hain. ConfigMaps, Secrets, aur Ingress controller — ye teenon production mein zaroori hain.

---

## ConfigMaps — Environment Configuration

ConfigMap mein non-sensitive configuration data store hota hai — jaise database host, log level, feature flags.

> **Socho Aise:** ConfigMap ek settings file hai jo Pod ke bahar rehti hai. App ka code change kiye bina settings badal sakte ho — jaise AC ka remote (temperature change karo, AC ko mat kholo).

---

## ConfigMap Banana — 3 Tarike

### Tarika 1: YAML File Se

```yaml
# configmap.yaml — App ki configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # Key-value pairs
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  DB_HOST: "mongo-service"
  DB_PORT: "27017"
  MAX_CONNECTIONS: "100"

  # Poori file bhi rakh sakte ho
  nginx.conf: |
    server {
      listen 80;
      server_name myapp.com;
      location / {
        proxy_pass http://backend-service:3000;
      }
    }
```

### Tarika 2: kubectl Command Se

> **Terminal Command:**
> ```bash
> # Literal values se banao
> kubectl create configmap app-config \
>   --from-literal=NODE_ENV=production \
>   --from-literal=LOG_LEVEL=info \
>   --from-literal=DB_HOST=mongo-service
>
> # File se banao
> kubectl create configmap nginx-config \
>   --from-file=nginx.conf
>
> # .env file se banao
> kubectl create configmap env-config \
>   --from-env-file=.env
>
> # ConfigMap dekho
> kubectl get configmaps
> kubectl describe configmap app-config
> ```

---

## ConfigMap Use Karna Pod Mein

### Tarika A: Environment Variables

```yaml
# deployment-with-configmap.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
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
          # Ek ek key mount karo as env variable
          env:
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: app-config    # ConfigMap ka naam
                  key: NODE_ENV       # ConfigMap mein key
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: DB_HOST

          # Ya saari keys ek saath inject karo
          envFrom:
            - configMapRef:
                name: app-config      # Sab key-value env mein aa jayenge
```

### Tarika B: Volume Mount (File As Config)

```yaml
spec:
  containers:
    - name: nginx
      image: nginx:alpine
      volumeMounts:
        - name: config-volume
          mountPath: /etc/nginx/conf.d    # Is path pe file mount hogi
          readOnly: true
  volumes:
    - name: config-volume
      configMap:
        name: nginx-config                # ConfigMap ka naam
```

> **Tip:** Simple key-value ke liye `env/envFrom` use karo. Config files ke liye volume mount karo. Dono ek saath bhi chal sakte hain!

---

## Secrets — Sensitive Data (Passwords, Keys)

Secrets ConfigMap jaisa hi hai, lekin sensitive data ke liye — passwords, API keys, TLS certificates.

```yaml
# secret.yaml — Sensitive data store karo
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  # Values Base64 encoded honi chahiye
  DB_PASSWORD: cGFzc3dvcmQxMjM=        # "password123" ka base64
  JWT_SECRET: bXlfc3VwZXJfc2VjcmV0    # "my_super_secret" ka base64
  API_KEY: YWJjZGVmZzEyMzQ1          # "abcdefg12345" ka base64

# Ya stringData use karo (plain text, K8s khud encode karega)
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets-v2
type: Opaque
stringData:
  DB_PASSWORD: "password123"           # Plain text — K8s encode karega
  JWT_SECRET: "my_super_secret"
  API_KEY: "abcdefg12345"
```

> **Terminal Command:**
> ```bash
> # Base64 encode karo
> echo -n "password123" | base64
> # Output: cGFzc3dvcmQxMjM=
>
> # kubectl se Secret banao
> kubectl create secret generic app-secrets \
>   --from-literal=DB_PASSWORD=password123 \
>   --from-literal=JWT_SECRET=my_super_secret
>
> # Secrets dekho
> kubectl get secrets
> kubectl describe secret app-secrets
> ```

> **Warning:** Kubernetes Secrets Base64 encoded hain, encrypted NAHI! Koi bhi decode kar sakta hai. Production mein HashiCorp Vault ya Sealed Secrets use karo extra security ke liye.

---

## Secrets Use Karna Pod Mein

```yaml
# deployment-with-secrets.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
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
          env:
            # ConfigMap se non-sensitive values
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: NODE_ENV

            # Secret se sensitive values
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: DB_PASSWORD
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: JWT_SECRET

          # Ya sab secrets ek saath
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
```

---

## Ingress Controller — Smart Routing

Ingress ek reverse proxy hai jo external HTTP/HTTPS traffic ko cluster ke andar route karta hai.

```
Internet
   │
   ▼
┌─────────────────────────────────────┐
│          Ingress Controller          │
│          (Nginx / Traefik)          │
│                                      │
│  api.myapp.com ──> api-service      │
│  www.myapp.com ──> frontend-service  │
│  admin.myapp.com ──> admin-service  │
│                                      │
│  myapp.com/api ──> api-service      │
│  myapp.com/    ──> frontend-service │
└─────────────────────────────────────┘
```

> **Socho Aise:** Ingress ek building ka receptionist hai. Visitor aaya aur bola "Mujhe Sales se milna hai" — receptionist 3rd floor bhej deta hai. "Accounts?" — 5th floor. Ek entry point, sahi jagah route.

---

## Ingress YAML

```yaml
# ingress.yaml — HTTP routing rules
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    # Host-based routing — domain ke basis pe
    - host: api.myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80

    - host: www.myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80

    # Path-based routing — URL path ke basis pe
    - host: myapp.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

> **Terminal Command:**
> ```bash
> # Minikube mein Ingress enable karo
> minikube addons enable ingress
>
> # Ingress apply karo
> kubectl apply -f ingress.yaml
>
> # Ingress dekho
> kubectl get ingress
> kubectl describe ingress app-ingress
> ```

---

## TLS/HTTPS Setup with Ingress

```yaml
# tls-ingress.yaml — HTTPS enable karo
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: secure-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - myapp.com
      secretName: tls-secret     # TLS certificate Secret mein hai
  rules:
    - host: myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

> **Tip:** Production mein cert-manager use karo — ye automatically Let's Encrypt se free SSL certificates le aata hai aur renew karta hai!

---

## Quick Revision Table

| Concept | Kya Hai | Kab Use Karo |
|---------|---------|-------------|
| ConfigMap | Non-sensitive config data | DB host, log level, feature flags |
| Secret | Sensitive data (encoded) | Passwords, API keys, certificates |
| envFrom | Sab keys inject karo | Shortcut — ek line mein sab env |
| valueFrom | Ek specific key inject karo | Selective env injection |
| Volume Mount | File as config mount karo | nginx.conf, app config files |
| Ingress | HTTP/HTTPS routing | Domain/path based routing |
| Host-based | Domain se route | api.myapp.com vs www.myapp.com |
| Path-based | URL path se route | /api vs / |
| TLS Secret | HTTPS certificate | SSL termination at Ingress |
| stringData | Plain text secret | K8s khud Base64 karega |

---

## Aaj Kya Seekha?

1. **ConfigMaps** non-sensitive config ke liye — env variables ya file mount
2. **Secrets** sensitive data ke liye — Base64 encoded (NOT encrypted!)
3. **envFrom** se ek shot mein sab config inject ho jaata hai
4. **Ingress** external traffic ko smart routing deta hai — ek IP pe multiple services
5. **Host-based** aur **path-based** routing dono possible hain
6. Production mein Secrets ke saath Vault use karo, aur TLS ke liye cert-manager!
