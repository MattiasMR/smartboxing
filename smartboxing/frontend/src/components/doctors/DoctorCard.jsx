// src/components/doctors/DoctorCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './DoctorCard.css';

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate(); // Initialize useNavigate

  let statusInfo = { text: 'Disponible', className: 'available' };
  
  // Map real status values to display info
  if (doctor.status === 'ON_VACATION') {
    statusInfo = { text: 'De Vacaciones', className: 'on-vacation' };
  } else if (doctor.status === 'ON_DUTY' || doctor.status === 'ACTIVE') {
    statusInfo = { text: 'En Servicio', className: 'on-duty' };
  }
  
  // Helper function to map specialty_id to name
  const getSpecialtyName = (specialtyId) => {
    const specialtyMap = {
      'spec-001': 'Cardiología',
      'spec-002': 'Neurología', 
      'spec-003': 'Pediatría',
      'spec-004': 'Ginecología',
      'spec-005': 'Traumatología'
    };
    return specialtyMap[specialtyId] || 'Medicina General';
  };

  const handleViewDetails = () => {
    navigate(`/doctors/${doctor.id}`); // Navigate to doctor detail page
  };

  return (
    <div className="doctor-card">
      <div className="doctor-info">
        <h3 className="doctor-name">{doctor.name || doctor.full_name || 'Doctor sin nombre'}</h3>
        <p className="doctor-specialty">{getSpecialtyName(doctor.specialty_id) || doctor.specialty?.name || 'Sin especialidad'}</p>
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