// src/utils/imageUtils.js
// Import default images
import hospitalLogo from '../assets/hospital-logo.png';

/**
 * Utilidades para manejo de imágenes en el sistema de personalización
 */

/**
 * Redimensiona una imagen manteniendo la proporción
 * @param {File} file - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @param {number} quality - Calidad de compresión (0-1)
 * @returns {Promise<Blob>} - Imagen redimensionada
 */
export const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a blob
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Valida si un archivo es una imagen válida
 * @param {File} file - Archivo a validar
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {object} - {isValid, error}
 */
export const validateImage = (file, maxSizeMB = 5) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!file) {
    return { isValid: false, error: 'No se ha seleccionado ningún archivo' };
  }

  if (!validTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Tipo de archivo no válido. Use JPG, PNG o WebP.' 
    };
  }

  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB.` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Convierte un archivo a base64
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} - String en base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Crea una imagen de vista previa
 * @param {string} src - URL o base64 de la imagen
 * @param {number} width - Ancho de vista previa
 * @param {number} height - Alto de vista previa
 * @returns {Promise<string>} - URL de vista previa
 */
export const createPreview = (src, width = 200, height = 150) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = width;
    canvas.height = height;

    img.onload = () => {
      // Calcular posición para centrar la imagen
      const { naturalWidth, naturalHeight } = img;
      const scale = Math.max(width / naturalWidth, height / naturalHeight);
      const scaledWidth = naturalWidth * scale;
      const scaledHeight = naturalHeight * scale;
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;

      // Dibujar imagen centrada y escalada
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      resolve(canvas.toDataURL());
    };

    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Guarda imagen en localStorage con compresión
 * @param {string} key - Clave para localStorage
 * @param {string} imageData - Datos de la imagen (base64)
 * @param {number} maxSizeKB - Tamaño máximo en KB para localStorage
 * @returns {Promise<boolean>} - Éxito de la operación
 */
export const saveCustomLogo = (logoData) => {
  try {
    localStorage.setItem('customLogo', logoData);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('logoChanged', { detail: logoData }));
    return true;
  } catch (error) {
    console.error('Error saving custom logo:', error);
    return false;
  }
};

/**
 * Obtiene el logo personalizado desde localStorage
 * @returns {string|null} - Logo personalizado o null
 */
export const getCustomLogo = () => {
  try {
    return localStorage.getItem('customLogo');
  } catch (error) {
    console.error('Error getting custom logo:', error);
    return null;
  }
};

/**
 * Carga imagen desde localStorage
 * @param {string} key - Clave de localStorage
 * @returns {string|null} - Datos de la imagen o null
 */
export const loadImageFromStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error loading image from localStorage:', error);
    return null;
  }
};

/**
 * Guarda imagen en localStorage con validación de tamaño
 * @param {string} key - Clave de localStorage
 * @param {string} imageData - Datos de la imagen en base64
 * @param {number} maxSizeKB - Tamaño máximo en KB (por defecto 500KB)
 * @returns {boolean} - Éxito de la operación
 */
export const saveImageToStorage = (key, imageData, maxSizeKB = 500) => {
  try {
    // Calcular tamaño aproximado en KB
    const sizeKB = (imageData.length * 3) / 4 / 1024;
    
    if (sizeKB > maxSizeKB) {
      console.warn(`Image too large: ${sizeKB.toFixed(1)}KB > ${maxSizeKB}KB`);
      return false;
    }

    localStorage.setItem(key, imageData);
    
    // Dispatch custom events for specific keys
    if (key === IMAGE_STORAGE_KEYS.CUSTOM_LOGO || key === 'customLogo') {
      window.dispatchEvent(new CustomEvent('logoChanged', { detail: imageData }));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving image to localStorage:', error);
    return false;
  }
};

/**
 * Elimina imagen de localStorage
 * @param {string} key - Clave de localStorage
 * @returns {boolean} - Éxito de la operación
 */
export const removeImageFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    
    // Dispatch custom events for specific keys
    if (key === IMAGE_STORAGE_KEYS.CUSTOM_LOGO || key === 'customLogo') {
      window.dispatchEvent(new CustomEvent('logoChanged', { detail: null }));
    }
    
    return true;
  } catch (error) {
    console.error('Error removing image from localStorage:', error);
    return false;
  }
};

/**
 * Elimina imagen de localStorage
 * @param {string} key - Clave de localStorage
 * @returns {boolean} - Éxito de la operación
 */
export const removeCustomLogo = () => {
  try {
    localStorage.removeItem('customLogo');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('logoChanged', { detail: null }));
    return true;
  } catch (error) {
    console.error('Error removing custom logo:', error);
    return false;
  }
};

/**
 * Constantes para las claves de localStorage
 */
export const IMAGE_STORAGE_KEYS = {
  CUSTOM_LOGO: 'customLogo', // Cambiar para ser consistente
  LOGIN_BACKGROUND: 'loginBackground',
  LOGO_PREVIEW: 'smartboxing-logo-preview',
  BACKGROUND_PREVIEW: 'smartboxing-background-preview'
};

/**
 * URLs de imágenes por defecto
 */
export const DEFAULT_IMAGES = {
  LOGO: hospitalLogo,
  LOGIN_BACKGROUND: '/hospital-bg-optimized.jpg'
};