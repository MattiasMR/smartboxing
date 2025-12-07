import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
});

// Interceptor para agregar token a las peticiones
// IMPORTANTE: Usamos id_token porque contiene los custom claims (role, tenantId, etc.)
// El access_token de Cognito NO incluye custom claims
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('id_token');
  if (token) {
    // Verificar si el token ha expirado
    const expiresAt = localStorage.getItem('expires_at');
    if (expiresAt && Date.now() >= Number(expiresAt)) {
      // Token expirado, limpiarlo
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      window.location.href = '/login';
      return Promise.reject(new Error('Token expirado'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar respuestas de error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      
      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
