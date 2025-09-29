// src/api/axiosConfig.js
import axios from 'axios';
import { SKIP_LOGIN_FOR_DEVELOPMENT, API_CONFIG } from '../config';
import { mockApi } from './mockApi';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// If in development mode, use the mock adapter
if (SKIP_LOGIN_FOR_DEVELOPMENT) {
  apiClient.defaults.adapter = mockApi;
} else {
  // For production, we'll add a response interceptor to handle errors
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      // If it's a network error and it's a login request, try mock as fallback
      if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || 
          error.message?.includes('Network Error')) {
        if (error.config?.url?.includes('/auth/login')) {
          console.log('Network error on login, trying mock API as fallback');
          try {
            return await mockApi(error.config);
          } catch (mockError) {
            return Promise.reject(mockError);
          }
        }
      }
      return Promise.reject(error);
    }
  );
}

// This is the interceptor. It runs before every request.
apiClient.interceptors.request.use(
  (config) => {
    // Try Cognito token first, then fall back to legacy auth token
    const cognitoToken = localStorage.getItem('cognito_id_token');
    const legacyToken = localStorage.getItem('authToken');
    
    const token = cognitoToken || legacyToken;
    
    if (token && !SKIP_LOGIN_FOR_DEVELOPMENT) {
      // If using Cognito token, use Bearer authorization
      if (cognitoToken) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Legacy token format
        config.headers['Authorization'] = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;