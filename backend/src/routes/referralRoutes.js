const { Router } = require('express');
const referralController = require('../controllers/referralController');
const referralDiscountController = require('../controllers/referralDiscountController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

// Public route for verifying a referral code (e.g., during registration)
router.post('/verify', referralController.verifyCode);

// Authenticated routes
router.use(authenticate);

// All authenticated users can get their own referral code
router.get('/my-code', referralController.getMyCode);

// All authenticated users can view current discount config
router.get('/discount-config/current', 
  referralDiscountController.getCurrentConfig
);

// Admin-only routes for managing referral system
router.get('/analytics', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralController.getAnalytics
);

router.get('/discount-config', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralDiscountController.listConfigs
);

router.post('/discount-config', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralDiscountController.createConfig
);

router.put('/discount-config/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralDiscountController.updateConfig
);

router.delete('/discount-config/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralDiscountController.deleteConfig
);

// Admin routes for viewing all referral codes (if needed)
router.get('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  referralController.listCodes
);

router.post('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralController.createCode
);

module.exports = router;

