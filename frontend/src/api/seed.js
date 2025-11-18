import { faker } from '@faker-js/faker/locale/es';
import { api } from './client.js';

/**
 * Pobla la base de datos con datos de prueba usando la API
 * @param {Object} options - Opciones de generación
 * @param {number} options.numBoxes - Cantidad de boxes a crear (default: 10)
 * @param {number} options.numStaff - Cantidad de miembros de staff a crear (default: 8)
 * @param {number} options.numAppointments - Cantidad de citas a crear (default: 15)
 * @param {Function} options.onProgress - Callback para reportar progreso
 * @returns {Promise<Object>} - Resultado con estadísticas
 */
const boxStatusOptions = ['disponible', 'ocupado', 'mantenimiento'];
const boxStatusMap = {
  disponible: 'available',
  ocupado: 'occupied',
  mantenimiento: 'maintenance'
};

const appointmentStatusPool = [
  'scheduled', 'scheduled', 'scheduled',
  'confirmed', 'confirmed',
  'completed', 'completed', 'completed', 'completed',
  'cancelled',
  'no-show'
];

const pickRandom = (collection) => collection[Math.floor(Math.random() * collection.length)];

const createIdFormatter = (count = 1) => {
  const width = Math.max(3, String(Math.max(1, count)).length);
  return (index) => String(index).padStart(width, '0');
};

export async function seedDatabase(options = {}) {
  const {
    numBoxes = 10,
    numStaff = options.numDoctors ?? 8,
    numAppointments = 15,
    onProgress = () => {}
  } = options;

  const formatBoxId = createIdFormatter(numBoxes);
  const formatStaffId = createIdFormatter(numStaff);
  const formatAppointmentId = createIdFormatter(numAppointments);

  const results = {
    boxes: { success: 0, failed: 0, ids: [] },
    staff: { success: 0, failed: 0, ids: [] },
    appointments: { success: 0, failed: 0, ids: [] }
  };
  results.doctors = results.staff; // legacy consumer support

  try {
    // 1. Crear Boxes
    onProgress({ step: 'boxes', current: 0, total: numBoxes });
    const pasillos = ['A', 'B', 'C', 'D', 'E'];
    
    for (let i = 1; i <= numBoxes; i++) {
      const pasillo = pasillos[Math.floor(Math.random() * pasillos.length)];
      const id = formatBoxId(i);
      const estado = pickRandom(boxStatusOptions);

      try {
        await api.post('/boxes', {
          box: {
            id,
            nombre: `Box ${id}`,
            pasillo,
            estado,
            status: boxStatusMap[estado]
          }
        });
        results.boxes.success++;
        results.boxes.ids.push(id);
        onProgress({ step: 'boxes', current: i, total: numBoxes });
      } catch (error) {
        console.error(`Error creando box ${id}:`, error);
        results.boxes.failed++;
      }
    }

    // 2. Crear Staff
    onProgress({ step: 'staff', current: 0, total: numStaff });
    const especialidades = [
      'Medicina General', 'Cardiología', 'Dermatología', 'Pediatría',
      'Traumatología', 'Neurología', 'Oftalmología', 'Ginecología', 'Psiquiatría'
    ];
    
    for (let i = 1; i <= numStaff; i++) {
      const id = formatStaffId(i);
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const especialidad = especialidades[Math.floor(Math.random() * especialidades.length)];
      
      try {
        await api.post('/staff', {
          staff: {
            id,
            nombre: `${firstName} ${lastName}`,
            especialidad,
            specialty: especialidad,
            estado: Math.random() > 0.2 ? 'activo' : 'inactivo'
          }
        });
        results.staff.success++;
        results.staff.ids.push(id);
        onProgress({ step: 'staff', current: i, total: numStaff });
      } catch (error) {
        console.error(`Error creando staff ${id}:`, error);
        results.staff.failed++;
      }
    }

    // 3. Crear Citas
    onProgress({ step: 'appointments', current: 0, total: numAppointments });
    
    if (results.boxes.ids.length === 0 || results.staff.ids.length === 0) {
      throw new Error('No hay boxes o staff disponibles para crear citas. Ejecuta primero las secciones anteriores.');
    }

    for (let i = 1; i <= numAppointments; i++) {
      const id = formatAppointmentId(i);
      const boxId = results.boxes.ids[Math.floor(Math.random() * results.boxes.ids.length)];
      const staffId = results.staff.ids[Math.floor(Math.random() * results.staff.ids.length)];
      
      // Fecha aleatoria entre -7 días y +14 días
      const daysOffset = Math.floor(Math.random() * 21) - 7;
      const hour = Math.floor(Math.random() * 11) + 8; // 8-18h
      const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysOffset);
      startDate.setHours(hour, minute, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 30);
      
      try {
        await api.post('/appointments', {
          appointment: {
            id,
            idBox: boxId,
            idStaff: staffId,
            status: pickRandom(appointmentStatusPool),
            startAt: startDate.toISOString(),
            endAt: endDate.toISOString()
          }
        });
        results.appointments.success++;
        results.appointments.ids.push(id);
        onProgress({ step: 'appointments', current: i, total: numAppointments });
      } catch (error) {
        console.error(`Error creando cita ${id}:`, error);
        results.appointments.failed++;
      }
    }

    onProgress({ step: 'complete', results });
    return results;

  } catch (error) {
    console.error('Error general en seed:', error);
    throw error;
  }
}

/**
 * Limpia toda la base de datos
 * @returns {Promise<Object>} - Resultado con estadísticas
 */
export async function clearDatabaseBulk() {
  const results = {
    boxes: { deleted: 0, failed: 0 },
    staff: { deleted: 0, failed: 0 },
    appointments: { deleted: 0, failed: 0 }
  };
  results.doctors = results.staff;

  try {
    // Obtener TODAS las listas en paralelo
    const [appointmentsResponse, staffResponse, boxesResponse] = await Promise.all([
      api.get('/appointments'),
      api.get('/staff'),
      api.get('/boxes')
    ]);

    const appointments = appointmentsResponse.data.items || [];
    const staff = staffResponse.data.items || [];
    const boxes = boxesResponse.data.items || [];

    // Borrar TODO en paralelo (appointments, staff y boxes simultáneamente)
    const [appointmentResults, staffResults, boxResults] = await Promise.all([
      Promise.allSettled(
        appointments.map(appointment => 
          api.delete(`/appointments/${encodeURIComponent(appointment.id)}`)
        )
      ),
      Promise.allSettled(
        staff.map(member => 
          api.delete(`/staff/${encodeURIComponent(member.id)}`)
        )
      ),
      Promise.allSettled(
        boxes.map(box => 
          api.delete(`/boxes/${encodeURIComponent(box.id)}`)
        )
      )
    ]);
    
    results.appointments.deleted = appointmentResults.filter(r => r.status === 'fulfilled').length;
    results.appointments.failed = appointmentResults.filter(r => r.status === 'rejected').length;
    results.staff.deleted = staffResults.filter(r => r.status === 'fulfilled').length;
    results.staff.failed = staffResults.filter(r => r.status === 'rejected').length;
    results.boxes.deleted = boxResults.filter(r => r.status === 'fulfilled').length;
    results.boxes.failed = boxResults.filter(r => r.status === 'rejected').length;

    return results;

  } catch (error) {
    console.error('Error general limpiando BD:', error);
    throw error;
  }
}

/**
 * Limpia toda la base de datos 
 * @param {Object} options - Opciones
 * @param {Function} options.onProgress - Callback para reportar progreso
 * @returns {Promise<Object>} - Resultado con estadísticas
 */
export async function clearDatabase(options = {}) {
  const { onProgress = () => {} } = options;
  
  const results = {
    boxes: { deleted: 0, failed: 0 },
    staff: { deleted: 0, failed: 0 },
    appointments: { deleted: 0, failed: 0 }
  };
  results.doctors = results.staff;

  try {
    // 1. Borrar Citas
    onProgress({ step: 'appointments', message: 'Obteniendo citas...' });
    const appointmentsResponse = await api.get('/appointments');
    const appointments = appointmentsResponse.data.items || [];
    
    for (let i = 0; i < appointments.length; i++) {
      try {
        await api.delete(`/appointments/${encodeURIComponent(appointments[i].id)}`);
        results.appointments.deleted++;
        onProgress({ 
          step: 'appointments', 
          current: i + 1, 
          total: appointments.length 
        });
      } catch (error) {
        console.error(`Error borrando cita ${appointments[i].id}:`, error);
        results.appointments.failed++;
      }
    }

    // 2. Borrar Staff
    onProgress({ step: 'staff', message: 'Obteniendo staff...' });
    const staffResponse = await api.get('/staff');
    const staff = staffResponse.data.items || [];
    
    for (let i = 0; i < staff.length; i++) {
      try {
        await api.delete(`/staff/${encodeURIComponent(staff[i].id)}`);
        results.staff.deleted++;
        onProgress({ 
          step: 'staff', 
          current: i + 1, 
          total: staff.length 
        });
      } catch (error) {
        console.error(`Error borrando staff ${staff[i].id}:`, error);
        results.staff.failed++;
      }
    }

    // 3. Borrar Boxes
    onProgress({ step: 'boxes', message: 'Obteniendo boxes...' });
    const boxesResponse = await api.get('/boxes');
    const boxes = boxesResponse.data.items || [];
    
    for (let i = 0; i < boxes.length; i++) {
      try {
        await api.delete(`/boxes/${encodeURIComponent(boxes[i].id)}`);
        results.boxes.deleted++;
        onProgress({ 
          step: 'boxes', 
          current: i + 1, 
          total: boxes.length 
        });
      } catch (error) {
        console.error(`Error borrando box ${boxes[i].id}:`, error);
        results.boxes.failed++;
      }
    }

    onProgress({ step: 'complete', results });
    return results;

  } catch (error) {
    console.error('Error general limpiando BD:', error);
    throw error;
  }
}
