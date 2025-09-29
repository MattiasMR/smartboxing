import apiClient from './axiosConfig';

export const loginUser = (credentials) => {
  return apiClient.post('/auth/login/', credentials);
};

export const fetchBoxes = () => {
  return apiClient.get('/boxes/');
};

// Added function to fetch details for a single box
export const fetchBoxDetails = (boxId) => {
  return apiClient.get(`/boxes/${boxId}/`);
};

export const fetchDoctors = (params) => {
  return apiClient.get('/doctors/', { params });
};

// Fetch details for a specific doctor
export const fetchDoctorDetails = (doctorId) => {
  return apiClient.get(`/doctors/${doctorId}/details/`); // Changed to /details/ endpoint
};

export const fetchDailySummary = async () => {
  // Temporarily create summary from existing endpoints
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's appointments
    const appointmentsResponse = await apiClient.get('/appointments/', {
      params: { date: today }
    });
    
    // Get box assignments for today
    const assignmentsResponse = await apiClient.get('/box-assignments/', {
      params: { date: today }
    });
    
    // Get boxes status
    const boxesResponse = await apiClient.get('/boxes/');
    
    const appointments = appointmentsResponse.data || [];
    const assignments = assignmentsResponse.data || [];
    const boxes = boxesResponse.data || [];
    
    // Build summary
    const summary = {
      total_appointments: appointments.length,
      completed_appointments: appointments.filter(apt => apt.status === 'COMPLETED').length,
      pending_appointments: appointments.filter(apt => apt.status === 'SCHEDULED').length,
      cancelled_appointments: appointments.filter(apt => apt.status === 'CANCELLED').length,
      total_boxes: boxes.length,
      active_boxes: boxes.filter(box => box.operational_status === 'ENABLED').length,
      total_assignments: assignments.length,
      date: today
    };
    
    return { data: summary };
  } catch (error) {
    console.error('Error building daily summary:', error);
    // Return a default summary if API calls fail
    return {
      data: {
        total_appointments: 0,
        completed_appointments: 0,
        pending_appointments: 0,
        cancelled_appointments: 0,
        total_boxes: 0,
        active_boxes: 0,
        total_assignments: 0,
        date: new Date().toISOString().split('T')[0]
      }
    };
  }
};

export const fetchAssignments = (params) => {
  return apiClient.get('/box-assignments/', { params });
};

export const fetchAppointments = (params) => {
  return apiClient.get('/appointments/', { params });
};

// --- Funciones para la página de Reportes ---
export const fetchDoctorRanking = (params) => {
  return apiClient.get('/reports/doctor_ranking/', { params });
};

export const fetchSpecialtyDistribution = (params) => {
  return apiClient.get('/reports/specialty_distribution/', { params });
};

export const fetchConsultationsByTimeslot = (params) => {
  return apiClient.get('/reports/consultations_by_timeslot/', { params });
};

export const fetchTopDoctor = (params) => {
  return apiClient.get('/reports/top_doctor/', { params });
};

export const fetchTopBox = (params) => {
  return apiClient.get('/reports/top_box/', { params });
};

export const fetchBoxRanking = (params) => {
  return apiClient.get('/reports/box_ranking/', { params });
};

export const fetchMostDemandedSpecialty = (params) => {
  return apiClient.get('/reports/most_demanded_specialty/', { params });
};

// Función para obtener resumen automatizado de reportes
export const fetchAutomatedReportSummary = (dateRange) => {
  return apiClient.post('/ai-analyst/qa/', dateRange);
};