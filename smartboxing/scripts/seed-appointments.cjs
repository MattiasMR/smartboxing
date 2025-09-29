const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);

// Sample appointments data - based on existing assignments
const appointments = [
  // Appointments for assign-001 (Dr. Juan Pérez, box-001, 08:00-16:00, 2025-09-29)
  {
    id: "appt-001",
    assignmentId: "assign-001",
    boxId: "box-001",
    doctorId: "doc-001",
    specialtyId: "spec-001",
    date: "2025-09-29",
    start_time: "2025-09-29T08:00:00Z",
    end_time: "2025-09-29T08:30:00Z",
    patient_name: "María López García",
    patient_phone: "+34600123456",
    patient_email: "maria.lopez@email.com",
    reason: "Consulta de rutina",
    status: "SCHEDULED",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "appt-002", 
    assignmentId: "assign-001",
    boxId: "box-001",
    doctorId: "doc-001",
    specialtyId: "spec-001",
    date: "2025-09-29",
    start_time: "2025-09-29T08:30:00Z",
    end_time: "2025-09-29T09:00:00Z",
    patient_name: "Carlos Martínez Ruiz",
    patient_phone: "+34600123457",
    patient_email: "carlos.martinez@email.com",
    reason: "Seguimiento tratamiento",
    status: "SCHEDULED",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "appt-003",
    assignmentId: "assign-001",
    boxId: "box-001", 
    doctorId: "doc-001",
    specialtyId: "spec-001",
    date: "2025-09-29",
    start_time: "2025-09-29T10:00:00Z",
    end_time: "2025-09-29T10:30:00Z",
    patient_name: "Ana Fernández Torres",
    patient_phone: "+34600123458",
    patient_email: null,
    reason: "Primera consulta",
    status: "SCHEDULED",
    notes: "Paciente nuevo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },

  // Appointments for assign-002 (Dra. María González, box-002, 09:00-17:00, 2025-09-29)
  {
    id: "appt-004",
    assignmentId: "assign-002",
    boxId: "box-002",
    doctorId: "doc-002",
    specialtyId: "spec-002",
    date: "2025-09-29",
    start_time: "2025-09-29T09:00:00Z",
    end_time: "2025-09-29T09:30:00Z",
    patient_name: "Pedro García Jiménez",
    patient_phone: "+34600123459",
    patient_email: "pedro.garcia@email.com",
    reason: "Revisión cardiológica",
    status: "SCHEDULED",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "appt-005",
    assignmentId: "assign-002",
    boxId: "box-002",
    doctorId: "doc-002", 
    specialtyId: "spec-002",
    date: "2025-09-29",
    start_time: "2025-09-29T10:30:00Z",
    end_time: "2025-09-29T11:00:00Z",
    patient_name: "Lucía Rodríguez Sanz",
    patient_phone: "+34600123460",
    patient_email: "lucia.rodriguez@email.com",
    reason: "Electrocardiograma",
    status: "SCHEDULED",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },

  // Appointments for assign-003 (Dr. Ana Martínez, box-001, 08:00-12:00, 2025-09-30)
  {
    id: "appt-006",
    assignmentId: "assign-003",
    boxId: "box-001",
    doctorId: "doc-004",
    specialtyId: "spec-001", 
    date: "2025-09-30",
    start_time: "2025-09-30T08:00:00Z",
    end_time: "2025-09-30T08:30:00Z",
    patient_name: "Miguel Sánchez Vega",
    patient_phone: "+34600123461",
    patient_email: "miguel.sanchez@email.com",
    reason: "Consulta general",
    status: "SCHEDULED",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "appt-007",
    assignmentId: "assign-003",
    boxId: "box-001",
    doctorId: "doc-004",
    specialtyId: "spec-001",
    date: "2025-09-30", 
    start_time: "2025-09-30T09:00:00Z",
    end_time: "2025-09-30T09:30:00Z",
    patient_name: "Isabel Moreno Castro",
    patient_phone: "+34600123462",
    patient_email: null,
    reason: "Vacunación",
    status: "SCHEDULED", 
    notes: "Traer cartilla de vacunación",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  }
];

async function seedAppointments() {
  console.log('🌱 Seeding appointments data...');
  
  for (const appointment of appointments) {
    try {
      await doc.send(new PutCommand({
        TableName: 'smartboxing-node-Appointments-dev',
        Item: appointment
      }));
      console.log(`✅ Added appointment: ${appointment.id} (${appointment.patient_name} - ${appointment.start_time})`);
    } catch (error) {
      console.error(`❌ Error adding appointment ${appointment.id}:`, error.message);
    }
  }

  console.log('\n🎉 Appointments seeding completed!');
}

seedAppointments().catch(console.error);