import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  
  console.log('[ProtectedRoute] Checking auth:', { isAuth: auth.isAuth, hasUser: !!auth.user });
  
  if (!auth.isAuth) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('[ProtectedRoute] Authenticated, rendering children');
  return children;
}
