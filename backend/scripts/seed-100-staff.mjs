/**
 * Population script - Creates 100 staff members with realistic data
 * Usage: node backend/scripts/seed-100-staff.mjs
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_STAFF = process.env.T_STAFF || 'smartboxing-Staff-dev';
const TABLE_BOXES = process.env.T_BOXES || 'smartboxing-Boxes-dev';
const TABLE_BOOKINGS = process.env.T_APPOINTMENTS || 'smartboxing-Appointments-dev';

// Realistic Spanish names
const firstNames = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Francisco', 'Isabel',
  'Antonio', 'Rosa', 'Manuel', 'Teresa', 'Pedro', 'Lucía', 'Ángel', 'Patricia', 'Javier', 'Marta',
  'Miguel', 'Cristina', 'Fernando', 'Elena', 'Rafael', 'Sofía', 'Diego', 'Raquel', 'Sergio', 'Natalia',
  'Daniel', 'Beatriz', 'Alejandro', 'Paula', 'Roberto', 'Silvia', 'Jorge', 'Andrea', 'Alberto', 'Verónica',
  'Andrés', 'Monica', 'Ricardo', 'Alicia', 'Ernesto', 'Claudia', 'Eduardo', 'Virginia', 'Ramón', 'Pilar',
  'Guillermo', 'Inés', 'Raúl', 'Eva', 'Pablo', 'Julia', 'Marcos', 'Clara', 'Emilio', 'Sara'
];

const lastNames = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Molina',
  'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Nuñez', 'Medina', 'Garrido', 'Santos',
  'Castillo', 'Cortés', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz', 'Flores', 'Herrera'
];

const specialties = [
  'Gestión General', 'Logística', 'Atención al Cliente', 'Operaciones', 'Mantenimiento',
  'Coordinación', 'Administración', 'Soporte Técnico', 'Recursos Humanos', 'Finanzas',
  'Marketing', 'Ventas', 'Calidad', 'Seguridad', 'Limpieza'
];

const statuses = ['active', 'inactive', 'on_leave'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmail(firstName, lastName, index) {
  const first = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const last = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${first}.${last}${index > 0 ? index : ''}@smartboxing.com`;
}

function generatePhone() {
  const prefix = '+56';
  const number = Math.floor(900000000 + Math.random() * 100000000);
  return `${prefix}${number}`;
}

function generateStaffMember(index, tenantId = 'default-tenant') {
  const firstName = getRandomElement(firstNames);
  const lastName = `${getRandomElement(lastNames)} ${getRandomElement(lastNames)}`;
  const email = generateEmail(firstName, lastName, index);
  const specialty = getRandomElement(specialties);
  const status = index < 90 ? 'active' : getRandomElement(statuses); // 90% active

  return {
    pk: `TENANT#${tenantId}`,
    sk: `DOCTOR#${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    entity: 'Doctor',
    tenantId,
    name: `${firstName} ${lastName}`,
    email,
    phone: generatePhone(),
    specialty,
    schedule: {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '10:00', end: '14:00', enabled: index % 3 === 0 }, // 33% trabajan sábados
      sunday: { start: null, end: null, enabled: false },
    },
    status,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(), // Random date last year
    updatedAt: new Date().toISOString(),
  };
}

async function populateStaff(count = 100) {
  console.log(`🚀 Starting population of ${count} staff members...`);
  console.log(`📦 Target table: ${TABLE_STAFF}\n`);

  const tenantId = 'default-tenant';
  const created = [];
  const failed = [];

  for (let i = 0; i < count; i++) {
    try {
      const staff = generateStaffMember(i, tenantId);
      
      const command = new PutCommand({
        TableName: TABLE_STAFF,
        Item: staff,
      });

      await ddb.send(command);
      created.push(staff);
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Created ${i + 1}/${count} staff members...`);
      }
    } catch (error) {
      console.error(`❌ Failed to create staff #${i}:`, error.message);
      failed.push({ index: i, error: error.message });
    }
  }

  console.log('\n📊 Population Summary:');
  console.log(`  ✅ Successfully created: ${created.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);
  
  if (created.length > 0) {
    const specialtyCounts = created.reduce((acc, s) => {
      acc[s.specialty] = (acc[s.specialty] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Distribution by Specialty:');
    Object.entries(specialtyCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([specialty, count]) => {
        console.log(`  ${specialty}: ${count}`);
      });

    const statusCounts = created.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Items:');
    failed.forEach(f => console.log(`  Staff #${f.index}: ${f.error}`));
  }

  console.log('\n✨ Population complete!');
  return { created, failed };
}

// Verification function
async function verifyPopulation() {
  console.log('\n🔍 Verifying staff population...');
  
  try {
    const command = new ScanCommand({
      TableName: TABLE_STAFF,
      FilterExpression: 'entity = :entity',
      ExpressionAttributeValues: {
        ':entity': 'Doctor',
      },
    });

    const result = await ddb.send(command);
    const count = result.Items?.length || 0;
    
    console.log(`✅ Total staff in database: ${count}`);
    
    if (result.Items && result.Items.length > 0) {
      const sample = result.Items.slice(0, 3);
      console.log('\n📋 Sample staff members:');
      sample.forEach((s, i) => {
        console.log(`\n  ${i + 1}. ${s.name}`);
        console.log(`     Email: ${s.email}`);
        console.log(`     Specialty: ${s.specialty}`);
        console.log(`     Status: ${s.status}`);
      });
    }
    
    return count;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return 0;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 100;
  
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   SmartBoxing Staff Population Script   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  try {
    const result = await populateStaff(count);
    await verifyPopulation();
    
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

main();
