# SmartBoxing Frontend

Sistema de gestión hospitalaria con personalización de temas completa.

## 🎨 Sistema de Personalización

### ✅ Funcionalidades Implementadas
- ✅ **Cambio de colores primarios y secundarios**
- ✅ **Modo claro/oscuro**
- ✅ **Modo compacto/normal**
- ✅ **Persistencia en localStorage por usuario**
- ✅ **Previsualización en tiempo real**
- ✅ **6 presets de colores predefinidos**
- ✅ **Interfaz intuitiva con selectores de color**

### 🚧 En Desarrollo
- 🚧 **Migración completa de CSS a variables** (parcial)
- 🚧 **Cambio de imagen de fondo del login**
- 🚧 **Cambio de logo personalizado**
- 🚧 **Logo por defecto actualizado**

## 🏗️ Arquitectura del Sistema

### Archivos Principales
- `src/styles/theme-variables.css` - Variables CSS centralizadas
- `src/hooks/useTheme.js` - Hook de React para gestión de temas
- `src/utils/cssVariables.js` - Utilidades para JavaScript/CSS
- `src/pages/PersonalizationPage.jsx` - Interfaz de personalización
- `src/pages/PersonalizationPage.css` - Estilos de la página

### Variables CSS Disponibles
```css
/* Colores principales */
--primary-color: #00796b;
--primary-dark: #004d40;
--primary-light: #26a69a;
--primary-color-rgb: 0, 121, 107;

/* Colores secundarios */
--secondary-color: #0277bd;
--secondary-dark: #01579b;
--secondary-light: #29b6f6;
--secondary-color-rgb: 2, 119, 189;

/* Estados de colores */
--hover-primary: #00695c;
--active-primary: #004d40;

/* Modos */
[data-theme="dark"] - Modo oscuro
[data-density="compact"] - Modo compacto
```

## 📝 TODOs - Migración CSS

### 🎯 Páginas CSS a Migrar (ALTA PRIORIDAD)
- [ ] **BoxesDashboardPage.css** - Migrar colores de botones y estados
- [ ] **DoctorDetailPage.css** - Migrar colores de interfaz de detalles
- [ ] **AgendaPage.css** - Migrar colores del calendario
- [ ] **DailySummaryPage.css** - Migrar colores de dashboard
- [ ] **LoginPage.css** - Migrar colores de formulario

### 🧩 Componentes CSS a Migrar (MEDIA PRIORIDAD)
- [ ] **MainLayout.css** - Migrar colores del layout principal
- [ ] **PageHeader.css** - Migrar colores de headers
- [ ] **Sidebar.css** - Migrar colores de navegación
- [ ] **DoctorCard.css** - Migrar colores de tarjetas
- [ ] **MiniDoctorCard.css** - Migrar colores de tarjetas pequeñas
- [ ] **BoxCard.css** - Migrar colores de tarjetas de boxes
- [ ] **BoxDetailSidebar.css** - Migrar colores de sidebar de detalles
- [ ] **AppointmentModal.css** - Migrar colores de modales

### 🛠️ Componentes de Navegación (BAJA PRIORIDAD)
- [ ] **BackButton.css** - Migrar colores de botón
- [ ] **Breadcrumb.css** - Migrar colores de breadcrumb
- [ ] **FilterControls.css** - Migrar colores de filtros

### ✅ Archivos Ya Migrados
- ✅ **DoctorsPage.css** - Inputs de búsqueda y enfoque
- ✅ **AnalystPage.css** - Headers, valores, spinner
- ✅ **ReportsPage.css** - Inputs de fecha
- ✅ **AgendaPage.jsx** - Colores dinámicos del calendario
- ✅ **LoginPage.jsx** - Gradientes de fondo

## 🎨 Presets de Colores Disponibles

1. **Verde Médico** (Por defecto): `#00796b`
2. **Azul Profundo**: `#1565c0`
3. **Púrpura Elegante**: `#7b1fa2`
4. **Azul Océano**: `#0277bd`
5. **Esmeralda**: `#00695c`
6. **Índigo**: `#303f9f`

## 🚀 Uso del Sistema

### Para Usuarios
1. Ir a `/personalizar`
2. Seleccionar colores o presets
3. Activar modo oscuro/compacto
4. Los cambios se guardan automáticamente

### Para Desarrolladores

#### Usar Variables CSS
```css
.mi-elemento {
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
  border-color: var(--primary-dark);
}
```

#### Usar en JavaScript
```javascript
import { THEME_COLORS, getCSSVariable } from '../utils/cssVariables';

const primaryColor = getCSSVariable('primary-color');
const medicalColor = THEME_COLORS.MEDICAL_HOURS();
```

## 📦 Instalación y Desarrollo

### Requisitos
- Node.js 16+
- npm o yarn

### Comandos
```bash
npm install          # Instalar dependencias
npm run dev         # Servidor de desarrollo
npm run build       # Build de producción
npm run preview     # Vista previa del build
```

### Variables de Entorno
```env
VITE_API_BASE=https://api.smartboxing.com
VITE_COGNITO_DOMAIN=tu-dominio.auth.region.amazoncognito.com
VITE_COGNITO_CLIENT_ID=tu-client-id
VITE_REDIRECT_URI=http://localhost:5173/callback
VITE_LOGOUT_URI=http://localhost:5173/login
```

## 📚 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── layout/         # Componentes de layout
│   ├── common/         # Componentes comunes
│   ├── doctors/        # Componentes de doctores
│   └── boxes/          # Componentes de boxes
├── pages/              # Páginas principales
├── hooks/              # Custom hooks
├── utils/              # Utilidades
├── styles/             # Estilos globales
├── context/            # Contextos de React
└── api/               # Servicios de API
```

## 🔄 Estado del Desarrollo

### Fase 1: ✅ Sistema Base de Temas
- [x] Variables CSS centralizadas
- [x] Hook de React para temas
- [x] Persistencia en localStorage
- [x] Interfaz de personalización

### Fase 2: 🚧 Migración CSS Completa
- [x] Páginas principales (parcial)
- [ ] Todos los componentes
- [ ] Gráficos y visualizaciones
- [ ] Estados hover/active/focus

### Fase 3: 🚧 Personalización Avanzada
- [ ] Cambio de logos
- [ ] Imágenes de fondo personalizadas
- [ ] Temas predefinidos por especialidad
- [ ] Exportar/importar configuraciones

---

**Documentación técnica completa:** Ver `PERSONALIZACION.md`
