const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);

// Sample assignments data
const assignments = [
  {
    id: "assign-001",
    boxId: "box-001",
    doctorId: "doc-001",
    start_time: "2025-09-29T08:00:00Z",
    end_time: "2025-09-29T16:00:00Z",
    date: "2025-09-29",
    specialtyId: "spec-001",
    status: "SCHEDULED",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "assign-002",
    boxId: "box-002",
    doctorId: "doc-002",
    start_time: "2025-09-29T09:00:00Z",
    end_time: "2025-09-29T17:00:00Z",
    date: "2025-09-29",
    specialtyId: "spec-002",
    status: "SCHEDULED",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "assign-003",
    boxId: "box-001",
    doctorId: "doc-004", // Dr. Ana Martínez que creamos antes
    start_time: "2025-09-30T08:00:00Z",
    end_time: "2025-09-30T12:00:00Z",
    date: "2025-09-30",
    specialtyId: "spec-001",
    status: "SCHEDULED",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  }
];

async function seedAssignments() {
  console.log('🌱 Seeding box assignments data...');
  
  for (const assignment of assignments) {
    try {
      await doc.send(new PutCommand({
        TableName: 'smartboxing-node-BoxAssignments-dev',
        Item: assignment
      }));
      console.log(`✅ Added assignment: ${assignment.id} (${assignment.doctorId} -> ${assignment.boxId})`);
    } catch (error) {
      console.error(`❌ Error adding assignment ${assignment.id}:`, error.message);
    }
  }

  console.log('\n🎉 Box assignments seeding completed!');
}

seedAssignments().catch(console.error);