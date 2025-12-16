/**
 * Role Configuration and Portal Mapping
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DISTRIBUTOR: 'distributor',
  SALESMAN: 'salesman',
  FINANCE_MANAGER: 'finance_manager',
  ACCOUNTANT: 'accountant',
  USER: 'user',
  TENANT_ADMIN: 'tenant_admin',
};

/**
 * Admin Portal Roles
 * These roles can access admin.finvera.com
 */
export const ADMIN_PORTAL_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.DISTRIBUTOR,
  ROLES.SALESMAN,
  ROLES.FINANCE_MANAGER,
];

/**
 * Client Portal Roles
 * These roles can access client.finvera.com
 */
export const CLIENT_PORTAL_ROLES = [
  ROLES.USER,
  ROLES.ACCOUNTANT,
  ROLES.TENANT_ADMIN,
];

/**
 * Check if a role can access admin portal
 */
export const canAccessAdminPortal = (role) => {
  return ADMIN_PORTAL_ROLES.includes(role);
};

/**
 * Check if a role can access client portal
 */
export const canAccessClientPortal = (role) => {
  return CLIENT_PORTAL_ROLES.includes(role);
};

/**
 * Get default redirect path for a role after login
 */
export const getDefaultRedirect = (role, userId) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.DISTRIBUTOR:
      return '/admin/distributors/dashboard';
    case ROLES.SALESMAN:
      return '/admin/salesmen/dashboard';
    case ROLES.ACCOUNTANT:
    case ROLES.USER:
    case ROLES.TENANT_ADMIN:
      return '/client/dashboard';
    default:
      return '/';
  }
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
  const names = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.DISTRIBUTOR]: 'Distributor',
    [ROLES.SALESMAN]: 'Salesman',
    [ROLES.FINANCE_MANAGER]: 'Finance Manager',
    [ROLES.ACCOUNTANT]: 'Accountant',
    [ROLES.USER]: 'User',
    [ROLES.TENANT_ADMIN]: 'Tenant Admin',
  };
  return names[role] || role;
};

/**
 * Get portal name for a role
 */
export const getPortalForRole = (role) => {
  if (canAccessAdminPortal(role)) {
    return 'admin';
  } else if (canAccessClientPortal(role)) {
    return 'client';
  }
  return null;
};
