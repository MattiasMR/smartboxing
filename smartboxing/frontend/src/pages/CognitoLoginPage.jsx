// src/pages/CognitoLoginPage.jsx
import { useEffect, useState } from 'react';
import { useCognitoAuth } from '../context/CognitoAuthContext';
import { useNavigate } from 'react-router-dom';
import { loadImageFromStorage, getCustomLogo, IMAGE_STORAGE_KEYS } from '../utils/imageUtils';
import hospitalLogo from '../assets/smartboxingLogo.jpg';
import hospitalBg from '../assets/hospital-bg-optimized.jpg';
import { useProgressiveImage } from '../hooks/useProgressiveImage';
import './LoginPage.css'; // Reuse existing styles

function CognitoLoginPage() {
  const { login, isAuthenticated } = useCognitoAuth();
  const navigate = useNavigate();
  
  // Custom background and logo states
  const [customBackground, setCustomBackground] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(hospitalLogo);
  
  // Load custom assets
  useEffect(() => {
    const storedBackground = loadImageFromStorage(IMAGE_STORAGE_KEYS.LOGIN_BACKGROUND);
    const customLogo = getCustomLogo();
    
    if (storedBackground) setCustomBackground(storedBackground);
    if (customLogo) setCurrentLogo(customLogo);
    
    // Listen for changes
    const handleBackgroundChange = (e) => {
      if (e.key === IMAGE_STORAGE_KEYS.LOGIN_BACKGROUND) {
        setCustomBackground(e.newValue);
      }
    };
    
    const handleLogoChange = (e) => {
      setCurrentLogo(e.detail || hospitalLogo);
    };

    window.addEventListener('storage', handleBackgroundChange);
    window.addEventListener('logoChanged', handleLogoChange);
    
    return () => {
      window.removeEventListener('storage', handleBackgroundChange);
      window.removeEventListener('logoChanged', handleLogoChange);
    };
  }, []);
  
  // Progressive image loading for background
  const backgroundImageSrc = customBackground || hospitalBg;
  const { imgSrc: bgImgSrc, isLoading: bgIsLoading } = useProgressiveImage(backgroundImageSrc);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleCognitoLogin = () => {
    login(); // This will redirect to Cognito Hosted UI
  };

  // Dynamic background style
  const backgroundStyle = {
    backgroundImage: bgImgSrc 
      ? `url(${bgImgSrc})`
      : `linear-gradient(135deg, #00796b 0%, #004d40 100%)`,
    transition: 'background-image 0.5s ease-in-out'
  };

  return (
    <div className="login-page" style={backgroundStyle}>
      {/* Background with progressive loading */}
      {bgIsLoading && (
        <div className="background-loader">
          <div className="loader-spinner"></div>
        </div>
      )}
      
      {/* Login form */}
      <div className="login-container">
        <div className="login-form">
          <div className="logo-section">
            <img src={currentLogo} alt="Hospital Logo" className="hospital-logo" />
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