
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const { ROLES } = require('../config/constants');

// Apply authentication and tenant context
router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

router.post('/', requireRole(ROLES.TENANT_ADMIN, ROLES.USER), branchController.create);
router.get('/company/:company_id', requireRole(ROLES.TENANT_ADMIN, ROLES.USER, ROLES.ACCOUNTANT), branchController.list);
router.get('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.USER, ROLES.ACCOUNTANT), branchController.getById);
router.put('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.USER), branchController.update);
router.delete('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.USER), branchController.remove);

module.exports = router;
