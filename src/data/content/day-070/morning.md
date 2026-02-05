# Day 70 Morning: CI/CD with GitHub Actions

> **Aaj ka plan:** Aaj hum CI/CD seekhenge — modern software development ka sabse important practice. GitHub Actions se automated testing aur deployment setup karenge. Code push karo aur baaki sab automatic ho jaye!

---

## CI/CD Kya Hai?

### Continuous Integration (CI)

CI ka matlab hai — har developer jab code push kare, automated tests aur checks run hon. Code break ho raha hai ya nahi — turant pata chal jaye.

### Continuous Deployment (CD)

CD ka matlab hai — tests pass hone ke baad code automatically production mein deploy ho jaye. Manual deployment ki zaroorat nahi.

> **Socho Aise:** Socho ek factory hai jo biscuit banati hai. CI = har batch ke baad quality check (automated testing). CD = quality pass hone ke baad biscuit automatically packaging aur delivery mein chala jaata hai. Koi manually check nahi karta — machine sab handle karti hai.

### CI/CD Pipeline

```
Developer pushes code
        ↓
   [CI Pipeline]
   ├── Code checkout
   ├── Dependencies install
   ├── Linting (code quality)
   ├── Unit tests run
   ├── Integration tests run
   └── Build check
        ↓
   Tests Pass? ──No──→ Developer ko notification (Fix karo!)
        │
       Yes
        ↓
   [CD Pipeline]
   ├── Build production bundle
   ├── Deploy to staging
   ├── Smoke tests
   └── Deploy to production
        ↓
   App LIVE on production!
```

> **Yaad Rakho:** CI bina CD ke ho sakta hai (sirf testing), lekin CD bina CI ke kabhi nahi hona chahiye. Bina test kiye production deploy = disaster!

---

## GitHub Actions Kya Hai?

GitHub Actions GitHub ka built-in CI/CD tool hai — free for public repos, private repos ke liye bhi generous free tier.

### Core Concepts

| Concept | Kya Hai | Example |
|---------|---------|---------|
| **Workflow** | Ek automated process (YAML file) | CI pipeline, CD pipeline |
| **Job** | Workflow ke andar ek task group | "test" job, "deploy" job |
| **Step** | Job ke andar ek single action | `npm install`, `npm test` |
| **Runner** | Machine jahan job execute hoti hai | Ubuntu, macOS, Windows |
| **Trigger** | Kab workflow chalega | Push, Pull Request, Schedule |
| **Action** | Reusable step (marketplace se) | `actions/checkout@v4` |

> **Socho Aise:** Workflow = poora recipe, Job = ek dish banana, Step = ek ingredient dalna, Runner = kitchen jahan kaam hota hai, Trigger = "order aaya" ka signal.

### File Structure

```
your-repo/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI workflow
│       ├── cd.yml          # CD workflow
│       └── cron.yml        # Scheduled workflow
├── src/
├── tests/
└── package.json
```

---

## Pehla Workflow — CI Pipeline

### Basic CI Workflow

```yaml
# .github/workflows/ci.yml
# Continuous Integration — har push pe tests run karo

name: CI Pipeline               # Workflow ka naam

# Triggers — kab chalega
on:
  push:
    branches: [main, develop]   # In branches pe push hone pe
  pull_request:
    branches: [main]            # Main pe PR aane pe

# Jobs — kya kya kaam hoga
jobs:
  # Job 1: Lint aur Test
  test:
    name: Lint & Test           # Job ka display name
    runs-on: ubuntu-latest      # Konsa runner use karna hai

    # Steps — ek ek kaam
    steps:
      # Step 1: Code checkout karo
      - name: Code checkout karo
        uses: actions/checkout@v4      # GitHub ka official action

      # Step 2: Node.js setup karo
      - name: Node.js setup karo
        uses: actions/setup-node@v4
        with:
          node-version: '20'           # Node.js version
          cache: 'npm'                 # npm cache for speed

      # Step 3: Dependencies install karo
      - name: Dependencies install karo
        run: npm ci                    # Clean install (faster, deterministic)

      # Step 4: Linting check karo
      - name: ESLint run karo
        run: npm run lint              # Code quality check

      # Step 5: Tests run karo
      - name: Tests run karo
        run: npm test                  # Unit + integration tests

      # Step 6: Build check karo
      - name: Build check karo
        run: npm run build --if-present  # Agar build script hai to
```

> **Tip:** `npm ci` aur `npm install` mein fark — `ci` lockfile se exact versions install karta hai (faster + reproducible). CI mein hamesha `npm ci` use karo.

---

## Workflow Triggers (on:)

### Different Trigger Types

```yaml
# Push trigger
on:
  push:
    branches: [main, develop]
    paths:                         # Sirf specific files change hone pe
      - 'src/**'
      - 'package.json'
    paths-ignore:                  # In files pe ignore karo
      - '**.md'
      - 'docs/**'

# Pull Request trigger
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize]   # PR open ya update hone pe

# Schedule trigger (cron)
on:
  schedule:
    - cron: '0 6 * * *'           # Har din subah 6 baje (UTC)

# Manual trigger
on:
  workflow_dispatch:               # GitHub UI se manually trigger

# Multiple triggers combine karo
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'           # Har Sunday midnight
```

> **Yaad Rakho:** Cron format: `minute hour day-of-month month day-of-week`. `0 6 * * 1-5` = weekdays subah 6 baje.

---

## Multiple Jobs Aur Dependencies

```yaml
# .github/workflows/ci.yml

name: Full CI Pipeline

on:
  push:
    branches: [main, develop]

jobs:
  # Job 1: Lint
  lint:
    name: Code Quality Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  # Job 2: Unit Tests (lint ke baad)
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint                  # Lint pass hone ke baad hi chalega
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  # Job 3: Multiple Node versions pe test
  compatibility:
    name: Node ${{ matrix.node-version }} Test
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        node-version: [18, 20, 22]   # 3 versions pe test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

> **Socho Aise:** `needs: lint` ka matlab = pehle lint job pass hona chahiye. Agar lint fail ho gaya to aage ki jobs chalegi hi nahi — time aur resources bach jaate hain!

---

## Secrets Management

### GitHub Secrets — Sensitive Data Safe Rakho

```yaml
# Secrets kaise use karte hain workflow mein
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH se server pe deploy
        env:
          SSH_KEY: ${{ secrets.EC2_SSH_KEY }}       # Secret reference
          SERVER_IP: ${{ secrets.EC2_SERVER_IP }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: |
          echo "$SSH_KEY" > key.pem
          chmod 600 key.pem
          ssh -i key.pem ubuntu@$SERVER_IP "cd /app && git pull && pm2 reload all"
```

### Secrets Add Karna (GitHub UI Se)

```
GitHub Repository → Settings → Secrets and variables → Actions
→ New repository secret

Name: EC2_SSH_KEY
Value: (paste your SSH private key)

Name: EC2_SERVER_IP
Value: 12.34.56.78
```

> **Warning:** Secrets ko KABHI bhi code mein hardcode mat karo! Hamesha GitHub Secrets use karo. Ek baar secret leak ho gaya to security breach ho sakti hai.

---

## Actions Marketplace

### Popular Actions

```yaml
# Popular actions jo bahut kaam aate hain:

# Code checkout
- uses: actions/checkout@v4

# Node.js setup
- uses: actions/setup-node@v4

# Cache dependencies (faster builds)
- uses: actions/cache@v4

# Docker build aur push
- uses: docker/build-push-action@v5

# AWS credentials configure
- uses: aws-actions/configure-aws-credentials@v4

# Slack notification
- uses: slackapi/slack-github-action@v1

# PR pe comment
- uses: actions/github-script@v7
```

> **Tip:** Actions marketplace pe 20,000+ ready-made actions hain. Pehle search karo — zyaatar kaam ke liye kisi ne pehle se action bana rakha hoga!

---

## Status Badges

### README Mein CI Status Dikhao

```markdown
<!-- README.md mein add karo -->
![CI](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/USERNAME/REPO/actions/workflows/cd.yml/badge.svg)
```

Ye badge green (passing) ya red (failing) dikhata hai — team ko turant pata chal jata hai ki code healthy hai ya nahi.

---

## Quick Revision Table

| Concept | Kya Hai | Key Point |
|---------|---------|-----------|
| CI | Continuous Integration | Har push pe automated testing |
| CD | Continuous Deployment | Tests pass → auto deploy |
| Workflow | YAML file `.github/workflows/` | Poora automation process |
| Job | Task group in workflow | `runs-on: ubuntu-latest` |
| Step | Single action in job | `run: npm test` |
| Trigger | Kab workflow chalega | `on: push`, `on: pull_request` |
| Runner | Execution machine | `ubuntu-latest`, `macos-latest` |
| Action | Reusable marketplace step | `uses: actions/checkout@v4` |
| Secret | Encrypted variable | `${{ secrets.MY_SECRET }}` |
| Matrix | Multiple configs pe test | `matrix: { node: [18, 20] }` |

---

## Aaj Kya Seekha?

1. **CI/CD** modern development ka foundation hai — manual testing aur deployment replace hota hai automation se
2. **GitHub Actions** free CI/CD tool hai — `.github/workflows/` folder mein YAML files likhte hain
3. **Workflow** mein **jobs** hote hain, jobs mein **steps** — `needs:` se dependency set hoti hai
4. **Triggers** decide karte hain kab pipeline chalegi — push, PR, schedule, manual
5. **Matrix strategy** se multiple versions pe test kar sakte ho simultaneously
6. **Secrets** se sensitive data safe rehta hai — kabhi code mein hardcode nahi karna
7. **Actions Marketplace** mein 20,000+ ready-made actions hain — checkout, setup-node, docker sab
8. **Status badges** se team ko real-time pata rehta hai ki code healthy hai ya nahi
