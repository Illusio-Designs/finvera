const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');
const tenantController = require('../controllers/tenantController');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

router.get('/profile', tenantController.getProfile);
router.put('/profile', tenantController.updateProfile);

module.exports = router;


