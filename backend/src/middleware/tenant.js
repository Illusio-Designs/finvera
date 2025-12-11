/**
 * Set tenant context from JWT or request params
 * This should be used after authentication middleware
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

module.exports = {
  setTenantContext,
  requireTenant,
};
