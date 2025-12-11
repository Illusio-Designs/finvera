const { Router } = require('express');
const referralController = require('../controllers/referralController');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin, requireRole } = require('../middleware/role');

const router = Router();

// Public route
router.post('/verify', referralController.verifyCode);

// Authenticated routes
router.use(authenticate);

// User's own referral code
router.get('/my-code', referralController.getMyCode);

// Admin routes
const adminRouter = Router();
adminRouter.use(requireSuperAdmin);

adminRouter.get('/codes', referralController.listCodes);
adminRouter.post('/codes', referralController.createCode);
adminRouter.get('/rewards', referralController.listRewards);
adminRouter.post('/rewards/:id/approve', referralController.approveReward);
adminRouter.get('/analytics', referralController.getAnalytics);

router.use('/admin', adminRouter);

module.exports = router;

