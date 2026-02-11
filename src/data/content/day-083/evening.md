# Day 83 Evening: Practice — Counter, Todo List, Form Validation & Temperature Converter

> **Aaj ka plan:** Ab theory done hai — hum 4 practical projects banayenge: Counter App, Todo List (add/delete), Form with Validation, aur Temperature Converter. Sab mein useState, events, aur controlled components use karenge!

---

## Project 1: Counter App (State + Events)

### `src/components/Counter.jsx`

```jsx
import { useState } from 'react';

const Counter = () => {
  // Count state — shuru mein 0
  const [count, setCount] = useState(0);
  // Step size — kitna badhe/ghate
  const [step, setStep] = useState(1);

  // Increment — badhaao
  const increment = () => setCount(prev => prev + step);

  // Decrement — ghataao
  const decrement = () => setCount(prev => prev - step);

  // Reset — zero pe laao
  const reset = () => {
    setCount(0);
    setStep(1);
  };

  // Count ke hisab se color decide karo
  const getColor = () => {
    if (count > 0) return '#48bb78';   // Green positive
    if (count < 0) return '#fc8181';   // Red negative
    return '#a0aec0';                   // Grey zero
  };

  return (
    <div style={{ textAlign: 'center', padding: '30px' }}>
      <h2>Counter App</h2>

      {/* Count display */}
      <div style={{
        fontSize: '72px',
        fontWeight: 'bold',
        color: getColor(),
        margin: '20px 0'
      }}>
        {count}
      </div>

      {/* Step size selector */}
      <div style={{ marginBottom: '20px' }}>
        <label>Step Size: </label>
        <select
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
        >
          <option value={1}>1</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button onClick={decrement} style={{ padding: '10px 25px', fontSize: '18px' }}>
          -{step}
        </button>
        <button onClick={reset} style={{ padding: '10px 25px', fontSize: '18px' }}>
          Reset
        </button>
        <button onClick={increment} style={{ padding: '10px 25px', fontSize: '18px' }}>
          +{step}
        </button>
      </div>

      {/* Info line */}
      <p style={{ marginTop: '15px', color: '#718096' }}>
        Total clicks: {Math.abs(count / step)} times
      </p>
    </div>
  );
};

export default Counter;
```

> **Expected Output:** Ek bada number dikhega, step size dropdown hoga, +/- buttons honge. Positive pe green, negative pe red, zero pe grey color hoga.

---

## Project 2: Todo List (Add + Delete + Complete)

### `src/components/TodoList.jsx`

```jsx
import { useState } from 'react';

const TodoList = () => {
  // Todos array state
  const [todos, setTodos] = useState([
    { id: 1, text: 'Backend API banao', completed: true },
    { id: 2, text: 'React seekho', completed: false },
    { id: 3, text: 'Dashboard design karo', completed: false },
  ]);
  // Input field state
  const [inputValue, setInputValue] = useState('');

  // Naya todo add karo
  const addTodo = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;  // Empty check

    const newTodo = {
      id: Date.now(),              // Unique ID ke liye timestamp
      text: inputValue.trim(),
      completed: false,
    };

    setTodos(prev => [...prev, newTodo]);  // Naye array mein add
    setInputValue('');                      // Input clear karo
  };

  // Todo delete karo
  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  // Todo complete toggle karo
  const toggleComplete = (id) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Stats nikalo
  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.length - completedCount;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>Todo List</h2>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <span>Total: {todos.length}</span>
        <span style={{ color: '#48bb78' }}>Done: {completedCount}</span>
        <span style={{ color: '#ecc94b' }}>Pending: {pendingCount}</span>
      </div>

      {/* Add todo form */}
      <form onSubmit={addTodo} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Naya task likho..."
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Add
        </button>
      </form>

      {/* Todo list */}
      {todos.length === 0 ? (
        <p style={{ color: '#a0aec0', textAlign: 'center' }}>Koi task nahi hai! Add karo.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {todos.map(todo => (
            <li
              key={todo.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                margin: '8px 0',
                backgroundColor: todo.completed ? '#f0fff4' : '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id)}
                />
                <span style={{
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? '#a0aec0' : '#2d3748'
                }}>
                  {todo.text}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                style={{ color: '#fc8181', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}
              >
                X
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoList;
```

> **Socho Aise:** Ye CRUD operations hain — Create (add), Read (list dikhana), Update (toggle complete), Delete (remove). Backend mein APIs banaye the, yahan React state mein same operations ho rahe hain!

---

## Project 3: Registration Form with Validation

### `src/components/RegisterForm.jsx`

```jsx
import { useState } from 'react';

const RegisterForm = () => {
  // Form state — object mein store karo
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: ''
  });

  // Errors state
  const [errors, setErrors] = useState({});
  // Success message
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Generic change handler — ek function sab inputs ke liye
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Typing karte waqt error hatao
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validation function
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Naam zaroori hai!';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email daalo!';
    if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters chahiye!';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords match nahi kar rahe!';
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = '10 digit phone number daalo!';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;  // true = no errors
  };

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form data:', formData);
      setIsSubmitted(true);
      // Baad mein yahan API call hogi
    }
  };

  // Agar submit ho gaya toh success dikhao
  if (isSubmitted) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#48bb78' }}>
        <h2>Registration Successful!</h2>
        <p>Welcome, {formData.name}!</p>
        <button onClick={() => { setIsSubmitted(false); setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' }); }}>
          Register Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        {/* Name field */}
        <div style={{ marginBottom: '15px' }}>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.name ? '2px solid red' : '1px solid #ccc' }} />
          {errors.name && <small style={{ color: 'red' }}>{errors.name}</small>}
        </div>

        {/* Email field */}
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.email ? '2px solid red' : '1px solid #ccc' }} />
          {errors.email && <small style={{ color: 'red' }}>{errors.email}</small>}
        </div>

        {/* Password field */}
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.password ? '2px solid red' : '1px solid #ccc' }} />
          {errors.password && <small style={{ color: 'red' }}>{errors.password}</small>}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '15px' }}>
          <label>Confirm Password:</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.confirmPassword ? '2px solid red' : '1px solid #ccc' }} />
          {errors.confirmPassword && <small style={{ color: 'red' }}>{errors.confirmPassword}</small>}
        </div>

        {/* Phone (optional) */}
        <div style={{ marginBottom: '15px' }}>
          <label>Phone (optional):</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.phone ? '2px solid red' : '1px solid #ccc' }} />
          {errors.phone && <small style={{ color: 'red' }}>{errors.phone}</small>}
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#4299e1', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer' }}>
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
```

> **Tip:** `[name]: value` — ye computed property name hai. Input ka `name` attribute aur state ka key same rakho toh ek hi handler se sab kaam ho jata hai!

---

## Project 4: Temperature Converter (Lifting State Up)

### `src/components/TemperatureConverter.jsx`

```jsx
import { useState } from 'react';

// Reusable input component
const TempInput = ({ label, value, onChange, color }) => (
  <div style={{ textAlign: 'center', padding: '20px', backgroundColor: color, borderRadius: '12px', flex: 1 }}>
    <h3 style={{ margin: '0 0 10px' }}>{label}</h3>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontSize: '32px', width: '120px', textAlign: 'center', border: '2px solid #ccc', borderRadius: '8px', padding: '10px' }}
    />
    <p style={{ marginTop: '5px', fontSize: '14px', color: '#718096' }}>degrees</p>
  </div>
);

const TemperatureConverter = () => {
  // State parent mein — lifting state up!
  const [celsius, setCelsius] = useState('');
  const [scale, setScale] = useState('C');  // Kaunsa input active hai

  // Conversion functions
  const toFahrenheit = (c) => c !== '' ? ((parseFloat(c) * 9/5) + 32).toFixed(1) : '';
  const toCelsius = (f) => f !== '' ? ((parseFloat(f) - 32) * 5/9).toFixed(1) : '';
  const toKelvin = (c) => c !== '' ? (parseFloat(c) + 273.15).toFixed(1) : '';

  // Handlers
  const handleCelsiusChange = (value) => {
    setCelsius(value);
    setScale('C');
  };

  const handleFahrenheitChange = (value) => {
    setCelsius(toCelsius(value));
    setScale('F');
  };

  // Calculated values
  const fahrenheit = scale === 'F' ? toFahrenheit(celsius) : toFahrenheit(celsius);
  const kelvin = toKelvin(celsius);

  // Temperature ke hisab se message
  const getMessage = () => {
    const c = parseFloat(celsius);
    if (isNaN(c)) return 'Temperature daalo...';
    if (c <= 0) return 'Bahut thand hai! Paani jam jayega!';
    if (c <= 15) return 'Thand hai — sweater pehno!';
    if (c <= 30) return 'Mausam achha hai!';
    if (c <= 40) return 'Garmi hai — paani piyo!';
    return 'Bahut garmi! AC chalao!';
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Temperature Converter</h2>

      {/* Input cards */}
      <div style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
        <TempInput label="Celsius (°C)" value={celsius} onChange={handleCelsiusChange} color="#ebf8ff" />
        <TempInput label="Fahrenheit (°F)" value={fahrenheit} onChange={handleFahrenheitChange} color="#fefcbf" />
      </div>

      {/* Kelvin display */}
      <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f0fff4', borderRadius: '12px' }}>
        <h3>Kelvin: {kelvin || '—'} K</h3>
      </div>

      {/* Fun message */}
      <p style={{ textAlign: 'center', fontSize: '18px', marginTop: '20px', color: '#4a5568' }}>
        {getMessage()}
      </p>
    </div>
  );
};

export default TemperatureConverter;
```

> **Yaad Rakho:** Celsius state parent (`TemperatureConverter`) mein hai aur dono child inputs ko props se milti hai. Ye **lifting state up** ka perfect example hai!

---

## Quick Revision Table

| Project | Key Concepts | State Kya Rakha |
|---------|-------------|-----------------|
| Counter | useState, events, conditional styling | `count`, `step` |
| Todo List | Array state, add/delete/toggle, map/filter | `todos[]`, `inputValue` |
| Register Form | Object state, validation, controlled inputs | `formData{}`, `errors{}` |
| Temp Converter | Lifting state up, derived values | `celsius`, `scale` |

---

## Aaj Kya Seekha?

1. **Counter** — useState aur events ka basic usage
2. **Todo List** — Array state mein CRUD operations (add/delete/toggle)
3. **Form Validation** — Controlled inputs, error handling, computed property names
4. **Temperature Converter** — Lifting state up, derived calculations
5. Har project mein **immutable state updates** — spread operator, filter, map
6. **Conditional rendering** — empty state, success state, error state

> **Practice Time!** In projects mein features add karo — Todo mein edit button, Counter mein history, Form mein more fields. Kal **useEffect aur API integration** seekhenge!
