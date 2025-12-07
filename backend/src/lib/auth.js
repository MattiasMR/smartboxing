/**
 * Multi-tenant Authorization Middleware
 * 
 * Roles:
 * - super_admin: Full access to all tenants and system settings
 * - tenant_admin: Full access to their own tenant
 * - staff: Limited access within their tenant
 */

import { logger } from './obs.js';

// Role hierarchy (higher = more permissions)
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  STAFF: 'staff',
};

const ROLE_HIERARCHY = {
  super_admin: 3,
  tenant_admin: 2,
  staff: 1,
};

/**
 * Extract user info from JWT claims in the event
 * API Gateway JWT authorizer puts claims in requestContext.authorizer.jwt.claims
 */
export const extractUser = (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  
  if (!claims) {
    logger.warn('No JWT claims found in event');
    return null;
  }
  
  return {
    sub: claims.sub,
    email: claims.email,
    name: claims.name || claims.email,
    role: claims['custom:role'] || ROLES.STAFF,
    tenantId: claims['custom:tenantId'] || null,
    tenantName: claims['custom:tenantName'] || null,
  };
};

/**
 * Check if user has required role (or higher)
 */
export const hasRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Middleware: Require specific role to access endpoint
 * Returns user if authorized, throws error if not
 * 
 * @param {Object} event - Lambda event
 * @param {string} requiredRole - Minimum role required
 * @param {Object} options - Additional options
 * @param {string} options.tenantId - Required tenant ID (for tenant-scoped operations)
 * @returns {Object} User object with role and tenant info
 */
export const requireRole = (event, requiredRole, options = {}) => {
  const user = extractUser(event);
  
  if (!user) {
    const error = new Error('Unauthorized: No valid authentication');
    error.statusCode = 401;
    throw error;
  }
  
  // Super admins bypass all checks
  if (user.role === ROLES.SUPER_ADMIN) {
    logger.info('Super admin access granted', { 
      email: user.email, 
      action: requiredRole,
      targetTenant: options.tenantId,
    });
    return user;
  }
  
  // Check role hierarchy
  if (!hasRole(user.role, requiredRole)) {
    logger.warn('Access denied: insufficient role', { 
      email: user.email, 
      userRole: user.role, 
      requiredRole,
    });
    const error = new Error(`Forbidden: Requires ${requiredRole} role or higher`);
    error.statusCode = 403;
    throw error;
  }
  
  // For tenant-scoped operations, verify tenant membership
  if (options.tenantId && user.tenantId !== options.tenantId) {
    logger.warn('Access denied: tenant mismatch', { 
      email: user.email, 
      userTenant: user.tenantId, 
      targetTenant: options.tenantId,
    });
    const error = new Error('Forbidden: Cannot access resources from another tenant');
    error.statusCode = 403;
    throw error;
  }
  
  logger.info('Access granted', { 
    email: user.email, 
    role: user.role, 
    tenantId: user.tenantId,
  });
  
  return user;
};

/**
 * Convenience: Require super_admin role
 */
export const requireSuperAdmin = (event) => {
  return requireRole(event, ROLES.SUPER_ADMIN);
};

/**
 * Convenience: Require tenant_admin role with tenant verification
 */
export const requireTenantAdmin = (event, tenantId = null) => {
  const user = requireRole(event, ROLES.TENANT_ADMIN);
  
  // If specific tenant is required, verify access
  if (tenantId && user.role !== ROLES.SUPER_ADMIN && user.tenantId !== tenantId) {
    const error = new Error('Forbidden: Cannot manage another tenant');
    error.statusCode = 403;
    throw error;
  }
  
  return user;
};

/**
 * Convenience: Require staff role (minimum authenticated user)
 */
export const requireStaff = (event) => {
  return requireRole(event, ROLES.STAFF);
};

/**
 * Get tenant ID for data operations
 * Super admins can optionally specify a tenant, others use their own
 */
export const getTenantIdForOperation = (event, requestedTenantId = null) => {
  const user = extractUser(event);
  
  if (!user) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
  
  // Super admin can operate on any tenant
  if (user.role === ROLES.SUPER_ADMIN) {
    return requestedTenantId || user.tenantId || 'default';
  }
  
  // Regular users can only operate on their own tenant
  if (!user.tenantId) {
    const error = new Error('User does not belong to any tenant');
    error.statusCode = 403;
    throw error;
  }
  
  // If requested tenant differs from user's tenant, deny
  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    const error = new Error('Forbidden: Cannot access another tenant\'s data');
    error.statusCode = 403;
    throw error;
  }
  
  return user.tenantId;
};
