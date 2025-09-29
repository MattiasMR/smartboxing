// filepath: /home/matti/Documents/smartboxing-hph/frontend/src/components/boxes/AppointmentModal.jsx
import React from 'react';
import { format, parseISO } from 'date-fns';
import './AppointmentModal.css';

function AppointmentModal({ isOpen, onClose, assignment, appointments, generateTimeSlots }) {
  if (!isOpen || !assignment) return null;

  const timeSlots = generateTimeSlots(assignment);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h3>Citas para el Turno</h3>
        <p>
          <strong>Médico:</strong> {assignment.doctor.full_name} ({assignment.doctor.specialty ? assignment.doctor.specialty.name : 'N/A'})
        </p>
        <p>
          <strong>Box:</strong> {assignment.box.number} - {assignment.box.hallway}
        </p>
        <p>
          <strong>Horario del Turno:</strong> 
          {format(parseISO(assignment.start_time), 'HH:mm')} - {format(parseISO(assignment.end_time), 'HH:mm')}
        </p>
        <hr />
        <h4>Detalle de Citas (Intervalos de 30 min):</h4>
        {timeSlots.length === 0 && <p>No hay horarios definidos para este turno.</p>}
        <div className="appointment-slots-container">
          {timeSlots.map((slot, index) => (
            <div 
              key={index} 
              className={`appointment-slot ${slot.appointment ? 'slot-occupied' : 'slot-free'}`}
            >
              <div className="slot-time">{slot.label}</div>
              <div className="slot-details">
                {slot.appointment ? (
                  <div>
                    <p><strong>Paciente:</strong> {slot.appointment.patient_name || 'No especificado'}</p>
                    <p><strong>Estado:</strong> {slot.appointment.status}</p>
                    {/* Add more appointment details if needed */}
                  </div>
                ) : (
                  <p>Disponible</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppointmentModal;
