const { Router } = require('express');
const targetController = require('../controllers/targetController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const constants = require('../config/constants');

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all targets - accessible by admin portal roles
router.get('/', 
  requireRole(
    constants.ROLES.SUPER_ADMIN,
    constants.ROLES.ADMIN,
    constants.ROLES.DISTRIBUTOR,
    constants.ROLES.SALESMAN
  ),
  targetController.list
);

// Get specific target
router.get('/:id', 
  requireRole(
    constants.ROLES.SUPER_ADMIN,
    constants.ROLES.ADMIN,
    constants.ROLES.DISTRIBUTOR,
    constants.ROLES.SALESMAN
  ),
  targetController.get
);

// Create target - only admin roles
router.post('/', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  targetController.create
);

// Update target - only admin roles
router.put('/:id', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  targetController.update
);

// Delete target - only admin roles
router.delete('/:id', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  targetController.delete
);

// Get targets for specific distributor
router.get('/distributor/:id', 
  requireRole(
    constants.ROLES.SUPER_ADMIN,
    constants.ROLES.ADMIN,
    constants.ROLES.DISTRIBUTOR
  ),
  targetController.getDistributorTargets
);

// Get targets for specific salesman
router.get('/salesman/:id', 
  requireRole(
    constants.ROLES.SUPER_ADMIN,
    constants.ROLES.ADMIN,
    constants.ROLES.DISTRIBUTOR,
    constants.ROLES.SALESMAN
  ),
  targetController.getSalesmanTargets
);

module.exports = router;
