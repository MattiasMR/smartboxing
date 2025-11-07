import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const T_BOXES = process.env.T_BOXES;
const T_DOCTORS = process.env.T_DOCTORS;
const T_APPOINTMENTS = process.env.T_APPOINTMENTS;

/**
 * Borra todos los registros de todas las tablas usando BatchWrite
 */
export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  const tenantId = claims?.['custom:tenantId'];

  if (!tenantId) {
    const error = new Error('No tenantId in JWT');
    error.statusCode = 401;
    throw error;
  }

  const results = {
    boxes: { deleted: 0, failed: 0 },
    doctors: { deleted: 0, failed: 0 },
    appointments: { deleted: 0, failed: 0 }
  };

  // Función auxiliar para borrar items en lotes de 25 (límite de BatchWrite)
  const batchDelete = async (tableName, items, keyNames) => {
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }

    let deleted = 0;
    let failed = 0;

    for (const batch of batches) {
      const deleteRequests = batch.map(item => ({
        DeleteRequest: {
          Key: keyNames.reduce((acc, key) => {
            acc[key] = item[key];
            return acc;
          }, {})
        }
      }));

      try {
        await db.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: deleteRequests
          }
        }));
        deleted += batch.length;
      } catch (error) {
        console.error(`Error en batch delete de ${tableName}:`, error);
        failed += batch.length;
      }
    }

    return { deleted, failed };
  };

  try {
    // 1. Borrar Appointments (usando Query - optimizado)
    const appointmentsResponse = await db.send(new QueryCommand({
      TableName: T_APPOINTMENTS,
      KeyConditionExpression: 'tenantId = :tenantId',
      ExpressionAttributeValues: { ':tenantId': tenantId },
      ProjectionExpression: 'tenantId, id'
    }));
    const appointments = appointmentsResponse.Items || [];
    console.log(`Encontrados ${appointments.length} appointments para borrar`);
    
    if (appointments.length > 0) {
      const result = await batchDelete(T_APPOINTMENTS, appointments, ['tenantId', 'id']);
      results.appointments = result;
    }

    // 2. Borrar Doctors (usando Query - optimizado)
    const doctorsResponse = await db.send(new QueryCommand({
      TableName: T_DOCTORS,
      KeyConditionExpression: 'tenantId = :tenantId',
      ExpressionAttributeValues: { ':tenantId': tenantId },
      ProjectionExpression: 'tenantId, id'
    }));
    const doctors = doctorsResponse.Items || [];
    console.log(`Encontrados ${doctors.length} doctores para borrar`);
    
    if (doctors.length > 0) {
      const result = await batchDelete(T_DOCTORS, doctors, ['tenantId', 'id']);
      results.doctors = result;
    }

    // 3. Borrar Boxes (usando Query - optimizado)
    const boxesResponse = await db.send(new QueryCommand({
      TableName: T_BOXES,
      KeyConditionExpression: 'tenantId = :tenantId',
      ExpressionAttributeValues: { ':tenantId': tenantId },
      ProjectionExpression: 'tenantId, id'
    }));
    const boxes = boxesResponse.Items || [];
    console.log(`Encontrados ${boxes.length} boxes para borrar`);
    
    if (boxes.length > 0) {
      const result = await batchDelete(T_BOXES, boxes, ['tenantId', 'id']);
      results.boxes = result;
    }

    console.log('Resultados finales:', results);

    return {
      message: 'Base de datos limpiada exitosamente',
      results,
      totalDeleted: results.boxes.deleted + results.doctors.deleted + results.appointments.deleted
    };

  } catch (error) {
    console.error('Error limpiando BD:', error);
    const err = new Error(error.message || 'Error al limpiar la base de datos');
    err.statusCode = error.statusCode || 500;
    throw err;
  }
});
