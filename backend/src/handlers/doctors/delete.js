import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { doc } from '../../lib/db.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const id = decodeURIComponent(event.pathParameters?.id || '');

  await doc.send(new DeleteCommand({
    TableName: process.env.T_DOCTORS,
    Key: { tenantId, id }
  }));

  return { deleted: true, id };
});
