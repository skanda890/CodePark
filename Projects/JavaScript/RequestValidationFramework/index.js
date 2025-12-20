/**
 * Request Validation Framework
 * Centralized validation with JSON Schema, custom rules, and middleware integration
 * @version 1.0.0
 */

const Ajv = require('ajv')
const addFormats = require('ajv-formats')

class RequestValidator {
  constructor (options = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      removeAdditional: options.removeAdditional || false,
      useDefaults: true,
      coerceTypes: true,
      ...options.ajvOptions
    })

    addFormats(this.ajv)
    this.schemas = new Map()
    this.customRules = new Map()
    this.errorFormatter = options.errorFormatter || this.defaultErrorFormatter
  }

  /**
   * Register a JSON schema for validation
   * @param {string} name - Schema identifier
   * @param {object} schema - JSON Schema definition
   */
  registerSchema (name, schema) {
    try {
      this.ajv.addSchema(schema, name)
      this.schemas.set(name, schema)
      return true
    } catch (error) {
      throw new Error(`Failed to register schema '${name}': ${error.message}`)
    }
  }

  /**
   * Register a custom validation rule
   * @param {string} name - Rule name
   * @param {Function} validator - Validation function
   */
  registerRule (name, validator) {
    if (typeof validator !== 'function') {
      throw new Error(`Custom rule '${name}' must be a function`)
    }
    this.customRules.set(name, validator)
  }

  /**
   * Validate data against a schema
   * @param {string} schemaName - Schema to validate against
   * @param {object} data - Data to validate
   * @returns {object} - Validation result with valid flag and errors
   */
  validate (schemaName, data) {
    try {
      const validate = this.ajv.getSchema(schemaName)
      if (!validate) {
        throw new Error(`Schema '${schemaName}' not found`)
      }

      const isValid = validate(data)
      const errors = validate.errors || []

      return {
        valid: isValid,
        data: isValid ? data : null,
        errors: isValid ? [] : this.errorFormatter(errors),
        originalErrors: errors
      }
    } catch (error) {
      return {
        valid: false,
        data: null,
        errors: [{ message: error.message }],
        originalErrors: []
      }
    }
  }

  /**
   * Validate with custom rules
   * @param {object} data - Data to validate
   * @param {object} rules - Custom rules to apply
   * @returns {object} - Validation result
   */
  validateWithRules (data, rules) {
    const results = {
      valid: true,
      errors: []
    }

    for (const [fieldName, ruleNames] of Object.entries(rules)) {
      const fieldValue = data[fieldName]
      const rules_ = Array.isArray(ruleNames) ? ruleNames : [ruleNames]

      for (const ruleName of rules_) {
        const rule = this.customRules.get(ruleName)
        if (!rule) {
          results.errors.push({
            field: fieldName,
            rule: ruleName,
            message: `Rule '${ruleName}' not found`
          })
          results.valid = false
          continue
        }

        try {
          const ruleResult = rule(fieldValue, data)
          if (ruleResult !== true) {
            results.errors.push({
              field: fieldName,
              rule: ruleName,
              message:
                typeof ruleResult === 'string'
                  ? ruleResult
                  : 'Validation failed'
            })
            results.valid = false
          }
        } catch (error) {
          results.errors.push({
            field: fieldName,
            rule: ruleName,
            message: error.message
          })
          results.valid = false
        }
      }
    }

    return results
  }

  /**
   * Middleware for Express/Fastify
   * @param {string} schemaName - Schema to validate against
   * @param {string} source - 'body', 'query', or 'params'
   * @param {object} customRules - Custom rules map
   * @returns {Function} - Middleware function
   */
  middleware (schemaName, source = 'body', customRules = null) {
    return (req, res, next) => {
      const data = req[source]
      const validation = this.validate(schemaName, data)

      if (!validation.valid) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors
        })
      }

      if (customRules) {
        const customValidation = this.validateWithRules(
          validation.data,
          customRules
        )
        if (!customValidation.valid) {
          return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: customValidation.errors
          })
        }
      }

      req.validatedData = validation.data
      next()
    }
  }

  /**
   * Default error formatter
   * @private
   */
  defaultErrorFormatter (errors) {
    return errors.map((error) => ({
      field:
        error.instancePath.replace(/^\//g, '').replace(/\//g, '.') || 'root',
      keyword: error.keyword,
      message: this.getErrorMessage(error)
    }))
  }

  /**
   * Get user-friendly error message
   * @private
   */
  getErrorMessage (error) {
    const { keyword, params } = error
    switch (keyword) {
      case 'required':
        return `Field '${params.missingProperty}' is required`
      case 'type':
        return `Must be of type ${params.type}`
      case 'minLength':
        return `Must be at least ${params.limit} characters`
      case 'maxLength':
        return `Must be at most ${params.limit} characters`
      case 'minimum':
        return `Must be >= ${params.limit}`
      case 'maximum':
        return `Must be <= ${params.limit}`
      case 'enum':
        return `Must be one of: ${params.allowedValues.join(', ')}`
      case 'format':
        return `Invalid ${params.format} format`
      case 'pattern':
        return `Must match pattern ${params.pattern}`
      default:
        return error.message || 'Invalid value'
    }
  }
}

module.exports = RequestValidator
