import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { UpdateClientSettingsSchema } from './schemas.js';
import { getRequiredTenantId } from '../../lib/auth.js';

export const main = handler(async (event) => {
  const tenantId = getRequiredTenantId(event);
  
  const body = parseBody(event);
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
    schedule: { ...(current.Item?.schedule ?? {}), ...(updates.schedule ?? {}) },
    operational: { ...(current.Item?.operational ?? {}), ...(updates.operational ?? {}) },
    branding: { ...(current.Item?.branding ?? {}), ...(updates.branding ?? {}) },
    updatedAt: new Date().toISOString(),
    createdAt: current.Item?.createdAt ?? new Date().toISOString(),
  };

  await doc.send(new PutCommand({
    TableName: process.env.T_CLIENT_SETTINGS,
    Item: merged
  }));

  return { success: true, settings: merged };
});
