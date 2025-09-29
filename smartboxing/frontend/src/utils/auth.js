// src/utils/auth.js

import { COGNITO_URLS } from '../config';

// JWT Token utilities
export const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = parseJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

// Extract tokens from URL hash (implicit flow)
export const getTokenFromHash = () => {
  const hash = window.location.hash;
  if (!hash) return null;
  
  const params = new URLSearchParams(hash.substring(1));
  const idToken = params.get('id_token');
  const accessToken = params.get('access_token');
  
  // Return the tokens object with both tokens
  if (idToken) {
    return {
      id_token: idToken,
      access_token: accessToken,
      token_type: params.get('token_type') || 'Bearer',
    };
  }
  
  return null;
};

export const clearTokenFromHash = () => {
  if (window.location.hash) {
    window.history.replaceState(null, null, window.location.pathname);
  }
};

// Auth state management
export const getStoredToken = () => {
  return localStorage.getItem('cognito_id_token');
};

export const storeToken = (token) => {
  localStorage.setItem('cognito_id_token', token);
};

export const removeToken = () => {
  localStorage.removeItem('cognito_id_token');
};

export const isAuthenticated = () => {
  const token = getStoredToken();
  return token && !isTokenExpired(token);
};

// Cognito Auth Actions
export const redirectToLogin = () => {
  window.location.href = COGNITO_URLS.LOGIN;
};

export const redirectToLogout = () => {
  removeToken();
  window.location.href = COGNITO_URLS.LOGOUT;
};

// User info from token
export const getUserFromToken = (token) => {
  if (!token) return null;
  
  const decoded = parseJWT(token);
  if (!decoded) return null;
  
  return {
    sub: decoded.sub,
    email: decoded.email,
    username: decoded['cognito:username'],
    tenantId: decoded['custom:tenantId'] || 'demo',
  };
};