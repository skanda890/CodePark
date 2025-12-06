/**
 * Input Sanitization Module
 * Removes potentially dangerous content from user input
 */

/**
 * Sanitize a single string value
 * @param {string} value - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (value) => {
  // Remove HTML tags by repeatedly applying the regex until no change occurs
  let prev
  let result = value
  do {
    prev = result
    result = result.replace(/<[^>]*>/g, '')
  } while (result !== prev)
  // Remove potentially dangerous SQL characters
  return result.replace(/(['"`; ])/g, '')
}

/**
 * Recursively sanitize an object
 * @param {Object} obj - Object to sanitize
 */
const sanitizeObject = (obj) => {
  for (const key in obj) {
    const value = obj[key]
    if (typeof value === 'string') {
      obj[key] = sanitizeString(value)
    } else if (value && typeof value === 'object') {
      sanitizeObject(value)
    }
  }
}

/**
 * Input Sanitization Middleware
 * Sanitizes request body, query, and params
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) sanitizeObject(req.body)
  if (req.query) sanitizeObject(req.query)
  if (req.params) sanitizeObject(req.params)

  next()
}

module.exports = sanitizeInput
