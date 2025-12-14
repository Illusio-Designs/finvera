const tenantProvisioningService = require('../services/tenantProvisioningService');
const TenantMaster = require('../models/TenantMaster');
const logger = require('../utils/logger');

/**
 * Create a new tenant with separate database
 */
exports.createTenant = async (req, res) => {
  try {
    const tenantData = req.body;

    // Validate required fields
    const requiredFields = ['company_name', 'subdomain', 'email'];
    for (const field of requiredFields) {
      if (!tenantData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Check if subdomain already exists
    const existingTenant = await TenantMaster.findOne({
      where: { subdomain: tenantData.subdomain.toLowerCase() },
    });

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists',
      });
    }

    // Create tenant
    const result = await tenantProvisioningService.createTenant(tenantData);

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant: {
          id: result.tenant.id,
          company_name: result.tenant.company_name,
          subdomain: result.tenant.subdomain,
          email: result.tenant.email,
          db_name: result.tenant.db_name,
          is_trial: result.tenant.is_trial,
          trial_ends_at: result.tenant.trial_ends_at,
        },
        // Only return credentials during creation
        credentials: process.env.NODE_ENV === 'development' ? result.credentials : undefined,
      },
    });
  } catch (error) {
    logger.error('Create tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: error.message,
    });
  }
};

/**
 * Get all tenants (admin only)
 */
exports.getAllTenants = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { company_name: { [Op.like]: `%${search}%` } },
        { subdomain: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status === 'active') where.is_active = true;
    if (status === 'inactive') where.is_active = false;
    if (status === 'suspended') where.is_suspended = true;

    const { rows: tenants, count } = await TenantMaster.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['db_password'] }, // Never expose passwords
    });

    res.json({
      success: true,
      data: {
        tenants,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants',
      error: error.message,
    });
  }
};

/**
 * Get single tenant details
 */
exports.getTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await TenantMaster.findByPk(id, {
      attributes: { exclude: ['db_password'] },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    res.json({
      success: true,
      data: { tenant },
    });
  } catch (error) {
    logger.error('Get tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant',
      error: error.message,
    });
  }
};

/**
 * Update tenant details
 */
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.db_name;
    delete updates.db_password;
    delete updates.db_user;
    delete updates.subdomain; // Subdomain cannot be changed

    const tenant = await TenantMaster.findByPk(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    await tenant.update(updates);

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: { tenant },
    });
  } catch (error) {
    logger.error('Update tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: error.message,
    });
  }
};

/**
 * Suspend a tenant
 */
exports.suspendTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await tenantProvisioningService.suspendTenant(id, reason);

    res.json({
      success: true,
      message: 'Tenant suspended successfully',
    });
  } catch (error) {
    logger.error('Suspend tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend tenant',
      error: error.message,
    });
  }
};

/**
 * Reactivate a suspended tenant
 */
exports.reactivateTenant = async (req, res) => {
  try {
    const { id } = req.params;

    await tenantProvisioningService.reactivateTenant(id);

    res.json({
      success: true,
      message: 'Tenant reactivated successfully',
    });
  } catch (error) {
    logger.error('Reactivate tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate tenant',
      error: error.message,
    });
  }
};

/**
 * Delete a tenant and their database
 */
exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirm } = req.body;

    if (confirm !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Please confirm deletion by sending { "confirm": "DELETE" }',
      });
    }

    await tenantProvisioningService.deleteTenant(id);

    res.json({
      success: true,
      message: 'Tenant and database deleted successfully',
    });
  } catch (error) {
    logger.error('Delete tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tenant',
      error: error.message,
    });
  }
};

/**
 * Get tenant database statistics
 */
exports.getTenantStats = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await TenantMaster.findByPk(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Get database size
    const tenantConnectionManager = require('../config/tenantConnectionManager');
    const dbPassword = require('../middleware/tenant').decryptPassword(tenant.db_password);
    
    const connection = await tenantConnectionManager.getConnection({
      id: tenant.id,
      db_name: tenant.db_name,
      db_host: tenant.db_host,
      db_port: tenant.db_port,
      db_user: process.env.USE_SEPARATE_DB_USERS === 'true' ? tenant.db_user : process.env.DB_USER,
      db_password: process.env.USE_SEPARATE_DB_USERS === 'true' ? dbPassword : process.env.DB_PASSWORD,
    });

    const [sizeResult] = await connection.query(`
      SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, {
      replacements: [tenant.db_name],
      type: connection.QueryTypes.SELECT,
    });

    // Update storage used
    const storageMb = sizeResult?.size_mb || 0;
    await tenant.update({ storage_used_mb: storageMb });

    res.json({
      success: true,
      data: {
        stats: {
          storage_used_mb: storageMb,
          storage_limit_mb: tenant.storage_limit_mb,
          storage_percentage: (storageMb / tenant.storage_limit_mb) * 100,
          db_provisioned: tenant.db_provisioned,
          is_active: tenant.is_active,
          is_suspended: tenant.is_suspended,
        },
      },
    });
  } catch (error) {
    logger.error('Get tenant stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant statistics',
      error: error.message,
    });
  }
};
