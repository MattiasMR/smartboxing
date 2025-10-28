import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const id = event.pathParameters?.id;
  const { Item } = await doc.send(new GetCommand({
    TableName: process.env.T_DOCTORS,
    Key: { tenantId, id }
  }));
  if (!Item) throw new Error('Doctor no encontrado');
  return Item;
});
