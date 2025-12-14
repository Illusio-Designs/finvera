const { Router } = require('express');
const commissionPayoutController = require('../controllers/commissionPayoutController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);

// Get commission-payout summary - accessible by admin portal roles
router.get('/summary',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  commissionPayoutController.summary
);

// Update payout status - only super_admin and admin
router.put('/:role/:user_id/status',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  commissionPayoutController.updatePayoutStatus
);

module.exports = router;
