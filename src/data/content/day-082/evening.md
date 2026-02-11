# Day 82 Evening: Practice — React App Setup + Components Build

> **Aaj ka plan:** Ab theory done hai, toh hands-on karte hain! Vite se React app create karenge, Header/Footer/Card components banayenge, props pass karenge, aur ek list of items render karenge. Let's build!

---

## Task 1: Vite Se React App Create Karo

> **Terminal Command:**
```bash
# React app create karo
npm create vite@latest kisan-dashboard -- --template react

# Project folder mein jao
cd kisan-dashboard

# Dependencies install karo
npm install

# Dev server start karo
npm run dev
```

Browser mein `http://localhost:5173` kholo — React app chal rahi hogi!

### Folder Structure Setup Karo

```bash
# Components aur pages folders banao
mkdir -p src/components src/pages
```

```
kisan-dashboard/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── ProductCard.jsx
│   ├── pages/
│   │   └── HomePage.jsx
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
└── ...
```

> **Tip:** Har component ki apni file hoti hai. Ek file mein ek component — ye clean code ka rule hai.

---

## Task 2: Header Component Banao

### `src/components/Header.jsx`

```jsx
// Header component — har page pe dikhega
const Header = ({ title, userName }) => {
  return (
    <header style={{
      backgroundColor: '#2d3748',
      color: 'white',
      padding: '15px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Left side — App name */}
      <div>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{title}</h1>
        <small>Admin Dashboard</small>
      </div>

      {/* Right side — User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>Welcome, {userName}</span>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#48bb78',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {/* Pehla letter dikhao naam ka */}
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
```

> **Socho Aise:** Header ek reusable component hai. `title` aur `userName` props hain — alag alag pages pe alag values de sakte ho. Ek baar banao, har jagah use karo!

---

## Task 3: Footer Component Banao

### `src/components/Footer.jsx`

```jsx
// Footer component — page ke bottom mein
const Footer = ({ companyName, year }) => {
  return (
    <footer style={{
      backgroundColor: '#1a202c',
      color: '#a0aec0',
      padding: '20px 30px',
      textAlign: 'center',
      marginTop: 'auto'  // Hamesha bottom mein rahega
    }}>
      <p style={{ margin: '5px 0' }}>
        &copy; {year} {companyName}. All rights reserved.
      </p>
      <p style={{ margin: '5px 0', fontSize: '14px' }}>
        Built with React + Express + MongoDB
      </p>
      <div style={{ marginTop: '10px' }}>
        <a href="#" style={{ color: '#48bb78', marginRight: '15px' }}>Privacy Policy</a>
        <a href="#" style={{ color: '#48bb78', marginRight: '15px' }}>Terms of Service</a>
        <a href="#" style={{ color: '#48bb78' }}>Contact</a>
      </div>
    </footer>
  );
};

export default Footer;
```

---

## Task 4: ProductCard Component Banao

### `src/components/ProductCard.jsx`

```jsx
// Product Card — har ek product ke liye
const ProductCard = ({ name, price, category, stock, image }) => {
  // Stock ke hisab se color decide karo
  const stockColor = stock > 50 ? '#48bb78' : stock > 10 ? '#ecc94b' : '#fc8181';
  const stockLabel = stock > 50 ? 'In Stock' : stock > 10 ? 'Low Stock' : 'Almost Out!';

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      width: '280px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      cursor: 'pointer'
    }}>
      {/* Product image placeholder */}
      <div style={{
        height: '150px',
        backgroundColor: '#edf2f7',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        marginBottom: '15px'
      }}>
        {image || '📦'}
      </div>

      {/* Category badge */}
      <span style={{
        backgroundColor: '#ebf8ff',
        color: '#2b6cb0',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {category}
      </span>

      {/* Product name */}
      <h3 style={{ margin: '10px 0 5px' }}>{name}</h3>

      {/* Price */}
      <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d3748', margin: '5px 0' }}>
        ₹{price}
      </p>

      {/* Stock status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          color: stockColor,
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          ● {stockLabel} ({stock} units)
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
```

> **Yaad Rakho:** Component ke andar JavaScript logic likh sakte ho — jaise `stockColor` decide karna. Ye React ki power hai — logic + UI ek jagah!

---

## Task 5: Products List Render Karo (Array se)

### `src/pages/HomePage.jsx`

```jsx
import ProductCard from '../components/ProductCard';

// Products data — baad mein ye API se aayega
const products = [
  { id: 1, name: 'Organic Wheat', price: 250, category: 'Grains', stock: 120, image: '🌾' },
  { id: 2, name: 'Fresh Mangoes', price: 150, category: 'Fruits', stock: 8, image: '🥭' },
  { id: 3, name: 'Basmati Rice', price: 400, category: 'Grains', stock: 75, image: '🍚' },
  { id: 4, name: 'Organic Honey', price: 350, category: 'Dairy', stock: 30, image: '🍯' },
  { id: 5, name: 'Fresh Tomatoes', price: 40, category: 'Vegetables', stock: 200, image: '🍅' },
  { id: 6, name: 'Pure Ghee', price: 550, category: 'Dairy', stock: 5, image: '🧈' },
];

const HomePage = () => {
  return (
    <div style={{ padding: '30px' }}>
      <h2>Our Products</h2>
      <p style={{ color: '#718096' }}>Total: {products.length} products available</p>

      {/* Products grid — map se render karo */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        marginTop: '20px'
      }}>
        {products.map((product) => (
          <ProductCard
            key={product.id}         // Unique key zaroori hai!
            name={product.name}
            price={product.price}
            category={product.category}
            stock={product.stock}
            image={product.image}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
```

> **Warning:** `key` prop har list item ko dena zaroori hai! React key se identify karta hai ki kaunsa item change hua. Bina key ke React confuse ho jata hai aur bugs aate hain.

---

## Task 6: App.jsx Mein Sab Jodo

### `src/App.jsx`

```jsx
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header — props pass kar rahe hain */}
      <Header title="Kisan Dashboard" userName="Arjun" />

      {/* Main content */}
      <main style={{ flex: 1 }}>
        <HomePage />
      </main>

      {/* Footer */}
      <Footer companyName="ArujaAgri" year={2026} />
    </div>
  );
}

export default App;
```

> **Expected Output:** Browser mein ek sundar dashboard dikhega — top pe Header (dark background, user name), beech mein product cards ki grid, aur bottom pe Footer.

---

## Bonus: Children Props

```jsx
// Container component jo children accept kare
const Card = ({ children, title }) => (
  <div style={{
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
    margin: '10px'
  }}>
    <h3>{title}</h3>
    {children}  {/* Jo bhi andar likho wo yahan aayega */}
  </div>
);

// Usage
<Card title="User Stats">
  <p>Total Users: 1,234</p>
  <p>Active Today: 567</p>
</Card>

<Card title="Revenue">
  <p>This Month: ₹45,000</p>
</Card>
```

> **Tip:** `children` ek special prop hai — component ke opening aur closing tags ke beech jo bhi likho, wo `children` mein aata hai.

---

## Quick Revision Table

| Task | Kya Kiya | Key Concept |
|------|----------|-------------|
| Vite setup | React project create kiya | `npm create vite@latest` |
| Header | Top navigation bar component | Props: `title`, `userName` |
| Footer | Bottom section component | Props: `companyName`, `year` |
| ProductCard | Reusable card with stock logic | Conditional styling |
| Products list | Array se cards render kiye | `map()` + `key` prop |
| App composition | Sab components jode | Component tree |
| Children props | Dynamic content inside component | `{children}` special prop |

---

## Aaj Kya Seekha?

1. **Vite** se React project create karna fast aur easy hai
2. **Components** ko alag files mein rakhna — clean code practice
3. **Props** se data pass karna — parent to child one-way flow
4. **Array.map()** se list of items render karna — `key` prop zaroori hai
5. **Component composition** — chhote components mila ke bada UI banana
6. **Children prop** — component ke andar dynamic content dalna

> **Practice Time!** Ye project mein aur components add karo — StatsCard, Sidebar, NotificationBadge. Jitna practice, utna better! Kal hum **state aur events** seekhenge!
