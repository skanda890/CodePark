module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!jest.config.js',
    '!.eslintrc.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  bail: 1,
  maxWorkers: '50%',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@services/(.*)$': '<rootDir>/services/$1'
  },
  transform: {},
  testTimeout: 30000,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'html', 'text-summary']
}
