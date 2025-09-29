# Sistema de Personalización - SmartBoxing

## 📋 Resumen del Sistema

Se ha implementado un sistema completo de personalización de temas que permite a los usuarios:

- ✅ Cambiar colores principales y secundarios del sistema
- ✅ Alternar entre modo claro y oscuro 
- ✅ Cambiar entre modo normal y compacto
- ✅ Previsualizar cambios en tiempo real
- ✅ Guardar configuración en localStorage (por usuario, local)
- ✅ Aplicar configuración automáticamente al cargar la aplicación

## 🎨 Colores del Sistema

### Colores Por Defecto
```css
/* Colores principales */
--primary-color: #00796b (Verde médico)
--primary-dark: #004d40 (Verde médico oscuro)
--primary-light: #26a69a (Verde médico claro)

/* Colores secundarios */
--secondary-color: #0277bd (Azul océano)
--secondary-dark: #01579b (Azul océano oscuro)
--secondary-light: #29b6f6 (Azul océano claro)
```

### Presets Disponibles
1. **Verde Médico** (Por defecto): `#00796b`
2. **Azul Profundo**: `#1565c0`
3. **Púrpura Elegante**: `#7b1fa2`
4. **Azul Océano**: `#0277bd`
5. **Esmeralda**: `#00695c`
6. **Índigo**: `#303f9f`

## 🏗️ Arquitectura del Sistema

### Archivos Principales

#### 1. Variables CSS (`src/styles/theme-variables.css`)
- Define todas las variables CSS personalizables
- Soporte para modo claro/oscuro
- Soporte para modo normal/compacto
- Variables RGB para usar con `rgba()`

#### 2. Hook de Tema (`src/hooks/useTheme.js`)
- Gestiona el estado del tema en React
- Persiste configuración en localStorage
- Aplica cambios al DOM automáticamente
- Funciones: `updateTheme`, `resetTheme`, `toggleDarkMode`, `toggleCompactMode`

#### 3. Utilidades CSS (`src/utils/cssVariables.js`)
- Funciones helper para leer/escribir variables CSS desde JS
- Constantes de colores para casos específicos
- Conversión hex a RGB
- `getCSSVariable`, `setCSSVariable`, `getThemeColors`, `THEME_COLORS`

#### 4. Página de Personalización (`src/pages/PersonalizationPage.jsx`)
- Interfaz completa de configuración
- Selectores de color con picker y input de texto
- Presets predefinidos
- Toggles para modo oscuro/compacto
- Vista previa en tiempo real

#### 5. Estilos de Personalización (`src/pages/PersonalizationPage.css`)
- CSS completamente responsive
- Uso de variables CSS para auto-adaptación
- Animaciones y transiciones suaves

### Integración con la App

#### Inicialización
```javascript
// En CognitoApp.jsx
const { initializeTheme } = useTheme();

useEffect(() => {
  initializeTheme();
}, [initializeTheme]);
```

#### Importación CSS
```javascript
// En main.jsx y cognitoMain.jsx
import './styles/theme-variables.css';
```

#### Uso en Componentes
```javascript
// Ejemplo: usar colores dinámicos en componentes
import { THEME_COLORS } from '../utils/cssVariables';

const color = THEME_COLORS.MEDICAL_HOURS(); // Obtiene color actual
```

## 🎯 Archivos Migrados

### Archivos CSS Actualizados
- ✅ `src/pages/DoctorsPage.css` - Colores de enfoque de inputs
- ✅ `src/pages/AnalystPage.css` - Headers, valores de datos, spinner
- ✅ `src/pages/ReportsPage.css` - Inputs de fecha
- ✅ `src/styles/theme-variables.css` - Sistema completo de variables

### Archivos JavaScript Actualizados
- ✅ `src/pages/AgendaPage.jsx` - Colores dinámicos del calendario
- ✅ `src/pages/LoginPage.jsx` - Gradientes de fondo dinámicos
- ✅ `src/CognitoApp.jsx` - Inicialización del tema
- ✅ `src/main.jsx` - Importación de variables CSS
- ✅ `src/cognitoMain.jsx` - Importación de variables CSS

## 📱 Características de la UI

### Vista Previa en Tiempo Real
- Los cambios se aplican instantáneamente
- Vista previa muestra colores actuales
- Botones de ejemplo con los colores seleccionados

### Controles Intuitivos
- **Color Picker**: Selector visual de colores
- **Input de Texto**: Para códigos hex precisos
- **Presets**: Botones con colores predefinidos
- **Toggles**: Controles para modo oscuro/compacto

### Persistencia
- Configuración guardada en localStorage
- Se mantiene entre sesiones del usuario
- Configuración individual por usuario (no global del servidor)

## 🔄 Estados del Sistema

### Modos Disponibles
1. **Tema Claro/Oscuro** (`data-theme="dark"`)
2. **Densidad Normal/Compacta** (`data-density="compact"`)

### Aplicación Automática
- Las variables CSS se actualizan en el elemento `<html>`
- Los cambios se reflejan inmediatamente en toda la aplicación
- Sistema responsive que se adapta a dispositivos móviles

## 🚀 Uso del Sistema

### Para Desarrolladores

#### Agregar Nuevos Colores
1. Definir en `theme-variables.css`:
```css
--new-color: #ff5722;
--new-color-rgb: 255, 87, 34;
```

2. Usar en CSS:
```css
.my-element {
  color: var(--new-color);
  background: rgba(var(--new-color-rgb), 0.1);
}
```

3. Usar en JavaScript:
```javascript
import { getCSSVariable } from '../utils/cssVariables';
const color = getCSSVariable('new-color');
```

#### Agregar Nuevos Presets
```javascript
// En PersonalizationPage.jsx
const colorPresets = [
  // ... presets existentes
  { name: 'Mi Color Personalizado', color: '#ff5722' }
];
```

### Para Usuarios Finales

1. **Acceder**: Navegar a `/personalizar` desde el menú lateral
2. **Personalizar**: Usar selectores de color o presets
3. **Configurar**: Activar/desactivar modo oscuro y compacto
4. **Aplicar**: Los cambios se guardan automáticamente
5. **Resetear**: Botón para volver a configuración por defecto

## ✅ Estado del Proyecto

### Completado
- ✅ Sistema de variables CSS completo
- ✅ Hook de React para gestión de temas
- ✅ Utilidades para CSS/JavaScript
- ✅ Página de personalización funcional
- ✅ Integración con autenticación Cognito
- ✅ Migración de archivos principales
- ✅ Persistencia en localStorage
- ✅ Vista previa en tiempo real
- ✅ Responsive design

### Pendiente de Migración
- 📋 Archivos CSS adicionales para uso completo de variables
- 📋 Componentes individuales que usen colores hardcodeados
- 📋 Archivos JavaScript con estilos inline

### Funcionalidades Futuras
- 🔮 Gestión de logos personalizados
- 🔮 Más opciones de densidad (XL, XS)
- 🔮 Presets temáticos por especialidad médica
- 🔮 Exportar/importar configuraciones

## 📚 Documentación Técnica

### Estructura de Variables CSS
```css
:root {
  /* Colores principales + RGB */
  --primary-color: #00796b;
  --primary-color-rgb: 0, 121, 107;
  
  /* Estados automáticos */
  --hover-primary: #00695c;
  --active-primary: #004d40;
  
  /* Modo oscuro */
  [data-theme="dark"] & {
    --background-primary: #1e1e1e;
    --text-primary: #ffffff;
  }
  
  /* Modo compacto */
  [data-density="compact"] & {
    --spacing-sm: 6px;
    --font-size-base: 13px;
  }
}
```

### API del Hook useTheme
```javascript
const {
  theme,              // Estado actual del tema
  updateTheme,        // Actualizar tema parcialmente
  resetTheme,         // Resetear a valores por defecto
  toggleDarkMode,     // Alternar modo oscuro
  toggleCompactMode,  // Alternar modo compacto
  getCurrentTheme,    // Obtener tema actual
  isDefaultTheme,     // Verificar si es tema por defecto
  initializeTheme,    // Inicializar tema al cargar app
  isLoading          // Estado de carga
} = useTheme();
```

---

## 🎉 Resultado Final

El sistema de personalización está **completamente funcional** y permite a los usuarios de SmartBoxing personalizar completamente la apariencia de la aplicación manteniendo la consistencia visual y la experiencia de usuario. La implementación es robusta, escalable y fácil de mantener.