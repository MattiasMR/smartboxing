import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { withLegacyDoctorFields } from './schemas.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const id = decodeURIComponent(event.pathParameters?.id || '');
  
  const { Item } = await doc.send(new GetCommand({
    TableName: process.env.T_APPOINTMENTS,
    Key: { tenantId, id }
  }));
  
  if (!Item) throw new Error('Appointment no encontrado');
  return withLegacyDoctorFields(Item);
});
