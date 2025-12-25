const { validationResult } = require('express-validator');

/**
 * Middleware to validate request using express-validator rules
 * @param {Array} validations - Array of express-validator validation rules
 * @returns {Function} Express middleware function
 */
const validator = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    next();
  };
};

module.exports = validator;
