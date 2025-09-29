import React from 'react';
import './BoxDetailSidebar.css'; // We'll create this CSS file next

function BoxDetailSidebar({ box, onClose }) {
  if (!box) {
    return (
      <div className="box-detail-sidebar placeholder">
        <p>Selecciona un box para ver sus detalles y características.</p>
      </div>
    );
  }

  return (
    <div className="box-detail-sidebar open">
      <div className="sidebar-header" >
        <h3>Box {box.number} - {box.hallway}</h3>
      </div>
      <div className="sidebar-content">
        <h4>Características Disponibles:</h4>
        {box.equipment && box.equipment.length > 0 ? (
          <ul className="equipment-list">
            {box.equipment.map(equip => (
              <li key={equip.id || equip.name}>{equip.name}</li>
            ))}
          </ul>
        ) : (
          <p>Este box no tiene equipamiento específico registrado.</p>
        )}
        
        <hr />

        <h4>Estado Operacional:</h4>
        <p className={`status-${box.operational_status?.toLowerCase()}`}>
          {box.operational_status === 'ENABLED' ? 'Habilitado' : 'Inhabilitado'}
        </p>

        {box.operational_status === 'ENABLED' && (
          <>
            <h4>Estado de Ocupación Actual:</h4>
            <p className={`status-${box.occupancy_status?.toLowerCase()}`}>
              {box.occupancy_status === 'OCCUPIED' && `Ocupado (Médico: ${box.current_doctor_name || 'N/A'})`}
              {box.occupancy_status === 'AVAILABLE' && 'Disponible'}
              {box.occupancy_status === 'UPCOMING' && `Próxima Reserva (Médico: ${box.next_doctor_name || 'N/A'} a las ${box.next_assignment_time || 'N/A'})`}
              {box.occupancy_status === 'MAINTENANCE' && 'En Mantenimiento'}
              {!box.occupancy_status && 'No disponible'}
            </p>
            {typeof box.occupancy_percentage === 'number' && (
                 <h4>Ocupación del Día:</h4>
            )}
            {typeof box.occupancy_percentage === 'number' && (
                 <div className="occupancy-bar-container">
                    <div 
                        className="occupancy-bar" 
                        style={{ width: `${box.occupancy_percentage}%` }}
                        title={`${box.occupancy_percentage}% ocupado`}
                    >
                        {box.occupancy_percentage}%
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BoxDetailSidebar;
