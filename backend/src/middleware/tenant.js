const TenantMaster = require('../models/TenantMaster');
const tenantConnectionManager = require('../config/tenantConnectionManager');
const logger = require('../utils/logger');

/**
 * Resolve tenant from subdomain or tenant_id
 * Attaches tenant database connection to request
 */
const resolveTenant = async (req, res, next) => {
  try {
    let tenant = null;

    // Method 1: Get tenant from subdomain (for web requests)
    const host = req.get('host');
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        tenant = await TenantMaster.findOne({
          where: { subdomain, is_active: true },
        });
      }
    }

    // Method 2: Get tenant from JWT (set by auth middleware)
    if (!tenant && req.tenant_id) {
      tenant = await TenantMaster.findByPk(req.tenant_id);
    }

    // Method 3: Get tenant from query/body (for admin operations)
    if (!tenant) {
      const tenantId = req.query.tenant_id || req.body.tenant_id;
      if (tenantId) {
        tenant = await TenantMaster.findByPk(tenantId);
      }
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Check if tenant is suspended
    if (tenant.is_suspended) {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is suspended',
        reason: tenant.suspended_reason,
      });
    }

    // Check if database is provisioned
    // Provisioning is now triggered on COMPANY creation (tenant-side).
    if (!tenant.db_provisioned) {
      return res.status(409).json({
        success: false,
        message: 'No company database is provisioned yet. Please create your company first.',
      });
    }

    // Get database connection for this tenant
    const dbPassword = decryptPassword(tenant.db_password);
    const tenantConnection = await tenantConnectionManager.getConnection({
      id: tenant.id,
      db_name: tenant.db_name,
      db_host: tenant.db_host,
      db_port: tenant.db_port,
      db_user: process.env.USE_SEPARATE_DB_USERS === 'true' ? tenant.db_user : process.env.DB_USER,
      db_password: process.env.USE_SEPARATE_DB_USERS === 'true' ? dbPassword : process.env.DB_PASSWORD,
    });

    // Load tenant models (transactional data)
    const tenantModels = require('../services/tenantModels')(tenantConnection);

    // Load master models (shared accounting structure)
    const masterModels = require('../models/masterModels');

    // Attach to request
    req.tenant = tenant;
    req.tenant_id = tenant.id;
    req.tenantDb = tenantConnection;
    req.tenantModels = tenantModels; // Transactional data (ledgers, vouchers, etc.)
    req.masterModels = masterModels; // Shared structure (account groups, voucher types, etc.)

    next();
  } catch (error) {
    logger.error('Tenant resolution error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve tenant',
      error: error.message,
    });
  }
};

/**
 * Set tenant context from JWT or request params
 * Lightweight version - just sets tenant_id without database connection
 */
const setTenantContext = (req, res, next) => {
  // tenant_id should already be set by auth middleware from JWT
  // But we can also get it from query params or body for admin operations
  if (!req.tenant_id) {
    req.tenant_id = req.query.tenant_id || req.body.tenant_id;
  }
  next();
};

/**
 * Require tenant context - fails if tenant_id is not available
 */
const requireTenant = (req, res, next) => {
  if (!req.tenant_id) {
    return res.status(400).json({
      success: false,
      message: 'Tenant ID is required',
    });
  }
  next();
};

/**
 * Decrypt database password
 */
function decryptPassword(encryptedPassword) {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const parts = encryptedPassword.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  resolveTenant,
  setTenantContext,
  requireTenant,
};
