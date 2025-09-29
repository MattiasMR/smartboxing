// src/pages/PersonalizationPage.jsx
import React, { useState } from 'react';
import { FaPalette, FaMoon, FaSun, FaSave, FaUndo, FaEye, FaCompressArrowsAlt, FaExpandArrowsAlt } from 'react-icons/fa';
import PageHeader from '../components/layout/PageHeader';
import { useTheme } from '../hooks/useTheme';
import './PersonalizationPage.css';

const PersonalizationPage = () => {
  const { theme, updateTheme, resetTheme, toggleDarkMode, toggleCompactMode, isDefaultTheme, isLoading } = useTheme();
  const [saving, setSaving] = useState(false);

  console.log('🎨 [PersonalizationPage] Rendering with:', { theme, isLoading });

  // Función para generar colores automáticamente basados en el color principal
  const generateColorVariations = (baseColor) => {
    // Convertir hex a HSL para generar variaciones
    const hexToHsl = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return [h * 360, s * 100, l * 100];
    };
    
    const hslToHex = (h, s, l) => {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    
    const [h, s, l] = hexToHsl(baseColor);
    
    return {
      primary: baseColor,
      primaryDark: hslToHex(h, s, Math.max(l - 20, 10)),
      primaryLight: hslToHex(h, s, Math.min(l + 20, 90))
    };
  };

  const handleColorChange = (colorType, value) => {
    if (colorType === 'primaryColor') {
      const variations = generateColorVariations(value);
      updateTheme({
        primaryColor: variations.primary,
        primaryDark: variations.primaryDark,
        primaryLight: variations.primaryLight
      });
    } else {
      updateTheme({ [colorType]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Simular guardado (ya se guarda automáticamente en localStorage)
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const colorPresets = [
    { name: 'Verde Médico (Por defecto)', color: '#00796b' },
    { name: 'Azul Profesional', color: '#1976d2' },
    { name: 'Verde Esmeralda', color: '#00695c' },
    { name: 'Azul Océano', color: '#0277bd' },
    { name: 'Violeta Moderno', color: '#7b1fa2' },
    { name: 'Naranja Energético', color: '#f57c00' },
    { name: 'Rojo Vibrante', color: '#d32f2f' },
    { name: 'Índigo Profundo', color: '#303f9f' }
  ];

  if (isLoading) {
    console.log('🎨 [PersonalizationPage] Still loading theme...');
    return (
      <div className="page-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Cargando configuración del tema...</p>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
            Si esto toma mucho tiempo, revisa la consola del navegador
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Personalización"
        subtitle="Configura la apariencia de la aplicación"
        icon="🎨"
      />

      <div className="page-content">
        <div className="personalization-grid">
          
          {/* Configuración de Colores */}
          <div className="personalization-card">
            <div className="card-header">
              <FaPalette className="header-icon" />
              <h3>Colores del Tema</h3>
            </div>
            <div className="card-content">
              
              {/* Color Principal */}
              <div className="color-control">
                <label>Color Principal</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="color-text-input"
                    placeholder="#00796b"
                  />
                </div>
                <small>Este color se aplicará a botones, enlaces y elementos principales</small>
              </div>

              {/* Color Secundario */}
              <div className="color-control">
                <label>Color Secundario</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="color-text-input"
                    placeholder="#0277bd"
                  />
                </div>
                <small>Color para elementos secundarios y acentos</small>
              </div>

              {/* Presets de Colores */}
              <div className="color-presets">
                <label>Colores Predefinidos</label>
                <div className="presets-grid">
                  {colorPresets.map((preset, index) => (
                    <button
                      key={index}
                      className={`preset-button ${theme.primaryColor === preset.color ? 'active' : ''}`}
                      onClick={() => handleColorChange('primaryColor', preset.color)}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Configuración de Modo */}
          <div className="personalization-card">
            <div className="card-header">
              <FaEye className="header-icon" />
              <h3>Modo de Visualización</h3>
            </div>
            <div className="card-content">
              
              {/* Modo Oscuro */}
              <div className="toggle-control">
                <div className="toggle-info">
                  <h4>Modo Oscuro</h4>
                  <p>Reduce la fatiga visual en ambientes con poca luz</p>
                </div>
                <button
                  className={`toggle-button ${theme.darkMode ? 'active' : ''}`}
                  onClick={toggleDarkMode}
                >
                  {theme.darkMode ? <FaMoon /> : <FaSun />}
                  {theme.darkMode ? 'Oscuro' : 'Claro'}
                </button>
              </div>

              {/* Modo Compacto */}
              <div className="toggle-control">
                <div className="toggle-info">
                  <h4>Modo Compacto</h4>
                  <p>Reduce espaciados para mostrar más información</p>
                </div>
                <button
                  className={`toggle-button ${theme.compactMode ? 'active' : ''}`}
                  onClick={toggleCompactMode}
                >
                  {theme.compactMode ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
                  {theme.compactMode ? 'Compacto' : 'Normal'}
                </button>
              </div>

            </div>
          </div>

          {/* Vista Previa */}
          <div className="personalization-card preview-card">
            <div className="card-header">
              <FaEye className="header-icon" />
              <h3>Vista Previa</h3>
            </div>
            <div className="card-content">
              
              <div className="preview-container">
                <div className="preview-header" style={{ backgroundColor: theme.primaryColor }}>
                  <h4>SmartBoxing - Vista Previa</h4>
                </div>
                
                <div className="preview-content">
                  <div className="preview-buttons">
                    <button 
                      className="preview-btn primary" 
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      Botón Primario
                    </button>
                    <button 
                      className="preview-btn secondary" 
                      style={{ backgroundColor: theme.secondaryColor }}
                    >
                      Botón Secundario
                    </button>
                  </div>
                  
                  <div className="preview-info">
                    <div className="info-item">
                      <strong>Color Principal:</strong> {theme.primaryColor}
                    </div>
                    <div className="info-item">
                      <strong>Color Secundario:</strong> {theme.secondaryColor}
                    </div>
                    <div className="info-item">
                      <strong>Modo:</strong> {theme.darkMode ? 'Oscuro' : 'Claro'} 
                      {theme.compactMode ? ' • Compacto' : ' • Normal'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Botones de Acción */}
        <div className="action-buttons">
          <button
            className="action-btn save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <FaSave />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          <button
            className="action-btn reset-btn"
            onClick={resetTheme}
            disabled={isDefaultTheme()}
          >
            <FaUndo />
            Restaurar Valores por Defecto
          </button>
        </div>

      </div>
    </div>
  );
};

export default PersonalizationPage;