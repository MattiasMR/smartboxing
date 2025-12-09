import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { CreateBoxSchema } from './schemas.js';
import { getRequiredTenantId, extractUser } from '../../lib/auth.js';
import { sendNotification } from '../../lib/notifications.js';

export const main = handler(async (event) => {
  const body = parseBody(event);
  const tenantId = getRequiredTenantId(event);
  const user = extractUser(event);
  const userSub = user.sub;

  const parsed = CreateBoxSchema.parse({
    tenantId: tenantId,
    box: body.box
  });

  try {
    await doc.send(new PutCommand({
      TableName: process.env.T_BOXES,
      Item: { tenantId: parsed.tenantId, ...parsed.box },
      ConditionExpression: 'attribute_not_exists(#tenant) AND attribute_not_exists(#id)',
      ExpressionAttributeNames: {
        '#tenant': 'tenantId',
        '#id': 'id'
      }
    }));

    // Send notification
    await sendNotification(
      tenantId, 
      userSub, 
      'Nuevo Box Creado', 
      `Se ha creado el box "${parsed.box.nombre}" (ID: ${parsed.box.id}).`
    );

  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      error.statusCode = 409;
      error.message = 'Ya existe un box con ese ID';
    }
    throw error;
  }

  return { created: true, id: parsed.box.id };
});
