const { Router } = require('express');
const accountGroupController = require('../controllers/accountGroupController');
const ledgerController = require('../controllers/ledgerController');
const voucherTypeController = require('../controllers/voucherTypeController');
const voucherController = require('../controllers/voucherController');
const transactionController = require('../controllers/transactionController');
const dashboardController = require('../controllers/dashboardController');
const inventoryController = require('../controllers/inventoryController');
const warehouseController = require('../controllers/warehouseController');
const stockAdjustmentController = require('../controllers/stockAdjustmentController');
const stockTransferController = require('../controllers/stockTransferController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Account Groups
router.get('/groups', accountGroupController.list);
router.get('/groups/tree', accountGroupController.getTree);
router.get('/groups/:id', accountGroupController.getById);
// Account groups are shared master data; creation/update disabled from tenant API

// Ledgers
router.get('/ledgers', ledgerController.list);
router.post('/ledgers', ledgerController.create);
router.get('/ledgers/:id', ledgerController.getById);
router.put('/ledgers/:id', ledgerController.update);
router.delete('/ledgers/:id', ledgerController.delete);
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

// Inventory Items
router.get('/inventory/items', inventoryController.list);
router.post('/inventory/items', inventoryController.create);
router.get('/inventory/items/:id', inventoryController.getById);
router.put('/inventory/items/:id', inventoryController.update);
router.delete('/inventory/items/:id', inventoryController.delete);
router.post('/inventory/items/:id/opening-stock', inventoryController.setOpeningStockByWarehouse);
router.get('/inventory/items/:id/warehouse-stock', inventoryController.getStockByWarehouse);

// Warehouses
router.get('/warehouses', warehouseController.list);
router.get('/warehouses/all', warehouseController.getAll);
router.post('/warehouses', warehouseController.create);
router.get('/warehouses/:id', warehouseController.getById);
router.put('/warehouses/:id', warehouseController.update);
router.delete('/warehouses/:id', warehouseController.delete);

// Stock Adjustments
router.get('/stock-adjustments', stockAdjustmentController.list);
router.post('/stock-adjustments', stockAdjustmentController.create);

// Stock Transfers
router.get('/stock-transfers', stockTransferController.list);
router.post('/stock-transfers', stockTransferController.create);

// Tally Import - use uploadTally for larger file size limit (50MB)
const tallyImportController = require('../controllers/tallyImportController');
const { uploadTally } = require('../config/multer');
router.get('/tally-import/template', tallyImportController.getImportTemplate);
router.post('/tally-import', uploadTally.single('file'), tallyImportController.importTallyData);

module.exports = router;

