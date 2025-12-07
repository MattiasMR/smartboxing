/**
 * Admin - User Form (Create/Edit)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, createUser, updateUser, listTenants } from '../../api/admin.js';
import { useAuthContext, ROLES } from '../../auth/AuthContext.js';
import './AdminPages.css';

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // cognitoSub
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();
  const { isSuperAdmin, tenantId: currentTenantId, tenantName: currentTenantName } = useAuthContext();
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'staff',
    tenantId: currentTenantId || '',
    status: 'active',
  });
  
  const [error, setError] = useState(null);
  
  // Load tenants for selection (super_admin only)
  const { data: tenantsData } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: listTenants,
    enabled: isSuperAdmin(),
  });
  
  // Load existing user if editing
  const { data: existingUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => getUser(id),
    enabled: isEditing,
  });
  
  useEffect(() => {
    if (existingUser) {
      setFormData({
        email: existingUser.email || '',
        name: existingUser.name || '',
        role: existingUser.role || 'staff',
        tenantId: existingUser.tenantId || '',
        status: existingUser.status || 'active',
      });
    }
  }, [existingUser]);
  
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      navigate('/admin/users');
    },
    onError: (err) => setError(err.message),
  });
  
  const updateMutation = useMutation({
    mutationFn: (data) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      navigate('/admin/users');
    },
    onError: (err) => setError(err.message),
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    
    if (isEditing) {
      // Only send updatable fields
      updateMutation.mutate({
        name: formData.name,
        role: formData.role,
        status: formData.status,
      });
    } else {
      createMutation.mutate({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        ...(isSuperAdmin() && { tenantId: formData.tenantId }),
      });
    }
  };
  
  const tenants = tenantsData?.tenants || [];
  
  if (isLoadingUser) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Cargando...</div>
      </div>
    );
  }
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  // Available roles based on current user's role
  const availableRoles = isSuperAdmin()
    ? [
        { value: 'tenant_admin', label: 'Administrador de Organización' },
        { value: 'staff', label: 'Staff' },
      ]
    : [
        { value: 'staff', label: 'Staff' },
      ];
  
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isEditing ? '✏️ Editar Usuario' : '➕ Crear Usuario'}
          </h1>
          <p className="admin-page-subtitle">
            {isEditing 
              ? `Editando: ${existingUser?.email}` 
              : 'Crea un nuevo usuario para la organización'}
          </p>
        </div>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-body">
          {error && (
            <div className="admin-error-alert">{error}</div>
          )}
          
          {!isEditing && (
            <div className="admin-info-alert">
              ℹ️ El usuario recibirá un correo con instrucciones para establecer su contraseña.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label className="admin-form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="admin-form-input"
                  required
                  disabled={isEditing}
                  placeholder="usuario@organizacion.cl"
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Nombre Completo *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="admin-form-input"
                  required
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              
              {isSuperAdmin() && !isEditing && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Organización *</label>
                  <select
                    name="tenantId"
                    value={formData.tenantId}
                    onChange={handleChange}
                    className="admin-form-select"
                    required
                  >
                    <option value="">Selecciona una organización</option>
                    {tenants
                      .filter(t => t.status === 'active')
                      .map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))
                    }
                  </select>
                </div>
              )}
              
              {!isSuperAdmin() && !isEditing && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Organización</label>
                  <input
                    type="text"
                    value={currentTenantName || 'Organización actual'}
                    className="admin-form-input"
                    disabled
                  />
                </div>
              )}
              
              <div className="admin-form-group">
                <label className="admin-form-label">Rol</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="admin-form-select"
                >
                  {availableRoles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <small className="admin-form-help">
                  {formData.role === 'tenant_admin' 
                    ? 'Puede gestionar usuarios y configuración de la organización'
                    : 'Acceso básico al sistema (boxes, citas, pacientes)'}
                </small>
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
                    <option value="disabled">Deshabilitado</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => navigate('/admin/users')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isPending}
              >
                {isPending 
                  ? 'Guardando...' 
                  : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
