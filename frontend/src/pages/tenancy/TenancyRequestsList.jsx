/**
 * Admin - Tenancy Requests Review Page
 * Super admin can review, approve or reject tenancy registration requests
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTenancyRequests, reviewTenancyRequest } from '../../api/tenancy.js';
import '../admin/AdminPages.css';
import './TenancyPages.css';

export default function TenancyRequestsList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'tenancy-requests', statusFilter],
    queryFn: () => listTenancyRequests({ status: statusFilter }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, action, rejectionReason }) => 
      reviewTenancyRequest(requestId, { action, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenancy-requests'] });
      closeModal();
    },
  });

  const requests = data?.requests || [];

  const openReviewModal = (request, action) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setRejectionReason('');
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setReviewAction(null);
    setRejectionReason('');
  };

  const handleReview = () => {
    if (!selectedRequest || !reviewAction) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      alert('Por favor indica el motivo del rechazo');
      return;
    }

    reviewMutation.mutate({
      requestId: selectedRequest.id,
      action: reviewAction,
      rejectionReason: reviewAction === 'reject' ? rejectionReason.trim() : undefined,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="admin-badge admin-badge-warning">Pendiente</span>;
      case 'approved':
        return <span className="admin-badge admin-badge-success">Aprobado</span>;
      case 'rejected':
        return <span className="admin-badge admin-badge-danger">Rechazado</span>;
      default:
        return <span className="admin-badge">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Cargando solicitudes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          Error al cargar solicitudes: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">📋 Solicitudes de Tenencias</h1>
          <p className="admin-page-subtitle">
            Revisa y gestiona las solicitudes de registro de nuevas tenencias
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="tenancy-select"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div className="admin-empty-state-icon">📭</div>
            <h3 className="admin-empty-state-title">
              No hay solicitudes {statusFilter === 'pending' ? 'pendientes' : ''}
            </h3>
            <p className="admin-empty-state-description">
              {statusFilter === 'pending' 
                ? 'Todas las solicitudes han sido procesadas.'
                : 'No se encontraron solicitudes con el filtro seleccionado.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tenencia</th>
                <th>Solicitante</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div>
                      <strong>{request.hospitalName}</strong>
                      <div className="tenant-email">
                        <code className="tenant-slug">{request.slug}</code>
                      </div>
                      {request.description && (
                        <div className="tenancy-description-preview">
                          {request.description.substring(0, 100)}
                          {request.description.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      {request.requesterEmail}
                      <div className="tenant-email">
                        ID: {request.requesterSub?.substring(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      {request.contactEmail || '-'}
                      {request.contactPhone && (
                        <div className="tenant-email">{request.contactPhone}</div>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>
                    <div>
                      {new Date(request.createdAt).toLocaleDateString()}
                      <div className="tenant-email">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td>
                    {request.status === 'pending' ? (
                      <div className="admin-table-actions">
                        <button
                          className="admin-btn admin-btn-success admin-btn-sm"
                          onClick={() => openReviewModal(request, 'approve')}
                        >
                          ✓ Aprobar
                        </button>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => openReviewModal(request, 'reject')}
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    ) : (
                      <div className="tenancy-reviewed-info">
                        {request.status === 'rejected' && request.rejectionReason && (
                          <span title={request.rejectionReason}>
                            Ver motivo
                          </span>
                        )}
                        {request.reviewedAt && (
                          <div className="tenant-email">
                            {new Date(request.reviewedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal tenancy-review-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {reviewAction === 'approve' ? '✓ Aprobar Solicitud' : '✕ Rechazar Solicitud'}
            </h3>
            
            <div className="tenancy-review-details">
              <p><strong>Tenencia:</strong> {selectedRequest.hospitalName}</p>
              <p><strong>Identificador:</strong> {selectedRequest.slug}</p>
              <p><strong>Solicitante:</strong> {selectedRequest.requesterEmail}</p>
            </div>

            {reviewAction === 'approve' ? (
              <div className="tenancy-review-confirm">
                <p>Al aprobar esta solicitud:</p>
                <ul>
                  <li>Se creará la tenencia "{selectedRequest.hospitalName}"</li>
                  <li>El usuario {selectedRequest.requesterEmail} será asignado como administrador</li>
                  <li>Podrá comenzar a gestionar boxes, staff y citas</li>
                </ul>
              </div>
            ) : (
              <div className="tenancy-form-group">
                <label htmlFor="rejectionReason">Motivo del rechazo *</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Indica el motivo por el cual se rechaza esta solicitud..."
                  rows={3}
                  required
                />
              </div>
            )}

            {reviewMutation.isError && (
              <div className="tenancy-error-alert">
                Error: {reviewMutation.error?.response?.data?.error || reviewMutation.error?.message}
              </div>
            )}

            <div className="admin-modal-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={closeModal}
                disabled={reviewMutation.isPending}
              >
                Cancelar
              </button>
              <button
                className={`admin-btn ${reviewAction === 'approve' ? 'admin-btn-success' : 'admin-btn-danger'}`}
                onClick={handleReview}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending 
                  ? 'Procesando...' 
                  : reviewAction === 'approve' 
                    ? 'Confirmar Aprobación' 
                    : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
