import { faker } from '@faker-js/faker/locale/es';
import { api } from './client.js';

/**
 * Pobla la base de datos con datos de prueba usando la API
 * @param {Object} options - Opciones de generación
 * @param {number} options.numBoxes - Cantidad de boxes a crear (default: 10)
 * @param {number} options.numDoctors - Cantidad de doctores a crear (default: 8)
 * @param {number} options.numAppointments - Cantidad de citas a crear (default: 15)
 * @param {Function} options.onProgress - Callback para reportar progreso
 * @returns {Promise<Object>} - Resultado con estadísticas
 */
export async function seedDatabase(options = {}) {
  const {
    numBoxes = 10,
    numDoctors = 8,
    numAppointments = 15,
    onProgress = () => {}
  } = options;

  const results = {
    boxes: { success: 0, failed: 0, ids: [] },
    doctors: { success: 0, failed: 0, ids: [] },
    appointments: { success: 0, failed: 0, ids: [] }
  };

  try {
    // 1. Crear Boxes
    onProgress({ step: 'boxes', current: 0, total: numBoxes });
    const pasillos = ['A', 'B', 'C', 'D', 'E'];
    
    for (let i = 1; i <= numBoxes; i++) {
      const pasillo = pasillos[Math.floor(Math.random() * pasillos.length)];
      const id = `BOX-${pasillo}${i}`;
      const estados = ['disponible', 'ocupado', 'mantenimiento'];
      
      try {
        await api.post('/boxes', {
          box: {
            id,
            nombre: `Box ${pasillo}${i}`,
            pasillo,
            estado: estados[Math.floor(Math.random() * estados.length)]
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

    // 2. Crear Doctores
    onProgress({ step: 'doctors', current: 0, total: numDoctors });
    const especialidades = [
      'Pediatría', 'Traumatología', 'Dermatología', 'Cardiología',
      'Neurología', 'Oftalmología', 'Ginecología', 'Medicina General', 'Psiquiatría'
    ];
    
    const timestamp = Date.now();
    for (let i = 1; i <= numDoctors; i++) {
      const id = `DOCTOR-${String(timestamp + i).slice(-6)}`;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const genero = Math.random() > 0.5 ? 'Dr.' : 'Dra.';
      const especialidad = especialidades[Math.floor(Math.random() * especialidades.length)];
      
      try {
        await api.post('/doctors', {
          doctor: {
            id,
            nombre: `${genero} ${firstName} ${lastName}`,
            especialidad,
            estado: Math.random() > 0.2 ? 'activo' : 'inactivo'
          }
        });
        results.doctors.success++;
        results.doctors.ids.push(id);
        onProgress({ step: 'doctors', current: i, total: numDoctors });
      } catch (error) {
        console.error(`Error creando doctor ${id}:`, error);
        results.doctors.failed++;
      }
    }

    // 3. Crear Citas
    onProgress({ step: 'appointments', current: 0, total: numAppointments });
    
    const apptTimestamp = Date.now();
    for (let i = 1; i <= numAppointments; i++) {
      const id = `APPT-${String(apptTimestamp + i).slice(-6)}`;
      const boxId = results.boxes.ids[Math.floor(Math.random() * results.boxes.ids.length)];
      const doctorId = results.doctors.ids[Math.floor(Math.random() * results.doctors.ids.length)];
      
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
            idDoctor: doctorId,
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
    doctors: { deleted: 0, failed: 0 },
    appointments: { deleted: 0, failed: 0 }
  };

  try {
    // Obtener TODAS las listas en paralelo
    const [appointmentsResponse, doctorsResponse, boxesResponse] = await Promise.all([
      api.get('/appointments'),
      api.get('/doctors'),
      api.get('/boxes')
    ]);

    const appointments = appointmentsResponse.data.items || [];
    const doctors = doctorsResponse.data.items || [];
    const boxes = boxesResponse.data.items || [];

    // Borrar TODO en paralelo (appointments, doctors y boxes simultáneamente)
    const [appointmentResults, doctorResults, boxResults] = await Promise.all([
      Promise.allSettled(
        appointments.map(appointment => 
          api.delete(`/appointments/${encodeURIComponent(appointment.id)}`)
        )
      ),
      Promise.allSettled(
        doctors.map(doctor => 
          api.delete(`/doctors/${encodeURIComponent(doctor.id)}`)
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
    results.doctors.deleted = doctorResults.filter(r => r.status === 'fulfilled').length;
    results.doctors.failed = doctorResults.filter(r => r.status === 'rejected').length;
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
  const results = {
    boxes: { deleted: 0, failed: 0 },
    doctors: { deleted: 0, failed: 0 },
    appointments: { deleted: 0, failed: 0 }
  };

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

    // 2. Borrar Doctores
    onProgress({ step: 'doctors', message: 'Obteniendo doctores...' });
    const doctorsResponse = await api.get('/doctors');
    const doctors = doctorsResponse.data.items || [];
    
    for (let i = 0; i < doctors.length; i++) {
      try {
        await api.delete(`/doctors/${encodeURIComponent(doctors[i].id)}`);
        results.doctors.deleted++;
        onProgress({ 
          step: 'doctors', 
          current: i + 1, 
          total: doctors.length 
        });
      } catch (error) {
        console.error(`Error borrando doctor ${doctors[i].id}:`, error);
        results.doctors.failed++;
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
