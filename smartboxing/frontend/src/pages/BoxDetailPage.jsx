// src/pages/BoxDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import { fetchAssignments, fetchBoxDetails, fetchAppointments, fetchDoctors } from '../api/services'; // Added fetchDoctors
import { format, parseISO, getHours, getMinutes, setHours, setMinutes, addMinutes, isBefore, isEqual } from 'date-fns'; // Added more date-fns functions
import es from 'date-fns/locale/es';
import '../components/boxes/BoxDetailPage.css';
import AppointmentModal from '../components/boxes/AppointmentModal'; // Path to the new modal component
import BoxDetailSidebar from '../components/boxes/BoxDetailSidebar'; // Import the sidebar
import '../components/boxes/BoxDetailSidebar.css'; // Import sidebar CSS

function BoxDetailPage() {
  const { boxId } = useParams();
  const [box, setBox] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [appointmentsForModal, setAppointmentsForModal] = useState([]);

  useEffect(() => {
    const loadBoxDetails = async () => {
      try {
        setIsLoading(true);
        const boxDetailsRes = await fetchBoxDetails(boxId);
        setBox(boxDetailsRes.data);
      } catch (err) {
        console.error("Error fetching box details:", err);
        setError("No se pudo cargar la información del box.");
      } finally {
        // Keep loading true until assignments are also loaded
      }
    };
    loadBoxDetails();
  }, [boxId]);

  useEffect(() => {
    const loadAssignments = async () => {
      if (!boxId) return;
      setIsLoading(true);
      try {
        console.log('🔍 Fetching assignments for box:', boxId, 'date:', format(selectedDate, 'yyyy-MM-dd'));
        
        // Get all assignments and doctors to populate data
        const [assignmentsRes, doctorsRes] = await Promise.all([
          fetchAssignments(),
          fetchDoctors()
        ]);
        
        const allAssignments = assignmentsRes.data?.assignments || assignmentsRes.data || [];
        const allDoctors = doctorsRes.data?.doctors || doctorsRes.data || [];
        
        // Filter on frontend by box_id and date
        const targetDate = format(selectedDate, 'yyyy-MM-dd');
        const filteredAssignments = allAssignments.filter(assignment => {
          const matchesBox = assignment.boxId === boxId;
          const matchesDate = assignment.date === targetDate;
          return matchesBox && matchesDate;
        });
        
        // Populate doctor information
        const enrichedAssignments = filteredAssignments.map(assignment => {
          const doctor = allDoctors.find(doc => doc.id === assignment.doctorId);
          return {
            ...assignment,
            doctor: doctor ? {
              full_name: doctor.name,
              specialty: {
                name: mapSpecialtyId(doctor.specialty_id)
              }
            } : null
          };
        });
        
        console.log(`✅ Found ${enrichedAssignments.length} assignments for box ${boxId} on ${targetDate}`);
        setAssignments(enrichedAssignments.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setError("No se pudieron cargar las asignaciones del box.");
      } finally {
        setIsLoading(false);
      }
    };
    if (box) { // Only load assignments if box details are loaded
        loadAssignments();
    }
  }, [boxId, selectedDate, box]); // Add box to dependency array

  const handleAssignmentClick = async (assignment) => {
    // Enrich assignment with box information
    const enrichedAssignment = {
      ...assignment,
      box: {
        number: box?.number || 'N/A',
        hallway: box?.hallway || 'N/A',
        name: box?.name || 'Box desconocido'
      }
    };
    
    setSelectedAssignment(enrichedAssignment);
    try {
      console.log('🔍 Fetching appointments for assignment:', assignment.id);
      
      // Get all appointments since API doesn't support filtering by assignment_id
      const appointmentsRes = await fetchAppointments();
      const allAppointments = appointmentsRes.data?.appointments || appointmentsRes.data || [];
      
      // Filter appointments for this assignment and date
      const assignmentDate = assignment.date;
      const assignmentStart = new Date(assignment.start_time);
      const assignmentEnd = new Date(assignment.end_time);
      
      const filteredAppointments = allAppointments.filter(appointment => {
        const appointmentDate = appointment.date;
        const appointmentTime = new Date(appointment.start_time);
        
        // Check if appointment is on the same date and within assignment time range
        return appointmentDate === assignmentDate &&
               appointmentTime >= assignmentStart &&
               appointmentTime < assignmentEnd;
      });
      
      console.log(`✅ Found ${filteredAppointments.length} appointments for assignment ${assignment.id}`);
      setAppointmentsForModal(filteredAppointments);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching appointments for modal:", err);
      // Set empty array as fallback
      setAppointmentsForModal([]);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
    setAppointmentsForModal([]);
  };

  // Helper to generate 30-minute slots for the modal
  const generateModalTimeSlots = (assignment) => {
    if (!assignment) return [];
    
    // Ensure appointmentsForModal is always an array
    const appointments = Array.isArray(appointmentsForModal) ? appointmentsForModal : [];
    
    const slots = [];
    let currentTime = parseISO(assignment.start_time);
    const endTime = parseISO(assignment.end_time);

    while (isBefore(currentTime, endTime) || isEqual(currentTime, endTime)) {
      const slotEndTime = addMinutes(currentTime, 30);
      slots.push({
        start: currentTime,
        end: slotEndTime,
        label: `${format(currentTime, 'HH:mm')} - ${format(slotEndTime, 'HH:mm')}`,
        appointment: appointments.find(app => {
          const appStartTime = parseISO(app.start_time);
          // Check if appointment starts exactly at this slot's start time
          return isEqual(appStartTime, currentTime);
        })
      });
      currentTime = slotEndTime;
      if (isEqual(currentTime, endTime)) break; // Avoid creating a slot that starts exactly at end_time unless it's the very last one and end_time is on a 30-min mark
    }
    return slots;
  };

  if (isLoading && !box) return <p>Cargando detalles del box...</p>; // Show initial loading for box
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!box) return <p>Box no encontrado.</p>;

  return (
    <div className="box-detail-page-container"> {/* Added a new top-level container */}
      <PageHeader title={box ? `Box ${box.number}` : 'Detalle del Box'} />
      
      <div className="box-detail-page-layout"> {/* Existing wrapper for layout */}
        <div className="main-content"> {/* Wrapper for existing content */}
          <div style={{ marginTop: '10px', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '8px' }}>
            <h3>Horarios para el {format(selectedDate, 'PPP', { locale: es })}</h3>
            {/* TODO: Add date navigation (previous/next day) */}
          </div>

          {isLoading && assignments.length === 0 && <p>Cargando asignaciones...</p>} 
          {!isLoading && assignments.length === 0 && <p>No hay asignaciones para mostrar en esta fecha.</p>}
          
          <div className="timetable-container-refactored">
            {assignments.map(assignment => (
              <div 
                key={assignment.id} 
                className={`assignment-block ${assignment.assignment_type === 'NON_MEDICAL' ? 'non-medical' : 'medical'}`}
                onClick={() => handleAssignmentClick(assignment)}
              >
                <div className="assignment-time">
                  <strong>
                    {format(parseISO(assignment.start_time), 'HH:mm')} - {format(parseISO(assignment.end_time), 'HH:mm')}
                  </strong>
                </div>
                <div className="assignment-details">
                  <p><strong>Médico:</strong> {assignment.doctor?.full_name || `Doctor ${assignment.doctorId}`}</p>
                  <p><strong>Especialidad:</strong> {assignment.doctor?.specialty?.name || assignment.specialtyId || 'N/A'}</p>
                  {assignment.assignment_type === 'NON_MEDICAL' && (
                    <p style={{ color: '#6a0dad', fontWeight: 'bold' }}>HORA NO MÉDICA</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div> {/* End main-content */}

        <div className="sidebar-container"> {/* Container for the sidebar */}
          <BoxDetailSidebar box={box} /> {/* Pass the full box object */}
        </div>
      </div> {/* End box-detail-page-layout */}

      {selectedAssignment && (
        <AppointmentModal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          assignment={selectedAssignment}
          appointments={appointmentsForModal} // Pass all fetched appointments for the assignment
          generateTimeSlots={generateModalTimeSlots} // Pass the slot generation logic
        />
      )}
    </div>
  );
}

// Helper function to map specialty ID to name
function mapSpecialtyId(specialtyId) {
  const specialtyMap = {
    'spec-001': 'Cardiología',
    'spec-002': 'Neurología', 
    'spec-003': 'Pediatría',
    'spec-004': 'Ginecología',
    'spec-005': 'Traumatología'
  };
  return specialtyMap[specialtyId] || 'Medicina General';
}

export default BoxDetailPage;
