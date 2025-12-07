/**
 * My Tenancies Page
 * Shows user's tenants (where they are admin) and their tenancy requests
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserTenancies, listTenancyRequests, switchTenant } from '../../api/tenancy.js';
import { useAuth } from '../../auth/useAuth.js';
import './TenancyPages.css';

export default function MyTenancies() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null);
  const [switchingTenantId, setSwitchingTenantId] = useState(null);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Get user's tenancies
  const { data: tenanciesData, isLoading: loadingTenancies } = useQuery({
    queryKey: ['tenancy', 'my-tenancies'],
    queryFn: getUserTenancies,
  });

  // Get user's requests (only their own, even for super_admin)
  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['tenancy', 'my-requests'],
    queryFn: () => listTenancyRequests({ onlyMine: true }),
  });

  // Switch tenant mutation - navigates to dashboard after switch
  const switchMutation = useMutation({
    mutationFn: switchTenant,
    onSuccess: async () => {
      // Refresh user data to get new tenant info
      if (refreshUser) {
        await refreshUser();
      }
      queryClient.invalidateQueries();
      // Navigate to dashboard after successful switch
      navigate('/dashboard');
    },
    onError: () => {
      setSwitchingTenantId(null);
    },
  });

  // Handle entering a tenancy
  const handleEnterTenancy = (tenantId) => {
    setSwitchingTenantId(tenantId);
    switchMutation.mutate(tenantId);
  };

  const tenancies = tenanciesData?.tenancies || [];
  const requests = requestsData?.requests || [];
  const currentTenantId = user?.tenantId;
  const isLoading = loadingTenancies || loadingRequests;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="tenancy-badge tenancy-badge-warning">Pendiente</span>;
      case 'approved':
        return <span className="tenancy-badge tenancy-badge-success">Aprobado</span>;
      case 'rejected':
        return <span className="tenancy-badge tenancy-badge-danger">Rechazado</span>;
      default:
        return <span className="tenancy-badge">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="tenancy-page">
        <div className="tenancy-loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="tenancy-page">
      <div className="tenancy-page-header">
        <h1 className="tenancy-page-title">🏢 Mis Tenencias</h1>
        <p className="tenancy-page-subtitle">
          Administra tus espacios y solicita nuevos registros
        </p>
      </div>

      {successMessage && (
        <div className="tenancy-success-alert">
          ✓ {successMessage}
        </div>
      )}

      {/* Active Tenancies */}
      <section className="tenancy-section">
        <div className="tenancy-section-header">
          <h2 className="tenancy-section-title">Tenencias donde soy administrador</h2>
          <Link to="/account/request-tenancy" className="tenancy-btn tenancy-btn-primary">
            + Solicitar Nueva Tenencia
          </Link>
        </div>

        {tenancies.length === 0 ? (
          <div className="tenancy-card">
            <div className="tenancy-empty-state">
              <div className="tenancy-empty-icon">🏢</div>
              <h3>No tienes tenencias asignadas</h3>
              <p>
                Cuando tu solicitud sea aprobada, tu tenencia aparecerá aquí.
              </p>
              <Link to="/account/request-tenancy" className="tenancy-btn tenancy-btn-primary" style={{marginTop: '1rem'}}>
                Solicitar una tenencia
              </Link>
            </div>
          </div>
        ) : (
          <div className="tenancy-grid">
            {tenancies.map((tenancy) => (
              <div 
                key={tenancy.tenantId} 
                className={`tenancy-card tenancy-tenant-card ${currentTenantId === tenancy.tenantId ? 'tenancy-tenant-active' : ''}`}
              >
                {currentTenantId === tenancy.tenantId && (
                  <div className="tenancy-active-badge">✓ Activo</div>
                )}
                <div className="tenancy-tenant-icon">🏢</div>
                <h3 className="tenancy-tenant-name">{tenancy.tenantName}</h3>
                <div className="tenancy-tenant-role">
                  Rol: <strong>{tenancy.role === 'tenant_admin' ? 'Administrador' : tenancy.role}</strong>
                </div>
                {/* Primary action button - Enter/Manage tenancy */}
                <button
                  className="tenancy-btn tenancy-btn-primary tenancy-btn-full tenancy-btn-enter"
                  onClick={() => handleEnterTenancy(tenancy.tenantId)}
                  disabled={switchMutation.isPending}
                >
                  {switchingTenantId === tenancy.tenantId ? (
                    <>
                      <span className="tenancy-btn-spinner"></span>
                      Ingresando...
                    </>
                  ) : currentTenantId === tenancy.tenantId ? (
                    <>🚀 Ir al Dashboard</>
                  ) : (
                    <>➡️ Ingresar a {tenancy.tenantName}</>
                  )}
                </button>
                {/* Secondary action - Manage users (only for current tenant) */}
                {currentTenantId === tenancy.tenantId && (
                  <Link 
                    to="/admin/users" 
                    className="tenancy-btn tenancy-btn-secondary tenancy-btn-full"
                  >
                    👥 Gestionar Usuarios
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Requests */}
      <section className="tenancy-section">
        <h2 className="tenancy-section-title">Mis Solicitudes</h2>

        {requests.length === 0 ? (
          <div className="tenancy-card">
            <p className="tenancy-no-requests">
              No tienes solicitudes de registro. 
              <Link to="/account/request-tenancy"> Solicitar una tenencia</Link>
            </p>
          </div>
        ) : (
          <div className="tenancy-card">
            <table className="tenancy-table">
              <thead>
                <tr>
                  <th>Organización</th>
                  <th>Identificador</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td><strong>{request.hospitalName}</strong></td>
                    <td><code className="tenancy-slug">{request.slug}</code></td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td>
                      {request.rejectionReason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
