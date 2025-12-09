/**
 * Request Tenancy Page
 * Allows users to submit a request to register a new tenancy/space
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createTenancyRequest, generateSlug, isValidSlug, listTenancyRequests } from '../../api/tenancy.js';
import { useAuth } from '../../auth/useAuth.js';
import './TenancyPages.css';

export default function RequestTenancy() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    tenancyName: '',
    slug: '',
    description: '',
    reason: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    address: '',
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [error, setError] = useState(null);

  // Check if user already has pending requests
  const { data: existingRequests } = useQuery({
    queryKey: ['tenancy', 'my-requests'],
    queryFn: () => listTenancyRequests({ onlyMine: true }),
  });

  const pendingRequest = existingRequests?.requests?.find(r => r.status === 'pending');

  const createMutation = useMutation({
    mutationFn: createTenancyRequest,
    onSuccess: () => {
      navigate('/account/tenancies', { 
        state: { message: '¡Solicitud enviada! Te notificaremos cuando sea revisada.' }
      });
    },
    onError: (err) => {
      setError(err.response?.data?.error || err.message || 'Error al enviar solicitud');
    },
  });

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      tenancyName: name,
      slug: slugManuallyEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSlugChange = (e) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.tenancyName.trim()) {
      setError('El nombre de la tenencia es requerido');
      return;
    }

    if (!isValidSlug(formData.slug)) {
      setError('El identificador debe tener entre 3 y 50 caracteres, solo letras minúsculas, números y guiones');
      return;
    }

    createMutation.mutate({
      hospitalName: formData.tenancyName.trim(), // Backend uses hospitalName
      slug: formData.slug,
      description: formData.description.trim() || undefined,
      reason: formData.reason.trim() || undefined,
      contactEmail: formData.contactEmail.trim() || undefined,
      contactPhone: formData.contactPhone.trim() || undefined,
      address: formData.address.trim() || undefined,
    });
  };

  if (pendingRequest) {
    return (
      <div className="tenancy-page">
        <div className="tenancy-card">
          <div className="tenancy-pending-notice">
            <div className="tenancy-pending-icon">⏳</div>
            <h2>Solicitud Pendiente</h2>
            <p>
              Ya tienes una solicitud pendiente para <strong>{pendingRequest.hospitalName}</strong>.
            </p>
            <p className="tenancy-pending-date">
              Enviada el {new Date(pendingRequest.createdAt).toLocaleDateString()}
            </p>
            <Link to="/account/tenancies" className="tenancy-btn tenancy-btn-primary">
              Ver mis solicitudes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tenancy-page">
      <div className="tenancy-page-header">
        <Link to="/account/tenancies" className="tenancy-back-link">
          ← Volver
        </Link>
        <h1 className="tenancy-page-title">🏢 Solicitar Nueva Organización</h1>
        <p className="tenancy-page-subtitle">
          Completa el formulario para registrar tu organización en SmartBoxing.
          Tu solicitud será revisada por un administrador.
        </p>
      </div>

      <div className="tenancy-card">
        <form onSubmit={handleSubmit} className="tenancy-form">
          {error && (
            <div className="tenancy-error-alert">
              {error}
            </div>
          )}

          <div className="tenancy-form-group">
            <label htmlFor="tenancyName">Nombre de la Organización *</label>
            <input
              type="text"
              id="tenancyName"
              name="tenancyName"
              value={formData.tenancyName}
              onChange={handleNameChange}
              placeholder="Mi Centro / Clínica / Gimnasio"
              required
              autoFocus
            />
            <span className="tenancy-form-help">
              Nombre comercial de tu organización (clínica, gimnasio, centro, etc.)
            </span>
          </div>

          <div className="tenancy-form-group">
            <label htmlFor="slug">Identificador Único *</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="mi-organizacion"
            />
            <span className="tenancy-form-help">
              Este será el identificador único de tu organización (ej: smartboxing.app/mi-organizacion)
            </span>
            {formData.slug && !isValidSlug(formData.slug) && (
              <span className="tenancy-form-error">
                Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
              </span>
            )}
          </div>

          <div className="tenancy-form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Breve descripción de tu organización y sus servicios..."
              rows={3}
            />
          </div>

          <div className="tenancy-form-group">
            <label htmlFor="reason">Motivo de la solicitud</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="¿Por qué deseas registrar esta organización?"
              rows={3}
            />
          </div>

          <div className="tenancy-form-row">
            <div className="tenancy-form-group">
              <label htmlFor="contactEmail">Email de Contacto</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="contacto@miorganizacion.cl"
              />
            </div>

            <div className="tenancy-form-group">
              <label htmlFor="contactPhone">Teléfono de Contacto</label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div className="tenancy-form-group">
            <label htmlFor="address">Dirección</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Av. Principal 123, Santiago, Chile"
            />
          </div>

          <div className="tenancy-form-actions">
            <Link to="/account/tenancies" className="tenancy-btn tenancy-btn-secondary">
              Cancelar
            </Link>
            <button
              type="submit"
              className="tenancy-btn tenancy-btn-primary"
              disabled={createMutation.isPending || !isValidSlug(formData.slug)}
            >
              {createMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
