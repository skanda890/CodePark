class InputValidator {
  constructor() {
    this.rules = new Map();
  }

  defineRule(name, validator) {
    this.rules.set(name, validator);
  }

  validate(input, rules) {
    const errors = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = input[field];
      const fieldErrors = [];

      if (Array.isArray(fieldRules)) {
        for (const rule of fieldRules) {
          const error = this.applyRule(value, rule);
          if (error) fieldErrors.push(error);
        }
      } else {
        const error = this.applyRule(value, fieldRules);
        if (error) fieldErrors.push(error);
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  applyRule(value, rule) {
    if (typeof rule === 'string') {
      const validator = this.rules.get(rule);
      if (validator) {
        return validator(value);
      }
    } else if (typeof rule === 'function') {
      return rule(value);
    }
    return null;
  }
}

// Common validators
const CommonValidators = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? null : 'Invalid email format';
  },
  password: (value) => {
    if (!value || value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain number';
    return null;
  },
  url: (value) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  }
};

module.exports = { InputValidator, CommonValidators };
