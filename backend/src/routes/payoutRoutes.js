const { Router } = require('express');
const payoutController = require('../controllers/payoutController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);

// View - accessible by admin portal roles
router.get('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  payoutController.list
);
router.get('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  payoutController.getById
);

// Create, process, update - only super_admin and admin
router.post('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  payoutController.create
);
router.post('/:id/process', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  payoutController.process
);
router.put('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  payoutController.update
);

module.exports = router;

