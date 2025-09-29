// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { loginUser } from '../api/services';
import { useNavigate } from 'react-router-dom';
import { SKIP_LOGIN_FOR_DEVELOPMENT } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    // Don't auto-login even in development mode - we want to test login
    return localStorage.getItem('authToken');
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    console.log('handleLogin called with:', credentials);
    setIsLoading(true);
    setError('');
    
    try {
      const response = await loginUser(credentials);
      console.log('Login successful:', response);
      const authToken = response.data.key; // dj-rest-auth returns the token in the 'key' field
      setToken(authToken);
      localStorage.setItem('authToken', authToken);
      navigate('/'); // Redirect to homepage on successful login
    } catch (error) {
      console.error('Login failed:', error);
      console.log('Setting error message...');
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          setError('Contraseña incorrecta');
        } else if (error.response.status === 401) {
          setError('Contraseña incorrecta');
        } else if (error.response.status >= 500) {
          setError('Error del servidor. Inténtelo de nuevo más tarde.');
        } else {
          setError('Contraseña incorrecta');
        }
      } else if (error.request) {
        // Network error
        setError('Error de conexión. Verifique su conexión a internet.');
      } else {
        setError('Error inesperado. Inténtelo de nuevo.');
      }
      
      console.log('Error message set');
      // Re-throw the error so the component knows it failed
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setError('');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    token,
    error,
    isLoading,
    onLogin: handleLogin,
    onLogout: handleLogout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};