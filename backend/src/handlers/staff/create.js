import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { doc } from '../../lib/db.js';
import { StaffInput } from './schemas.js';

export const main = handler(async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const tenantId = claims['custom:tenantId'] ?? 'TENANT#demo';
  const body = parseBody(event);
  const payload = body.staff ?? body.doctor;
  const staff = StaffInput.parse(payload);
  await doc.send(new PutCommand({
    TableName: process.env.T_STAFF,
    Item: { tenantId, ...staff },
    ConditionExpression: 'attribute_not_exists(tenantId) AND attribute_not_exists(id)'
  }));
  return { created: true, id: staff.id };
});
