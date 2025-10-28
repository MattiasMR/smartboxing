import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
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
