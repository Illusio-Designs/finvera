const { Router } = require('express');
const tdsController = require('../controllers/tdsController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

// TCS Report Generation
router.get('/report', tdsController.generateTCSReport);

module.exports = router;
