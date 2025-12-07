import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { PatientInput } from './schemas.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const body = parseBody(event);
  const patient = PatientInput.parse(body.patient);

  await doc.send(new PutCommand({
    TableName: process.env.T_PATIENTS,
    Item: { tenantId, ...patient },
    ConditionExpression: 'attribute_not_exists(tenantId) AND attribute_not_exists(id)'
  }));

  return { created: true, id: patient.id };
});
