# Math Calculator with Large Number Support

A secure, high-precision mathematical calculator API with support for extremely large numbers including googolplex and tower exponentiation. Built with **cutting-edge, latest versions** of all dependencies.

## ⚡ Cutting-Edge Technology Stack

This project uses the **latest stable and pre-release versions** of all dependencies for maximum performance, security, and features:


- **Express v5.2.1** - Latest Express 5 with Promise support and enhanced routing
- **Helmet v8.1.0** - Latest security headers with improved CSP
- **MathJS v15.1.0** - Latest with performance optimizations
- **Decimal.js v10.4.3** - Latest arbitrary-precision arithmetic
- **Axios v1.7.9** - Latest HTTP client
- **Socket.io v4.8.1** - Latest real-time engine
- **Express-rate-limit v8.2.1** - Latest rate limiting

### 🔄 Auto-Update Strategy

All dependencies use **caret (^) ranges** for automatic minor and patch updates:

```bash
# Manually update to latest versions
npm run update:latest

# Check for security issues
npm run audit
```

## Features

### 🔢 Large Number Support
- **Arbitrary Precision**: Uses Decimal.js with 1000-digit precision
- **Googolplex Support**: Handles 10^10^100 and even larger numbers
- **Tower Exponentiation**: Supports power towers like `10^10^googolplex`
- **Named Large Numbers**:
  - googol (10^100)
  - googolplex (10^googol)
  - centillion (10^303)
  - Skewes' number
  - Graham's number (conceptual)
  - Moser's number (conceptual)

### 🔐 Security Features

- **Input Validation**: Comprehensive sanitization to prevent injection attacks
- **Rate Limiting**:
  - 100 requests per 15 minutes (general)
  - 20 calculations per minute (compute-intensive)
- **Helmet.js v8.1.0**: Latest security headers protection
- **DoS Protection**: Expression length limit (10,000 characters)
- **Pattern Detection**: Blocks suspicious code patterns
- **Request Size Limiting**: 100KB maximum request body

### 🧮 Mathematical Operations

- Basic arithmetic (+, -, \*, /, ^)
- Square roots: `squareroot(n)`
- Squares: `square(n)`
- Vieta's formula: `vieta(iterations)` - approximates π
- Shorthand notation: `5googol`, `10million`, `2.5billion`
- Tower exponentiation: `10^10^googolplex`
- Chained expressions: `y=29-x=squareroot9`

## Installation

### Requirements
- **Node.js**: >= 18.0.0 (for Express 5 compatibility)
- **npm**: >= 9.0.0

```bash
npm install
```

### Keeping Dependencies Fresh

```bash
# Update all dependencies to latest versions
npm run update:latest

# Check and fix security vulnerabilities
npm run audit

# View outdated packages
npm outdated
```

## Usage

### Start the Server


```bash
# Development mode

npm run dev

# Production mode

npm run prod

# Default

npm start
```

The server runs on `http://localhost:4000` by default (configurable via `PORT` environment variable).

### API Endpoints


#### `GET /`
Welcome message

#### `GET /calculator`
Serves the HTML calculator interface

#### `POST /calculate`
Performs mathematical calculations


**Request Body:**
```json
{

  "expression": "10^10^googol"
}
```

**Response:**
```json
{
  "question": "What is the result of: 10^10^googol?",
  "solution": "Infinity (Computational representation impossible)",
  "explanation": "This is 10 raised to the power of googolplex (10^10^100), an incomprehensibly large number that cannot be computed or stored.\n\nRepresentation: 10^googolplex\n\nThis number is so large it exceeds the storage capacity of any computer system ever built or conceivable."

}
```

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-06T05:00:00.000Z"
}
```

## Examples

### Basic Operations
```javascript
// Standard arithmetic
"2 + 2"; // 4
"100 * 50"; // 5000
"2^10"; // 1024

// Square root and square
"squareroot16"; // 4
"square12"; // 144
```

### Large Numbers with Shorthand

```javascript
"5googol"; // 5 * 10^100
"2.5million"; // 2500000
"10billion + 5billion"; // 15000000000
"3googol * 2"; // 6 * 10^100
```

### Tower Exponentiation

```javascript
// Computable power tower
"2^2^3"; // 256 (2^8)

// Extremely large (returns description)
"10^10^100"; // Googolplex (special handling)
"10^10^googol"; // Beyond googolplex
"10^10^googolplex"; // Incomprehensibly large
```

### Special Functions

```javascript
// Vieta's formula (approximates π)
"vieta(10)"; // ~3.141592653
"vieta(100)"; // Higher precision π approximation

// Chained expressions
"y=29-x=squareroot9"; // Evaluates to 26
```

### Scientific Notation

```javascript
"1e100"; // 10^100 (googol)
"1e308"; // Near maximum standard float
```

## Security Considerations

### Protected Against

- ✅ Code injection attacks
- ✅ ReDoS (Regular Expression Denial of Service)
- ✅ Request flooding / DoS
- ✅ Prototype pollution
- ✅ Command injection
- ✅ XSS attacks (via CSP headers)

### Input Sanitization

The calculator automatically:

- Removes dangerous characters: `; < > { } [ ] \`
- Blocks suspicious patterns: `require()`, `import`, `eval()`, `function()`, etc.
- Limits expression length to prevent memory exhaustion
- Validates input types and formats

## Error Handling

The calculator provides detailed error messages:

```json
{
  "question": "What is the result of: invalid_expr?",
  "solution": "Error",
  "explanation": "Calculation error: Expression contains potentially unsafe patterns"
}
```

Common errors:

- `Expression too long`: Exceeds 10,000 character limit
- `Expression contains potentially unsafe patterns`: Security validation failed
- `Unsupported shorthand term`: Unknown number name
- `Vieta iterations limited to 1000`: Performance protection

## Technical Details

### Dependencies (Latest Versions)


| Package | Version | Purpose |
|---------|---------|----------|
| express | ^5.2.1 | Web framework (Express 5 with Promise support) |
| helmet | ^8.1.0 | Security headers (latest CSP improvements) |
| mathjs | ^15.1.0 | Mathematical expression parser (performance optimized) |
| decimal.js | ^10.4.3 | Arbitrary-precision arithmetic |

| axios | ^1.7.9 | HTTP client |
| socket.io | ^4.8.1 | Real-time communication |
| express-rate-limit | ^8.2.1 | Rate limiting middleware |
| big-integer | ^1.6.52 | Large integer operations |
| big.js | ^7.0.1 | Big number arithmetic |
| crypto-js | ^4.2.0 | Cryptographic functions |
| nerdamer | ^1.1.13 | Symbolic math |
| readline-sync | ^1.4.10 | Synchronous readline |

### Why Latest Versions?

✅ **Security**: Latest patches and vulnerability fixes  
✅ **Performance**: Optimizations and improvements  
✅ **Features**: Access to newest capabilities  
✅ **Compatibility**: Better Node.js 18+ integration  
✅ **Express 5**: Promise-based middleware, better error handling  

### Precision Configuration
```javascript
Decimal.set({
  precision: 1000, // Support up to 1000 digits
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});
```

### Rate Limiting

```javascript
// General endpoints: 100 requests per 15 minutes
// /calculate endpoint: 20 requests per minute
```

## Performance Notes

- **Small to medium numbers** (< 10^100): Computed exactly
- **Large numbers** (10^100 to 10^1000): Computed with Decimal.js
- **Extremely large numbers** (> 10^1000): Returns description and approximation
- **Undefined numbers** (googolplex, Graham's, etc.): Return conceptual explanations

## Version History

### v2.0.0 (Current - December 2025)

- ✨ Added support for googolplex and larger undefined numbers
- ✨ Implemented tower exponentiation (power towers)
- 🔒 **Updated to latest/pre-release versions of all dependencies**
- 🔒 Express 5.2.1 with Promise support
- 🔒 Helmet 8.1.0 with enhanced security
- 🔒 MathJS 15.1.0 with performance improvements
- 🔒 Added comprehensive security features
- 🔒 Implemented input validation and sanitization
- 🔒 Enhanced rate limiting
- 🐛 Fixed potential injection vulnerabilities
- 📈 Improved Decimal.js precision to 1000 digits
- 🎯 Added health check endpoint
- 🎯 Graceful shutdown handling

- 📝 Comprehensive error messages
- 📝 Added auto-update npm scripts

### v1.0.0
- Initial release with basic calculator functionality


## Maintenance

### Regular Updates

This project follows a **continuous update strategy**:

1. **Weekly**: Check for dependency updates
2. **Monthly**: Run security audits
3. **Quarterly**: Review and test all major version upgrades

```bash
# Check for updates
npm outdated

# Update all to latest
npm run update:latest

# Security audit
npm run audit
```

### Dependency Update Policy

- **Patch updates** (̃x.x.X): Automatic via caret ranges
- **Minor updates** (̃x.X.x): Automatic via caret ranges
- **Major updates** (X.x.x): Manual review and testing required

## Contributing

Contributions are welcome! Please ensure:
1. Security best practices are maintained
2. All inputs are validated and sanitized
3. Large number handling is tested
4. Error cases are properly handled
5. **Keep dependencies updated** to latest versions

## License

MIT License - See LICENSE file for details

## Author

SkandaBT

## Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with cutting-edge technology** ⚡  
**Always up-to-date** 🔄  
**Security-first** 🔒  
**Performance-optimized** 🚀
