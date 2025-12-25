const { Router } = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

router.get('/trial-balance', reportController.getTrialBalance);
router.get('/balance-sheet', reportController.getBalanceSheet);
router.get('/profit-loss', reportController.getProfitLoss);
router.get('/ledger-statement', reportController.getLedgerStatement);
router.get('/stock-summary', reportController.getStockSummary);
router.get('/stock-ledger', reportController.getStockLedger);

module.exports = router;

