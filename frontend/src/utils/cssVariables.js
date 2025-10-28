// src/utils/cssVariables.js
/**
 * Utilidades para leer variables CSS de forma dinámica desde JavaScript
 */

/**
 * Obtiene el valor de una variable CSS del elemento root
 * @param {string} variableName - Nombre de la variable CSS (sin los --)
 * @returns {string} - Valor de la variable CSS
 */
export const getCSSVariable = (variableName) => {
  // Asegurar que la variable empiece con --
  const varName = variableName.startsWith('--') ? variableName : `--${variableName}`;
  
  // Obtener el valor del elemento root
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  
  return value || null;
};

/**
 * Establece el valor de una variable CSS en el elemento root
 * @param {string} variableName - Nombre de la variable CSS (sin los --)
 * @param {string} value - Nuevo valor para la variable
 */
export const setCSSVariable = (variableName, value) => {
  const varName = variableName.startsWith('--') ? variableName : `--${variableName}`;
  document.documentElement.style.setProperty(varName, value);
};

/**
 * Obtiene los colores principales del tema actual
 * @returns {object} - Objeto con los colores principales
 */
export const getThemeColors = () => {
  return {
    primary: getCSSVariable('primary-color'),
    primaryDark: getCSSVariable('primary-dark'),
    primaryLight: getCSSVariable('primary-light'),
    secondary: getCSSVariable('secondary-color'),
    secondaryDark: getCSSVariable('secondary-dark'),
    secondaryLight: getCSSVariable('secondary-light'),
    
    // Colores de estado
    success: getCSSVariable('success-color'),
    warning: getCSSVariable('warning-color'),
    error: getCSSVariable('error-color'),
    info: getCSSVariable('info-color'),
    
    // Colores de fondo
    backgroundPrimary: getCSSVariable('background-primary'),
    backgroundSecondary: getCSSVariable('background-secondary'),
    backgroundGray: getCSSVariable('background-gray'),
    
    // Colores de texto
    textPrimary: getCSSVariable('text-primary'),
    textSecondary: getCSSVariable('text-secondary'),
    textMuted: getCSSVariable('text-muted'),
  };
};

/**
 * Hook personalizado para usar colores del tema en componentes React
 * @returns {object} - Objeto con los colores del tema
 */
export const useThemeColors = () => {
  // Esta función puede ser llamada cada vez que se necesiten los colores actuales
  return getThemeColors();
};

/**
 * Constantes de colores para casos específicos
 */
export const THEME_COLORS = {
  // Colores de la agenda/calendario
  MEDICAL_HOURS: () => getCSSVariable('primary-color') || '#00796b',
  NON_MEDICAL_HOURS: () => getCSSVariable('text-muted') || '#868e96',
  CONFLICT_HOURS: () => getCSSVariable('error-color') || '#d32f2f',
  
  // Colores de estado
  ACTIVE: () => getCSSVariable('success-color') || '#4caf50',
  INACTIVE: () => getCSSVariable('text-muted') || '#999999',
  PENDING: () => getCSSVariable('warning-color') || '#ff9800',
  ERROR: () => getCSSVariable('error-color') || '#f44336',
};

/**
 * Función para obtener el color RGB de una variable CSS
 * Útil para usar con rgba() en JavaScript
 * @param {string} variableName - Nombre de la variable CSS
 * @returns {string} - Valores RGB separados por comas (ej: "0, 121, 107")
 */
export const getCSSVariableRGB = (variableName) => {
  const varName = variableName.startsWith('--') ? variableName : `--${variableName}`;
  const rgbVarName = varName + '-rgb';
  
  const rgbValue = getComputedStyle(document.documentElement)
    .getPropertyValue(rgbVarName)
    .trim();
  
  if (rgbValue) {
    return rgbValue;
  }
  
  // Si no existe la variable RGB, convertir hex a RGB
  const hexValue = getCSSVariable(variableName);
  if (hexValue && hexValue.startsWith('#')) {
    return hexToRgb(hexValue);
  }
  
  return null;
};

/**
 * Convierte un color hex a valores RGB separados por comas
 * @param {string} hex - Color en formato hex (#rrggbb)
 * @returns {string} - Valores RGB separados por comas
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null;
};
