// src/components/boxes/BoxCard.jsx
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaTools } from 'react-icons/fa';
import './BoxCard.css';
import { useVocabulary } from '../../hooks/useVocabulary.js';

export default function BoxCard({ box, onDelete }) {
  const vocab = useVocabulary();
  const referenceLabel = vocab.reference || 'Referencia';

  const getStatusInfo = (estado) => {
    const statusMap = {
      disponible: { label: 'Disponible', icon: <FaCheckCircle />, className: 'disponible' },
      ocupado: { label: 'Ocupado', icon: <FaTimesCircle />, className: 'ocupado' },
      mantenimiento: { label: 'Mantenimiento', icon: <FaTools />, className: 'mantenimiento' },
    };
    return statusMap[estado?.toLowerCase()] || statusMap.disponible;
  };

  const statusInfo = getStatusInfo(box.estado);

  return (
    <div className={`box-card ${statusInfo.className}`}>
      <div className="box-card-header">
        <h3 className="box-card-title">{box.nombre || `${vocab.resource} ${box.id}`}</h3>
        <div className={`box-card-status ${statusInfo.className}`}>
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </div>
      </div>

      <div className="box-card-body">
        {box.descripcion && <p className="box-card-description">{box.descripcion}</p>}

        <div className="box-card-info">
          {box.capacidad && (
            <div className="info-item">
              <span className="info-label">Capacidad:</span>
              <span className="info-value">{box.capacidad}</span>
            </div>
          )}
          {box.ubicacion && (
            <div className="info-item">
              <span className="info-label">Ubicación:</span>
              <span className="info-value">{box.ubicacion}</span>
            </div>
          )}
          {box.pasillo && (
            <div className="info-item">
              <span className="info-label">{referenceLabel}:</span>
              <span className="info-value">{box.pasillo}</span>
            </div>
          )}
        </div>
      </div>

      <div className="box-card-actions">
        <Link to={`/boxes/${encodeURIComponent(box.id)}/edit`} className="btn-edit">
          <FaEdit /> Editar
        </Link>
        <button
          onClick={() => onDelete(box.id)}
          className="btn-delete"
          title={`Eliminar ${vocab.resource.toLowerCase()}`}
        >
          <FaTrash /> Eliminar
        </button>
      </div>
    </div>
  );
}
