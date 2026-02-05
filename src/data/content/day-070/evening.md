# Day 70 Evening: Practice — GitHub Actions CI/CD Pipeline Banao

> **Aaj ka plan:** Ab hum hands-on practice karenge — CI workflow banayenge jo push pe lint aur test kare, CD workflow banayenge jo main branch pe merge hone pe EC2 pe deploy kare, aur status badges add karenge.

---

## Practice 1: Project Setup For CI/CD

### Step 1 — Project Structure Tayyar Karo

```bash
# Project folder banao
mkdir -p ~/kisan-api-cicd && cd ~/kisan-api-cicd

# Git initialize karo
git init

# Node.js project setup
npm init -y

# Dependencies install karo
npm install express dotenv
npm install --save-dev eslint jest supertest
```

### Step 2 — Express App Likho

```javascript
// src/app.js
// Express app — testable format mein (server alag, app alag)

const express = require('express');
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

// Crops API
app.get('/api/crops', (req, res) => {
    const crops = [
        { id: 1, name: 'Gehu', season: 'Rabi' },
        { id: 2, name: 'Dhan', season: 'Kharif' }
    ];
    res.json({ success: true, data: crops });
});

// Mandi price
app.get('/api/mandi/:crop', (req, res) => {
    const { crop } = req.params;
    if (!crop) {
        return res.status(400).json({ error: 'Crop name required' });
    }
    res.json({
        crop,
        price: 2275,
        unit: 'per quintal'
    });
});

// App export karo (testing ke liye)
module.exports = app;
```

```javascript
// src/server.js
// Server start — app se alag (testing ke liye important)

const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server port ${PORT} pe chal raha hai`);
});
```

### Step 3 — Tests Likho

```javascript
// tests/app.test.js
// API tests — CI pipeline mein ye chalenge

const request = require('supertest');
const app = require('../src/app');

describe('Health Check', () => {
    test('GET /health — 200 status aana chahiye', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});

describe('Crops API', () => {
    test('GET /api/crops — crops list aani chahiye', async () => {
        const res = await request(app).get('/api/crops');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
    });
});

describe('Mandi API', () => {
    test('GET /api/mandi/gehu — crop price aana chahiye', async () => {
        const res = await request(app).get('/api/mandi/gehu');
        expect(res.statusCode).toBe(200);
        expect(res.body.crop).toBe('gehu');
        expect(res.body.price).toBeDefined();
    });
});
```

### Step 4 — ESLint Setup

```javascript
// eslint.config.js
// ESLint flat config

module.exports = [
    {
        files: ['**/*.js'],
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',       // Console allow hai server app mein
            'semi': ['error', 'always'],
            'quotes': ['error', 'single']
        }
    },
    {
        ignores: ['node_modules/**']
    }
];
```

### Step 5 — Package.json Scripts Update

```json
{
    "scripts": {
        "start": "node src/server.js",
        "test": "jest --verbose --forceExit",
        "lint": "eslint src/ tests/",
        "lint:fix": "eslint src/ tests/ --fix"
    }
}
```

```bash
# Local mein test karo
npm run lint
npm test
```

> **Expected Output:**
```
PASS  tests/app.test.js
  Health Check
    ✓ GET /health — 200 status aana chahiye (25ms)
  Crops API
    ✓ GET /api/crops — crops list aani chahiye (8ms)
  Mandi API
    ✓ GET /api/mandi/gehu — crop price aana chahiye (5ms)

Tests:  3 passed, 3 total
```

---

## Practice 2: CI Workflow Banao

### GitHub Actions CI File

```yaml
# .github/workflows/ci.yml
# CI Pipeline — Push aur PR pe lint + test karo

name: CI Pipeline

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '**.md'                    # README changes pe CI mat chalao
      - 'docs/**'
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]     # 2 Node versions pe test

    steps:
      # Code checkout
      - name: Checkout code
        uses: actions/checkout@v4

      # Node.js setup
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      # Dependencies install
      - name: Install dependencies
        run: npm ci

      # Linting
      - name: Run ESLint
        run: npm run lint

      # Testing
      - name: Run tests
        run: npm test

      # Test results upload (optional but useful)
      - name: Upload test results
        if: always()               # Test fail bhi ho to upload karo
        uses: actions/upload-artifact@v4
        with:
          name: test-results-node-${{ matrix.node-version }}
          path: coverage/
          retention-days: 7
```

```bash
# Workflow folder banao
mkdir -p .github/workflows

# File create karo (upar wala YAML content daalo)
# ci.yml file banao .github/workflows/ mein
```

> **Yaad Rakho:** `if: always()` step tab bhi chalega jab previous steps fail ho jaayein. Test results hamesha upload karna helpful hai debugging ke liye.

---

## Practice 3: CD Workflow Banao — EC2 Deploy

### GitHub Actions CD File

```yaml
# .github/workflows/cd.yml
# CD Pipeline — Main branch pe merge hone pe EC2 pe deploy

name: CD Pipeline

on:
  push:
    branches: [main]             # Sirf main pe push hone pe deploy

jobs:
  # Pehle CI checks chalao
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test

  # Tests pass hone ke baad deploy karo
  deploy:
    name: Deploy to EC2
    runs-on: ubuntu-latest
    needs: test                  # Test pass hona zaroori hai
    if: github.ref == 'refs/heads/main'  # Extra check — sirf main branch

    steps:
      # Code checkout
      - name: Checkout code
        uses: actions/checkout@v4

      # SSH key setup karo
      - name: Setup SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts

      # EC2 pe deploy karo
      - name: Deploy to EC2
        env:
          HOST: ${{ secrets.EC2_HOST }}
          USER: ${{ secrets.EC2_USER }}
        run: |
          ssh -i ~/.ssh/deploy_key $USER@$HOST << 'DEPLOY_SCRIPT'
            # App directory mein jao
            cd /home/ubuntu/kisan-api

            # Latest code pull karo
            git pull origin main

            # Dependencies install karo
            npm ci --production

            # PM2 se zero downtime reload
            pm2 reload ecosystem.config.js --env production

            # Health check
            sleep 3
            curl -f http://localhost:3000/health || exit 1

            echo "Deployment successful!"
          DEPLOY_SCRIPT

      # Deployment notification (optional)
      - name: Deployment success notification
        if: success()
        run: |
          echo "Deployment to production successful!"
          echo "Deployed commit: ${{ github.sha }}"
          echo "Deployed by: ${{ github.actor }}"
```

### Required Secrets Setup

```
GitHub Repository → Settings → Secrets and variables → Actions

Ye secrets add karo:
1. EC2_SSH_KEY     — EC2 ka private key (.pem file ka content)
2. EC2_HOST        — EC2 ka public IP (e.g., 54.123.45.67)
3. EC2_USER        — SSH user (usually "ubuntu")
```

> **Warning:** SSH private key ko secret mein paste karte waqt pura key paste karo — `-----BEGIN` se `-----END` tak. Extra spaces ya newlines se error aayega.

---

## Practice 4: Advanced Workflow Features

### PR Pe Comment Karo — Test Results

```yaml
# .github/workflows/pr-check.yml
# PR pe automated comment with test results

name: PR Check

on:
  pull_request:
    branches: [main]

jobs:
  check:
    name: PR Quality Check
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write        # PR pe comment karne ke liye

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test

      # PR pe comment karo
      - name: Comment on PR
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ All checks passed!\n\n- Lint: Passed\n- Tests: Passed\n- Ready for review!'
            })
```

---

## Practice 5: Status Badges Add Karo

### README.md Mein Badges

```markdown
# Kisan API

![CI](https://github.com/YOUR_USERNAME/kisan-api/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/YOUR_USERNAME/kisan-api/actions/workflows/cd.yml/badge.svg)

## About
Kisan API — farmers ke liye crop aur mandi price data.
```

### Git Push Aur Verify

```bash
# .gitignore banao
echo "node_modules/
.env
coverage/
logs/" > .gitignore

# Git commit karo
git add .
git commit -m "feat: CI/CD pipeline setup with GitHub Actions"

# GitHub pe repo banao aur push karo
# gh repo create kisan-api-cicd --public --push
git remote add origin https://github.com/USERNAME/kisan-api-cicd.git
git push -u origin main

# GitHub Actions tab mein dekho — CI workflow chal raha hoga!
```

> **Practice Time!** Push karne ke baad GitHub repository pe jao → Actions tab → Dekho workflow chal raha hai. Green tick aaye to sab sahi hai, red cross aaye to logs check karo aur fix karo!

---

## Quick Revision Table

| File | Purpose | Trigger |
|------|---------|---------|
| `ci.yml` | Lint + Test on every push | `on: push, pull_request` |
| `cd.yml` | Deploy to EC2 on main merge | `on: push: branches: [main]` |
| `pr-check.yml` | PR quality gate + comment | `on: pull_request` |

| Secret | Value | Where To Find |
|--------|-------|---------------|
| `EC2_SSH_KEY` | Private key content | `.pem` file |
| `EC2_HOST` | EC2 public IP | AWS Console |
| `EC2_USER` | SSH username | Usually `ubuntu` |

---

## Aaj Kya Seekha?

1. **CI workflow** banaya — push pe lint + test automatically chalte hain multiple Node versions pe
2. **CD workflow** banaya — main branch pe merge hone pe EC2 pe auto-deploy hota hai
3. **App structure** testable rakhi — `app.js` aur `server.js` alag (supertest ke liye zaroori)
4. **Matrix strategy** se 2 Node versions pe simultaneously test kiya
5. **Secrets** se SSH key aur server IP securely store kiya — code mein koi sensitive data nahi
6. **Deploy script** mein `pm2 reload` use kiya — zero downtime deployment
7. **Health check** deploy ke baad — agar app healthy nahi hai to deployment fail mark hoti hai
8. **Status badges** se team ko real-time CI/CD status dikhta hai README mein
