const { Router } = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

router.get('/trial-balance', reportController.getTrialBalance);
router.get('/balance-sheet', reportController.getBalanceSheet);
router.get('/profit-loss', reportController.getProfitLoss);
router.get('/ledger-statement', reportController.getLedgerStatement);

module.exports = router;

