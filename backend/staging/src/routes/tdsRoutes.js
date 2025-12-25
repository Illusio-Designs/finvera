const { Router } = require('express');
const tdsController = require('../controllers/tdsController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

router.get('/', tdsController.list);
router.post('/calculate', tdsController.calculateTDS);
router.post('/return', tdsController.generateReturn);
router.get('/return/:return_id/status', tdsController.getReturnStatus);
router.get('/certificate/:id', tdsController.generateCertificate);

module.exports = router;

