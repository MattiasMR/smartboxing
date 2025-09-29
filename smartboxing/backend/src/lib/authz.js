const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb, { marshallOptions: { removeUndefinedValues: true } });

const T_ROLES = process.env.T_ROLES;
const T_USERROLES = process.env.T_USERROLES;

async function userPermissions(tenantId, userSub) {
  const userKey = `${tenantId}#${userSub}`;
  const ur = await doc.send(new GetCommand({ TableName: T_USERROLES, Key: { userKey }}));
  const roles = ur.Item?.roles || [];
  const perms = new Set();
  for (const roleId of roles) {
    const r = await doc.send(new GetCommand({ TableName: T_ROLES, Key: { roleId }}));
    (r.Item?.permissions || []).forEach(p => perms.add(p));
  }
  return perms;
}

function requirePerm(perms, needed) {
  if (!perms.has(needed)) {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }
}

module.exports = { userPermissions, requirePerm };
