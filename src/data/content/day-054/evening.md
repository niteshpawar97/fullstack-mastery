# Day 54 - Evening: Practice — Team Workflow, Branch Protection & GitHub Actions

> **Aaj ka plan:**
> Hands-on karenge — team workflow simulate karenge, branch protection set up karenge, aur ek simple GitHub Action likhenge. Yeh sab real job mein Day 1 se use hota hai.

---

## Task 1: Team Workflow Simulate Karo

> **Practice Time!**
> Ek repository pe team workflow practice karo — feature branch, commits, PR.

### Step 1: Repository Setup

```bash
# Naya project banao ya existing use karo
mkdir team-workflow-practice && cd team-workflow-practice
git init
npm init -y

# Initial file banao
echo "console.log('Hello Team!');" > index.js
git add .
git commit -m "initial: project setup"

# develop branch banao
git checkout -b develop
git push origin develop
```

### Step 2: Feature Branch pe Kaam Karo

```bash
# Feature branch banao
git checkout -b feature/user-api

# user controller banao
mkdir -p src/controllers
```

```javascript
// src/controllers/userController.js
// User CRUD operations

const users = []; // temporary in-memory store

// Saare users lao
const getUsers = (req, res) => {
  res.json({ success: true, data: users });
};

// Naya user banao
const createUser = (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name aur email required hai" });
  }
  const user = { id: users.length + 1, name, email };
  users.push(user);
  res.status(201).json({ success: true, data: user });
};

module.exports = { getUsers, createUser };
```

```bash
# Commit karo
git add src/controllers/userController.js
git commit -m "feat: add user controller with getUsers and createUser"
```

### Step 3: Route file banao

```javascript
// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { getUsers, createUser } = require("../controllers/userController");

// GET /api/users — saare users
router.get("/", getUsers);

// POST /api/users — naya user
router.post("/", createUser);

module.exports = router;
```

```bash
git add src/routes/userRoutes.js
git commit -m "feat: add user routes"

# Push karo
git push origin feature/user-api
```

> **Terminal Command:**
> ```bash
> git log --oneline --graph
> ```

> **Expected Output:**
> ```
> * abc1234 feat: add user routes
> * def5678 feat: add user controller with getUsers and createUser
> * 111aaaa initial: project setup
> ```

---

## Task 2: Pull Request Banao (GitHub CLI)

> **Practice Time!**
> GitHub CLI (`gh`) se PR banao terminal se hi.

```bash
# GitHub CLI install hai toh
gh pr create \
  --base develop \
  --head feature/user-api \
  --title "feat: Add User API endpoints" \
  --body "## What does this PR do?
User CRUD API add kiya hai.

## Changes
- GET /api/users — list all users
- POST /api/users — create user with validation

## How to test
1. npm install && npm start
2. POST /api/users with { name, email }
3. GET /api/users to verify

## Checklist
- [x] Controller with error handling
- [x] Routes properly organized
- [x] Input validation added"
```

### PR Review Simulate

```bash
# PR ki list dekho
gh pr list

# PR ka diff dekho
gh pr diff 1

# PR approve karo (teammate karega)
gh pr review 1 --approve --body "LGTM! Code looks clean."

# Squash merge karo
gh pr merge 1 --squash --delete-branch
```

> **Tip:**
> Real team mein: tum PR banate ho, teammate review karta hai, approve hone pe merge hota hai. Kabhi bhi apna PR khud approve mat karo (branch protection lagao toh yeh enforce ho jaata hai).

---

## Task 3: Branch Protection Set Up Karo

> **Practice Time!**
> GitHub repository settings mein branch protection lagao.

### GitHub UI se:
```
1. Repository --> Settings --> Branches
2. "Add branch protection rule" click karo
3. Branch name pattern: main
4. Enable:
   ✅ Require a pull request before merging
   ✅ Require approvals (1)
   ✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   ✅ Do not allow force pushes
5. Save changes
```

### GitHub CLI se:

```bash
# Branch protection via CLI (requires admin access)
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field enforce_admins=true \
  --field required_status_checks='{"strict":true,"contexts":["test"]}'
```

> **Warning:**
> Branch protection lagane ke baad tum bhi seedha main pe push nahi kar paoge. Yeh intentional hai — sabke liye same rules. Yeh production code ko safe rakhta hai.

### Test Karo Protection

```bash
# Main pe direct push try karo — fail hona chahiye
git checkout main
echo "test" > test.txt
git add test.txt
git commit -m "test: direct push"
git push origin main
# ERROR: protected branch hook declined
```

---

## Task 4: GitHub Action Likho

> **Practice Time!**
> CI pipeline banao jo har PR pe automatically test run kare.

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]  # Multiple Node versions pe test

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

      # Lint check (agar eslint hai toh)
      - name: Run linter
        run: npm run lint --if-present

      # Tests run
      - name: Run tests
        run: npm test --if-present

  # Security check job
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security audit
        run: npm audit --audit-level=high
```

```bash
# File banao
mkdir -p .github/workflows
# ci.yml upar wala content daalo

# Commit aur push
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI pipeline"
git push origin develop
```

> **Yaad Rakho:**
> `npm ci` use karo `npm install` ki jagah CI mein — yeh `package-lock.json` se exact versions install karta hai. Reproducible builds ke liye zaroori hai.

---

## Task 5: PR Comment Bot Action

```yaml
# .github/workflows/pr-welcome.yml
name: PR Welcome Message

on:
  pull_request:
    types: [opened]

jobs:
  welcome:
    runs-on: ubuntu-latest
    steps:
      - name: Welcome comment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '## PR Review Checklist\n- [ ] Code follows conventions\n- [ ] Tests added\n- [ ] No secrets in code\n- [ ] Documentation updated\n\nThank you for your contribution! A reviewer will look at this soon.'
            })
```

> **Socho Aise:**
> Yeh ek robot hai jo har naye PR pe automatically checklist comment karta hai. Team mein consistency maintain hoti hai — koi review step miss nahi hoga.

---

## Task 6: Complete Workflow Practice

```bash
# Poora workflow ek baar aur karo

# 1. Latest develop lo
git checkout develop
git pull origin develop

# 2. Naya feature branch
git checkout -b feature/product-api

# 3. Code likho (product controller, routes)
# ... (code likho) ...

# 4. Commit karo (chhote commits)
git add src/controllers/productController.js
git commit -m "feat: add product controller"
git add src/routes/productRoutes.js
git commit -m "feat: add product routes"

# 5. Push karo
git push -u origin feature/product-api

# 6. PR banao
gh pr create --base develop --title "feat: Add Product API"

# 7. CI pass hone ka wait karo
gh pr checks feature/product-api

# 8. Review ke baad merge karo
gh pr merge --squash --delete-branch

# 9. Local cleanup
git checkout develop
git pull origin develop
git branch -d feature/product-api  # local branch delete
```

> **Expected Output:**
> Ek clean workflow jismein: branch banao --> code likho --> PR banao --> CI pass --> review --> merge --> cleanup. Yahi professional development hai!

---

## Quick Revision

| Task | Kya Kiya |
|---|---|
| Feature Branch | `git checkout -b feature/xyz` |
| Push Branch | `git push origin feature/xyz` |
| Create PR | `gh pr create --base develop` |
| Review PR | `gh pr review --approve` |
| Merge PR | `gh pr merge --squash --delete-branch` |
| Branch Protection | Settings mein rules set karo |
| GitHub Action | `.github/workflows/ci.yml` |
| CI Pipeline | Lint + Test on every push/PR |

---

## Aaj Kya Seekha?

1. Team workflow simulate kiya — feature branch se PR tak
2. GitHub CLI se PR create, review, merge kiya
3. Branch protection rules set kiye — main branch safe
4. GitHub Actions CI pipeline likhi — automatic testing
5. Squash merge se clean git history maintain kiya
6. PR welcome bot banaya — automatic review checklist
