# Day 82 Morning: React.js — Introduction, JSX & Components

> **Aaj ka plan:** Aaj hum React.js ki duniya mein kadam rakhenge. Samjhenge ki React kya hai, kyu use karte hain (specifically frontend dashboard ke liye), JSX kya hai, components kaise banate hain, aur props kaise pass karte hain. Yaad raho — hamara focus backend pe hai, React sirf dashboard UI ke liye seekh rahe hain!

---

## React.js Kya Hai?

### Facebook Ka Gift to Developers

React ek **JavaScript library** hai jo user interfaces banane ke liye use hoti hai. Facebook ne 2013 mein isse open-source kiya. Aaj duniya ki biggest companies React use karti hain — Facebook, Instagram, Netflix, Airbnb, sab!

> **Socho Aise:** Tumne 80+ din mein powerful backend APIs banaye — Express, MongoDB, authentication, file upload, WebSocket — sab seekha. Lekin admin ko ek sundar dashboard chahiye jahan se wo products manage kare, users dekhe, analytics samjhe. Yahi kaam React se hoga!

### Kyu React? (Backend Developer Perspective)

| Problem | React Ka Solution |
|---------|-------------------|
| Backend API ka data dikhana hai | React components mein data render karo |
| Admin dashboard banani hai | React se fast, interactive UI bana sakte ho |
| Real-time updates dikhane hain | React state management se automatic UI update |
| Multiple pages chahiye | React Router se SPA ban jata hai |

> **Yaad Rakho:** Hum React ONLY frontend dashboard ke liye seekh rahe hain. Backend humesha Express + Node.js rahega. React sirf ek presentation layer hai jo tumhare APIs ko consume karega.

---

## SPA (Single Page Application) Concept

### Traditional Website vs SPA

**Traditional Website:**
- Har page pe server se naya HTML aata hai
- Page reload hota hai har baar
- Slow experience

**SPA (React):**
- Ek hi HTML page load hota hai
- JavaScript dynamically content change karti hai
- Page reload nahi hota — fast experience!

> **Socho Aise:** Traditional website aise hai jaise har baar naya letter aaye post se. SPA aise hai jaise WhatsApp — ek baar app kholo, phir messages real-time mein aate hain bina app restart kiye.

```
Traditional: Click -> Server -> New HTML Page -> Render
SPA React:   Click -> JavaScript -> Update DOM -> Same Page, New Content
```

---

## Project Setup — Vite (Modern Way)

### Kyu Vite? (create-react-app vs Vite)

| Feature | create-react-app | Vite |
|---------|-----------------|------|
| Speed | Slow startup | Bahut fast |
| Bundle Size | Bada | Chhota |
| Hot Reload | Thoda slow | Instant |
| 2026 mein Status | Deprecated | Recommended |

> **Terminal Command:**
```bash
# Vite se React project banao
npm create vite@latest my-dashboard -- --template react

# Folder mein jao
cd my-dashboard

# Dependencies install karo
npm install

# Dev server start karo
npm run dev
```

### Folder Structure Samjho

```
my-dashboard/
├── public/           # Static files (images, favicon)
├── src/
│   ├── assets/       # Images, CSS
│   ├── components/   # Reusable components (Header, Card, etc.)
│   ├── pages/        # Page components (Home, Dashboard, etc.)
│   ├── App.jsx       # Main App component
│   ├── App.css       # App ki styling
│   └── main.jsx      # Entry point (ReactDOM render)
├── index.html        # Single HTML file (SPA!)
├── package.json      # Dependencies
└── vite.config.js    # Vite configuration
```

> **Tip:** `components/` mein reusable pieces rakho (Button, Card, Header) aur `pages/` mein full page components (HomePage, DashboardPage). Ye pattern professional projects mein hota hai.

---

## JSX — JavaScript + XML

### JSX Kya Hai?

JSX ek syntax extension hai jo HTML jaisa dikhta hai lekin JavaScript ke andar likha jata hai. React isse samajhta hai aur DOM mein render karta hai.

```jsx
// Ye JSX hai — HTML jaisa dikhta hai lekin JavaScript hai!
const element = <h1>Namaste React!</h1>;

// Behind the scenes ye ban jata hai:
const element2 = React.createElement('h1', null, 'Namaste React!');
```

### JSX Ke Rules

```jsx
// Rule 1: Ek hi parent element hona chahiye
// GALAT ❌
return (
  <h1>Title</h1>
  <p>Paragraph</p>
);

// SAHI ✅
return (
  <div>
    <h1>Title</h1>
    <p>Paragraph</p>
  </div>
);

// Ya Fragment use karo ✅
return (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);

// Rule 2: JavaScript likhne ke liye curly braces {} use karo
const name = "Arjun";
return <h1>Hello, {name}!</h1>;

// Rule 3: class ki jagah className likho
return <div className="container">Content</div>;

// Rule 4: Self-closing tags close karo
return <img src="photo.jpg" alt="Photo" />;
```

> **Yaad Rakho:** JSX mein `class` nahi likhte, `className` likhte hain. `for` nahi likhte, `htmlFor` likhte hain. Kyunki `class` aur `for` JavaScript ke reserved words hain!

---

## Functional Components

### Component Kya Hai?

Component ek reusable UI piece hai. Jaise LEGO blocks se building banti hai, waise components se UI banta hai.

```jsx
// Sabse simple component — ek function jo JSX return kare
function Welcome() {
  return <h1>Welcome to Dashboard!</h1>;
}

// Arrow function style (popular)
const Welcome = () => {
  return <h1>Welcome to Dashboard!</h1>;
};

// Component use karna
function App() {
  return (
    <div>
      <Welcome />    {/* Component aise call hota hai */}
      <Welcome />    {/* Reuse kar sakte ho! */}
    </div>
  );
}
```

> **Socho Aise:** Component aise hai jaise ek chapati maker machine. Ek baar banao, phir baar baar chapati nikalo. Ek baar Header component banao, phir har page pe use karo!

---

## Props — Components Ko Data Dena

### Props Kya Hain?

Props (properties) wo data hai jo ek component doosre component ko deta hai. Jaise function ke arguments hote hain, waise components ke props hote hain.

```jsx
// Props receive karna
function ProductCard({ name, price, category }) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>Price: ₹{price}</p>
      <span>Category: {category}</span>
    </div>
  );
}

// Props pass karna
function App() {
  return (
    <div>
      {/* Har card ko alag data de rahe hain */}
      <ProductCard name="Organic Wheat" price={250} category="Grains" />
      <ProductCard name="Fresh Mango" price={150} category="Fruits" />
      <ProductCard name="Basmati Rice" price={400} category="Grains" />
    </div>
  );
}
```

> **Yaad Rakho:** Props **read-only** hain! Child component props ko change nahi kar sakta. Ye one-way data flow hai — parent se child ko data jata hai, ulta nahi.

---

## Component Composition — Components Ke Andar Components

```jsx
// Chhote components banao
const Header = () => (
  <header>
    <h1>Kisan Dashboard</h1>
    <nav>Home | Products | Orders</nav>
  </header>
);

const Sidebar = () => (
  <aside>
    <ul>
      <li>Dashboard</li>
      <li>Products</li>
      <li>Users</li>
      <li>Settings</li>
    </ul>
  </aside>
);

const StatsCard = ({ title, value, color }) => (
  <div style={{ borderLeft: `4px solid ${color}` }}>
    <h4>{title}</h4>
    <p style={{ fontSize: '24px' }}>{value}</p>
  </div>
);

// Bade component mein compose karo
const Dashboard = () => (
  <div>
    <Header />
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main>
        <h2>Overview</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <StatsCard title="Total Users" value="1,234" color="blue" />
          <StatsCard title="Total Products" value="567" color="green" />
          <StatsCard title="Total Orders" value="890" color="orange" />
        </div>
      </main>
    </div>
  </div>
);
```

> **Tip:** Component tree aise socho: `App > Dashboard > Header + Sidebar + MainContent > StatsCard`. Har level pe components banao aur compose karo. Ye React ka core philosophy hai!

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| React | UI library for building interfaces | Frontend dashboard |
| SPA | Single Page Application — no reload | Gmail, Facebook |
| Vite | Fast build tool for React projects | `npm create vite@latest` |
| JSX | HTML-like syntax inside JavaScript | `<h1>{name}</h1>` |
| Component | Reusable UI building block (function) | `function Header()` |
| Props | Data passed from parent to child | `<Card name="Wheat" />` |
| Composition | Components ke andar components | `<App><Header/><Main/></App>` |
| Fragment | Empty wrapper `<>...</>` | Multiple elements return karna |

---

## Aaj Kya Seekha?

1. **React** ek UI library hai — hum isse sirf frontend dashboard ke liye use karenge
2. **SPA** concept — ek hi page load hota hai, JavaScript content dynamically change karti hai
3. **Vite** modern aur fast build tool hai React projects ke liye
4. **JSX** HTML jaisa dikhta hai lekin JavaScript hai — curly braces mein JS likhte hain
5. **Functional Components** — functions jo JSX return karti hain, yehi modern React ka tarika hai
6. **Props** — parent se child ko data pass karne ka tarika, read-only hota hai
7. **Component Composition** — chhote components mila ke bade UI banate hain

> **Practice Time!** Evening session mein hum Vite se React app create karenge aur real components banayenge — Header, Footer, ProductCard. Ready ho jao!
