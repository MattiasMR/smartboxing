/**
 * Switch Tenant - Change current user's active tenant
 * Allows tenant_admin to switch between tenants they manage
 */

import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { 
  CognitoIdentityProviderClient, 
  AdminUpdateUserAttributesCommand 
} from '@aws-sdk/client-cognito-identity-provider';
import { handler, parseBody } from '../../lib/http.js';
import { extractUser, ROLES } from '../../lib/auth.js';
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
  
  // Verify user has access to this tenant
  const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
  
  const membershipResult = await doc.send(new ScanCommand({
    TableName: T_TENANT_USERS,
    FilterExpression: 'cognitoSub = :userId AND tenantId = :tenantId',
    ExpressionAttributeValues: {
      ':userId': user.sub,
      ':tenantId': tenantId,
    },
  }));
  
  if (!membershipResult.Items || membershipResult.Items.length === 0) {
    const error = new Error('No tienes acceso a esta tenencia');
    error.statusCode = 403;
    throw error;
  }
  
  const membership = membershipResult.Items[0];
  
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
  await cognito.send(new AdminUpdateUserAttributesCommand({
    UserPoolId: USER_POOL_ID,
    Username: user.email,
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
