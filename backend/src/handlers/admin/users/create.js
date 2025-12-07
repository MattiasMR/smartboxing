/**
 * Admin Handlers - User Management
 * Create new user (invites user to tenant)
 */

import { z } from 'zod';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { handler, parseBody } from '../../../lib/http.js';
import { requireTenantAdmin, ROLES } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANT_USERS = process.env.T_TENANT_USERS;
const T_TENANTS = process.env.T_TENANTS;
const USER_POOL_ID = process.env.USER_POOL_ID;

const cognito = new CognitoIdentityProviderClient({});

// Validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['tenant_admin', 'staff']),
  tenantId: z.string().uuid().optional(), // Required only if super_admin is creating
});

export const main = handler(async (event) => {
  const admin = requireTenantAdmin(event);
  
  const body = parseBody(event);
  const data = CreateUserSchema.parse(body);
  
  // Determine target tenant
  let targetTenantId;
  if (admin.role === ROLES.SUPER_ADMIN) {
    targetTenantId = data.tenantId;
    if (!targetTenantId) {
      const error = new Error('tenantId is required for super_admin');
      error.statusCode = 400;
      throw error;
    }
  } else {
    targetTenantId = admin.tenantId;
    // Tenant admin cannot create other tenant_admins
    if (data.role === 'tenant_admin' && admin.role !== ROLES.SUPER_ADMIN) {
      const error = new Error('Only super_admin can create tenant_admin users');
      error.statusCode = 403;
      throw error;
    }
  }
  
  // Verify tenant exists
  const tenant = await doc.send(new GetCommand({
    TableName: T_TENANTS,
    Key: { id: targetTenantId },
  }));
  
  if (!tenant.Item || tenant.Item.status !== 'active') {
    const error = new Error('Tenant not found or inactive');
    error.statusCode = 404;
    throw error;
  }
  
  const tenantName = tenant.Item.name;
  
  // Create user in Cognito
  let cognitoSub;
  try {
    const createResult = await cognito.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: data.email,
      UserAttributes: [
        { Name: 'email', Value: data.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: data.name },
        { Name: 'custom:tenantId', Value: targetTenantId },
        { Name: 'custom:tenantName', Value: tenantName },
        { Name: 'custom:role', Value: data.role },
      ],
      DesiredDeliveryMediums: ['EMAIL'],
    }));
    
    cognitoSub = createResult.User.Attributes.find(a => a.Name === 'sub')?.Value;
  } catch (e) {
    if (e.name === 'UsernameExistsException') {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }
    throw e;
  }
  
  // Create record in TenantUsers table
  const now = new Date().toISOString();
  const tenantUser = {
    cognitoSub,
    tenantId: targetTenantId,
    tenantName,
    email: data.email,
    name: data.name,
    role: data.role,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    createdBy: admin.email,
  };
  
  await doc.send(new PutCommand({
    TableName: T_TENANT_USERS,
    Item: tenantUser,
  }));
  
  // Update tenant user count
  await doc.send(new UpdateCommand({
    TableName: T_TENANTS,
    Key: { id: targetTenantId },
    UpdateExpression: 'SET userCount = if_not_exists(userCount, :zero) + :one',
    ExpressionAttributeValues: {
      ':zero': 0,
      ':one': 1,
    },
  }));
  
  return tenantUser;
}, 'createUser');
