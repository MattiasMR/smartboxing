const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);

// Sample data
const boxes = [
  {
    id: "box-001",
    name: "Consulta General 1",
    number: 101,
    operational_status: "ACTIVE",
    description: "Sala de consulta general con equipamiento básico",
    hallway: "A",
    equipment_list: ["monitor", "otoscopio", "tensiómetro"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "box-002",
    name: "Especialidades 1",
    number: 102,
    operational_status: "ACTIVE",
    description: "Sala para consultas especializadas",
    hallway: "A",
    equipment_list: ["ecógrafo", "monitor", "camilla especializada"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "box-003",
    name: "Urgencias 1",
    number: 201,
    operational_status: "MAINTENANCE",
    description: "Sala de urgencias con equipamiento avanzado",
    hallway: "B",
    equipment_list: ["desfibrilador", "monitor multiparámetro", "ventilador"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  }
];

const specialties = [
  {
    id: "spec-001",
    name: "Medicina General",
    description: "Atención médica general y preventiva",
    created_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "spec-002", 
    name: "Cardiología",
    description: "Especialidad en enfermedades del corazón",
    created_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "spec-003",
    name: "Pediatría", 
    description: "Atención médica para niños",
    created_at: new Date().toISOString(),
    tenantId: "demo"
  }
];

const equipment = [
  { name: "monitor", description: "Monitor de signos vitales" },
  { name: "otoscopio", description: "Instrumento para examinar oídos" },
  { name: "tensiómetro", description: "Medidor de presión arterial" },
  { name: "ecógrafo", description: "Equipo de ultrasonido" },
  { name: "camilla especializada", description: "Camilla ajustable para procedimientos" },
  { name: "desfibrilador", description: "Equipo de reanimación cardíaca" },
  { name: "monitor multiparámetro", description: "Monitor avanzado de múltiples signos vitales" },
  { name: "ventilador", description: "Equipo de ventilación mecánica" }
];

const doctors = [
  {
    id: "doc-001",
    name: "Dr. Juan Pérez",
    email: "juan.perez@hospital.com",
    phone: "+1234567890",
    specialty_id: "spec-001",
    status: "ON_DUTY",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "doc-002",
    name: "Dra. María González",
    email: "maria.gonzalez@hospital.com", 
    phone: "+1234567891",
    specialty_id: "spec-002",
    status: "ON_DUTY",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "doc-003",
    name: "Dr. Carlos López",
    email: "carlos.lopez@hospital.com",
    phone: "+1234567892", 
    specialty_id: "spec-003",
    status: "ON_VACATION",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  }
];

async function seedBusinessData() {
  const tableMappings = {
    'smartboxing-node-Boxes-dev': boxes,
    'smartboxing-node-Specialties-dev': specialties,
    'smartboxing-node-Equipment-dev': equipment,
    'smartboxing-node-Doctors-dev': doctors
  };

  console.log('🌱 Seeding business data...');

  for (const [tableName, data] of Object.entries(tableMappings)) {
    console.log(`\n📊 Seeding ${tableName}...`);
    
    for (const item of data) {
      try {
        await doc.send(new PutCommand({
          TableName: tableName,
          Item: item
        }));
        console.log(`✅ Added: ${item.name || item.id}`);
      } catch (error) {
        console.error(`❌ Error adding ${item.name || item.id}:`, error.message);
      }
    }
  }

  console.log('\n🎉 Business data seeding completed!');
}

seedBusinessData().catch(console.error);