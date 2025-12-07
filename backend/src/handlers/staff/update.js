import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const id = event.pathParameters?.id;

  const body = parseBody(event);
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
    TableName: process.env.T_STAFF,
    Key: { tenantId, id },
    UpdateExpression: 'SET ' + sets.join(', '),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(tenantId) AND attribute_exists(id)'
  }));

  return { updated: true, id };
});
