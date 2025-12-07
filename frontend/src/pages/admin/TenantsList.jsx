/**
 * Admin - Tenants List Page
 * List and manage all hospitals/tenants (super_admin only)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { listTenants, deleteTenant } from '../../api/admin.js';
import './AdminPages.css';

export default function TenantsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: listTenants,
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      setDeleteConfirm(null);
    },
  });
  
  const tenants = data?.tenants || [];
  
  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Cargando hospitales...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          Error al cargar hospitales: {error.message}
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">🏢 Hospitales</h1>
          <p className="admin-page-subtitle">
            Gestiona los hospitales registrados en el sistema
          </p>
        </div>
        <Link to="/admin/tenants/new" className="admin-btn admin-btn-primary">
          + Nuevo Hospital
        </Link>
      </div>
      
      {tenants.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div className="admin-empty-state-icon">🏥</div>
            <h3 className="admin-empty-state-title">No hay hospitales</h3>
            <p className="admin-empty-state-description">
              Crea el primer hospital para comenzar a usar el sistema.
            </p>
            <Link to="/admin/tenants/new" className="admin-btn admin-btn-primary">
              Crear Hospital
            </Link>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Slug</th>
                <th>Usuarios</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div className="tenant-name-cell">
                      {tenant.settings?.logo && (
                        <img 
                          src={tenant.settings.logo} 
                          alt="" 
                          className="tenant-logo-small"
                        />
                      )}
                      <div>
                        <strong>{tenant.name}</strong>
                        {tenant.contactEmail && (
                          <div className="tenant-email">{tenant.contactEmail}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="tenant-slug">{tenant.slug}</code>
                  </td>
                  <td>{tenant.userCount || 0}</td>
                  <td>
                    <span className={`admin-badge admin-badge-${
                      tenant.status === 'active' ? 'success' : 
                      tenant.status === 'suspended' ? 'warning' : 'danger'
                    }`}>
                      {tenant.status === 'active' ? 'Activo' : 
                       tenant.status === 'suspended' ? 'Suspendido' : 'Eliminado'}
                    </span>
                  </td>
                  <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => navigate(`/admin/tenants/${tenant.id}/edit`)}
                      >
                        Editar
                      </button>
                      {tenant.status !== 'deleted' && (
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setDeleteConfirm(tenant)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>¿Eliminar hospital?</h3>
            <p>
              Estás a punto de eliminar <strong>{deleteConfirm.name}</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div className="admin-modal-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
