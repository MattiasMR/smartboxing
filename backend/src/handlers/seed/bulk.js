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

const padId = (count) => {
  const width = Math.max(3, String(Math.max(count, 1)).length);
  return (index) => String(index).padStart(width, '0');
};

const randomFrom = (array) => array[Math.floor(Math.random() * array.length)];

// Generar boxes
const generateBoxes = (count, tenantId) => {
  const boxes = [];
  const pasillos = ['A', 'B', 'C', 'D', 'E'];
  const formatId = padId(count);
  
  for (let i = 1; i <= count; i++) {
    const pasillo = randomFrom(pasillos);
    const id = formatId(i);
    const estado = randomFrom(boxStatusOptions);
    
    boxes.push({
      PutRequest: {
        Item: {
          tenantId,
          id,
          nombre: `Box ${id}`,
          pasillo,
          estado,
          status: boxStatusMap[estado],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  }
  
  return boxes;
};

// Generar staff
const generateStaff = (count, tenantId) => {
  const staff = [];
  const especialidades = [
    'Medicina General', 'Cardiología', 'Dermatología', 'Pediatría',
    'Traumatología', 'Neurología', 'Oftalmología', 'Ginecología', 'Psiquiatría'
  ];
  const formatId = padId(count);
  
  for (let i = 1; i <= count; i++) {
    const id = formatId(i);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const especialidad = randomFrom(especialidades);
    
    staff.push({
      PutRequest: {
        Item: {
          tenantId,
          id,
          nombre: `${firstName} ${lastName}`,
          especialidad,
          specialty: especialidad,
          estado: Math.random() > 0.2 ? 'activo' : 'inactivo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  }
  
  return staff;
};

// Generar citas
const generateAppointments = (count, boxIds, staffIds, tenantId) => {
  if (!boxIds.length || !staffIds.length) return [];
  const appointments = [];
  const formatId = padId(count);
  
  for (let i = 1; i <= count; i++) {
    const id = formatId(i);
    const boxId = randomFrom(boxIds);
    const staffId = randomFrom(staffIds);
    
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
          tenantId,
          id,
          idBox: boxId,
          idStaff: staffId,
          status: randomFrom(appointmentStatusPool),
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
  const numStaff = parseInt(body.numStaff ?? body.numDoctors) || 8;
  const numAppointments = parseInt(body.numAppointments) || 15;

  console.log(`Generando: ${numBoxes} boxes, ${numStaff} miembros de staff, ${numAppointments} citas para tenant ${tenantId}`);

  // Generar datos
  const boxes = generateBoxes(numBoxes, tenantId);
  const staff = generateStaff(numStaff, tenantId);
  
  // Extraer IDs para las citas
  const boxIds = boxes.map(b => b.PutRequest.Item.id);
  const staffIds = staff.map(d => d.PutRequest.Item.id);
  
  const appointments = generateAppointments(numAppointments, boxIds, staffIds, tenantId);

  // Escribir en lotes
  const staffStats = { success: 0, failed: 0 };
  const results = {
    boxes: { success: 0, failed: 0 },
    staff: staffStats,
    doctors: staffStats,
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

  // Staff
  const staffChunks = chunkArray(staff, 25);
  for (const chunk of staffChunks) {
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [process.env.T_STAFF]: chunk
        }
      }));
      results.staff.success += chunk.length;
    } catch (error) {
      console.error('Error escribiendo staff:', error);
      results.staff.failed += chunk.length;
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
      staff: `${results.staff.success}/${numStaff} creados`,
      doctors: `${results.staff.success}/${numStaff} creados`,
      appointments: `${results.appointments.success}/${numAppointments} creados`
    }
  };
});
