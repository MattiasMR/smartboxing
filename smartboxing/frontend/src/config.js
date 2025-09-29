// src/config.js

// Set this to true to bypass the login page for development and testing
export const SKIP_LOGIN_FOR_DEVELOPMENT = false;

// Demo mode - reduces API calls and logs for cleaner demo experience
export const DEMO_MODE = false; // Set to false to enable all API calls

// API Configuration
export const API_CONFIG = {
  // New Serverless API
  BASE_URL: import.meta.env.VITE_API_BASE || 'https://s4w81ju5pc.execute-api.us-east-1.amazonaws.com',
  
  // Legacy Django API (fallback)
  LEGACY_BASE_URL: import.meta.env.VITE_API_URL || 
           // Check if we're in development environment
           (window.location.port === '5173' || 
            window.location.port === '5174' ||
            window.location.port === '5175' ||
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('10.') ||
            window.location.hostname.startsWith('172.')
           ) 
           ? `http://${window.location.hostname}:8000/api`
           // Check if we're on AWS EC2 instance
           : window.location.hostname.includes('compute-1.amazonaws.com') || 
             window.location.hostname === 'ec2-3-230-108-226.compute-1.amazonaws.com'
           ? 'http://3.230.108.226:8000/api'  // AWS backend URL
           : 'http://3.230.108.226:8000/api',  // Default fallback
  
  // Timeout for requests (in milliseconds)
  TIMEOUT: 30000,
};

// Cognito Configuration
export const COGNITO_CONFIG = {
  DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN || 'us-east-1o0vukzohc.auth.us-east-1.amazoncognito.com',
  CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || '14skfnveh2ik2bt31crj6udvv0',
  REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/callback`,
  LOGOUT_URI: import.meta.env.VITE_LOGOUT_URI || `${window.location.origin}/login`,
  RESPONSE_TYPE: 'token', // Using implicit flow - better for frontend demos
  SCOPE: 'openid email profile',
};

// Build Cognito URLs
export const COGNITO_URLS = {
  LOGIN: `https://${COGNITO_CONFIG.DOMAIN}/login?` +
    `client_id=${COGNITO_CONFIG.CLIENT_ID}&` +
    `response_type=${COGNITO_CONFIG.RESPONSE_TYPE}&` +
    `scope=${encodeURIComponent(COGNITO_CONFIG.SCOPE)}&` +
    `redirect_uri=${encodeURIComponent(COGNITO_CONFIG.REDIRECT_URI)}`,
  
  LOGOUT: `https://${COGNITO_CONFIG.DOMAIN}/logout?` +
    `client_id=${COGNITO_CONFIG.CLIENT_ID}&` +
    `logout_uri=${encodeURIComponent(COGNITO_CONFIG.LOGOUT_URI)}`,
};

// Debug log to see which API URL is being used
console.log('🔧 API Configuration:');
console.log('   Current hostname:', window.location.hostname);
console.log('   Current port:', window.location.port);
console.log('   API Base URL:', API_CONFIG.BASE_URL);
