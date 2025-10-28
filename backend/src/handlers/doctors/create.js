import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { DoctorInput } from './schemas.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const body = JSON.parse(event.body || '{}');
  const doctor = DoctorInput.parse(body.doctor);
  await doc.send(new PutCommand({
    TableName: process.env.T_DOCTORS,
    Item: { tenantId, ...doctor },
    ConditionExpression: 'attribute_not_exists(tenantId) AND attribute_not_exists(id)'
  }));
  return { created: true, id: doctor.id };
});
