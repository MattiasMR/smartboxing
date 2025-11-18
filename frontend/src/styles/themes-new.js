// SmartBoxing Theme System - 5 Predefined Themes + Custom

export const PREDEFINED_THEMES = {
  light: {
    id: 'light',
    name: 'Light',
    description: 'Clean and professional light theme',
    colors: {
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#2563EB',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#FFFFFF',
      text: '#111827',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Modern dark theme',
    colors: {
      primary: '#60A5FA',
      primaryLight: '#93C5FD',
      primaryDark: '#3B82F6',
      secondary: '#A78BFA',
      accent: '#34D399',
      background: '#111827',
      text: '#F9FAFB',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calming blue tones',
    colors: {
      primary: '#0EA5E9',
      primaryLight: '#38BDF8',
      primaryDark: '#0284C7',
      secondary: '#14B8A6',
      accent: '#06B6D4',
      background: '#F0F9FF',
      text: '#0C4A6E',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green tones',
    colors: {
      primary: '#059669',
      primaryLight: '#10B981',
      primaryDark: '#047857',
      secondary: '#84CC16',
      accent: '#F59E0B',
      background: '#F0FDF4',
      text: '#14532D',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and pink',
    colors: {
      primary: '#F97316',
      primaryLight: '#FB923C',
      primaryDark: '#EA580C',
      secondary: '#EC4899',
      accent: '#A855F7',
      background: '#FFF7ED',
      text: '#7C2D12',
    },
  },
};

export function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--color-${cssVar}`, value);
  });
  root.style.setProperty('--primary-color', theme.colors.primary);
  root.style.setProperty('--secondary-color', theme.colors.secondary);
  localStorage.setItem('smartboxing-theme-id', theme.id);
}

export function getCurrentTheme() {
  const id = localStorage.getItem('smartboxing-theme-id');
  return PREDEFINED_THEMES[id] || PREDEFINED_THEMES.light;
}

export function getThemeById(id) {
  return PREDEFINED_THEMES[id] || PREDEFINED_THEMES.light;
}

export const THEME_LIST = Object.values(PREDEFINED_THEMES);
export const DEFAULT_THEME = PREDEFINED_THEMES.light;
export const themes = PREDEFINED_THEMES; // Legacy support
