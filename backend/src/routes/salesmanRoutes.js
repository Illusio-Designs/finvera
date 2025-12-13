const { Router } = require('express');
const salesmanController = require('../controllers/salesmanController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);

// List and view - accessible by admin portal roles
router.get('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  salesmanController.list
);
router.get('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  salesmanController.getById
);
router.get('/:id/performance', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  salesmanController.getPerformance
);
router.get('/:id/leads', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  salesmanController.getLeads
);

// Create, update, delete - only super_admin and admin
router.post('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  salesmanController.create
);
router.put('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  salesmanController.update
);
router.delete('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  salesmanController.delete
);

module.exports = router;

