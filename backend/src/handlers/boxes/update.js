import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { UpdateBoxSchema } from './schemas.js';

export const main = handler(async (event) => {
  const body = JSON.parse(event.body || '{}');
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const fallbackTenant = claims['custom:tenantId'] ?? 'TENANT#demo';

  const parsed = UpdateBoxSchema.parse({
    tenantId: body.tenantId ?? fallbackTenant,
    id: event.pathParameters?.id,
    patch: body.patch
  });

  const names = [];
  const values = [];
  for (const [k, v] of Object.entries(parsed.patch)) {
    names.push(`#${k}`);
    values.push(`:${k}`);
  }
  const UpdateExpression = 'SET ' + names.map((n, i) => `${n} = ${values[i]}`).join(', ');
  const ExpressionAttributeNames = Object.fromEntries(Object.keys(parsed.patch).map(k => [`#${k}`, k]));
  const ExpressionAttributeValues = Object.fromEntries(Object.entries(parsed.patch).map(([k, v]) => [`:${k}`, v]));

  await doc.send(new UpdateCommand({
    TableName: process.env.T_BOXES,
    Key: { tenantId: parsed.tenantId, id: parsed.id },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ConditionExpression: 'attribute_exists(tenantId) AND attribute_exists(id)'
  }));

  return { updated: true, id: parsed.id };
});
