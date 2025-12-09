import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { withLegacyDoctorFields } from './schemas.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const qs = event.queryStringParameters || {};
  
  let command;
  
  // If date range is provided, use GSI ByStartAt
  if (qs.from && qs.to) {
    command = new QueryCommand({
      TableName: process.env.T_APPOINTMENTS,
      IndexName: 'ByStartAt',
      KeyConditionExpression: 'tenantId = :t AND startAt BETWEEN :from AND :to',
      ExpressionAttributeValues: { 
        ':t': tenantId,
        ':from': qs.from,
        ':to': qs.to
      }
    });
  } else {
    // Default: list all (or could limit to recent)
    command = new QueryCommand({
      TableName: process.env.T_APPOINTMENTS,
      KeyConditionExpression: 'tenantId = :t',
      ExpressionAttributeValues: { ':t': tenantId }
    });
  }

  const out = await doc.send(command);
  const items = (out.Items ?? []).map(withLegacyDoctorFields);
  return { items };
});
