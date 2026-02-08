# Day 75 — Testing: Unit Tests with Jest (Morning Session)

> **Aaj ka plan:**
> Aaj hum samjhenge ki testing kyu zaroori hai, kitne type ki testing hoti hai, aur Jest framework se unit tests kaise likhte hain. Real backend developers bina tests ke code deploy nahi karte!

---

## Testing Kyu Zaroori Hai?

Socho tumne ek farmer ke liye crop-price API banaya. Sab kuch kaam kar raha tha. Phir ek din tumne ek chhota sa change kiya — aur poora price calculation galat ho gaya. Customer ne galat price dekha, order cancel. Loss!

> **Socho Aise:**
> Testing ek safety net hai — jaise building banate waqt scaffolding lagaate hain. Agar koi brick hili bhi, toh poora building nahi girega.

Bina testing ke:
- Bug production mein jaata hai
- Har change ke baad manually check karna padta hai
- Confidence nahi hota ki code sahi kaam karega
- Team mein koi aur ka code break ho sakta hai

---

## Test Types — Teen Prakar Ki Testing

| Type | Kya Test Karta Hai | Speed | Example |
|------|-------------------|-------|---------|
| **Unit Test** | Ek chhoti function/module | Bahut fast | `calculatePrice()` sahi output de rahi hai? |
| **Integration Test** | Multiple modules together | Medium | API route + database sahi kaam kar rahe? |
| **E2E (End-to-End)** | Poora user flow | Slow | Register -> Login -> Order place -> Payment |

> **Yaad Rakho:**
> Unit tests sabse zyada likhte hain (70-80%), integration medium (15-20%), E2E sabse kam (5-10%). Ise **Testing Pyramid** kehte hain.

---

## Jest Framework — Setup

Jest ek popular JavaScript testing framework hai jo Facebook ne banaya. Fast hai, easy hai, aur batteries-included hai.

> **Terminal Command:**
> ```bash
> # Jest install karo as dev dependency
> npm install --save-dev jest
> ```

`package.json` mein test script add karo:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Pehla Unit Test — describe / it / expect

Jest mein teen cheezein yaad rakho:
- **describe** — test group banata hai (like a chapter)
- **it** ya **test** — ek individual test case
- **expect** — actual value check karta hai

```javascript
// math.js — yeh hai humara simple module
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = { add, multiply };
```

```javascript
// math.test.js — yeh hai test file
const { add, multiply } = require('./math');

// Test group — Math functions ke liye
describe('Math Utility Functions', () => {

  // Individual test — add function
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);       // 2 + 3 = 5 hona chahiye
    expect(add(-1, 1)).toBe(0);      // negative number bhi check karo
    expect(add(0, 0)).toBe(0);       // edge case — zero + zero
  });

  // Individual test — multiply function
  it('should multiply two numbers correctly', () => {
    expect(multiply(3, 4)).toBe(12); // 3 * 4 = 12
    expect(multiply(0, 100)).toBe(0); // zero se multiply = zero
  });
});
```

> **Terminal Command:**
> ```bash
> npx jest math.test.js
> ```

> **Expected Output:**
> ```
> PASS  ./math.test.js
>   Math Utility Functions
>     ✓ should add two numbers correctly (2 ms)
>     ✓ should multiply two numbers correctly (1 ms)
>
> Test Suites: 1 passed, 1 total
> Tests:       2 passed, 2 total
> ```

---

## Jest Matchers — Kaise Compare Karte Hain

| Matcher | Kya Karta Hai | Example |
|---------|--------------|---------|
| `toBe(value)` | Exact equality (===) | `expect(2+2).toBe(4)` |
| `toEqual(value)` | Deep equality (objects/arrays) | `expect(obj).toEqual({name: 'Ravi'})` |
| `toBeTruthy()` | Truthy check | `expect('hello').toBeTruthy()` |
| `toBeFalsy()` | Falsy check | `expect(0).toBeFalsy()` |
| `toBeNull()` | Null check | `expect(null).toBeNull()` |
| `toContain(item)` | Array mein item hai? | `expect([1,2,3]).toContain(2)` |
| `toThrow()` | Error throw hona chahiye | `expect(() => fn()).toThrow()` |
| `toHaveLength(n)` | Length check | `expect([1,2]).toHaveLength(2)` |

> **Warning:**
> `toBe` primitive values (numbers, strings) ke liye use karo. Objects/arrays ke liye `toEqual` use karo, kyunki `toBe` reference check karta hai!

```javascript
// toBe vs toEqual ka farq
it('should understand toBe vs toEqual', () => {
  const obj1 = { name: 'Kisan' };
  const obj2 = { name: 'Kisan' };

  // toBe FAIL hoga — dono alag objects hain memory mein
  // expect(obj1).toBe(obj2); // ❌ FAIL

  // toEqual PASS hoga — values same hain
  expect(obj1).toEqual(obj2); // ✅ PASS
});
```

---

## toThrow — Error Testing

```javascript
// validator.js
function validateAge(age) {
  if (age < 0) throw new Error('Age cannot be negative');  // negative age nahi chalega
  if (age > 150) throw new Error('Invalid age');            // 150 se zyada bhi nahi
  return true;
}

module.exports = { validateAge };
```

```javascript
// validator.test.js
const { validateAge } = require('./validator');

describe('validateAge', () => {
  it('should throw error for negative age', () => {
    // Function ko arrow function mein wrap karo toThrow ke liye
    expect(() => validateAge(-5)).toThrow('Age cannot be negative');
  });

  it('should throw error for age > 150', () => {
    expect(() => validateAge(200)).toThrow('Invalid age');
  });

  it('should return true for valid age', () => {
    expect(validateAge(25)).toBe(true);   // valid age = true
  });
});
```

---

## beforeEach / afterEach — Setup aur Cleanup

Jab har test se pehle kuch setup karna ho ya baad mein cleanup:

```javascript
describe('Shopping Cart', () => {
  let cart;

  // Har test se pehle fresh cart banao
  beforeEach(() => {
    cart = [];  // nayi empty cart
  });

  // Har test ke baad cleanup
  afterEach(() => {
    cart = null;  // memory free karo
  });

  it('should add item to cart', () => {
    cart.push({ name: 'Chawal', price: 50 });
    expect(cart).toHaveLength(1);          // ek item hona chahiye
    expect(cart[0].name).toBe('Chawal');
  });

  it('should start with empty cart', () => {
    // beforeEach ne fresh cart diya — pichle test ka item nahi hoga
    expect(cart).toHaveLength(0);
  });
});
```

> **Yaad Rakho:**
> `beforeAll` / `afterAll` sirf EK baar chalte hain — poore describe block ke shuru/end mein. `beforeEach` / `afterEach` HAREEK test ke liye chalte hain.

---

## Mocking Basics — Nakli Functions

Real database ya API ko test mein call nahi karna chahte? Mock use karo!

```javascript
// userService.js
const db = require('./db');

async function getUserName(id) {
  const user = await db.findUserById(id); // database call
  return user.name;
}

module.exports = { getUserName };
```

```javascript
// userService.test.js
const { getUserName } = require('./userService');
const db = require('./db');

// db module ko mock karo — real database call nahi hogi
jest.mock('./db');

describe('getUserName', () => {
  it('should return user name from database', async () => {
    // Mock implementation — nakli data return karo
    db.findUserById.mockResolvedValue({ id: 1, name: 'Ravi Kisan' });

    const name = await getUserName(1);
    expect(name).toBe('Ravi Kisan');                  // sahi name aaya?
    expect(db.findUserById).toHaveBeenCalledWith(1);  // sahi id se call hua?
  });
});
```

> **Tip:**
> Mocking ka rule — sirf **external dependencies** mock karo (database, API calls, file system). Apni business logic mock mat karo.

---

## Test Coverage — Kitna Code Test Hua?

> **Terminal Command:**
> ```bash
> npx jest --coverage
> ```

> **Expected Output:**
> ```
> ----------|---------|----------|---------|---------|
> File      | % Stmts | % Branch | % Funcs | % Lines |
> ----------|---------|----------|---------|---------|
> math.js   |   100   |   100    |   100   |   100   |
> validator |    85   |    75    |   100   |    85   |
> ----------|---------|----------|---------|---------|
> ```

| Coverage Type | Kya Measure Karta Hai |
|--------------|----------------------|
| **Statements** | Kitne statements execute hue |
| **Branches** | Kitne if/else paths cover hue |
| **Functions** | Kitni functions call hui |
| **Lines** | Kitni lines run hui |

> **Tip:**
> 80%+ coverage accha maana jaata hai. 100% zaruri nahi — par critical business logic 100% honi chahiye.

---

## Quick Revision Table

| Concept | Kya Hai | Example |
|---------|---------|---------|
| Unit Test | Ek function ko test karna | `add(2,3)` = 5 |
| describe | Test group | `describe('Math', () => {...})` |
| it / test | Ek test case | `it('should add', () => {...})` |
| expect | Value check | `expect(result).toBe(5)` |
| toBe | Exact match (===) | Primitives ke liye |
| toEqual | Deep equality | Objects/arrays ke liye |
| toThrow | Error check | `expect(() => fn()).toThrow()` |
| beforeEach | Har test se pehle | Setup karna |
| jest.mock | Nakli module | Database mock |
| Coverage | Kitna test hua | `--coverage` flag |

---

## Aaj Kya Seekha?

1. Testing teen type ki hoti hai — Unit, Integration, E2E
2. Jest framework se unit tests likhte hain — describe/it/expect
3. Matchers se values compare karte hain — toBe, toEqual, toThrow
4. beforeEach/afterEach se setup/cleanup karte hain
5. Mocking se external dependencies ko nakli bana sakte hain
6. Coverage report se pata chalta hai kitna code test hua

> **Practice Time!**
> Evening session mein hum actual utility functions aur User model ke tests likhenge. Apna Jest setup ready rakho!
