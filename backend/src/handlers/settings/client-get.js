import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';

  const result = await doc.send(new GetCommand({
    TableName: process.env.T_CLIENT_SETTINGS,
    Key: { tenantId }
  }));

  // Si no existe configuración, devolver defaults
  if (!result.Item) {
    return {
      tenantId,
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        darkMode: false,
      },
      texts: {
        appName: 'SmartBoxing',
        welcomeMessage: 'Bienvenido al sistema de gestión',
        tagline: 'Gestiona tus recursos médicos eficientemente',
      },
      branding: {},
    };
  }

  return result.Item;
});
