# Day 119 Evening: Kubernetes, Monitoring & CI/CD Pipeline

> **Aaj ka plan:** Ab hum Kubernetes manifests likhenge, Minikube pe deploy karenge, monitoring setup karenge (health checks + logging), aur CI/CD pipeline banayenge. DevOps ka full circle complete karenge!

---

## Kubernetes Manifests — Production Deployment

### User Service Deployment

```yaml
# k8s/user-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service       # Labels se Kubernetes resources identify karta hai
spec:
  replicas: 2               # 2 pods chalenge — high availability!
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: myregistry/user-service:latest
          ports:
            - containerPort: 3001
          env:
            - name: RABBITMQ_URL
              valueFrom:
                secretKeyRef:          # Secrets se sensitive data lo
                  name: app-secrets
                  key: rabbitmq-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: jwt-secret
          # Health checks — Kubernetes ko batao service healthy hai
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 15    # 15 sec wait karo start ke baad
            periodSeconds: 10          # Har 10 sec check karo
            failureThreshold: 3        # 3 baar fail = restart pod
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:                  # Minimum chahiye
              memory: "128Mi"
              cpu: "100m"              # 0.1 CPU core
            limits:                    # Maximum allowed
              memory: "256Mi"
              cpu: "200m"
---
# Service — pods ko network pe expose karo
apiVersion: v1
kind: Service
metadata:
  name: user-service          # Ye naam DNS mein resolve hoga
spec:
  selector:
    app: user-service
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP              # Internal access only — Gateway se call hoga
```

> **Socho Aise:** Deployment = "Mujhe 2 copies chahiye user-service ki." Service = "In copies ka phone number (IP) batao taaki gateway call kar sake." Kubernetes manage karta hai ki hamesha 2 copies chalti rahein!

---

## API Gateway — Kubernetes Ingress

```yaml
# k8s/gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
        - name: gateway
          image: myregistry/gateway:latest
          ports:
            - containerPort: 3000
          env:
            - name: USER_SERVICE_URL
              value: "http://user-service:3001"
            - name: PRODUCT_SERVICE_URL
              value: "http://product-service:3002"
            - name: ORDER_SERVICE_URL
              value: "http://order-service:3003"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            periodSeconds: 10
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "300m"
---
apiVersion: v1
kind: Service
metadata:
  name: gateway
spec:
  selector:
    app: gateway
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer    # External access — internet se accessible
```

---

## Kubernetes Secrets — Sensitive Data

```yaml
# k8s/secrets.yaml — Base64 encoded secrets
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  # echo -n "amqp://admin:secret@rabbitmq:5672" | base64
  rabbitmq-url: YW1xcDovL2FkbWluOnNlY3JldEByYWJiaXRtcTo1Njcy
  jwt-secret: c3VwZXItc2VjcmV0LWtleS1jaGFuZ2UtaW4tcHJvZHVjdGlvbg==
```

> **Warning:** Kubernetes secrets Base64 encoded hain — encrypted NAHI! Production mein sealed-secrets ya external secret managers (AWS Secrets Manager, HashiCorp Vault) use karo!

---

## Minikube Pe Deploy Karo

```bash
> **Terminal Command:**
# Minikube start karo
minikube start --driver=docker --memory=4096 --cpus=2

# Docker images Minikube ke Docker daemon mein build karo
eval $(minikube docker-env)

# Sab images build karo
docker build -t myregistry/gateway:latest ./gateway
docker build -t myregistry/user-service:latest ./user-service
docker build -t myregistry/product-service:latest ./product-service
docker build -t myregistry/order-service:latest ./order-service
docker build -t myregistry/notification-service:latest ./notification-service

# RabbitMQ deploy karo
kubectl apply -f k8s/rabbitmq-deployment.yaml

# Secrets apply karo
kubectl apply -f k8s/secrets.yaml

# Services deploy karo
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/product-service-deployment.yaml
kubectl apply -f k8s/order-service-deployment.yaml
kubectl apply -f k8s/notification-service-deployment.yaml
kubectl apply -f k8s/gateway-deployment.yaml

# Status dekho
kubectl get pods
kubectl get services

# Gateway access karo
minikube service gateway --url
```

---

## Monitoring Setup — Health Checks + Structured Logging

```typescript
// shared/src/logger.ts — Structured logging sab services ke liye
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // JSON format — log aggregation tools parse kar sakein
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      service: process.env.SERVICE_NAME || 'unknown',
      pid: bindings.pid,
      hostname: bindings.hostname,
    }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Usage — structured fields ke saath log karo
// logger.info({ orderId: '123', userId: '456', amount: 5000 }, 'Order created');
// Output: {"level":"info","service":"order-service","orderId":"123","msg":"Order created",...}
```

```typescript
// shared/src/healthCheck.ts — Comprehensive health check
interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  checks: Record<string, { status: string; latency?: number }>;
  timestamp: string;
}

export function createHealthCheck(serviceName: string, checks: Record<string, () => Promise<boolean>>) {
  const startTime = Date.now();

  return async (_req: any, res: any) => {
    const results: Record<string, any> = {};
    let overallHealthy = true;

    // Sab dependencies check karo — DB, Redis, RabbitMQ
    for (const [name, checkFn] of Object.entries(checks)) {
      const start = Date.now();
      try {
        const ok = await checkFn();
        results[name] = {
          status: ok ? 'ok' : 'fail',
          latency: Date.now() - start,
        };
        if (!ok) overallHealthy = false;
      } catch (error: any) {
        results[name] = { status: 'error', error: error.message };
        overallHealthy = false;
      }
    }

    const health: HealthStatus = {
      service: serviceName,
      status: overallHealthy ? 'healthy' : 'degraded',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: results,
      timestamp: new Date().toISOString(),
    };

    res.status(overallHealthy ? 200 : 503).json(health);
  };
}

// Usage — har service mein lagao
// app.get('/health', createHealthCheck('order-service', {
//   rabbitmq: async () => messageBus.isConnected(),
//   redis: async () => { await redis.ping(); return true; },
// }));
```

> **Tip:** Health check mein sirf "healthy/unhealthy" mat bolo — dependencies ka individual status batao. Kubernetes aur monitoring tools ko exact pata chale kya problem hai!

---

## CI/CD Pipeline — GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: Microservices CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ===== TEST JOB — Sab services test karo =====
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [gateway, user-service, product-service, order-service, notification-service]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: '${{ matrix.service }}/package-lock.json'

      - name: Install dependencies
        run: cd ${{ matrix.service }} && npm ci

      - name: Run linter
        run: cd ${{ matrix.service }} && npm run lint

      - name: Run tests
        run: cd ${{ matrix.service }} && npm test

      - name: Build check
        run: cd ${{ matrix.service }} && npm run build

  # ===== BUILD & PUSH — Docker images banao =====
  build:
    needs: test    # Tests pass hone ke baad hi build karo
    if: github.ref == 'refs/heads/main'   # Sirf main branch pe
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [gateway, user-service, product-service, order-service, notification-service]
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Registry
        run: echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin

      - name: Build and push image
        run: |
          docker build -t myregistry/${{ matrix.service }}:${{ github.sha }} ./${{ matrix.service }}
          docker tag myregistry/${{ matrix.service }}:${{ github.sha }} myregistry/${{ matrix.service }}:latest
          docker push myregistry/${{ matrix.service }}:${{ github.sha }}
          docker push myregistry/${{ matrix.service }}:latest

  # ===== DEPLOY — Kubernetes pe update karo =====
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        run: echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig.yaml

      - name: Deploy to Kubernetes
        run: |
          for service in gateway user-service product-service order-service notification-service; do
            kubectl --kubeconfig=kubeconfig.yaml set image deployment/$service \
              $service=myregistry/$service:${{ github.sha }}
          done

      - name: Verify rollout
        run: |
          for service in gateway user-service product-service order-service notification-service; do
            kubectl --kubeconfig=kubeconfig.yaml rollout status deployment/$service --timeout=120s
          done
```

> **Yaad Rakho:** CI/CD pipeline mein image tag mein git SHA use karo (`myregistry/service:abc123`). `latest` tag unreliable hai — exactly kaunsa version deployed hai wo SHA se pata chalta hai!

---

## Quick Revision Table

| Concept | Kya Hai | Why Important |
|---------|---------|--------------|
| K8s Deployment | Pod replicas manage karo | High availability |
| K8s Service | Pods ko network expose karo | Service discovery |
| Liveness Probe | Kya container alive hai? | Unhealthy toh restart |
| Readiness Probe | Kya traffic le sakta hai? | Not ready toh traffic band |
| K8s Secrets | Sensitive config store | Env variables safely |
| Structured Logging | JSON format logs | Search + filter easy |
| Health Check | Service status endpoint | Monitoring ke liye |
| CI/CD Pipeline | Auto test, build, deploy | Push → Production auto |

---

## Aaj Kya Seekha?

1. **Kubernetes Deployments** replicas manage karte hain — pod crash hone pe auto-restart hota hai
2. **Liveness + Readiness probes** se Kubernetes ko pata chalta hai service healthy hai ya nahi
3. **Minikube** local Kubernetes cluster hai — development aur testing ke liye perfect
4. **Structured logging** (pino/JSON) se log aggregation tools mein search easy hota hai
5. **CI/CD pipeline** push pe auto test, build images, deploy to Kubernetes — zero manual work

> **Practice Time!** Minikube install karo aur ek service deploy karo. `kubectl get pods` se status dekho. `kubectl logs <pod-name>` se logs dekho. `kubectl describe pod <pod-name>` se details dekho. Pod ko delete karo (`kubectl delete pod <name>`) aur dekho Kubernetes automatically naya pod start karta hai!
