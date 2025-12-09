import { api } from './client.js';

// ========== CLIENT SETTINGS ==========

export const getClientSettings = async () => {
  try {
    const response = await api.get('/settings/client');
    return response.data;
  } catch (error) {
    console.error('Error fetching client settings:', error);
    // Retornar valores por defecto si no existe configuración
    return {
      theme: {
        primaryColor: '#00796b',
        secondaryColor: '#0277bd',
        accentColor: '#f59e0b',
        darkMode: false,
      },
      vocabulary: {},
      texts: {
        appName: 'SmartBoxing',
        welcomeMessage: 'Bienvenido al sistema de gestión de boxes y staff',
      },
    };
  }
};

export const updateClientSettings = async (settings) => {
  try {
    const response = await api.put('/settings/client', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating client settings:', error);
    throw error;
  }
};

export const uploadLogo = async (file) => {
  try {
    // 1. Obtener presigned URL del backend
    const { data } = await api.post('/settings/upload-logo', {
      fileName: file.name,
      fileType: file.type,
    });

    // 2. Subir archivo directamente a S3
    await fetch(data.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    // 3. Retornar URL pública normalizada
    return sanitizeLogoUrl(data.publicUrl);
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
};

// ========== USER SETTINGS ==========

export const getUserSettings = async () => {
  try {
    const response = await api.get('/settings/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // Retornar valores por defecto
    return {
      preferences: {
        theme: 'auto',
        language: 'es',
        notifications: true,
        emailNotifications: true,
      },
    };
  }
};

export const updateUserSettings = async (preferences) => {
  try {
    const response = await api.put('/settings/user', { preferences });
    return response.data;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

// ========== HELPER FUNCTIONS ==========

export const applyTheme = (theme, options = {}) => {
  if (!theme) return;
  
  const root = document.documentElement;
  const { preserveMode = false, tenantId: explicitTenantId } = options;

  // Resolver tenant activo para scoping de logo
  const activeTenantId = explicitTenantId
    || localStorage.getItem('active_tenant_id')
    || null;
  const logoStorageKey = activeTenantId ? `app-logo-${activeTenantId}` : 'app-logo';
  
  // Aplicar logo si existe (scoped por tenant) o limpiar si no hay logo
  if (theme.logoUrl) {
    const safeLogoUrl = sanitizeLogoUrl(theme.logoUrl);
    try {
      localStorage.setItem(logoStorageKey, safeLogoUrl);
      // limpiar clave genérica para evitar leaks entre tenants
      if (logoStorageKey !== 'app-logo') {
        localStorage.removeItem('app-logo');
      }
    } catch (e) {
      console.warn('No se pudo guardar el logo en localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('logoChanged', { detail: { url: safeLogoUrl, tenantKey: logoStorageKey } }));
  } else {
    try {
      localStorage.removeItem(logoStorageKey);
    } catch (e) {
      console.warn('No se pudo eliminar el logo en localStorage:', e);
    }
    window.dispatchEvent(new CustomEvent('logoChanged', { detail: { url: '', tenantKey: logoStorageKey } }));
  }
  
  // Aplicar colores principales
  if (theme.primaryColor) {
    root.style.setProperty('--primary-color', theme.primaryColor);
    // Calcular versión RGB para usar en rgba()
    const rgb = hexToRgb(theme.primaryColor);
    if (rgb) {
      root.style.setProperty('--primary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      // Calcular color hover (más oscuro)
      const hoverRgb = {
        r: Math.max(0, rgb.r - 20),
        g: Math.max(0, rgb.g - 20),
        b: Math.max(0, rgb.b - 20)
      };
      const hoverHex = rgbToHex(hoverRgb.r, hoverRgb.g, hoverRgb.b);
      root.style.setProperty('--hover-primary', hoverHex);
      
      // Calcular hover-bg con opacidad baja del color primario
      const isDark = root.getAttribute('data-theme') === 'dark';
      root.style.setProperty('--hover-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.15 : 0.08})`);
    }
  }
  
  if (theme.secondaryColor) {
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    const rgb = hexToRgb(theme.secondaryColor);
    if (rgb) {
      const hoverRgb = {
        r: Math.max(0, rgb.r - 20),
        g: Math.max(0, rgb.g - 20),
        b: Math.max(0, rgb.b - 20)
      };
      const hoverHex = rgbToHex(hoverRgb.r, hoverRgb.g, hoverRgb.b);
      root.style.setProperty('--hover-secondary', hoverHex);
    }
  }
  
  if (theme.accentColor) {
    root.style.setProperty('--accent-color', theme.accentColor);
  }
  
  // Aplicar modo oscuro
  const storedMode = localStorage.getItem('app-theme');
  let currentMode = root.getAttribute('data-theme') || storedMode || 'light';

  if (!preserveMode && typeof theme.darkMode === 'boolean') {
    currentMode = theme.darkMode ? 'dark' : 'light';
    root.setAttribute('data-theme', currentMode);
    localStorage.setItem('app-theme', currentMode);
  } else if (preserveMode) {
    currentMode = storedMode || currentMode;
    root.setAttribute('data-theme', currentMode);
  } else if (!storedMode && !root.getAttribute('data-theme')) {
    root.setAttribute('data-theme', currentMode);
  }

  // Recalcular hover-bg con la opacidad correcta para el tema usando el modo actual
  if (theme.primaryColor) {
    const rgb = hexToRgb(theme.primaryColor);
    if (rgb) {
      const isDark = currentMode === 'dark';
      root.style.setProperty('--hover-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.15 : 0.08})`);
    }
  }
};

// ========== VOCABULARIO ==========

export const applyVocabulary = (vocab = {}, options = {}) => {
  const activeTenantId = options.tenantId || localStorage.getItem('active_tenant_id') || null;
  const vocabStorageKey = activeTenantId ? `vocab-${activeTenantId}` : 'vocab-default';
  try {
    localStorage.setItem(vocabStorageKey, JSON.stringify(vocab));
    // limpiar vocab genérico si estamos usando clave específica
    if (vocabStorageKey !== 'vocab-default') {
      localStorage.removeItem('vocab-default');
    }
  } catch (e) {
    console.warn('No se pudo guardar el vocabulario en localStorage:', e);
  }
  window.dispatchEvent(new CustomEvent('vocabularyChanged', { detail: { vocab, vocabKey: vocabStorageKey } }));
};

/**
 * Convertir color hexadecimal a RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convertir RGB a hexadecimal
 */
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function sanitizeLogoUrl(url) {
  if (!url) return url;
  try {
    // Encode characters like # that break URLs when stored raw
    const [base, query] = url.split('?');
    const encodedBase = base
      .split('/')
      .map((segment, index) => {
        if (index < 3) return segment; // keep protocol + '' + domain as-is
        return encodeURIComponent(decodeURIComponent(segment));
      })
      .join('/');
    return query ? `${encodedBase}?${query}` : encodedBase;
  } catch (error) {
    console.warn('Error sanitizing logo URL', error);
    return url.replace(/#/g, '%23');
  }
}

export const loadAndApplySettings = async () => {
  try {
    const clientSettings = await getClientSettings();
    const userSettings = await getUserSettings();
    
    // Aplicar tema del cliente
    if (clientSettings.theme) {
      applyTheme(clientSettings.theme);
    }
    
    // Guardar appName en localStorage y disparar evento
    if (clientSettings.texts?.appName) {
      localStorage.setItem('app-name', clientSettings.texts.appName);
      window.dispatchEvent(new CustomEvent('appNameChanged', { detail: clientSettings.texts.appName }));
    }
    
    // Guardar institutionName
    if (clientSettings.texts?.institutionName) {
      localStorage.setItem('institution-name', clientSettings.texts.institutionName);
      window.dispatchEvent(new CustomEvent('institutionNameChanged', { detail: clientSettings.texts.institutionName }));
    }
    
    // Aplicar preferencia de tema del usuario (override)
    if (userSettings.preferences?.theme) {
      const theme = userSettings.preferences.theme;
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('app-theme', 'dark');
      } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('app-theme', 'light');
      } else if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const autoTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', autoTheme);
        localStorage.setItem('app-theme', autoTheme);
      }
    }
    
    return { clientSettings, userSettings };
  } catch (error) {
    console.error('Error loading settings:', error);
    // Cargar tema guardado localmente como fallback
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    return null;
  }
};
