import { createContext, useContext } from 'react';

// Authentication context
export const AuthCtx = createContext(null);

// Role constants (also exported from AuthProvider)
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  STAFF: 'staff',
};

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  super_admin: 3,
  tenant_admin: 2,
  staff: 1,
};

/**
 * Custom hook to access auth context with role helpers
 */
export function useAuthContext() {
  const context = useContext(AuthCtx);
  
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  
  const { user, switchTenantLocally, clearActiveTenant } = context;
  
  // Helper functions for role checks
  const hasRole = (requiredRole) => {
    if (!user?.role) return false;
    const userLevel = ROLE_HIERARCHY[user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
  };
  
  const isSuperAdmin = () => user?.role === ROLES.SUPER_ADMIN;
  const isTenantAdmin = () => hasRole(ROLES.TENANT_ADMIN);
  const isStaff = () => hasRole(ROLES.STAFF);
  
  return {
    ...context,
    // Role helpers
    hasRole,
    isSuperAdmin,
    isTenantAdmin,
    isStaff,
    // Tenant info
    tenantId: user?.tenantId,
    tenantName: user?.tenantName,
    role: user?.role,
    // Tenant switching
    switchTenantLocally,
    clearActiveTenant,
  };
}
