const { Router } = require('express');
const referralController = require('../controllers/referralController');
const referralDiscountController = require('../controllers/referralDiscountController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

// Public route for verifying a referral code (e.g., during registration)
router.post('/verify', referralController.verifyCode);

// Authenticated routes
router.use(authenticate);

// Tenant/Distributor/Salesman can get their own referral code
router.get('/my-code', referralController.getMyCode);

// Admin routes for managing all referral codes and rewards
// View - accessible by admin portal roles
router.get('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  referralController.listCodes
);
router.get('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  referralController.getReferralCodeById
);
router.get('/rewards', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  referralController.listRewards
);
router.get('/rewards/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  referralController.getReferralRewardById
);
router.get('/analytics', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralController.getAnalytics
);

// Create, update, delete, approve - only super_admin and admin
router.post('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralController.createCode
);
router.put('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralController.updateReferralCode
);
router.delete('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralController.deleteReferralCode
);
router.post('/rewards/:id/approve', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  referralController.approveReward
);

// Referral Discount Configuration routes
router.get('/discount-config/current', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  referralDiscountController.getCurrentConfig
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

module.exports = router;

