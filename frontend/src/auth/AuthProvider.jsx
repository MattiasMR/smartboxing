import { useEffect, useState, useCallback } from 'react';
import { loadAndApplySettings } from '../api/settings.js';
import { AuthCtx } from './AuthContext.js';
import { forceRefreshSession } from './cognitoAuth.js';

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
// Also checks localStorage for tenant override (needed after switch before token refresh)
// Note: tenantId === 'system' means super_admin with no active tenant
function extractUserFromPayload(payload) {
  if (!payload) return null;
  
  // Check if there's a local tenant override (set after switching tenants)
  const localTenantId = localStorage.getItem('active_tenant_id');
  const localTenantName = localStorage.getItem('active_tenant_name');
  const localRole = localStorage.getItem('active_tenant_role');
  
  // Get tenant from token or local override
  let tenantId = localTenantId || payload['custom:tenantId'] || null;
  let tenantName = localTenantName || payload['custom:tenantName'] || null;
  
  // 'system' tenant means super_admin without active tenant selection
  if (tenantId === 'system') {
    tenantId = null;
    tenantName = null;
  }
  
  return {
    email: payload.email || 'Usuario',
    name: payload.name || payload.email || 'Usuario',
    sub: payload.sub,
    // Custom attributes from Cognito, with local override for tenant
    role: localRole || payload['custom:role'] || ROLES.STAFF,
    tenantId,
    tenantName,
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
    // Clear tenant override on logout
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('active_tenant_name');
    localStorage.removeItem('active_tenant_role');
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
   * Refresh user data by forcing a new session from Cognito
   * This is needed after switching tenants to get updated claims
   * Uses forceRefreshSession to get fresh tokens with updated custom attributes
   */
  const refreshUser = useCallback(async () => {
    console.log('[AuthProvider] refreshUser() called - forcing token refresh');
    setLoading(true);
    
    try {
      // Force refresh to get new tokens with updated custom attributes
      const session = await forceRefreshSession();
      
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

  /**
   * Switch tenant locally - updates state immediately without waiting for Cognito
   * This is called after the backend API confirms the switch
   * @param {Object} tenantInfo - { tenantId, tenantName, role }
   */
  const switchTenantLocally = useCallback((tenantInfo) => {
    const { tenantId, tenantName, role } = tenantInfo;
    
    console.log('[AuthProvider] switchTenantLocally:', tenantInfo);
    
    // Store in localStorage for persistence
    if (tenantId) {
      localStorage.setItem('active_tenant_id', tenantId);
      localStorage.setItem('active_tenant_name', tenantName || '');
      localStorage.setItem('active_tenant_role', role || 'tenant_admin');
    } else {
      localStorage.removeItem('active_tenant_id');
      localStorage.removeItem('active_tenant_name');
      localStorage.removeItem('active_tenant_role');
    }
    
    // Update auth state immediately
    setAuth(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        tenantId: tenantId || null,
        tenantName: tenantName || null,
        role: role || prev.user.role,
      } : null,
    }));
  }, []);

  /**
   * Clear tenant selection - used to go back to "My Tenancies" view
   */
  const clearActiveTenant = useCallback(() => {
    console.log('[AuthProvider] clearActiveTenant');
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('active_tenant_name');
    localStorage.removeItem('active_tenant_role');
    
    // Re-read user from token without local override
    const id_token = localStorage.getItem('id_token');
    if (id_token) {
      const payload = parseJwt(id_token);
      if (payload) {
        const user = {
          email: payload.email || 'Usuario',
          name: payload.name || payload.email || 'Usuario',
          sub: payload.sub,
          role: payload['custom:role'] || ROLES.STAFF,
          tenantId: null, // Force null
          tenantName: null,
        };
        setAuth(prev => ({ ...prev, user }));
      }
    }
  }, []);

  return (
    <AuthCtx.Provider value={{ 
      auth, 
      setAuth, 
      logout, 
      login, 
      refreshUser,
      switchTenantLocally,
      clearActiveTenant,
      loading,
      user: auth.user, 
      appName: auth.appName, 
      updateAppName 
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
