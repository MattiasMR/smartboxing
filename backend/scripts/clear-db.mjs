import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(client);

async function clearTable(tableName) {
  console.log(`🗑️  Limpiando tabla: ${tableName}...`);
  
  let count = 0;
  let lastKey = null;
  
  do {
    const scanParams = {
      TableName: tableName,
    };
    
    if (lastKey) {
      scanParams.ExclusiveStartKey = lastKey;
    }
    
    const { Items = [], LastEvaluatedKey } = await doc.send(new ScanCommand(scanParams));
    lastKey = LastEvaluatedKey;
    
    if (Items.length > 0) {
      for (const item of Items) {
        // Detectar las claves según la tabla
        const key = {};
        if (item.tenantId) key.tenantId = item.tenantId;
        if (item.id) key.id = item.id;
        if (item.startAt) key.startAt = item.startAt;
        if (item.userId) key.userId = item.userId;
        if (item.clientId) key.clientId = item.clientId;
        
        if (Object.keys(key).length > 0) {
          await doc.send(new DeleteCommand({
            TableName: tableName,
            Key: key,
          }));
          count++;
        }
      }
    }
  } while (lastKey);
  
  console.log(`   ✅ ${count} registros eliminados de ${tableName}`);
}

async function main() {
  const tables = [
    process.env.T_BOXES,
    process.env.T_STAFF,
    process.env.T_APPOINTMENTS,
  ].filter(Boolean);
  
  if (tables.length === 0) {
    console.error('❌ No se encontraron tablas en las variables de entorno');
    console.error('   Asegúrate de tener T_BOXES, T_STAFF y T_APPOINTMENTS definidas');
    process.exit(1);
  }
  
  console.log('🧹 Iniciando limpieza de base de datos...\n');
  
  for (const table of tables) {
    await clearTable(table);
  }
  
  console.log('\n✨ Limpieza completada exitosamente!');
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
