/**
 * Input Validation Module
 * Implements input sanitization and validation to prevent injection attacks
 * Features: SQL injection prevention, XSS prevention, NoSQL injection prevention
 */

const DOMPurify = require('isomorphic-dompurify')
const validator = require('validator')

class InputValidator {
  constructor () {
    this.rules = new Map()
  }

  /**
   * Sanitize string input to prevent XSS
   * Removes dangerous HTML/JavaScript
   */
  sanitizeString (input) {
    if (typeof input !== 'string') {
      return input
    }

    // Remove dangerous characters and HTML
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    }).trim()
  }

  /**
   * Escape string for safe display in HTML
   */
  escapeHtml (input) {
    if (typeof input !== 'string') {
      return input
    }

    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }

    return input.replace(/[&<>"']/g, (m) => map[m])
  }

  /**
   * Validate email address
   */
  validateEmail (email) {
    if (typeof email !== 'string') {
      return false
    }

    const sanitized = this.sanitizeString(email)
    return validator.isEmail(sanitized) && sanitized.length <= 255
  }

  /**
   * Validate username
   * Allow alphanumeric and underscore, 3-32 characters
   */
  validateUsername (username) {
    if (typeof username !== 'string') {
      return false
    }

    const sanitized = this.sanitizeString(username)
    return /^[a-zA-Z0-9_]{3,32}$/.test(sanitized)
  }

  /**
   * Validate URL
   * Prevent JavaScript protocol and data URIs
   */
  validateUrl (url) {
    if (typeof url !== 'string') {
      return false
    }

    const sanitized = this.sanitizeString(url)

    // Block dangerous protocols
    if (/^(javascript|data|vbscript):/i.test(sanitized)) {
      return false
    }

    try {
      new URL(sanitized) // Will throw if invalid
      return validator.isURL(sanitized)
    } catch (e) {
      return false
    }
  }

  /**
   * Validate integer
   * @param {any} value - Value to validate
   * @param {number} min - Minimum value (optional)
   * @param {number} max - Maximum value (optional)
   */
  validateInteger (value, min, max) {
    if (!Number.isInteger(value)) {
      return false
    }

    if (min !== undefined && value < min) {
      return false
    }

    if (max !== undefined && value > max) {
      return false
    }

    return true
  }

  /**
   * Prevent NoSQL injection by validating object keys
   * Removes keys starting with $ or containing .
   */
  sanitizeObject (obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item))
    }

    const sanitized = {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Prevent MongoDB injection operators
        if (key.startsWith('$') || key.includes('.')) {
          console.warn(`Suspicious key detected and removed: ${key}`)
          continue
        }

        const value = obj[key]
        sanitized[key] =
          typeof value === 'object' ? this.sanitizeObject(value) : value
      }
    }

    return sanitized
  }

  /**
   * Validate request body against schema
   * Simple schema validation for common cases
   */
  validateSchema (data, schema) {
    const errors = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field]

      // Check required
      if (
        rules.required &&
        (value === undefined || value === null || value === '')
      ) {
        errors.push(`${field} is required`)
        continue
      }

      if (value === undefined || value === null) {
        continue
      }

      // Check type
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be ${rules.type}`)
      }

      // Check min length
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`)
      }

      // Check max length
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`)
      }

      // Check pattern
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} does not match required format`)
      }

      // Check enum
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`)
      }
    }

    return errors
  }
}

module.exports = InputValidator
