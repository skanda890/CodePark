# Math Calculator API v2.0 - Complete Reference

## Overview

Math Calculator API provides advanced mathematical computation with support for arbitrary precision, large numbers, and special functions.

## Base URL

```
http://localhost:4000
```

## Authentication

No authentication required. Rate limiting applies:
- **General endpoints**: 100 requests per 15 minutes per IP
- **Calculate endpoint**: 20 requests per minute per IP

## Endpoints

### 1. Single Calculation

**POST** `/calculate`

Evaluate a single mathematical expression.

#### Request

```json
{
  "expression": "10googol + 5"
}
```

#### Response

```json
{
  "question": "What is the result of: 10googol + 5?",
  "solution": "1e101",
  "explanation": "10googol + 5 = 1e101"
}
```

#### Examples

**Basic arithmetic:**
```bash
curl -X POST http://localhost:4000/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression": "5 + 3 * 2"}'
```

**Large numbers:**
```bash
curl -X POST http://localhost:4000/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression": "1million + 500thousand"}'
```

**Tower exponentiation:**
```bash
curl -X POST http://localhost:4000/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression": "10^10^10"}'
```

**Vieta's formula:**
```bash
curl -X POST http://localhost:4000/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression": "vieta(100)"}'
```

#### Supported Operations

- **Basic**: `+`, `-`, `*`, `/`, `%`, `^` (power)
- **Functions**: `sqrt()`, `sin()`, `cos()`, `tan()`, `log()`, `exp()`, `abs()`
- **Special**: `vieta(n)`, `squareroot(n)`, `square(n)`
- **Shorthand numbers**: `k`, `thousand`, `million`, `billion`, `trillion`, `googol`, `googolplex`, `centillion`
- **Special numbers**: `skewes`, `moser`, `grahams`

---

### 2. Batch Calculations

**POST** `/calculate/batch`

Evaluate multiple expressions in a single request (max 10).

#### Request

```json
{
  "expressions": [
    "5 + 3",
    "10 * 2",
    "vieta(50)"
  ]
}
```

#### Response

```json
{
  "count": 3,
  "results": [
    {
      "expression": "5 + 3",
      "question": "What is the result of: 5 + 3?",
      "solution": "8",
      "explanation": "5 + 3 = 8"
    },
    {
      "expression": "10 * 2",
      "question": "What is the result of: 10 * 2?",
      "solution": "20",
      "explanation": "10 * 2 = 20"
    },
    {
      "expression": "vieta(50)",
      "question": "What is the result of: vieta(50)?",
      "solution": "3.14159265358979",
      "explanation": "Vieta's formula approximates π ≈ 3.14159265358979 (50 iterations)"
    }
  ]
}
```

#### Example

```bash
curl -X POST http://localhost:4000/calculate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "expressions": ["5+3", "10*2", "100/4"]
  }'
```

---

### 3. Health Check

**GET** `/health`

Check server health and uptime.

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-12-06T11:00:00Z",
  "uptime": 3600000,
  "environment": "production"
}
```

---

### 4. Metrics

**GET** `/metrics`

Get performance and usage metrics.

#### Response

```json
{
  "uptime": 3600000,
  "uptimeSeconds": 3600,
  "requestCount": 150,
  "calculationCount": 142,
  "errorCount": 8,
  "errorRate": "5.33%",
  "avgCalculationTime": "12.50ms",
  "cacheSize": 47
}
```

---

### 5. API Documentation

**GET** `/api/docs`

Get available endpoints and features.

#### Response

```json
{
  "version": "2.0.0",
  "endpoints": { ... },
  "features": [ ... ]
}
```

---

### 6. Web UI

**GET** `/calculator`

Access the web-based calculator interface.

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "requestId": "timestamp-random"
}
```

### Common Errors

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid request | Missing expression field |
| 400 | Expression too long | Exceeds 10,000 characters |
| 400 | Unsafe patterns | Contains require(), eval(), etc |
| 429 | Rate limit exceeded | Too many requests |
| 500 | Internal server error | Server error |

### Example Error

```bash
curl -X POST http://localhost:4000/calculate \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "error": "Invalid request",
  "message": "Expression field is required"
}
```

---

## Features

### Arbitrary Precision

Supports up to 1000 digits of precision:

```
Expression: 1/3
Result: 0.3333... (1000 digits)
```

### Large Numbers

Built-in shorthand for extremely large numbers:

```
1googol         → 10^100
1googolplex     → 10^(10^100)  [incomputable]
1trillion       → 10^12
100million      → 10^8
```

### Tower Exponentiation

Support for power towers:

```
10^10^5         → 10^100000 (incredibly large)
10^10^googolplex → Incomputable
```

### Special Functions

**Vieta's Formula** - Approximate π:
```
vieta(1000)     → 3.14159265... (1000 iterations)
```

### Response Caching

Recent calculations are cached for performance. Cache stores up to 100 results.

---

## Rate Limiting

### Headers

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1702134000
```

### Rate Limit Response

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900000
}
```

---

## Environment Variables

```bash
NODE_ENV=development   # development, production, or silent
PORT=4000             # Server port (default: 4000)
```

---

## Examples

### Example 1: Calculate with Precision

```bash
curl -X POST http://localhost:4000/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "expression": "(2 * sqrt(2)) / (sqrt(3) + 1)"
  }'
```

### Example 2: Batch Processing

```bash
curl -X POST http://localhost:4000/calculate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "expressions": [
      "sin(π/2)",
      "cos(0)",
      "tan(π/4)",
      "log(100)",
      "e^2"
    ]
  }'
```

### Example 3: Monitor Server

```bash
# Check health
curl http://localhost:4000/health

# Get metrics
curl http://localhost:4000/metrics

# Get documentation
curl http://localhost:4000/api/docs
```

---

## Performance Tips

1. **Use Batch Endpoint**: Process multiple calculations in one request
2. **Avoid Redundant Calculations**: Cache results in your client
3. **Set Reasonable Limits**: Vieta iterations limited to 1000
4. **Monitor Metrics**: Track performance and errors
5. **Use Compression**: Enable gzip compression for large responses

---

## Troubleshooting

### "Expression too long"
- **Cause**: Expression exceeds 10,000 characters
- **Solution**: Split into smaller expressions or use batch endpoint

### "Too many requests"
- **Cause**: Rate limit exceeded
- **Solution**: Wait before retrying or implement exponential backoff

### "Unsafe patterns"
- **Cause**: Expression contains dangerous patterns (require, eval, etc)
- **Solution**: Use only mathematical expressions

### Slow Performance
- **Cause**: Large Vieta iterations or complex expressions
- **Solution**: Check metrics endpoint, reduce iterations

---

## Version History

### v2.0.0 (Current)
- Added batch calculation endpoint
- Added metrics endpoint
- Added caching
- Improved logging
- Added API documentation endpoint
- Performance improvements

### v1.0.0
- Initial release
- Single calculation
- Large number support
- Security fixes
