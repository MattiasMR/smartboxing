// src/components/common/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useCognitoAuth } from '../../context/CognitoAuthContext';
import { SKIP_LOGIN_FOR_DEVELOPMENT } from '../../config';

const ProtectedRoute = () => {
  const { isAuthenticated } = useCognitoAuth();

  console.log('🔒 ProtectedRoute DEBUG:');
  console.log('  - SKIP_LOGIN_FOR_DEVELOPMENT:', SKIP_LOGIN_FOR_DEVELOPMENT);
  console.log('  - isAuthenticated:', isAuthenticated);

  if (SKIP_LOGIN_FOR_DEVELOPMENT) {
    console.log('  ✅ Bypass login - rendering Outlet');
    return <Outlet />;
  }

  if (!isAuthenticated) {
    console.log('  ❌ Not authenticated - redirecting to /login');
    // If not authenticated, redirect to the /login page
    return <Navigate to="/login" />;
  }

  console.log('  ✅ Authenticated - rendering Outlet');
  // If there is a token, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;