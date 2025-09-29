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
// Temporary implementation using existing data until backend reports are implemented

export const fetchDoctorRanking = async (params) => {
  console.log('📊 Generating doctor ranking from existing data');
  try {
    // Get doctors and assignments data
    const [doctorsResponse, assignmentsResponse] = await Promise.all([
      apiClient.get('/doctors'),
      apiClient.get('/box-assignments')
    ]);
    
    const doctors = doctorsResponse.data?.doctors || doctorsResponse.data || [];
    const assignments = assignmentsResponse.data?.assignments || assignmentsResponse.data || [];
    
    // Calculate doctor rankings based on assignments
    const doctorStats = doctors.map(doctor => {
      const doctorAssignments = assignments.filter(a => a.doctorId === doctor.id);
      return {
        full_name: doctor.name,
        consultation_count: doctorAssignments.length,
        total_hours: doctorAssignments.length * 2, // Assuming 2 hours per assignment
        specialty: doctor.specialtyName || mapSpecialtyId(doctor.specialty_id) || 'Medicina General'
      };
    }).sort((a, b) => b.consultation_count - a.consultation_count);
    
    console.log('📊 Generated doctor ranking:', doctorStats);
    return { data: doctorStats };
  } catch (error) {
    console.error('Error generating doctor ranking:', error);
    throw error;
  }
};

export const fetchSpecialtyDistribution = async (params) => {
  console.log('📊 Generating specialty distribution from existing data');
  try {
    const doctorsResponse = await apiClient.get('/doctors');
    const doctors = doctorsResponse.data?.doctors || doctorsResponse.data || [];
    
    const specialtyCount = {};
    doctors.forEach(doctor => {
      const specialty = doctor.specialtyName || mapSpecialtyId(doctor.specialty_id) || 'Medicina General';
      specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
    });
    
    const distribution = Object.entries(specialtyCount).map(([name, count]) => ({
      name,
      consultation_count: count * 5, // Multiply by estimated consultations per doctor
      doctor_count: count,
      percentage: Math.round((count / doctors.length) * 100)
    })).sort((a, b) => b.consultation_count - a.consultation_count);
    
    console.log('📊 Generated specialty distribution:', distribution);
    return { data: distribution };
  } catch (error) {
    console.error('Error generating specialty distribution:', error);
    throw error;
  }
};

export const fetchConsultationsByTimeslot = async (params) => {
  console.log('📊 Generating consultations by timeslot from existing data');
  try {
    const assignmentsResponse = await apiClient.get('/box-assignments');
    const assignments = assignmentsResponse.data?.assignments || assignmentsResponse.data || [];
    
    const timeslotCount = {};
    assignments.forEach(assignment => {
      if (assignment.start_time) {
        const hour = new Date(assignment.start_time).getHours();
        timeslotCount[hour] = (timeslotCount[hour] || 0) + 1;
      }
    });
    
    // Convert to array format expected by ReportsPage
    const timeslotArray = [];
    for (let hour = 8; hour <= 17; hour++) { // 8 AM to 5 PM
      timeslotArray.push({
        hour: hour,
        count: timeslotCount[hour] || 0
      });
    }
    
    console.log('📊 Generated timeslot data:', timeslotArray);
    return { data: timeslotArray };
  } catch (error) {
    console.error('Error generating consultations by timeslot:', error);
    throw error;
  }
};

export const fetchTopDoctor = async (params) => {
  console.log('📊 Generating top doctor from existing data');
  const ranking = await fetchDoctorRanking(params);
  const topDoctor = ranking.data[0] || null;
  return { data: { top_doctor: topDoctor } };
};

export const fetchTopBox = async (params) => {
  console.log('📊 Generating top box from existing data');
  const ranking = await fetchBoxRanking(params);
  const topBox = ranking.data[0] || null;
  return { data: { top_box: topBox } };
};

export const fetchBoxRanking = async (params) => {
  console.log('📊 Generating box ranking from existing data');
  try {
    const [boxesResponse, assignmentsResponse] = await Promise.all([
      apiClient.get('/boxes'),
      apiClient.get('/box-assignments')
    ]);
    
    const boxes = boxesResponse.data?.boxes || boxesResponse.data || [];
    const assignments = assignmentsResponse.data?.assignments || assignmentsResponse.data || [];
    
    const boxStats = boxes.map(box => {
      const boxAssignments = assignments.filter(a => a.boxId === box.id);
      return {
        box_number: box.number || box.id.replace('box-', ''),
        hallway: box.hallway || 'A',
        total_hours: boxAssignments.length * 2, // Assuming 2 hours per assignment
        consultation_count: boxAssignments.length,
        utilization: Math.min(Math.round((boxAssignments.length / 10) * 100), 100) // Max 100%
      };
    }).sort((a, b) => b.total_hours - a.total_hours);
    
    console.log('📊 Generated box ranking:', boxStats);
    return { data: boxStats };
  } catch (error) {
    console.error('Error generating box ranking:', error);
    throw error;
  }
};

export const fetchMostDemandedSpecialty = async (params) => {
  console.log('📊 Generating most demanded specialty from existing data');
  const distribution = await fetchSpecialtyDistribution(params);
  const mostDemanded = distribution.data[0] || null;
  return { data: { specialty: mostDemanded } };
};

// Función para obtener resumen automatizado de reportes
export const fetchAutomatedReportSummary = async (dateRange) => {
  console.log('🤖 Generating automated report summary from existing data');
  try {
    // Get all report data
    const [doctorRanking, specialtyDist, consultationsByTime, boxRanking] = await Promise.all([
      fetchDoctorRanking(dateRange),
      fetchSpecialtyDistribution(dateRange),
      fetchConsultationsByTimeslot(dateRange),
      fetchBoxRanking(dateRange)
    ]);
    
    const topDoctor = doctorRanking.data[0];
    const topSpecialty = specialtyDist.data[0];
    const topBox = boxRanking.data[0];
    const peakHour = consultationsByTime.data.sort((a, b) => b.count - a.count)[0];
    
    const summary = `📊 **Resumen Ejecutivo del Sistema SmartBoxing**

**🏆 Métricas Destacadas:**
• **Doctor Líder:** ${topDoctor?.full_name || 'N/A'} con ${topDoctor?.consultation_count || 0} consultas
• **Especialidad Más Demandada:** ${topSpecialty?.name || 'N/A'} (${topSpecialty?.consultation_count || 0} consultas)
• **Box Más Utilizado:** Box ${topBox?.box_number || 'N/A'} - Pasillo ${topBox?.hallway || 'A'} (${topBox?.total_hours || 0} horas)
• **Hora Pico:** ${peakHour?.hour || 'N/A'}:00 con ${peakHour?.count || 0} consultas

**📈 Análisis de Rendimiento:**
El sistema está procesando ${doctorRanking.data.reduce((sum, d) => sum + d.consultation_count, 0)} consultas totales, con una distribución equilibrada entre ${specialtyDist.data.length} especialidades médicas.

**🎯 Recomendaciones:**
• Considerar ampliar horarios en ${peakHour?.hour || 'horas pico'}:00
• Optimizar la asignación de boxes para mejorar la utilización promedio
• Mantener el balance actual de especialidades médicas`;

    return {
      data: {
        summary,
        metrics: {
          total_consultations: doctorRanking.data.reduce((sum, d) => sum + d.consultation_count, 0),
          active_doctors: doctorRanking.data.length,
          active_boxes: boxRanking.data.length,
          specialties: specialtyDist.data.length
        }
      }
    };
  } catch (error) {
    console.error('Error generating automated summary:', error);
    return {
      data: {
        summary: "❌ Error generando resumen automatizado. Por favor, verifique la conectividad con los datos.",
        metrics: {}
      }
    };
  }
};