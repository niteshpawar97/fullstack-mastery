# Day 60 - Evening: Phase 3 Preview + Self-Assessment Quiz (REVISION DAY)

> **Aaj ka plan:**
> Phase 3 ka roadmap dekhenge — System Design, Docker, AWS, CI/CD kya hai aur kyun zaroori hai. Phir ek comprehensive self-assessment quiz karenge Phase 2 ke saare topics pe.

---

## Phase 3 Preview ��� Kya Aane Wala Hai?

> **Socho Aise:**
> Phase 2 mein tumne ek building banayi (backend API). Phase 3 mein tum us building ko production mein deploy karoge, scale karoge, aur millions of users ke liye ready karoge. Builder se Architect banoge!

---

## 1. System Design Basics

System Design = Bade systems kaise design karte hain.

```
User Request --> Load Balancer --> Server 1 / Server 2 / Server 3
                                       |
                                   Database (Primary)
                                       |
                                   Database (Replica)
                                       |
                                   Cache (Redis)
```

### Kya Seekhenge:
- **Monolith vs Microservices** — ek bada server ya bahut saare chhote
- **Load Balancing** — traffic ko multiple servers pe distribute karo
- **Caching** — Redis se frequently accessed data fast serve karo
- **Message Queues** — RabbitMQ/Redis se background tasks handle karo
- **Database Scaling** — Sharding, Replication, Read Replicas

> **Socho Aise:**
> Ek chai ki dukaan (monolith) vs ek food court (microservices). Chai ki dukaan mein sab ek jagah hota hai. Food court mein har counter alag hai — pizza counter, juice counter, chat counter. Bade scale pe food court model better hai.

---

## 2. Docker — Containerization

Docker = Tumhare app ko ek box (container) mein pack karo — jahan bhi chalao, same chalega.

```dockerfile
# Dockerfile — app ko container mein pack karo
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```bash
# Build karo
docker build -t my-api .

# Run karo
docker run -p 3000:3000 my-api

# Docker Compose — multiple containers
docker-compose up  # API + MongoDB + Redis sab ek command se
```

### Kya Seekhenge:
- Docker basics — images, containers, volumes
- Dockerfile likhna
- Docker Compose — multi-container apps
- Docker networking

> **Socho Aise:**
> Socho tumne ek dabba (container) mein tumhara app + uski saari dependencies pack kar diya. Ab yeh dabba kisi bhi computer pe same chalega — "Mere laptop pe toh chal raha tha" problem khatam!

---

## 3. AWS (Amazon Web Services) — Cloud Deployment

```
AWS Services we'll use:
├── EC2 — Virtual servers (compute)
├── S3 — File storage (images, static)
├── RDS — Managed database
├── ElastiCache — Redis caching
├── ECR — Docker image registry
├── ECS/EKS — Container orchestration
├── Route 53 — DNS management
├── CloudFront — CDN
└── IAM — Access management
```

### Kya Seekhenge:
- EC2 pe server deploy karna
- S3 pe files store karna
- RDS pe managed database
- Basic AWS architecture
- Cost optimization

> **Socho Aise:**
> AWS ek bahut bada shopping mall hai jahan tum rooms (EC2), storage (S3), databases (RDS) rent pe le sakte ho. Apna server khareedne ki zaroorat nahi — jitna use karo utna pay karo.

---

## 4. CI/CD — Continuous Integration / Continuous Deployment

```yaml
# Workflow: Code Push --> Test --> Build --> Deploy (automatic!)
Push Code
  --> GitHub Actions run tests
    --> Build Docker image
      --> Push to ECR
        --> Deploy to ECS
          --> Users ko naya version milta hai

# Rollback bhi automatic
Tests fail --> Deployment ruk jaata hai --> Purana version safe
```

### Kya Seekhenge:
- GitHub Actions advanced workflows
- Docker image build & push
- Automatic deployment pipeline
- Blue/Green deployment
- Rollback strategy

> **Socho Aise:**
> CI/CD = Assembly line in a factory. Tum code likho, baaki sab automatic — testing, building, deploying. Manual deployment = risk. Automated deployment = safe, fast, consistent.

---

## 5. Phase 3 Complete Roadmap

| Week | Topics |
|---|---|
| Week 9 | System Design basics, Caching (Redis), Message Queues |
| Week 10 | Docker fundamentals, Docker Compose, Multi-container apps |
| Week 11 | AWS basics — EC2, S3, RDS, deployment |
| Week 12 | CI/CD pipeline, monitoring, logging, Phase 3 project |

---

## Self-Assessment Quiz

> **Practice Time!**
> Yeh quiz khud se attempt karo. Answers neeche hain — pehle khud try karo!

### Section 1: Express & REST API (10 Questions)

**Q1:** Express mein middleware kya hota hai?
- A) Database query
- B) Request-response cycle mein function jo next() call karta hai
- C) HTML template
- D) CSS file

**Q2:** `app.use(express.json())` kya karta hai?
- A) JSON file read karta hai
- B) Request body ko JSON se JavaScript object mein parse karta hai
- C) Response ko JSON mein convert karta hai
- D) JSON validation karta hai

**Q3:** HTTP status 201 ka matlab kya hai?
- A) OK
- B) Created — resource ban gaya
- C) Not Found
- D) Server Error

**Q4:** REST API mein user delete karne ke liye kaunsa method use hoga?
- A) GET /api/users/:id
- B) POST /api/users/:id/delete
- C) DELETE /api/users/:id
- D) PUT /api/users/:id

**Q5:** Error handling middleware mein kitne parameters hote hain?
- A) 2 (req, res)
- B) 3 (req, res, next)
- C) 4 (err, req, res, next)
- D) 1 (error)

### Section 2: Database & Auth (10 Questions)

**Q6:** Mongoose mein `populate()` kya karta hai?
- A) Data delete karta hai
- B) Referenced document ko fetch karke join karta hai
- C) Index create karta hai
- D) Schema validate karta hai

**Q7:** bcrypt mein salt rounds 12 ka matlab?
- A) 12 baar password type karo
- B) 12 characters ka salt
- C) 2^12 rounds of hashing — slow but secure
- D) 12 users tak limit

**Q8:** JWT token mein kya store karna chahiye?
- A) Password + email
- B) Sirf user id aur role
- C) Poora user object
- D) Credit card number

**Q9:** `select: false` password field pe lagane se kya hota hai?
- A) Password save nahi hota
- B) Query result mein by default password nahi aata
- C) Password encrypted ho jaata hai
- D) Password required nahi rehta

**Q10:** MongoDB mein text search ke liye kya chahiye?
- A) Regular expression
- B) Text index create karna padta hai
- C) SQL LIKE query
- D) Full table scan

### Section 3: Advanced Topics (10 Questions)

**Q11:** Rate limiting ka purpose kya hai?
- A) Response fast karna
- B) Brute force aur abuse se bachana
- C) Data compress karna
- D) Caching improve karna

**Q12:** Helmet.js kya karta hai?
- A) CSS framework hai
- B) Security HTTP headers set karta hai
- C) Password hash karta hai
- D) File compress karta hai

**Q13:** WebSocket ka HTTP se kya fark hai?
- A) WebSocket sirf server se client bhej sakta hai
- B) WebSocket persistent bidirectional connection hai
- C) WebSocket REST replace karta hai
- D) WebSocket mein authentication nahi hoti

**Q14:** Linked List mein insert at head ki time complexity kya hai?
- A) O(n)
- B) O(log n)
- C) O(1)
- D) O(n^2)

**Q15:** BST mein inorder traversal kya deta hai?
- A) Random order
- B) Reverse order
- C) Sorted (ascending) order
- D) Level order

---

## Quiz Answers

```
Section 1:
Q1: B — Middleware = function in request-response cycle
Q2: B — JSON body ko parse karta hai
Q3: B — 201 = Created
Q4: C — DELETE method use hota hai
Q5: C — 4 parameters (err, req, res, next)

Section 2:
Q6: B — Referenced documents join karta hai
Q7: C — 2^12 = 4096 rounds of hashing
Q8: B — Sirf id aur role — sensitive data nahi
Q9: B �� Default queries mein password nahi aata
Q10: B — Text index chahiye ($text search ke liye)

Section 3:
Q11: B — Brute force aur API abuse prevention
Q12: B — Security headers (X-Frame-Options, CSP, etc.)
Q13: B — Persistent bidirectional connection
Q14: C — O(1) — sirf pointer change
Q15: C — Sorted ascending order
```

### Score Calculator

| Score | Level | Action |
|---|---|---|
| 13-15 | Expert! | Phase 3 ke liye ready ho |
| 10-12 | Good | Weak topics revise karo |
| 7-9 | Average | Phase 2 dubara padho |
| Below 7 | Needs Work | Phase 2 se restart karo |

---

## Phase 2 Achievement Unlocked!

```
Tumne yeh sab build kiya:
 ✓ Complete REST API with Express
 ✓ MongoDB database with Mongoose
 ✓ JWT Authentication + Role-based access
 ✓ Input Validation with Joi
 ✓ Pagination, Filter, Search, Sort
 ✓ File Upload with Multer
 ✓ Real-time features with WebSocket
 ✓ Security (Helmet, CORS, Rate Limiting)
 ✓ API Documentation with Swagger
 ✓ Git Team Workflow
 ✓ DSA Fundamentals
 ✓ E-Commerce API Project
```

> **Yaad Rakho:**
> Tum ab ek capable backend developer ho. Tumhe APIs banana, secure karna, document karna — sab aata hai. Phase 3 mein isko production-level pe le jaayenge with Docker, AWS, aur System Design. Keep going!

---

## Quick Revision

| Phase | Focus | Key Skills |
|---|---|---|
| Phase 1 | Foundation | JavaScript, Node.js, npm |
| Phase 2 | Backend Mastery | Express, MongoDB, Auth, WebSocket, Security |
| Phase 3 | Production & Scale | System Design, Docker, AWS, CI/CD |
| Phase 4 | Frontend | React, State Management, Full Stack |

---

## Aaj Kya Seekha?

1. Phase 3 preview — System Design, Docker, AWS, CI/CD
2. Docker samjha — containerization ka concept
3. AWS overview — cloud services kya kya hain
4. CI/CD — automatic testing aur deployment
5. Self-assessment quiz attempt kiya — 15 questions
6. Phase 2 complete! Backend mastery achieved!
