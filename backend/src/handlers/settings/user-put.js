import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { UpdateUserSettingsSchema } from './schemas.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const userSub = claims['sub'];

  if (!userSub) {
    throw { statusCode: 401, message: 'User not authenticated' };
  }

  const body = parseBody(event);
  const updates = UpdateUserSettingsSchema.parse(body);

  // Obtener configuración actual
  const current = await doc.send(new GetCommand({
    TableName: process.env.T_USER_SETTINGS,
    Key: { tenantId, userSub }
  }));

  // Merge de preferencias
  const merged = {
    tenantId,
    userSub,
    preferences: { ...(current.Item?.preferences ?? {}), ...(updates.preferences ?? {}) },
    updatedAt: new Date().toISOString(),
  };

  await doc.send(new PutCommand({
    TableName: process.env.T_USER_SETTINGS,
    Item: merged
  }));

  return { success: true, settings: merged };
});
