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
      texts: {
        appName: 'SmartBoxing',
        welcomeMessage: 'Bienvenido al sistema de gestión médica',
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

    // 3. Retornar URL pública
    return data.publicUrl;
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

export const applyTheme = (theme) => {
  if (!theme) return;
  
  const root = document.documentElement;
  
  // Aplicar logo si existe
  if (theme.logoUrl) {
    localStorage.setItem('app-logo', theme.logoUrl);
    window.dispatchEvent(new CustomEvent('logoChanged', { detail: theme.logoUrl }));
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
  if (theme.darkMode !== undefined) {
    root.setAttribute('data-theme', theme.darkMode ? 'dark' : 'light');
    // Guardar preferencia en localStorage
    localStorage.setItem('app-theme', theme.darkMode ? 'dark' : 'light');
    
    // Recalcular hover-bg con la opacidad correcta para el tema
    if (theme.primaryColor) {
      const rgb = hexToRgb(theme.primaryColor);
      if (rgb) {
        const isDark = theme.darkMode;
        root.style.setProperty('--hover-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.15 : 0.08})`);
      }
    }
  }
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
