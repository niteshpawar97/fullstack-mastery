# Day 65 Morning: Docker Compose + Multi-container Setup

> **Aaj ka plan:** Kal humne ek container chalana seekha. Lekin real apps mein multiple containers chahiye — app, database, cache sab alag-alag containers mein. Aaj Docker Compose seekhenge jo multiple containers ko ek command se manage karta hai!

---

## Docker Compose Kyu Chahiye?

### Multiple Containers Ka Problem

Kal humne ek container chalaaya. Lekin real app mein chahiye:
- **Express app** container
- **MongoDB** container
- **Redis** container

Bina Docker Compose ke ye karna padega:

```bash
# Pehle network banao
docker network create myapp-network

# MongoDB chalao
docker run -d --name mongo --network myapp-network \
  -v mongo-data:/data/db mongo:7

# Redis chalao
docker run -d --name redis --network myapp-network \
  redis:alpine

# App chalao
docker run -d --name app --network myapp-network \
  -p 3000:3000 \
  -e MONGO_URI=mongodb://mongo:27017/mydb \
  -e REDIS_URL=redis://redis:6379 \
  my-express-app
```

> **Warning:** Teen containers ke liye 3 lambe commands! Agar 10 services hon to? 10 commands yaad rakhoge? Network manually banayoge? Stop karne ke liye ek-ek karke band karoge? Ye bahut tedious hai!

### Docker Compose = Ek File, Ek Command

```bash
# Docker Compose se:
docker-compose up      # Sab start
docker-compose down    # Sab stop + cleanup

# Bas! Ek command mein sab ho gaya!
```

> **Socho Aise:** Bina Docker Compose ke ye aise hai jaise tum ek-ek karke 10 appliances ka switch on karo. Docker Compose ek main switch hai — on karo, sab chal jaaye!

---

## docker-compose.yml — Sab Ek File Mein

### Basic Structure

```yaml
# docker-compose.yml
# Ye file project ki root directory mein hoti hai

version: '3.8'           # Compose file version

services:                 # Har container ek "service" hai
  app:                    # Service 1: Humara Express app
    build: .              # Current directory ka Dockerfile use karo
    ports:
      - "3000:3000"       # Port mapping
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/kisanbazaar
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo             # Pehle MongoDB start ho, phir app
      - redis             # Pehle Redis start ho, phir app

  mongo:                  # Service 2: MongoDB
    image: mongo:7        # Docker Hub se ready image
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db    # Data persist karo

  redis:                  # Service 3: Redis
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:                  # Named volumes define karo
  mongo-data:             # MongoDB data yahan persist hoga
```

> **Yaad Rakho:** `docker-compose.yml` mein services ke naam (`app`, `mongo`, `redis`) hi container ke hostname ban jaate hain. Matlab app container se `mongodb://mongo:27017` se MongoDB connect hoga — `mongo` naam se!

---

## Docker Compose Key Concepts

### 1. Services — Containers

Har service ek container hai. Do tarike se define kar sakte hain:

```yaml
services:
  # Method 1: Dockerfile se build karo (humara app)
  app:
    build: .                   # Current dir ka Dockerfile
    # ya
    build:
      context: .               # Build context
      dockerfile: Dockerfile   # Kaunsa Dockerfile

  # Method 2: Ready image use karo (database, cache)
  mongo:
    image: mongo:7             # Docker Hub se image
  
  redis:
    image: redis:alpine
```

### 2. Volumes — Data Persist Karo

Container delete hone pe uska data bhi delete ho jaata hai. Volumes se data persist hota hai.

```yaml
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db      # Named volume — data safe rahega
      # Container delete hone pe bhi data safe!

  app:
    build: .
    volumes:
      - ./src:/app/src            # Bind mount — host file = container file
      # Host pe code change karo, container mein turant reflect ho!

volumes:
  mongo-data:                     # Named volume define karo
```

```
Volume Types:

1. Named Volume (mongo-data:/data/db)
   - Docker manage karta hai
   - Container delete pe bhi data safe
   - Database ke liye best

2. Bind Mount (./src:/app/src)
   - Host directory directly mount
   - Development mein useful — hot reload!
   - Code changes turant container mein reflect
```

> **Socho Aise:** Named Volume = bank locker (safe, Docker manage karta hai). Bind Mount = apna briefcase jo ghar aur office dono jagah le jaao (host aur container share).

### 3. Networks — Services Kaise Baat Karein

```yaml
# Docker Compose automatically ek network banata hai
# Sab services us network mein hoti hain
# Service naam hi hostname hai

services:
  app:
    environment:
      # 'mongo' service ka naam use karo hostname ki jagah
      - MONGO_URI=mongodb://mongo:27017/kisanbazaar
      # 'redis' service ka naam use karo
      - REDIS_URL=redis://redis:6379

  mongo:
    image: mongo:7
    # Automatically same network mein hai

  redis:
    image: redis:alpine
    # Automatically same network mein hai
```

> **Tip:** Docker Compose automatically ek default network banata hai. Manually network define karne ki zaroorat nahi usually. Services ek doosre ko naam se access kar sakti hain!

### 4. depends_on — Start Order

```yaml
services:
  app:
    depends_on:
      - mongo       # Pehle MongoDB start ho
      - redis       # Pehle Redis start ho
    # Phir app start hoga

  mongo:
    image: mongo:7

  redis:
    image: redis:alpine
```

> **Warning:** `depends_on` sirf container START ka order decide karta hai — ye guarantee nahi karta ki MongoDB READY hai. MongoDB start hone mein 2-3 seconds lagte hain. App mein retry logic hona chahiye!

### 5. Environment Variables

```yaml
services:
  app:
    # Method 1: Directly define
    environment:
      - NODE_ENV=development
      - PORT=3000
    
    # Method 2: .env file se load
    env_file:
      - .env

    # Method 3: Both combine
    env_file:
      - .env           # Base variables
    environment:
      - NODE_ENV=development   # Override karo
```

---

## Docker Compose Commands

```bash
# Sab services start karo (foreground — logs dikhenge)
docker-compose up

# Background mein start karo
docker-compose up -d

# Image rebuild karke start karo (code change ke baad)
docker-compose up -d --build

# Sab stop karo + containers delete karo
docker-compose down

# Stop + volumes bhi delete karo (DB data bhi jaayega!)
docker-compose down -v

# Status dekho
docker-compose ps

# Logs dekho
docker-compose logs
docker-compose logs app        # Sirf app ke logs
docker-compose logs -f app     # Follow mode

# Ek service restart karo
docker-compose restart app

# Container ke andar jaao
docker-compose exec app sh
docker-compose exec mongo mongosh    # MongoDB shell
```

> **Yaad Rakho:** `docker-compose down -v` se volumes bhi delete ho jaate hain — matlab database ka sara data gayab! Bahut carefully use karo.

---

## Development Workflow with Docker

### Hot Reload Setup — Code Change Pe Auto Restart

```yaml
# docker-compose.yml — Development ke liye
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/kisanbazaar
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./src:/app/src           # Source code mount karo
      - ./package.json:/app/package.json
    command: npx nodemon src/app.js   # Nodemon se hot reload!
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  mongo-data:
```

```
Development Workflow:

1. docker-compose up -d        # Start sab services
2. Code edit karo VS Code mein  # Host pe edit karo
3. Nodemon auto-restart karta hai  # Container mein changes reflect
4. Browser refresh karo          # Naya code chal raha hai!
5. docker-compose down           # Kaam khatam, sab band
```

> **Tip:** Development mein `nodemon` + bind mount = best combo! Code save karo, server auto-restart ho, testing karo. Docker ke saath bhi smooth development!

---

## Quick Revision Table

| Concept | Explanation |
|---------|------------|
| Docker Compose | Multiple containers ko ek file se manage karo |
| `docker-compose.yml` | Sab services, volumes, networks define karo |
| Services | Har container ek service — `build` ya `image` se |
| Volumes | Data persist karo — named volume ya bind mount |
| Networks | Auto-created — services naam se access karein |
| `depends_on` | Container start order decide karo |
| `docker-compose up -d` | Sab start karo background mein |
| `docker-compose down` | Sab stop + cleanup |
| `--build` | Code change ke baad image rebuild karo |
| Hot Reload | Bind mount + nodemon = development mein auto-restart |

---

## Aaj Kya Seekha?

1. **Docker Compose** multiple containers ko ek `yml` file se manage karta hai
2. **Services** mein `build` (Dockerfile) ya `image` (ready image) use karo
3. **Volumes** se data persist hota hai — container delete pe bhi safe
4. **Named Volume** database ke liye, **Bind Mount** development ke liye
5. Services ek doosre ko **naam se access** karti hain (hostname = service name)
6. **`depends_on`** start order decide karta hai lekin "ready" guarantee nahi deta
7. Development mein **nodemon + bind mount** se smooth hot reload milta hai
