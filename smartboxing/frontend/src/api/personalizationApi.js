// src/api/personalizationApi.js
import apiClient from './axiosConfig';

/**
 * API para gestión de personalización del sistema
 * Conecta con los endpoints del backend ya implementados
 */
export const PersonalizationAPI = {
  
  /**
   * Obtiene las configuraciones actuales (merge de cliente + usuario)
   * Utiliza el endpoint GET /personalization ya implementado
   */
  async getCurrentSettings() {
    try {
      console.log('📡 Fetching current personalization settings...');
      const response = await apiClient.get('/personalization');
      console.log('✅ Current settings received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching current settings:', error);
      throw new Error('No se pudieron cargar las configuraciones actuales');
    }
  },

  /**
   * Actualiza las configuraciones del cliente (solo admin)
   * Utiliza el endpoint PUT /personalization/client ya implementado
   */
  async updateClientSettings(settings) {
    try {
      console.log('📡 Updating client settings:', settings);
      
      // Validar que tenemos al menos un campo para actualizar
      const validFields = ['primaryColor', 'secondaryColor', 'logoUrl', 'companyName'];
      const hasValidField = validFields.some(field => settings.hasOwnProperty(field));
      
      if (!hasValidField) {
        throw new Error('Al menos un campo de configuración del cliente es requerido');
      }

      const response = await apiClient.put('/personalization/client', settings);
      console.log('✅ Client settings updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating client settings:', error);
      
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para modificar las configuraciones del cliente');
      } else if (error.response?.status === 400) {
        throw new Error('Datos de configuración inválidos');
      }
      
      throw new Error('Error al actualizar las configuraciones del cliente');
    }
  },

  /**
   * Actualiza las configuraciones del usuario actual
   * Utiliza el endpoint PUT /personalization/me ya implementado
   */
  async updateUserSettings(settings) {
    try {
      console.log('📡 Updating user settings:', settings);
      
      // Validar que tenemos al menos un campo para actualizar
      const validFields = ['theme', 'darkModeEnabled', 'lightThemeColors', 'darkThemeColors', 'language', 'dateFormat', 'timeFormat'];
      const hasValidField = validFields.some(field => settings.hasOwnProperty(field));
      
      if (!hasValidField) {
        throw new Error('Al menos un campo de configuración del usuario es requerido');
      }

      const response = await apiClient.put('/personalization/me', settings);
      console.log('✅ User settings updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user settings:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Datos de configuración inválidos');
      }
      
      throw new Error('Error al actualizar las configuraciones del usuario');
    }
  },

  /**
   * Sube un nuevo logo (funcionalidad futura)
   * TODO: Implementar cuando se decida el método de almacenamiento (S3 vs Base64)
   */
  async uploadLogo(file) {
    try {
      console.log('📡 Uploading logo file:', file.name);
      
      // Validaciones básicas
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB
        throw new Error('El archivo debe ser menor a 2MB');
      }

      // TODO: Decidir implementación
      // Opción A: Convertir a Base64 y almacenar en DynamoDB
      const base64 = await this.convertFileToBase64(file);
      
      // Actualizar configuración del cliente con el logo base64
      return await this.updateClientSettings({
        logoUrl: base64
      });
      
      // Opción B: Implementar endpoint para S3 presigned URLs
      // const formData = new FormData();
      // formData.append('logo', file);
      // const response = await apiClient.post('/personalization/upload-logo', formData);
      // return response.data;
      
    } catch (error) {
      console.error('❌ Error uploading logo:', error);
      throw error;
    }
  },

  /**
   * Convierte un archivo a Base64 (helper para upload de logo)
   */
  convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Aplica las configuraciones de tema al DOM
   * Actualiza las CSS variables globales
   */
  applyThemeToDOM(settings) {
    try {
      console.log('🎨 Applying theme to DOM:', settings);
      
      const root = document.documentElement;
      const currentTheme = settings.theme || 'dark';
      
      // Aplicar colores según el tema actual
      if (currentTheme === 'dark' && settings.darkThemeColors) {
        root.style.setProperty('--color-primary', settings.darkThemeColors.primary);
        root.style.setProperty('--color-secondary', settings.darkThemeColors.secondary);
      } else if (currentTheme === 'light' && settings.lightThemeColors) {
        root.style.setProperty('--color-primary', settings.lightThemeColors.primary);
        root.style.setProperty('--color-secondary', settings.lightThemeColors.secondary);
      }
      
      // Aplicar colores globales si están definidos
      if (settings.primaryColor) {
        root.style.setProperty('--color-primary', settings.primaryColor);
      }
      
      if (settings.secondaryColor) {
        root.style.setProperty('--color-secondary', settings.secondaryColor);
      }
      
      // Agregar clase del tema al body
      document.body.className = document.body.className.replace(/theme-\w+/, '');
      document.body.classList.add(`theme-${currentTheme}`);
      
      console.log('✅ Theme applied successfully');
    } catch (error) {
      console.error('❌ Error applying theme to DOM:', error);
    }
  },

  /**
   * Obtiene la configuración por defecto
   */
  getDefaultSettings() {
    return {
      // Client settings
      primaryColor: '#0ea5e9',
      secondaryColor: '#0369a1',
      logoUrl: null,
      companyName: 'SmartBoxing',
      
      // User settings
      theme: 'dark',
      darkModeEnabled: true,
      lightThemeColors: {
        primary: '#0ea5e9',
        secondary: '#0369a1'
      },
      darkThemeColors: {
        primary: '#3b82f6',
        secondary: '#1d4ed8'
      },
      language: 'es-ES',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    };
  }
};

export default PersonalizationAPI;