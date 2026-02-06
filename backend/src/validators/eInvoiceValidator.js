const { body, param } = require('express-validator');

/**
 * Validation rules for E-Invoice generation
 */
const generateEInvoiceValidator = [
  body('voucher_id')
    .notEmpty()
    .withMessage('voucher_id is required')
    .isUUID()
    .withMessage('voucher_id must be a valid UUID'),
];

/**
 * Validation rules for E-Invoice cancellation
 */
const cancelEInvoiceValidator = [
  param('voucher_id')
    .notEmpty()
    .withMessage('voucher_id is required')
    .isUUID()
    .withMessage('voucher_id must be a valid UUID'),
  body('reason')
    .notEmpty()
    .withMessage('reason is required')
    .isString()
    .withMessage('reason must be a string')
    .isLength({ min: 3, max: 500 })
    .withMessage('reason must be between 3 and 500 characters'),
];

/**
 * Validation rules for E-Invoice retry
 */
const retryEInvoiceValidator = [
  param('id')
    .notEmpty()
    .withMessage('E-Invoice ID is required')
    .isUUID()
    .withMessage('E-Invoice ID must be a valid UUID'),
];

module.exports = {
  generateEInvoiceValidator,
  cancelEInvoiceValidator,
  retryEInvoiceValidator,
};
