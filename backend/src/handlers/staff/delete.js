import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const id = decodeURIComponent(event.pathParameters?.id || '');

  await doc.send(new DeleteCommand({
    TableName: process.env.T_STAFF,
    Key: { tenantId, id }
  }));

  return { deleted: true, id };
});
