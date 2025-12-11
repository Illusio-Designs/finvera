const { Router } = require('express');
const gstController = require('../controllers/gstController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);

// GSTIN Management
router.get('/gstins', gstController.listGSTINs);
router.post('/gstins', gstController.createGSTIN);
router.put('/gstins/:id', gstController.updateGSTIN);

// GST Rates
router.get('/rates', gstController.getGSTRates);
router.post('/rates', gstController.createGSTRate);

// GST Returns
router.get('/returns', gstController.listReturns);
router.post('/returns/gstr1', gstController.generateGSTR1);
router.post('/returns/gstr3b', gstController.generateGSTR3B);

module.exports = router;

