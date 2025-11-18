import { useState, useEffect, useRef } from 'react';
import { 
  getClientSettings, 
  updateClientSettings,
  getUserSettings,
  updateUserSettings,
  applyTheme,
  uploadLogo 
} from '../api/settings';
import './Settings.css';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('branding'); // branding, schedule, operational, user
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Client settings state
  const [clientSettings, setClientSettings] = useState({
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      darkMode: false,
      logoUrl: '',
    },
    texts: {
      appName: 'SmartBoxing',
      institutionName: 'Mi Institución de Salud',
      welcomeMessage: 'Bienvenido al sistema de gestión',
      tagline: 'Gestiona tus recursos médicos eficientemente',
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
  });

  // User preferences state
  const [userPreferences, setUserPreferences] = useState({
    theme: 'light',
    language: 'es',
    notifications: true,
    emailNotifications: true,
  });

  const [previewLogo, setPreviewLogo] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [client, user] = await Promise.all([
        getClientSettings(),
        getUserSettings(),
      ]);
      
      // Merge client settings
      setClientSettings(prev => ({
        theme: { ...prev.theme, ...(client.theme || {}) },
        texts: { ...prev.texts, ...(client.texts || {}) },
        schedule: { ...prev.schedule, ...(client.schedule || {}) },
        operational: { ...prev.operational, ...(client.operational || {}) },
        branding: { ...prev.branding, ...(client.branding || {}) },
      }));

      // Set preview logo
      if (client.theme?.logoUrl) {
        setPreviewLogo(client.theme.logoUrl);
      }

      // Merge user preferences
      if (user.preferences) {
        setUserPreferences(prev => ({ ...prev, ...user.preferences }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

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

    try {
      setUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewLogo(e.target.result);
      reader.readAsDataURL(file);

      // Upload to S3
      const logoUrl = await uploadLogo(file);
      
      // Update settings
      setClientSettings(prev => ({
        ...prev,
        theme: { ...prev.theme, logoUrl },
      }));

      showMessage('success', 'Logo subido exitosamente');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'Error al subir logo');
      setPreviewLogo(''); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  const handleSaveClientSettings = async () => {
    try {
      setSaving(true);
      
      await updateClientSettings(clientSettings);
      
      // Apply theme immediately
      applyTheme(clientSettings.theme);
      
      // Update localStorage for institution name
      if (clientSettings.texts.institutionName) {
        localStorage.setItem('institution-name', clientSettings.texts.institutionName);
        window.dispatchEvent(new CustomEvent('institutionNameChanged', { 
          detail: clientSettings.texts.institutionName 
        }));
      }

      showMessage('success', 'Configuración guardada exitosamente');
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

      showMessage('success', 'Preferencias guardadas exitosamente');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage('error', 'Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const updateClientField = (section, field, value) => {
    setClientSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateUserField = (field, value) => {
    setUserPreferences(prev => ({ ...prev, [field]: value }));
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
      <div className="settings-page">
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
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Configuración del Sistema</h1>
        <p>Personaliza tu institución y preferencias</p>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          🎨 Identidad Visual
        </button>
        <button
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Horarios
        </button>
        <button
          className={`tab ${activeTab === 'operational' ? 'active' : ''}`}
          onClick={() => setActiveTab('operational')}
        >
          ⚙️ Operacional
        </button>
        <button
          className={`tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          👤 Preferencias
        </button>
      </div>

      <div className="settings-content">
        {/* IDENTIDAD VISUAL */}
        {activeTab === 'branding' && (
          <div className="settings-section">
            <h2>Identidad Visual</h2>
            
            {/* Logo */}
            <div className="form-group">
              <label>Logo de la Institución</label>
              <div className="logo-upload-container">
                {previewLogo && (
                  <div className="logo-preview">
                    <img src={previewLogo} alt="Logo preview" />
                  </div>
                )}
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
                  className="btn-secondary"
                >
                  {uploading ? 'Subiendo...' : previewLogo ? 'Cambiar Logo' : 'Subir Logo'}
                </button>
                <small>Formatos: PNG, JPG, SVG. Máximo 2MB.</small>
              </div>
            </div>

            {/* Nombre Institución */}
            <div className="form-group">
              <label htmlFor="institutionName">Nombre de la Institución</label>
              <input
                id="institutionName"
                type="text"
                value={clientSettings.texts.institutionName}
                onChange={(e) => updateClientField('texts', 'institutionName', e.target.value)}
                placeholder="Ej: Clínica San José"
              />
            </div>

            {/* App Name */}
            <div className="form-group">
              <label htmlFor="appName">Nombre de la Aplicación</label>
              <input
                id="appName"
                type="text"
                value={clientSettings.texts.appName}
                onChange={(e) => updateClientField('texts', 'appName', e.target.value)}
                placeholder="Ej: SmartBoxing"
              />
            </div>

            {/* Colores */}
            <div className="colors-grid">
              <div className="form-group">
                <label htmlFor="primaryColor">Color Primario</label>
                <div className="color-input-group">
                  <input
                    id="primaryColor"
                    type="color"
                    value={clientSettings.theme.primaryColor}
                    onChange={(e) => updateClientField('theme', 'primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={clientSettings.theme.primaryColor}
                    onChange={(e) => updateClientField('theme', 'primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="secondaryColor">Color Secundario</label>
                <div className="color-input-group">
                  <input
                    id="secondaryColor"
                    type="color"
                    value={clientSettings.theme.secondaryColor}
                    onChange={(e) => updateClientField('theme', 'secondaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={clientSettings.theme.secondaryColor}
                    onChange={(e) => updateClientField('theme', 'secondaryColor', e.target.value)}
                    placeholder="#10B981"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="accentColor">Color de Acento</label>
                <div className="color-input-group">
                  <input
                    id="accentColor"
                    type="color"
                    value={clientSettings.theme.accentColor}
                    onChange={(e) => updateClientField('theme', 'accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={clientSettings.theme.accentColor}
                    onChange={(e) => updateClientField('theme', 'accentColor', e.target.value)}
                    placeholder="#F59E0B"
                  />
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="form-group">
              <label htmlFor="welcomeMessage">Mensaje de Bienvenida</label>
              <input
                id="welcomeMessage"
                type="text"
                value={clientSettings.texts.welcomeMessage}
                onChange={(e) => updateClientField('texts', 'welcomeMessage', e.target.value)}
                placeholder="Bienvenido al sistema"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tagline">Lema o Tagline</label>
              <input
                id="tagline"
                type="text"
                value={clientSettings.texts.tagline}
                onChange={(e) => updateClientField('texts', 'tagline', e.target.value)}
                placeholder="Gestiona eficientemente"
              />
            </div>

            {/* Información de contacto */}
            <h3>Información de Contacto</h3>
            
            <div className="form-group">
              <label htmlFor="companyName">Razón Social</label>
              <input
                id="companyName"
                type="text"
                value={clientSettings.branding.companyName}
                onChange={(e) => updateClientField('branding', 'companyName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactEmail">Email de Contacto</label>
              <input
                id="contactEmail"
                type="email"
                value={clientSettings.branding.contactEmail}
                onChange={(e) => updateClientField('branding', 'contactEmail', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">Teléfono</label>
              <input
                id="contactPhone"
                type="tel"
                value={clientSettings.branding.contactPhone}
                onChange={(e) => updateClientField('branding', 'contactPhone', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Sitio Web</label>
              <input
                id="website"
                type="url"
                value={clientSettings.branding.website}
                onChange={(e) => updateClientField('branding', 'website', e.target.value)}
                placeholder="https://ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Dirección</label>
              <input
                id="address"
                type="text"
                value={clientSettings.branding.address}
                onChange={(e) => updateClientField('branding', 'address', e.target.value)}
              />
            </div>

            <button
              onClick={handleSaveClientSettings}
              disabled={saving}
              className="btn-primary save-btn"
            >
              {saving ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        )}

        {/* HORARIOS */}
        {activeTab === 'schedule' && (
          <div className="settings-section">
            <h2>Configuración de Horarios</h2>
            
            <div className="form-group">
              <label htmlFor="startTime">Hora de Inicio</label>
              <input
                id="startTime"
                type="time"
                value={clientSettings.schedule.startTime}
                onChange={(e) => updateClientField('schedule', 'startTime', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">Hora de Fin</label>
              <input
                id="endTime"
                type="time"
                value={clientSettings.schedule.endTime}
                onChange={(e) => updateClientField('schedule', 'endTime', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="slotDuration">Duración de Cita (minutos)</label>
              <select
                id="slotDuration"
                value={clientSettings.schedule.slotDuration}
                onChange={(e) => updateClientField('schedule', 'slotDuration', Number(e.target.value))}
              >
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </div>

            <div className="form-group">
              <label>Días de Trabajo</label>
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
            </div>

            <button
              onClick={handleSaveClientSettings}
              disabled={saving}
              className="btn-primary save-btn"
            >
              {saving ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        )}

        {/* OPERACIONAL */}
        {activeTab === 'operational' && (
          <div className="settings-section">
            <h2>Configuración Operacional</h2>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={clientSettings.operational.allowOverlapping}
                  onChange={(e) => updateClientField('operational', 'allowOverlapping', e.target.checked)}
                />
                <span>Permitir citas superpuestas</span>
              </label>
              <small>Permite agendar múltiples citas en el mismo horario</small>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={clientSettings.operational.requirePatientConfirmation}
                  onChange={(e) => updateClientField('operational', 'requirePatientConfirmation', e.target.checked)}
                />
                <span>Requerir confirmación del paciente</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={clientSettings.operational.sendReminders}
                  onChange={(e) => updateClientField('operational', 'sendReminders', e.target.checked)}
                />
                <span>Enviar recordatorios automáticos</span>
              </label>
            </div>

            {clientSettings.operational.sendReminders && (
              <div className="form-group">
                <label htmlFor="reminderHoursBefore">Enviar recordatorio (horas antes)</label>
                <input
                  id="reminderHoursBefore"
                  type="number"
                  min="1"
                  max="72"
                  value={clientSettings.operational.reminderHoursBefore}
                  onChange={(e) => updateClientField('operational', 'reminderHoursBefore', Number(e.target.value))}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="maxAppointmentsPerDay">Máximo de citas por día</label>
              <input
                id="maxAppointmentsPerDay"
                type="number"
                min="1"
                max="100"
                value={clientSettings.operational.maxAppointmentsPerDay}
                onChange={(e) => updateClientField('operational', 'maxAppointmentsPerDay', Number(e.target.value))}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={clientSettings.operational.enableWaitingList}
                  onChange={(e) => updateClientField('operational', 'enableWaitingList', e.target.checked)}
                />
                <span>Habilitar lista de espera</span>
              </label>
            </div>

            <button
              onClick={handleSaveClientSettings}
              disabled={saving}
              className="btn-primary save-btn"
            >
              {saving ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        )}

        {/* PREFERENCIAS DE USUARIO */}
        {activeTab === 'user' && (
          <div className="settings-section">
            <h2>Preferencias de Usuario</h2>
            
            <div className="form-group">
              <label htmlFor="userTheme">Tema</label>
              <select
                id="userTheme"
                value={userPreferences.theme}
                onChange={(e) => updateUserField('theme', e.target.value)}
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="language">Idioma</label>
              <select
                id="language"
                value={userPreferences.language}
                onChange={(e) => updateUserField('language', e.target.value)}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={userPreferences.notifications}
                  onChange={(e) => updateUserField('notifications', e.target.checked)}
                />
                <span>Notificaciones en el navegador</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={userPreferences.emailNotifications}
                  onChange={(e) => updateUserField('emailNotifications', e.target.checked)}
                />
                <span>Notificaciones por correo</span>
              </label>
            </div>

            <button
              onClick={handleSaveUserPreferences}
              disabled={saving}
              className="btn-primary save-btn"
            >
              {saving ? 'Guardando...' : '💾 Guardar Preferencias'}
            </button>
          </div>
        )}
      </div>

      {/* Preview Box */}
      <div className="preview-box">
        <h3>Vista Previa</h3>
        <div className="preview-card" style={{
          borderColor: clientSettings.theme.primaryColor,
        }}>
          {previewLogo && (
            <img src={previewLogo} alt="Logo" className="preview-logo" />
          )}
          <h4 style={{ color: clientSettings.theme.primaryColor }}>
            {clientSettings.texts.institutionName}
          </h4>
          <p style={{ color: clientSettings.theme.secondaryColor }}>
            {clientSettings.texts.welcomeMessage}
          </p>
          <small>{clientSettings.texts.tagline}</small>
          <div className="preview-buttons">
            <button style={{ backgroundColor: clientSettings.theme.primaryColor }}>
              Primario
            </button>
            <button style={{ backgroundColor: clientSettings.theme.secondaryColor }}>
              Secundario
            </button>
            <button style={{ backgroundColor: clientSettings.theme.accentColor }}>
              Acento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
