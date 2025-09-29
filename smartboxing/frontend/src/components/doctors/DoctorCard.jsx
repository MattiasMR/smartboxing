// src/components/doctors/DoctorCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './DoctorCard.css';

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate(); // Initialize useNavigate

  let statusInfo = { text: 'Disponible', className: 'available' };
  
  if (doctor.is_on_vacation_today) {
    statusInfo = { text: 'De Vacaciones', className: 'on-vacation' };
  } else if (doctor.is_on_duty_today) {
    statusInfo = { text: 'Trabajando Hoy', className: 'on-duty' };
  }

  const handleViewDetails = () => {
    navigate(`/doctors/${doctor.id}`); // Navigate to doctor detail page
  };

  return (
    <div className="doctor-card">
      <div className="doctor-info">
        <h3 className="doctor-name">{doctor.full_name}</h3>
        <p className="doctor-specialty">{doctor.specialty?.name || 'Sin especialidad'}</p>
      </div>
      <div className="doctor-actions">
        <div className="doctor-status-container">
          <div className={`status-indicator-dot ${statusInfo.className}`}></div>
          <span className="status-text">{statusInfo.text}</span>
        </div>
        <button onClick={handleViewDetails} className="details-button">Ver Detalles</button>
      </div>
    </div>
  );
};

export default DoctorCard;