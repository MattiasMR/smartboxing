// src/components/doctors/DoctorCard.jsx
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaUserMd, FaEnvelope, FaPhone } from 'react-icons/fa';
import './DoctorCard.css';

export default function DoctorCard({ doctor, onDelete }) {
  return (
    <div className="doctor-card">
      <div className="doctor-card-header">
        <div className="doctor-avatar">
          <FaUserMd />
        </div>
        <div className="doctor-header-info">
          <h3 className="doctor-card-title">{doctor.nombre}</h3>
          {doctor.especialidad && (
            <span className="doctor-specialty">{doctor.especialidad}</span>
          )}
        </div>
      </div>

      <div className="doctor-card-body">
        <div className="doctor-card-info">
          {doctor.email && (
            <div className="info-item">
              <FaEnvelope className="info-icon" />
              <span className="info-value">{doctor.email}</span>
            </div>
          )}
          {doctor.telefono && (
            <div className="info-item">
              <FaPhone className="info-icon" />
              <span className="info-value">{doctor.telefono}</span>
            </div>
          )}
          {doctor.horario && (
            <div className="info-item">
              <span className="info-label">Horario:</span>
              <span className="info-value">{doctor.horario}</span>
            </div>
          )}
        </div>
      </div>

      <div className="doctor-card-actions">
        <Link to={`/doctors/${encodeURIComponent(doctor.id)}/edit`} className="btn-edit">
          <FaEdit /> Editar
        </Link>
        <button 
          onClick={() => onDelete(doctor.id)} 
          className="btn-delete"
          title="Eliminar doctor"
        >
          <FaTrash /> Eliminar
        </button>
      </div>
    </div>
  );
}
