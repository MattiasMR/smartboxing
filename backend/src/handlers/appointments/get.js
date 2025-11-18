import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { withLegacyDoctorFields } from './schemas.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const id = decodeURIComponent(event.pathParameters?.id || '');
  
  const { Item } = await doc.send(new GetCommand({
    TableName: process.env.T_APPOINTMENTS,
    Key: { tenantId, id }
  }));
  
  if (!Item) throw new Error('Appointment no encontrado');
  return withLegacyDoctorFields(Item);
});
