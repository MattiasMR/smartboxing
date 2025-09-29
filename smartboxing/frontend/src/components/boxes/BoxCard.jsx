// src/components/boxes/BoxCard.jsx
import './BoxCard.css';
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate

function BoxCard({ box }) {
  const navigate = useNavigate(); // <-- Initialize useNavigate

  // Determinamos el estado principal a mostrar
  const isEnabled = box.operational_status === 'ENABLED';
  // El estado de ocupación ahora viene calculado desde el backend, con fallback
  const displayStatus = isEnabled ? (box.occupancy_status || 'AVAILABLE') : 'DISABLED';
  
  // Asignamos una clase CSS basada en el estado a mostrar
  const statusClass = displayStatus.toLowerCase();

  // Usamos el porcentaje de ocupación real que viene del backend
  const occupationPercentage = box.occupancy_percentage !== undefined ? box.occupancy_percentage : 0;
  
  // Style for the occupation bar parts
  const occupiedStyle = {
    width: `${occupationPercentage}%`,
    backgroundColor: '#dc3545' // Red for occupied
  };

  const freeStyle = {
    width: `${100 - occupationPercentage}%`,
    backgroundColor: '#28a745' // Green for free
  };


  const handleCardClick = () => {
    navigate(`/boxes/${box.id}`); // <-- Navigate to BoxDetailPage
  };

  return (
    <div className={`box-card ${statusClass}`} onClick={handleCardClick} style={{ cursor: 'pointer' }}> {/* <-- Add onClick and cursor style */}
      <div className="box-card-header">
        <h3>Box {box.number}</h3>
        <div className="status-indicator">
          <span className={`status-dot ${statusClass}`}></span>
          {/* Mostramos el texto correspondiente */}
          {displayStatus === 'FREE' ? 'Libre' : displayStatus === 'OCCUPIED' ? 'Ocupado' : 'Inhabilitado'}
        </div>
      </div>

      <div className="occupation-footer">
        <p className="occupation-label">Ocupación: {occupationPercentage}%</p>
        <div className="occupation-bar-container">
          {/* The red part (occupied) grows from left to right */}
          <div className="occupation-bar-part" style={occupiedStyle}></div>
          {/* The green part (free) fills the rest */}
          <div className="occupation-bar-part" style={freeStyle}></div>
        </div>
      </div>
    </div>
  );
}

export default BoxCard;