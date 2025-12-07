/**
 * AdminRoute - Protected route component for admin pages
 * Only allows access to users with tenant_admin or super_admin roles
 */

import { Navigate } from 'react-router-dom';
import { useAuthContext, ROLES } from '../auth/AuthContext.js';

export default function AdminRoute({ children, requireSuperAdmin = false }) {
  const { auth, isSuperAdmin, isTenantAdmin, tenantId } = useAuthContext();
  
  // Not authenticated - redirect to login
  if (!auth.isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role requirements
  if (requireSuperAdmin && !isSuperAdmin()) {
    // Requires super_admin but user is not
    // Redirect to dashboard if they have tenant, otherwise to tenancies
    return <Navigate to={tenantId ? "/dashboard" : "/account/tenancies"} replace />;
  }
  
  if (!requireSuperAdmin && !isTenantAdmin()) {
    // Requires at least tenant_admin but user is staff
    return <Navigate to={tenantId ? "/dashboard" : "/account/tenancies"} replace />;
  }
  
  return children;
}
