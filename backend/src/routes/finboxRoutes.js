const { Router } = require('express');
const finboxController = require('../controllers/finboxController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

// Credit Score Routes
router.post('/credit-score', finboxController.getCreditScore);
router.get('/inclusion-score/:customer_id', finboxController.getInclusionScore);

// Loan Eligibility Routes
router.post('/eligibility', finboxController.checkLoanEligibility);

// User Management Routes
router.post('/user', finboxController.createUser);

// Bank Statement Routes
router.post('/bank-statement/initiate', finboxController.initiateBankStatement);
router.get('/bank-statement/:customer_id/status', finboxController.getBankStatementStatus);
router.get('/bank-statement/:customer_id/analysis', finboxController.getBankStatementAnalysis);

// Device Insights Routes
router.post('/device-insights', finboxController.getDeviceInsights);

// Session Token Routes
router.post('/session', finboxController.generateSessionToken);

// Consent Routes
router.post('/consent', finboxController.saveConsent);
router.get('/consent', finboxController.getConsent);

module.exports = router;
