import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { faker } from '@faker-js/faker/locale/es';
import { handler, parseBody } from '../../lib/http.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Función para dividir en lotes de 25 (límite de BatchWrite)
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Generar boxes
const generateBoxes = (count, tenantId) => {
  const boxes = [];
  const pasillos = ['A', 'B', 'C', 'D', 'E'];
  
  for (let i = 1; i <= count; i++) {
    const pasillo = pasillos[Math.floor(Math.random() * pasillos.length)];
    const id = `BOX-${pasillo}${i}`;
    const estados = ['disponible', 'ocupado', 'mantenimiento'];
    
    boxes.push({
      PutRequest: {
        Item: {
          tenantId: tenantId,
          id: id,
          nombre: `Box ${pasillo}${i}`,
          pasillo: pasillo,
          estado: estados[Math.floor(Math.random() * estados.length)],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  }
  
  return boxes;
};

// Generar doctores
const generateDoctors = (count, tenantId) => {
  const doctors = [];
  const especialidades = [
    'Pediatría', 'Traumatología', 'Dermatología', 'Cardiología',
    'Neurología', 'Oftalmología', 'Ginecología', 'Medicina General', 'Psiquiatría'
  ];
  
  for (let i = 1; i <= count; i++) {
    const id = `DOCTOR-${String(i).padStart(3, '0')}`;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const genero = Math.random() > 0.5 ? 'Dr.' : 'Dra.';
    const especialidad = especialidades[Math.floor(Math.random() * especialidades.length)];
    
    doctors.push({
      PutRequest: {
        Item: {
          tenantId: tenantId,
          id: id,
          nombre: `${genero} ${firstName} ${lastName}`,
          especialidad: especialidad,
          estado: Math.random() > 0.2 ? 'activo' : 'inactivo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  }
  
  return doctors;
};

// Generar citas
const generateAppointments = (count, boxIds, doctorIds, tenantId) => {
  const appointments = [];
  
  for (let i = 1; i <= count; i++) {
    const id = `APPT-${String(i).padStart(3, '0')}`;
    const boxId = boxIds[Math.floor(Math.random() * boxIds.length)];
    const doctorId = doctorIds[Math.floor(Math.random() * doctorIds.length)];
    
    // Fecha aleatoria entre -7 días y +14 días
    const daysOffset = Math.floor(Math.random() * 21) - 7;
    const hour = Math.floor(Math.random() * 11) + 8; // 8-18h
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + daysOffset);
    startDate.setHours(hour, minute, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    appointments.push({
      PutRequest: {
        Item: {
          tenantId: tenantId,
          id: id,
          idBox: boxId,
          idDoctor: doctorId,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  }
  
  return appointments;
};

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  
  const body = parseBody(event);
  const numBoxes = parseInt(body.numBoxes) || 10;
  const numDoctors = parseInt(body.numDoctors) || 8;
  const numAppointments = parseInt(body.numAppointments) || 15;

  console.log(`Generando: ${numBoxes} boxes, ${numDoctors} doctores, ${numAppointments} citas para tenant ${tenantId}`);

  // Generar datos
  const boxes = generateBoxes(numBoxes, tenantId);
  const doctors = generateDoctors(numDoctors, tenantId);
  
  // Extraer IDs para las citas
  const boxIds = boxes.map(b => b.PutRequest.Item.id);
  const doctorIds = doctors.map(d => d.PutRequest.Item.id);
  
  const appointments = generateAppointments(numAppointments, boxIds, doctorIds, tenantId);

  // Escribir en lotes
  const results = {
    boxes: { success: 0, failed: 0 },
    doctors: { success: 0, failed: 0 },
    appointments: { success: 0, failed: 0 }
  };

  // Boxes
  const boxChunks = chunkArray(boxes, 25);
  for (const chunk of boxChunks) {
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [process.env.T_BOXES]: chunk
        }
      }));
      results.boxes.success += chunk.length;
    } catch (error) {
      console.error('Error escribiendo boxes:', error);
      results.boxes.failed += chunk.length;
    }
  }

  // Doctors
  const doctorChunks = chunkArray(doctors, 25);
  for (const chunk of doctorChunks) {
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [process.env.T_DOCTORS]: chunk
        }
      }));
      results.doctors.success += chunk.length;
    } catch (error) {
      console.error('Error escribiendo doctores:', error);
      results.doctors.failed += chunk.length;
    }
  }

  // Appointments
  const appointmentChunks = chunkArray(appointments, 25);
  for (const chunk of appointmentChunks) {
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [process.env.T_APPOINTMENTS]: chunk
        }
      }));
      results.appointments.success += chunk.length;
    } catch (error) {
      console.error('Error escribiendo citas:', error);
      results.appointments.failed += chunk.length;
    }
  }

  return {
    message: 'Base de datos poblada exitosamente',
    results: results,
    summary: {
      boxes: `${results.boxes.success}/${numBoxes} creados`,
      doctors: `${results.doctors.success}/${numDoctors} creados`,
      appointments: `${results.appointments.success}/${numAppointments} creados`
    }
  };
});
