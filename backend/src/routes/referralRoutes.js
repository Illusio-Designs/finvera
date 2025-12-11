const { Router } = require('express');
const referralController = require('../controllers/referralController');
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
router.use(requireRole(ROLES.SUPER_ADMIN));
router.get('/', referralController.listCodes);
router.post('/', referralController.createCode);
router.get('/:id', referralController.getReferralCodeById);
router.put('/:id', referralController.updateReferralCode);
router.delete('/:id', referralController.deleteReferralCode);
router.get('/rewards', referralController.listRewards);
router.get('/rewards/:id', referralController.getReferralRewardById);
router.post('/rewards/:id/approve', referralController.approveReward);
router.get('/analytics', referralController.getAnalytics);

module.exports = router;

