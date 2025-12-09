import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { AppointmentInput } from './schemas.js';
import { getRequiredTenantId, extractUser } from '../../lib/auth.js';
import { sendNotification } from '../../lib/notifications.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  const user = extractUser(event);
  const userSub = user.sub;
  const body = parseBody(event);
  const appt = AppointmentInput.parse(body.appointment);

  await Promise.all([
    ensureExists(process.env.T_BOXES, tenantId, appt.idBox, 'Box'),
    ensureExists(process.env.T_STAFF, tenantId, appt.idStaff, 'Staff')
  ]);
  // (opcional) aquí podrías validar solapamientos con Query por rango startAt
  await doc.send(new PutCommand({
    TableName: process.env.T_APPOINTMENTS,
    Item: { tenantId, ...appt },
    ConditionExpression: 'attribute_not_exists(tenantId) AND attribute_not_exists(startAt)'
  }));

  // Send notification
  await sendNotification(
    tenantId, 
    userSub, 
    'Nueva Cita Creada', 
    `Se ha creado una nueva cita para el paciente ${appt.patientName} el ${new Date(appt.startAt).toLocaleString()}.`
  );

  return { created: true, id: appt.id };
});

async function ensureExists(tableName, tenantId, id, entityLabel) {
  if (!tableName) throw new Error(`Falta variable de entorno para ${entityLabel}`);
  const { Item } = await doc.send(new GetCommand({
    TableName: tableName,
    Key: { tenantId, id }
  }));
  if (!Item) {
    const err = new Error(`${entityLabel} no encontrado`);
    err.statusCode = 400;
    throw err;
  }
}
