// Auto-discover all markdown content files
const contentModules = import.meta.glob('./content/day-*/*.md', { eager: true, query: '?raw', import: 'default' });

function getContent(day, session) {
  const padded = String(day).padStart(3, '0');
  return contentModules[`./content/day-${padded}/${session}.md`] || '# Coming Soon\n\nYe content jaldi aane wala hai. Stay tuned!';
}

export const phases = [
  {
    id: 'phase-1',
    title: 'Phase 1: Basic Foundation',
    titleHi: 'फेज 1: बेसिक फाउंडेशन',
    icon: '🌱',
    color: '#6366f1',
    dayRange: [1, 30],
    description: {
      en: 'JavaScript basics, Git basics, Basic DSA, Node.js intro, SQL basics, MongoDB basics, Linux commands',
      hi: 'JavaScript बेसिक्स, Git बेसिक्स, बेसिक DSA, Node.js इंट्रो, SQL बेसिक्स, MongoDB बेसिक्स, Linux कमांड्स'
    }
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Building Phase',
    titleHi: 'फेज 2: बिल्डिंग फेज',
    icon: '🔨',
    color: '#059669',
    dayRange: [31, 60],
    description: {
      en: 'Advanced JS, Express.js, REST API, DB Design, JWT Auth, API Validation (Joi/Zod), Pagination & Search, File Upload, WebSocket, MQTT',
      hi: 'Advanced JS, Express.js, REST API, DB डिज़ाइन, JWT Auth, API Validation, Pagination & Search, File Upload, WebSocket, MQTT'
    }
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Advanced + Production',
    titleHi: 'फेज 3: एडवांस्ड + प्रोडक्शन',
    icon: '🚀',
    color: '#d97706',
    dayRange: [61, 90],
    description: {
      en: 'System Design (Monolith/Modular/Microservices), Redis, Docker, AWS, CI/CD, Nginx, PM2, Background Jobs, Security Hardening, Testing, Logging, Debugging, API Docs, Design Patterns, Clean Code, React.js',
      hi: 'सिस्टम डिज़ाइन, Redis, Docker, AWS, CI/CD, Nginx, PM2, Background Jobs, Security, Testing, Logging, Debugging, API Docs, Design Patterns, Clean Code, React.js'
    }
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Advanced Backend',
    titleHi: 'फेज 4: एडवांस्ड बैकेंड',
    icon: '💎',
    color: '#7c3aed',
    dayRange: [91, 120],
    isOptional: true,
    description: {
      en: 'TypeScript, GraphQL, Microservices Deep Dive, Message Queues (RabbitMQ/Kafka), Kubernetes, Performance Optimization, Advanced Redis, Webhooks, Resilience Patterns',
      hi: 'TypeScript, GraphQL, Microservices Deep Dive, Message Queues (RabbitMQ/Kafka), Kubernetes, Performance Optimization, Advanced Redis, Webhooks, Resilience Patterns'
    }
  }
];

export const days = [
  // ============================= PHASE 1: Basic Foundation (Day 1-30) =============================
  // --- Week 1: JS Basics + Git + Linux ---
  makeDayFull(1, 'phase-1',
    { en: 'JavaScript Intro & Dev Setup', hi: 'JavaScript इंट्रो & Dev Setup' },
    ['javascript', 'git', 'linux'],
    { en: 'JavaScript Introduction & Dev Environment', hi: 'JavaScript इंट्रोडक्शन & Dev Environment' }, ['javascript', 'linux'],
    { en: 'First JS Program + Git Init + Terminal', hi: 'पहला JS प्रोग्राम + Git Init + Terminal' }, ['javascript', 'git', 'linux'],
    { en: 'Can write basic JS, use terminal, initialize Git repo', hi: 'बेसिक JS लिख सकता है, terminal use कर सकता है, Git repo बना सकता है' }
  ),
  makeDayFull(2, 'phase-1',
    { en: 'Operators, Conditions & Strings', hi: 'Operators, Conditions & Strings' },
    ['javascript', 'git'],
    { en: 'Operators, Conditions & String Methods', hi: 'Operators, Conditions & String Methods' }, ['javascript'],
    { en: 'Conditions & Strings Practice', hi: 'Conditions & Strings Practice' }, ['javascript', 'git'],
    { en: 'Can use operators, write conditions, manipulate strings', hi: 'Operators, conditions aur string methods use kar sakta hai' }
  ),
  makeDayFull(3, 'phase-1',
    { en: 'Arrays & Loops', hi: 'Arrays & Loops' },
    ['javascript', 'linux'],
    { en: 'Arrays & Loops — Data Collections', hi: 'Arrays & Loops — Data Collections' }, ['javascript'],
    { en: 'Arrays & Loops Practice', hi: 'Arrays & Loops Practice' }, ['javascript', 'linux'],
    { en: 'Can work with arrays, use loops, apply map/filter/reduce', hi: 'Arrays, loops, map/filter/reduce use kar sakta hai' }
  ),
  // Days 4-30 via helper
  ...makeDays('phase-1', [
    { day: 4, title: { en: 'Functions & Scope', hi: 'Functions & Scope' }, tags: ['javascript', 'git'] },
    { day: 5, title: { en: 'Objects & JSON', hi: 'Objects & JSON' }, tags: ['javascript', 'git'] },
    { day: 6, title: { en: 'DOM Basics + Git Branching', hi: 'DOM Basics + Git Branching' }, tags: ['javascript', 'git'] },
    { day: 7, title: { en: 'Week 1 Revision + Mini Project', hi: 'Week 1 Revision + Mini Project' }, tags: ['javascript', 'git'], isRevision: true, isMiniProject: true },
    // --- Week 2: SQL + MongoDB + Node.js ---
    { day: 8, title: { en: 'SQL Basics — CREATE, INSERT, SELECT', hi: 'SQL Basics — CREATE, INSERT, SELECT' }, tags: ['database', 'linux'] },
    { day: 9, title: { en: 'SQL Joins, Subqueries & Aggregates', hi: 'SQL Joins, Subqueries & Aggregates' }, tags: ['database', 'javascript'] },
    { day: 10, title: { en: 'MongoDB Intro + CRUD', hi: 'MongoDB Intro + CRUD' }, tags: ['database', 'javascript'] },
    { day: 11, title: { en: 'Node.js Introduction', hi: 'Node.js Introduction' }, tags: ['nodejs', 'javascript'] },
    { day: 12, title: { en: 'Node.js File System + Modules', hi: 'Node.js File System + Modules' }, tags: ['nodejs', 'linux'] },
    { day: 13, title: { en: 'HTTP Basics + First Server', hi: 'HTTP Basics + First Server' }, tags: ['nodejs', 'api'] },
    { day: 14, title: { en: 'Week 2 Revision + Mini Project', hi: 'Week 2 Revision + Mini Project' }, tags: ['nodejs', 'database'], isRevision: true, isMiniProject: true },
    // --- Week 3: DSA + Advanced JS ---
    { day: 15, title: { en: 'DSA — Arrays & Searching', hi: 'DSA — Arrays & Searching' }, tags: ['dsa', 'javascript'] },
    { day: 16, title: { en: 'DSA — Sorting Algorithms', hi: 'DSA — Sorting Algorithms' }, tags: ['dsa', 'javascript'] },
    { day: 17, title: { en: 'DSA — Stack & Queue', hi: 'DSA �� Stack & Queue' }, tags: ['dsa', 'javascript'] },
    { day: 18, title: { en: 'Git Advanced — Merge, Rebase, Conflicts', hi: 'Git Advanced — Merge, Rebase, Conflicts' }, tags: ['git', 'linux'] },
    { day: 19, title: { en: 'JS Advanced — Closures & Callbacks', hi: 'JS Advanced — Closures & Callbacks' }, tags: ['javascript', 'nodejs'] },
    { day: 20, title: { en: 'JS Advanced — Promises & Async/Await', hi: 'JS Advanced — Promises & Async/Await' }, tags: ['javascript', 'nodejs'] },
    { day: 21, title: { en: 'Week 3 Revision + Mini Project', hi: 'Week 3 Revision + Mini Project' }, tags: ['javascript', 'dsa'], isRevision: true, isMiniProject: true },
    // --- Week 4: Advanced JS + Linux + Phase 1 Project ---
    { day: 22, title: { en: 'Error Handling + Debugging Basics', hi: 'Error Handling + Debugging Basics' }, tags: ['javascript', 'debugging'] },
    { day: 23, title: { en: 'npm & Package Management', hi: 'npm & Package Management' }, tags: ['nodejs', 'linux'] },
    { day: 24, title: { en: 'ES6+ Modern JavaScript', hi: 'ES6+ Modern JavaScript' }, tags: ['javascript', 'git'] },
    { day: 25, title: { en: 'OOP in JavaScript', hi: 'OOP in JavaScript' }, tags: ['javascript', 'database'] },
    { day: 26, title: { en: 'Event Loop & Async Patterns', hi: 'Event Loop & Async Patterns' }, tags: ['javascript', 'nodejs'] },
    { day: 27, title: { en: 'Linux Deep Dive + Shell Scripting', hi: 'Linux Deep Dive + Shell Scripting' }, tags: ['linux', 'git'] },
    { day: 28, title: { en: 'Week 4 Revision + Phase 1 Project', hi: 'Week 4 Revision + Phase 1 Project' }, tags: ['javascript', 'nodejs', 'database'], isRevision: true, isMiniProject: true },
    { day: 29, title: { en: 'Phase 1 Project: Backend CLI Tool', hi: 'Phase 1 Project: Backend CLI Tool' }, tags: ['javascript', 'nodejs', 'database'], isMiniProject: true },
    { day: 30, title: { en: 'Phase 1 Project Completion + Review', hi: 'Phase 1 Project Completion + Review' }, tags: ['javascript', 'nodejs', 'git'], isRevision: true, isMiniProject: true },
  ]),

  // ============================= PHASE 2: Building Phase (Day 31-60) =============================
  ...makeDays('phase-2', [
    // --- Week 5: Express.js + REST API ---
    { day: 31, title: { en: 'Express.js Introduction', hi: 'Express.js Introduction' }, tags: ['expressjs', 'nodejs'] },
    { day: 32, title: { en: 'Express Routing & Middleware', hi: 'Express Routing & Middleware' }, tags: ['expressjs', 'nodejs'] },
    { day: 33, title: { en: 'REST API Design + Versioning + Response Format', hi: 'REST API Design + Versioning + Response Format' }, tags: ['api', 'expressjs'] },
    { day: 34, title: { en: 'CRUD API with Express + MongoDB', hi: 'CRUD API with Express + MongoDB' }, tags: ['api', 'database', 'expressjs'] },
    { day: 35, title: { en: 'CRUD API with Express + SQL', hi: 'CRUD API with Express + SQL' }, tags: ['api', 'database', 'expressjs'] },
    { day: 36, title: { en: 'Database Design, Relations & Soft Delete', hi: 'Database Design, Relations & Soft Delete' }, tags: ['db-design', 'database'] },
    { day: 37, title: { en: 'Week 6 Revision + API Project', hi: 'Week 6 Revision + API Project' }, tags: ['api', 'expressjs'], isRevision: true, isMiniProject: true },
    // --- Week 6: Auth + Validation + File Upload ---
    { day: 38, title: { en: 'Authentication — JWT + Sessions + Cookies', hi: 'Authentication — JWT + Sessions + Cookies' }, tags: ['auth', 'api'] },
    { day: 39, title: { en: 'Auth System — Register/Login + Role-based', hi: 'Auth System — Register/Login + Role-based' }, tags: ['auth', 'expressjs'] },
    { day: 40, title: { en: 'Auth Middleware + Password Reset + Email', hi: 'Auth Middleware + Password Reset + Email' }, tags: ['auth', 'expressjs'] },
    { day: 41, title: { en: 'Validation — Joi/Zod + DB Constraints + Error Handler', hi: 'Validation — Joi/Zod + DB Constraints + Error Handler' }, tags: ['validation', 'expressjs'] },
    { day: 42, title: { en: 'Pagination, Filtering & Search APIs', hi: 'Pagination, Filtering & Search APIs' }, tags: ['pagination', 'api', 'expressjs'] },
    { day: 43, title: { en: 'File Upload — Multer + S3 Basics', hi: 'File Upload — Multer + S3 Basics' }, tags: ['file-upload', 'api'] },
    { day: 44, title: { en: 'Week 7 Revision + Auth Project', hi: 'Week 7 Revision + Auth Project' }, tags: ['auth', 'validation', 'api'], isRevision: true, isMiniProject: true },
    // --- Week 7: WebSocket + MQTT ---
    { day: 45, title: { en: 'WebSocket Introduction', hi: 'WebSocket Introduction' }, tags: ['websocket', 'nodejs'] },
    { day: 46, title: { en: 'Real-time Chat with WebSocket', hi: 'Real-time Chat with WebSocket' }, tags: ['websocket', 'database'] },
    { day: 47, title: { en: 'MQTT Introduction + IoT Basics', hi: 'MQTT Introduction + IoT Basics' }, tags: ['mqtt', 'nodejs'] },
    { day: 48, title: { en: 'MQTT with Node.js + QoS + Topics', hi: 'MQTT with Node.js + QoS + Topics' }, tags: ['mqtt', 'nodejs'] },
    { day: 49, title: { en: 'Advanced MongoDB — Aggregation + Mongoose Deep', hi: 'Advanced MongoDB — Aggregation + Mongoose Deep' }, tags: ['database', 'api'] },
    { day: 50, title: { en: 'DB Transactions, ACID, Indexing & Scaling', hi: 'DB Transactions, ACID, Indexing & Scaling' }, tags: ['database', 'db-design'] },
    { day: 51, title: { en: 'Week 8 Revision + Real-time Project', hi: 'Week 8 Revision + Real-time Project' }, tags: ['websocket', 'mqtt'], isRevision: true, isMiniProject: true },
    // --- Week 8: DSA + Git + Env + API Docs ---
    { day: 52, title: { en: 'DSA — Linked Lists', hi: 'DSA — Linked Lists' }, tags: ['dsa', 'javascript'] },
    { day: 53, title: { en: 'DSA — Trees & Graphs Basics', hi: 'DSA — Trees & Graphs Basics' }, tags: ['dsa', 'javascript'] },
    { day: 54, title: { en: 'Git Team Workflow — PR, Review, CI', hi: 'Git Team Workflow — PR, Review, CI' }, tags: ['git', 'cicd'] },
    { day: 55, title: { en: 'Env Config + Security + Cron Jobs', hi: 'Env Config + Security + Cron Jobs' }, tags: ['env-config', 'auth', 'bg-jobs'] },
    { day: 56, title: { en: 'API Docs + Webhooks + Testing Intro', hi: 'API Docs + Webhooks + Testing Intro' }, tags: ['api-docs', 'api', 'testing'] },
    { day: 57, title: { en: 'Phase 2 Project: Full API System', hi: 'Phase 2 Project: Full API System' }, tags: ['api', 'auth', 'database', 'validation'], isMiniProject: true },
    { day: 58, title: { en: 'Phase 2 Project: WebSocket + File Upload', hi: 'Phase 2 Project: WebSocket + File Upload' }, tags: ['api', 'websocket', 'file-upload'], isMiniProject: true },
    { day: 59, title: { en: 'Phase 2 Project: Testing + Docs', hi: 'Phase 2 Project: Testing + Docs' }, tags: ['api', 'testing', 'api-docs'], isMiniProject: true },
    { day: 60, title: { en: 'Phase 2 Review + Phase 3 Preview', hi: 'Phase 2 Review + Phase 3 Preview' }, tags: ['api', 'system-design'], isRevision: true },
  ]),

  // ============================= PHASE 3: Advanced + Production (Day 61-90) =============================
  ...makeDays('phase-3', [
    // --- Week 9: System Design + Docker ---
    { day: 61, title: { en: 'System Design — Monolithic Architecture', hi: 'System Design — Monolithic Architecture' }, tags: ['system-design', 'api'] },
    { day: 62, title: { en: 'Modular Architecture + Microservices Intro', hi: 'Modular Architecture + Microservices Intro' }, tags: ['system-design', 'patterns'] },
    { day: 63, title: { en: 'Redis Caching', hi: 'Redis Caching' }, tags: ['system-design', 'database'] },
    { day: 64, title: { en: 'Docker Basics — Containers', hi: 'Docker Basics — Containers' }, tags: ['docker', 'linux'] },
    { day: 65, title: { en: 'Docker Compose + Multi-container', hi: 'Docker Compose + Multi-container' }, tags: ['docker', 'database'] },
    { day: 66, title: { en: 'AWS EC2 — Deploy First App', hi: 'AWS EC2 — Deploy First App' }, tags: ['aws', 'linux'] },
    { day: 67, title: { en: 'Week 10 Revision + Docker Project', hi: 'Week 10 Revision + Docker Project' }, tags: ['docker', 'aws'], isRevision: true, isMiniProject: true },
    // --- Week 10: Nginx + PM2 + CI/CD + AWS ---
    { day: 68, title: { en: 'Nginx — Reverse Proxy + SSL', hi: 'Nginx — Reverse Proxy + SSL' }, tags: ['nginx-pm2', 'linux'] },
    { day: 69, title: { en: 'PM2 + Graceful Shutdown', hi: 'PM2 + Graceful Shutdown' }, tags: ['nginx-pm2', 'nodejs'] },
    { day: 70, title: { en: 'CI/CD with GitHub Actions', hi: 'CI/CD with GitHub Actions' }, tags: ['cicd', 'git'] },
    { day: 71, title: { en: 'AWS S3 + RDS', hi: 'AWS S3 + RDS' }, tags: ['aws', 'database'] },
    { day: 72, title: { en: 'AWS IAM + Route53 + CloudWatch', hi: 'AWS IAM + Route53 + CloudWatch' }, tags: ['aws', 'logging'] },
    { day: 73, title: { en: 'AWS Lambda + Background Jobs (Bull/Redis)', hi: 'AWS Lambda + Background Jobs (Bull/Redis)' }, tags: ['aws', 'bg-jobs'] },
    { day: 74, title: { en: 'Week 11 Revision + Deployment Project', hi: 'Week 11 Revision + Deployment Project' }, tags: ['aws', 'docker', 'cicd'], isRevision: true, isMiniProject: true },
    // --- Week 11: Testing + Logging + Debugging + Patterns ---
    { day: 75, title: { en: 'Testing — Unit Tests with Jest', hi: 'Testing — Unit Tests with Jest' }, tags: ['testing', 'javascript'] },
    { day: 76, title: { en: 'Testing — API Tests + Integration', hi: 'Testing — API Tests + Integration' }, tags: ['testing', 'api'] },
    { day: 77, title: { en: 'Logging — Winston + Morgan', hi: 'Logging — Winston + Morgan' }, tags: ['logging', 'nodejs'] },
    { day: 78, title: { en: 'Debugging Techniques + Monitoring + Health Checks', hi: 'Debugging Techniques + Monitoring + Health Checks' }, tags: ['debugging', 'logging'] },
    { day: 79, title: { en: 'Design Patterns — Singleton, Factory, Observer', hi: 'Design Patterns — Singleton, Factory, Observer' }, tags: ['patterns', 'nodejs'] },
    { day: 80, title: { en: 'Clean Code & Folder Structure', hi: 'Clean Code & Folder Structure' }, tags: ['clean-code', 'patterns'] },
    { day: 81, title: { en: 'Week 12 Revision + Production Setup', hi: 'Week 12 Revision + Production Setup' }, tags: ['testing', 'logging', 'debugging'], isRevision: true, isMiniProject: true },
    // --- Week 12-13: React.js + Final Project ---
    { day: 82, title: { en: 'React.js — Intro + JSX + Components', hi: 'React.js — Intro + JSX + Components' }, tags: ['react', 'javascript'] },
    { day: 83, title: { en: 'React — State, Props, Events', hi: 'React — State, Props, Events' }, tags: ['react', 'javascript'] },
    { day: 84, title: { en: 'React — useEffect + API Integration (Axios)', hi: 'React — useEffect + API Integration (Axios)' }, tags: ['react', 'api'] },
    { day: 85, title: { en: 'React — Routing + Forms', hi: 'React — Routing + Forms' }, tags: ['react', 'api'] },
    { day: 86, title: { en: 'Admin Dashboard — Backend APIs', hi: 'Admin Dashboard — Backend APIs' }, tags: ['react', 'api', 'auth'] },
    { day: 87, title: { en: 'Admin Dashboard — Frontend', hi: 'Admin Dashboard — Frontend' }, tags: ['react', 'api'] },
    { day: 88, title: { en: 'Final Project: Full Stack App', hi: 'Final Project: Full Stack App' }, tags: ['react', 'api', 'docker', 'aws'], isMiniProject: true },
    { day: 89, title: { en: 'Final Project: Deploy + CI/CD', hi: 'Final Project: Deploy + CI/CD' }, tags: ['docker', 'aws', 'cicd'], isMiniProject: true },
    { day: 90, title: { en: 'Course Completion + Career Guide', hi: 'Course Completion + Career Guide' }, tags: ['system-design', 'clean-code'], isRevision: true },
  ]),

  // ============================= PHASE 4: Advanced Backend — BONUS (Day 91-120) =============================
  ...makeDays('phase-4', [
    // --- Week 14: TypeScript ---
    { day: 91, title: { en: 'TypeScript Intro — Types, Interfaces, Enums', hi: 'TypeScript Intro — Types, Interfaces, Enums' }, tags: ['typescript', 'javascript'] },
    { day: 92, title: { en: 'TypeScript with Node.js + Express', hi: 'TypeScript with Node.js + Express' }, tags: ['typescript', 'expressjs'] },
    { day: 93, title: { en: 'TypeScript Advanced — Generics, Utility Types', hi: 'TypeScript Advanced — Generics, Utility Types' }, tags: ['typescript', 'nodejs'] },
    { day: 94, title: { en: 'Migrate JS Project to TypeScript', hi: 'Migrate JS Project to TypeScript' }, tags: ['typescript', 'api'] },
    { day: 95, title: { en: 'TypeScript + Mongoose/Prisma', hi: 'TypeScript + Mongoose/Prisma' }, tags: ['typescript', 'database'] },
    { day: 96, title: { en: 'TypeScript Best Practices + Linting', hi: 'TypeScript Best Practices + Linting' }, tags: ['typescript', 'clean-code'] },
    { day: 97, title: { en: 'Week 14 Revision + TS Mini Project', hi: 'Week 14 Revision + TS Mini Project' }, tags: ['typescript', 'api'], isRevision: true, isMiniProject: true },
    // --- Week 15: GraphQL + Microservices ---
    { day: 98, title: { en: 'GraphQL Intro — Schema, Queries, Mutations', hi: 'GraphQL Intro — Schema, Queries, Mutations' }, tags: ['graphql', 'api'] },
    { day: 99, title: { en: 'Apollo Server + Express + MongoDB', hi: 'Apollo Server + Express + MongoDB' }, tags: ['graphql', 'database'] },
    { day: 100, title: { en: 'GraphQL Advanced — Subscriptions, Auth, Pagination', hi: 'GraphQL Advanced — Subscriptions, Auth, Pagination' }, tags: ['graphql', 'auth'] },
    { day: 101, title: { en: 'Microservices Deep Dive — Service Design', hi: 'Microservices Deep Dive — Service Design' }, tags: ['microservices', 'system-design'] },
    { day: 102, title: { en: 'Inter-service Communication — REST + Message Queue', hi: 'Inter-service Communication — REST + Message Queue' }, tags: ['microservices', 'message-queue'] },
    { day: 103, title: { en: 'API Gateway Pattern + Service Discovery', hi: 'API Gateway Pattern + Service Discovery' }, tags: ['microservices', 'api'] },
    { day: 104, title: { en: 'Week 15 Revision + GraphQL API Project', hi: 'Week 15 Revision + GraphQL API Project' }, tags: ['graphql', 'microservices'], isRevision: true, isMiniProject: true },
    // --- Week 16: Message Queues + Kubernetes ---
    { day: 105, title: { en: 'RabbitMQ Intro — Queues, Exchanges, Bindings', hi: 'RabbitMQ Intro — Queues, Exchanges, Bindings' }, tags: ['message-queue', 'nodejs'] },
    { day: 106, title: { en: 'RabbitMQ with Node.js — Producer/Consumer', hi: 'RabbitMQ with Node.js — Producer/Consumer' }, tags: ['message-queue', 'api'] },
    { day: 107, title: { en: 'Kafka Basics — Topics, Partitions, Consumer Groups', hi: 'Kafka Basics — Topics, Partitions, Consumer Groups' }, tags: ['message-queue', 'system-design'] },
    { day: 108, title: { en: 'Kubernetes Intro — Pods, Deployments, Services', hi: 'Kubernetes Intro — Pods, Deployments, Services' }, tags: ['kubernetes', 'docker'] },
    { day: 109, title: { en: 'Kubernetes — ConfigMaps, Secrets, Ingress', hi: 'Kubernetes — ConfigMaps, Secrets, Ingress' }, tags: ['kubernetes', 'env-config'] },
    { day: 110, title: { en: 'Deploy App to Kubernetes (Minikube)', hi: 'Deploy App to Kubernetes (Minikube)' }, tags: ['kubernetes', 'docker'] },
    { day: 111, title: { en: 'Week 16 Revision + Queue Project', hi: 'Week 16 Revision + Queue Project' }, tags: ['message-queue', 'kubernetes'], isRevision: true, isMiniProject: true },
    // --- Week 17: Performance + Advanced Patterns + Final ---
    { day: 112, title: { en: 'Performance Optimization — Profiling, Memory Leaks', hi: 'Performance Optimization — Profiling, Memory Leaks' }, tags: ['nodejs', 'debugging'] },
    { day: 113, title: { en: 'Load Testing — Artillery/k6, Benchmarking', hi: 'Load Testing — Artillery/k6, Benchmarking' }, tags: ['testing', 'api'] },
    { day: 114, title: { en: 'Advanced Redis — Pub/Sub, Streams, Lua Scripts', hi: 'Advanced Redis — Pub/Sub, Streams, Lua Scripts' }, tags: ['database', 'system-design'] },
    { day: 115, title: { en: 'Webhooks + Event-Driven Architecture', hi: 'Webhooks + Event-Driven Architecture' }, tags: ['api', 'microservices'] },
    { day: 116, title: { en: 'Advanced Error Handling + Resilience (Circuit Breaker)', hi: 'Advanced Error Handling + Resilience (Circuit Breaker)' }, tags: ['patterns', 'nodejs'] },
    { day: 117, title: { en: 'Rate Limiting Advanced + API Throttling', hi: 'Rate Limiting Advanced + API Throttling' }, tags: ['auth', 'api'] },
    { day: 118, title: { en: 'Phase 4 Final Project: Microservices System', hi: 'Phase 4 Final Project: Microservices System' }, tags: ['microservices', 'typescript', 'message-queue', 'kubernetes'], isMiniProject: true },
    { day: 119, title: { en: 'Phase 4 Final Project: Deploy + Monitor', hi: 'Phase 4 Final Project: Deploy + Monitor' }, tags: ['kubernetes', 'docker', 'cicd', 'logging'], isMiniProject: true },
    { day: 120, title: { en: 'Course Grand Finale + Career Roadmap 2.0', hi: 'Course Grand Finale + Career Roadmap 2.0' }, tags: ['system-design', 'microservices'], isRevision: true },
  ]),
];

// Helper: full day entry (for days 1-3 with real content)
function makeDayFull(day, phase, title, tags, morningTitle, morningTags, eveningTitle, eveningTags, outcome) {
  return {
    day, phase, title,
    isRevision: false, isMiniProject: false,
    topicTags: tags,
    morning: { title: morningTitle, topicTags: morningTags, content: getContent(day, 'morning') },
    evening: { title: eveningTitle, topicTags: eveningTags, content: getContent(day, 'evening') },
    outcome
  };
}

// Helper: bulk day entries from config
function makeDays(phaseId, configs) {
  return configs.map(c => ({
    day: c.day,
    phase: phaseId,
    title: c.title,
    isRevision: c.isRevision || false,
    isMiniProject: c.isMiniProject || false,
    topicTags: c.tags,
    morning: {
      title: { en: c.title.en, hi: c.title.hi },
      topicTags: c.tags.slice(0, 2),
      content: getContent(c.day, 'morning'),
    },
    evening: {
      title: { en: `${c.title.en} — Practice`, hi: `${c.title.hi} — Practice` },
      topicTags: c.tags,
      content: getContent(c.day, 'evening'),
    },
    outcome: c.title,
  }));
}

export function getPhaseForDay(dayNum) {
  return phases.find(p => dayNum >= p.dayRange[0] && dayNum <= p.dayRange[1]);
}

export const allSessions = days.flatMap(d => [
  { day: d.day, session: 'morning', phase: d.phase, title: d.morning.title, topicTags: d.morning.topicTags, content: d.morning.content, dayTitle: d.title },
  { day: d.day, session: 'evening', phase: d.phase, title: d.evening.title, topicTags: d.evening.topicTags, content: d.evening.content, dayTitle: d.title },
]);
