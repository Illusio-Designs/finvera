const { body, param } = require('express-validator');

/**
 * Validation rules for E-Way Bill generation
 */
const generateEWayBillValidator = [
  body('voucher_id')
    .notEmpty()
    .withMessage('voucher_id is required')
    .isUUID()
    .withMessage('voucher_id must be a valid UUID'),
  body('transporter_id')
    .optional()
    .isString()
    .withMessage('transporter_id must be a string'),
  body('vehicle_no')
    .optional()
    .isString()
    .withMessage('vehicle_no must be a string')
    .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/)
    .withMessage('vehicle_no must be a valid Indian vehicle number (e.g., MH02CD5678)'),
  body('transport_mode')
    .optional()
    .isIn(['road', 'rail', 'air', 'ship'])
    .withMessage('transport_mode must be one of: road, rail, air, ship'),
  body('distance')
    .optional()
    .isNumeric()
    .withMessage('distance must be a number')
    .isInt({ min: 0 })
    .withMessage('distance must be a positive number'),
];

/**
 * Validation rules for E-Way Bill cancellation
 */
const cancelEWayBillValidator = [
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
 * Validation rules for E-Way Bill vehicle update
 */
const updateVehicleValidator = [
  param('id')
    .notEmpty()
    .withMessage('E-Way Bill ID is required')
    .isUUID()
    .withMessage('E-Way Bill ID must be a valid UUID'),
  body('vehicle_no')
    .notEmpty()
    .withMessage('vehicle_no is required')
    .isString()
    .withMessage('vehicle_no must be a string')
    .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/)
    .withMessage('vehicle_no must be a valid Indian vehicle number (e.g., MH02CD5678)'),
  body('reason_code')
    .notEmpty()
    .withMessage('reason_code is required')
    .isString()
    .withMessage('reason_code must be a string')
    .isIn(['BREAKDOWN', 'TRANSHIPMENT', 'OTHERS', 'FIRST_TIME'])
    .withMessage('reason_code must be one of: BREAKDOWN, TRANSHIPMENT, OTHERS, FIRST_TIME'),
  body('remarks')
    .optional()
    .isString()
    .withMessage('remarks must be a string')
    .isLength({ max: 500 })
    .withMessage('remarks must not exceed 500 characters'),
];

module.exports = {
  generateEWayBillValidator,
  cancelEWayBillValidator,
  updateVehicleValidator,
};
