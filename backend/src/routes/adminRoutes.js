const { Router } = require('express');
const adminController = require('../controllers/adminController');
const adminReportController = require('../controllers/adminReportController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const constants = require('../config/constants');

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Dashboard - accessible by all admin portal roles
router.get('/dashboard', 
  requireRole(
    constants.ROLES.SUPER_ADMIN,
    constants.ROLES.ADMIN,
    constants.ROLES.DISTRIBUTOR,
    constants.ROLES.SALESMAN
  ),
  adminController.dashboard
);

// Tenant management - only super_admin and admin
router.get('/tenants', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.listTenants
);
router.get('/tenants/:id', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.getTenant
);
router.post('/tenants', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.createTenant
);
router.put('/tenants/:id', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.updateTenant
);
router.delete('/tenants/:id', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminController.deleteTenant
);

// Reports - only super_admin and admin
router.get('/reports/revenue/total', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getTotalRevenueReport
);
router.get('/reports/revenue/comparison', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getRevenueComparisonReport
);
router.get('/reports/revenue/by-type', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getRevenueByTypeReport
);
router.get('/reports/revenue/trend', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getRevenueTrendReport
);
router.get('/reports/commission/summary', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getCommissionSummaryReport
);
router.get('/reports/commission/distribution', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getCommissionDistributionReport
);
router.get('/reports/performance/distributor', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getDistributorPerformanceReport
);
router.get('/reports/performance/salesman', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getSalesmanPerformanceReport
);
router.get('/reports/performance/targets', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getTargetAchievementReport
);
router.get('/reports/categorization/distributor', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getDistributorCategorizationReport
);
router.get('/reports/categorization/salesman', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getSalesmanCategorizationReport
);
router.get('/reports/tenant/acquisition', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getTenantAcquisitionReport
);
router.get('/reports/summary/executive', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getExecutiveSummaryReport
);
router.get('/reports/summary/financial', 
  requireRole(constants.ROLES.SUPER_ADMIN, constants.ROLES.ADMIN),
  adminReportController.getFinancialSummaryReport
);

module.exports = router;

