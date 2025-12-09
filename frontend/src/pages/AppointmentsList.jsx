import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Link } from 'react-router-dom';
import { FaPlus, FaSpinner, FaEdit, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import './AppointmentsList.css';
import { useVocabulary, formatPlural } from '../hooks/useVocabulary.js';

async function fetchAppointments({ from, to }) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data } = await api.get(`/appointments${params.toString() ? `?${params}` : ''}`);
  return data.items;
}

export default function AppointmentsList() {
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const vocab = useVocabulary();
  const resourceLabel = formatPlural(vocab.resource);
  const reservationLabel = formatPlural(vocab.reservation);
  const staffLabel = formatPlural(vocab.staff);
  const referenceLabel = vocab.reference || 'Referencia';
  const roleLabel = vocab.role || 'Cargo';
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => fetchAppointments(filters)
  });
  const { data: boxes = [] } = useQuery({ queryKey: ['boxes'], queryFn: async () => (await api.get('/boxes')).data.items });
  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: async () => (await api.get('/staff')).data.items });

  const boxMap = useMemo(() => Object.fromEntries((boxes || []).map((box) => [box.id, box])), [boxes]);
  const staffMap = useMemo(() => Object.fromEntries((staff || []).map((member) => [member.id, member])), [staff]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  };

  const getDuration = (appointment) => {
    if (appointment.duracionMinutos) {
      return `${appointment.duracionMinutos} min`;
    }

    if (appointment.startAt && appointment.endAt) {
      const diff = (new Date(appointment.endAt) - new Date(appointment.startAt)) / 60000;
      if (Number.isFinite(diff) && diff > 0) {
        return `${diff} min`;
      }
    }

    return '—';
  };

  const statusInfo = {
    scheduled: { label: 'Agendada', tone: 'scheduled' },
    confirmed: { label: 'Confirmada', tone: 'confirmed' },
    completed: { label: 'Completada', tone: 'completed' },
    cancelled: { label: 'Cancelada', tone: 'cancelled' },
    'no-show': { label: 'No asistió', tone: 'no-show' }
  };

  const renderBoxCell = (appointment) => {
    const box = boxMap[appointment.idBox];
    if (!box) {
      return appointment.idBox || '—';
    }

    return (
      <div className="box-cell">
        <span className="box-cell__name">{box.nombre || `${vocab.resource} ${box.id}`}</span>
        <span className="box-cell__meta">
          ID {box.id}
          {box.pasillo ? ` · ${referenceLabel} ${box.pasillo}` : ''}
        </span>
      </div>
    );
  };

  const renderStaffCell = (appointment) => {
    const staffMember = staffMap[appointment.idStaff || appointment.idDoctor];
    if (!staffMember) {
      return appointment.idStaff || appointment.idDoctor || '—';
    }

    return (
      <div className="staff-cell">
        <span className="staff-cell__name">{staffMember.nombre}</span>
        <span className="staff-cell__meta">
          ID {staffMember.id}
          {staffMember.especialidad ? ` · ${roleLabel} ${staffMember.especialidad}` : ''}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Cargando {reservationLabel.toLowerCase()}...</p>
      </div>
    );
  }

  return (
    <div className="appointments-list-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <FaCalendarAlt /> Asignaciones de {staffLabel}
          </h1>
          <p className="page-subtitle">Gestiona las reservas de tu organización asignando staff a recursos agendables</p>
        </div>
        <Link to="/appointments/new" className="btn-primary">
          <FaPlus /> Nueva {reservationLabel.slice(0,1).toUpperCase() + reservationLabel.slice(1).toLowerCase()}
        </Link>
      </div>

      <div className="filters-card">
        <div className="filters-header">
          <FaFilter /> Filtros
        </div>
        <div className="filters-content">
          <div className="filter-group">
            <label htmlFor="from-date">Desde:</label>
            <input 
              id="from-date"
              type="datetime-local" 
              value={draftFrom} 
              onChange={e => setDraftFrom(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="to-date">Hasta:</label>
            <input 
              id="to-date"
              type="datetime-local" 
              value={draftTo} 
              onChange={e => setDraftTo(e.target.value)}
              className="filter-input"
            />
          </div>
          <button
            onClick={() => {
              setFilters({ 
                from: draftFrom ? new Date(draftFrom).toISOString() : '', 
                to: draftTo ? new Date(draftTo).toISOString() : '' 
              });
              setTimeout(() => refetch(), 0);
            }}
            className="btn-filter"
          >
            <FaFilter /> Aplicar Filtros
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <FaCalendarAlt className="empty-icon" />
          <p>No hay {reservationLabel.toLowerCase()} registradas</p>
          <Link to="/appointments/new" className="btn-primary">
            <FaPlus /> Crear primera {reservationLabel.toLowerCase()}
          </Link>
        </div>
      ) : (
        <div className="appointments-table-container">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>{vocab.resource}</th>
                <th>{staffLabel}</th>
                <th>Estado</th>
                <th>Duración</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(appointment => (
                <tr key={appointment.id || appointment.startAt}>
                  <td className="date-cell">
                    <FaCalendarAlt className="cell-icon" />
                    {formatDateTime(appointment.startAt)}
                  </td>
                  <td>{renderBoxCell(appointment)}</td>
                  <td>{renderStaffCell(appointment)}</td>
                  <td>
                    {(() => {
                      const info = statusInfo[appointment.status] || { label: appointment.status || '—', tone: 'default' };
                      return <span className={`status-chip status-chip--${info.tone}`}>{info.label}</span>;
                    })()}
                  </td>
                  <td>{getDuration(appointment)}</td>
                  <td className="actions-cell">
                    <Link 
                      to={`/appointments/${encodeURIComponent(appointment.id)}/edit`}
                      className="btn-table-edit"
                      title="Editar reserva"
                    >
                      <FaEdit /> Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

