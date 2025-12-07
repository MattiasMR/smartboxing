import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { withLegacyDoctorFields } from './schemas.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const qs = event.queryStringParameters || {};
  // básico: lista todo por tenant; luego puedes filtrar por rango startAt BETWEEN ...
  const out = await doc.send(new QueryCommand({
    TableName: process.env.T_APPOINTMENTS,
    KeyConditionExpression: 'tenantId = :t',
    ExpressionAttributeValues: { ':t': tenantId }
  }));
  const items = (out.Items ?? []).map(withLegacyDoctorFields);
  return { items };
});
