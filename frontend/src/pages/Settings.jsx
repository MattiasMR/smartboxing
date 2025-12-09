import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getClientSettings, 
  updateClientSettings,
  getUserSettings,
  updateUserSettings,
  applyTheme,
  uploadLogo 
} from '../api/settings';
import { useAuthContext } from '../auth/AuthContext.js';
import './Settings.css';

// Temas predefinidos profesionales
const PROFESSIONAL_THEMES = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Profesional y confiable',
    colors: {
      primary: '#0EA5E9',
      secondary: '#06B6D4',
      accent: '#3B82F6',
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural y calmante',
    colors: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#14B8A6',
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Energético y moderno',
    colors: {
      primary: '#F59E0B',
      secondary: '#EF4444',
      accent: '#F97316',
    }
  },
  royal: {
    id: 'royal',
    name: 'Royal Purple',
    description: 'Elegante y premium',
    colors: {
      primary: '#8B5CF6',
      secondary: '#A855F7',
      accent: '#EC4899',
    }
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Blue',
    description: 'Clásico corporativo',
    colors: {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      accent: '#2563EB',
    }
  },
  medical: {
    id: 'medical',
    name: 'Medical Teal',
    description: 'Profesional médico',
    colors: {
      primary: '#14B8A6',
      secondary: '#0D9488',
      accent: '#06B6D4',
    }
  },
};

const CUSTOM_THEME_ID = 'custom';
const THEME_COLOR_FIELDS = ['primaryColor', 'secondaryColor', 'accentColor'];

const normalizeColor = (value = '') => value.trim().toLowerCase();

const detectThemePreset = (theme = {}) => {
  if (!theme) return CUSTOM_THEME_ID;
  if (theme.selectedThemeId && PROFESSIONAL_THEMES[theme.selectedThemeId]) {
    return theme.selectedThemeId;
  }

  const match = Object.values(PROFESSIONAL_THEMES).find(preset => (
    normalizeColor(preset.colors.primary) === normalizeColor(theme.primaryColor) &&
    normalizeColor(preset.colors.secondary) === normalizeColor(theme.secondaryColor) &&
    normalizeColor(preset.colors.accent) === normalizeColor(theme.accentColor)
  ));

  return match?.id || CUSTOM_THEME_ID;
};

const DEFAULT_CLIENT_SETTINGS = {
  theme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    darkMode: false,
    logoUrl: '',
    selectedThemeId: 'corporate',
  },
  texts: {
    appName: 'SmartBoxing',
    institutionName: 'Mi Institución de Salud',
    welcomeMessage: 'Bienvenido al sistema de gestión de recursos agendables y staff',
    tagline: 'Gestiona tus recursos agendables y staff eficientemente',
  },
  schedule: {
    startTime: '08:00',
    endTime: '20:00',
    slotDuration: 30,
    workDays: [1, 2, 3, 4, 5],
  },
  operational: {
    allowOverlapping: false,
    requirePatientConfirmation: true,
    sendReminders: true,
    reminderHoursBefore: 24,
    maxAppointmentsPerDay: 50,
    enableWaitingList: false,
  },
  branding: {
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: '',
  },
};

const createDefaultClientSettings = () => JSON.parse(JSON.stringify(DEFAULT_CLIENT_SETTINGS));

export default function SettingsProfessionalNew() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Client settings state
  const [clientSettings, setClientSettings] = useState(() => createDefaultClientSettings());

  // User preferences state
  const [userPreferences, setUserPreferences] = useState({
    theme: 'light',
    language: 'es',
    notifications: true,
    emailNotifications: true,
  });

  const [previewLogo, setPreviewLogo] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState(() => detectThemePreset(DEFAULT_CLIENT_SETTINGS.theme));

  const { user } = useAuthContext();
  const isStaff = user?.role === 'staff';
  const hasTenant = !!user?.tenantId;
  const isSuperAdminUser = user?.role === 'super_admin';
  const isTenantAdminUser = user?.role === 'tenant_admin';

  // If user is staff or has no tenant (and not super admin), default to 'user' section on mount only
  useEffect(() => {
    if ((isStaff || !hasTenant) && !isSuperAdminUser) {
      setActiveSection('user');
    }
  }, [isStaff, hasTenant, isSuperAdminUser]);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Only fetch client settings if user has access (tenant admin) AND has a tenant context
      let client = {};
      if (isTenantAdminUser && hasTenant) {
        try {
          client = await getClientSettings();
        } catch (e) {
          console.warn('Could not load client settings', e);
        }
      }

      const userSettings = await getUserSettings();

      const mergedTheme = {
        ...DEFAULT_CLIENT_SETTINGS.theme,
        ...(client.theme || {}),
        selectedThemeId: client.theme?.selectedThemeId,
      };

      const detectedThemeId = detectThemePreset(mergedTheme);
      mergedTheme.selectedThemeId = detectedThemeId;

      const mergedClientSettings = {
        theme: mergedTheme,
        texts: { ...DEFAULT_CLIENT_SETTINGS.texts, ...(client.texts || {}) },
        schedule: { ...DEFAULT_CLIENT_SETTINGS.schedule, ...(client.schedule || {}) },
        operational: { ...DEFAULT_CLIENT_SETTINGS.operational, ...(client.operational || {}) },
        branding: { ...DEFAULT_CLIENT_SETTINGS.branding, ...(client.branding || {}) },
      };

      setClientSettings(mergedClientSettings);
      setSelectedThemeId(detectedThemeId);
      setPreviewLogo(mergedClientSettings.theme.logoUrl || '');

      // Merge user preferences
      if (userSettings.preferences) {
        setUserPreferences(prev => ({ ...prev, ...userSettings.preferences }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, [isTenantAdminUser, hasTenant]);

  useEffect(() => {
    // If super admin, default to user settings
    if (isSuperAdminUser) {
      setActiveSection('user');
    }
    loadSettings();
  }, [isSuperAdminUser, loadSettings]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'El archivo debe pesar menos de 2MB');
      return;
    }

    const previousTheme = { ...clientSettings.theme };

    try {
      setUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewLogo(e.target.result);
      reader.readAsDataURL(file);

      // Upload to S3
      const logoUrl = await uploadLogo(file);

      const updatedTheme = { ...clientSettings.theme, logoUrl };
      const updatedSettings = { ...clientSettings, theme: updatedTheme };

      setClientSettings(updatedSettings);

      // Apply immediately so header updates without reload
      applyTheme(updatedTheme, { preserveMode: true });

      // Persist automatically so logout/login keeps the logo
      await updateClientSettings(updatedSettings);

      showMessage('success', 'Logo subido y guardado exitosamente');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'Error al subir o guardar el logo');
      setClientSettings(prev => ({
        ...prev,
        theme: previousTheme,
      }));
      applyTheme(previousTheme, { preserveMode: true });
      setPreviewLogo(previousTheme.logoUrl || '');
      setSelectedThemeId(detectThemePreset(previousTheme));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveClientSettings = async () => {
    try {
      setSaving(true);
      
      await updateClientSettings(clientSettings);
      
      // Apply theme immediately
      applyTheme(clientSettings.theme, { preserveMode: true });
      
      // Update app name
      if (clientSettings.texts.appName) {
        localStorage.setItem('app-name', clientSettings.texts.appName);
        window.dispatchEvent(new CustomEvent('appNameChanged', { 
          detail: clientSettings.texts.appName 
        }));
      }

      // Update institution name
      if (clientSettings.texts.institutionName) {
        localStorage.setItem('institution-name', clientSettings.texts.institutionName);
        window.dispatchEvent(new CustomEvent('institutionNameChanged', { 
          detail: clientSettings.texts.institutionName 
        }));
      }

      showMessage('success', '✅ Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserPreferences = async () => {
    try {
      setSaving(true);
      await updateUserSettings(userPreferences);
      
      // Apply theme preference
      if (userPreferences.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (userPreferences.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      }

      showMessage('success', '✅ Preferencias guardadas exitosamente');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage('error', 'Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const updateClientField = (section, field, value) => {
    const isThemeColorField = section === 'theme' && THEME_COLOR_FIELDS.includes(field);

    setClientSettings(prev => {
      const updatedSection = {
        ...prev[section],
        [field]: value,
      };

      if (isThemeColorField) {
        updatedSection.selectedThemeId = CUSTOM_THEME_ID;
      }

      return {
        ...prev,
        [section]: updatedSection,
      };
    });

    if (isThemeColorField) {
      setSelectedThemeId(CUSTOM_THEME_ID);
    }
  };

  const updateUserField = (field, value) => {
    setUserPreferences(prev => ({ ...prev, [field]: value }));
  };

  const applyPredefinedTheme = (themeId) => {
    const theme = PROFESSIONAL_THEMES[themeId];
    if (!theme) return;

    setSelectedThemeId(themeId);
    
    // Update client settings with theme colors
    setClientSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        primaryColor: theme.colors.primary,
        secondaryColor: theme.colors.secondary,
        accentColor: theme.colors.accent,
        selectedThemeId: theme.id,
      },
    }));

    showMessage('success', `Tema "${theme.name}" seleccionado. Haz clic en "Guardar Cambios" para aplicar.`);
  };

  const toggleWorkDay = (day) => {
    setClientSettings(prev => {
      const workDays = prev.schedule.workDays.includes(day)
        ? prev.schedule.workDays.filter(d => d !== day)
        : [...prev.schedule.workDays, day].sort();
      
      return {
        ...prev,
        schedule: { ...prev.schedule, workDays },
      };
    });
  };

  if (loading) {
    return (
      <div className="settings-professional-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const weekDays = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' },
  ];

  return (
    <div className="settings-professional-page">
      {message.text && (
        <div className={`settings-toast settings-toast-${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="settings-container">
        {/* Sidebar Navigation */}
        <aside className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h2>⚙️ Configuración</h2>
            <p>Personaliza tu plataforma</p>
          </div>
          
          <nav className="settings-nav">
            {/* Organization Settings - Only for Tenant Admin with active tenant */}
            {/* Super Admin does not have organization settings unless they are inside a tenant context (which they are not in admin panel) */}
            {(!isStaff && hasTenant && !isSuperAdminUser) && (
              <div className="settings-nav-section">
                <h3 className="settings-nav-section-title">Organización</h3>
                <ul className="settings-nav-list">
                  <li>
                    <button
                      className={`settings-nav-link ${activeSection === 'general' ? 'active' : ''}`}
                      onClick={() => setActiveSection('general')}
                    >
                      <span className="settings-nav-icon">🏢</span>
                      <span>General</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`settings-nav-link ${activeSection === 'branding' ? 'active' : ''}`}
                      onClick={() => setActiveSection('branding')}
                    >
                      <span className="settings-nav-icon">🎨</span>
                      <span>Identidad Visual</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`settings-nav-link ${activeSection === 'schedule' ? 'active' : ''}`}
                      onClick={() => setActiveSection('schedule')}
                    >
                      <span className="settings-nav-icon">📅</span>
                      <span>Horarios</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}

            <div className="settings-nav-section">
              <h3 className="settings-nav-section-title">Personal</h3>
              <ul className="settings-nav-list">
                <li>
                  <button
                    className={`settings-nav-link ${activeSection === 'user' ? 'active' : ''}`}
                    onClick={() => setActiveSection('user')}
                  >
                    <span className="settings-nav-icon">👤</span>
                    <span>Preferencias</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="settings-main">
          {/* GENERAL */}
          {activeSection === 'general' && (
            <>
              <div className="settings-main-header">
                <h1>Información General</h1>
                <p>Configura la información básica de tu institución</p>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Información de la Institución</h2>
                  <p>Esta información se mostrará en toda la aplicación</p>
                </div>
                <div className="settings-card-body">
                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="appName">
                      Nombre de la Aplicación
                      <span className="settings-form-label-optional">Obligatorio</span>
                    </label>
                    <input
                      id="appName"
                      type="text"
                      className="settings-input"
                      value={clientSettings.texts.appName}
                      onChange={(e) => updateClientField('texts', 'appName', e.target.value)}
                      placeholder="Ej: SmartBoxing"
                    />
                    <p className="settings-form-description">
                      Este nombre aparecerá en la barra de navegación y el título del navegador
                    </p>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="institutionName">
                      Nombre de la Institución
                      <span className="settings-form-label-optional">Obligatorio</span>
                    </label>
                    <input
                      id="institutionName"
                      type="text"
                      className="settings-input"
                      value={clientSettings.texts.institutionName}
                      onChange={(e) => updateClientField('texts', 'institutionName', e.target.value)}
                      placeholder="Ej: Clínica San José"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="welcomeMessage">
                      Mensaje de Bienvenida
                    </label>
                    <input
                      id="welcomeMessage"
                      type="text"
                      className="settings-input"
                      value={clientSettings.texts.welcomeMessage}
                      onChange={(e) => updateClientField('texts', 'welcomeMessage', e.target.value)}
                      placeholder="Bienvenido al sistema de gestión de recursos agendables y staff"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="tagline">
                      Lema / Tagline
                    </label>
                    <input
                      id="tagline"
                      type="text"
                      className="settings-input"
                      value={clientSettings.texts.tagline}
                      onChange={(e) => updateClientField('texts', 'tagline', e.target.value)}
                      placeholder="Gestiona eficientemente tus recursos"
                    />
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Información de Contacto</h2>
                  <p>Datos de contacto de tu organización</p>
                </div>
                <div className="settings-card-body">
                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="companyName">
                      Razón Social
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      className="settings-input"
                      value={clientSettings.branding.companyName}
                      onChange={(e) => updateClientField('branding', 'companyName', e.target.value)}
                      placeholder="Nombre legal de la empresa"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="contactEmail">
                      Email de Contacto
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      className="settings-input"
                      value={clientSettings.branding.contactEmail}
                      onChange={(e) => updateClientField('branding', 'contactEmail', e.target.value)}
                      placeholder="contacto@ejemplo.com"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="contactPhone">
                      Teléfono
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      className="settings-input"
                      value={clientSettings.branding.contactPhone}
                      onChange={(e) => updateClientField('branding', 'contactPhone', e.target.value)}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="website">
                      Sitio Web
                    </label>
                    <input
                      id="website"
                      type="url"
                      className="settings-input"
                      value={clientSettings.branding.website}
                      onChange={(e) => updateClientField('branding', 'website', e.target.value)}
                      placeholder="https://ejemplo.com"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="address">
                      Dirección
                    </label>
                    <textarea
                      id="address"
                      className="settings-textarea"
                      rows={3}
                      value={clientSettings.branding.address}
                      onChange={(e) => updateClientField('branding', 'address', e.target.value)}
                      placeholder="Calle 123, Ciudad, País"
                    />
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button
                  onClick={handleSaveClientSettings}
                  disabled={saving}
                  className="settings-btn-primary"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </>
          )}

          {/* IDENTIDAD VISUAL */}
          {activeSection === 'branding' && (
            <>
              <div className="settings-main-header">
                <h1>Identidad Visual</h1>
                <p>Personaliza colores, logo y apariencia de tu plataforma</p>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Logo de la Institución</h2>
                  <p>El logo se mostrará en la barra de navegación</p>
                </div>
                <div className="settings-card-body">
                  <div className="logo-upload-section">
                    {previewLogo && (
                      <div className="logo-preview-box">
                        <img src={previewLogo} alt="Logo preview" />
                      </div>
                    )}
                    <div className="logo-upload-controls">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="settings-btn-secondary"
                      >
                        {uploading ? '⏳ Subiendo...' : previewLogo ? '🔄 Cambiar Logo' : '📤 Subir Logo'}
                      </button>
                      <p className="settings-form-description">
                        Formatos aceptados: PNG, JPG, SVG. Tamaño máximo: 2MB.
                        <br />
                        Recomendado: 200x60px o proporciones similares.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Temas Prediseñados</h2>
                  <p>Selecciona un tema profesional diseñado para tu institución</p>
                </div>
                <div className="settings-card-body">
                  <div className="themes-grid">
                    {Object.values(PROFESSIONAL_THEMES).map(theme => (
                      <div
                        key={theme.id}
                        className={`theme-card ${selectedThemeId === theme.id ? 'selected' : ''}`}
                        onClick={() => applyPredefinedTheme(theme.id)}
                      >
                        <div className="theme-card-colors">
                          <div className="theme-color-dot" style={{ backgroundColor: theme.colors.primary }}></div>
                          <div className="theme-color-dot" style={{ backgroundColor: theme.colors.secondary }}></div>
                          <div className="theme-color-dot" style={{ backgroundColor: theme.colors.accent }}></div>
                        </div>
                        <h4>{theme.name}</h4>
                        <p>{theme.description}</p>
                        {selectedThemeId === theme.id && (
                          <div className="theme-selected-badge">✓ Seleccionado</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Personalización Avanzada de Colores</h2>
                  <p>Ajusta los colores manualmente (opcional)</p>
                </div>
                <div className="settings-card-body">
                  <div className="colors-advanced-grid">
                    <div className="settings-form-group">
                      <label className="settings-form-label" htmlFor="primaryColor">
                        Color Primario
                      </label>
                      <div className="color-input-wrapper">
                        <input
                          id="primaryColor"
                          type="color"
                          className="color-picker"
                          value={clientSettings.theme.primaryColor}
                          onChange={(e) => updateClientField('theme', 'primaryColor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="settings-input"
                          value={clientSettings.theme.primaryColor}
                          onChange={(e) => updateClientField('theme', 'primaryColor', e.target.value)}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div className="settings-form-group">
                      <label className="settings-form-label" htmlFor="secondaryColor">
                        Color Secundario
                      </label>
                      <div className="color-input-wrapper">
                        <input
                          id="secondaryColor"
                          type="color"
                          className="color-picker"
                          value={clientSettings.theme.secondaryColor}
                          onChange={(e) => updateClientField('theme', 'secondaryColor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="settings-input"
                          value={clientSettings.theme.secondaryColor}
                          onChange={(e) => updateClientField('theme', 'secondaryColor', e.target.value)}
                          placeholder="#10B981"
                        />
                      </div>
                    </div>

                    <div className="settings-form-group">
                      <label className="settings-form-label" htmlFor="accentColor">
                        Color de Acento
                      </label>
                      <div className="color-input-wrapper">
                        <input
                          id="accentColor"
                          type="color"
                          className="color-picker"
                          value={clientSettings.theme.accentColor}
                          onChange={(e) => updateClientField('theme', 'accentColor', e.target.value)}
                        />
                        <input
                          type="text"
                          className="settings-input"
                          value={clientSettings.theme.accentColor}
                          onChange={(e) => updateClientField('theme', 'accentColor', e.target.value)}
                          placeholder="#F59E0B"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button
                  onClick={handleSaveClientSettings}
                  disabled={saving}
                  className="settings-btn-primary"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </>
          )}

          {/* HORARIOS */}
          {activeSection === 'schedule' && (
            <>
              <div className="settings-main-header">
                <h1>Configuración de Horarios</h1>
                <p>Define los horarios de atención y configuración de citas</p>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Horario de Atención</h2>
                </div>
                <div className="settings-card-body">
                  <div className="settings-grid-2">
                    <div className="settings-form-group">
                      <label className="settings-form-label" htmlFor="startTime">
                        Hora de Inicio
                      </label>
                      <input
                        id="startTime"
                        type="time"
                        className="settings-input"
                        value={clientSettings.schedule.startTime}
                        onChange={(e) => updateClientField('schedule', 'startTime', e.target.value)}
                      />
                    </div>

                    <div className="settings-form-group">
                      <label className="settings-form-label" htmlFor="endTime">
                        Hora de Fin
                      </label>
                      <input
                        id="endTime"
                        type="time"
                        className="settings-input"
                        value={clientSettings.schedule.endTime}
                        onChange={(e) => updateClientField('schedule', 'endTime', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="slotDuration">
                      Duración de Cita
                    </label>
                    <select
                      id="slotDuration"
                      className="settings-select"
                      value={clientSettings.schedule.slotDuration}
                      onChange={(e) => updateClientField('schedule', 'slotDuration', Number(e.target.value))}
                    >
                      <option value={15}>15 minutos</option>
                      <option value={20}>20 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos</option>
                      <option value={90}>90 minutos</option>
                      <option value={120}>2 horas</option>
                    </select>
                    <p className="settings-form-description">
                      Tiempo por defecto para cada cita
                    </p>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label">
                      Días de Trabajo
                    </label>
                    <div className="weekdays-selector">
                      {weekDays.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          className={`weekday-btn ${
                            clientSettings.schedule.workDays.includes(day.value) ? 'active' : ''
                          }`}
                          onClick={() => toggleWorkDay(day.value)}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    <p className="settings-form-description">
                      Selecciona los días en que tu institución atiende
                    </p>
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button
                  onClick={handleSaveClientSettings}
                  disabled={saving}
                  className="settings-btn-primary"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </>
          )}

          {/* OPERACIONAL */}
          {activeSection === 'operational' && (
            <>
              <div className="settings-main-header">
                <h1>Configuración Operacional</h1>
                <p>Reglas y políticas de negocio de tu institución</p>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Políticas de Citas</h2>
                </div>
                <div className="settings-card-body">
                  <div className="settings-form-group settings-checkbox-group">
                    <label className="settings-checkbox-label">
                      <input
                        type="checkbox"
                        checked={clientSettings.operational.allowOverlapping}
                        onChange={(e) => updateClientField('operational', 'allowOverlapping', e.target.checked)}
                      />
                      <div>
                        <span className="settings-checkbox-title">Permitir citas superpuestas</span>
                        <p className="settings-checkbox-description">
                          Permite agendar múltiples citas en el mismo horario para diferentes profesionales
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="settings-form-group settings-checkbox-group">
                    <label className="settings-checkbox-label">
                      <input
                        type="checkbox"
                        checked={clientSettings.operational.requirePatientConfirmation}
                        onChange={(e) => updateClientField('operational', 'requirePatientConfirmation', e.target.checked)}
                      />
                      <div>
                        <span className="settings-checkbox-title">Requerir confirmación del cliente</span>
                        <p className="settings-checkbox-description">
                          Los clientes deben confirmar su cita antes de la fecha programada
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="maxAppointmentsPerDay">
                      Máximo de citas por día
                    </label>
                    <input
                      id="maxAppointmentsPerDay"
                      type="number"
                      className="settings-input"
                      min="1"
                      max="100"
                      value={clientSettings.operational.maxAppointmentsPerDay}
                      onChange={(e) => updateClientField('operational', 'maxAppointmentsPerDay', Number(e.target.value))}
                    />
                    <p className="settings-form-description">
                      Límite diario de citas que se pueden agendar
                    </p>
                  </div>

                  <div className="settings-form-group settings-checkbox-group">
                    <label className="settings-checkbox-label">
                      <input
                        type="checkbox"
                        checked={clientSettings.operational.enableWaitingList}
                        onChange={(e) => updateClientField('operational', 'enableWaitingList', e.target.checked)}
                      />
                      <div>
                        <span className="settings-checkbox-title">Habilitar lista de espera</span>
                        <p className="settings-checkbox-description">
                          Permite a los clientes registrarse en lista de espera cuando no hay horarios disponibles
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Recordatorios y Notificaciones</h2>
                </div>
                <div className="settings-card-body">
                  <div className="settings-form-group settings-checkbox-group">
                    <label className="settings-checkbox-label">
                      <input
                        type="checkbox"
                        checked={clientSettings.operational.sendReminders}
                        onChange={(e) => updateClientField('operational', 'sendReminders', e.target.checked)}
                      />
                      <div>
                        <span className="settings-checkbox-title">Enviar recordatorios automáticos</span>
                        <p className="settings-checkbox-description">
                          Envía recordatorios por email a los clientes antes de su cita
                        </p>
                      </div>
                    </label>
                  </div>

                  {clientSettings.operational.sendReminders && (
                    <div className="settings-form-group">
                      <label className="settings-form-label" htmlFor="reminderHoursBefore">
                        Enviar recordatorio (horas antes)
                      </label>
                      <input
                        id="reminderHoursBefore"
                        type="number"
                        className="settings-input"
                        min="1"
                        max="72"
                        value={clientSettings.operational.reminderHoursBefore}
                        onChange={(e) => updateClientField('operational', 'reminderHoursBefore', Number(e.target.value))}
                      />
                      <p className="settings-form-description">
                        Cuántas horas antes de la cita se enviará el recordatorio
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="settings-actions">
                <button
                  onClick={handleSaveClientSettings}
                  disabled={saving}
                  className="settings-btn-primary"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </>
          )}

          {/* PREFERENCIAS DE USUARIO */}
          {activeSection === 'user' && (
            <>
              <div className="settings-main-header">
                <h1>Preferencias Personales</h1>
                <p>Configuración específica para tu usuario</p>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Apariencia</h2>
                </div>
                <div className="settings-card-body">
                  <div className="settings-form-group">
                    <label className="settings-form-label" htmlFor="userTheme">
                      Tema de la interfaz
                    </label>
                    <select
                      id="userTheme"
                      className="settings-select"
                      value={userPreferences.theme}
                      onChange={(e) => updateUserField('theme', e.target.value)}
                    >
                      <option value="light">🌞 Modo Claro</option>
                      <option value="dark">🌙 Modo Oscuro</option>
                      <option value="auto">⚡ Automático (según sistema)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Notificaciones</h2>
                </div>
                <div className="settings-card-body">
                  <div className="settings-form-group settings-checkbox-group">
                    <label className="settings-checkbox-label">
                      <input
                        type="checkbox"
                        checked={userPreferences.notifications}
                        onChange={(e) => updateUserField('notifications', e.target.checked)}
                      />
                      <div>
                        <span className="settings-checkbox-title">Notificaciones del navegador</span>
                        <p className="settings-checkbox-description">
                          Recibe notificaciones push en tu navegador
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="settings-form-group settings-checkbox-group">
                    <label className="settings-checkbox-label">
                      <input
                        type="checkbox"
                        checked={userPreferences.emailNotifications}
                        onChange={(e) => updateUserField('emailNotifications', e.target.checked)}
                      />
                      <div>
                        <span className="settings-checkbox-title">Notificaciones por correo</span>
                        <p className="settings-checkbox-description">
                          Recibe actualizaciones importantes por email
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button
                  onClick={handleSaveUserPreferences}
                  disabled={saving}
                  className="settings-btn-primary"
                >
                  {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

