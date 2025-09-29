// src/components/doctors/MiniDoctorCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './MiniDoctorCard.css'; // We'll create this CSS file next

const MiniDoctorCard = ({ doctor }) => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleViewDetails = () => {
    navigate(`/doctors/${doctor.id}`); // Navigate to doctor detail page
  };

  return (
    <div className="mini-doctor-card">
      <div className="mini-doctor-info">
        <h4 className="mini-doctor-name">{doctor.full_name}</h4>
        <p className="mini-doctor-specialty">{doctor.specialty?.name || 'Sin especialidad'}</p>
      </div>
      <button onClick={handleViewDetails} className="mini-details-button">
        Ver Detalles
      </button>
    </div>
  );
};

export default MiniDoctorCard;
