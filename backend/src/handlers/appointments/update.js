import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { normalizeStaffFields, AppointmentStatus } from './schemas.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const id = decodeURIComponent(event.pathParameters?.id || '');

  const body = parseBody(event);
  const patch = normalizeStaffFields(body.patch || {});
  if (!Object.keys(patch).length) throw new Error('No hay cambios');

  if (patch.status && !AppointmentStatus.options.includes(patch.status)) {
    const err = new Error('Estado de cita inválido');
    err.statusCode = 400;
    throw err;
  }

  if (patch.idStaff) {
    await ensureStaffExists(tenantId, patch.idStaff);
  }

  const names = {};
  const values = {};
  const sets = [];
  
  for (const [k, v] of Object.entries(patch)) {
    names[`#${k}`] = k;
    values[`:${k}`] = v;
    sets.push(`#${k} = :${k}`);
  }

  await doc.send(new UpdateCommand({
    TableName: process.env.T_APPOINTMENTS,
    Key: { tenantId, id },
    UpdateExpression: 'SET ' + sets.join(', '),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values
  }));

  return { updated: true, id };
});

async function ensureStaffExists(tenantId, idStaff) {
  const table = process.env.T_STAFF;
  if (!table) throw new Error('Falta T_STAFF');
  const { Item } = await doc.send(new GetCommand({
    TableName: table,
    Key: { tenantId, id: idStaff }
  }));
  if (!Item) {
    const err = new Error('Staff no encontrado');
    err.statusCode = 400;
    throw err;
  }
}
