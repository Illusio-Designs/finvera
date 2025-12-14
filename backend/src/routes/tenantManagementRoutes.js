const express = require('express');
const router = express.Router();
const tenantManagementController = require('../controllers/tenantManagementController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

/**
 * Tenant Management Routes
 * Admin-only routes for managing tenants
 */

// All routes require authentication and super admin role
router.use(authenticateToken);
router.use(requireRole(['super_admin']));

// Create new tenant
router.post('/', tenantManagementController.createTenant);

// Get all tenants
router.get('/', tenantManagementController.getAllTenants);

// Get single tenant
router.get('/:id', tenantManagementController.getTenant);

// Update tenant
router.put('/:id', tenantManagementController.updateTenant);

// Suspend tenant
router.post('/:id/suspend', tenantManagementController.suspendTenant);

// Reactivate tenant
router.post('/:id/reactivate', tenantManagementController.reactivateTenant);

// Get tenant statistics
router.get('/:id/stats', tenantManagementController.getTenantStats);

// Delete tenant (dangerous operation)
router.delete('/:id', tenantManagementController.deleteTenant);

module.exports = router;
