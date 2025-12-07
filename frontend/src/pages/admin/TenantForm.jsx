/**
 * Admin - Tenant Form (Create/Edit)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTenant, createTenant, updateTenant } from '../../api/admin.js';
import './AdminPages.css';

export default function TenantForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    maxUsers: 50,
    status: 'active',
    settings: {
      logo: '',
      primaryColor: '#3b82f6',
      timezone: 'America/Santiago',
      language: 'es',
    },
  });
  
  const [error, setError] = useState(null);
  
  // Load existing tenant if editing
  const { data: existingTenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: ['admin', 'tenants', id],
    queryFn: () => getTenant(id),
    enabled: isEditing,
  });
  
  useEffect(() => {
    if (existingTenant) {
      setFormData({
        name: existingTenant.name || '',
        slug: existingTenant.slug || '',
        description: existingTenant.description || '',
        contactEmail: existingTenant.contactEmail || '',
        contactPhone: existingTenant.contactPhone || '',
        address: existingTenant.address || '',
        maxUsers: existingTenant.maxUsers || 50,
        status: existingTenant.status || 'active',
        settings: {
          logo: existingTenant.settings?.logo || '',
          primaryColor: existingTenant.settings?.primaryColor || '#3b82f6',
          timezone: existingTenant.settings?.timezone || 'America/Santiago',
          language: existingTenant.settings?.language || 'es',
        },
      });
    }
  }, [existingTenant]);
  
  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      navigate('/admin/tenants');
    },
    onError: (err) => setError(err.message),
  });
  
  const updateMutation = useMutation({
    mutationFn: (data) => updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      navigate('/admin/tenants');
    },
    onError: (err) => setError(err.message),
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested settings
    if (name.startsWith('settings.')) {
      const settingKey = name.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Auto-generate slug from name if creating
    if (name === 'name' && !isEditing && !formData.slug) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    
    const dataToSend = isEditing 
      ? { 
          name: formData.name,
          description: formData.description,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          address: formData.address,
          maxUsers: parseInt(formData.maxUsers, 10),
          status: formData.status,
          settings: formData.settings,
        }
      : {
          ...formData,
          maxUsers: parseInt(formData.maxUsers, 10),
        };
    
    if (isEditing) {
      updateMutation.mutate(dataToSend);
    } else {
      createMutation.mutate(dataToSend);
    }
  };
  
  if (isLoadingTenant) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Cargando...</div>
      </div>
    );
  }
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isEditing ? '✏️ Editar Hospital' : '➕ Nuevo Hospital'}
          </h1>
          <p className="admin-page-subtitle">
            {isEditing 
              ? `Editando: ${existingTenant?.name}` 
              : 'Crea un nuevo hospital en el sistema'}
          </p>
        </div>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-body">
          {error && (
            <div className="admin-error-alert">{error}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-form-label">Nombre del Hospital *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="admin-form-input"
                  required
                  placeholder="Hospital San José"
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Slug (URL) *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="admin-form-input"
                  required
                  disabled={isEditing}
                  placeholder="hospital-san-jose"
                  pattern="[a-z0-9-]+"
                />
                <small className="admin-form-help">
                  Solo letras minúsculas, números y guiones
                </small>
              </div>
              
              <div className="admin-form-group admin-form-full">
                <label className="admin-form-label">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="admin-form-input"
                  rows={3}
                  placeholder="Descripción del hospital..."
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Email de Contacto</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="contacto@hospital.cl"
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Teléfono</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              
              <div className="admin-form-group admin-form-full">
                <label className="admin-form-label">Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="Av. Providencia 1234, Santiago"
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Máximo de Usuarios</label>
                <input
                  type="number"
                  name="maxUsers"
                  value={formData.maxUsers}
                  onChange={handleChange}
                  className="admin-form-input"
                  min={1}
                  max={1000}
                />
              </div>
              
              {isEditing && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Estado</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="admin-form-select"
                  >
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                  </select>
                </div>
              )}
            </div>
            
            <h3 className="admin-form-section-title">⚙️ Configuración</h3>
            
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-form-label">URL del Logo</label>
                <input
                  type="url"
                  name="settings.logo"
                  value={formData.settings.logo}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="https://..."
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Color Principal</label>
                <input
                  type="color"
                  name="settings.primaryColor"
                  value={formData.settings.primaryColor}
                  onChange={handleChange}
                  className="admin-form-color"
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Zona Horaria</label>
                <select
                  name="settings.timezone"
                  value={formData.settings.timezone}
                  onChange={handleChange}
                  className="admin-form-select"
                >
                  <option value="America/Santiago">Chile (Santiago)</option>
                  <option value="America/Lima">Perú (Lima)</option>
                  <option value="America/Bogota">Colombia (Bogotá)</option>
                  <option value="America/Mexico_City">México (CDMX)</option>
                  <option value="America/Buenos_Aires">Argentina (Buenos Aires)</option>
                </select>
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Idioma</label>
                <select
                  name="settings.language"
                  value={formData.settings.language}
                  onChange={handleChange}
                  className="admin-form-select"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => navigate('/admin/tenants')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isPending}
              >
                {isPending ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Hospital')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
