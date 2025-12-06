# CodePark Testing Guide

## Overview

This directory contains all tests for the CodePark enhanced features implementation.

## Test Structure

```
tests/
├── unit/              # Unit tests for individual services
│   ├── metrics.test.js
│   ├── mfa.test.js
│   ├── rateLimiter.test.js
│   ├── webhook.test.js
│   └── notification.test.js
└── integration/       # Integration tests for API endpoints
    ├── webhooks.test.js
    ├── auth.test.js
    └── api.test.js
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm test -- --coverage
```

## Writing Tests

### Unit Test Example

```javascript
const ServiceName = require("../../services/ServiceName");

describe("ServiceName", () => {
  let service;

  beforeEach(() => {
    service = new ServiceName();
  });

  describe("methodName", () => {
    test("should do something", () => {
      const result = service.methodName();
      expect(result).toBe(expected);
    });
  });
});
```

### Integration Test Example

```javascript
const request = require("supertest");
const app = require("../../index");

describe("API Endpoint", () => {
  test("POST /api/resource", async () => {
    const response = await request(app)
      .post("/api/resource")
      .send({ data: "test" })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

## Test Coverage Goals

- Unit Tests: > 80% coverage
- Integration Tests: All API endpoints
- E2E Tests: Critical user flows

## Continuous Integration

Tests are automatically run on:

- Pull requests
- Commits to main branch
- Pre-deployment

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Redis Connection Errors**
   - Ensure Redis server is running
   - Check REDIS_URL configuration

3. **Timeout Errors**
   - Increase jest timeout in package.json
   - Check for hanging async operations
