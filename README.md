# Full Stack Mastery — 90-Day Backend-Focused Program

An interactive educational web app for teaching full stack development in **90 days** with a strong backend focus. Content is written in **Hinglish** (Hindi + English mix) classroom-style teaching.

---

## Features

- **90 Days x 2 Sessions** — 180 lessons (Morning: Concepts, Evening: Practice)
- **29 Topics** — JavaScript, Node.js, Express, MongoDB, SQL, REST API, JWT Auth, WebSocket, MQTT, Docker, AWS, React & more
- **3 Phases** — Foundation (Day 1-30) | Building (Day 31-60) | Advanced + Production (Day 61-90)
- **Dark / Light Mode** — Toggle with localStorage persistence
- **Progress Tracking** — Mark sessions complete, track per-week/phase/overall progress
- **Week-based Navigation** — Sidebar: Phase > Week > Day > Morning/Evening
- **Teaching Plan** — Full 90-day schedule view with PDF download
- **PDF Downloads** — Export individual sessions, full days, or complete teaching plan
- **Bilingual UI** — Toggle between Both / English / Hindi
- **Responsive** — Mobile, Tablet, Desktop

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| Vite 8 | Build Tool |
| Tailwind CSS v4 | Styling |
| react-markdown | Markdown Rendering |
| react-syntax-highlighter | Code Highlighting (Prism) |
| html2pdf.js | PDF Generation |
| localStorage | Progress & Theme Persistence |
| Vercel | Deployment |

---

## Project Structure

```
fullstack-mastery/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # 3-level nav (Phase > Week > Sessions)
│   │   ├── Content.jsx          # Markdown viewer + callouts
│   │   ├── TeachingPlan.jsx     # 90-day schedule + PDF download
│   │   └── Downloads.jsx        # PDF download interface
│   ├── data/
│   │   ├── course.js            # 3 phases, 90 days, session metadata
│   │   ├── topics.js            # 29 topic definitions
│   │   └── content/
│   │       ├── day-001/         # morning.md + evening.md
│   │       ├── day-002/
│   │       └── ...day-090/      # 180 markdown files total
│   ├── utils/
│   │   ├── pdfGenerator.js      # PDF export functions
│   │   └── storage.js           # localStorage helpers
│   ├── App.jsx                  # Root + Welcome page
│   ├── index.css                # Tailwind + theme config
│   └── main.jsx
├── vercel.json
├── vite.config.js
└── package.json
```

---

## Course Syllabus (29 Topics)

### Phase 1: Basic Foundation (Day 1-30)
JavaScript (Basic to Advanced) | DSA (Practical) | Git & Version Control | Node.js | SQL + MongoDB | Linux Basics

### Phase 2: Building Phase (Day 31-60)
Express.js | REST API Development | Database Design | JWT Authentication | API Validation (Joi/Zod) | Pagination & Search | File Upload (Multer + S3) | WebSocket | MQTT | API Documentation (Swagger)

### Phase 3: Advanced + Production (Day 61-90)
System Design (Monolith/Modular/Microservices) | Redis Caching | Docker | AWS (EC2, S3, RDS, IAM, Lambda) | CI/CD (GitHub Actions) | Nginx & PM2 | Background Jobs (Bull/Redis) | Testing (Jest) | Logging & Monitoring | Debugging | Design Patterns | Clean Code | React.js (Dashboard)

---

## Getting Started

```bash
# Clone
git clone https://github.com/niteshpawar97/fullstack-mastery.git
cd fullstack-mastery

# Install
npm install

# Dev server
npm run dev

# Build
npm run build
```

---

## Content Format

Each day has two markdown files written in Hinglish with:

- **Callouts** — Yaad Rakho, Socho Aise, Tip, Warning, Practice Karo!, Expected Output, Terminal Command
- **Code examples** with Hindi comments
- **Quick Revision** tables
- **Real-life examples** (farming, IoT, business)
- **Aaj Kya Seekha?** summary section

---

## Daily Schedule

| Session | Duration | Focus |
|---------|----------|-------|
| Morning | 2 hours | Concept + Explanation |
| Evening | 2 hours | Practice + Coding + Mini Project |

Every 7 days: Revision + Mini Project

---

## Deployment

### Vercel (Recommended)

```bash
npm run build
```

`vercel.json` is pre-configured with SPA rewrite rules. Deploy the `dist/` folder.

---

## License

Open source for educational purposes.

---

## Author

**Nitesh Pawar** — [@niteshpawar97](https://github.com/niteshpawar97)
