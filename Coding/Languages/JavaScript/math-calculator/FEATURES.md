# Math Calculator Pro - Features Guide

## Overview

Math Calculator Pro is an enhanced version of the Math Calculator with advanced features for professional use, improved user experience, and powerful computation capabilities.

**Version:** 3.0.0  
**Release Date:** December 2024

---

## New Features Added

### 1. **Calculation History** 🔄

**Description:** Automatically tracks all calculations with timestamps and allows easy recall.

**Features:**

- Persistent storage using browser localStorage
- Shows timestamp for each calculation
- Quick "Use" button to re-run previous calculations
- Delete individual history items
- Clear entire history with one click
- Maximum 50 calculations stored
- History survives browser restarts

**Usage:**

```javascript
// History is automatically saved
// Access via sidebar "History" panel
// Click "Use" to re-populate expression input
// Click "Delete" to remove specific entry
// Click trash icon to clear all
```

**Storage:**

- Stored in `localStorage` as `calcHistory` JSON array
- Each entry contains: `{ id, timestamp, expression, solution, question }`

---

### 2. **Quick Function Buttons** ⚡

**Description:** One-click access to common mathematical functions.

**Available Functions:**

**Trigonometric:**

- `sin(` - Sine function
- `cos(` - Cosine function
- `tan(` - Tangent function

**Logarithmic:**

- `log(` - Natural logarithm
- `log10(` - Base 10 logarithm

**Other Functions:**

- `√` - Square root
- `e^` - Exponential (e raised to power)
- `|x|` - Absolute value
- `x!` - Factorial
- `π` - Pi constant
- `e` - Euler's number

**Usage:**

```javascript
// Click any button to append to expression
// Example: Click "sin(" then type "π/2" results in "sin(π/2)"
// Automatically appends to existing expression
```

---

### 3. **Constants Library** 📚

**Description:** Quick access to important mathematical constants.

**Available Constants:**

| Constant       | Symbol | Value         | Description               |
| -------------- | ------ | ------------- | ------------------------- |
| Pi             | π      | 3.14159265... | Circumference ratio       |
| Euler's Number | e      | 2.71828182... | Base of natural logarithm |
| Golden Ratio   | φ      | 1.61803398... | Divine proportion         |
| sqrt(2)        | √2     | 1.41421356... | Diagonal of unit square   |
| sqrt(3)        | √3     | 1.73205080... | Diagonal of unit cube     |
| ln(2)          | ln2    | 0.69314718... | Natural log of 2          |
| ln(10)         | ln10   | 2.30258509... | Natural log of 10         |

**API Access:**

```bash
# Get all constants
GET /constants

# Get specific constant
GET /constants/pi
GET /constants/e
GET /constants/phi
```

**Response:**

```json
{
  "name": "pi",
  "value": 3.14159265358979,
  "description": "Mathematical constant: pi"
}
```

**Usage:**

- Click any constant button to append to expression
- Use in mathematical expressions: `2*π*r`
- Use via API for programmatic access

---

### 4. **Dark Mode** 🌙

**Description:** Comfortable dark theme for low-light environments.

**Features:**

- One-click toggle button in navbar
- Persists preference in localStorage
- Applies to all UI components
- Optimized color scheme for readability
- Smooth theme transition

**Theme Colors:**

**Light Mode:**

- Background: White/Light Blue gradient
- Text: Dark gray (#333)
- Cards: White with subtle shadows
- Accent: Blue (#007bff)

**Dark Mode:**

- Background: Dark gradient (#1a1a1a to #2d2d2d)
- Text: Light gray (#e0e0e0)
- Cards: Dark gray (#2d2d2d)
- Accent: Light blue
- Enhanced contrast for accessibility

**Storage:**

```javascript
// Preference stored in localStorage
localStorage.setItem("darkMode", "true" | "false");
```

---

### 5. **Export Functionality** 📥

**Description:** Download calculation history in multiple formats.

**Supported Formats:**

#### CSV Export

```csv
Timestamp,Expression,Solution
"12/15/2024, 1:30 PM","5+3*2","11"
"12/15/2024, 1:31 PM","sqrt(16)","4"
```

**Features:**

- One-click download
- Proper CSV formatting with escaped quotes
- Includes timestamp, expression, and solution
- Compatible with Excel, Google Sheets, etc.

#### JSON Export

```json
[
  {
    "id": 1702663200000,
    "timestamp": "12/15/2024, 1:30 PM",
    "expression": "5+3*2",
    "solution": "11",
    "question": "What is the result of: 5+3*2?"
  },
  {
    "id": 1702663260000,
    "timestamp": "12/15/2024, 1:31 PM",
    "expression": "sqrt(16)",
    "solution": "4",
    "question": "What is the result of: sqrt(16)?"
  }
]
```

**Features:**

- Complete calculation data
- Human-readable format
- Easy to parse programmatically
- Includes question, solution, and explanation

**Usage:**

```javascript
// Click "Export as CSV" button
// File downloaded: calculator-history.csv

// Click "Export as JSON" button
// File downloaded: calculator-history.json
```

---

### 6. **Enhanced UI/UX** 🎨

**Description:** Modern, responsive interface with improved usability.

**Improvements:**

**Layout:**

- Two-column responsive design
- Calculator on left, utilities on right
- Collapses to single column on mobile
- Professional card-based layout

**Navigation:**

- Top navbar with branding
- Theme toggle button
- Quick access to all features

**Typography:**

- Clear, readable fonts
- Proper hierarchy with headers
- Monospace font for code/expressions
- Icon badges for visual clarity

**Colors:**

- Primary blue (#007bff)
- Success green (#28a745)
- Warning yellow (#ffc107)
- Semantic color usage

**Animations:**

- Smooth button transitions
- Slide-in results animations
- Card hover effects
- Consistent 0.3s timing

**Responsive Design:**

```css
/* Mobile: < 768px */
- Single column layout
- Full-width inputs
- Stacked buttons

/* Tablet: 768px - 1024px */
- Two column layout
- Adjusted padding

/* Desktop: > 1024px */
- Optimized spacing
- Full sidebar
```

---

### 7. **Unit Conversion** 🔄 (Backend API)

**Description:** Convert between different units across multiple categories.

**Supported Categories:**

#### Length Conversions

- Meters (m), Kilometers (km)
- Centimeters (cm), Millimeters (mm)
- Miles, Yards, Feet, Inches

#### Weight Conversions

- Kilograms (kg), Grams (g)
- Milligrams (mg)
- Pounds, Ounces, Tons

#### Temperature Conversions

- Celsius, Fahrenheit, Kelvin

**API Endpoint:**

```bash
POST /convert
```

**Request:**

```json
{
  "value": 100,
  "fromUnit": "cm",
  "toUnit": "m",
  "category": "length"
}
```

**Response:**

```json
{
  "input": {
    "value": 100,
    "fromUnit": "cm",
    "category": "length"
  },
  "output": {
    "value": 1,
    "unit": "m"
  },
  "conversion": "100 cm = 1 m"
}
```

**Examples:**

```bash
# Convert 5 kilometers to meters
curl -X POST http://localhost:4000/convert \
  -H "Content-Type: application/json" \
  -d '{
    "value": 5,
    "fromUnit": "km",
    "toUnit": "m",
    "category": "length"
  }'

# Convert 150 pounds to kilograms
curl -X POST http://localhost:4000/convert \
  -H "Content-Type: application/json" \
  -d '{
    "value": 150,
    "fromUnit": "pound",
    "toUnit": "kg",
    "category": "weight"
  }'

# Convert 32 Fahrenheit to Celsius
curl -X POST http://localhost:4000/convert \
  -H "Content-Type: application/json" \
  -d '{
    "value": 32,
    "fromUnit": "fahrenheit",
    "toUnit": "celsius",
    "category": "temperature"
  }'
```

---

## API Enhancements

### New Endpoints (v3.0.0)

#### Constants Library

```bash
# Get all constants
GET /constants

# Get specific constant
GET /constants/:name
```

#### Unit Conversions

```bash
# List available unit categories
GET /units

# Perform unit conversion
POST /convert
```

#### Existing Enhanced Endpoints

```bash
# Single calculation (improved)
POST /calculate

# Batch calculations (improved)
POST /calculate/batch

# Health check
GET /health

# Metrics
GET /metrics

# API documentation
GET /api/docs
```

---

## Technical Implementation

### Frontend Architecture

**State Management:**

```javascript
const calcState = {
  history: [], // Calculation history
  isDarkMode: false, // Theme preference
  maxHistoryItems: 50, // History limit
};
```

**Storage:**

- `localStorage.calcHistory` - JSON array of calculations
- `localStorage.darkMode` - Boolean theme preference

**Event Handling:**

- Form submission for calculations
- Button clicks for quick functions
- Theme toggle
- History management
- Export functionality

### Backend Implementation

**New Functions:**

```javascript
// Unit conversion
function convertUnits(value, fromUnit, toUnit, category) {
  // Linear conversion or special temperature handling
}

// Get constant values
function getConstantValue(constantName) {
  // Lookup and return constant
}
```

**Constants Map:**

```javascript
const CONSTANTS_LIBRARY = {
  π: Math.PI,
  pi: Math.PI,
  e: Math.E,
  φ: 1.618033988749895,
  phi: 1.618033988749895,
  sqrt2: Math.SQRT2,
  sqrt3: Math.sqrt(3),
  ln2: Math.LN2,
  ln10: Math.LN10,
};
```

**Unit Conversions Map:**

```javascript
const UNIT_CONVERSIONS = {
  length: { m: 1, km: 1000, cm: 0.01, ... },
  weight: { kg: 1, g: 0.001, pound: 0.453592, ... },
  temperature: { celsius: fn, fahrenheit: fn, kelvin: fn }
}
```

---

## Browser Compatibility

✅ **Supported:**

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Opera 76+

**Features Used:**

- ES6+ JavaScript
- localStorage API
- Fetch API
- CSS Grid & Flexbox
- CSS Variables
- SVG Icons

---

## Performance Optimizations

**Frontend:**

- Efficient event delegation
- Minimal DOM manipulation
- CSS animations (GPU accelerated)
- localStorage caching

**Backend:**

- In-memory calculation cache (100 entries)
- Expression validation before processing
- Rate limiting (20 per minute for calculations)
- Decimal.js for arbitrary precision

---

## Security Considerations

**Input Validation:**

- Expression sanitization
- Dangerous pattern detection
- Length limits
- Type checking

**Privacy:**

- No expression logging (development mode only)
- localStorage confined to browser
- No external API calls
- No user tracking

---

## Future Enhancements

**Planned Features:**

1. ✏️ Expression history with re-editing
2. 📊 Graphing/visualization of functions
3. 🔢 Matrix operations
4. 📱 Mobile app (React Native)
5. ☁️ Cloud sync for history
6. 👥 Collaboration features
7. 🎓 Tutorial/help system
8. 🧮 Scientific notation display options

---

## Troubleshooting

### History Not Saving

**Solution:** Check if localStorage is enabled in browser settings

### Dark Mode Not Persisting

**Solution:** Clear browser cache and localStorage, refresh page

### Units Endpoint Returns Error

**Solution:** Verify category name is lowercase (length, weight, temperature)

### Constants Return Null

**Solution:** Use lowercase constant names (pi, e, phi) or symbols (π, e, φ)

---

## Support

For issues or feature requests:

- 🐛 Report bugs on GitHub Issues
- 💡 Suggest features on GitHub Discussions
- 📧 Email: [contact info]
- 💬 Discord: [community server]

---

**Last Updated:** December 15, 2024  
**Maintained By:** Skanda890  
**License:** MIT
