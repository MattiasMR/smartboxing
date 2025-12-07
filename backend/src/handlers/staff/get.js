import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const id = event.pathParameters?.id;
  const { Item } = await doc.send(new GetCommand({
    TableName: process.env.T_STAFF,
    Key: { tenantId, id }
  }));
  if (!Item) throw new Error('Staff no encontrado');
  return Item;
});
