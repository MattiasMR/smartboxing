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
  
  // Check if route requires tenant and user doesn't have one
  // Exception: allow access to /account/* routes without tenant
  const isAccountRoute = location.pathname.startsWith('/account');
  
  if (requireTenant && !user?.tenantId && !isAccountRoute) {
    console.log('[ProtectedRoute] No tenant, redirecting to /account/tenancies');
    return <Navigate to="/account/tenancies" replace />;
  }
  
  console.log('[ProtectedRoute] Authenticated, rendering children');
  return children;
}
