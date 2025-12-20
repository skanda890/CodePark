const RequestValidator = require('../index.js')

describe('RequestValidator', () => {
  let validator

  beforeEach(() => {
    validator = new RequestValidator()
  })

  describe('Schema Registration and Validation', () => {
    test('should register and validate against schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer', minimum: 0, maximum: 150 }
        },
        required: ['name', 'email'],
        additionalProperties: false
      }

      validator.registerSchema('user', schema)

      const result = validator.validate('user', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      })

      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    test('should fail validation with invalid data', () => {
      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' }
        },
        required: ['email']
      }

      validator.registerSchema('contact', schema)

      const result = validator.validate('contact', {
        email: 'invalid-email'
      })

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should format validation errors properly', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 3 }
        },
        required: ['name']
      }

      validator.registerSchema('user', schema)

      const result = validator.validate('user', {
        name: 'ab'
      })

      expect(result.valid).toBe(false)
      expect(result.errors[0].field).toBe('name')
    })
  })

  describe('Custom Rules', () => {
    test('should register and apply custom rules', () => {
      validator.registerRule('strongPassword', (value) => {
        if (!/[A-Z]/.test(value)) return 'Must contain uppercase'
        if (!/[0-9]/.test(value)) return 'Must contain number'
        if (!/[!@#$%^&*]/.test(value)) return 'Must contain special char'
        return true
      })

      const result = validator.validateWithRules(
        { password: 'MyPassword123!' },
        { password: 'strongPassword' }
      )

      expect(result.valid).toBe(true)
    })

    test('should fail custom rule validation', () => {
      validator.registerRule('minValue', (value) => {
        return value >= 18 ? true : 'Must be 18 or older'
      })

      const result = validator.validateWithRules(
        { age: 16 },
        { age: 'minValue' }
      )

      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toBe('Must be 18 or older')
    })
  })

  describe('Middleware', () => {
    test('should return middleware function', () => {
      const schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      }

      validator.registerSchema('test', schema)
      const mw = validator.middleware('test', 'body')

      expect(typeof mw).toBe('function')
    })

    test('middleware should validate request body', () => {
      const schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      }

      validator.registerSchema('test', schema)
      const mw = validator.middleware('test', 'body')

      const req = { body: { name: 'Test' } }
      const res = { status: () => ({ json: () => {} }) }
      let nextCalled = false

      const next = () => {
        nextCalled = true
      }

      mw(req, res, next)
      expect(nextCalled).toBe(true)
      expect(req.validatedData).toEqual({ name: 'Test' })
    })
  })
})
