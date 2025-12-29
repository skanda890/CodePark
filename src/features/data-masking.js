/**
 * Data Masking & Anonymization (Feature #25)
 * Masks sensitive data and anonymizes information
 */

const crypto = require('crypto');

class DataMasking {
  constructor(options = {}) {
    this.sensitiveFields = options.sensitiveFields || [
      'password',
      'ssn',
      'creditCard',
      'apiKey',
      'secret',
    ];
    this.maskPatterns = new Map([
      ['email', (value) => value.replace(/(.)(.*)(.@.*)/, '$1***$3')],
      ['phone', (value) => value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3')],
      ['creditCard', (value) => value.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-****-****-$4')],
      ['ssn', (value) => value.replace(/(\d{3})-(\d{2})-(\d{4})/, '***-**-$3')],
      ['password', () => '***'],
      ['apiKey', (value) => `${value.substring(0, 4)}***${value.substring(value.length - 4)}`],
    ]);
  }

  /**
   * Mask value
   */
  mask(fieldName, value) {
    if (!value) return value;

    const maskFn = this.maskPatterns.get(fieldName);
    return maskFn ? maskFn(value) : '***';
  }

  /**
   * Mask object
   */
  maskObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskObject(item));
    }

    const masked = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        masked[key] = this.mask(key, value);
      } else if (typeof value === 'object') {
        masked[key] = this.maskObject(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Anonymize data
   */
  anonymize(userId) {
    return crypto.createHash('sha256').update(userId).digest('hex');
  }
}

module.exports = DataMasking;