const { validationResult } = require('express-validator');

/**
 * Input Validation Module
 * Validates and sanitizes user input using express-validator
 */

/**
 * Input Validation Middleware Factory
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Middleware function
 */
const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    next();
  };
};

module.exports = validateInput;
