const { Router } = require('express');
const incomeTaxController = require('../controllers/incomeTaxController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

// Calculate income tax
router.post('/calculate', incomeTaxController.calculateTax);

// ITR operations
router.post('/itr/prepare', incomeTaxController.prepareITR);
router.post('/itr/file', incomeTaxController.fileITR);
router.get('/itr/:return_id/status', incomeTaxController.getITRStatus);

// Form 26AS
router.get('/form26as/:pan', incomeTaxController.getForm26AS);

// Form 16 parsing (OCR)
router.post('/form16/parse', incomeTaxController.parseForm16);

module.exports = router;
