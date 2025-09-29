// src/pages/CognitoLoginPage.jsx
import { useEffect } from 'react';
import { useCognitoAuth } from '../context/CognitoAuthContext';
import { useNavigate } from 'react-router-dom';
import hospitalLogo from '../assets/hospital-logo.png';
import hospitalBg from '../assets/hospital-bg-optimized.jpg';
import { useProgressiveImage } from '../hooks/useProgressiveImage';
import './LoginPage.css'; // Reuse existing styles

function CognitoLoginPage() {
  const { login, isAuthenticated } = useCognitoAuth();
  const navigate = useNavigate();
  
  // Progressive image loading for background
  const { imgSrc: bgImgSrc, isLoading: bgIsLoading } = useProgressiveImage(hospitalBg);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleCognitoLogin = () => {
    login(); // This will redirect to Cognito Hosted UI
  };

  return (
    <div className="login-page">
      {/* Background with progressive loading */}
      
      
      {/* Login form */}
      <div className="login-container">
        <div className="login-form">
          <div className="logo-section">
            <img src={hospitalLogo} alt="Hospital Logo" className="hospital-logo" />
            <h1>SmartBoxing Healthcare</h1>
            <p>Sistema de Gestión Médica</p>
          </div>
          
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleCognitoLogin(); }}>
            <div className="auth-method-info">
              <h2>Iniciar Sesión Segura</h2>
              <p>Utiliza tu cuenta corporativa para acceder al sistema</p>
            </div>
            
            <button 
              type="submit" 
              className="login-button cognito-login-button"
            >
              🔐 Iniciar Sesión con AWS Cognito
            </button>
            
            <div className="auth-info">
              <p>Sistema protegido con autenticación empresarial</p>
              <ul>
                <li>✓ Autenticación multifactor disponible</li>
                <li>✓ Sesiones seguras con JWT</li>
                <li>✓ Administración centralizada de usuarios</li>
              </ul>
            </div>
          </form>
          
          <div className="footer-info">
            <p>SmartBoxing v2.0 - Serverless Architecture</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CognitoLoginPage;