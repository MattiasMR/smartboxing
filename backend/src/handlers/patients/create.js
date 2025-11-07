import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { PatientInput } from './schemas.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const body = parseBody(event);
  const patient = PatientInput.parse(body.patient);

  await doc.send(new PutCommand({
    TableName: process.env.T_PATIENTS,
    Item: { tenantId, ...patient },
    ConditionExpression: 'attribute_not_exists(tenantId) AND attribute_not_exists(id)'
  }));

  return { created: true, id: patient.id };
});
