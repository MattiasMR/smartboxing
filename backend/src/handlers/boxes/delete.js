import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { getRequiredTenantId, extractUser } from '../../lib/auth.js';
import { sendNotification } from '../../lib/notifications.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const user = extractUser(event);
  const userSub = user.sub;
  const id = decodeURIComponent(event.pathParameters?.id || '');

  await doc.send(new DeleteCommand({
    TableName: process.env.T_BOXES,
    Key: { tenantId, id }
  }));

  // Send notification
  await sendNotification(
    tenantId, 
    userSub, 
    'Box Eliminado', 
    `Se ha eliminado el box con ID: ${id}.`
  );

  return { deleted: true, id };
});
