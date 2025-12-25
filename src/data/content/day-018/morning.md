# Day 18 Morning: Git Advanced — Merge, Rebase & Conflicts

> **Aaj ka plan:** Aaj hum Git ke advanced concepts seekhenge — merge vs rebase ka farak, merge conflicts kaise aate hain aur kaise solve karte hain, git stash se kaam temporarily save karna, cherry-pick se specific commit uthana, aur .gitignore best practices.

---

## Git Merge vs Rebase — Dono Kya Hain?

### Real-Life Analogy

> **Socho Aise:** Ek farmer ne apne khet mein do alag experiments kiye — ek organic fertilizer wala aur ek chemical wala. Ab dono results ko ek report mein combine karna hai. **Merge** matlab dono reports ko as-is staple kar do ek file mein. **Rebase** matlab organic wale experiment ke results ko chemical wale ke baad sequentially likh do — jaise sab kuch ek hi experiment tha.

---

## Git Merge — Branch Ko Combine Karo

Merge ek branch ka kaam doosri branch mein combine karta hai. Ye ek **merge commit** banata hai.

```bash
# Pehle main branch pe jao
git checkout main

# feature branch ko main mein merge karo
git merge feature-login
```

### Merge Ka Diagram

```
main:    A --- B --- C --------- M  (merge commit)
                \               /
feature:         D --- E --- F
```

> **Yaad Rakho:** Merge karne se ek naya commit `M` banta hai jisme dono branches ka kaam aa jata hai. History mein clearly dikhta hai ki kab branch bani aur kab merge hui.

### Fast-Forward Merge

Jab main branch pe koi naya commit nahi hota feature branch banane ke baad:

```bash
# Fast-forward merge — koi extra commit nahi banta
git checkout main
git merge feature-login
# Ye seedha pointer aage badha deta hai
```

```
# Before:
main:    A --- B
                \
feature:         C --- D

# After fast-forward merge:
main:    A --- B --- C --- D
```

> **Tip:** Fast-forward merge mein koi extra merge commit nahi banta — clean history rehti hai.

---

## Git Rebase — History Ko Clean Rakho

Rebase aapke branch ke commits ko doosri branch ke upar "replay" karta hai.

```bash
# Feature branch pe jao
git checkout feature-login

# Main branch ke upar rebase karo
git rebase main
```

### Rebase Ka Diagram

```
# Before rebase:
main:    A --- B --- C
                \
feature:         D --- E

# After rebase:
main:    A --- B --- C
                      \
feature:               D' --- E'  (naye commits, same changes)
```

> **Warning:** Rebase commits ki history re-write karta hai! Jo commits pehle the (D, E) wo naye ban jaate hain (D', E'). **Kabhi bhi shared/pushed branch pe rebase mat karo!**

### Merge vs Rebase — Comparison Table

| Feature | Merge | Rebase |
|---------|-------|--------|
| History | Branching history preserve hoti hai | Linear (seedhi) history |
| Extra Commit | Merge commit banta hai | Koi extra commit nahi |
| Safety | Safe for shared branches | Sirf local branches ke liye |
| Complexity | Simple | Thoda risky (conflict per commit) |
| Best For | Public/shared branches | Local feature branches |

> **Yaad Rakho:** **Golden Rule of Rebase** — Agar branch pe sirf tum kaam kar rahe ho, rebase karo. Agar team ke saath share ki hai, merge karo.

---

## Merge Conflicts — Kya, Kyun, Kaise?

### Conflict Kab Aata Hai?

Jab do log (ya do branches mein) **same file ki same line** ko alag tarike se edit karte hain.

> **Socho Aise:** Ek form hai — "Farmer Name: ____". Ek branch mein tumne likha "Rajesh" aur doosri branch mein kisine likha "Suresh". Git confuse ho gaya — kaunsa rakhun? Ye hai **merge conflict**.

### Conflict Kaise Dikhta Hai?

```
<<<<<<< HEAD
const farmerName = "Rajesh";
=======
const farmerName = "Suresh";
>>>>>>> feature-update
```

- `<<<<<<< HEAD` — tumhare current branch ka code
- `=======` — separator (divider)
- `>>>>>>> feature-update` — incoming branch ka code

### Conflict Resolve Kaise Karein?

**Step 1:** File kholo aur dekho kya conflict hai

```bash
git status
# Dekhega: both modified: farmer.js
```

**Step 2:** File edit karo — decide karo kya rakhna hai

```javascript
// Option 1: Apna rakhlo
const farmerName = "Rajesh";

// Option 2: Unka rakhlo
const farmerName = "Suresh";

// Option 3: Dono combine karo (best practice — team se baat karo)
const farmerName = "Rajesh Kumar";  // agreed upon name
```

**Step 3:** Conflict markers hatao (`<<<<<<<`, `=======`, `>>>>>>>`)

**Step 4:** Stage aur commit karo

```bash
git add farmer.js
git commit -m "Resolve merge conflict in farmer.js"
```

> **Tip:** VS Code mein conflict resolve karna bohot easy hai — ye "Accept Current", "Accept Incoming", "Accept Both" buttons dikhata hai. Ek click mein kaam ho jaata hai!

---

## Git Stash — Kaam Temporarily Save Karo

### Stash Kya Hai?

> **Socho Aise:** Tum kitchen mein khana bana rahe ho. Achanak doorbell bajti hai. Tum gas band karo, kaam temporarily roko — baad mein wapas aake continue karo. Yahi hai `git stash`!

```bash
# Current changes ko temporarily save karo
git stash

# Ab branch switch kar sakte ho
git checkout main

# Kaam ho gaya? Wapas aao aur stash wapas laao
git checkout feature-login
git stash pop
```

### Stash Commands

```bash
# Stash save karo with message
git stash save "login form ka kaam incomplete hai"

# Saari stashes dekho
git stash list
# stash@{0}: On feature-login: login form ka kaam incomplete hai
# stash@{1}: WIP on main: fixing bug

# Specific stash apply karo (remove nahi hota list se)
git stash apply stash@{0}

# Specific stash pop karo (remove bhi ho jata list se)
git stash pop stash@{0}

# Stash delete karo
git stash drop stash@{0}

# Saari stashes delete karo
git stash clear
```

> **Warning:** `git stash pop` ke baad stash list se hat jata hai. Agar safe rakhna hai to `git stash apply` use karo.

---

## Git Cherry-Pick — Specific Commit Uthao

### Cherry-Pick Kya Hai?

> **Socho Aise:** Ek ped pe bohot se fruits hain. Tumhe sirf ek specific cherry chahiye — poora ped nahi kaatna. Cherry-pick matlab — ek specific commit ko kisi bhi branch mein le aao bina poori branch merge kiye.

```bash
# Pehle commit hash dekho
git log --oneline
# a1b2c3d Fix critical payment bug
# e4f5g6h Add new UI component
# i7j8k9l Update README

# Sirf payment bug fix commit uthao
git checkout main
git cherry-pick a1b2c3d
```

### Kab Use Karein?

- Jab ek specific bug fix urgently production mein chahiye
- Jab kisi branch se sirf ek feature ka commit chahiye
- Hotfix scenarios mein

```bash
# Multiple commits cherry-pick karo
git cherry-pick a1b2c3d e4f5g6h

# Cherry-pick but commit mat karo (sirf changes laao)
git cherry-pick a1b2c3d --no-commit
```

> **Tip:** Cherry-pick se same changes do branches mein aa jaati hain. Baad mein merge karte waqt Git handle kar leta hai, lekin careful raho.

---

## .gitignore — Kya Track Nahi Karna

### .gitignore Kya Hai?

Ek file jo Git ko batati hai — "In files/folders ko track mat kar."

### Common .gitignore Patterns

```gitignore
# Node.js
node_modules/
npm-debug.log*

# Environment variables (SECRETS!)
.env
.env.local
.env.production

# OS files
.DS_Store          # macOS
Thumbs.db          # Windows

# IDE files
.vscode/settings.json
.idea/

# Build output
dist/
build/
*.min.js

# Logs
logs/
*.log

# Coverage reports
coverage/

# Temporary files
*.tmp
*.swp
```

> **Warning:** `.env` file ko **kabhi bhi** Git mein push mat karo! Usme passwords, API keys, database credentials hote hain. Ek baar push ho gaya to hackers ke paas pahunch sakta hai.

### Already Tracked File Ko Ignore Karna

```bash
# Agar file already tracked hai aur ab ignore karni hai
git rm --cached .env
# Ab .gitignore mein add karo
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Remove .env from tracking"
```

### Global .gitignore

```bash
# System-level ignore file banao
git config --global core.excludesfile ~/.gitignore_global

# Usme OS-specific files daalo
echo ".DS_Store" >> ~/.gitignore_global
echo "Thumbs.db" >> ~/.gitignore_global
```

---

## Useful Git Commands Recap

```bash
# Branch list dekho
git branch -a

# Remote branches dekho
git branch -r

# Branch delete karo (merged)
git branch -d feature-login

# Branch delete karo (force — unmerged bhi)
git branch -D feature-login

# Last commit ka diff dekho
git diff HEAD~1

# Specific file ka history dekho
git log --oneline -- farmer.js

# Graphical log dekho
git log --oneline --graph --all
```

---

## Quick Revision Table

| Concept | Kya Karta Hai | Command |
|---------|--------------|---------|
| Merge | Do branches combine karta hai | `git merge branch-name` |
| Rebase | Commits ko doosri branch pe replay karta hai | `git rebase main` |
| Conflict | Same line edit hone pe aata hai | Manually resolve karo |
| Stash | Changes temporarily save karta hai | `git stash` / `git stash pop` |
| Cherry-pick | Specific commit uthata hai | `git cherry-pick <hash>` |
| .gitignore | Files ko tracking se hatata hai | `.gitignore` file mein likho |

---

## Aaj Kya Seekha?

1. **Merge** — branches combine karta hai, merge commit banta hai
2. **Rebase** — linear history banata hai, commits replay hote hain
3. **Merge Conflicts** — same line pe alag changes se hota hai, manually resolve karo
4. **Stash** — kaam temporarily save karo, baad mein wapas laao
5. **Cherry-pick** — specific commit kisi bhi branch mein le jao
6. **.gitignore** — sensitive aur unnecessary files ko Git se chhupao
7. **Golden Rule** — shared branch pe rebase mat karo, merge karo!

> **Yaad Rakho:** Git ek time machine hai — lekin usko sahi se use karna aana chahiye. Aaj ke concepts professional development mein daily use hote hain. Evening session mein hum ye sab practically karenge!
