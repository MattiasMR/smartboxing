import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { faker } from '@faker-js/faker';

const client = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

const tenantId = process.env.SEED_TENANT ?? 'TENANT-demo';

// Cantidad de registros a crear (modificable vía env vars)
const NUM_BOXES = parseInt(process.env.NUM_BOXES || '10', 10);
const NUM_STAFF = parseInt(process.env.NUM_STAFF || process.env.NUM_DOCTORS || '8', 10);
const NUM_APPOINTMENTS = parseInt(process.env.NUM_APPOINTMENTS || '15', 10);

async function seedTable(table, items) {
  for (const Item of items) {
    await doc.send(new PutCommand({ TableName: table, Item }));
    console.log(`[seed] ${table} ->`, Item.id ?? Item.startAt);
  }
}

function generateBoxes(count) {
  const boxes = [];
  const pasillos = ['A', 'B', 'C', 'D', 'E'];
  const estados = ['disponible', 'ocupado', 'mantenimiento'];
  
  for (let i = 1; i <= count; i++) {
    const pasillo = faker.helpers.arrayElement(pasillos);
    boxes.push({
      tenantId,
      id: `BOX-${pasillo}${i}`,
      nombre: `Box ${pasillo}${i}`,
      pasillo,
      estado: faker.helpers.arrayElement(estados),
    });
  }
  return boxes;
}

function generateStaff(count) {
  const staff = [];
  const especialidades = [
    'Pediatría',
    'Traumatología',
    'Dermatología',
    'Cardiología',
    'Neurología',
    'Oftalmología',
    'Ginecología',
    'Psiquiatría',
    'Medicina General',
  ];
  
  for (let i = 1; i <= count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const gender = faker.helpers.arrayElement(['male', 'female']);
    const prefix = gender === 'female' ? 'Dra.' : 'Dr.';
    
    staff.push({
      tenantId,
      id: `DOCTOR-${String(i).padStart(3, '0')}`,
      nombre: `${prefix} ${firstName} ${lastName}`,
      especialidad: faker.helpers.arrayElement(especialidades),
      estado: faker.helpers.arrayElement(['activo', 'inactivo']),
    });
  }
  return staff;
}

function generateAppointments(count, boxes, staff) {
  const appointments = [];
  const now = new Date();
  
  for (let i = 1; i <= count; i++) {
    const box = faker.helpers.arrayElement(boxes);
    const staffMember = faker.helpers.arrayElement(staff);
    
    // Generar fecha aleatoria entre -7 días y +14 días
    const daysOffset = faker.number.int({ min: -7, max: 14 });
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + daysOffset);
    startDate.setHours(faker.number.int({ min: 8, max: 18 }), faker.helpers.arrayElement([0, 15, 30, 45]), 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + faker.number.int({ min: 30, max: 120 }));
    
    appointments.push({
      tenantId,
      id: `APPT-${String(i).padStart(3, '0')}`,
      idBox: box.id,
      idStaff: staffMember.id,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
    });
  }
  return appointments;
}

async function main() {
  const T_BOXES = process.env.T_BOXES;
  const T_STAFF = process.env.T_STAFF;
  const T_APPOINTMENTS = process.env.T_APPOINTMENTS;
  
  if (!T_BOXES) throw new Error('Falta T_BOXES');
  if (!T_STAFF) throw new Error('Falta T_STAFF');
  if (!T_APPOINTMENTS) throw new Error('Falta T_APPOINTMENTS');

  console.log(`🌱 Generando ${NUM_BOXES} boxes, ${NUM_STAFF} miembros de staff, ${NUM_APPOINTMENTS} citas...`);
  
  // Generar datos
  const boxes = generateBoxes(NUM_BOXES);
  const staff = generateStaff(NUM_STAFF);
  const appointments = generateAppointments(NUM_APPOINTMENTS, boxes, staff);

  // Insertar en DynamoDB
  console.log('\n📦 Insertando Boxes...');
  await seedTable(T_BOXES, boxes);
  
  console.log('\n👥 Insertando Staff...');
  await seedTable(T_STAFF, staff);
  
  console.log('\n📅 Insertando Citas...');
  await seedTable(T_APPOINTMENTS, appointments);

  console.log('\n✅ Seed completado exitosamente!');
  console.log(`   - ${boxes.length} boxes creados`);
  console.log(`   - ${staff.length} miembros de staff creados`);
  console.log(`   - ${appointments.length} citas creadas`);
}

main().catch((e) => { console.error(e); process.exit(1); });
