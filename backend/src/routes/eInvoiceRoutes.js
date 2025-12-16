const { Router } = require('express');
const eInvoiceController = require('../controllers/eInvoiceController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

router.get('/', eInvoiceController.listEInvoices);
router.post('/generate', eInvoiceController.generateIRN);
router.get('/voucher/:voucher_id', eInvoiceController.getEInvoice);
router.post('/cancel/:voucher_id', eInvoiceController.cancelIRN);

module.exports = router;

