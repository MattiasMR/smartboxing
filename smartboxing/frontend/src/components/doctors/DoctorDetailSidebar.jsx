import React from 'react';
import './DoctorDetailSidebar.css';

function DoctorDetailSidebar({ doctor }) {
  if (!doctor) {
    return (
      <div className="doctor-detail-sidebar placeholder">
        <p>Cargando información del médico...</p>
      </div>
    );
  }

  const { 
    full_name, 
    specialty, 
    is_on_duty_today, 
    is_on_vacation_today,
    assigned_hours_weekly,
    most_used_boxes,
    consultations_this_week 
  } = doctor;

  const doctorStatus = is_on_duty_today ? "Trabajando Hoy" : (is_on_vacation_today ? "De Vacaciones" : "Disponible");
  const statusClassName = is_on_duty_today ? "status-on-duty" : (is_on_vacation_today ? "status-on-vacation" : "status-available");

  return (
    <div className="doctor-detail-sidebar open">
      <div className="sidebar-header">
        <h3>{full_name}</h3>
        <p className="doctor-specialty">{specialty?.name || 'Sin especialidad'}</p>
      </div>
      
      <div className="sidebar-content">
        <div className="kpi-section">
          <h4>Estado Actual:</h4>
          <div className={`doctor-status-badge ${statusClassName}`}>
            <span className={`status-indicator-dot ${statusClassName}`}></span>
            {doctorStatus} 
          </div>
        </div>

        <hr />

        <div className="kpi-section">
          <h4>Horas Semanales:</h4>
          <div className="kpi-value">
            <span className="kpi-number">{assigned_hours_weekly || 0}</span>
            <span className="kpi-label">horas asignadas</span>
          </div>
        </div>

        <hr />

        <div className="kpi-section">
          <h4>Consultas esta Semana:</h4>
          <div className="kpi-value">
            <span className="kpi-number">{consultations_this_week || 0}</span>
            <span className="kpi-label">consultas realizadas</span>
          </div>
        </div>

        <hr />

        <div className="kpi-section">
          <h4>Boxes Más Utilizados:</h4>
          {most_used_boxes && most_used_boxes.length > 0 ? (
            <ul className="sidebar-boxes-list">
              {most_used_boxes.slice(0, 3).map((box, index) => (
                <li key={index} className="sidebar-box-item">
                  <span className="box-name">
                    {box.box__name || `Box ${box.box__hallway}-${box.box__number}`}
                  </span>
                  <span className="box-count">{box.count} veces</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No hay datos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDetailSidebar;
