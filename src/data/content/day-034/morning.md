# Day 34 - Morning Session: CRUD API with Express + MongoDB (Mongoose)

> **Aaj ka plan:**
> Aaj hum real database — MongoDB — ko Express ke saath connect karenge. Mongoose ODM seekhenge — Schema, Model, aur full CRUD operations. Ab dummy arrays nahi, real database mein data save hoga!

---

## Mongoose Kya Hai?

Mongoose ek **ODM (Object Data Modeling)** library hai MongoDB ke liye. Yeh MongoDB ke raw driver ke upar ek layer hai jo Schema, validation, aur easy queries provide karta hai.

> **Socho Aise:**
> MongoDB raw driver = seedha zameen pe so jaana.
> Mongoose = ek comfortable bed ke saath sona.
> Dono mein neend aayegi, par Mongoose se aaram zyada hai!

| Feature | Raw MongoDB Driver | Mongoose |
|---------|-------------------|----------|
| Schema | Nahi hai (schema-less) | Schema define karte hain |
| Validation | Manual | Built-in |
| Queries | Raw queries | Helper methods |
| Relations | Manual | `populate()` method |
| Middleware | Nahi | Pre/Post hooks |

---

## Setup — Mongoose Install Karo

> **Terminal Command:**
> ```bash
> mkdir product-api && cd product-api
> npm init -y
> npm install express mongoose nodemon dotenv
> ```

### Environment Variables

```bash
# .env file banao
MONGODB_URI=mongodb://localhost:27017/kisanProductDB
PORT=3000
```

> **Warning:**
> `.env` file ko **kabhi git mein push mat karo!** `.gitignore` mein add karo:
> ```
> node_modules/
> .env
> ```

---

## MongoDB Se Connect Karo

```javascript
// config/db.js — Database connection
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Agar DB connect nahi hua toh app band karo
    process.exit(1);
  }
};

module.exports = connectDB;
```

> **Yaad Rakho:**
> `mongoose.connect()` ek **Promise** return karta hai. Isliye `async/await` use karte hain. Agar connection fail ho, toh `process.exit(1)` se app gracefully band ho jaati hai.

---

## Schema Definition — Data Ka Blueprint

Schema batata hai ki aapke document mein kya-kya fields honge aur unke types kya honge.

```javascript
// models/Product.js — Product ka Schema aur Model
const mongoose = require('mongoose');

// Schema define karo — yeh blueprint hai
const productSchema = new mongoose.Schema({
  // Naam — required hai, min 3 characters
  name: {
    type: String,
    required: [true, 'Product ka naam dena zaroori hai!'],
    trim: true,             // Extra spaces hata do
    minlength: [3, 'Naam kam se kam 3 characters ka hona chahiye']
  },

  // Description — optional
  description: {
    type: String,
    trim: true,
    default: 'No description available'
  },

  // Price — number, required, minimum 0
  price: {
    type: Number,
    required: [true, 'Price dena zaroori hai!'],
    min: [0, 'Price negative nahi ho sakta']
  },

  // Category — sirf allowed values
  category: {
    type: String,
    required: true,
    enum: {
      values: ['grain', 'vegetable', 'fruit', 'dairy', 'spice', 'other'],
      message: '{VALUE} valid category nahi hai'
    }
  },

  // Unit — kg, quintal, litre, piece
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'quintal', 'litre', 'piece', 'dozen']
  },

  // Stock quantity
  stock: {
    type: Number,
    default: 0,
    min: 0
  },

  // Farmer ka reference (baad mein populate karenge)
  farmerId: {
    type: String,
    required: true
  },

  // Active hai ya nahi
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  // Timestamps — createdAt aur updatedAt automatically add hoga
  timestamps: true
});

// Model banao aur export karo
// "Product" naam se MongoDB mein "products" collection banega
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
```

> **Yaad Rakho:**
> - `required: [true, 'error message']` — custom error message de sakte ho
> - `enum` se sirf allowed values accept hoti hain
> - `timestamps: true` se `createdAt` aur `updatedAt` automatic aate hain
> - `mongoose.model('Product', schema)` se MongoDB mein "products" (lowercase, plural) collection banti hai

---

## CRUD Operations — Mongoose Methods

### 1. CREATE — Naya Product Banao

```javascript
// Tarika 1: new Model() + save()
const product = new Product({
  name: 'Organic Gehun',
  price: 2200,
  category: 'grain',
  unit: 'quintal',
  stock: 100,
  farmerId: 'farmer001'
});
await product.save(); // Database mein save karo

// Tarika 2: Model.create() — ek line mein
const product2 = await Product.create({
  name: 'Tamatar',
  price: 40,
  category: 'vegetable',
  unit: 'kg',
  stock: 500,
  farmerId: 'farmer002'
});
```

### 2. READ — Data Padhna

```javascript
// Saare products lao
const allProducts = await Product.find();

// Filter ke saath — sirf vegetables
const veggies = await Product.find({ category: 'vegetable' });

// Ek specific product by ID
const product = await Product.findById('660abc123def456ghi789');

// Ek product condition se
const wheat = await Product.findOne({ name: 'Organic Gehun' });

// Selected fields + sorting + limit
const cheapProducts = await Product.find({ isActive: true })
  .select('name price category')    // Sirf ye fields lao
  .sort({ price: 1 })               // Price se sort (ascending)
  .limit(10);                        // Sirf 10 results
```

### 3. UPDATE — Data Badalna

```javascript
// findByIdAndUpdate — ID se dhundo aur update karo
const updated = await Product.findByIdAndUpdate(
  '660abc123def456ghi789',           // ID
  { price: 2500, stock: 80 },        // Kya change karna hai
  { new: true, runValidators: true }  // Options
);
// new: true → updated document return karo
// runValidators: true → validation check karo

// updateOne — condition se update
await Product.updateOne(
  { name: 'Tamatar' },               // Condition
  { price: 45 }                      // Update
);
```

### 4. DELETE — Data Hatana

```javascript
// findByIdAndDelete — ID se delete
const deleted = await Product.findByIdAndDelete('660abc123def456ghi789');

// deleteOne — condition se delete
await Product.deleteOne({ name: 'Old Product' });

// deleteMany — bahut saare delete
await Product.deleteMany({ isActive: false });
```

> **Warning:**
> `deleteMany({})` — agar empty object diya toh **SAARE documents delete** ho jayenge! Hamesha condition do.

---

## Validation in Schema

```javascript
// Validation examples
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Naam do!'],
    minlength: [3, 'Naam chhota hai'],
    maxlength: [100, 'Naam bahut lamba hai']
  },
  email: {
    type: String,
    match: [/^\S+@\S+\.\S+$/, 'Email sahi nahi hai']
  },
  price: {
    type: Number,
    min: [0, 'Price negative nahi ho sakta'],
    max: [1000000, 'Price bahut zyada hai']
  },
  category: {
    type: String,
    enum: ['grain', 'vegetable', 'fruit'],
    // Agar galat value di toh error
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
});
```

> **Tip:**
> Custom validator bhi bana sakte ho:
> ```javascript
> phone: {
>   type: String,
>   validate: {
>     validator: function(v) {
>       return /^[6-9]\d{9}$/.test(v); // Indian phone number check
>     },
>     message: 'Valid Indian phone number do!'
>   }
> }
> ```

---

## Error Handling Pattern

```javascript
// Mongoose errors ko catch karna
try {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
} catch (error) {
  // Validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages
    });
  }

  // Duplicate key error (e.g., unique email)
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate value — yeh pehle se exist karta hai'
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: 'Server error'
  });
}
```

---

## Quick Revision Table

| Concept | Code | Kya Karta Hai |
|---------|------|---------------|
| Connect | `mongoose.connect(uri)` | MongoDB se connect karo |
| Schema | `new mongoose.Schema({...})` | Data ka blueprint |
| Model | `mongoose.model('Name', schema)` | Collection ka interface |
| Create | `Model.create({...})` | Naya document banao |
| Find All | `Model.find({})` | Saare documents lao |
| Find One | `Model.findById(id)` | ID se ek document lao |
| Update | `Model.findByIdAndUpdate(id, data)` | Document update karo |
| Delete | `Model.findByIdAndDelete(id)` | Document delete karo |
| Validation | `required`, `min`, `enum` | Data validate karo |
| Timestamps | `{ timestamps: true }` | Auto date fields |

---

## Aaj Kya Seekha?

1. **Mongoose** MongoDB ke liye ODM hai — Schema, validation, aur easy queries deta hai
2. **Schema** data ka blueprint hai — types, required fields, validation sab define karte hain
3. **Model** schema se banta hai aur database operations ke liye use hota hai
4. **CRUD operations** — `create()`, `find()`, `findByIdAndUpdate()`, `findByIdAndDelete()`
5. **Validation** schema level pe hoti hai — `required`, `min`, `max`, `enum`, custom validators
6. **Error handling** mein validation errors aur duplicate key errors alag handle karo
7. **timestamps: true** se `createdAt`/`updatedAt` automatically manage hote hain

> **Practice Time!**
> Evening mein complete Products CRUD API banayenge Mongoose ke saath — har endpoint test karenge Postman/curl se!
