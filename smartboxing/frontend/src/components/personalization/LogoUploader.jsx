// src/components/personalization/LogoUploader.jsx
import React, { useState, useRef } from 'react';
import { FaImage, FaUpload, FaTrash, FaEye } from 'react-icons/fa';
import { PersonalizationAPI } from '../../api/personalizationApi';

const LogoUploader = ({ settings, onChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(settings.logoUrl);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (files) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo debe ser menor a 2MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadLogo(file);
  };

  const uploadLogo = async (file) => {
    try {
      setUploading(true);
      console.log('📤 Uploading logo:', file.name);
      
      // Convert to base64 and update settings
      const base64 = await PersonalizationAPI.convertFileToBase64(file);
      onChange('logoUrl', base64);
      
      console.log('✅ Logo uploaded successfully');
    } catch (error) {
      console.error('❌ Error uploading logo:', error);
      alert('Error al subir el logo. Por favor intente nuevamente.');
      // Restore previous preview on error
      setPreviewUrl(settings.logoUrl);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelect(files);
  };

  const removeLogo = () => {
    if (window.confirm('¿Está seguro que desea eliminar el logo actual?')) {
      setPreviewUrl(null);
      onChange('logoUrl', null);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="logo-uploader">
      <div className="logo-uploader-header">
        <h3><FaImage /> Configuración del Logo</h3>
        <p>Sube el logo de tu organización que aparecerá en el sistema.</p>
      </div>

      {/* Current Logo Display */}
      {previewUrl && (
        <div className="current-logo-section">
          <label>Logo Actual:</label>
          <div className="current-logo-container">
            <div className="current-logo">
              <img 
                src={previewUrl} 
                alt="Logo actual"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="logo-error" style={{ display: 'none' }}>
                <FaImage />
                <span>Error cargando imagen</span>
              </div>
            </div>
            <div className="current-logo-actions">
              <button
                className="preview-btn"
                onClick={() => window.open(previewUrl, '_blank')}
              >
                <FaEye /> Ver Completo
              </button>
              <button
                className="remove-btn"
                onClick={removeLogo}
              >
                <FaTrash /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="upload-section">
        <label>Subir Nuevo Logo:</label>
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          <div className="upload-content">
            <FaUpload className="upload-icon" />
            <div className="upload-text">
              {uploading ? (
                <>
                  <strong>Subiendo archivo...</strong>
                  <span>Por favor espere</span>
                </>
              ) : (
                <>
                  <strong>Haz clic aquí o arrastra una imagen</strong>
                  <span>PNG, JPG o SVG - Máximo 2MB</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logo Guidelines */}
      <div className="logo-guidelines">
        <h4>📏 Recomendaciones para el Logo:</h4>
        <ul>
          <li><strong>Formato:</strong> PNG con fondo transparente (recomendado) o JPG</li>
          <li><strong>Dimensiones:</strong> 200x40px a 400x80px (relación 5:1 aproximadamente)</li>
          <li><strong>Tamaño:</strong> Máximo 2MB</li>
          <li><strong>Calidad:</strong> Alta resolución para pantallas retina</li>
          <li><strong>Diseño:</strong> Simple y legible en fondos claros y oscuros</li>
        </ul>
      </div>

      {/* Company Name Setting */}
      <div className="company-name-section">
        <label htmlFor="companyName">Nombre de la Organización:</label>
        <input
          id="companyName"
          type="text"
          value={settings.companyName || ''}
          onChange={(e) => onChange('companyName', e.target.value)}
          placeholder="SmartBoxing"
          className="company-name-input"
          maxLength={50}
        />
        <small>Se mostrará como texto alternativo si no hay logo</small>
      </div>

      <style jsx>{`
        .logo-uploader {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .logo-uploader-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.5rem 0;
          color: var(--color-text, #e2e8f0);
          font-size: 1.1rem;
        }

        .logo-uploader-header p {
          margin: 0;
          color: var(--color-text-secondary, #a0aec0);
          font-size: 0.9rem;
        }

        .current-logo-section label {
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .current-logo-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .current-logo {
          position: relative;
          width: 100%;
          max-width: 300px;
          height: 80px;
          background: white;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .current-logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .logo-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .current-logo-actions {
          display: flex;
          gap: 0.5rem;
        }

        .preview-btn, .remove-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--color-border, #4a5568);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-size: 0.85rem;
        }

        .preview-btn {
          background: var(--color-secondary, #1d4ed8);
          color: white;
          border-color: var(--color-secondary, #1d4ed8);
        }

        .preview-btn:hover {
          background: var(--color-secondary-dark, #1e40af);
        }

        .remove-btn {
          background: transparent;
          color: var(--color-text-secondary, #a0aec0);
        }

        .remove-btn:hover {
          background: var(--color-error, #dc2626);
          color: white;
          border-color: var(--color-error, #dc2626);
        }

        .upload-section label {
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .upload-area {
          border: 2px dashed var(--color-border, #4a5568);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--color-card-bg-secondary, #4a5568);
        }

        .upload-area:hover {
          border-color: var(--color-primary, #3b82f6);
          background: var(--color-hover, #4a5568);
        }

        .upload-area.drag-active {
          border-color: var(--color-primary, #3b82f6);
          background: var(--color-primary-light, rgba(59, 130, 246, 0.1));
        }

        .upload-area.uploading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .upload-icon {
          font-size: 2rem;
          color: var(--color-primary, #3b82f6);
        }

        .upload-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .upload-text strong {
          color: var(--color-text, #e2e8f0);
        }

        .upload-text span {
          color: var(--color-text-secondary, #a0aec0);
          font-size: 0.85rem;
        }

        .logo-guidelines {
          background: var(--color-info-bg, rgba(59, 130, 246, 0.1));
          border: 1px solid var(--color-info, #3b82f6);
          border-radius: 8px;
          padding: 1rem;
        }

        .logo-guidelines h4 {
          margin: 0 0 0.75rem 0;
          color: var(--color-text, #e2e8f0);
          font-size: 0.95rem;
        }

        .logo-guidelines ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        .logo-guidelines li {
          color: var(--color-text-secondary, #a0aec0);
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
        }

        .logo-guidelines strong {
          color: var(--color-text, #e2e8f0);
        }

        .company-name-section label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--color-text, #e2e8f0);
        }

        .company-name-input {
          width: 100%;
          padding: 0.75rem;
          background: var(--color-card-bg-secondary, #4a5568);
          border: 1px solid var(--color-border, #4a5568);
          color: var(--color-text, #e2e8f0);
          border-radius: 6px;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
        }

        .company-name-input:focus {
          outline: none;
          border-color: var(--color-primary, #3b82f6);
        }

        .company-name-section small {
          color: var(--color-text-secondary, #a0aec0);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default LogoUploader;