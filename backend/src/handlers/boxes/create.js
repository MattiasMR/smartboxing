import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { CreateBoxSchema } from './schemas.js';

export const main = handler(async (event) => {
  const body = parseBody(event);
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const fallbackTenant = claims['custom:tenantId'] ?? 'TENANT#demo';

  const parsed = CreateBoxSchema.parse({
    tenantId: fallbackTenant,
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
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      error.statusCode = 409;
      error.message = 'Ya existe un box con ese ID';
    }
    throw error;
  }

  return { created: true, id: parsed.box.id };
});
