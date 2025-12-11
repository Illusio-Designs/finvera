const constants = require('../config/constants');

/**
 * Role-Based Access Control Middleware
 * @param {Array|String} allowedRoles - Role(s) allowed to access the route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Flatten array if nested
    const roles = allowedRoles.flat();

    // Super admin has access to everything
    if (req.role === constants.ROLES.SUPER_ADMIN) {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Check if user has any of the specified roles
 */
const hasAnyRole = (...roles) => {
  return requireRole(...roles);
};

/**
 * Check if user has all of the specified roles (for future use)
 */
const hasAllRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.role === constants.ROLES.SUPER_ADMIN) {
      return next();
    }

    const userRoles = [req.role]; // In future, can be array if user has multiple roles
    const hasAll = roles.every((role) => userRoles.includes(role));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  hasAnyRole,
  hasAllRoles,
};
