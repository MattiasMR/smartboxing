import { useState, useEffect } from 'react';
import { 
  getClientSettings, 
  updateClientSettings,
  getUserSettings,
  updateUserSettings,
  applyTheme 
} from '../api/settings';
import { 
  getAvailableThemes, 
  applyThemeById, 
  getTheme,
  updateCustomTheme
} from '../styles/themes';
import './Settings.css';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'client'
  const [selectedThemeId, setSelectedThemeId] = useState('custom'); // Track selected theme
  
  // Client settings
  const [clientSettings, setClientSettings] = useState(null);
  const [clientForm, setClientForm] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    darkMode: false,
    appName: 'SmartBoxing',
  });

  // User settings
  const [userSettings, setUserSettings] = useState(null);
  const [userForm, setUserForm] = useState({
    theme: 'auto',
    language: 'es',
    notifications: true,
    emailNotifications: true,
  });

  const [message, setMessage] = useState({ type: '', text: '' });

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
      
      setClientSettings(client);
      setUserSettings(user);
      
      // Populate forms
      if (client.theme) {
        setClientForm(prev => ({
          ...prev,
          primaryColor: client.theme.primaryColor || prev.primaryColor,
          secondaryColor: client.theme.secondaryColor || prev.secondaryColor,
          accentColor: client.theme.accentColor || prev.accentColor,
          darkMode: client.theme.darkMode || false,
        }));
      }
      if (client.texts) {
        setClientForm(prev => ({
          ...prev,
          appName: client.texts.appName || prev.appName,
        }));
      }
      
      if (user.preferences) {
        setUserForm(prev => ({
          ...prev,
          ...user.preferences,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Error al cargar configuración' });
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de tema predefinido
  const handleThemeSelect = (themeId) => {
    setSelectedThemeId(themeId);
    const theme = getTheme(themeId);
    
    if (theme) {
      // Aplicar tema visualmente
      applyThemeById(themeId, clientForm.darkMode);
      
      // Actualizar los colores del formulario
      setClientForm(prev => ({
        ...prev,
        primaryColor: theme.colors.primary,
        secondaryColor: theme.colors.secondary,
        accentColor: theme.colors.success || prev.accentColor,
      }));
    }
  };

  // Manejar cambio de color manual
  const handleColorChange = (colorKey, value) => {
    // Si no estamos en tema custom, cambiar automáticamente
    if (selectedThemeId !== 'custom') {
      setSelectedThemeId('custom');
      setMessage({ 
        type: 'info', 
        text: '🎨 Cambiaste a Tema Personalizado al modificar un color' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }

    // Actualizar el formulario
    setClientForm(prev => ({ ...prev, [colorKey]: value }));

    // Actualizar el tema custom
    const colorMap = {
      primaryColor: 'primary',
      secondaryColor: 'secondary',
      accentColor: 'success'
    };
    
    if (colorMap[colorKey]) {
      updateCustomTheme({ [colorMap[colorKey]]: value });
      // Aplicar tema custom inmediatamente
      applyThemeById('custom', clientForm.darkMode);
    }
  };

  const handleSaveClientSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const updates = {
        theme: {
          primaryColor: clientForm.primaryColor,
          secondaryColor: clientForm.secondaryColor,
          accentColor: clientForm.accentColor,
          darkMode: clientForm.darkMode,
        },
        texts: {
          appName: clientForm.appName,
        },
      };

      const result = await updateClientSettings(updates);
      setClientSettings(result.settings);
      
      // Aplicar tema inmediatamente
      applyTheme(result.settings.theme);
      
      // Actualizar appName en localStorage y disparar evento
      if (clientForm.appName) {
        localStorage.setItem('app-name', clientForm.appName);
        window.dispatchEvent(new CustomEvent('appNameChanged', { detail: clientForm.appName }));
      }
      
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    } catch (error) {
      console.error('Error saving client settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateUserSettings(userForm);
      setUserSettings(result.settings);
      
      // Aplicar tema del usuario inmediatamente
      if (userForm.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (userForm.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }
      
      setMessage({ type: 'success', text: 'Preferencias guardadas correctamente' });
    } catch (error) {
      console.error('Error saving user settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar preferencias' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1>⚙️ Configuración</h1>

      <div className="tabs">
        <button 
          className={activeTab === 'user' ? 'active' : ''} 
          onClick={() => setActiveTab('user')}
        >
          👤 Mis Preferencias
        </button>
        <button 
          className={activeTab === 'client' ? 'active' : ''} 
          onClick={() => setActiveTab('client')}
        >
          🏢 Configuración del Cliente
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'user' && (
        <form onSubmit={handleSaveUserSettings} className="settings-form">
          <h2>Preferencias Personales</h2>

          <div className="form-group">
            <label>Tema</label>
            <select 
              value={userForm.theme}
              onChange={(e) => setUserForm({ ...userForm, theme: e.target.value })}
            >
              <option value="auto">Automático (según sistema)</option>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Idioma</label>
            <select 
              value={userForm.language}
              onChange={(e) => setUserForm({ ...userForm, language: e.target.value })}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-group checkbox">
            <label>
              <input 
                type="checkbox"
                checked={userForm.notifications}
                onChange={(e) => setUserForm({ ...userForm, notifications: e.target.checked })}
              />
              Activar notificaciones en la aplicación
            </label>
          </div>

          <div className="form-group checkbox">
            <label>
              <input 
                type="checkbox"
                checked={userForm.emailNotifications}
                onChange={(e) => setUserForm({ ...userForm, emailNotifications: e.target.checked })}
              />
              Recibir notificaciones por email
            </label>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : 'Guardar Preferencias'}
          </button>
        </form>
      )}

      {activeTab === 'client' && (
        <form onSubmit={handleSaveClientSettings} className="settings-form">
          <h2>Personalización del Cliente</h2>
          <p className="subtitle">Estos cambios afectan a todos los usuarios de tu organización</p>

          <div className="section">
            <h3>Temas Predefinidos</h3>
            <p className="section-description">Selecciona un tema o personaliza los colores manualmente</p>
            
            <div className="themes-grid">
              {getAvailableThemes().map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-card ${selectedThemeId === theme.id ? 'selected' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <span className="theme-name">{theme.name}</span>
                  <span className="theme-preview-icon">🎨</span>
                  {selectedThemeId === theme.id && (
                    <span className="theme-selected-badge">✓</span>
                  )}
                </button>
              ))}
            </div>
            <p className="hint">💡 Al seleccionar un tema, los colores se actualizan automáticamente. Si modificas un color, cambiarás a Tema Personalizado.</p>
          </div>

          <div className="section">
            <h3> 🎨 Colores Personalizados</h3>
            {selectedThemeId !== 'custom' && (
              <p className="section-description" style={{color: 'var(--warning-color)', fontWeight: 500}}>
                ⚠️ Modificar colores cambiará automáticamente a Tema Personalizado
              </p>
            )}
            
            <div className="form-group">
              <label>Color Primario</label>
              <div className="color-input">
                <input 
                  type="color"
                  value={clientForm.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                />
                <input 
                  type="text"
                  value={clientForm.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
              <small className="color-hint">Se usa para botones principales, enlaces y elementos destacados</small>
            </div>

            <div className="form-group">
              <label>Color Secundario</label>
              <div className="color-input">
                <input 
                  type="color"
                  value={clientForm.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                />
                <input 
                  type="text"
                  value={clientForm.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  placeholder="#10B981"
                />
              </div>
              <small className="color-hint">Se usa para botones secundarios y acentos</small>
            </div>

            <div className="form-group">
              <label>Color de Acento</label>
              <div className="color-input">
                <input 
                  type="color"
                  value={clientForm.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                />
                <input 
                  type="text"
                  value={clientForm.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  placeholder="#F59E0B"
                />
              </div>
              <small className="color-hint">Se usa para éxito, estados positivos y confirmaciones</small>
            </div>

            <div className="form-group checkbox">
              <label>
                <input 
                  type="checkbox"
                  checked={clientForm.darkMode}
                  onChange={(e) => setClientForm({ ...clientForm, darkMode: e.target.checked })}
                />
                Modo oscuro por defecto
              </label>
            </div>
          </div>

          <div className="section">
            <h3>🏢 Nombre de la Aplicación</h3>
            
            <div className="form-group">
              <label>Nombre</label>
              <input 
                type="text"
                value={clientForm.appName}
                onChange={(e) => setClientForm({ ...clientForm, appName: e.target.value })}
                placeholder="SmartBoxing"
              />
              <small className="color-hint">Aparece en el header superior izquierdo</small>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </form>
      )}
    </div>
  );
}
