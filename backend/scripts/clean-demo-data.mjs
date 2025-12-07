/**
 * Script to clean demo data with legacy TENANT#demo format
 * This data is not connected to any real tenant and should be removed
 */

import { ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const doc = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

const STAGE = process.env.STAGE || 'dev';
const DEMO_TENANT_ID = 'TENANT#demo';

const tables = [
  `smartboxing-Staff-${STAGE}`,
  `smartboxing-Boxes-${STAGE}`,
  `smartboxing-Appointments-${STAGE}`,
];

async function cleanTable(tableName) {
  console.log(`\n🔍 Scanning ${tableName} for demo data...`);
  
  const result = await doc.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: 'tenantId = :t',
    ExpressionAttributeValues: { ':t': DEMO_TENANT_ID },
    ProjectionExpression: 'tenantId, id',
  }));

  const items = result.Items || [];
  console.log(`   Found ${items.length} items with ${DEMO_TENANT_ID}`);

  if (items.length === 0) {
    return 0;
  }

  let deleted = 0;
  for (const item of items) {
    try {
      await doc.send(new DeleteCommand({
        TableName: tableName,
        Key: { tenantId: item.tenantId, id: item.id },
      }));
      deleted++;
      console.log(`   ✓ Deleted ${item.id}`);
    } catch (e) {
      console.error(`   ✗ Error deleting ${item.id}:`, e.message);
    }
  }

  return deleted;
}

async function main() {
  console.log('🧹 Cleaning demo data from DynamoDB...');
  console.log(`   Stage: ${STAGE}`);
  console.log(`   Demo Tenant ID: ${DEMO_TENANT_ID}`);

  let totalDeleted = 0;

  for (const table of tables) {
    const deleted = await cleanTable(table);
    totalDeleted += deleted;
  }

  console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} demo items.`);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
