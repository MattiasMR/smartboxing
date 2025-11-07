import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const id = event.pathParameters?.id;

  if (!id) {
    const error = new Error('Missing patient ID');
    error.statusCode = 400;
    throw error;
  }

  await doc.send(new DeleteCommand({
    TableName: process.env.T_PATIENTS,
    Key: { tenantId, id },
    ConditionExpression: 'attribute_exists(tenantId) AND attribute_exists(id)',
  }));

  return { deleted: true, id };
});
