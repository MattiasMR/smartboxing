/**
 * Admin Handlers - User Management
 * Get single user details
 */

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { handler } from '../../../lib/http.js';
import { requireTenantAdmin, ROLES } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANT_USERS = process.env.T_TENANT_USERS;
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
  
  // Get user from TenantUsers using composite key (cognitoSub + tenantId)
  // Admin can only see users in their own tenant
  const result = await doc.send(new GetCommand({
    TableName: T_TENANT_USERS,
    Key: { 
      cognitoSub: id,
      tenantId: admin.tenantId,
    },
  }));
  
  if (!result.Item) {
    const error = new Error('User not found in this tenant');
    error.statusCode = 404;
    throw error;
  }
  
  const tenantUser = result.Item;
  
  // Optionally enrich with Cognito info
  try {
    const cognitoUser = await cognito.send(new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: tenantUser.email,
    }));
    
    return {
      ...tenantUser,
      cognitoStatus: cognitoUser.UserStatus,
      cognitoEnabled: cognitoUser.Enabled,
      cognitoCreated: cognitoUser.UserCreateDate,
      cognitoModified: cognitoUser.UserLastModifiedDate,
    };
  } catch (e) {
    // If Cognito lookup fails, return just TenantUsers data
    return tenantUser;
  }
}, 'getUser');
