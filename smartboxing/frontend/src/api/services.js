import apiClient from './axiosConfig';
import { DEMO_MODE } from '../config';

export const loginUser = (credentials) => {
  return apiClient.post('/auth/login/', credentials);
};

export const fetchBoxes = () => {
  // In DEMO_MODE, return mock data to avoid 500 errors
  if (DEMO_MODE) {
    return Promise.resolve({
      data: [
        { 
          id: 1, 
          name: 'Box 1', 
          operational_status: 'ENABLED', 
          occupancy_percentage: 85, 
          occupancy_status: 'OCCUPIED',
          location: 'Planta Baja',
          hallway: 'Pasillo A'
        },
        { 
          id: 2, 
          name: 'Box 2', 
          operational_status: 'ENABLED', 
          occupancy_percentage: 60, 
          occupancy_status: 'AVAILABLE',
          location: 'Primer Piso',
          hallway: 'Pasillo A'
        },
        { 
          id: 3, 
          name: 'Box 3', 
          operational_status: 'ENABLED', 
          occupancy_percentage: 72, 
          occupancy_status: 'OCCUPIED',
          location: 'Primer Piso',
          hallway: 'Pasillo B'
        },
        { 
          id: 4, 
          name: 'Box 4', 
          operational_status: 'DISABLED', 
          occupancy_percentage: 0, 
          occupancy_status: 'MAINTENANCE',
          location: 'Segundo Piso',
          hallway: 'Pasillo B'
        },
        { 
          id: 5, 
          name: 'Box 5', 
          operational_status: 'ENABLED', 
          occupancy_percentage: 30, 
          occupancy_status: 'AVAILABLE',
          location: 'Planta Baja',
          hallway: 'Pasillo C'
        },
        { 
          id: 6, 
          name: 'Box 6', 
          operational_status: 'ENABLED', 
          occupancy_percentage: 90, 
          occupancy_status: 'OCCUPIED',
          location: 'Segundo Piso',
          hallway: 'Pasillo C'
        }
      ]
    });
  }
  
  console.log('🔥 Fetching REAL boxes data from API');
  return apiClient.get('/boxes').then(response => {
    // Ensure consistent data structure
    const boxes = response.data?.boxes || response.data || [];
    console.log('📦 fetchBoxes returning:', boxes.length, 'boxes');
    return { data: boxes };
  });
};

// Added function to fetch details for a single box
export const fetchBoxDetails = (boxId) => {
  return apiClient.get(`/boxes/${boxId}/`);
};

export const fetchDoctors = (params) => {
  return apiClient.get('/doctors', { params });
};

// Fetch details for a specific doctor - Use data from /doctors list
export const fetchDoctorDetails = async (doctorId) => {
  console.log('🔍 Fetching doctor details for:', doctorId);
  
  // Since we don't have /doctors/{id} endpoint, get from the list
  try {
    const doctorsResponse = await apiClient.get('/doctors');
    const doctors = doctorsResponse.data?.doctors || doctorsResponse.data || [];
    
    const doctor = doctors.find(doc => doc.id === doctorId);
    
    if (doctor) {
      console.log('✅ Found doctor in list:', doctor);
      // Format to match expected structure
      return {
        data: {
          ...doctor,
          // Add any missing fields with defaults
          specialtyName: doctor.specialtyName || `Specialty ${doctor.specialty_id}`,
          appointments_count: 0, // We don't have this data
          schedule: [], // We don't have this data
        }
      };
    } else {
      throw new Error(`Doctor ${doctorId} not found`);
    }
  } catch (error) {
    console.error('❌ Error fetching doctor details:', error);
    throw error;
  }
};

export const fetchDailySummary = async () => {
  // In DEMO_MODE, return mock data immediately to avoid API calls
  if (DEMO_MODE) {
    console.log('🎭 Demo mode: Using mock data for dashboard');
    return {
      data: {
        total_appointments: 24,
        completed_appointments: 18,
        pending_appointments: 4,
        cancelled_appointments: 2,
        total_boxes: 12,
        active_boxes: 10,
        total_assignments: 8,
        doctors_on_duty: [
          { id: 1, name: 'Dr. Ana García', specialty: 'Cardiología' },
          { id: 2, name: 'Dr. Carlos Ruiz', specialty: 'Neurología' },
          { id: 3, name: 'Dr. María López', specialty: 'Pediatría' }
        ],
        specialties_distribution: [
          { specialty: 'Cardiología', count: 8 },
          { specialty: 'Neurología', count: 6 },
          { specialty: 'Pediatría', count: 5 },
          { specialty: 'Ginecología', count: 3 },
          { specialty: 'Traumatología', count: 2 }
        ],
        date: new Date().toISOString().split('T')[0]
      }
    };
  }

  console.log('🔥 DEMO_MODE is OFF - Fetching REAL data from APIs');
  // Fetch real data from all endpoints
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Fetching data for date: ${today}`);
    
    // Initialize with default values
    let appointments = [];
    let assignments = [];
    let boxes = [];
    let doctors = [];
    
    // Try to get appointments
    try {
      console.log('🔍 Fetching appointments...');
      const appointmentsResponse = await apiClient.get('/appointments');
      appointments = appointmentsResponse.data?.appointments || appointmentsResponse.data || [];
      console.log(`✅ Got ${appointments.length} appointments`);
      // Filter by today's date in frontend if needed
      if (appointments.length > 0 && appointments[0].date) {
        appointments = appointments.filter(apt => 
          apt.date && apt.date.startsWith(today)
        );
        console.log(`📋 Filtered to ${appointments.length} appointments for today`);
      }
    } catch (error) {
      console.error('❌ Appointments endpoint failed:', error.response?.status, error.response?.data || error.message);
    }
    
    // Try to get assignments
    try {
      console.log('🔍 Fetching box assignments...');
      const assignmentsResponse = await apiClient.get('/box-assignments');
      assignments = assignmentsResponse.data?.assignments || assignmentsResponse.data || [];
      console.log(`✅ Got ${assignments.length} assignments`);
      // Filter by today's date in frontend if needed
      if (assignments.length > 0 && assignments[0].date) {
        assignments = assignments.filter(assign => 
          assign.date && assign.date.startsWith(today)
        );
        console.log(`📋 Filtered to ${assignments.length} assignments for today`);
      }
    } catch (error) {
      console.error('❌ Box assignments endpoint failed:', error.response?.status, error.response?.data || error.message);
    }
    
    // Try to get boxes
    try {
      console.log('🔍 Fetching boxes...');
      const boxesResponse = await apiClient.get('/boxes');
      boxes = boxesResponse.data?.boxes || boxesResponse.data || [];
      console.log(`✅ Got ${boxes.length} boxes`);
      console.log('📦 Sample box data:', boxes[0]);
    } catch (error) {
      console.error('❌ Boxes endpoint failed:', error.response?.status, error.response?.data || error.message);
    }
    
    // Try to get doctors
    try {
      console.log('🔍 Fetching doctors...');
      const doctorsResponse = await apiClient.get('/doctors');
      doctors = doctorsResponse.data?.doctors || doctorsResponse.data || [];
      console.log(`✅ Got ${doctors.length} doctors`);
      console.log('👨‍⚕️ Sample doctor data:', doctors[0]);
    } catch (error) {
      console.error('❌ Doctors endpoint failed:', error.response?.status, error.response?.data || error.message);
    }
    
    // Build summary with safe defaults
    const summary = {
      total_appointments: appointments.length,
      completed_appointments: appointments.filter(apt => apt.status === 'COMPLETED').length,
      pending_appointments: appointments.filter(apt => apt.status === 'SCHEDULED' || apt.status === 'PENDING').length,
      cancelled_appointments: appointments.filter(apt => apt.status === 'CANCELLED').length,
      total_boxes: boxes.length,
      active_boxes: boxes.filter(box => box.operational_status === 'ACTIVE').length,
      total_assignments: assignments.length,
      doctors_on_duty: doctors.filter(doc => doc.status === 'ACTIVE' || doc.status === 'ON_DUTY').slice(0, 5), // Limit to 5 doctors
      specialties_distribution: doctors.reduce((acc, doc) => {
        const specialty = doc.specialtyName || doc.specialty || doc.specialty_id || 'General';
        const existing = acc.find(s => s.specialty === specialty);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ specialty, count: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.count - a.count),
      date: today
    };
    
    console.log('📊 Built dashboard summary:', summary);
    return { data: summary };
  } catch (error) {
    console.warn('Using fallback mock data for dashboard');
    // Return a safe default summary if everything fails
    return {
      data: {
        total_appointments: 0,
        completed_appointments: 0,
        pending_appointments: 0,
        cancelled_appointments: 0,
        total_boxes: 0,
        active_boxes: 0,
        total_assignments: 0,
        doctors_on_duty: [],
        specialties_distribution: [],
        date: new Date().toISOString().split('T')[0]
      }
    };
  }
};

export const fetchAssignments = (params) => {
  return apiClient.get('/box-assignments', { params });
};

export const fetchAppointments = (params) => {
  return apiClient.get('/appointments', { params });
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