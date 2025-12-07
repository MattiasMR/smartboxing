import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { PatientUpdate } from './schemas.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const id = event.pathParameters?.id;

  if (!id) {
    const error = new Error('Missing patient ID');
    error.statusCode = 400;
    throw error;
  }

  const body = parseBody(event);
  const updates = PatientUpdate.parse(body.patient);
  
  // Agregar updatedAt automáticamente
  updates.updatedAt = new Date().toISOString();

  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.entries(updates).forEach(([key, value]) => {
    updateExpression.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  });

  await doc.send(new UpdateCommand({
    TableName: process.env.T_PATIENTS,
    Key: { tenantId, id },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: 'attribute_exists(tenantId) AND attribute_exists(id)',
  }));

  return { updated: true, id };
});
