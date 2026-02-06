const { body, param } = require('express-validator');

/**
 * Validation rules for voucher conversion endpoint
 */
const convertVoucherValidator = [
  param('id')
    .notEmpty()
    .withMessage('Voucher ID is required')
    .isUUID()
    .withMessage('Voucher ID must be a valid UUID'),
  body('target_type')
    .notEmpty()
    .withMessage('target_type is required')
    .isString()
    .withMessage('target_type must be a string')
    .isIn(['sales_invoice', 'tax_invoice'])
    .withMessage('target_type must be either sales_invoice or tax_invoice'),
];

/**
 * Validation rules for voucher creation
 */
const createVoucherValidator = [
  body('voucher_type')
    .notEmpty()
    .withMessage('voucher_type is required')
    .isString()
    .withMessage('voucher_type must be a string'),
  body('voucher_date')
    .optional()
    .isISO8601()
    .withMessage('voucher_date must be a valid date'),
  body('party_ledger_id')
    .optional()
    .isUUID()
    .withMessage('party_ledger_id must be a valid UUID'),
  body('items')
    .optional()
    .isArray()
    .withMessage('items must be an array'),
  body('items.*.quantity')
    .optional()
    .isNumeric()
    .withMessage('Item quantity must be a number'),
  body('items.*.rate')
    .optional()
    .isNumeric()
    .withMessage('Item rate must be a number'),
];

/**
 * Validation rules for voucher update
 */
const updateVoucherValidator = [
  param('id')
    .notEmpty()
    .withMessage('Voucher ID is required')
    .isUUID()
    .withMessage('Voucher ID must be a valid UUID'),
];

module.exports = {
  convertVoucherValidator,
  createVoucherValidator,
  updateVoucherValidator,
};
