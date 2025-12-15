# Changelog

All notable changes to Math Calculator Pro will be documented in this file.

## [3.0.0] - 2024-12-15

### Added ✨

#### Frontend Features

- **Calculation History** - Auto-save and recall previous calculations
  - Persistent storage via localStorage
  - Show/hide history entries
  - Quick "Use" button to re-populate expressions
  - Delete individual or all history items
  - Maximum 50 calculations stored

- **Dark Mode Theme** - Professional dark theme for low-light environments
  - Toggle button in navbar
  - Persistent theme preference
  - Smooth theme transitions
  - Optimized colors for accessibility
  - Support for all UI components

- **Quick Function Buttons** - One-click function access
  - Trigonometric: sin, cos, tan
  - Logarithmic: log, log10
  - Special: √x, e^x, |x|, x!
  - Constants: π, e

- **Constants Library** - Quick access panel with mathematical constants
  - π (Pi) - 3.14159...
  - e (Euler's) - 2.71828...
  - φ (Golden Ratio) - 1.618...
  - √2, √3, ln2, ln10
  - Click to append to expression

- **Export Functionality** - Download calculation history
  - CSV format (Excel compatible)
  - JSON format (full data)
  - One-click downloads
  - Proper data formatting and escaping

- **Enhanced UI/UX**
  - Responsive two-column layout
  - Professional card-based design
  - Smooth animations and transitions
  - Modern navbar with branding
  - Mobile-friendly responsive design
  - Better visual hierarchy
  - Icon integration (Font Awesome)

#### Backend Features

- **Unit Conversion API** - POST /convert endpoint
  - Length conversions (m, km, cm, mm, mile, yard, foot, inch)
  - Weight conversions (kg, g, mg, pound, ounce, ton)
  - Temperature conversions (Celsius, Fahrenheit, Kelvin)
  - Accurate conversion rates

- **Constants Endpoint** - GET /constants API
  - Get all constants
  - Get specific constant by name
  - Full constant descriptions

- **Units Information** - GET /units endpoint
  - List available unit categories
  - Show supported units per category

#### Documentation

- **FEATURES.md** - Comprehensive feature documentation
  - Feature descriptions and examples
  - API endpoint documentation
  - Usage examples and code snippets
  - Troubleshooting guide
  - Future enhancements roadmap

### Changed 🔄

#### Frontend

- Upgraded from simple calculator to "Pro" version
- Replaced basic Bootstrap styling with enhanced custom CSS
- Updated index.html with modular component layout
- Improved form layout and button organization
- Better result display with color-coded alerts

#### Backend

- Version bumped from 2.0.0 to 3.0.0
- Updated API documentation (/api/docs)
- Added new endpoints to routing
- Enhanced error handling for new features

#### Styling

- Rewrote styles.css with modern CSS patterns
- Added CSS custom properties (variables) for themeing
- Implemented dark mode support
- Added animations and transitions
- Improved responsive design breakpoints
- Enhanced accessibility colors

### Fixed 🐛

- Better error messages in API responses
- Improved input validation for new endpoints
- CSS specificity issues resolved
- Mobile layout refinements

### Security 🔒

- Maintained input sanitization
- Added unit conversion validation
- Rate limiting still enforced on all endpoints
- localStorage data remains client-side only
- No sensitive data in logs

### Performance ⚡

- Calculation cache size optimized (100 entries)
- History limited to 50 items to manage memory
- Efficient CSS animations (GPU accelerated)
- Optimized event delegation for buttons
- Minimal DOM reflows

### Breaking Changes ⚠️

None - Full backward compatibility with v2.0.0 API

---

## [2.0.0] - Previous Release

See previous release notes for history.

### Features (v2.0.0)

- Basic mathematical expression evaluation
- Arbitrary precision arithmetic (1000 digits)
- Large number support (googol, googolplex, etc.)
- Tower exponentiation (10^10^googolplex)
- Vieta's formula for π approximation
- Batch calculations (up to 10 expressions)
- Request/response caching
- Performance metrics
- Helmet security headers
- Rate limiting (15 min window, 100 req/IP)
- Decimal.js for high precision
- mathjs library integration
- Express.js server
- HTML/CSS/JavaScript UI

---

## Migration Guide (v2.0.0 → v3.0.0)

### For Users

1. No action required - fully backward compatible
2. History and preferences automatically saved
3. Dark mode available via navbar toggle
4. New Quick Function buttons for easy access
5. Export history anytime via sidebar

### For Developers

1. No breaking API changes
2. New endpoints available:
   - `POST /convert` - Unit conversion
   - `GET /constants` - Constants library
   - `GET /units` - Available units
3. Updated `/api/docs` with new endpoints
4. localStorage now used for history and theme

### Installation

```bash
# Pull latest changes
git pull origin main

# Install dependencies (no new ones)
npm install

# Start server
npm start

# Visit http://localhost:4000
```

---

## Known Issues

None at this time.

## Roadmap (Future Versions)

### v3.1.0 (Planned)

- [ ] Expression history with editing
- [ ] More mathematical functions in quick menu
- [ ] User preferences panel
- [ ] Keyboard shortcuts

### v3.2.0 (Planned)

- [ ] Graphing/function visualization
- [ ] Equation solver
- [ ] Statistics functions
- [ ] Matrix operations

### v4.0.0 (Planned)

- [ ] Cloud synchronization
- [ ] User accounts
- [ ] Sharing calculations
- [ ] Mobile app (React Native)

---

## Contributors

- **Skanda890** - Lead developer, features implementation
- Community feedback and suggestions

## Support

- 📚 [Documentation](./FEATURES.md)
- 📖 [API Reference](./API_REFERENCE.md)
- 📋 [README](./README.md)
- 🐛 [GitHub Issues](https://github.com/skanda890/CodePark/issues)
- 💬 [GitHub Discussions](https://github.com/skanda890/CodePark/discussions)

## License

MIT License - See LICENSE file for details

---

**Last Updated:** December 15, 2024  
**Maintainer:** Skanda890  
**Repository:** https://github.com/skanda890/CodePark
