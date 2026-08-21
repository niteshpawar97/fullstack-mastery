# Learning Platform — Multi-Track Hinglish Programming Courses

An interactive educational web app teaching software development through multiple self-contained tracks — each written in **Hinglish** (Hindi + English mix), classroom-style. First screen asks what you want to learn, then takes you straight to that track.

---

## Tracks

| Track | Status | Length | Notes |
|-------|--------|--------|-------|
| **Full Stack Mastery** | Active | 90 days (+30 bonus) | Backend-focused: JS, Node.js, Express, MongoDB/SQL, Docker, AWS, React. Full content for all days. |
| **Flutter with Dart** | Available | 50 days | Dart + Flutter, Firebase, Bloc, Clean Architecture, Play Store + iOS deploy. Full content for all days. |
| **Android with Java** | Available | 7 days (full-day sessions) | Java + OOP → Android Core → RecyclerView/Fragment → Retrofit/OkHttp → JWT/Room → Offline sync → MVVM. Capstone: Smart Electricity Meter Management System. Full content for all 7 days. |
| JavaScript / Python / React Native / DevOps | Planned | — | Roadmap only, no lessons written yet. |

---

## Features

- **First-screen onboarding** — pick a track before anything else loads; switch tracks anytime from the sidebar
- **Read Aloud (text-to-speech)** — Play/Pause/Stop, English/Hindi voice, adjustable speed, on every content page
- **Dark / Light Mode** — persisted in localStorage
- **Progress Tracking** — mark sessions complete, track per-week/phase/overall progress (Full Stack track)
- **Week-based Sidebar Navigation** — Phase > Week > Day > Morning/Evening (Full Stack track)
- **Teaching Plan + PDF Downloads** — full schedule view, export sessions/days/full plan as PDF
- **Bilingual UI** — toggle Both / English / Hindi
- **Responsive** — mobile, tablet, desktop
- **Error boundary** — a crashed screen shows a reload prompt instead of a blank page

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| Vite 8 | Build Tool |
| Tailwind CSS v4 | Styling |
| react-markdown + remark-gfm + rehype-raw | Markdown Rendering |
| react-syntax-highlighter | Code Highlighting (Prism) |
| html2pdf.js | PDF Generation |
| Web Speech API | Read Aloud (browser built-in, no external service) |
| localStorage | Progress, theme, onboarded-track persistence |
| Vercel | Deployment |

---

## Project Structure

```
fullstack-mastery/
├── src/
│   ├── components/
│   │   ├── Onboarding.jsx       # First-screen track picker
│   │   ├── Sidebar.jsx          # Nav — adapts header/branding to active track
│   │   ├── Content.jsx          # Full Stack course markdown viewer + callouts
│   │   ├── Tracks.jsx           # Flutter/Android track roadmap + day-content viewer
│   │   ├── TeachingPlan.jsx     # 90-day schedule + PDF download
│   │   ├── Downloads.jsx        # PDF download interface
│   │   ├── ReadAloud.jsx        # Text-to-speech controls (shared)
│   │   └── ErrorBoundary.jsx    # Top-level crash guard
│   ├── data/
│   │   ├── course.js            # Full Stack: phases, 90 days, session metadata
│   │   ├── topics.js            # Full Stack topic definitions
│   │   ├── tracks.js            # All tracks' metadata (phases, projects, outcomes)
│   │   ├── flutterCourse.js     # Flutter day list + content loader
│   │   ├── androidCourse.js     # Android day list + content loader
│   │   └── content/
│   │       ├── day-001/         # Full Stack: morning.md + evening.md, ...day-090/
│   │       ├── flutter/         # day-001.md ... day-050.md
│   │       └── android/         # day-001.md ... day-007.md
│   ├── utils/
│   │   ├── pdfGenerator.js      # PDF export functions
│   │   ├── storage.js           # localStorage helpers (all writes fail-safe)
│   │   └── speech.js            # Markdown-to-speech + Web Speech API hook
│   ├── App.jsx                  # Root — onboarding gate, view routing
│   ├── index.css                # Tailwind + theme config
│   └── main.jsx                 # Entry point, wraps App in ErrorBoundary
├── vercel.json
├── vite.config.js
└── package.json
```

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

# Lint
npm run lint

# Build
npm run build
```

---

## Content Format

Each day's content is Hinglish markdown with:

- **Callouts** — Yaad Rakho, Socho Aise, Tip, Warning
- **Code examples** with Hindi comments
- **Quick Revision** tables (Android track also maps each concept to where it's used in the capstone project)
- **Hands-On Labs** — real tools (Logcat, Profiler, Database Inspector), not just reading code
- **Real-life examples** (farming, IoT, business)
- **Aaj Kya Seekha?** summary section

---

## Deployment

### Vercel (Recommended)

```bash
npm run build
```

`vercel.json` is pre-configured with SPA rewrite rules. Deploy the `dist/` folder.

---

## Known Limitations

- No automated test suite yet.
- The production JS bundle ships all tracks' content eagerly (~5MB); code-splitting per track is on the roadmap.

---

## License

Open source for educational purposes.

---

## Author

**Nitesh Pawar** — [@niteshpawar97](https://github.com/niteshpawar97)
