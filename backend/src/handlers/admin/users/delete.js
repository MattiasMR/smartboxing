/**
 * Admin Handlers - User Management
 * Delete user (removes from tenant and disables in Cognito)
 */

import { GetCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { handler } from '../../../lib/http.js';
import { requireTenantAdmin, ROLES } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANT_USERS = process.env.T_TENANT_USERS;
const T_TENANTS = process.env.T_TENANTS;
const USER_POOL_ID = process.env.USER_POOL_ID;

const cognito = new CognitoIdentityProviderClient({});

export const main = handler(async (event) => {
  const admin = requireTenantAdmin(event);
  
  const { id } = event.pathParameters || {}; // cognitoSub
  
  if (!id) {
    const error = new Error('User ID is required');
    error.statusCode = 400;
    throw error;
  }
  
  // Get existing user using composite key (cognitoSub + tenantId)
  // Admin can only delete users in their own tenant
  const existing = await doc.send(new GetCommand({
    TableName: T_TENANT_USERS,
    Key: { 
      cognitoSub: id,
      tenantId: admin.tenantId,
    },
  }));
  
  if (!existing.Item) {
    const error = new Error('User not found in this tenant');
    error.statusCode = 404;
    throw error;
  }
  
  const tenantUser = existing.Item;
  
  // Cannot delete yourself
  if (tenantUser.cognitoSub === admin.sub) {
    const error = new Error('Cannot delete your own account');
    error.statusCode = 400;
    throw error;
  }
  
  // Delete from Cognito
  try {
    await cognito.send(new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: tenantUser.email,
    }));
  } catch (e) {
    // If user doesn't exist in Cognito, continue to clean up TenantUsers
    if (e.name !== 'UserNotFoundException') {
      throw e;
    }
  }
  
  // Delete from TenantUsers table using composite key
  await doc.send(new DeleteCommand({
    TableName: T_TENANT_USERS,
    Key: { 
      cognitoSub: id,
      tenantId: admin.tenantId,
    },
  }));
  
  // Decrement tenant user count
  try {
    await doc.send(new UpdateCommand({
      TableName: T_TENANTS,
      Key: { id: tenantUser.tenantId },
      UpdateExpression: 'SET userCount = userCount - :one',
      ConditionExpression: 'userCount > :zero',
      ExpressionAttributeValues: {
        ':one': 1,
        ':zero': 0,
      },
    }));
  } catch (e) {
    // Ignore if count update fails (defensive)
  }
  
  return { 
    message: 'User deleted successfully',
    id,
  };
}, 'deleteUser');
