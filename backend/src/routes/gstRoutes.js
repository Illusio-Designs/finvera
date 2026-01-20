const { Router } = require('express');
const gstController = require('../controllers/gstController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

// GSTIN Management
router.get('/gstins', gstController.listGSTINs);
router.post('/gstins', gstController.createGSTIN);
router.put('/gstins/:id', gstController.updateGSTIN);

// GST Rates routes removed - now using Sandbox API for live rates
// router.get('/rates', gstController.getGSTRates); // Deprecated
// router.post('/rates', gstController.createGSTRate); // Deprecated

// GST Returns
router.get('/returns', gstController.listReturns);
router.post('/returns/gstr1', gstController.generateGSTR1);
router.post('/returns/gstr3b', gstController.generateGSTR3B);

// Third-party API endpoints
router.post('/validate', gstController.validateGSTIN);
router.get('/details/:gstin', gstController.getGSTINDetails);
router.get('/rate', gstController.getGSTRate);

// Sandbox GST Analytics APIs
router.post('/analytics/gstr2a-reconciliation', gstController.createGSTR2AReconciliation);
router.get('/analytics/gstr2a-reconciliation/:job_id', gstController.getGSTR2AReconciliationStatus);
router.post('/analytics/upload-purchase-ledger', gstController.uploadPurchaseLedger);

module.exports = router;

