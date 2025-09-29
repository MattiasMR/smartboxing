const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { userPermissions, requirePerm } = require("../../lib/authz.js");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb);
const T_ROLES = process.env.T_ROLES;

exports.handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const tenantId = claims["custom:tenantId"] || "demo";
  const perms = await userPermissions(tenantId, claims.sub);
  requirePerm(perms, "settings:write");

  const body = JSON.parse(event.body || "{}");
  if (!body.roleId || !Array.isArray(body.permissions)) {
    return { statusCode: 400, body: JSON.stringify({ message: "roleId y permissions son requeridos" }) };
  }

  await doc.send(new PutCommand({
    TableName: T_ROLES,
    Item: { roleId: body.roleId, permissions: body.permissions }
  }));
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
