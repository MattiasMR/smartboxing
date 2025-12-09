import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { StaffInput } from './schemas.js';
import { getRequiredTenantId, extractUser } from '../../lib/auth.js';
import { sendNotification } from '../../lib/notifications.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const user = extractUser(event);
  const userSub = user.sub;
  const body = parseBody(event);
  const payload = body.staff ?? body.doctor;
  const staff = StaffInput.parse(payload);
  await doc.send(new PutCommand({
    TableName: process.env.T_STAFF,
    Item: { tenantId, ...staff },
    ConditionExpression: 'attribute_not_exists(tenantId) AND attribute_not_exists(id)'
  }));

  // Send notification
  await sendNotification(
    tenantId, 
    userSub, 
    'Nuevo Staff Creado', 
    `Se ha creado el miembro del staff "${staff.nombre}" (ID: ${staff.id}).`
  );

  return { created: true, id: staff.id };
});
