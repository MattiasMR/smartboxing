import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/**
 * ProtectedRoute - Protects routes that require authentication
 * 
 * @param {Object} props
 * @param {boolean} props.requireTenant - If true, requires an active tenantId
 * @param {React.ReactNode} props.children
 */
export default function ProtectedRoute({ children, requireTenant = false }) {
  const { auth, user } = useAuth();
  const location = useLocation();
  
  console.log('[ProtectedRoute] Checking auth:', { 
    isAuth: auth.isAuth, 
    hasUser: !!user,
    hasTenant: !!user?.tenantId,
    requireTenant,
    path: location.pathname
  });
  
  // Not authenticated - redirect to login
  if (!auth.isAuth) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Force Super Admin out of /account/tenancies
  if (user?.role === 'super_admin' && location.pathname === '/account/tenancies') {
    console.log('[ProtectedRoute] Super Admin on /account/tenancies, redirecting to /admin/tenants');
    return <Navigate to="/admin/tenants" replace />;
  }
  
  // Check if route requires tenant and user doesn't have one
  // Exception: allow access to /account/* routes without tenant
  const isAccountRoute = location.pathname.startsWith('/account');
  
  if (requireTenant && !user?.tenantId && !isAccountRoute) {
    // Super Admin Exception: Allow access to admin routes even without tenant
    // This allows Super Admin to edit users via /admin/users/:id/edit
    if (user?.role === 'super_admin') {
      // If it's a purely tenant-specific route (like /dashboard, /boxes), maybe we should block?
      // But for now, let's allow access and let the page handle it or redirect if needed.
      // Specifically, /admin/users/* routes are shared.
      if (location.pathname.startsWith('/admin/')) {
         console.log('[ProtectedRoute] Super Admin accessing admin route without tenant - ALLOWING');
         return children;
      }

      console.log('[ProtectedRoute] No tenant (Super Admin), redirecting to /admin/tenants');
      return <Navigate to="/admin/tenants" replace />;
    }
    console.log('[ProtectedRoute] No tenant, redirecting to /account/tenancies');
    return <Navigate to="/account/tenancies" replace />;
  }
  
  console.log('[ProtectedRoute] Authenticated, rendering children');
  return children;
}
