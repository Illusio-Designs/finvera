const { Router } = require('express');
const tdsController = require('../controllers/tdsController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

router.get('/', tdsController.list);
router.post('/calculate', tdsController.calculateTDS);
router.post('/return', tdsController.generateReturn);
router.get('/certificate/:id', tdsController.generateCertificate);

module.exports = router;

