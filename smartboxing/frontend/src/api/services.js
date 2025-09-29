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

// Fetch details for a single box - Use data from /boxes list
export const fetchBoxDetails = async (boxId) => {
  console.log('🔍 Fetching box details for:', boxId);
  
  // Since we don't have /boxes/{id} endpoint, get from the list
  try {
    const boxesResponse = await apiClient.get('/boxes');
    const boxes = boxesResponse.data?.boxes || boxesResponse.data || [];
    
    const box = boxes.find(b => b.id === boxId);
    
    if (box) {
      console.log('✅ Found box in list:', box);
      
      // Map real data structure to expected frontend structure  
      const mappedBox = {
        // Basic info mapping
        ...box,
        full_name: box.name || `Box ${box.number}`,
        
        // Status mapping
        is_operational: box.operational_status === 'ACTIVE',
        occupancy_status: box.occupancy_status || 'AVAILABLE',
        occupancy_percentage: box.occupancy_percentage || calculateBoxOccupancy(boxId),
        
        // Equipment mapping
        equipment: box.equipment_list || [],
        
        // Location details
        location_details: {
          hallway: box.hallway,
          number: box.number,
          description: box.description || 'Box de consulta médica'
        },
        
        // Usage statistics (mock data for now)
        usage_stats: {
          appointments_today: Math.floor(Math.random() * 8) + 2,
          average_duration: '45 min',
          utilization_rate: calculateBoxOccupancy(boxId)
        }
      };
      
      console.log('📋 Mapped box data:', mappedBox);
      return { data: mappedBox };
    } else {
      throw new Error(`Box ${boxId} not found`);
    }
  } catch (error) {
    console.error('❌ Error fetching box details:', error);
    throw error;
  }
};

// Helper function to calculate box occupancy
function calculateBoxOccupancy(boxId) {
  // Generate realistic occupancy based on box ID
  const hash = boxId.split('-')[1] || '001';
  const num = parseInt(hash, 10) || 1;
  return Math.min(30 + (num % 40), 95); // Between 30-95% occupancy
}

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
      
      // Fetch weekly assignments for this doctor
      let weeklyAssignments = [];
      try {
        console.log('📅 Fetching weekly assignments for doctor:', doctorId);
        const assignmentsResponse = await apiClient.get('/box-assignments', {
          params: { doctor: doctorId }
        });
        const rawAssignments = assignmentsResponse.data?.assignments || assignmentsResponse.data || [];
        console.log('📅 Got assignments for doctor:', rawAssignments);
        
        // Log the first assignment to see its structure
        if (rawAssignments.length > 0) {
          console.log('📅 First assignment structure:', rawAssignments[0]);
        }
        
        // Enrich assignments with box information if needed
        if (rawAssignments.length > 0) {
          try {
            const boxesResponse = await apiClient.get('/boxes');
            const boxes = boxesResponse.data?.boxes || boxesResponse.data || [];
            console.log('� Got boxes for enrichment:', boxes);
            
            // Enrich each assignment with box details
            weeklyAssignments = rawAssignments.map(assignment => {
              const boxInfo = boxes.find(box => box.id === assignment.boxId);
              return {
                ...assignment,
                box: boxInfo || { 
                  id: assignment.boxId, 
                  number: assignment.boxId?.replace('box-', '') || 'N/A',
                  hallway: 'A' // Default hallway
                }
              };
            });
            console.log('📅 Enriched assignments:', weeklyAssignments);
          } catch (boxError) {
            console.error('⚠️ Error fetching boxes for enrichment:', boxError);
            weeklyAssignments = rawAssignments;
          }
        }
      } catch (error) {
        console.error('⚠️ Error fetching doctor assignments:', error);
        weeklyAssignments = [];
      }
      
      // Map real data structure to expected frontend structure
      const mappedDoctor = {
        // Basic info mapping
        ...doctor,
        full_name: doctor.name, // Map 'name' to 'full_name'
        
        // Specialty mapping  
        specialty: {
          name: doctor.specialtyName || mapSpecialtyId(doctor.specialty_id) || 'Medicina General'
        },
        
        // Status mapping
        is_on_duty_today: doctor.status === 'ON_DUTY' || doctor.status === 'ACTIVE',
        is_on_vacation_today: doctor.status === 'ON_VACATION',
        
        // KPIs - using mock data since we don't have real metrics
        assigned_hours_weekly: calculateWeeklyHours(doctor.status),
        consultations_this_week: calculateWeeklyConsultations(doctorId),
        most_used_boxes: generateMostUsedBoxes(),
        
        // Schedule - using real assignments
        weekly_schedule: weeklyAssignments,
        appointments_count: weeklyAssignments.length,
        schedule: weeklyAssignments
      };
      
      console.log('📋 Mapped doctor data:', mappedDoctor);
      return { data: mappedDoctor };
    } else {
      throw new Error(`Doctor ${doctorId} not found`);
    }
  } catch (error) {
    console.error('❌ Error fetching doctor details:', error);
    throw error;
  }
};

// Helper functions for mapping data
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

function calculateWeeklyHours(status) {
  if (status === 'ON_DUTY' || status === 'ACTIVE') return 40;
  if (status === 'ON_VACATION') return 0;
  return 32; // Part time
}

function calculateWeeklyConsultations(doctorId) {
  // Generate realistic number based on doctor ID
  const hash = doctorId.split('-')[1] || '001';
  const num = parseInt(hash, 10) || 1;
  return Math.min(15 + (num % 10), 25); // Between 15-25 consultations
}

function generateMostUsedBoxes() {
  return [
    { box__name: 'Consulta General 1', box__hallway: 'A', box__number: '101', count: 12 },
    { box__name: 'Consulta General 2', box__hallway: 'A', box__number: '102', count: 8 },
    { box__name: 'Consulta Especializada', box__hallway: 'B', box__number: '201', count: 5 }
  ];
}

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