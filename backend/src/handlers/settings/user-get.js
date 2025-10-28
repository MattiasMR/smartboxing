import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const userSub = claims['sub'];

  if (!userSub) {
    throw { statusCode: 401, message: 'User not authenticated' };
  }

  const result = await doc.send(new GetCommand({
    TableName: process.env.T_USER_SETTINGS,
    Key: { tenantId, userSub }
  }));

  // Si no existe configuración, devolver defaults
  if (!result.Item) {
    return {
      tenantId,
      userSub,
      preferences: {
        theme: 'auto',
        language: 'es',
        notifications: true,
        emailNotifications: true,
      },
    };
  }

  return result.Item;
});
