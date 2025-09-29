// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCognitoAuth } from '../context/CognitoAuthContext';
import hospitalLogo from '../assets/hospital-logo.png';
import hospitalBg from '../assets/hospital-bg-optimized.jpg';
import { useProgressiveImage } from '../hooks/useProgressiveImage';
import { getCSSVariable } from '../utils/cssVariables';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, isAuthenticated } = useCognitoAuth();
  
  // Debug log to see if error is being received
  console.log('LoginPage render - error:', error, 'isLoading:', isLoading);
  
  // Progressive image loading for background
  const { imgSrc: bgImgSrc, isLoading: bgIsLoading } = useProgressiveImage(hospitalBg);

  // Clear errors when user starts typing AFTER an error appears
  useEffect(() => {
    // Only clear error if there's an error and user is actively typing
    // We don't clear on initial render or when fields already have values
    return () => {
      // Cleanup function - no need to clear error here
    };
  }, []); // Empty dependency array

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (error) clearError(); // Clear error when user starts typing
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) clearError(); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, preventing default');
    
    try {
      await onLogin({ username, password });
      console.log('Login completed successfully');
    } catch (error) {
      console.log('Login failed in component:', error);
      // Error message is already handled by AuthContext, just don't redirect
    }
  };

  // Dynamic background style based on image loading state
  const backgroundStyle = {
    backgroundImage: bgImgSrc 
      ? `linear-gradient(rgba(var(--primary-color-rgb), 0.4), rgba(var(--primary-color-rgb), 0.4)), url(${bgImgSrc})`
      : `linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)`,
    transition: 'background-image 0.5s ease-in-out'
  };

  return (
    <div className="login-page" style={backgroundStyle}>
      {bgIsLoading && (
        <div className="background-loader">
          <div className="loader-spinner"></div>
        </div>
      )}
      
      <div className="login-container">
        <div className="login-header">
          <img 
            src={hospitalLogo} 
            alt="Hospital Padre Hurtado" 
            className="hospital-logo"
          />
          <p className="login-subtitle">FM IT Solutions</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Ingresa tu nombre de usuario"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Ingresa tu contraseña"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '' : 'Inicio de sesión'}
          </button>
        </form>

        <div className="forgot-password">
          <a href="#" onClick={(e) => e.preventDefault()}>
            ¿Olvidó su contraseña?
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;