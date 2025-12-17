// Jest setup file
// Global test configuration

// Import jwt at the top level to surface missing dependency issues early
const jwt = require('jsonwebtoken')

// Fail tests on unexpected console errors/warnings
let consoleErrorSpy
let consoleWarnSpy

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
})

afterEach(() => {
  const errorCalls = consoleErrorSpy?.mock.calls ?? []
  const warnCalls = consoleWarnSpy?.mock.calls ?? []

  // If any console errors or warnings occurred and the test didn't explicitly
  // expect them (by clearing or asserting on the mocks), fail the test.
  if (errorCalls.length > 0 || warnCalls.length > 0) {
    const errorMessages = errorCalls.map((args) => args.join(' ')).join('\n')
    const warnMessages = warnCalls.map((args) => args.join(' ')).join('\n')

    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()

    throw new Error(
      [
        'Unexpected console error/warn detected during test.',
        errorMessages && `console.error calls:\n${errorMessages}`,
        warnMessages && `console.warn calls:\n${warnMessages}`
      ]
        .filter(Boolean)
        .join('\n\n')
    )
  }

  consoleErrorSpy.mockRestore()
  consoleWarnSpy.mockRestore()
})

// Set test environment variables with overridable defaults
// This allows CI/local setup flexibility while providing sensible defaults
process.env.NODE_ENV ||= 'test'
process.env.JWT_SECRET ||= 'test-secret-key-min-32-chars-long-1234567890'
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-min-32-chars-long123'
process.env.MONGODB_URL ||=
  process.env.MONGODB_TEST_URL || 'mongodb://test-mongodb:27017/codepark-test'
process.env.REDIS_HOST ||= process.env.REDIS_TEST_HOST || 'test-redis'
process.env.REDIS_PORT ||= process.env.REDIS_TEST_PORT || '6379'
process.env.TEST_ENV ||= 'true'

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

  generateMockToken: (overrides = {}) => {
    const tokenPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      ...overrides
    }
    return jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' })
  },

  // Helper to allow tests to assert on console calls
  expectConsoleCall: (spy, pattern) => {
    const calls = spy.mock.calls.flat().join(' ')
    if (!calls.includes(pattern)) {
      throw new Error(
        `Expected console call to include "${pattern}", but got: ${calls}`
      )
    }
  }
}
