const { Router } = require('express');
const payoutController = require('../controllers/payoutController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);

// View - accessible by admin portal roles and finance manager
router.get('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_MANAGER, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  payoutController.list
);
router.get('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_MANAGER, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  payoutController.getById
);

// Create, process, update - super_admin, admin, and finance_manager
router.post('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_MANAGER),
  payoutController.create
);
router.post('/:id/process', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_MANAGER),
  payoutController.process
);
router.put('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_MANAGER),
  payoutController.update
);

module.exports = router;

