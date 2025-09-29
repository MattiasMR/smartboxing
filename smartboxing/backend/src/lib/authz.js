import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { doc } from "./db.js";

const T_ROLES = process.env.T_ROLES;
const T_USERROLES = process.env.T_USERROLES;

export async function userPermissions(tenantId, userId) {
  const userKey = `${tenantId}#${userId}`;
  const ur = await doc.send(new GetCommand({ TableName: T_USERROLES, Key: { userKey }}));
  const roles = ur.Item?.roles ?? [];
  const perms = new Set();
  for (const roleId of roles) {
    const r = await doc.send(new GetCommand({ TableName: T_ROLES, Key: { roleId }}));
    (r.Item?.permissions ?? []).forEach(p => perms.add(p));
  }
  return perms;
}

export function requirePerm(perms, needed) {
  if (!perms.has(needed)) {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }
}
