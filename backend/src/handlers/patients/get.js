import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const id = event.pathParameters?.id;

  if (!id) {
    const error = new Error('Missing patient ID');
    error.statusCode = 400;
    throw error;
  }

  const out = await doc.send(new GetCommand({
    TableName: process.env.T_PATIENTS,
    Key: { tenantId, id }
  }));

  if (!out.Item) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  return out.Item;
});
