// src/components/personalization/ColorPicker.jsx
import React, { useState } from 'react';
import { FaPalette, FaEyeDropper, FaUndo } from 'react-icons/fa';

const ColorPicker = ({ settings, onChange }) => {
  const [activeColorType, setActiveColorType] = useState('primary');
  const [activeTheme, setActiveTheme] = useState(settings.theme || 'dark');

  // Colores predefinidos
  const presetColors = {
    blues: ['#0ea5e9', '#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
    greens: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
    purples: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
    reds: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
    oranges: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
    pinks: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843']
  };

  const getCurrentColors = () => {
    if (activeTheme === 'light') {
      return settings.lightThemeColors || { primary: '#0ea5e9', secondary: '#0369a1' };
    } else {
      return settings.darkThemeColors || { primary: '#3b82f6', secondary: '#1d4ed8' };
    }
  };

  const handleColorChange = (colorType, color) => {
    const currentColors = getCurrentColors();
    const updatedColors = {
      ...currentColors,
      [colorType]: color
    };

    const settingsKey = activeTheme === 'light' ? 'lightThemeColors' : 'darkThemeColors';
    onChange(settingsKey, updatedColors);
  };

  const handleManualColorChange = (colorType, event) => {
    const color = event.target.value;
    handleColorChange(colorType, color);
  };

  const resetColorsToDefault = () => {
    const defaultColors = activeTheme === 'light' 
      ? { primary: '#0ea5e9', secondary: '#0369a1' }
      : { primary: '#3b82f6', secondary: '#1d4ed8' };
    
    const settingsKey = activeTheme === 'light' ? 'lightThemeColors' : 'darkThemeColors';
    onChange(settingsKey, defaultColors);
  };

  const currentColors = getCurrentColors();

  return (
    <div className="color-picker">
      <div className="color-picker-header">
        <h3><FaPalette /> Configuración de Colores</h3>
        <p>Personaliza los colores del sistema para cada tema.</p>
      </div>

      {/* Theme Selector */}
      <div className="theme-selector">
        <label>Configurar colores para:</label>
        <div className="theme-buttons">
          <button
            className={`theme-btn ${activeTheme === 'light' ? 'active' : ''}`}
            onClick={() => setActiveTheme('light')}
          >
            🌞 Modo Claro
          </button>
          <button
            className={`theme-btn ${activeTheme === 'dark' ? 'active' : ''}`}
            onClick={() => setActiveTheme('dark')}
          >
            🌙 Modo Oscuro
          </button>
        </div>
      </div>

      {/* Color Type Selector */}
      <div className="color-type-selector">
        <div className="color-type-buttons">
          <button
            className={`color-type-btn ${activeColorType === 'primary' ? 'active' : ''}`}
            onClick={() => setActiveColorType('primary')}
          >
            Color Primario
            <div 
              className="color-preview"
              style={{ backgroundColor: currentColors.primary }}
            />
          </button>
          <button
            className={`color-type-btn ${activeColorType === 'secondary' ? 'active' : ''}`}
            onClick={() => setActiveColorType('secondary')}
          >
            Color Secundario
            <div 
              className="color-preview"
              style={{ backgroundColor: currentColors.secondary }}
            />
          </button>
        </div>
      </div>

      {/* Current Color Display */}
      <div className="current-color-display">
        <label>Color {activeColorType === 'primary' ? 'Primario' : 'Secundario'} Actual:</label>
        <div className="current-color-info">
          <div 
            className="current-color-circle"
            style={{ backgroundColor: currentColors[activeColorType] }}
          />
          <span className="current-color-hex">{currentColors[activeColorType]}</span>
        </div>
      </div>

      {/* Manual Color Input */}
      <div className="manual-color-input">
        <label>
          <FaEyeDropper /> Color Manual (Hex):
        </label>
        <input
          type="color"
          value={currentColors[activeColorType]}
          onChange={(e) => handleManualColorChange(activeColorType, e)}
          className="color-input"
        />
        <input
          type="text"
          value={currentColors[activeColorType]}
          onChange={(e) => handleManualColorChange(activeColorType, e)}
          className="hex-input"
          placeholder="#3b82f6"
          pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
        />
      </div>

      {/* Preset Colors */}
      <div className="preset-colors">
        <label>Colores Predefinidos:</label>
        {Object.entries(presetColors).map(([categoryName, colors]) => (
          <div key={categoryName} className="color-category">
            <span className="category-name">{categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</span>
            <div className="color-row">
              {colors.map(color => (
                <button
                  key={color}
                  className={`preset-color ${currentColors[activeColorType] === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(activeColorType, color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="color-picker-actions">
        <button
          className="reset-colors-btn"
          onClick={resetColorsToDefault}
        >
          <FaUndo /> Restaurar por Defecto
        </button>
      </div>

      <style jsx>{`
        .color-picker {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .color-picker-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.5rem 0;
          color: var(--color-text, #e2e8f0);
          font-size: 1.1rem;
        }

        .color-picker-header p {
          margin: 0;
          color: var(--color-text-secondary, #a0aec0);
          font-size: 0.9rem;
        }

        .theme-selector label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .theme-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .theme-btn {
          flex: 1;
          padding: 0.75rem;
          background: var(--color-card-bg-secondary, #4a5568);
          border: 1px solid var(--color-border, #4a5568);
          color: var(--color-text, #e2e8f0);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .theme-btn:hover {
          background: var(--color-hover, #4a5568);
        }

        .theme-btn.active {
          background: var(--color-primary, #3b82f6);
          border-color: var(--color-primary, #3b82f6);
          color: white;
        }

        .color-type-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .color-type-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--color-card-bg-secondary, #4a5568);
          border: 1px solid var(--color-border, #4a5568);
          color: var(--color-text, #e2e8f0);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .color-type-btn:hover {
          background: var(--color-hover, #4a5568);
        }

        .color-type-btn.active {
          background: var(--color-primary, #3b82f6);
          border-color: var(--color-primary, #3b82f6);
          color: white;
        }

        .color-preview {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
        }

        .current-color-display {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .current-color-display label {
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .current-color-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .current-color-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
        }

        .current-color-hex {
          font-family: monospace;
          font-size: 1rem;
          color: var(--color-text, #e2e8f0);
          background: var(--color-card-bg-secondary, #4a5568);
          padding: 0.5rem;
          border-radius: 4px;
        }

        .manual-color-input {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .manual-color-input label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .color-input {
          width: 60px;
          height: 40px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .hex-input {
          flex: 1;
          padding: 0.75rem;
          background: var(--color-card-bg-secondary, #4a5568);
          border: 1px solid var(--color-border, #4a5568);
          color: var(--color-text, #e2e8f0);
          border-radius: 6px;
          font-family: monospace;
        }

        .preset-colors label {
          display: block;
          margin-bottom: 1rem;
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .color-category {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .category-name {
          font-size: 0.85rem;
          color: var(--color-text-secondary, #a0aec0);
          text-transform: capitalize;
        }

        .color-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .preset-color {
          width: 32px;
          height: 32px;
          border: 2px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preset-color:hover {
          transform: scale(1.1);
          border-color: white;
        }

        .preset-color.selected {
          border-color: white;
          box-shadow: 0 0 0 2px var(--color-primary, #3b82f6);
        }

        .color-picker-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border, #4a5568);
        }

        .reset-colors-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid var(--color-border, #4a5568);
          color: var(--color-text-secondary, #a0aec0);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .reset-colors-btn:hover {
          background: var(--color-warning, #f59e0b);
          color: white;
          border-color: var(--color-warning, #f59e0b);
        }
      `}</style>
    </div>
  );
};

export default ColorPicker;