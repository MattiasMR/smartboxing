# TODOs - Migración CSS Completa del Sistema de Personalización

## 🚨 PRIORIDAD ALTA - Páginas Principales

### ✅ Ya Migrados
- [x] **DoctorsPage.css** - Inputs de búsqueda (border-color)
- [x] **AnalystPage.css** - Headers, valores de datos, spinner
- [x] **ReportsPage.css** - Inputs de fecha (border-color)
- [x] **PersonalizationPage.css** - Usa variables CSS completamente

### 🔥 MIGRAR INMEDIATAMENTE

#### TODO-001: BoxesDashboardPage.css
**Archivo:** `src/pages/BoxesDashboardPage.css`  
**Descripción:** Migrar colores de botones, filtros y estados de dashboard  
**Colores a buscar:** `#00796b`, `#004d40`, colores hardcodeados  
**Prioridad:** ⭐⭐⭐⭐⭐  

#### TODO-002: DailySummaryPage.css  
**Archivo:** `src/pages/DailySummaryPage.css`  
**Descripción:** Migrar colores de métricas, gráficos y tarjetas de resumen  
**Colores a buscar:** Colores de estado, bordes, fondos de tarjetas  
**Prioridad:** ⭐⭐⭐⭐⭐  

#### TODO-003: AgendaPage.css
**Archivo:** `src/pages/AgendaPage.css`  
**Descripción:** Migrar colores del calendario y controles  
**Colores a buscar:** Colores de eventos, navegación del calendario  
**Prioridad:** ⭐⭐⭐⭐⭐  
**Nota:** AgendaPage.jsx ya está migrado, falta el CSS  

#### TODO-004: LoginPage.css
**Archivo:** `src/pages/LoginPage.css`  
**Descripción:** Migrar colores de formulario y botones  
**Colores a buscar:** Botones de submit, inputs, fondos  
**Prioridad:** ⭐⭐⭐⭐⭐  
**Nota:** LoginPage.jsx ya está migrado, falta el CSS  

#### TODO-005: DoctorDetailPage.css
**Archivo:** `src/pages/DoctorDetailPage.css`  
**Descripción:** Migrar colores de interfaz de detalles de doctor  
**Colores a buscar:** Botones de acción, estados, información médica  
**Prioridad:** ⭐⭐⭐⭐  

## 🧩 PRIORIDAD MEDIA - Componentes Layout

#### TODO-006: MainLayout.css
**Archivo:** `src/components/layout/MainLayout.css`  
**Descripción:** Migrar colores del layout principal  
**Colores a buscar:** Fondos, bordes, separadores  
**Prioridad:** ⭐⭐⭐⭐  

#### TODO-007: Sidebar.css
**Archivo:** `src/components/layout/Sidebar.css`  
**Descripción:** Migrar colores de navegación lateral  
**Colores a buscar:** Items activos, hover, fondos, iconos  
**Prioridad:** ⭐⭐⭐⭐  

#### TODO-008: PageHeader.css
**Archivo:** `src/components/layout/PageHeader.css`  
**Descripción:** Migrar colores de headers de página  
**Colores a buscar:** Títulos, botones de acción, bordes  
**Prioridad:** ⭐⭐⭐  

#### TODO-009: TopHeader.css
**Archivo:** `src/components/layout/TopHeader.css`  
**Descripción:** Migrar colores de header superior  
**Colores a buscar:** Fondo, texto, botones de usuario  
**Prioridad:** ⭐⭐⭐  

## 🏥 PRIORIDAD MEDIA - Componentes Médicos

#### TODO-010: DoctorCard.css
**Archivo:** `src/components/doctors/DoctorCard.css`  
**Descripción:** Migrar colores de tarjetas de doctores  
**Colores a buscar:** Bordes, estados disponible/ocupado, botones  
**Prioridad:** ⭐⭐⭐⭐  

#### TODO-011: MiniDoctorCard.css
**Archivo:** `src/components/doctors/MiniDoctorCard.css`  
**Descripción:** Migrar colores de tarjetas pequeñas de doctores  
**Colores a buscar:** Estados, indicadores de actividad  
**Prioridad:** ⭐⭐⭐  

#### TODO-012: DoctorDetailSidebar.css
**Archivo:** `src/components/doctors/DoctorDetailSidebar.css`  
**Descripción:** Migrar colores de sidebar de detalles  
**Colores a buscar:** Información médica, estados, botones  
**Prioridad:** ⭐⭐⭐  

## 📦 PRIORIDAD MEDIA - Componentes Boxes

#### TODO-013: BoxCard.css
**Archivo:** `src/components/boxes/BoxCard.css`  
**Descripción:** Migrar colores de tarjetas de boxes  
**Colores a buscar:** Estados disponible/ocupado/mantenimiento, bordes  
**Prioridad:** ⭐⭐⭐⭐  

#### TODO-014: BoxDetailSidebar.css
**Archivo:** `src/components/boxes/BoxDetailSidebar.css`  
**Descripción:** Migrar colores de sidebar de detalles de box  
**Colores a buscar:** Información técnica, estados, métricas  
**Prioridad:** ⭐⭐⭐  

#### TODO-015: BoxDetailPage.css
**Archivo:** `src/components/boxes/BoxDetailPage.css`  
**Descripción:** Migrar colores de página de detalles de box  
**Colores a buscar:** Gráficos, métricas, botones de control  
**Prioridad:** ⭐⭐⭐  

#### TODO-016: AppointmentModal.css
**Archivo:** `src/components/boxes/AppointmentModal.css`  
**Descripción:** Migrar colores de modal de citas  
**Colores a buscar:** Botones de confirmación, estados, formularios  
**Prioridad:** ⭐⭐⭐  

#### TODO-017: DashboardFilters.css
**Archivo:** `src/components/boxes/DashboardFilters.css`  
**Descripción:** Migrar colores de filtros del dashboard  
**Colores a buscar:** Botones activos, dropdowns, checkboxes  
**Prioridad:** ⭐⭐  

#### TODO-018: BoxGrid.css
**Archivo:** `src/components/boxes/BoxGrid.css`  
**Descripción:** Migrar colores de grid de boxes  
**Colores a buscar:** Hover effects, selección, bordes  
**Prioridad:** ⭐⭐  

#### TODO-019: BoxSearch.css
**Archivo:** `src/components/boxes/BoxSearch.css`  
**Descripción:** Migrar colores de búsqueda de boxes  
**Colores a buscar:** Input focus, botones de búsqueda, sugerencias  
**Prioridad:** ⭐⭐  

## 🧭 PRIORIDAD BAJA - Navegación

#### TODO-020: BackButton.css
**Archivo:** `src/components/navigation/BackButton.css`  
**Descripción:** Migrar colores de botón de retroceso  
**Colores a buscar:** Hover, active, icono  
**Prioridad:** ⭐  

## 🎨 NUEVAS FUNCIONALIDADES REQUERIDAS

#### TODO-021: Cambio de Logo
**Archivo:** Nuevo componente `LogoUploader`  
**Descripción:** Permitir cambiar logo del sistema  
**Ubicación:** `src/components/personalization/LogoUploader.jsx`  
**Prioridad:** ⭐⭐⭐⭐  

#### TODO-022: Imagen de Fondo Login
**Archivo:** Nuevo componente `BackgroundUploader`  
**Descripción:** Permitir cambiar imagen de fondo del login  
**Ubicación:** `src/components/personalization/BackgroundUploader.jsx`  
**Prioridad:** ⭐⭐⭐⭐  

#### TODO-023: Logo por Defecto
**Archivo:** `src/assets/` y componentes que usen logo  
**Descripción:** Actualizar logo por defecto del sistema  
**Prioridad:** ⭐⭐⭐  

#### TODO-024: Utilidades para Imágenes
**Archivo:** `src/utils/imageUtils.js`  
**Descripción:** Funciones para redimensionar, validar y gestionar imágenes  
**Prioridad:** ⭐⭐⭐  

## 📊 METODOLOGÍA DE MIGRACIÓN

### Para cada archivo CSS:
1. **Buscar colores hardcodeados** usando regex: `#[0-9a-fA-F]{6}`
2. **Identificar colores principales:**
   - `#00796b` → `var(--primary-color)`
   - `#004d40` → `var(--primary-dark)` 
   - `#0277bd` → `var(--secondary-color)`
   - `#01579b` → `var(--secondary-dark)`
3. **Migrar colores de estado:**
   - Verde/éxito → `var(--success-color)`
   - Rojo/error → `var(--error-color)`
   - Amarillo/warning → `var(--warning-color)`
4. **Agregar soporte para modo oscuro** si es necesario
5. **Probar en ambos modos** (claro/oscuro)

### Comando para buscar colores:
```bash
grep -r "#[0-9a-fA-F]\{6\}" src/components/
grep -r "#[0-9a-fA-F]\{6\}" src/pages/
```

## 📈 PROGRESO ACTUAL

### Estado General: 15% Completado
- ✅ **Sistema base:** 100%
- ✅ **Páginas principales:** 40% (4/10)
- ❌ **Componentes layout:** 0% (0/4)  
- ❌ **Componentes médicos:** 0% (0/3)
- ❌ **Componentes boxes:** 0% (0/7)
- ❌ **Navegación:** 0% (0/1)
- ❌ **Nuevas funcionalidades:** 0% (0/4)

### Próximos 5 TODOs Críticos:
1. TODO-001: BoxesDashboardPage.css
2. TODO-002: DailySummaryPage.css  
3. TODO-006: MainLayout.css
4. TODO-007: Sidebar.css
5. TODO-010: DoctorCard.css

---

**Fecha de creación:** Septiembre 29, 2025  
**Estimación total:** 2-3 días de trabajo  
**Prioridad:** Sistema completo funcionando para producción