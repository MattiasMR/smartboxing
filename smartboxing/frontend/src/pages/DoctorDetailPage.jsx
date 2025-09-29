// src/pages/DoctorDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDoctorDetails } from '../api/services';
import { format, parseISO } from 'date-fns';
import es from 'date-fns/locale/es';
import PageHeader from '../components/layout/PageHeader';
import DoctorDetailSidebar from '../components/doctors/DoctorDetailSidebar';
import './DoctorDetailPage.css'; 

function DoctorDetailPage() {
  const { doctorId } = useParams();
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDoctorDetails = async () => {
      try {
        setLoading(true);
        const response = await fetchDoctorDetails(doctorId);
        setDoctorDetails(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch doctor details:", err);
        setError('No se pudieron cargar los detalles del médico.');
        setDoctorDetails(null);
      } finally {
        setLoading(false);
      }
    };
    loadDoctorDetails();
  }, [doctorId]);

  if (loading) {
    return <p>Cargando detalles del médico...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!doctorDetails) {
    return <p>Médico no encontrado.</p>;
  }

  // Destructure for easier access
  const { weekly_schedule } = doctorDetails;

  return (
    <div className="doctor-detail-page-container">
      <PageHeader title={doctorDetails ? `Dr. ${doctorDetails.full_name}` : 'Detalle del Médico'} />
      
      <div className="doctor-detail-page-layout">
        <div className="main-content">
          <div className="schedule-header">
            <h3>Agenda Semanal</h3>
          </div>

          {weekly_schedule && weekly_schedule.length > 0 ? (
            <div className="schedule-container">
              {weekly_schedule.map(item => (
                <div 
                  key={item.id} 
                  className={`schedule-card ${item.assignment_type === 'NON_MEDICAL' ? 'non-medical' : 'medical'}`}
                >
                  <div className="schedule-card-time">
                    <strong>
                      {format(parseISO(item.start_time), 'HH:mm')} - {format(parseISO(item.end_time), 'HH:mm')}
                    </strong>
                  </div>
                  <div className="schedule-card-details">
                    <p><strong>Día:</strong> {format(parseISO(item.start_time), 'EEEE', { locale: es })}</p>
                    <p><strong>Box:</strong> {item.box.hallway}-{item.box.number}</p>
                    {item.assignment_type === 'NON_MEDICAL' && (
                      <p className="non-medical-label">HORA NO MÉDICA</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-schedule">
              <p>No hay agenda programada para esta semana.</p>
            </div>
          )}
        </div>

        <div className="sidebar-container">
          <DoctorDetailSidebar doctor={doctorDetails} />
        </div>
      </div>
    </div>
  );
}

export default DoctorDetailPage;
