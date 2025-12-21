# Day 6 Morning: DOM Basics + Git Branching

> **Aaj ka plan:** Aaj do powerful cheezein seekhenge — DOM (Document Object Model) jo webpage ko interactive banata hai, aur Git Branching jo teamwork mein code manage karta hai. DOM se browser mein elements create/change karenge, aur Git branches se parallel kaam karenge!

---

## DOM Kya Hai?

DOM (Document Object Model) ek tree structure hai jo browser HTML page se banata hai. Har HTML tag ek "node" hai, aur JavaScript se hum in nodes ko access, modify, add, ya delete kar sakte hain.

```
document
  └── html
       ├── head
       │    └── title
       └── body
            ├── h1
            ├── p
            └── div
                 ├── p
                 └── button
```

> **Socho Aise:** DOM ek family tree jaisa hai. `document` sabka baap hai. `html` uska beta. `head` aur `body` pote hain. Har element ka apna parent, children, aur siblings hain!

---

## Elements Select Karo

### querySelector — CSS Selector se ek element dhundho

```html
<!-- HTML Structure -->
<div id="app">
  <h1 class="title">Kisan Market</h1>
  <p class="subtitle">Best prices for farmers</p>
  <button id="btn-submit">Submit</button>
  <ul class="crop-list">
    <li>Wheat</li>
    <li>Rice</li>
    <li>Cotton</li>
  </ul>
</div>
```

```javascript
// ID se select — # use karo
const app = document.querySelector("#app");
const btn = document.querySelector("#btn-submit");

// Class se select — . use karo
const title = document.querySelector(".title");
const subtitle = document.querySelector(".subtitle");

// Tag se select
const heading = document.querySelector("h1");

// Nested selector
const firstItem = document.querySelector(".crop-list li");  // Pehla li milega

// querySelectorAll — SARE matching elements (NodeList)
const allItems = document.querySelectorAll(".crop-list li");
console.log(allItems.length);  // 3

// NodeList pe loop
allItems.forEach((item, index) => {
  console.log(`${index + 1}. ${item.textContent}`);
});
```

> **Yaad Rakho:** `querySelector` sirf pehla matching element deta hai. Sab chahiye to `querySelectorAll` use karo. Ye CSS selectors use karta hai — same jo CSS mein likhte ho!

### Purane Methods (ab bhi kaam karte hain)

```javascript
// getElementById — fastest
const app = document.getElementById("app");

// getElementsByClassName — HTMLCollection return karta hai
const items = document.getElementsByClassName("crop-list");

// getElementsByTagName
const paragraphs = document.getElementsByTagName("p");
```

> **Tip:** Modern code mein `querySelector` / `querySelectorAll` use karo. Ye zyada flexible hain aur CSS selectors support karte hain.

---

## Content Change Karo

### textContent vs innerHTML

```javascript
const heading = document.querySelector("h1");

// textContent — sirf text, HTML nahi
heading.textContent = "Naya Heading";
console.log(heading.textContent);  // "Naya Heading"

// innerHTML — HTML bhi daal sakte ho
heading.innerHTML = "Kisan <span style='color:green'>Market</span>";
// Ab "Market" green color mein dikhega

// innerHTML vs textContent — security
const userInput = "<script>alert('Hacked!')</script>";

// DANGEROUS — innerHTML se XSS attack ho sakta hai!
// heading.innerHTML = userInput;  // Script execute ho jayega!

// SAFE — textContent se script as text dikhega
heading.textContent = userInput;  // "<script>..." as plain text
```

> **Warning:** User input ko kabhi `innerHTML` se mat daalo! XSS (Cross-Site Scripting) attack ho sakta hai. Hamesha `textContent` use karo user data ke liye.

---

## Elements Create & Add Karo

```javascript
// 1. Naya element banao
const newItem = document.createElement("li");
newItem.textContent = "Sugarcane";
newItem.classList.add("crop-item");

// 2. Existing list mein add karo
const cropList = document.querySelector(".crop-list");
cropList.appendChild(newItem);  // End mein add

// 3. Multiple items add karo
const newCrops = ["Bajra", "Jowar", "Maize"];
newCrops.forEach(cropName => {
  const li = document.createElement("li");
  li.textContent = cropName;
  li.classList.add("crop-item");
  cropList.appendChild(li);
});

// 4. Insert before — specific position pe
const firstChild = cropList.firstElementChild;
const topItem = document.createElement("li");
topItem.textContent = "Soybean (TOP)";
cropList.insertBefore(topItem, firstChild);

// 5. Remove element
const lastItem = cropList.lastElementChild;
cropList.removeChild(lastItem);  // Last item hatao

// Modern way — element khud ko remove kare
// lastItem.remove();
```

---

## Styles & Classes Modify Karo

```javascript
const title = document.querySelector(".title");

// Inline styles
title.style.color = "green";
title.style.fontSize = "32px";
title.style.backgroundColor = "#f0f0f0";
title.style.padding = "10px";

// Classes add/remove/toggle
const btn = document.querySelector("#btn-submit");

btn.classList.add("active");        // Class add karo
btn.classList.remove("disabled");   // Class hatao
btn.classList.toggle("highlight");  // Hai to hatao, nahi hai to lagao
btn.classList.contains("active");   // true — class hai ya nahi

// Attributes
btn.setAttribute("disabled", "true");
btn.getAttribute("id");     // "btn-submit"
btn.removeAttribute("disabled");
```

---

## Event Listeners — Interaction Handle Karo

```javascript
const btn = document.querySelector("#btn-submit");

// 1. Click event
btn.addEventListener("click", function() {
  console.log("Button click hua!");
  alert("Form submitted!");
});

// 2. Arrow function ke saath
btn.addEventListener("click", () => {
  btn.textContent = "Submitted!";
  btn.style.backgroundColor = "green";
  btn.style.color = "white";
});

// 3. Event object — kya hua ki detail
btn.addEventListener("click", (event) => {
  console.log("Event type:", event.type);       // "click"
  console.log("Target:", event.target);          // button element
  console.log("Timestamp:", event.timeStamp);
});

// 4. Input event — real-time typing detect
const input = document.querySelector("#search-input");
input.addEventListener("input", (e) => {
  console.log("User typed:", e.target.value);
});

// 5. Keydown event
document.addEventListener("keydown", (e) => {
  console.log(`Key pressed: ${e.key}`);
  if (e.key === "Enter") {
    console.log("Enter dabaya!");
  }
});

// 6. Form submit
const form = document.querySelector("#myForm");
form.addEventListener("submit", (e) => {
  e.preventDefault();  // Page reload rokko!
  console.log("Form data process ho raha hai...");
});
```

> **Yaad Rakho:** `e.preventDefault()` default browser behavior rokta hai — jaise form submit pe page reload, ya link click pe navigate. Ye bahut important hai modern web apps mein!

### Common Events

| Event | Kab Fire Hota Hai |
|-------|------------------|
| `click` | Element pe click karo |
| `dblclick` | Double click |
| `input` | Input field mein type karo |
| `change` | Input ki value change ho (blur pe) |
| `submit` | Form submit ho |
| `keydown` | Keyboard key dabao |
| `keyup` | Keyboard key chhodho |
| `mouseover` | Mouse element pe aaye |
| `mouseout` | Mouse element se jaye |
| `load` | Page/image load ho jaye |

---

## Git Branching — Parallel Kaam Karo

Ab Git ka powerful feature — Branching! Branch matlab ek alag copy jahan tum apna kaam karo, main code safe rahe.

### Branch Kya Hai?

```
main:     A --- B --- C
                       \
feature:                D --- E
```

> **Socho Aise:** Branch ek copy of your code hai. Jaise ek notebook ka photocopy bana lo — original safe, copy pe experiment karo. Kaam achha lage to original mein merge karo!

### Basic Branch Commands

```bash
# Current branch dekho
git branch

# Nayi branch banao
git branch feature-login

# Branch pe jao (switch)
git checkout feature-login
# ya modern command
git switch feature-login

# Branch banao AUR uspe jao — ek command mein
git checkout -b feature-signup
# ya
git switch -c feature-signup

# Sab branches dekho
git branch -a

# Branch delete karo (merge hone ke baad)
git branch -d feature-login
```

### Branch Workflow

```bash
# Step 1: Main branch pe ho — naya feature shuru karo
git checkout main

# Step 2: Feature branch banao
git checkout -b feature-crop-list

# Step 3: Apna kaam karo
# ... files edit karo ...
git add .
git commit -m "Add crop listing feature"

# Step 4: Aur kaam karo
# ... more changes ...
git add .
git commit -m "Add crop price display"

# Step 5: Main branch pe wapas jao
git checkout main

# Step 6: Feature branch ko main mein merge karo
git merge feature-crop-list

# Step 7: Feature branch delete karo (optional)
git branch -d feature-crop-list
```

### Merge Conflicts — Jab Do Log Same Line Edit Karein

```bash
# Agar merge mein conflict aaye to:
# 1. Git batayega kaunsi file mein conflict hai
# 2. File kholke manually fix karo
# 3. Phir commit karo

# Conflict file mein aisa dikhega:
# <<<<<<< HEAD
# console.log("Main branch ka code");
# =======
# console.log("Feature branch ka code");
# >>>>>>> feature-branch

# Fix karo — jo chahiye wo rakho, markers hatao
# Phir:
git add .
git commit -m "Resolve merge conflict in index.js"
```

> **Warning:** Merge conflicts se daro mat! Ye normal hai. File kholo, samjho dono changes ko, decide karo kya rakhna hai, markers hatao, commit karo. Practice se aasan ho jayega!

---

## Quick Revision

| Concept | Ek Line Mein |
|---------|-------------|
| DOM | HTML ka tree structure — JS se manipulate karo |
| `querySelector` | CSS selector se element dhundho |
| `querySelectorAll` | Sab matching elements dhundho |
| `textContent` | Safe text change (XSS proof) |
| `innerHTML` | HTML inject karo (careful!) |
| `createElement` | Naya element banao |
| `appendChild` | Child element add karo |
| `addEventListener` | Event pe code chalao |
| `preventDefault()` | Default browser action rokko |
| `git branch` | Nayi branch banao/dekho |
| `git checkout -b` | Branch banao aur switch karo |
| `git merge` | Branch ka kaam main mein lao |

---

## Aaj Kya Seekha?

- DOM kya hai — HTML ka JavaScript representation
- Elements select karna — querySelector, querySelectorAll
- Content change karna — textContent vs innerHTML
- Elements create, add, remove karna
- Event listeners — click, input, keydown, submit
- Git branching — parallel development ka powerful tool
- Merge karna aur conflicts handle karna
