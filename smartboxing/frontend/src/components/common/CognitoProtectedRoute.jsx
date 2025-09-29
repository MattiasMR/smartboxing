// src/components/common/CognitoProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useCognitoAuth } from '../../context/CognitoAuthContext';

function CognitoProtectedRoute() {
  const { isAuthenticated, isLoading } = useCognitoAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
        
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #f8fafc;
            color: #64748b;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          p {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default CognitoProtectedRoute;