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
        logoUrl: '',
        selectedThemeId: 'corporate',
      },
      texts: {
        appName: 'SmartBoxing',
        institutionName: 'Mi Institución de Salud',
        welcomeMessage: 'Bienvenido al sistema de gestión de boxes y staff',
        tagline: 'Gestiona tus recursos médicos eficientemente',
      },
      schedule: {
        startTime: '08:00',
        endTime: '20:00',
        slotDuration: 30,
        workDays: [1, 2, 3, 4, 5], // Lunes a Viernes
      },
      operational: {
        allowOverlapping: false,
        requirePatientConfirmation: true,
        sendReminders: true,
        reminderHoursBefore: 24,
        maxAppointmentsPerDay: 50,
        enableWaitingList: false,
      },
      branding: {
        companyName: '',
        contactEmail: '',
        contactPhone: '',
      },
      createdAt: new Date().toISOString(),
    };
  }

  return result.Item;
});
