import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FaPlus, FaSpinner, FaEdit, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import './AppointmentsList.css';

async function fetchAppointments({ from, to }) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data } = await api.get(`/appointments${params.toString() ? `?${params}` : ''}`);
  return data.items;
}

export default function AppointmentsList() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments', { from, to }],
    queryFn: () => fetchAppointments({ from, to })
  });

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Cargando citas...</p>
      </div>
    );
  }

  return (
    <div className="appointments-list-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <FaCalendarAlt /> Citas Médicas
          </h1>
          <p className="page-subtitle">Gestiona las citas de tu clínica</p>
        </div>
        <Link to="/appointments/new" className="btn-primary">
          <FaPlus /> Nueva Cita
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
              value={from} 
              onChange={e => setFrom(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="to-date">Hasta:</label>
            <input 
              id="to-date"
              type="datetime-local" 
              value={to} 
              onChange={e => setTo(e.target.value)}
              className="filter-input"
            />
          </div>
          <button onClick={() => refetch()} className="btn-filter">
            <FaFilter /> Aplicar Filtros
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <FaCalendarAlt className="empty-icon" />
          <p>No hay citas registradas</p>
          <Link to="/appointments/new" className="btn-primary">
            <FaPlus /> Crear primera cita
          </Link>
        </div>
      ) : (
        <div className="appointments-table-container">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Box</th>
                <th>Doctor</th>
                <th>Duración</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(appointment => (
                <tr key={appointment.startAt}>
                  <td className="date-cell">
                    <FaCalendarAlt className="cell-icon" />
                    {formatDateTime(appointment.startAt)}
                  </td>
                  <td>{appointment.idBox || '—'}</td>
                  <td>{appointment.idDoctor || '—'}</td>
                  <td>{appointment.duracionMinutos ? `${appointment.duracionMinutos} min` : '—'}</td>
                  <td className="actions-cell">
                    <Link 
                      to={`/appointments/${encodeURIComponent(appointment.id)}/edit`}
                      className="btn-table-edit"
                      title="Editar cita"
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
