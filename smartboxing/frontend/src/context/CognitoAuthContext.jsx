// src/context/CognitoAuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import {
  getTokenFromHash,
  clearTokenFromHash,
  getStoredToken,
  storeToken,
  removeToken,
  isTokenExpired,
  parseJWT,
  getUserFromToken,
  redirectToLogin,
  redirectToLogout,
} from '../utils/auth';

const CognitoAuthContext = createContext(null);

export const CognitoAuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we're returning from Cognito login (implicit flow)
        const tokenData = getTokenFromHash();
        
        if (tokenData && tokenData.id_token) {
          // Clear the hash and store the token
          clearTokenFromHash();
          storeToken(tokenData.id_token);
          setToken(tokenData.id_token);
          setIsLoading(false);
          return;
        }

        // Check for stored token
        const storedToken = getStoredToken();
        if (storedToken && !isTokenExpired(storedToken)) {
          setToken(storedToken);
        } else if (storedToken) {
          // Token exists but is expired
          removeToken();
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        removeToken();
        setToken(null);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Update user info when token changes
  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      const userData = getUserFromToken(token);
      setUser(userData);
    } else {
      setUser(null);
    }
  }, [token]);

  const login = () => {
    redirectToLogin();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    removeToken();
    redirectToLogout();
  };

  // Auto-refresh check
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired(token)) {
        console.log('Token expired, logging out');
        logout();
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const value = {
    token,
    user,
    isLoading,
    isAuthenticated: !!token && !isTokenExpired(token),
    login,
    logout,
  };

  return (
    <CognitoAuthContext.Provider value={value}>
      {children}
    </CognitoAuthContext.Provider>
  );
};

export const useCognitoAuth = () => {
  const context = useContext(CognitoAuthContext);
  if (!context) {
    console.error('useCognitoAuth must be used within a CognitoAuthProvider');
    throw new Error('useCognitoAuth must be used within a CognitoAuthProvider');
  }
  return context;
};