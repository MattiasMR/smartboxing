/**
 * User Tenancies - List tenants where user is admin
 * Returns all tenants where the current user is tenant_admin
 */

import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../lib/http.js';
import { extractUser } from '../../lib/auth.js';
import { doc } from '../../lib/db.js';

const T_TENANT_USERS = process.env.T_TENANT_USERS;
const T_TENANTS = process.env.T_TENANTS;

export const main = handler(async (event) => {
  const user = extractUser(event);
  
  if (!user) {
    const error = new Error('Must be authenticated');
    error.statusCode = 401;
    throw error;
  }
  
  // Get all tenant memberships for this user
  // Note: TenantUsers table has cognitoSub as primary key
  // We need to scan with filter for all tenants where user is tenant_admin
  
  // First, let's query by user
  const result = await doc.send(new GetCommand({
    TableName: T_TENANT_USERS,
    Key: { cognitoSub: user.sub },
  }));
  
  // The current model stores one tenant per user
  // For multi-tenant admins, we need to query by tenantId index
  // Let's scan for all records where this user is tenant_admin
  
  const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
  
  const memberships = await doc.send(new ScanCommand({
    TableName: T_TENANT_USERS,
    FilterExpression: 'cognitoSub = :userId AND #role = :adminRole',
    ExpressionAttributeNames: { '#role': 'role' },
    ExpressionAttributeValues: {
      ':userId': user.sub,
      ':adminRole': 'tenant_admin',
    },
  }));
  
  // Get full tenant details for each membership
  const tenants = [];
  
  for (const membership of memberships.Items || []) {
    try {
      const tenantResult = await doc.send(new GetCommand({
        TableName: T_TENANTS,
        Key: { id: membership.tenantId },
      }));
      
      if (tenantResult.Item && tenantResult.Item.status === 'active') {
        tenants.push({
          id: tenantResult.Item.id,
          name: tenantResult.Item.name,
          slug: tenantResult.Item.slug,
          logo: tenantResult.Item.settings?.logo || null,
          role: membership.role,
        });
      }
    } catch (e) {
      console.error('Error fetching tenant:', membership.tenantId, e);
    }
  }
  
  return {
    tenants,
    count: tenants.length,
    currentTenantId: user.tenantId,
  };
}, 'listUserTenancies');
