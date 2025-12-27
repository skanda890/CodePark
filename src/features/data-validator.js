/**
 * Data Validation Schema Builder (Feature #20)
 * Advanced schema validation with complex rules
 */

class DataValidator {
  constructor() {
    this.schemas = new Map();
    this.customValidators = new Map();
  }

  /**
   * Register custom validator
   */
  registerValidator(name, validatorFn) {
    this.customValidators.set(name, validatorFn);
  }

  /**
   * Define schema
   */
  defineSchema(name, schema) {
    this.schemas.set(name, schema);
    return this;
  }

  /**
   * Validate data against schema
   */
  validate(data, schemaName) {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new Error(`Schema ${schemaName} not found`);
    }

    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rules);
      errors.push(...fieldErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate single field
   */
  validateField(field, value, rules) {
    const errors = [];

    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return errors;
    }

    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} does not match required pattern`);
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must not exceed ${rules.max}`);
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors.push(`${field} must have at least ${rules.minItems} items`);
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push(`${field} must not exceed ${rules.maxItems} items`);
      }
      if (rules.items) {
        value.forEach((item, index) => {
          const itemErrors = this.validateField(`${field}[${index}]`, item, rules.items);
          errors.push(...itemErrors);
        });
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }

    // Custom validator
    if (rules.custom && this.customValidators.has(rules.custom)) {
      const customValidator = this.customValidators.get(rules.custom);
      const customError = customValidator(value);
      if (customError) {
        errors.push(`${field}: ${customError}`);
      }
    }

    return errors;
  }
}

module.exports = DataValidator;
