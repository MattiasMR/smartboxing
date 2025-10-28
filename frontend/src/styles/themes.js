// Sistema modular de temas para SmartBoxing
// Aquí puedes agregar, modificar o eliminar temas fácilmente

export const themes = {
  custom: {
    name: '🎨 Tema Personalizado',
    colors: {
      primary: '#3B82F6',            // Azul por defecto
      primaryDark: '#2563eb',        
      primaryLight: '#60a5fa',       
      secondary: '#10B981',          
      success: '#4caf50',            
      warning: '#ff9800',            
      error: '#f44336',              
      info: '#2196f3',               
    },
    auto: {
      hover: true,                   
      textLight: '#ffffff',          
      textDark: '#333333',           
    },
    isCustom: true  // Marca que este tema es personalizable
  },

  default: {
    name: 'SmartBoxing Verde',
    colors: {
      primary: '#26a69a',           // Verde agua principal
      primaryDark: '#00897b',        // Verde agua oscuro
      primaryLight: '#4db6ac',       // Verde agua claro
      secondary: '#0288d1',          // Azul secundario
      success: '#4caf50',            // Verde éxito
      warning: '#ff9800',            // Naranja advertencia
      error: '#f44336',              // Rojo error
      info: '#2196f3',               // Azul información
    },
    // Estos se calculan automáticamente pero puedes sobrescribirlos
    auto: {
      hover: true,                   // Auto-calcular hover (primary - 20 RGB)
      textLight: '#ffffff',          // Texto en botones
      textDark: '#333333',           // Texto oscuro
    }
  },

  ocean: {
    name: 'Océano Profundo',
    colors: {
      primary: '#0077be',            // Azul océano
      primaryDark: '#005a92',        // Azul océano oscuro
      primaryLight: '#3399cc',       // Azul océano claro
      secondary: '#00bcd4',          // Cyan
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
    },
    auto: {
      hover: true,
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    }
  },

  sunset: {
    name: 'Atardecer',
    colors: {
      primary: '#ff6b6b',            // Coral/Rojo suave
      primaryDark: '#ee5a6f',        // Coral oscuro
      primaryLight: '#ff8787',       // Coral claro
      secondary: '#ffa07a',          // Salmón
      success: '#51cf66',
      warning: '#ffd93d',
      error: '#ff6b6b',
      info: '#74c0fc',
    },
    auto: {
      hover: true,
      textLight: '#ffffff',
      textDark: '#2d2d2d',
    }
  },

  forest: {
    name: 'Bosque',
    colors: {
      primary: '#2d6a4f',            // Verde bosque
      primaryDark: '#1b4332',        // Verde bosque oscuro
      primaryLight: '#40916c',       // Verde bosque claro
      secondary: '#52b788',          // Verde menta
      success: '#95d5b2',
      warning: '#f77f00',
      error: '#d62828',
      info: '#4cc9f0',
    },
    auto: {
      hover: true,
      textLight: '#ffffff',
      textDark: '#081c15',
    }
  },

  purple: {
    name: 'Púrpura Real',
    colors: {
      primary: '#7c3aed',            // Púrpura
      primaryDark: '#6d28d9',        // Púrpura oscuro
      primaryLight: '#a78bfa',       // Púrpura claro
      secondary: '#c026d3',          // Magenta
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    auto: {
      hover: true,
      textLight: '#ffffff',
      textDark: '#1e1b4b',
    }
  },

  monochrome: {
    name: 'Monocromático',
    colors: {
      primary: '#374151',            // Gris oscuro
      primaryDark: '#1f2937',        // Gris muy oscuro
      primaryLight: '#6b7280',       // Gris medio
      secondary: '#9ca3af',          // Gris claro
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    auto: {
      hover: true,
      textLight: '#ffffff',
      textDark: '#111827',
    }
  },

  // Agrega más temas aquí siguiendo la misma estructura
};

/**
 * Convierte HEX a RGB
 * @param {string} hex - Color en formato #RRGGBB
 * @returns {{r: number, g: number, b: number}}
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convierte RGB a HEX
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Color en formato #RRGGBB
 */
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calcula un color más oscuro para hover
 * @param {string} hex - Color base en formato #RRGGBB
 * @param {number} amount - Cantidad a oscurecer (default: 20)
 * @returns {string} Color oscurecido en formato #RRGGBB
 */
export function darkenColor(hex, amount = 20) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    Math.max(0, rgb.r - amount),
    Math.max(0, rgb.g - amount),
    Math.max(0, rgb.b - amount)
  );
}

/**
 * Calcula un color más claro
 * @param {string} hex - Color base en formato #RRGGBB
 * @param {number} amount - Cantidad a aclarar (default: 20)
 * @returns {string} Color aclarado en formato #RRGGBB
 */
export function lightenColor(hex, amount = 20) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    Math.min(255, rgb.r + amount),
    Math.min(255, rgb.g + amount),
    Math.min(255, rgb.b + amount)
  );
}

/**
 * Obtiene un tema por su ID
 * @param {string} themeId - ID del tema
 * @returns {object|null} Tema o null si no existe
 */
export function getTheme(themeId) {
  return themes[themeId] || null;
}

/**
 * Obtiene lista de todos los temas disponibles
 * @returns {Array<{id: string, name: string, isCustom: boolean}>}
 */
export function getAvailableThemes() {
  return Object.keys(themes).map(id => ({
    id,
    name: themes[id].name,
    isCustom: themes[id].isCustom || false
  }));
}

/**
 * Actualiza los colores del tema personalizado
 * @param {object} colors - Objeto con los colores a actualizar
 */
export function updateCustomTheme(colors) {
  if (themes.custom) {
    themes.custom.colors = {
      ...themes.custom.colors,
      ...colors
    };
    console.log('✨ Tema personalizado actualizado:', colors);
  }
}

/**
 * Obtiene los colores del tema personalizado
 * @returns {object} Colores del tema custom
 */
export function getCustomThemeColors() {
  return themes.custom ? { ...themes.custom.colors } : {};
}

/**
 * Aplica un tema al documento
 * @param {string} themeId - ID del tema a aplicar
 * @param {boolean} darkMode - Si está en modo oscuro
 */
export function applyThemeById(themeId, darkMode = false) {
  const theme = getTheme(themeId);
  if (!theme) {
    console.error(`Tema "${themeId}" no encontrado`);
    return;
  }

  const root = document.documentElement;
  const { colors, auto } = theme;

  // Aplicar colores principales
  root.style.setProperty('--primary-color', colors.primary);
  root.style.setProperty('--primary-dark', colors.primaryDark);
  root.style.setProperty('--primary-light', colors.primaryLight);
  root.style.setProperty('--secondary-color', colors.secondary);
  root.style.setProperty('--success-color', colors.success);
  root.style.setProperty('--warning-color', colors.warning);
  root.style.setProperty('--error-color', colors.error);
  root.style.setProperty('--info-color', colors.info);

  // Calcular colores hover y variaciones
  const hoverPrimary = darkenColor(colors.primary, 20);
  const hoverSecondary = darkenColor(colors.secondary, 20);
  const hoverSuccess = darkenColor(colors.success, 20);
  
  root.style.setProperty('--hover-primary', hoverPrimary);
  root.style.setProperty('--hover-secondary', hoverSecondary);
  root.style.setProperty('--hover-success', hoverSuccess);

  // Aplicar colores de texto
  root.style.setProperty('--text-light', auto.textLight);
  root.style.setProperty('--text-dark', auto.textDark);
  
  // Color de texto sobre el color primario (siempre blanco para mejor contraste)
  root.style.setProperty('--text-on-primary', '#ffffff');
  
  // Color de texto en hover (mantener blanco para contraste)
  root.style.setProperty('--text-on-hover', '#ffffff');

  // RGB para transparencias
  const rgb = hexToRgb(colors.primary);
  if (rgb) {
    root.style.setProperty('--primary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
  
  const rgbSecondary = hexToRgb(colors.secondary);
  if (rgbSecondary) {
    root.style.setProperty('--secondary-color-rgb', `${rgbSecondary.r}, ${rgbSecondary.g}, ${rgbSecondary.b}`);
  }

  // Modo oscuro
  if (darkMode) {
    root.style.setProperty('--background-primary', '#1a1a1a');
    root.style.setProperty('--background-secondary', '#2d2d2d');
    root.style.setProperty('--text-primary', '#e0e0e0');
    root.style.setProperty('--text-secondary', '#b0b0b0');
    root.style.setProperty('--border-primary', '#404040');
    root.style.setProperty('--border-secondary', '#333333');
    root.style.setProperty('--hover-bg', '#383838');
  } else {
    root.style.setProperty('--background-primary', '#ffffff');
    root.style.setProperty('--background-secondary', '#f8f9fa');
    root.style.setProperty('--text-primary', '#333333');
    root.style.setProperty('--text-secondary', '#6c757d');
    root.style.setProperty('--border-primary', '#e0e0e0');
    root.style.setProperty('--border-secondary', '#dee2e6');
    root.style.setProperty('--hover-bg', '#f0f0f0');
  }

  console.log(`✨ Tema "${theme.name}" aplicado correctamente`);
}

export default themes;
