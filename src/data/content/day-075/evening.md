# Day 75 — Testing: Unit Tests with Jest (Evening Session — Practice)

> **Aaj ka plan:**
> Ab hum hands-on practice karenge — utility functions ke tests likhenge, User model test karenge, database calls mock karenge, aur coverage report dekhenge.

---

## Practice 1: Utility Functions Ke Tests

Pehle ek `utils.js` file banao jismein common helper functions hain:

```javascript
// utils/stringUtils.js

// String ko capitalize karo — pehla letter bada
function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Email valid hai ya nahi
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Slug banao URL ke liye — "Hello World" => "hello-world"
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // special characters hatao
    .replace(/\s+/g, '-');        // spaces ko dash se replace karo
}

module.exports = { capitalize, isValidEmail, slugify };
```

Ab tests likho:

```javascript
// utils/stringUtils.test.js
const { capitalize, isValidEmail, slugify } = require('./stringUtils');

describe('String Utility Functions', () => {

  // --- capitalize tests ---
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');     // h -> H
      expect(capitalize('world')).toBe('World');
    });

    it('should handle already capitalized string', () => {
      expect(capitalize('HELLO')).toBe('Hello');     // HELLO -> Hello
    });

    it('should return empty string for invalid input', () => {
      expect(capitalize('')).toBe('');       // empty string
      expect(capitalize(null)).toBe('');     // null input
      expect(capitalize(undefined)).toBe(''); // undefined input
      expect(capitalize(123)).toBe('');      // number input
    });
  });

  // --- isValidEmail tests ---
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('ravi@gmail.com')).toBe(true);
      expect(isValidEmail('farmer.app@agri.co.in')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('ravi@')).toBe(false);         // domain nahi hai
      expect(isValidEmail('ravi@.com')).toBe(false);     // domain galat
      expect(isValidEmail('@gmail.com')).toBe(false);    // username nahi
      expect(isValidEmail('ravigmail.com')).toBe(false); // @ nahi hai
    });
  });

  // --- slugify tests ---
  describe('slugify', () => {
    it('should convert text to URL slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Farmer App Dashboard')).toBe('farmer-app-dashboard');
    });

    it('should remove special characters', () => {
      expect(slugify('Price: Rs.500!')).toBe('price-rs500');
    });

    it('should handle extra spaces', () => {
      expect(slugify('  too   many   spaces  ')).toBe('too-many-spaces');
    });
  });
});
```

> **Terminal Command:**
> ```bash
> npx jest stringUtils.test.js --verbose
> ```

> **Expected Output:**
> ```
> PASS  utils/stringUtils.test.js
>   String Utility Functions
>     capitalize
>       ✓ should capitalize first letter (2 ms)
>       ✓ should handle already capitalized string (1 ms)
>       ✓ should return empty string for invalid input (1 ms)
>     isValidEmail
>       ✓ should return true for valid emails (1 ms)
>       ✓ should return false for invalid emails (1 ms)
>     slugify
>       ✓ should convert text to URL slug (1 ms)
>       ✓ should remove special characters
>       ✓ should handle extra spaces (1 ms)
> ```

---

## Practice 2: Price Calculator Tests

```javascript
// utils/priceUtils.js
function calculateTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items array is required');
  }
  return items.reduce((sum, item) => {
    if (item.price < 0) throw new Error('Price cannot be negative');
    return sum + (item.price * item.quantity);
  }, 0);
}

function applyDiscount(total, discountPercent) {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount must be between 0 and 100');
  }
  return total - (total * discountPercent / 100);
}

module.exports = { calculateTotal, applyDiscount };
```

```javascript
// utils/priceUtils.test.js
const { calculateTotal, applyDiscount } = require('./priceUtils');

describe('Price Utility Functions', () => {

  describe('calculateTotal', () => {
    it('should calculate total for items', () => {
      const items = [
        { name: 'Chawal', price: 50, quantity: 2 },   // 100
        { name: 'Dal', price: 80, quantity: 1 },       // 80
      ];
      expect(calculateTotal(items)).toBe(180);  // 100 + 80 = 180
    });

    it('should throw error for empty array', () => {
      expect(() => calculateTotal([])).toThrow('Items array is required');
    });

    it('should throw error for non-array input', () => {
      expect(() => calculateTotal('hello')).toThrow('Items array is required');
      expect(() => calculateTotal(null)).toThrow('Items array is required');
    });

    it('should throw error for negative price', () => {
      const items = [{ name: 'Test', price: -10, quantity: 1 }];
      expect(() => calculateTotal(items)).toThrow('Price cannot be negative');
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      expect(applyDiscount(1000, 10)).toBe(900);   // 10% off 1000 = 900
      expect(applyDiscount(500, 50)).toBe(250);     // 50% off 500 = 250
    });

    it('should return same amount for 0% discount', () => {
      expect(applyDiscount(1000, 0)).toBe(1000);    // no discount
    });

    it('should throw error for invalid discount', () => {
      expect(() => applyDiscount(1000, -5)).toThrow('Discount must be between 0 and 100');
      expect(() => applyDiscount(1000, 150)).toThrow('Discount must be between 0 and 100');
    });
  });
});
```

---

## Practice 3: User Model Tests with Mocking

```javascript
// models/User.js
const db = require('../db');
const { isValidEmail } = require('../utils/stringUtils');

class User {
  constructor(name, email, role = 'user') {
    this.name = name;
    this.email = email;
    this.role = role;
  }

  validate() {
    if (!this.name || this.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (!isValidEmail(this.email)) {
      throw new Error('Invalid email address');
    }
    return true;
  }

  async save() {
    this.validate(); // pehle validate karo
    const result = await db.insertOne('users', {
      name: this.name,
      email: this.email,
      role: this.role,
    });
    return result;
  }

  static async findByEmail(email) {
    return await db.findOne('users', { email });
  }
}

module.exports = User;
```

```javascript
// models/User.test.js
const User = require('./User');
const db = require('../db');

// Database module ko mock karo — real DB call nahi hogi
jest.mock('../db');

describe('User Model', () => {
  let testUser;

  // Har test se pehle fresh user banao
  beforeEach(() => {
    testUser = new User('Ravi Kumar', 'ravi@gmail.com', 'farmer');
    jest.clearAllMocks(); // purane mock calls saaf karo
  });

  // --- Validation Tests ---
  describe('validate', () => {
    it('should pass validation for valid user', () => {
      expect(testUser.validate()).toBe(true);
    });

    it('should throw error for short name', () => {
      testUser.name = 'R';  // sirf 1 character
      expect(() => testUser.validate()).toThrow('Name must be at least 2 characters');
    });

    it('should throw error for empty name', () => {
      testUser.name = '';
      expect(() => testUser.validate()).toThrow('Name must be at least 2 characters');
    });

    it('should throw error for invalid email', () => {
      testUser.email = 'not-an-email';
      expect(() => testUser.validate()).toThrow('Invalid email address');
    });
  });

  // --- Save Tests (mocked DB) ---
  describe('save', () => {
    it('should save valid user to database', async () => {
      // Mock DB response — jaise real DB insertId return karta
      db.insertOne.mockResolvedValue({ insertedId: 'abc123' });

      const result = await testUser.save();

      expect(result.insertedId).toBe('abc123');
      // Check ki DB function sahi data ke saath call hua
      expect(db.insertOne).toHaveBeenCalledWith('users', {
        name: 'Ravi Kumar',
        email: 'ravi@gmail.com',
        role: 'farmer',
      });
      expect(db.insertOne).toHaveBeenCalledTimes(1); // sirf ek baar call hua
    });

    it('should not save invalid user', async () => {
      testUser.email = 'bad-email';
      await expect(testUser.save()).rejects.toThrow('Invalid email address');
      expect(db.insertOne).not.toHaveBeenCalled(); // DB call nahi honi chahiye
    });
  });

  // --- Static Method Tests ---
  describe('findByEmail', () => {
    it('should find user by email', async () => {
      db.findOne.mockResolvedValue({
        name: 'Ravi Kumar',
        email: 'ravi@gmail.com',
        role: 'farmer',
      });

      const user = await User.findByEmail('ravi@gmail.com');

      expect(user.name).toBe('Ravi Kumar');
      expect(db.findOne).toHaveBeenCalledWith('users', { email: 'ravi@gmail.com' });
    });

    it('should return null for non-existent email', async () => {
      db.findOne.mockResolvedValue(null); // user nahi mila

      const user = await User.findByEmail('nobody@gmail.com');
      expect(user).toBeNull();
    });
  });
});
```

> **Yaad Rakho:**
> `jest.clearAllMocks()` — har test se pehle purane mock calls clear karo. Nahi toh ek test ka mock data doosre test mein leak ho sakta hai.

---

## Practice 4: Coverage Report Generate Karo

> **Terminal Command:**
> ```bash
> # Poore project ki coverage report
> npx jest --coverage --verbose
> ```

> **Expected Output:**
> ```
> PASS  utils/stringUtils.test.js (8 tests)
> PASS  utils/priceUtils.test.js (7 tests)
> PASS  models/User.test.js (7 tests)
>
> ----------------------|---------|----------|---------|---------|
> File                  | % Stmts | % Branch | % Funcs | % Lines |
> ----------------------|---------|----------|---------|---------|
> utils/stringUtils.js  |   100   |   100    |   100   |   100   |
> utils/priceUtils.js   |   100   |   100    |   100   |   100   |
> models/User.js        |   100   |    90    |   100   |   100   |
> ----------------------|---------|----------|---------|---------|
> All files             |   100   |    96.7  |   100   |   100   |
>
> Test Suites: 3 passed, 3 total
> Tests:       22 passed, 22 total
> ```

> **Tip:**
> Coverage report `coverage/` folder mein HTML format mein bhi banta hai. Browser mein `coverage/lcov-report/index.html` kholo — visual report dikhega!

---

## Jest Configuration Tips

`jest.config.js` banakar customize karo:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',            // Node.js environment use karo
  coverageThreshold: {
    global: {
      branches: 80,                    // 80% branch coverage zaroori
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',                  // node_modules ignore karo
    '/tests/fixtures/',                // test fixtures ignore karo
  ],
  testMatch: ['**/*.test.js'],         // sirf .test.js files run karo
};
```

---

## Quick Revision Table

| Practice | Kya Kiya | Key Learning |
|----------|---------|--------------|
| String Utils | capitalize, email, slugify | Edge cases test karo (null, empty, invalid) |
| Price Utils | calculateTotal, applyDiscount | Error cases test karo (toThrow) |
| User Model | validate, save, findByEmail | Mocking se DB calls fake karo |
| Coverage | --coverage flag | 80%+ coverage target rakho |

---

## Aaj Kya Seekha?

1. Utility functions ke tests likhna — happy path + edge cases + error cases
2. Model testing mein database ko mock karna — `jest.mock()`
3. `mockResolvedValue` se async functions ka fake response dena
4. `toHaveBeenCalledWith` se check karna ki function sahi arguments ke saath call hua
5. Coverage report generate karna aur samajhna
6. `beforeEach` + `jest.clearAllMocks()` se clean test environment banana

> **Practice Time!**
> Apne kisi bhi purane project ki utility functions ke liye tests likho. Target: 80%+ coverage!
