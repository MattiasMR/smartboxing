import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { AppointmentInput } from './schemas.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const body = parseBody(event);
  const appt = AppointmentInput.parse(body.appointment);
  // (opcional) aquí podrías validar solapamientos con Query por rango startAt
  await doc.send(new PutCommand({
    TableName: process.env.T_APPOINTMENTS,
    Item: { tenantId, ...appt },
    ConditionExpression: 'attribute_not_exists(tenantId) AND attribute_not_exists(startAt)'
  }));
  return { created: true, id: appt.id };
});
