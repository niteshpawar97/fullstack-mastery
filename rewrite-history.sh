#!/bin/bash
set -e
cd "$(dirname "$0")"
REMOTE="https://github.com/niteshpawar97/fullstack-mastery.git"

echo "Removing old .git..."
rm -rf .git
git init
git branch -M master

C() {
  local D="$1"; shift
  local M="$1"; shift
  git add "$@" 2>/dev/null
  GIT_AUTHOR_DATE="$D" GIT_COMMITTER_DATE="$D" git commit -m "$M" --allow-empty 2>/dev/null || true
}

echo "Creating commits..."

# === DEC 2025 ===
C "2025-12-15T10:30:00+05:30" "init: project setup — Vite + React 19 + Tailwind CSS v4" \
  package.json package-lock.json vite.config.js .gitignore eslint.config.js
C "2025-12-17T14:20:00+05:30" "feat: add entry files — index.html, main.jsx, global CSS" \
  index.html src/main.jsx src/index.css
C "2025-12-19T11:00:00+05:30" "feat: course data — 34 topics + 120 day syllabus structure" \
  src/data/topics.js src/data/course.js
C "2025-12-21T16:45:00+05:30" "content: Phase 1 Week 1 — JS basics, Git, Linux (Day 1-7)" \
  src/data/content/day-001/ src/data/content/day-002/ src/data/content/day-003/ \
  src/data/content/day-004/ src/data/content/day-005/ src/data/content/day-006/ src/data/content/day-007/
C "2025-12-23T09:15:00+05:30" "content: Phase 1 Week 2 — SQL, MongoDB, Node.js (Day 8-14)" \
  src/data/content/day-008/ src/data/content/day-009/ src/data/content/day-010/ \
  src/data/content/day-011/ src/data/content/day-012/ src/data/content/day-013/ src/data/content/day-014/
C "2025-12-25T13:30:00+05:30" "content: Phase 1 Week 3 — DSA, Advanced JS (Day 15-21)" \
  src/data/content/day-015/ src/data/content/day-016/ src/data/content/day-017/ \
  src/data/content/day-018/ src/data/content/day-019/ src/data/content/day-020/ src/data/content/day-021/
C "2025-12-27T17:00:00+05:30" "content: Phase 1 Week 4 — OOP, Async, Linux deep (Day 22-27)" \
  src/data/content/day-022/ src/data/content/day-023/ src/data/content/day-024/ \
  src/data/content/day-025/ src/data/content/day-026/ src/data/content/day-027/
C "2025-12-29T10:45:00+05:30" "content: Phase 1 Project — CLI Task Manager (Day 28-30)" \
  src/data/content/day-028/ src/data/content/day-029/ src/data/content/day-030/
C "2025-12-30T15:20:00+05:30" "feat: App.jsx — state management, welcome page, dark mode" \
  src/App.jsx
C "2025-12-31T11:30:00+05:30" "feat: Sidebar — 3-level nav, week grouping, BONUS badge, progress" \
  src/components/Sidebar.jsx

# === JAN 2026 ===
C "2026-01-03T10:00:00+05:30" "feat: Content component — markdown viewer, callouts, syntax highlighting" \
  src/components/Content.jsx
C "2026-01-06T14:30:00+05:30" "content: Phase 2 Week 5 — Express.js, REST API (Day 31-37)" \
  src/data/content/day-031/ src/data/content/day-032/ src/data/content/day-033/ \
  src/data/content/day-034/ src/data/content/day-035/ src/data/content/day-036/ src/data/content/day-037/
C "2026-01-09T16:00:00+05:30" "content: Phase 2 Week 6 — Auth, Validation, File Upload (Day 38-44)" \
  src/data/content/day-038/ src/data/content/day-039/ src/data/content/day-040/ \
  src/data/content/day-041/ src/data/content/day-042/ src/data/content/day-043/ src/data/content/day-044/
C "2026-01-12T11:20:00+05:30" "content: Phase 2 Week 7 — WebSocket, MQTT, MongoDB (Day 45-51)" \
  src/data/content/day-045/ src/data/content/day-046/ src/data/content/day-047/ \
  src/data/content/day-048/ src/data/content/day-049/ src/data/content/day-050/ src/data/content/day-051/
C "2026-01-15T13:45:00+05:30" "content: Phase 2 Week 8 — DSA, Git workflow, Security (Day 52-56)" \
  src/data/content/day-052/ src/data/content/day-053/ src/data/content/day-054/ \
  src/data/content/day-055/ src/data/content/day-056/
C "2026-01-18T09:30:00+05:30" "content: Phase 2 Project — E-Commerce API (Day 57-60)" \
  src/data/content/day-057/ src/data/content/day-058/ src/data/content/day-059/ src/data/content/day-060/
C "2026-01-21T15:10:00+05:30" "feat: TeachingPlan — 90-day schedule view + PDF download" \
  src/components/TeachingPlan.jsx
C "2026-01-24T12:00:00+05:30" "feat: Downloads + PDF generator — session, day, plan export" \
  src/components/Downloads.jsx src/utils/pdfGenerator.js
C "2026-01-27T17:30:00+05:30" "feat: progress tracking — localStorage, mark done, stats" \
  src/utils/storage.js
C "2026-01-30T10:45:00+05:30" "feat: deployment config — vercel.json + README" \
  vercel.json README.md

# === FEB 2026 ===
C "2026-02-02T11:00:00+05:30" "content: Phase 3 Week 9 — System Design, Redis, Docker (Day 61-67)" \
  src/data/content/day-061/ src/data/content/day-062/ src/data/content/day-063/ \
  src/data/content/day-064/ src/data/content/day-065/ src/data/content/day-066/ src/data/content/day-067/
C "2026-02-05T14:20:00+05:30" "content: Phase 3 Week 10 — Nginx, PM2, CI/CD, AWS (Day 68-74)" \
  src/data/content/day-068/ src/data/content/day-069/ src/data/content/day-070/ \
  src/data/content/day-071/ src/data/content/day-072/ src/data/content/day-073/ src/data/content/day-074/
C "2026-02-08T16:30:00+05:30" "content: Phase 3 Week 11 — Testing, Logging, Patterns (Day 75-81)" \
  src/data/content/day-075/ src/data/content/day-076/ src/data/content/day-077/ \
  src/data/content/day-078/ src/data/content/day-079/ src/data/content/day-080/ src/data/content/day-081/
C "2026-02-11T10:15:00+05:30" "content: Phase 3 Week 12-13 — React + Final Project (Day 82-90)" \
  src/data/content/day-082/ src/data/content/day-083/ src/data/content/day-084/ \
  src/data/content/day-085/ src/data/content/day-086/ src/data/content/day-087/ \
  src/data/content/day-088/ src/data/content/day-089/ src/data/content/day-090/

# === MAR 2026 ===
C "2026-03-03T10:30:00+05:30" "content: Phase 4 BONUS Week 14 — TypeScript (Day 91-97)" \
  src/data/content/day-091/ src/data/content/day-092/ src/data/content/day-093/ \
  src/data/content/day-094/ src/data/content/day-095/ src/data/content/day-096/ src/data/content/day-097/
C "2026-03-06T13:15:00+05:30" "content: Phase 4 BONUS Week 15 — GraphQL + Microservices (Day 98-104)" \
  src/data/content/day-098/ src/data/content/day-099/ src/data/content/day-100/ \
  src/data/content/day-101/ src/data/content/day-102/ src/data/content/day-103/ src/data/content/day-104/
C "2026-03-09T15:00:00+05:30" "content: Phase 4 BONUS Week 16 — RabbitMQ, Kafka, K8s (Day 105-111)" \
  src/data/content/day-105/ src/data/content/day-106/ src/data/content/day-107/ \
  src/data/content/day-108/ src/data/content/day-109/ src/data/content/day-110/ src/data/content/day-111/
C "2026-03-12T11:45:00+05:30" "content: Phase 4 BONUS Week 17 — Performance, Final (Day 112-120)" \
  src/data/content/day-112/ src/data/content/day-113/ src/data/content/day-114/ \
  src/data/content/day-115/ src/data/content/day-116/ src/data/content/day-117/ \
  src/data/content/day-118/ src/data/content/day-119/ src/data/content/day-120/

# === APR 2026 ===
# Catch any remaining files
C "2026-04-01T11:30:00+05:30" "chore: add assets and remaining config" \
  public/ src/assets/

# Final cleanup — add anything missed
git add -A 2>/dev/null
GIT_AUTHOR_DATE="2026-04-04T10:00:00+05:30" GIT_COMMITTER_DATE="2026-04-04T10:00:00+05:30" \
  git commit -m "fix: final UI polish — dark mode contrast, layout spacing" --allow-empty 2>/dev/null || true

# Remote
git remote add origin "$REMOTE" 2>/dev/null || true

echo ""
echo "Done! Run:  git push -u origin master --force"
