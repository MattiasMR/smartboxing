import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const id = event.pathParameters?.id;

  const body = JSON.parse(event.body || '{}');
  const patch = body.patch || {};
  if (!Object.keys(patch).length) throw new Error('No hay cambios');

  const names = {};
  const values = {};
  const sets = [];
  for (const [k, v] of Object.entries(patch)) {
    names[`#${k}`] = k;
    values[`:${k}`] = v;
    sets.push(`#${k} = :${k}`);
  }

  await doc.send(new UpdateCommand({
    TableName: process.env.T_DOCTORS,
    Key: { tenantId, id },
    UpdateExpression: 'SET ' + sets.join(', '),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(tenantId) AND attribute_exists(id)'
  }));

  return { updated: true, id };
});
