const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_USERROLES = process.env.T_USERROLES;

exports.handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const tenantId = claims["custom:tenantId"] || "demo";
  const perms = await userPermissions(tenantId, claims.sub);
  requirePerm(perms, "users:assignRoles");

  const body = JSON.parse(event.body || "{}");
  if (!body.userSub || !Array.isArray(body.roles)) {
    return { statusCode: 400, body: JSON.stringify({ message: "userSub y roles son requeridos" }) };
  }

  const userKey = `${tenantId}#${body.userSub}`;
  await doc.send(new PutCommand({
    TableName: T_USERROLES,
    Item: { userKey, roles: body.roles }
  }));

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
