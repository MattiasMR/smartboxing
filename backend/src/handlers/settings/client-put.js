import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { UpdateClientSettingsSchema } from './schemas.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  
  const body = JSON.parse(event.body || '{}');
  const updates = UpdateClientSettingsSchema.parse(body);

  // Obtener configuración actual
  const current = await doc.send(new GetCommand({
    TableName: process.env.T_CLIENT_SETTINGS,
    Key: { tenantId }
  }));

  // Merge de configuraciones (deep merge simple)
  const merged = {
    tenantId,
    theme: { ...(current.Item?.theme ?? {}), ...(updates.theme ?? {}) },
    texts: { ...(current.Item?.texts ?? {}), ...(updates.texts ?? {}) },
    branding: { ...(current.Item?.branding ?? {}), ...(updates.branding ?? {}) },
    updatedAt: new Date().toISOString(),
  };

  await doc.send(new PutCommand({
    TableName: process.env.T_CLIENT_SETTINGS,
    Item: merged
  }));

  return { success: true, settings: merged };
});
