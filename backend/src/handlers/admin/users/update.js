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
  
  // Get existing user
  const existing = await doc.send(new GetCommand({
    TableName: T_TENANT_USERS,
    Key: { cognitoSub: id },
  }));
  
  if (!existing.Item) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  const tenantUser = existing.Item;
  
  // Check access: tenant admin can only update users in their tenant
  if (admin.role !== ROLES.SUPER_ADMIN && admin.tenantId !== tenantUser.tenantId) {
    const error = new Error('Forbidden: Cannot update users from another tenant');
    error.statusCode = 403;
    throw error;
  }
  
  const body = parseBody(event);
  const data = UpdateUserSchema.parse(body);
  
  // Tenant admins cannot promote to tenant_admin
  if (data.role === 'tenant_admin' && admin.role !== ROLES.SUPER_ADMIN) {
    const error = new Error('Only super_admin can assign tenant_admin role');
    error.statusCode = 403;
    throw error;
  }
  
  // Update Cognito attributes if role changed
  if (data.role && data.role !== tenantUser.role) {
    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: tenantUser.email,
      UserAttributes: [
        { Name: 'custom:role', Value: data.role },
      ],
    }));
  }
  
  // Enable/disable user in Cognito if status changed
  if (data.status) {
    if (data.status === 'disabled') {
      await cognito.send(new AdminDisableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: tenantUser.email,
      }));
    } else if (data.status === 'active') {
      await cognito.send(new AdminEnableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: tenantUser.email,
      }));
    }
  }
  
  // Update TenantUsers table
  const updateParts = [];
  const expressionValues = {};
  const expressionNames = {};
  
  if (data.name) {
    updateParts.push('#name = :name');
    expressionNames['#name'] = 'name';
    expressionValues[':name'] = data.name;
  }
  
  if (data.role) {
    updateParts.push('#role = :role');
    expressionNames['#role'] = 'role';
    expressionValues[':role'] = data.role;
  }
  
  if (data.status) {
    updateParts.push('#status = :status');
    expressionNames['#status'] = 'status';
    expressionValues[':status'] = data.status;
  }
  
  updateParts.push('#updatedAt = :updatedAt');
  expressionNames['#updatedAt'] = 'updatedAt';
  expressionValues[':updatedAt'] = new Date().toISOString();
  
  const result = await doc.send(new UpdateCommand({
    TableName: T_TENANT_USERS,
    Key: { cognitoSub: id },
    UpdateExpression: `SET ${updateParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
    ReturnValues: 'ALL_NEW',
  }));
  
  return result.Attributes;
}, 'updateUser');
