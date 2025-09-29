const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);

// Sample vacation data
const vacations = [
  {
    id: "vac-001",
    doctorId: "doc-003", // Dr. Carlos López que ya está ON_VACATION
    start_date: "2025-09-25",
    end_date: "2025-10-05",
    reason: "Vacaciones anuales",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  },
  {
    id: "vac-002",
    doctorId: "doc-001", // Dr. Juan Pérez
    start_date: "2025-10-15",
    end_date: "2025-10-22",
    reason: "Descanso médico",
    status: "SCHEDULED",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenantId: "demo"
  }
];

async function seedVacations() {
  console.log('🌱 Seeding vacation data...');
  
  for (const vacation of vacations) {
    try {
      await doc.send(new PutCommand({
        TableName: 'smartboxing-node-Vacations-dev',
        Item: vacation
      }));
      console.log(`✅ Added vacation: ${vacation.id} (${vacation.doctorId})`);
    } catch (error) {
      console.error(`❌ Error adding vacation ${vacation.id}:`, error.message);
    }
  }

  console.log('\n🎉 Vacation data seeding completed!');
}

seedVacations().catch(console.error);