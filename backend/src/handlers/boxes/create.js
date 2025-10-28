import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { CreateBoxSchema } from './schemas.js';

export const main = handler(async (event) => {
  const body = JSON.parse(event.body || '{}');
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const fallbackTenant = claims['custom:tenantId'] ?? 'TENANT#demo';

  const parsed = CreateBoxSchema.parse({
    tenantId: body.tenantId ?? fallbackTenant,
    box: body.box
  });

  await doc.send(new PutCommand({
    TableName: process.env.T_BOXES,
    Item: { tenantId: parsed.tenantId, ...parsed.box },
    ConditionExpression: 'attribute_not_exists(tenantId) AND attribute_not_exists(id)'
  }));

  return { created: true, id: parsed.box.id };
});
