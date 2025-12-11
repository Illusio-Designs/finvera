const { AuditLog } = require('../models');

const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = function (data) {
      // Log the action
      logAudit(req, action, entityType, data).catch((err) => {
        console.error('Audit log error:', err);
      });

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

async function logAudit(req, action, entityType, responseData) {
  try {
    const entityId = req.params.id || responseData?.id || null;
    const oldValues = req.body.old_values || null;
    const newValues = req.method === 'POST' || req.method === 'PUT' ? req.body : null;

    await AuditLog.create({
      tenant_id: req.tenant_id || null,
      user_id: req.user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      description: `${action} ${entityType}${entityId ? ` (ID: ${entityId})` : ''}`,
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

module.exports = { auditLog };

