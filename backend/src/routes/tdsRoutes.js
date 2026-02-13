const { Router } = require('express');
const tdsController = require('../controllers/tdsController');
const tdsTcsController = require('../controllers/tdsTcsController');
const { authenticate } = require('../middleware/auth');
const { setTenantContext, requireTenant, resolveTenant } = require('../middleware/tenant');

const router = Router();

router.use(authenticate);
router.use(setTenantContext);
router.use(requireTenant);
router.use(resolveTenant);

// TDS/TCS Section Master Data
router.get('/sections/tds', tdsTcsController.getTDSSections);
router.get('/sections/tcs', tdsTcsController.getTCSSections);
router.get('/company/:companyId/config', tdsTcsController.getCompanyConfig);

// TDS Ledger Creation
router.post('/ledgers/tds', tdsTcsController.createTDSLedgers);
router.post('/ledgers/tcs', tdsTcsController.createTCSLedgers);

// Existing TDS routes
router.get('/', tdsController.list);
router.post('/calculate', tdsController.calculateTDS);
router.post('/return', tdsController.generateReturn);
router.get('/return/:return_id/status', tdsController.getReturnStatus);
router.get('/certificate/:id', tdsController.generateCertificate);

// Sandbox TDS Analytics APIs
router.post('/analytics/potential-notices', tdsController.createTDSPotentialNoticeJob);
router.get('/analytics/potential-notices/:job_id', tdsController.getTDSAnalyticsJobStatus);

// Sandbox TDS Calculator APIs
router.post('/calculator/non-salary', tdsController.calculateNonSalaryTDS);

// Sandbox TDS Compliance APIs
router.post('/compliance/206ab/check', tdsController.check206ABCompliance);
router.post('/compliance/csi/otp', tdsController.generateCSIOTP);
router.post('/compliance/csi/download', tdsController.downloadCSI);

// Sandbox TDS Reports APIs
router.post('/reports/tcs', tdsController.submitTCSReportJob);
router.get('/reports/tcs/:job_id', tdsController.getTCSReportJobStatus);
router.post('/reports/tcs/search', tdsController.searchTCSReportJobs);

module.exports = router;

