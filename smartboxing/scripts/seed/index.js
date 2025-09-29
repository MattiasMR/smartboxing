#!/usr/bin/env node
// Carga seeds de permisos/roles/personalización en DynamoDB
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- args: --tenant demo --userSub <cognito-sub> [--region us-east-1]
const args = Object.fromEntries(
  process.argv.slice(2).map(x => {
    const [k,v] = x.split("="); 
    return k.startsWith("--") ? [k.slice(2), v ?? true] : [k, true];
  })
);
const TENANT = args.tenant || "demo";
const USER_SUB = args.userSub; // requerido para asignar roles/settings de usuario
const REGION = args.region || process.env.AWS_REGION || "us-east-1";

if (!USER_SUB) {
  console.error("Falta --userSub=<Cognito user sub>");
  process.exit(1);
}

const T_PERMS     = process.env.T_PERMS;
const T_ROLES     = process.env.T_ROLES;
const T_USERROLES = process.env.T_USERROLES;
const T_CLIENTSET = process.env.T_CLIENTSET;
const T_USERSET   = process.env.T_USERSET;

for (const [envName, val] of Object.entries({T_PERMS,T_ROLES,T_USERROLES,T_CLIENTSET,T_USERSET})) {
  if (!val) { console.error(`Falta env ${envName}`); process.exit(1); }
}

const ddb = new DynamoDBClient({ region: REGION });
const doc = DynamoDBDocumentClient.from(ddb, { marshallOptions: { removeUndefinedValues: true }});

async function put(table, item) {
  await doc.send(new PutCommand({ TableName: table, Item: item }));
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, p), "utf8"));
}

(async () => {
  console.log("Cargando Permissions…");
  for (const perm of loadJson("./permissions.json")) {
    await put(T_PERMS, { perm });
  }

  console.log("Cargando Roles…");
  for (const role of loadJson("./roles.json")) {
    await put(T_ROLES, { roleId: role.roleId, permissions: role.permissions });
  }

  console.log("Cargando ClientSettings…");
  for (const cs of loadJson("./clientsettings.json")) {
    await put(T_CLIENTSET, { tenantId: cs.tenantId, settings: cs.settings });
  }

  console.log("Cargando UserRoles…");
  for (const ur of loadJson("./userroles.template.json")) {
    const userKey = `${(ur.tenantId === "__TENANT__" ? TENANT : ur.tenantId)}#${(ur.userSub === "__USER_SUB__" ? USER_SUB : ur.userSub)}`;
    await put(T_USERROLES, { userKey, roles: ur.roles });
  }

  console.log("Cargando UserSettings…");
  for (const us of loadJson("./usersettings.template.json")) {
    const userKey = `${(us.tenantId === "__TENANT__" ? TENANT : us.tenantId)}#${(us.userSub === "__USER_SUB__" ? USER_SUB : us.userSub)}`;
    await put(T_USERSET, { userKey, settings: us.settings });
  }

  console.log("SEED OK ✅");
})().catch(e => { console.error(e); process.exit(1); });
