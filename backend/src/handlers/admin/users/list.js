/**
 * Admin Handlers - User Management
 * List users (filtered by tenant for tenant_admin, all for super_admin)
 */

import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../../lib/http.js';
import { requireTenantAdmin, ROLES } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANT_USERS = process.env.T_TENANT_USERS;

export const main = handler(async (event) => {
  const user = requireTenantAdmin(event);
  
  // Get tenant filter from query params
  const tenantIdParam = event.queryStringParameters?.tenantId;
  
  // Determine which tenant to query
  let targetTenantId;
  if (user.role === ROLES.SUPER_ADMIN) {
    targetTenantId = tenantIdParam || null; // Super admin can filter or see all
  } else {
    targetTenantId = user.tenantId; // Tenant admin sees only their tenant
  }
  
  let users = [];
  
  if (targetTenantId) {
    // Query users from TenantUsers table by tenant
    const result = await doc.send(new QueryCommand({
      TableName: T_TENANT_USERS,
      IndexName: 'ByTenant',
      KeyConditionExpression: 'tenantId = :tenantId',
      ExpressionAttributeValues: {
        ':tenantId': targetTenantId,
      },
    }));
    users = result.Items || [];
  } else {
    // Super admin requesting all users - scan TenantUsers table
    const result = await doc.send(new ScanCommand({
      TableName: T_TENANT_USERS,
    }));
    users = result.Items || [];
  }
  
  // Enrich with Cognito data if needed (email, status)
  // For now, we store email in TenantUsers
  
  return {
    users: users.sort((a, b) => (a.email || '').localeCompare(b.email || '')),
    count: users.length,
    tenantId: targetTenantId,
  };
}, 'listUsers');
