const { Router } = require('express');
const distributorController = require('../controllers/distributorController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = Router();

router.use(authenticate);

// List and view - accessible by admin portal roles
router.get('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  distributorController.list
);
router.get('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR, ROLES.SALESMAN),
  distributorController.getById
);
router.get('/:id/performance', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRIBUTOR),
  distributorController.getPerformance
);

// Create, update, delete - only super_admin and admin
router.post('/', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  distributorController.create
);
router.put('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  distributorController.update
);
router.delete('/:id', 
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  distributorController.delete
);

module.exports = router;

