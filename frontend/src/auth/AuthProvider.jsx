import { useEffect, useState, useCallback } from 'react';
import { loadAndApplySettings } from '../api/settings.js';
import { AuthCtx } from './AuthContext.js';
import { getSession } from './cognitoAuth.js';

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

import { ROLES } from './AuthContext.js';

// Extract user info from JWT payload including custom attributes
function extractUserFromPayload(payload) {
  if (!payload) return null;
  
  return {
    email: payload.email || 'Usuario',
    name: payload.name || payload.email || 'Usuario',
    sub: payload.sub,
    // Custom attributes from Cognito
    role: payload['custom:role'] || ROLES.STAFF,
    tenantId: payload['custom:tenantId'] || null,
    tenantName: payload['custom:tenantName'] || null,
  };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const access_token = localStorage.getItem('access_token');
    const id_token = localStorage.getItem('id_token');
    
    let user = null;
    if (id_token) {
      const payload = parseJwt(id_token);
      user = extractUserFromPayload(payload);
    }
    
    return { 
      isAuth: !!access_token, 
      user,
      appName: 'SmartBoxing' // Default
    };
  });
  
  const [loading, setLoading] = useState(false);

  const updateAppName = (newName) => {
    setAuth(prev => ({ ...prev, appName: newName }));
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    setAuth({ isAuth: false, user: null, appName: 'SmartBoxing' });
  };

  const login = async (tokens) => {
    console.log('[AuthProvider] login() called with:', { 
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      expires_in: tokens.expires_in
    });
    
    const { access_token, id_token, refresh_token, expires_in } = tokens;
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('id_token', id_token || '');
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token);
    }
    localStorage.setItem('expires_at', String(Date.now() + (expires_in * 1000)));
    
    console.log('[AuthProvider] Tokens saved to localStorage');
    
    let user = null;
    if (id_token) {
      const payload = parseJwt(id_token);
      user = extractUserFromPayload(payload);
      console.log('[AuthProvider] User extracted:', user);
    }
    
    setAuth({ isAuth: true, user, appName: auth.appName });
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

  /**
   * Refresh user data by getting a new session from Cognito
   * This is needed after switching tenants to get updated claims
   */
  const refreshUser = useCallback(async () => {
    console.log('[AuthProvider] refreshUser() called');
    setLoading(true);
    
    try {
      const session = await getSession();
      
      if (session && session.idToken) {
        localStorage.setItem('access_token', session.accessToken);
        localStorage.setItem('id_token', session.idToken);
        if (session.refreshToken) {
          localStorage.setItem('refresh_token', session.refreshToken);
        }
        
        const payload = parseJwt(session.idToken);
        const user = extractUserFromPayload(payload);
        
        console.log('[AuthProvider] User refreshed:', user);
        setAuth(prev => ({ ...prev, isAuth: true, user }));
        
        return user;
      }
    } catch (error) {
      console.error('[AuthProvider] Error refreshing user:', error);
      // If refresh fails, user might need to re-login
      if (error.message?.includes('not valid') || error.message?.includes('No current user')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
    
    return null;
  }, []);

  // Cargar configuraciones al inicializar si ya hay sesión
  useEffect(() => {
    if (auth.isAuth) {
      console.log('[AuthProvider] User already authenticated, loading settings...');
      loadAndApplySettings().catch(error => {
        console.error('[AuthProvider] Error loading initial settings:', error);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar, auth.isAuth se evalúa en el momento del mount

  return (
    <AuthCtx.Provider value={{ 
      auth, 
      setAuth, 
      logout, 
      login, 
      refreshUser,
      loading,
      user: auth.user, 
      appName: auth.appName, 
      updateAppName 
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
