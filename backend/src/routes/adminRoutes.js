const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const constants = require('../config/constants');

const router = Router();

// All admin routes require authentication and super_admin role
router.use(authenticate);
router.use(requireRole(constants.ROLES.SUPER_ADMIN));

// Dashboard
router.get('/dashboard', adminController.dashboard);

// Tenant management
router.get('/tenants', adminController.listTenants);
router.get('/tenants/:id', adminController.getTenant);
router.post('/tenants', adminController.createTenant);
router.put('/tenants/:id', adminController.updateTenant);
router.delete('/tenants/:id', adminController.deleteTenant);

module.exports = router;

