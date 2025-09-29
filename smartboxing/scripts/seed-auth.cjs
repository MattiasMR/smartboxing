const fs = require("fs");
const path = require("path");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_REGION || "us-east-1";
const TENANT = process.env.TENANT || "demo";
const USER_SUB = process.env.USER_SUB;

if (!USER_SUB) { console.error("Falta USER_SUB"); process.exit(1); }

const T_PERMS = process.env.T_PERMS || "smartboxing-node-Permissions-dev";
const T_ROLES = process.env.T_ROLES || "smartboxing-node-Roles-dev";
const T_USERROLES = process.env.T_USERROLES || "smartboxing-node-UserRoles-dev";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const perms = JSON.parse(fs.readFileSync(path.join(__dirname, "seed/permissions.json"), "utf8"));
const roles = JSON.parse(fs.readFileSync(path.join(__dirname, "seed/roles.json"), "utf8"));

(async () => {
  for (const p of perms) await doc.send(new PutCommand({ TableName: T_PERMS, Item: { perm: p }}));
  for (const r of roles) await doc.send(new PutCommand({ TableName: T_ROLES, Item: { roleId: r.roleId, permissions: r.permissions }}));
  await doc.send(new PutCommand({
    TableName: T_USERROLES,
    Item: { userKey: `${TENANT}#${USER_SUB}`, roles: ["admin"] }
  }));
  console.log("Auth seed OK ✅");
})().catch(e => { console.error(e); process.exit(1); });
