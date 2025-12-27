/**
 * Security Module Tests
 * Unit tests for JWT, password hashing, input validation, rate limiting
 */

const JWTSecurityManager = require('../src/security/jwt-security')
const PasswordHashManager = require('../src/security/password-hashing')
const InputValidator = require('../src/security/input-validation')
const RateLimiter = require('../src/security/rate-limiter')

describe('JWT Security Manager', () => {
  let manager

  beforeEach(() => {
    manager = new JWTSecurityManager({
      secret: 'test-secret-key-must-be-long-enough-32-chars'
    })
  })

  test('should generate access token', () => {
    const token = manager.generateAccessToken('user123')
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
  })

  test('should verify valid token', async () => {
    const token = manager.generateAccessToken('user123')
    const decoded = await manager.verifyToken(token)
    expect(decoded.sub).toBe('user123')
    expect(decoded.type).toBe('access')
  })

  test('should reject invalid token', async () => {
    await expect(manager.verifyToken('invalid.token.here')).rejects.toThrow()
  })
})

describe('Password Hash Manager', () => {
  let manager

  beforeEach(() => {
    manager = new PasswordHashManager()
  })

  test('should hash password', async () => {
    const hash = await manager.hashPassword('TestPassword123!')
    expect(hash).toBeTruthy()
    expect(hash.startsWith('$argon2id')).toBe(true)
  })

  test('should verify correct password', async () => {
    const password = 'TestPassword123!'
    const hash = await manager.hashPassword(password)
    const isMatch = await manager.verifyPassword(password, hash)
    expect(isMatch).toBe(true)
  })

  test('should reject incorrect password', async () => {
    const hash = await manager.hashPassword('TestPassword123!')
    const isMatch = await manager.verifyPassword('WrongPassword', hash)
    expect(isMatch).toBe(false)
  })
})

describe('Input Validator', () => {
  let validator

  beforeEach(() => {
    validator = new InputValidator()
  })

  test('should validate email', () => {
    expect(validator.validateEmail('test@example.com')).toBe(true)
    expect(validator.validateEmail('invalid-email')).toBe(false)
  })

  test('should validate username', () => {
    expect(validator.validateUsername('valid_user')).toBe(true)
    expect(validator.validateUsername('ab')).toBe(false)
  })

  test('should sanitize object for NoSQL injection', () => {
    const input = { name: 'test', $where: 'hack' }
    const sanitized = validator.sanitizeObject(input)
    expect(sanitized.$where).toBeUndefined()
    expect(sanitized.name).toBe('test')
  })
})

describe('Rate Limiter', () => {
  let limiter

  beforeEach(() => {
    limiter = new RateLimiter({
      defaultLimit: 5,
      defaultWindow: 60
    })
  })

  test('should allow requests under limit', async () => {
    const result = await limiter.isAllowed('test-ip')
    expect(result.allowed).toBe(true)
  })
})
