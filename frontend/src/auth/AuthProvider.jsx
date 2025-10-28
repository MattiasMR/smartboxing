import { createContext, useContext, useEffect, useState } from 'react';
import { loadAndApplySettings } from '../api/settings.js';

const AuthCtx = createContext(null);

// Función para decodificar JWT y obtener payload (sin verificar firma)
function parseJwt(token) {
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
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const access_token = localStorage.getItem('access_token');
    const id_token = localStorage.getItem('id_token');
    
    let user = null;
    if (id_token) {
      const payload = parseJwt(id_token);
      user = {
        email: payload?.email || 'Usuario',
        name: payload?.name || payload?.email || 'Usuario',
        sub: payload?.sub,
      };
    }
    
    return { 
      isAuth: !!access_token, 
      user,
      appName: 'SmartBoxing' // Default
    };
  });

  const updateAppName = (newName) => {
    setAuth(prev => ({ ...prev, appName: newName }));
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    setAuth({ isAuth: false, user: null });
  };

  const login = async (tokens) => {
    console.log('[AuthProvider] login() called with:', { 
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      expires_in: tokens.expires_in
    });
    
    const { access_token, id_token, expires_in } = tokens;
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('id_token', id_token || '');
    localStorage.setItem('expires_at', String(Date.now() + (expires_in * 1000)));
    
    console.log('[AuthProvider] Tokens saved to localStorage');
    
    let user = null;
    if (id_token) {
      const payload = parseJwt(id_token);
      user = {
        email: payload?.email || 'Usuario',
        name: payload?.name || payload?.email || 'Usuario',
        sub: payload?.sub,
      };
      console.log('[AuthProvider] User extracted:', user);
    }
    
    setAuth({ isAuth: true, user });
    console.log('[AuthProvider] Auth state updated to isAuth=true');
    
    // Cargar configuraciones después del login
    console.log('[AuthProvider] Loading user settings...');
    try {
      await loadAndApplySettings();
      console.log('[AuthProvider] Settings loaded and applied');
    } catch (error) {
      console.error('[AuthProvider] Error loading settings:', error);
    }
  };

  // Cargar configuraciones al inicializar si ya hay sesión
  useEffect(() => {
    if (auth.isAuth) {
      console.log('[AuthProvider] User already authenticated, loading settings...');
      loadAndApplySettings().catch(error => {
        console.error('[AuthProvider] Error loading initial settings:', error);
      });
    }
  }, []); // Solo al montar

  return (
    <AuthCtx.Provider value={{ auth, setAuth, logout, login, user: auth.user, appName: auth.appName, updateAppName }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() { 
  return useContext(AuthCtx); 
}
