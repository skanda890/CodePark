# CodePark Testing & Deployment Strategy

## Testing Framework

### Unit Tests Example

```javascript
// tests/unit/middleware/validation.test.js
const request = require('supertest');
const express = require('express');
const { authValidation, handleValidationErrors } = require('../../../middleware/validation');

describe('Input Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/register', authValidation.register, handleValidationErrors, (req, res) => {
      res.json({ success: true });
    });
  });

  test('should reject invalid email', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        email: 'invalid-email',
        password: 'ValidPass123!@#',
        username: 'validuser'
      });
    expect(res.status).toBe(400);
  });

  test('should reject weak password', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        email: 'user@example.com',
        password: 'weak',
        username: 'validuser'
      });
    expect(res.status).toBe(400);
  });
});
```

### Integration Tests Example

```javascript
// tests/integration/security.test.js
describe('Security Integration Tests', () => {
  describe('CORS Security', () => {
    test('should reject unauthorized origins', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'https://unauthorized.com');
      expect(res.status).toBe(403);
    });
  });

  describe('Webhook Security', () => {
    test('should reject webhook without signature', async () => {
      const res = await request(app)
        .post('/api/webhooks/test')
        .send({ test: 'data' });
      expect(res.status).toBe(401);
    });
  });
});
```

---

## GitHub Actions CI/CD Workflow

```yaml
# .github/workflows/security-and-tests.yml
name: Security & Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.13.1'
      - run: npm ci
      - run: npm audit --audit-level=moderate
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.13.1'
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.13.1'
      - run: npm ci
      - run: npm run lint

  integration-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7.0
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.13.1'
      - run: npm ci
      - run: npm run test:integration

  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/dependency-review-action@v3

  codeql:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v2
        with:
          languages: 'javascript'
      - uses: github/codeql-action/autobuild@v2
      - uses: github/codeql-action/analyze@v2

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: trufflesecurity/trufflehog@main

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t codepark:${{ github.sha }} .
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: codepark:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
```

---

## Pre-Deployment Checklist

```bash
#!/bin/bash
echo "🔍 CodePark Pre-Deployment Security Checklist"
echo "============================================="

# 1. Dependency audit
echo "1️⃣  Checking dependencies..."
npm audit --production || exit 1

# 2. Environment validation
echo "2️⃣  Validating environment..."
npm run test:env || exit 1

# 3. Run all tests
echo "3️⃣  Running test suite..."
npm test -- --coverage || exit 1

# 4. Linting
echo "4️⃣  Running linter..."
npm run lint || exit 1

# 5. Security scan
echo "5️⃣  Security scan..."
npm run security-check || exit 1

# 6. Build check
echo "6️⃣  Building application..."
npm run build || exit 1

echo ""
echo "✅ All pre-deployment checks passed!"
echo "Ready for deployment"
```

---

## Deployment Steps

### Step 1: Create Feature Branch
```bash
git checkout -b fix/security-critical-updates
```

### Step 2: Implement Changes
- Copy all files from critical-fixes-code.md
- Update package.json versions
- Update configuration files
- Update .env.example

### Step 3: Test Locally
```bash
npm install
npm run test:unit
npm run test:integration
npm run lint
npm run security-check
```

### Step 4: Create Pull Request
```bash
git add .
git commit -m "fix: critical security vulnerabilities"
git push origin fix/security-critical-updates
```

### Step 5: GitHub PR Workflow
1. PR will trigger all security checks
2. All checks must pass
3. Code review required
4. Once approved, merge to develop branch
5. Deploy to staging environment
6. Run smoke tests
7. Deploy to production

### Step 6: Post-Deployment Verification
```bash
# Verify deployment
curl -H "Authorization: Bearer $TOKEN" https://api.codepark.io/health

# Check metrics
curl https://api.codepark.io/metrics

# Verify security headers
curl -I https://api.codepark.io/

# Monitor logs
kubectl logs -f deployment/codepark-api
```

---

## Rollback Plan

If deployment fails:

```bash
# 1. Identify issue
kubectl get pods -n production
kubectl logs <failed-pod>

# 2. Rollback to previous version
kubectl rollout undo deployment/codepark-api -n production

# 3. Verify rollback
kubectl get deployment codepark-api -n production
curl https://api.codepark.io/health

# 4. Investigate failure
# - Check logs
# - Review metrics
# - Check error traces

# 5. Fix issue and redeploy
```

---

## Monitoring Post-Deployment

```javascript
// monitoring/security-dashboard.js
const prometheus = require('prom-client');

// Security metrics
const securityViolations = new prometheus.Counter({
  name: 'security_violations_total',
  help: 'Total security violations detected',
  labelNames: ['type', 'severity']
});

const validationErrors = new prometheus.Counter({
  name: 'validation_errors_total',
  help: 'Total validation errors',
  labelNames: ['endpoint', 'reason']
});

const rateLimitExceeded = new prometheus.Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Rate limit violations',
  labelNames: ['endpoint', 'ip']
});

// Alerts to monitor
const alerts = [
  {
    name: 'HighSecurityViolationRate',
    query: 'rate(security_violations_total[5m]) > 10',
    severity: 'CRITICAL'
  },
  {
    name: 'MongoDBConnectionFailures',
    query: 'mongodb_connection_errors_total > 5',
    severity: 'HIGH'
  },
  {
    name: 'RedisConnectionFailures',
    query: 'redis_connection_errors_total > 5',
    severity: 'HIGH'
  }
];

module.exports = { securityViolations, validationErrors, rateLimitExceeded, alerts };
```

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Test Coverage | 90%+ | ✅ Plan |
| npm Audit | 0 critical | ✅ Plan |
| Security Scan | Clean | ✅ Plan |
| Uptime | 99.9% | ✅ Goal |
| P99 Latency | <200ms | ✅ Goal |
| TLS Coverage | 100% | ✅ Goal |
| Input Validation | 100% endpoints | ✅ Goal |

---

**All testing and deployment procedures ready for immediate implementation.**
