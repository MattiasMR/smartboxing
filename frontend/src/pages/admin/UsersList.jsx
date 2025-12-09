/**
 * Admin - Users List Page
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { listUsers, deleteUser, listTenants } from '../../api/admin.js';
import { useAuthContext } from '../../auth/AuthContext.js';
import './AdminPages.css';

export default function UsersList() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuthContext();
  
  const isGlobalView = location.pathname.includes('users-global');
  const basePath = isGlobalView ? '/admin/users-global' : '/admin/users';
  
  const [selectedTenant, setSelectedTenant] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Load tenants for filter (super_admin only)
  const { data: tenantsData } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: listTenants,
    enabled: isSuperAdmin(),
  });
  
  // Load users
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', selectedTenant],
    queryFn: () => listUsers(selectedTenant || null),
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      // Find the user to get their tenantId
      const userToDelete = users.find(u => u.cognitoSub === id);
      const tenantId = userToDelete?.tenantId || selectedTenant;
      return deleteUser(id, tenantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeleteConfirm(null);
    },
  });
  
  const users = data?.users || [];
  const tenants = tenantsData?.tenants || [];
  
  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Cargando usuarios...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          Error al cargar usuarios: {error.message}
        </div>
      </div>
    );
  }
  
  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return <span className="admin-badge admin-badge-info">🔑 Super Admin</span>;
      case 'tenant_admin':
        return <span className="admin-badge admin-badge-warning">👤 Admin</span>;
      default:
        return <span className="admin-badge admin-badge-success">👥 Staff</span>;
    }
  };
  
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">👥 Usuarios</h1>
          <p className="admin-page-subtitle">
            Gestiona los usuarios de la organización
          </p>
        </div>
        <Link to={`${basePath}/new`} className="admin-btn admin-btn-primary">
          + Crear Usuario
        </Link>
      </div>
      
      {/* Filters */}
      {isSuperAdmin() && tenants.length > 0 && (
        <div className="admin-filters">
          <select
            className="admin-form-select"
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
          >
            <option value="">Todas las organizaciones</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {users.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div className="admin-empty-state-icon">👤</div>
            <h3 className="admin-empty-state-title">No hay usuarios</h3>
            <p className="admin-empty-state-description">
              Crea el primer usuario para la organización.
            </p>
            <Link to="/admin/users/new" className="admin-btn admin-btn-primary">
              Crear Usuario
            </Link>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                {isSuperAdmin() && <th>Organización</th>}
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.cognitoSub}>
                  <td>
                    <div>
                      <strong>{user.name}</strong>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  {isSuperAdmin() && <td>{user.tenantName || '-'}</td>}
                  <td>
                    <span className={`admin-badge admin-badge-${
                      user.status === 'active' ? 'success' : 'danger'
                    }`}>
                      {user.status === 'active' ? 'Activo' : 'Deshabilitado'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => {
                          const tenantParam = user.tenantId ? `?tenantId=${user.tenantId}` : '';
                          navigate(`${basePath}/${user.cognitoSub}/edit${tenantParam}`);
                        }}
                      >
                        Editar
                      </button>
                      {user.role !== 'super_admin' && (
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setDeleteConfirm(user)}
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
            <h3>¿Eliminar usuario?</h3>
            <p>
              Estás a punto de eliminar a <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email}).
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
                onClick={() => deleteMutation.mutate(deleteConfirm.cognitoSub)}
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
