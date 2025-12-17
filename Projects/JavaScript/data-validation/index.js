const joi = require('joi');

class DataValidator {
  constructor() {
    this.schemas = new Map();
  }

  defineSchema(name, schema) {
    this.schemas.set(name, joi.object(schema));
  }

  async validate(data, schemaName) {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new Error(`Schema not found: ${schemaName}`);
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      return { valid: false, errors };
    }

    return { valid: true, data: value };
  }
}

// Common schemas
const CommonSchemas = {
  user: {
    email: joi.string().email().required(),
    password: joi.string().min(12).required(),
    name: joi.string().required(),
    age: joi.number().min(0).max(150)
  },
  post: {
    title: joi.string().required(),
    content: joi.string().required(),
    tags: joi.array().items(joi.string())
  },
  game: {
    title: joi.string().required(),
    maxPlayers: joi.number().min(2).max(100),
    gameType: joi.string().valid('competitive', 'casual', 'cooperative')
  }
};

module.exports = { DataValidator, CommonSchemas };
