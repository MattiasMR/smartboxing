// src/pages/CallbackPage.jsx
import { useEffect } from 'react';
import { useCognitoAuth } from '../context/CognitoAuthContext';
import { useNavigate } from 'react-router-dom';

function CallbackPage() {
  const { isLoading, isAuthenticated } = useCognitoAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth context to process the tokens from URL hash
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('Authentication successful, redirecting to home');
        navigate('/', { replace: true });
      } else {
        console.log('Authentication failed, redirecting to login');
        navigate('/login', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="callback-page">
        <div className="callback-container">
          <div className="spinner"></div>
          <h2>Procesando autenticación...</h2>
          <p>Por favor espere mientras verificamos su identidad</p>
        </div>
        
        <style jsx>{`
          .callback-page {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .callback-container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          h2 {
            margin: 0 0 0.5rem;
            font-size: 1.5rem;
            font-weight: 600;
          }
          
          p {
            margin: 0;
            opacity: 0.8;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
    );
  }

  return null; // Should redirect before reaching here
}

export default CallbackPage;