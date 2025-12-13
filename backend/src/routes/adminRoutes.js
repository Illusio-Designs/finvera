const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const constants = require('../config/constants');

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Dashboard - accessible by all admin portal roles
router.get('/dashboard', 
  requireRole(
    constants.ROLES.SUPER_ADMIN,
    constants.ROLES.ADMIN,
    constants.ROLES.DISTRIBUTOR,
    constants.ROLES.SALESMAN
  ),
  adminController.dashboard
);

// Tenant management - only super_admin and admin
router.get('/tenants', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.listTenants
);
router.get('/tenants/:id', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.getTenant
);
router.post('/tenants', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.createTenant
);
router.put('/tenants/:id', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.updateTenant
);
router.delete('/tenants/:id', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.deleteTenant
);

module.exports = router;

