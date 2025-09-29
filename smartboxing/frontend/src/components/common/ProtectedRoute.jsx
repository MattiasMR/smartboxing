// src/components/common/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useCognitoAuth } from '../../context/CognitoAuthContext';
import { SKIP_LOGIN_FOR_DEVELOPMENT } from '../../config';

const ProtectedRoute = () => {
  const { isAuthenticated } = useCognitoAuth();

  if (SKIP_LOGIN_FOR_DEVELOPMENT) {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    // If not authenticated, redirect to the /login page
    return <Navigate to="/login" />;
  }

  // If there is a token, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;