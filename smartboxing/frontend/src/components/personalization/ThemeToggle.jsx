// src/components/personalization/ThemeToggle.jsx
import React from 'react';
import { FaMoon, FaSun, FaCog, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const ThemeToggle = ({ settings, onChange }) => {
  const currentTheme = settings.theme || 'dark';
  const darkModeEnabled = settings.darkModeEnabled !== false; // Default to true

  const handleThemeChange = (newTheme) => {
    onChange('theme', newTheme);
  };

  const handleDarkModeToggle = () => {
    const newDarkModeEnabled = !darkModeEnabled;
    onChange('darkModeEnabled', newDarkModeEnabled);
    
    // If disabling dark mode, switch to light theme
    if (!newDarkModeEnabled && currentTheme === 'dark') {
      onChange('theme', 'light');
    }
  };

  return (
    <div className="theme-toggle">
      <div className="theme-toggle-header">
        <h3><FaCog /> Configuración de Tema</h3>
        <p>Controla la apariencia y el modo oscuro del sistema.</p>
      </div>

      {/* Dark Mode Enable/Disable */}
      <div className="dark-mode-setting">
        <div className="setting-header">
          <label>Modo Oscuro</label>
          <button
            className={`toggle-btn ${darkModeEnabled ? 'enabled' : 'disabled'}`}
            onClick={handleDarkModeToggle}
          >
            {darkModeEnabled ? <FaToggleOn /> : <FaToggleOff />}
            <span>{darkModeEnabled ? 'Habilitado' : 'Deshabilitado'}</span>
          </button>
        </div>
        <p className="setting-description">
          {darkModeEnabled 
            ? 'Los usuarios pueden alternar entre modo claro y oscuro.'
            : 'El sistema solo usará el modo claro. El botón de cambio de tema estará oculto.'
          }
        </p>
      </div>

      {/* Theme Selector */}
      <div className="theme-selector">
        <label>Tema Actual:</label>
        <div className="theme-options">
          <button
            className={`theme-option ${currentTheme === 'light' ? 'active' : ''} ${!darkModeEnabled ? 'forced' : ''}`}
            onClick={() => handleThemeChange('light')}
            disabled={!darkModeEnabled && currentTheme === 'light'}
          >
            <div className="theme-icon light-icon">
              <FaSun />
            </div>
            <div className="theme-info">
              <span className="theme-name">Modo Claro</span>
              <span className="theme-desc">Fondo claro, ideal para uso diurno</span>
              {!darkModeEnabled && (
                <span className="theme-forced">Único modo disponible</span>
              )}
            </div>
          </button>

          <button
            className={`theme-option ${currentTheme === 'dark' ? 'active' : ''} ${!darkModeEnabled ? 'disabled' : ''}`}
            onClick={() => handleThemeChange('dark')}
            disabled={!darkModeEnabled}
          >
            <div className="theme-icon dark-icon">
              <FaMoon />
            </div>
            <div className="theme-info">
              <span className="theme-name">Modo Oscuro</span>
              <span className="theme-desc">Fondo oscuro, reduce fatiga visual</span>
              {!darkModeEnabled && (
                <span className="theme-disabled">Deshabilitado</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Theme Preview */}
      <div className="theme-preview">
        <label>Vista Previa del Tema:</label>
        <div className={`preview-container ${currentTheme}`}>
          <div className="preview-header">
            <div className="preview-logo">SmartBoxing</div>
            <div className="preview-user">
              {currentTheme === 'light' ? <FaSun /> : <FaMoon />}
              Usuario
            </div>
          </div>
          <div className="preview-content">
            <div className="preview-card">
              <h4>Tarjeta de Ejemplo</h4>
              <p>Este es el aspecto que tendrá el contenido con el tema seleccionado.</p>
              <button className="preview-button">Botón de Acción</button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="advanced-settings">
        <h4>⚙️ Configuraciones Avanzadas</h4>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoThemeDetection || false}
              onChange={(e) => onChange('autoThemeDetection', e.target.checked)}
              disabled={!darkModeEnabled}
            />
            Detectar tema del sistema automáticamente
          </label>
          <small>
            Cambiar automáticamente entre claro y oscuro según la configuración del dispositivo del usuario.
          </small>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.rememberThemeChoice || true}
              onChange={(e) => onChange('rememberThemeChoice', e.target.checked)}
            />
            Recordar preferencia de tema
          </label>
          <small>
            Guardar la elección de tema del usuario para futuras sesiones.
          </small>
        </div>
      </div>

      <style jsx>{`
        .theme-toggle {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .theme-toggle-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.5rem 0;
          color: var(--color-text, #e2e8f0);
          font-size: 1.1rem;
        }

        .theme-toggle-header p {
          margin: 0;
          color: var(--color-text-secondary, #a0aec0);
          font-size: 0.9rem;
        }

        .dark-mode-setting {
          background: var(--color-card-bg-secondary, #4a5568);
          border: 1px solid var(--color-border, #4a5568);
          border-radius: 8px;
          padding: 1.25rem;
        }

        .setting-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .setting-header label {
          font-weight: 600;
          font-size: 1rem;
          color: var(--color-text, #e2e8f0);
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          font-size: 1rem;
        }

        .toggle-btn.enabled {
          background: var(--color-success, #059669);
          color: white;
        }

        .toggle-btn.disabled {
          background: var(--color-error, #dc2626);
          color: white;
        }

        .toggle-btn:hover {
          transform: scale(1.02);
        }

        .setting-description {
          margin: 0;
          color: var(--color-text-secondary, #a0aec0);
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .theme-selector label {
          display: block;
          margin-bottom: 1rem;
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .theme-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-card-bg-secondary, #4a5568);
          border: 2px solid transparent;
          color: var(--color-text, #e2e8f0);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          text-align: left;
        }

        .theme-option:hover:not(:disabled) {
          border-color: var(--color-primary, #3b82f6);
        }

        .theme-option.active {
          border-color: var(--color-primary, #3b82f6);
          background: var(--color-primary-light, rgba(59, 130, 246, 0.1));
        }

        .theme-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .theme-option.forced {
          border-color: var(--color-warning, #f59e0b);
          background: var(--color-warning-light, rgba(245, 158, 11, 0.1));
        }

        .theme-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          font-size: 1.5rem;
        }

        .light-icon {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
        }

        .dark-icon {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
        }

        .theme-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .theme-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--color-text, #e2e8f0);
        }

        .theme-desc {
          font-size: 0.8rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .theme-forced {
          font-size: 0.75rem;
          color: var(--color-warning, #f59e0b);
          font-weight: 500;
        }

        .theme-disabled {
          font-size: 0.75rem;
          color: var(--color-error, #dc2626);
          font-weight: 500;
        }

        .theme-preview label {
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .preview-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .preview-container.light {
          background: #ffffff;
          color: #1f2937;
        }

        .preview-container.dark {
          background: #1f2937;
          color: #f9fafb;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(0,0,0,0.1);
        }

        .preview-logo {
          font-weight: bold;
          font-size: 1.1rem;
        }

        .preview-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .preview-content {
          padding: 1rem;
        }

        .preview-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 1rem;
        }

        .preview-card h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.95rem;
        }

        .preview-card p {
          margin: 0 0 1rem 0;
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .preview-button {
          padding: 0.5rem 1rem;
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .advanced-settings {
          background: var(--color-card-bg-secondary, #4a5568);
          border: 1px solid var(--color-border, #4a5568);
          border-radius: 8px;
          padding: 1.25rem;
        }

        .advanced-settings h4 {
          margin: 0 0 1rem 0;
          color: var(--color-text, #e2e8f0);
          font-size: 0.95rem;
        }

        .setting-item {
          margin-bottom: 1rem;
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .setting-item label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          color: var(--color-text, #e2e8f0);
          font-size: 0.9rem;
        }

        .setting-item input[type="checkbox"] {
          margin-top: 0.1rem;
        }

        .setting-item small {
          display: block;
          margin-top: 0.25rem;
          margin-left: 1.25rem;
          color: var(--color-text-secondary, #a0aec0);
          font-size: 0.8rem;
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
};

export default ThemeToggle;