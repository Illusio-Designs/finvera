const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');
const companyController = require('../controllers/companyController');

const router = Router();

// Tenant-side routes: do NOT require tenant DB provisioned
router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

// Allow tenant roles to manage company
router.get('/', requireRole(ROLES.TENANT_ADMIN, ROLES.USER, ROLES.ACCOUNTANT), companyController.list);
router.get('/status', requireRole(ROLES.TENANT_ADMIN, ROLES.USER, ROLES.ACCOUNTANT), companyController.status);
router.post('/', requireRole(ROLES.TENANT_ADMIN, ROLES.USER), companyController.create);

module.exports = router;

