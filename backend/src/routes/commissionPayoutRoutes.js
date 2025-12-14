const { Router } = require('express');
const commissionPayoutController = require('../controllers/commissionPayoutController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);

// Get commission-payout summary - accessible by admin portal roles and finance manager
router.get('/summary',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_MANAGER, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  commissionPayoutController.summary
);

// Update payout status - super_admin, admin, and finance_manager
router.put('/:role/:user_id/status',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_MANAGER),
  commissionPayoutController.updatePayoutStatus
);

module.exports = router;
