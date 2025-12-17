# CodePark Testing Guide

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (re-run on file changes)
npm run test:watch

# Run specific test file
npm test path/to/test.js

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run e2e tests only
npm run test:e2e
```

## Test Structure

```
tests/
├── unit/                    # Pure unit tests (no external dependencies)
│   ├── utils.test.js
│   └── helpers.test.js
├── integration/             # Tests with database, cache, services
│   ├── auth.test.js
│   └── database.test.js
├── e2e/                    # End-to-end API tests
│   └── api-flow.test.js
├── setup.js                # Global Jest setup
├── jest.setup.env          # Test environment variables
├── CONSOLE_MOCKING.md      # Console spy best practices
└── TESTING_GUIDE.md        # This file
```

## Environment Variables

Tests use isolated configuration via `tests/jest.setup.env`:

- **Database**: `mongodb://test-mongodb:27017/codepark-test` (not localhost)
- **Redis**: `test-redis:6379` (not localhost)
- **JWT**: 32+ character test secrets
- **External calls**: Disabled by default

### Override for CI/CD

```bash
# GitHub Actions
env:
  MONGODB_TEST_URL: mongodb://mongo:27017/test
  REDIS_TEST_HOST: redis
  npm test
```

## Best Practices

### 1. Use Descriptive Test Names

```javascript
// ✅ Good
it("should return 400 when email is missing", () => {});
it("should create user with valid data", () => {});

// ❌ Bad
it("works", () => {});
it("test email", () => {});
```

### 2. Follow AAA Pattern (Arrange, Act, Assert)

```javascript
it("should calculate total price correctly", () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 },
  ];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(35);
});
```

### 3. Use Test Utilities

```javascript
it("should authenticate user", () => {
  // Use global.testUtils for consistency
  const user = global.testUtils.generateTestUser({
    email: "custom@example.com",
  });
  const token = global.testUtils.generateMockToken();

  expect(token).toBeDefined();
});
```

### 4. Isolate External Calls

```javascript
// Mock external services in setup or per-test
beforeEach(() => {
  jest.spyOn(EmailService, "send").mockResolvedValue({ success: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 5. Test Error Cases

```javascript
it("should handle invalid input gracefully", () => {
  expect(() => {
    myFunction(null);
  }).toThrow("Input is required");
});

it("should reject invalid email", () => {
  const result = validateEmail("not-an-email");
  expect(result.valid).toBe(false);
});
```

### 6. Use beforeEach/afterEach for Setup

```javascript
describe("UserService", () => {
  let db;

  beforeEach(async () => {
    // Setup before each test
    db = await connectTestDatabase();
  });

  afterEach(async () => {
    // Cleanup after each test
    await db.clearCollections();
    await db.disconnect();
  });

  it("should create user", () => {
    // db is clean and ready
  });
});
```

## Coverage Requirements

CodePark enforces **70% coverage minimums**:

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

Check coverage:

```bash
npm run test:coverage
```

## Common Issues

### Tests Fail with "ECONNREFUSED"

Test databases not running. For local testing:

```bash
# Start Docker containers
docker-compose -f tests/docker-compose.test.yml up

# Run tests
npm test
```

### Timeout Errors ("Jest did not exit...")

Test didn't close database/cache connections:

```javascript
afterEach(async () => {
  // ✅ Close connections
  await db.disconnect();
  await redis.disconnect();
});
```

### Flaky Tests

Tests that pass/fail randomly usually have:

- Timing issues (use `jest.useFakeTimers()` or explicit waits)
- Shared state (ensure proper cleanup)
- External dependencies (mock them)

## Mocking Strategies

### Mock Database

```javascript
jest.mock("models/User", () => ({
  create: jest.fn().mockResolvedValue({ id: "1", email: "test@example.com" }),
  findById: jest.fn(),
}));
```

### Mock External API

```javascript
jest.mock("axios", () => ({
  get: jest.fn().mockResolvedValue({ data: { status: "ok" } }),
}));
```

### Partial Mock (Mock Some Methods)

```javascript
const UserService = require("services/UserService");
jest.spyOn(UserService, "sendEmail").mockResolvedValue(true);
```

## Debugging Tests

### Run Single Test

```bash
npm test -- --testNamePattern="should create user"
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### Print Statements

```javascript
it("debugging", () => {
  console.log("This won't show because console.log is not mocked");
  console.error("This will show up if there's a failure");
});
```

## Performance

- Tests should complete in <5 seconds each
- Full suite should complete in <1 minute
- Use `--maxWorkers` to parallelize: `npm test -- --maxWorkers=4`

## CI/CD Integration

See `.github/workflows/test.yml` for automated test runs:

- Runs on every PR
- Blocks merge if coverage < 70%
- Tests against multiple Node versions
- Runs on multiple OS (Linux, macOS, Windows)
