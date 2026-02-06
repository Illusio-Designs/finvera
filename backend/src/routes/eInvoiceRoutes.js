const { Router } = require('express');
const eInvoiceController = require('../controllers/eInvoiceController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');
const validator = require('../middleware/validator');
const { generateEInvoiceValidator, cancelEInvoiceValidator, retryEInvoiceValidator } = require('../validators/eInvoiceValidator');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

router.get('/', eInvoiceController.listEInvoices);
router.post('/generate', validator(generateEInvoiceValidator), eInvoiceController.generateIRN);
router.get('/voucher/:voucher_id', eInvoiceController.getEInvoice);
router.post('/cancel/:voucher_id', validator(cancelEInvoiceValidator), eInvoiceController.cancelIRN);
router.post('/:id/retry', validator(retryEInvoiceValidator), eInvoiceController.retryGeneration);

module.exports = router;

