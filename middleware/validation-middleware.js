const { body, validationResult, query, param } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Authentication validation rules
const authValidation = {
  register: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    
    body('password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain number')
      .matches(/[!@#$%^&*()_+\-=\[\]{};':",.<>?]/)
      .withMessage('Password must contain special character'),
    
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain alphanumeric, underscore, hyphen')
  ],
  
  login: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  updateProfile: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain alphanumeric, underscore, hyphen'),
    
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be max 500 characters')
      .escape()
  ]
};

// Game validation rules
const gameValidation = {
  createGame: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be 1-100 characters')
      .escape(),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be max 500 characters')
      .escape(),
    
    body('genre')
      .isIn(['action', 'adventure', 'puzzle', 'rpg', 'strategy', 'sports', 'other'])
      .withMessage('Invalid genre'),
    
    body('releaseYear')
      .optional()
      .isInt({ min: 1970, max: 2099 })
      .withMessage('Release year must be between 1970 and 2099')
      .toInt()
  ],
  
  updateScore: [
    param('gameId')
      .isMongoId()
      .withMessage('Invalid game ID'),
    
    body('score')
      .isInt({ min: 0, max: 999999999 })
      .withMessage('Score must be between 0 and 999,999,999')
      .toInt(),
    
    body('timestamp')
      .optional()
      .isISO8601()
      .withMessage('Invalid timestamp format')
  ],
  
  getGame: [
    param('gameId')
      .isMongoId()
      .withMessage('Invalid game ID')
  ]
};

// Webhook validation rules
const webhookValidation = {
  create: [
    body('url')
      .trim()
      .isURL({ require_protocol: true, require_tld: true })
      .withMessage('Invalid webhook URL'),
    
    body('events')
      .isArray({ min: 1 })
      .withMessage('Events must be a non-empty array'),
    
    body('events.*')
      .isIn(['game.created', 'game.updated', 'game.deleted', 'score.submitted', 'user.registered', 'user.updated'])
      .withMessage('Invalid event type'),
    
    body('active')
      .optional()
      .isBoolean()
      .withMessage('Active must be a boolean')
      .toBoolean()
  ],
  
  update: [
    param('webhookId')
      .isMongoId()
      .withMessage('Invalid webhook ID'),
    
    body('url')
      .optional()
      .trim()
      .isURL({ require_protocol: true, require_tld: true })
      .withMessage('Invalid webhook URL'),
    
    body('events')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Events must be a non-empty array'),
    
    body('active')
      .optional()
      .isBoolean()
      .withMessage('Active must be a boolean')
      .toBoolean()
  ]
};

// Search/Query validation
const queryValidation = {
  paginated: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be >= 1')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100')
      .toInt(),
    
    query('sort')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort must be asc or desc')
  ]
};

module.exports = {
  authValidation,
  gameValidation,
  webhookValidation,
  queryValidation,
  handleValidationErrors
};
