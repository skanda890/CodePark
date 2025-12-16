# Quick Start Guide - Math Calculator Pro v3.0.0

## 🚀 Getting Started

### Installation

```bash
# Navigate to project directory
cd Coding/Languages/JavaScript/math-calculator

# Install dependencies
npm install

# Start the server
npm start

# Open in browser
# http://localhost:4000/calculator
```

---

## 📱 User Interface Tour

### Main Calculator Panel (Left)

```
┌─────────────────────────────────────┐
│  Math Calculator Pro                 │
│  [🌙 Dark Mode]                      │
├─────────────────────────────────────┤
│                                      │
│  Calculator                          │
│  ─────────────────────────           │
│                                      │
│  Mathematical Expression:            │
│  [________________] ← Input field    │
│                                      │
│  Quick Functions:                    │
│  [√x] [sin] [cos] [tan]              │
│  [log] [log₁₀]                       │
│  [e^x] [|x|] [x!] [π] [e]            │
│                                      │
│  [📊 Calculate]                      │
│                                      │
│  Results:                            │
│  Question: ...                       │
│  Solution: ...                       │
│  Explanation: ...                    │
│                                      │
└─────────────────────────────────────┘
```

### Sidebar (Right)

```
┌──────────────────────┐
│ Constants            │
│ ────────────────────│
│ π (Pi)              │
│ e (Euler)           │
│ φ (Golden)          │
└──────────────────────┘

┌──────────────────────┐
│ History      [🗑]    │
│ ────────────────────│
│ 12:30 PM            │
│ 5+3*2 = 11          │
│ [Use] [Delete]      │
│                      │
│ 12:31 PM            │
│ √16 = 4             │
│ [Use] [Delete]      │
└──────────────────────┘

┌──────────────────────┐
│ Export               │
│ ────────────────────│
│ [📥 CSV]             │
│ [📥 JSON]            │
└──────────────────────┘
```

---

## ⌨️ How to Use

### Basic Calculations

```javascript
// Type an expression
5 + 3 * 2

// Click Calculate
// Result: 11

// Explanation: 5 + (3 * 2) = 5 + 6 = 11
```

### Using Quick Function Buttons

```javascript
// Click [sin] button
// Type: π/2
// Full expression: sin(π/2)

// Click Calculate
// Result: 1
```

### Using Constants

```javascript
// Type: 2 *
// Click [π] button
// Type: * r
// Full expression: 2*π*r (circle circumference formula)

// Click Calculate
// (with r value substituted)
```

### Built-in Functions

```javascript
// Square root
sqrt(16)        // Result: 4
√16             // Also works

// Power
5^2             // Result: 25
(5)^2           // Also works

// Trigonometric (radians)
sin(π/2)        // Result: 1
cos(0)          // Result: 1
tan(π/4)        // Result: 1

// Logarithmic
log(e)          // Result: 1 (natural log)
log10(100)      // Result: 2

// Factorial
factorial(5)    // Result: 120

// Absolute value
abs(-5)         // Result: 5

// Exponential
exp(1)          // Result: 2.71828... (e)

// Large numbers
veia(1000)      // π to 1000 iterations
```

---

## 💾 History Management

### View History
1. Check the "History" panel on the right sidebar
2. See all previous calculations with timestamps
3. Maximum 50 calculations stored

### Reuse a Calculation
1. Find calculation in history
2. Click [Use] button
3. Expression automatically appears in input field
4. Modify if needed and recalculate

### Delete History
1. Click [Delete] on specific entry to remove it
2. Click [🗑] (trash icon) to clear all history
3. Confirm when prompted

### Persistence
- History is saved in browser localStorage
- Survives browser restart
- Private to this device/browser
- Can be exported at any time

---

## 🌙 Dark Mode

### Toggle Dark Mode
1. Click [🌙 Dark Mode] button in top-right navbar
2. Theme changes immediately
3. Preference is saved automatically
4. Applies to next session too

### Benefits
- Easier on eyes in low-light environments
- Reduced eye strain during long sessions
- Professional appearance
- Better for laptop battery life

---

## 📥 Export Data

### Export as CSV
1. Click [📥 CSV] button in Export section
2. File `calculator-history.csv` downloads
3. Open in Excel, Google Sheets, etc.
4. Contains: Timestamp, Expression, Solution

```csv
Timestamp,Expression,Solution
"12/15/2024, 1:30 PM","5+3*2","11"
"12/15/2024, 1:31 PM","sqrt(16)","4"
```

### Export as JSON
1. Click [📥 JSON] button in Export section
2. File `calculator-history.json` downloads
3. Complete calculation data (includes explanations)
4. Easy to parse programmatically

```json
[
  {
    "timestamp": "12/15/2024, 1:30 PM",
    "expression": "5+3*2",
    "solution": "11",
    "question": "What is the result of: 5+3*2?"
  }
]
```

---

## 🔗 API Usage (Developers)

### Single Calculation

```bash
curl -X POST http://localhost:4000/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression": "5+3*2"}'

# Response
{
  "question": "What is the result of: 5+3*2?",
  "solution": "11",
  "explanation": "5+3*2 = 11"
}
```

### Batch Calculations

```bash
curl -X POST http://localhost:4000/calculate/batch \
  -H "Content-Type: application/json" \
  -d '{"expressions": ["5+3", "10*2", "sqrt(16)"]}'

# Response
{
  "count": 3,
  "results": [
    {"expression": "5+3", "solution": "8", ...},
    {"expression": "10*2", "solution": "20", ...},
    {"expression": "sqrt(16)", "solution": "4", ...}
  ]
}
```

### Unit Conversion

```bash
curl -X POST http://localhost:4000/convert \
  -H "Content-Type: application/json" \
  -d '{
    "value": 100,
    "fromUnit": "cm",
    "toUnit": "m",
    "category": "length"
  }'

# Response
{
  "input": {"value": 100, "fromUnit": "cm", "category": "length"},
  "output": {"value": 1, "unit": "m"},
  "conversion": "100 cm = 1 m"
}
```

### Get Constants

```bash
# All constants
curl http://localhost:4000/constants

# Specific constant
curl http://localhost:4000/constants/pi

# Response
{
  "name": "pi",
  "value": 3.14159265358979,
  "description": "Mathematical constant: pi"
}
```

### Get Metrics

```bash
curl http://localhost:4000/metrics

# Response
{
  "uptime": 3600000,
  "requestCount": 150,
  "calculationCount": 85,
  "errorCount": 2,
  "errorRate": "1.33%",
  "avgCalculationTime": "45.23ms",
  "cacheSize": 42
}
```

---

## 🎯 Common Use Cases

### Mathematics Homework
```javascript
// Solve: 2x + 5 = 15, find x
(15 - 5) / 2
// Result: 5
```

### Physics Calculations
```javascript
// Kinetic energy: KE = 1/2 * m * v^2
// m = 10 kg, v = 5 m/s
0.5 * 10 * 5^2
// Result: 125 joules
```

### Financial Calculations
```javascript
// Compound interest: A = P(1 + r)^n
// P=1000, r=0.05, n=10
1000 * (1 + 0.05)^10
// Result: 1628.89
```

### Unit Conversions (via API)
```bash
# Convert 150 pounds to kilograms
curl -X POST http://localhost:4000/convert \
  -d '{"value": 150, "fromUnit": "pound", "toUnit": "kg", "category": "weight"}'
```

### Precision Calculations
```javascript
// Calculate π using Vieta's formula
vieta(100)
// Result: π ≈ 3.1415926535...
```

---

## 🔧 Troubleshooting

### Problem: History not saving
**Solution:** 
1. Check if localStorage is enabled (not in private browsing)
2. Clear cache and cookies
3. Refresh page
4. Try again

### Problem: Calculation shows "Error"
**Solution:**
1. Check expression syntax
2. Make sure parentheses are balanced
3. Use supported function names (see FEATURES.md)
4. Try simpler expression first

### Problem: Dark mode not applying
**Solution:**
1. Clear browser cache
2. Click toggle again
3. Refresh page
4. Try different browser

### Problem: Export button disabled
**Solution:**
1. Make sure you have calculation history
2. Clear and redo some calculations
3. Try other export format

---

## 📚 Learn More

- 📖 [FEATURES.md](./FEATURES.md) - Detailed feature documentation
- 📋 [API_REFERENCE.md](./API_REFERENCE.md) - Complete API docs
- 📝 [README.md](./README.md) - General information
- 📋 [CHANGELOG.md](./CHANGELOG.md) - Version history

---

## 💡 Tips & Tricks

1. **Keyboard Shortcuts** (Coming in v3.1):
   - Will support Enter to calculate
   - Ctrl+H for history
   - Ctrl+E for export

2. **Expression Tips**:
   - Use parentheses for clarity: `(5+3)*2`
   - Spaces are optional: `5+3*2` or `5 + 3 * 2`
   - Scientific notation: `1e6` = 1,000,000

3. **Performance**:
   - Calculations cached for instant recall
   - Multiple calculations processed in <50ms
   - Precision up to 1000 decimal places

4. **Security**:
   - No data sent to external servers
   - History stored locally on your device
   - All computations done client-side

---

**Questions?** Check FEATURES.md or open a GitHub issue!
