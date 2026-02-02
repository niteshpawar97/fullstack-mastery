# Day 64 Morning: Docker Basics — Containers

> **Aaj ka plan:** Aaj Docker ki duniya mein entry kar rahe hain! Samjhenge ki Docker kya hai, containers kaise kaam karte hain, Dockerfile kaise likhte hain, aur images kaise build karte hain. DevOps ka pehla step!

---

## Docker Kya Hai?

### "It Works on My Machine" Problem Ka Solution

Kabhi ye hua hai? — Tumhare laptop pe app perfect chal raha hai, lekin doosre ke laptop pe ya server pe error aa raha hai? Docker ye problem solve karta hai.

> **Socho Aise:** Socho ek kisan apni special biryani banana jaanta hai. Lekin jab wo recipe doosre ko deta hai, to taste alag aata hai — kyunki unke paas alag masale hain, alag chulha hai. Ab agar kisan apni poori rasoi (kitchen) pack karke de de — same masale, same bartan, same chulha — to taste guaranteed same aayega! Docker yehi karta hai — poora environment pack kar deta hai.

### Docker = Application + Environment Packed Together

```
Without Docker:
- Developer: "Mere pe chal raha hai!" (Node 18, MongoDB 6, Ubuntu)
- Server:    "Mere pe nahi chal raha!" (Node 16, MongoDB 5, CentOS)
- Tester:    "Mere pe bhi nahi chal raha!" (Node 20, no MongoDB)

With Docker:
- Ek container banao jisme Node 18, MongoDB 6, sab hai
- Kahi bhi chalao — same result guaranteed!
```

---

## Containers vs Virtual Machines (VMs)

### Container = Lightweight, VM = Heavyweight

```
Virtual Machine (VM):                Container (Docker):
┌─────────────────┐                 ┌─────────────────┐
│   Your App      │                 │   Your App      │
│   Libraries     │                 │   Libraries     │
│   Guest OS      │ ← poora OS!    └────────┬────────┘
│   (Ubuntu/CentOS)│                         │
└────────┬────────┘                 ┌────────▼────────┐
┌────────▼────────┐                 │  Docker Engine   │
│   Hypervisor    │                 └────────┬────────┘
└────────┬────────┘                 ┌────────▼────────┐
┌────────▼────────┐                 │   Host OS        │
│   Host OS       │                 └─────────────────┘
└─────────────────┘

VM: 2-5 GB, 1-2 min start         Container: 50-200 MB, 1-2 sec start
```

| Feature | VM | Container |
|---------|-----|-----------|
| Size | 2-5 GB | 50-500 MB |
| Start Time | 1-2 minutes | 1-2 seconds |
| OS | Poora Guest OS chahiye | Host OS share karta hai |
| Isolation | Full isolation | Process-level isolation |
| Performance | Slower (overhead) | Near-native speed |
| Resource Usage | Heavy | Lightweight |

> **Yaad Rakho:** Container ek lightweight VM jaisa hai — lekin poora OS nahi rakhta. Ye sirf app aur uski dependencies pack karta hai. Isliye bahut fast aur lightweight hai!

---

## Docker Key Concepts

### Image vs Container

```
Docker Image:                    Docker Container:
─────────────                   ────────────────
Blueprint / Template             Running Instance
Read-only                       Read-write
Shareable                       Temporary (usually)

Socho aise:
Image = Recipe (blueprint)       Container = Actual dish (running app)
Ek image se 100 containers       Har container independent
ban sakte hain
```

### Docker Hub

Docker Hub ek **public registry** hai jahan ready-made images milti hain — Node.js, MongoDB, Redis, Python, sab!

```bash
# Docker Hub se images pull karo
docker pull node:18-alpine        # Node.js 18 ki image
docker pull mongo:7               # MongoDB 7 ki image  
docker pull redis:alpine          # Redis ki image
```

> **Tip:** `alpine` suffix wali images bahut chhoti hoti hain (5-50 MB) kyunki ye Alpine Linux pe based hain — production ke liye best!

---

## Dockerfile — Image Ka Recipe

Dockerfile ek text file hai jo batata hai ki image kaise banegi — step by step instructions.

### Dockerfile Commands

| Command | Kya Karta Hai |
|---------|---------------|
| `FROM` | Base image select karo (Node.js, Python, etc.) |
| `WORKDIR` | Working directory set karo container ke andar |
| `COPY` | Files copy karo host se container mein |
| `RUN` | Command execute karo (install dependencies) |
| `ENV` | Environment variable set karo |
| `EXPOSE` | Kaunsa port expose karna hai bataao |
| `CMD` | Container start hone pe kya command chale |

### Example Dockerfile — Node.js Express App

```dockerfile
# Step 1: Base image — Node.js 18 Alpine (lightweight)
FROM node:18-alpine

# Step 2: Working directory set karo container ke andar
WORKDIR /app

# Step 3: Package files pehle copy karo (caching ke liye)
COPY package*.json ./

# Step 4: Dependencies install karo
RUN npm install

# Step 5: Baaki sab code copy karo
COPY . .

# Step 6: Port expose karo
EXPOSE 3000

# Step 7: App start karo
CMD ["node", "src/app.js"]
```

> **Socho Aise:** Dockerfile ek recipe hai:
> 1. Base ingredient lo (Node.js image)
> 2. Kitchen ready karo (WORKDIR)
> 3. Ingredients laao (COPY package.json)
> 4. Preparation karo (RUN npm install)
> 5. Sab mix karo (COPY . .)
> 6. Serving plate ready karo (EXPOSE)
> 7. Serve karo (CMD)

### Package Files Pehle Kyu Copy Karte Hain?

```dockerfile
# GOOD — Package files pehle, code baad mein
COPY package*.json ./     # Ye change nahi hota frequently
RUN npm install           # Ye layer cached rehti hai
COPY . .                  # Code change pe sirf ye layer rebuild hoti hai

# BAD — Sab ek saath copy
COPY . .                  # Har code change pe npm install bhi dobaara hoga
RUN npm install           # Bahut slow!
```

> **Yaad Rakho:** Docker layers mein build hota hai. Agar ek layer change nahi hui to cached version use hota hai. Isliye package.json pehle copy karo — `npm install` ki layer cached rehegi jab tak dependencies na badlein!

---

## Docker Commands — Essential

### Image Build Karo

```bash
# Dockerfile se image banao
docker build -t my-express-app .
#           -t = tag/name      . = current directory mein Dockerfile hai

# Images list dekho
docker images
# Output:
# REPOSITORY        TAG       IMAGE ID       SIZE
# my-express-app    latest    abc123def      150MB
# node              18-alpine xyz789ghi      175MB
```

### Container Run Karo

```bash
# Container start karo
docker run -d -p 3000:3000 --name my-app my-express-app
#          -d = background mein chale (detached mode)
#          -p = port mapping (host:container)
#          --name = container ka naam

# Chal rahe containers dekho
docker ps
# Output:
# CONTAINER ID   IMAGE            STATUS      PORTS
# a1b2c3d4e5f    my-express-app   Up 5 sec    0.0.0.0:3000->3000/tcp

# Sab containers dekho (stopped bhi)
docker ps -a
```

### Port Mapping Samjho

```
Host Machine         Docker Container
┌──────────┐        ┌──────────────┐
│          │        │              │
│ Port 8080├────────►Port 3000    │
│          │        │ (Express app)│
│          │        │              │
└──────────┘        └──────────────┘

docker run -p 8080:3000 my-app
           ↑         ↑
    Host port   Container port

Browser: http://localhost:8080  → Container ke port 3000 pe jaayega
```

### Environment Variables

```bash
# Env variables pass karo
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://host.docker.internal:27017/mydb \
  -e JWT_SECRET=mysecretkey \
  --name my-app \
  my-express-app

# Ya .env file se
docker run -d -p 3000:3000 --env-file .env --name my-app my-express-app
```

> **Tip:** `host.docker.internal` se container host machine ki services access kar sakta hai. Matlab agar MongoDB host pe chal raha hai to container se ye URL use karo.

---

## Container Management Commands

```bash
# Container ke logs dekho (debugging ke liye)
docker logs my-app
docker logs -f my-app          # real-time follow karo

# Container ke andar jaao (bash shell)
docker exec -it my-app sh
# Alpine mein sh hota hai, Ubuntu mein bash

# Container stop karo
docker stop my-app

# Container start karo (stopped container)
docker start my-app

# Container restart karo
docker restart my-app

# Container delete karo (stopped hona chahiye)
docker rm my-app

# Force delete (running bhi delete)
docker rm -f my-app

# Image delete karo
docker rmi my-express-app

# Sab stopped containers + unused images clean karo
docker system prune
```

> **Warning:** `docker system prune` se sab stopped containers aur unused images delete ho jaate hain. Production mein carefully use karo!

---

## .dockerignore File

Jaise `.gitignore` hai — waise `.dockerignore` file Docker ko batati hai ki kaunsi files COPY mein skip karni hain.

```
# .dockerignore
node_modules          # Container mein fresh install hoga
npm-debug.log
.env                  # Secrets copy nahi karne
.git                  # Git history nahi chahiye
.gitignore
README.md
docker-compose.yml
.DS_Store
```

> **Yaad Rakho:** `node_modules` hamesha `.dockerignore` mein daalo! Container ke andar fresh `npm install` hoga jo container ke OS ke liye correct binaries install karega.

---

## Quick Revision Table

| Concept | Explanation |
|---------|------------|
| Docker | App + environment pack karke portable banata hai |
| Container | Running instance of an image — lightweight, fast |
| Image | Blueprint/template — read-only, shareable |
| Dockerfile | Image banane ki recipe — FROM, COPY, RUN, CMD |
| `docker build` | Dockerfile se image banao |
| `docker run` | Image se container start karo |
| `-p 8080:3000` | Host port 8080 → Container port 3000 |
| `-e KEY=val` | Environment variable pass karo |
| `docker ps` | Running containers dekho |
| `docker logs` | Container ke logs dekho |
| `.dockerignore` | Files jo COPY mein skip honi chahiye |

---

## Aaj Kya Seekha?

1. Docker **"works on my machine"** problem solve karta hai
2. Containers VMs se **lightweight aur fast** hain (seconds mein start)
3. **Dockerfile** image banane ki recipe hai — step by step instructions
4. Package files pehle COPY karo — **Docker layer caching** fast build deta hai
5. **Port mapping** (`-p host:container`) se container ki services access hoti hain
6. **`.dockerignore`** mein `node_modules` aur `.env` hamesha daalo
7. Evening mein actual Express app Dockerize karenge!
