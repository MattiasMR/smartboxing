// src/components/personalization/PreviewPanel.jsx
import React from 'react';
import { FaHome, FaUserMd, FaTh, FaChartBar, FaEye } from 'react-icons/fa';

const PreviewPanel = ({ settings, isVisible = true }) => {
  const currentTheme = settings.theme || 'dark';
  const logoUrl = settings.logoUrl;
  const companyName = settings.companyName || 'SmartBoxing';
  
  // Get theme-specific colors
  const getThemeColors = () => {
    if (currentTheme === 'light' && settings.lightThemeColors) {
      return settings.lightThemeColors;
    } else if (currentTheme === 'dark' && settings.darkThemeColors) {
      return settings.darkThemeColors;
    } else {
      // Fallback to global colors or defaults
      return {
        primary: settings.primaryColor || (currentTheme === 'dark' ? '#3b82f6' : '#0ea5e9'),
        secondary: settings.secondaryColor || (currentTheme === 'dark' ? '#1d4ed8' : '#0369a1')
      };
    }
  };

  const themeColors = getThemeColors();

  // Theme-based styles
  const getThemeStyles = () => {
    if (currentTheme === 'light') {
      return {
        background: '#ffffff',
        cardBg: '#f8fafc',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        shadow: 'rgba(0,0,0,0.1)'
      };
    } else {
      return {
        background: '#1f2937',
        cardBg: '#374151',
        text: '#f9fafb',
        textSecondary: '#d1d5db',
        border: '#4b5563',
        shadow: 'rgba(0,0,0,0.3)'
      };
    }
  };

  const themeStyles = getThemeStyles();

  if (!isVisible) {
    return (
      <div className="preview-panel-hidden">
        <FaEye />
        <h3>Vista Previa</h3>
        <p>Cambia a un tab de configuración para ver la vista previa en tiempo real.</p>
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3><FaEye /> Vista Previa en Tiempo Real</h3>
        <div className="theme-indicator">
          {currentTheme === 'light' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </div>
      </div>

      <div 
        className="preview-app"
        style={{
          backgroundColor: themeStyles.background,
          color: themeStyles.text
        }}
      >
        {/* Preview Header */}
        <div 
          className="preview-app-header"
          style={{
            backgroundColor: themeStyles.cardBg,
            borderBottom: `1px solid ${themeStyles.border}`,
            boxShadow: `0 1px 3px ${themeStyles.shadow}`
          }}
        >
          <div className="preview-logo-section">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName}
                className="preview-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <span 
              className="preview-logo-text"
              style={{ 
                display: logoUrl ? 'none' : 'block',
                color: themeColors.primary 
              }}
            >
              {companyName}
            </span>
          </div>
          
          <div className="preview-user-section">
            <div className="preview-user-avatar" style={{ backgroundColor: themeColors.primary }}>
              U
            </div>
            <span style={{ color: themeStyles.textSecondary }}>Usuario</span>
          </div>
        </div>

        {/* Preview Sidebar */}
        <div className="preview-content">
          <div 
            className="preview-sidebar"
            style={{
              backgroundColor: themeStyles.cardBg,
              borderRight: `1px solid ${themeStyles.border}`
            }}
          >
            <div className="preview-nav-items">
              <div 
                className="preview-nav-item active"
                style={{ backgroundColor: themeColors.primary }}
              >
                <FaHome />
                <span>Home</span>
              </div>
              <div className="preview-nav-item" style={{ color: themeStyles.textSecondary }}>
                <FaTh />
                <span>Boxes</span>
              </div>
              <div className="preview-nav-item" style={{ color: themeStyles.textSecondary }}>
                <FaUserMd />
                <span>Doctores</span>
              </div>
              <div className="preview-nav-item" style={{ color: themeStyles.textSecondary }}>
                <FaChartBar />
                <span>Reportes</span>
              </div>
            </div>
          </div>

          {/* Preview Main Content */}
          <div className="preview-main">
            <div 
              className="preview-page-header"
              style={{ borderBottom: `1px solid ${themeStyles.border}` }}
            >
              <h4 style={{ color: themeStyles.text }}>Dashboard Principal</h4>
              <p style={{ color: themeStyles.textSecondary }}>Vista general del sistema</p>
            </div>

            <div className="preview-cards-grid">
              {/* Card 1 */}
              <div 
                className="preview-card"
                style={{
                  backgroundColor: themeStyles.cardBg,
                  border: `1px solid ${themeStyles.border}`,
                  boxShadow: `0 2px 4px ${themeStyles.shadow}`
                }}
              >
                <div className="preview-card-header">
                  <h5 style={{ color: themeStyles.text }}>Citas Hoy</h5>
                  <div 
                    className="preview-card-icon"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    📅
                  </div>
                </div>
                <div className="preview-card-number" style={{ color: themeColors.primary }}>
                  24
                </div>
                <p style={{ color: themeStyles.textSecondary }}>6 completadas</p>
              </div>

              {/* Card 2 */}
              <div 
                className="preview-card"
                style={{
                  backgroundColor: themeStyles.cardBg,
                  border: `1px solid ${themeStyles.border}`,
                  boxShadow: `0 2px 4px ${themeStyles.shadow}`
                }}
              >
                <div className="preview-card-header">
                  <h5 style={{ color: themeStyles.text }}>Boxes Activos</h5>
                  <div 
                    className="preview-card-icon"
                    style={{ backgroundColor: themeColors.secondary }}
                  >
                    🏥
                  </div>
                </div>
                <div className="preview-card-number" style={{ color: themeColors.secondary }}>
                  12
                </div>
                <p style={{ color: themeStyles.textSecondary }}>8 ocupados</p>
              </div>

              {/* Card 3 */}
              <div 
                className="preview-card"
                style={{
                  backgroundColor: themeStyles.cardBg,
                  border: `1px solid ${themeStyles.border}`,
                  boxShadow: `0 2px 4px ${themeStyles.shadow}`
                }}
              >
                <div className="preview-card-header">
                  <h5 style={{ color: themeStyles.text }}>Doctores</h5>
                  <div 
                    className="preview-card-icon"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    👩‍⚕️
                  </div>
                </div>
                <div className="preview-card-number" style={{ color: themeColors.primary }}>
                  18
                </div>
                <p style={{ color: themeStyles.textSecondary }}>15 disponibles</p>
              </div>
            </div>

            {/* Preview Button */}
            <div className="preview-actions">
              <button 
                className="preview-button primary"
                style={{
                  backgroundColor: themeColors.primary,
                  borderColor: themeColors.primary
                }}
              >
                Acción Primaria
              </button>
              <button 
                className="preview-button secondary"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: themeColors.secondary,
                  color: themeColors.secondary
                }}
              >
                Acción Secundaria
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="preview-info">
        <div className="color-swatches">
          <div className="color-swatch">
            <div 
              className="swatch-color"
              style={{ backgroundColor: themeColors.primary }}
            />
            <span>Primario: {themeColors.primary}</span>
          </div>
          <div className="color-swatch">
            <div 
              className="swatch-color"
              style={{ backgroundColor: themeColors.secondary }}
            />
            <span>Secundario: {themeColors.secondary}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .preview-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
        }

        .preview-panel-hidden {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--color-text-secondary, #a0aec0);
          gap: 1rem;
        }

        .preview-panel-hidden svg {
          font-size: 3rem;
          opacity: 0.5;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .preview-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          color: var(--color-text, #e2e8f0);
          font-size: 1.1rem;
        }

        .theme-indicator {
          padding: 0.5rem 1rem;
          background: var(--color-card-bg-secondary, #4a5568);
          border-radius: 6px;
          font-size: 0.85rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .preview-app {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          flex: 1;
          min-height: 400px;
          transition: all 0.3s ease;
        }

        .preview-app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          min-height: 60px;
        }

        .preview-logo-section {
          display: flex;
          align-items: center;
        }

        .preview-logo-img {
          max-height: 32px;
          max-width: 150px;
          object-fit: contain;
        }

        .preview-logo-text {
          font-weight: bold;
          font-size: 1.25rem;
        }

        .preview-user-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .preview-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 0.8rem;
        }

        .preview-content {
          display: flex;
          min-height: 300px;
        }

        .preview-sidebar {
          width: 200px;
          padding: 1rem 0;
        }

        .preview-nav-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0 0.5rem;
        }

        .preview-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preview-nav-item.active {
          color: white;
        }

        .preview-main {
          flex: 1;
          padding: 1.5rem;
        }

        .preview-page-header {
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }

        .preview-page-header h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1.25rem;
        }

        .preview-page-header p {
          margin: 0;
          font-size: 0.9rem;
        }

        .preview-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .preview-card {
          padding: 1.25rem;
          border-radius: 8px;
          transition: transform 0.2s ease;
        }

        .preview-card:hover {
          transform: translateY(-2px);
        }

        .preview-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .preview-card-header h5 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .preview-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .preview-card-number {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .preview-card p {
          margin: 0;
          font-size: 0.8rem;
        }

        .preview-actions {
          display: flex;
          gap: 0.75rem;
        }

        .preview-button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .preview-button.primary {
          color: white;
        }

        .preview-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .preview-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border, #4a5568);
        }

        .color-swatches {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .color-swatch {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .swatch-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        @media (max-width: 768px) {
          .preview-content {
            flex-direction: column;
          }

          .preview-sidebar {
            width: 100%;
          }

          .preview-nav-items {
            flex-direction: row;
            overflow-x: auto;
            padding: 0.5rem;
          }

          .preview-nav-item {
            flex-shrink: 0;
          }

          .preview-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PreviewPanel;