// Jest setup file
// Global test configuration

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  // log: jest.fn(),
  // debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  // info: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only';
process.env.MONGODB_URL = 'mongodb://localhost:27017/codepark-test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Global test utilities
global.testUtils = {
  generateTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPassword123!@#',
    ...overrides
  }),

  generateTestProject: (overrides = {}) => ({
    name: 'Test Project',
    description: 'A test project',
    owner: 'testuser',
    ...overrides
  }),

  generateMockToken: () => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId: 'test-user-id', email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};
