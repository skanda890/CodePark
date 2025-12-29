/**
 * JSON Schema Validator (Feature #37)
 * Validates JSON against schemas
 */

class JSONSchemaValidator {
  constructor () {
    this.schemas = new Map()
  }

  /**
   * Register schema
   */
  registerSchema (name, schema) {
    this.schemas.set(name, schema)
  }

  /**
   * Validate against schema
   */
  validate (data, schemaName) {
    const schema = this.schemas.get(schemaName)
    if (!schema) {
      throw new Error(`Schema ${schemaName} not found`)
    }

    const errors = []
    this.validateValue(data, schema, '', errors)

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate value
   */
  validateValue (value, schema, path, errors) {
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== schema.type) {
        errors.push(`${path}: Expected ${schema.type}, got ${actualType}`)
        return
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const propPath = path ? `${path}.${key}` : key
        this.validateValue(value[key], propSchema, propPath, errors)
      }
    }

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in value)) {
          errors.push(`${path}: Missing required field '${field}'`)
        }
      }
    }
  }
}

module.exports = JSONSchemaValidator
