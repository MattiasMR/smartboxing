/**
 * Admin Handlers - User Management
 * Update user role or status
 */

import { z } from 'zod';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { 
  CognitoIdentityProviderClient, 
  AdminUpdateUserAttributesCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { handler, parseBody } from '../../../lib/http.js';
import { requireTenantAdmin, ROLES } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANT_USERS = process.env.T_TENANT_USERS;
const USER_POOL_ID = process.env.USER_POOL_ID;

const cognito = new CognitoIdentityProviderClient({});

// Validation schema
const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['tenant_admin', 'staff']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

export const main = handler(async (event) => {
  const admin = requireTenantAdmin(event);
  
  const { id } = event.pathParameters || {}; // cognitoSub
  
  if (!id) {
    const error = new Error('User ID is required');
    error.statusCode = 400;
    throw error;
  }

  // Allow Super Admin to specify tenantId via query param if not in context
  let targetTenantId = admin.tenantId;
  if (!targetTenantId && admin.role === ROLES.SUPER_ADMIN) {
    targetTenantId = event.queryStringParameters?.tenantId;
  }

  if (!targetTenantId) {
     const error = new Error('Tenant ID is required');
     error.statusCode = 400;
     throw error;
  }
  
  // Get existing user using composite key (cognitoSub + tenantId)
  // Admin can only update users in their own tenant
  const existing = await doc.send(new GetCommand({
    TableName: T_TENANT_USERS,
    Key: { 
      cognitoSub: id,
      tenantId: targetTenantId,
    },
  }));
  
  if (!existing.Item) {
    const error = new Error('User not found in this tenant');
    error.statusCode = 404;
    throw error;
  }
  
  const tenantUser = existing.Item;
  
  const body = parseBody(event);
  const data = UpdateUserSchema.parse(body);
  
  // Tenant admins cannot promote to tenant_admin
  if (data.role === 'tenant_admin' && admin.role !== ROLES.SUPER_ADMIN) {
    const error = new Error('Only super_admin can assign tenant_admin role');
    error.statusCode = 403;
    throw error;
  }
  
  // Update Cognito attributes if role changed
  // IMPORTANT: Only update Cognito if this is the user's CURRENT active tenant
  // Otherwise we might overwrite their role in another tenant context
  // For now, we assume role in Cognito reflects current tenant context
  if (data.role && data.role !== tenantUser.role) {
    // We use Username=id (sub) because email might not be unique or username
    try {
      await cognito.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: id, // Use SUB as username
        UserAttributes: [
          { Name: 'custom:role', Value: data.role },
        ],
      }));
    } catch (e) {
      console.warn('Could not update Cognito attributes:', e);
      // Continue updating DB even if Cognito fails (e.g. user not found)
    }
  }
  
  // Enable/disable user in Cognito if status changed
  if (data.status) {
    if (data.status === 'disabled') {
      try {
        await cognito.send(new AdminDisableUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: id, // Use SUB
        }));
      } catch (e) { console.warn('Disable failed', e); }
    } else if (data.status === 'active') {
      try {
        await cognito.send(new AdminEnableUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: id, // Use SUB
        }));
      } catch (e) { console.warn('Enable failed', e); }
    }
  }
  
  // Update TenantUsers table
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  
  if (data.name) {
    updateExpression.push('#name = :name');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = data.name;
  }
  
  if (data.role) {
    updateExpression.push('#role = :role');
    expressionAttributeNames['#role'] = 'role';
    expressionAttributeValues[':role'] = data.role;
  }
  
  if (data.status) {
    updateExpression.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = data.status;
  }
  
  updateExpression.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  
  await doc.send(new UpdateCommand({
    TableName: T_TENANT_USERS,
    Key: { 
      cognitoSub: id,
      tenantId: targetTenantId,
    },
    UpdateExpression: 'SET ' + updateExpression.join(', '),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  }));

  return { 
    updated: true, 
    id,
    tenantId: targetTenantId 
  };
});
