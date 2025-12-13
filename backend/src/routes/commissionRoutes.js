const { Router } = require('express');
const commissionController = require('../controllers/commissionController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);

// View - accessible by admin portal roles
router.get('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  commissionController.list
);
router.get('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  commissionController.getById
);

// Calculate, approve, cancel - only super_admin and admin
router.post('/calculate', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  commissionController.calculate
);
router.put('/:id/approve', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  commissionController.approve
);
router.put('/:id/cancel', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  commissionController.cancel
);

module.exports = router;

