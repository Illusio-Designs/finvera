const { Router } = require('express');
const accountGroupController = require('../controllers/accountGroupController');
const ledgerController = require('../controllers/ledgerController');
const voucherTypeController = require('../controllers/voucherTypeController');
const voucherController = require('../controllers/voucherController');
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

// Account Groups
router.get('/groups', accountGroupController.list);
router.get('/groups/tree', accountGroupController.getTree);
router.post('/groups', accountGroupController.create);
router.get('/groups/:id', accountGroupController.getById);
router.put('/groups/:id', accountGroupController.update);

// Ledgers
router.get('/ledgers', ledgerController.list);
router.post('/ledgers', ledgerController.create);
router.get('/ledgers/:id', ledgerController.getById);
router.put('/ledgers/:id', ledgerController.update);
router.get('/ledgers/:id/balance', ledgerController.getBalance);

// Voucher Types
router.get('/voucher-types', voucherTypeController.list);
router.post('/voucher-types', voucherTypeController.create);
router.get('/voucher-types/:id', voucherTypeController.getById);
router.put('/voucher-types/:id', voucherTypeController.update);

// Vouchers (Generic)
router.get('/vouchers', voucherController.list);
router.post('/vouchers', voucherController.create);
router.get('/vouchers/:id', voucherController.getById);
router.put('/vouchers/:id', voucherController.update);
router.post('/vouchers/:id/post', voucherController.post);
router.post('/vouchers/:id/cancel', voucherController.cancel);

// Transaction Types (Specific)
router.post('/invoices/sales', transactionController.createSalesInvoice);
router.post('/invoices/purchase', transactionController.createPurchaseInvoice);
router.post('/payments', transactionController.createPayment);
router.post('/receipts', transactionController.createReceipt);
router.post('/journals', transactionController.createJournal);
router.post('/contra', transactionController.createContra);

// Bill-wise Management
const billWiseController = require('../controllers/billWiseController');
router.get('/outstanding', billWiseController.getOutstanding);
router.post('/bills/allocate', billWiseController.allocatePayment);
router.get('/bills/aging', billWiseController.getAgingReport);

module.exports = router;

