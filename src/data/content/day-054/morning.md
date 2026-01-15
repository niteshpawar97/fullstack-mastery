# Day 54 - Morning: Git Team Workflow — PR, Review, CI

> **Aaj ka plan:**
> Aaj hum seekhenge team mein Git kaise use hota hai — Git Flow, feature branches, Pull Requests, code review, aur GitHub Actions se CI/CD. Yeh real job mein har din kaam aata hai!

---

## Git Flow — Team Ka Git Pattern

Akele kaam karte ho toh seedha `main` pe commit kar lete ho. Team mein aisa nahi chalega. Git Flow ek standard pattern hai:

```
main (production)
  |
  └── develop (active development)
        |
        ├── feature/user-auth
        ├── feature/product-api
        └── feature/payment
```

> **Socho Aise:**
> `main` branch = Ready product (jo customer use karta hai). `develop` = Workshop (jahan building ho rahi hai). `feature/*` = Alag-alag workers apne table pe kaam kar rahe. Jab kaam complete ho, workshop mein merge karo. Jab sab ready ho, production mein bhejo.

### Branch Naming Conventions

```bash
# Feature branches
feature/user-authentication
feature/product-crud
feature/file-upload

# Bug fix branches
bugfix/login-error
bugfix/cors-issue

# Hotfix (production emergency)
hotfix/payment-crash
```

> **Tip:**
> Branch name mein spaces mat daal. Lowercase use karo. Descriptive naam do — `feature/xyz` nahi, `feature/user-registration-api` likho.

---

## Feature Branch Workflow

### Step 1: Naya branch banao

```bash
# develop se naya branch banao
git checkout develop
git pull origin develop          # latest code lo
git checkout -b feature/user-auth  # naya branch banao
```

### Step 2: Kaam karo aur commit karo

```bash
# Code likho, test karo
git add src/auth/login.js
git commit -m "feat: add login API with JWT"

git add src/auth/register.js
git commit -m "feat: add register API with validation"

# Chhote-chhote commits karo — ek kaam, ek commit
```

### Step 3: Push karo

```bash
git push origin feature/user-auth
```

### Step 4: Pull Request banao (GitHub pe)

---

## Pull Request (PR) — Code Review Ka Darwaza

PR matlab: "Maine yeh code likha hai, please review karo aur merge karo."

> **Socho Aise:**
> PR ek application form hai — tum apna kaam dikhate ho, seniors review karte hain, approve hota hai toh merge hota hai. Seedha main mein push karna = bina permission office mein ghusna.

### PR Template

```markdown
## What does this PR do?
User authentication system add kiya hai — login, register, JWT tokens.

## Changes Made
- Added POST /api/auth/register
- Added POST /api/auth/login
- JWT token generation and verification
- Password hashing with bcrypt

## How to Test
1. Run `npm install`
2. Run `npm start`
3. Test register: POST /api/auth/register with body
4. Test login: POST /api/auth/login with credentials

## Screenshots (if UI changes)
N/A — API only

## Checklist
- [x] Code follows project conventions
- [x] Tests added/updated
- [x] No console.log left
- [x] .env.example updated if new env vars added
```

> **Yaad Rakho:**
> Accha PR description likhna bahut important hai. Reviewer ko samajh aana chahiye — kya change kiya, kyun kiya, kaise test karein. Khaali PR = review mein delay.

---

## Code Review Process

### Reviewer kya dekhta hai:

1. **Logic correct hai?** — Bugs, edge cases
2. **Code quality** — Naming, readability, DRY principle
3. **Security** — Passwords exposed? SQL injection? Input validation?
4. **Performance** — Unnecessary loops? N+1 queries?
5. **Tests** — Kya test likhe hain?

### Review Comments Types:

```
// APPROVE — Sab theek hai, merge karo
// REQUEST CHANGES — Yeh fix karo pehle
// COMMENT — Suggestion hai, zaroori nahi

// Example comments:
"Bug: password ko response mein mat bhejo"
"Suggestion: yahan try-catch add karo"
"Nitpick: variable name 'x' ki jagah 'userId' better rahega"
```

> **Warning:**
> Review mein personal mat lo. Code review code ke baare mein hai, coder ke baare mein nahi. Respectful raho — "This could be improved by..." not "This is wrong."

---

## Branch Protection Rules

GitHub pe main branch protect kar sakte ho:

```
Settings --> Branches --> Branch Protection Rules

Rules:
- Require pull request before merging    ✅
- Require at least 1 approval            ✅
- Require status checks to pass          ✅
- Require branches to be up to date      ✅
- Do not allow force pushes              ✅
- Do not allow deletions                 ✅
```

> **Yaad Rakho:**
> Branch protection lagao toh koi bhi seedha `main` pe push nahi kar sakta. PR mandatory ho jaata hai. Yeh production ko safe rakhta hai.

---

## Squash Merge vs Merge Commit

### Merge Commit (default)
Saare commits as-is aate hain + ek merge commit:
```
* Merge PR #42
* feat: add validation
* feat: add login
* fix: typo
```

### Squash Merge (recommended for clean history)
Saare commits ek mein combine ho jaate hain:
```
* feat: add user authentication (#42)
```

> **Tip:**
> Squash merge use karo — clean git history milta hai. Feature ke 10 chhote commits ek mein combine ho jaate hain. Main branch readable rehta hai.

---

## GitHub Actions — CI/CD Intro

GitHub Actions = Automatic tasks jo code push hone pe run hoti hain.

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

# Kab run hoga?
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

# Kya karega?
jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      # Step 1: Code checkout karo
      - uses: actions/checkout@v4

      # Step 2: Node.js setup karo
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Step 3: Dependencies install karo
      - run: npm install

      # Step 4: Linter run karo
      - run: npm run lint

      # Step 5: Tests run karo
      - run: npm test

      # Step 6: Build check karo
      - run: npm run build --if-present
```

> **Socho Aise:**
> GitHub Actions ek robot watchman hai — jab bhi code push ho, yeh automatically check karta hai: "Tests pass ho rahe? Lint errors nahi hain? Build ho rahi hai?" Agar fail ho toh PR merge nahi hoga.

---

## Complete Workflow Summary

```
1. git checkout -b feature/xyz     --> naya branch
2. [code likho, commit karo]       --> kaam karo
3. git push origin feature/xyz     --> GitHub pe bhejo
4. [GitHub pe PR banao]            --> review ke liye bhejo
5. [Teammate review kare]          --> feedback de
6. [Fix feedback, push again]      --> changes karo
7. [GitHub Action pass ho]         --> CI green ho
8. [Squash merge karo]             --> main mein merge
9. git checkout develop && git pull --> local update karo
10. git branch -d feature/xyz      --> branch delete karo
```

---

## Quick Revision

| Concept | Key Point |
|---|---|
| Git Flow | main, develop, feature/* branches |
| Feature Branch | Har feature ka alag branch |
| Pull Request | Code review ka darwaza |
| PR Template | What, Why, How to test, Checklist |
| Code Review | Logic, security, quality check |
| Branch Protection | Main pe direct push band |
| Squash Merge | Multiple commits = ek clean commit |
| GitHub Actions | Automatic test/lint on push |

---

## Aaj Kya Seekha?

1. Git Flow pattern — main, develop, feature branches
2. Feature branch workflow — branch banao, kaam karo, PR banao
3. Pull Request likhna — accha description, checklist
4. Code review process — kya dekhna hai, kaise comment karna hai
5. Branch protection — main branch ko safe rakhna
6. Squash merge — clean git history ke liye
7. GitHub Actions — automatic CI pipeline setup
