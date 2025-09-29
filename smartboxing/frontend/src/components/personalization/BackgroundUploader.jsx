// src/components/personalization/BackgroundUploader.jsx
import React, { useState, useRef } from 'react';
import { FaUpload, FaImage, FaUndo, FaCheck, FaSpinner } from 'react-icons/fa';
import { 
  validateImage, 
  resizeImage, 
  fileToBase64, 
  createPreview,
  saveImageToStorage,
  loadImageFromStorage,
  removeImageFromStorage,
  IMAGE_STORAGE_KEYS,
  DEFAULT_IMAGES
} from '../../utils/imageUtils';

const BackgroundUploader = () => {
  const [currentBackground, setCurrentBackground] = useState(() => {
    return loadImageFromStorage(IMAGE_STORAGE_KEYS.LOGIN_BACKGROUND) || DEFAULT_IMAGES.LOGIN_BACKGROUND;
  });
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Cargar imagen actual al montar
  React.useEffect(() => {
    const savedBackground = loadImageFromStorage(IMAGE_STORAGE_KEYS.LOGIN_BACKGROUND);
    if (savedBackground) {
      setCurrentBackground(savedBackground);
    }
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setIsUploading(true);

    try {
      // Validar archivo
      const validation = validateImage(file, 5); // 5MB máximo para backgrounds
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      // Redimensionar imagen (background más grande)
      const resizedBlob = await resizeImage(file, 1920, 1080, 0.8);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      
      // Convertir a base64
      const base64 = await fileToBase64(resizedFile);
      
      // Crear vista previa más pequeña
      const previewUrl = await createPreview(base64, 300, 200);
      setPreview({ original: base64, preview: previewUrl });

    } catch (err) {
      console.error('Error processing image:', err);
      setError('Error al procesar la imagen. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyBackground = async () => {
    if (!preview) return;

    setIsUploading(true);
    setError(null);

    try {
      // Guardar en localStorage (puede ser grande, usar compresión mayor)
      const saved = await saveImageToStorage(IMAGE_STORAGE_KEYS.LOGIN_BACKGROUND, preview.original, 1000); // 1MB max
      
      if (saved) {
        setCurrentBackground(preview.original);
        setPreview(null);
        setSuccess(true);
        
        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(false), 3000);
        
        // Limpiar input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError('Error al guardar la imagen. Intenta con una imagen más pequeña o de menor calidad.');
      }
    } catch (err) {
      console.error('Error saving background:', err);
      setError('Error al guardar la imagen de fondo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetBackground = () => {
    removeImageFromStorage(IMAGE_STORAGE_KEYS.LOGIN_BACKGROUND);
    setCurrentBackground(DEFAULT_IMAGES.LOGIN_BACKGROUND);
    setPreview(null);
    setError(null);
    setSuccess(true);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isCustomBackground = currentBackground !== DEFAULT_IMAGES.LOGIN_BACKGROUND;

  return (
    <div className="background-uploader" style={styles.container}>
      <div className="background-uploader-header">
        <h3 style={styles.title}>
          <FaImage style={styles.headerIcon} />
          Imagen de Fondo del Login
        </h3>
        <p style={styles.description}>
          Personaliza la imagen de fondo de la página de inicio de sesión. Recomendado: 1920x1080px, máximo 5MB.
        </p>
      </div>

      <div className="background-uploader-content">
        {/* Vista previa actual */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Fondo Actual</h4>
          <div style={styles.previewContainer}>
            <img 
              src={currentBackground.startsWith('data:') ? currentBackground : currentBackground} 
              alt="Fondo actual" 
              style={styles.backgroundPreview}
              onError={(e) => {
                e.target.src = DEFAULT_IMAGES.LOGIN_BACKGROUND;
              }}
            />
            {isCustomBackground && (
              <div style={styles.badge}>Personalizado</div>
            )}
          </div>
        </div>

        {/* Nueva imagen en vista previa */}
        {preview && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Vista Previa</h4>
            <div style={styles.previewContainer}>
              <img 
                src={preview.preview} 
                alt="Vista previa del nuevo fondo" 
                style={styles.backgroundPreview}
              />
              <div style={{...styles.badge, backgroundColor: 'var(--secondary-color)'}}>Nuevo</div>
            </div>
          </div>
        )}

        {/* Controles de subida */}
        <div style={styles.controls}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={styles.fileInput}
            id="background-file-input"
            disabled={isUploading}
          />
          
          <label 
            htmlFor="background-file-input" 
            style={{
              ...styles.uploadButton,
              ...(isUploading ? styles.uploadButtonDisabled : {})
            }}
          >
            {isUploading ? (
              <>
                <FaSpinner style={styles.spinIcon} />
                Procesando...
              </>
            ) : (
              <>
                <FaUpload style={styles.buttonIcon} />
                Seleccionar Imagen
              </>
            )}
          </label>

          {preview && (
            <div style={styles.previewActions}>
              <button 
                onClick={handleApplyBackground}
                style={styles.applyButton}
                disabled={isUploading}
              >
                <FaCheck style={styles.buttonIcon} />
                Aplicar Fondo
              </button>
              <button 
                onClick={handleCancelPreview}
                style={styles.cancelButton}
                disabled={isUploading}
              >
                Cancelar
              </button>
            </div>
          )}

          {isCustomBackground && !preview && (
            <button 
              onClick={handleResetBackground}
              style={styles.resetButton}
              disabled={isUploading}
            >
              <FaUndo style={styles.buttonIcon} />
              Restaurar Original
            </button>
          )}
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successMessage}>
            <FaCheck style={styles.buttonIcon} />
            Imagen de fondo actualizada correctamente
          </div>
        )}

        {/* Información adicional */}
        <div style={styles.info}>
          <h5 style={styles.infoTitle}>Recomendaciones:</h5>
          <ul style={styles.infoList}>
            <li>Formato: PNG, JPG o WebP</li>
            <li>Tamaño recomendado: 1920x1080 píxeles (Full HD)</li>
            <li>Tamaño máximo: 5MB</li>
            <li>Imágenes con buena iluminación y contraste</li>
            <li>Evitar imágenes muy ocupadas o con mucho detalle</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Estilos inline
const styles = {
  container: {
    padding: '24px',
    backgroundColor: 'var(--background-primary)',
    border: '1px solid var(--border-secondary)',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  headerIcon: {
    color: 'var(--primary-color)',
    fontSize: '16px'
  },
  description: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  previewContainer: {
    position: 'relative',
    display: 'inline-block'
  },
  backgroundPreview: {
    width: '300px',
    height: '200px',
    objectFit: 'cover',
    border: '2px solid var(--border-secondary)',
    borderRadius: '8px',
    backgroundColor: 'var(--background-secondary)'
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '12px'
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  },
  fileInput: {
    display: 'none'
  },
  uploadButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none'
  },
  uploadButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  previewActions: {
    display: 'flex',
    gap: '12px'
  },
  applyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    backgroundColor: 'var(--success-color)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--background-secondary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-secondary)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  resetButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    backgroundColor: 'var(--background-secondary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-secondary)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  buttonIcon: {
    fontSize: '12px'
  },
  spinIcon: {
    fontSize: '12px',
    animation: 'spin 1s linear infinite'
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px'
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4caf50',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px'
  },
  info: {
    backgroundColor: 'var(--background-secondary)',
    padding: '16px',
    borderRadius: '8px'
  },
  infoTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  infoList: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  }
};

export default BackgroundUploader;