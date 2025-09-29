// src/hooks/useTheme.js
import { useState, useEffect, useCallback } from 'react';

const DEFAULT_THEME = {
  // Colores principales
  primaryColor: '#00796b',
  primaryDark: '#004d40', 
  primaryLight: '#26a69a',
  
  // Colores secundarios
  secondaryColor: '#0277bd',
  secondaryDark: '#01579b',
  secondaryLight: '#29b6f6',
  
  // Configuraciones
  darkMode: false,
  compactMode: false,
  
  // Colores de fondo
  backgroundPrimary: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  backgroundGray: '#e9ecef',
  
  // Colores de texto
  textPrimary: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999'
};

const STORAGE_KEY = 'smartboxing-theme';

export const useTheme = () => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Función para aplicar tema al DOM
  const applyTheme = useCallback((newTheme) => {
    const root = document.documentElement;
    
    // Aplicar colores principales
    root.style.setProperty('--primary-color', newTheme.primaryColor);
    root.style.setProperty('--primary-dark', newTheme.primaryDark);
    root.style.setProperty('--primary-light', newTheme.primaryLight);
    
    // Aplicar colores secundarios
    root.style.setProperty('--secondary-color', newTheme.secondaryColor);
    root.style.setProperty('--secondary-dark', newTheme.secondaryDark);
    root.style.setProperty('--secondary-light', newTheme.secondaryLight);
    
    // Aplicar modo oscuro/claro
    if (newTheme.darkMode) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Aplicar modo compacto
    if (newTheme.compactMode) {
      root.setAttribute('data-density', 'compact');
    } else {
      root.setAttribute('data-density', 'normal');
    }
    
    // Agregar clase para animaciones
    document.body.classList.add('theme-applied');
  }, []);

  // Inicialización automática al montar el hook
  useEffect(() => {
    console.log('🎨 [useTheme] Initializing theme...');
    const loadTheme = async () => {
      try {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        console.log('🎨 [useTheme] Saved theme from localStorage:', savedTheme);
        
        if (savedTheme) {
          const parsedTheme = JSON.parse(savedTheme);
          const newTheme = { ...DEFAULT_THEME, ...parsedTheme };
          console.log('🎨 [useTheme] Applying saved theme:', newTheme);
          setTheme(newTheme);
          applyTheme(newTheme);
        } else {
          // Si no hay tema guardado, usar el tema por defecto y aplicarlo
          console.log('🎨 [useTheme] No saved theme, using default:', DEFAULT_THEME);
          setTheme(DEFAULT_THEME);
          applyTheme(DEFAULT_THEME);
        }
      } catch (error) {
        console.warn('Error loading theme from localStorage:', error);
        setTheme(DEFAULT_THEME);
        applyTheme(DEFAULT_THEME);
      } finally {
        console.log('🎨 [useTheme] Theme loading completed, setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [applyTheme]);

  // Función para actualizar tema
  const updateTheme = useCallback((updates) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    applyTheme(newTheme);
    
    // Guardar en localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTheme));
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
  }, [theme, applyTheme]);

  // Función para resetear tema
  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Error removing theme from localStorage:', error);
    }
  }, [applyTheme]);

  // Función para alternar modo oscuro
  const toggleDarkMode = useCallback(() => {
    updateTheme({ darkMode: !theme.darkMode });
  }, [theme.darkMode, updateTheme]);

  // Función para alternar modo compacto
  const toggleCompactMode = useCallback(() => {
    updateTheme({ compactMode: !theme.compactMode });
  }, [theme.compactMode, updateTheme]);

  // Función para inicializar el tema (para llamada manual si es necesario)
  const initializeTheme = useCallback(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        const newTheme = { ...DEFAULT_THEME, ...parsedTheme };
        setTheme(newTheme);
        applyTheme(newTheme);
      } else {
        // Si no hay tema guardado, usar el tema por defecto y aplicarlo
        setTheme(DEFAULT_THEME);
        applyTheme(DEFAULT_THEME);
      }
    } catch (error) {
      console.warn('Error loading theme from localStorage:', error);
      setTheme(DEFAULT_THEME);
      applyTheme(DEFAULT_THEME);
    } finally {
      setIsLoading(false);
    }
  }, [applyTheme]);

  // Función para obtener el tema actual (útil para componentes)
  const getCurrentTheme = useCallback(() => {
    return theme;
  }, [theme]);

  // Función para verificar si es el tema por defecto
  const isDefaultTheme = useCallback(() => {
    return JSON.stringify(theme) === JSON.stringify(DEFAULT_THEME);
  }, [theme]);

  return {
    theme,
    updateTheme,
    resetTheme,
    toggleDarkMode,
    toggleCompactMode,
    getCurrentTheme,
    isDefaultTheme,
    initializeTheme,
    isLoading
  };
};