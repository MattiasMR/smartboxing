/**
 * Switch Tenant - Change current user's active tenant
 * Allows tenant_admin to switch between tenants they manage
 */

import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { 
  CognitoIdentityProviderClient, 
  AdminUpdateUserAttributesCommand 
} from '@aws-sdk/client-cognito-identity-provider';
import { handler, parseBody } from '../../lib/http.js';
import { extractUser } from '../../lib/auth.js';
import { doc } from '../../lib/db.js';

const T_TENANT_USERS = process.env.T_TENANT_USERS;
const T_TENANTS = process.env.T_TENANTS;
const USER_POOL_ID = process.env.USER_POOL_ID;

const cognito = new CognitoIdentityProviderClient({});

export const main = handler(async (event) => {
  const user = extractUser(event);
  
  if (!user) {
    const error = new Error('Must be authenticated');
    error.statusCode = 401;
    throw error;
  }
  
  const body = parseBody(event);
  const { tenantId } = body;
  
  if (!tenantId) {
    const error = new Error('tenantId is required');
    error.statusCode = 400;
    throw error;
  }
  
  // Query all memberships for this user, then filter for the requested tenant
  // TenantUsers table has cognitoSub as PK only (no sort key)
  const membershipsResult = await doc.send(new QueryCommand({
    TableName: T_TENANT_USERS,
    KeyConditionExpression: 'cognitoSub = :userId',
    ExpressionAttributeValues: {
      ':userId': user.sub,
    },
  }));
  
  // Find the membership for the requested tenant
  const membership = (membershipsResult.Items || []).find(
    item => item.tenantId === tenantId
  );
  
  if (!membership) {
    const error = new Error('No tienes acceso a esta tenencia');
    error.statusCode = 403;
    throw error;
  }
  
  // Get tenant details
  const tenantResult = await doc.send(new GetCommand({
    TableName: T_TENANTS,
    Key: { id: tenantId },
  }));
  
  if (!tenantResult.Item || tenantResult.Item.status !== 'active') {
    const error = new Error('Tenant not found or inactive');
    error.statusCode = 404;
    throw error;
  }
  
  const tenant = tenantResult.Item;
  
  // Update Cognito user attributes
  // Use user.sub as Username since that's how Cognito identifies users
  // (email might not always be the username in all Cognito configurations)
  await cognito.send(new AdminUpdateUserAttributesCommand({
    UserPoolId: USER_POOL_ID,
    Username: user.sub,
    UserAttributes: [
      { Name: 'custom:tenantId', Value: tenantId },
      { Name: 'custom:tenantName', Value: tenant.name },
      { Name: 'custom:role', Value: membership.role },
    ],
  }));
  
  return {
    message: 'Tenencia cambiada exitosamente',
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    },
    role: membership.role,
    // Note: User will need to refresh their token to see the changes
    requiresTokenRefresh: true,
  };
}, 'switchTenant');
