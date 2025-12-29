/**
 * Dynamic Form Builder (Feature #39)
 * Builds forms dynamically from schema
 */

const crypto = require('crypto')

class FormBuilder {
  constructor () {
    this.forms = new Map()
    this.validations = new Map()
  }

  /**
   * Define form
   */
  defineForm (name, fields) {
    const form = {
      id: crypto.randomUUID(),
      name,
      fields: fields.map((field) => ({
        ...field,
        id: crypto.randomUUID()
      })),
      createdAt: new Date()
    }

    this.forms.set(name, form)
    return form
  }

  /**
   * Add field to form
   */
  addField (formName, field) {
    const form = this.forms.get(formName)
    if (!form) {
      throw new Error(`Form ${formName} not found`)
    }

    form.fields.push({
      ...field,
      id: crypto.randomUUID()
    })
  }

  /**
   * Get form
   */
  getForm (formName) {
    return this.forms.get(formName)
  }

  /**
   * Validate form submission
   */
  validateSubmission (formName, data) {
    const form = this.forms.get(formName)
    if (!form) {
      throw new Error(`Form ${formName} not found`)
    }

    const errors = {}

    for (const field of form.fields) {
      const value = data[field.name]

      if (field.required && !value) {
        errors[field.name] = `${field.label} is required`
      }

      if (value && field.type === 'email' && !this.isValidEmail(value)) {
        errors[field.name] = `${field.label} must be a valid email`
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * Validate email
   */
  isValidEmail (email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
}

module.exports = FormBuilder
