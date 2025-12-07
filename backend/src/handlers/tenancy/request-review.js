/**
 * Tenancy Request - Approve or Reject (super_admin only)
 * When approved, creates the tenant and assigns the requester as tenant_admin
 */

import { z } from 'zod';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { 
  CognitoIdentityProviderClient, 
  AdminUpdateUserAttributesCommand 
} from '@aws-sdk/client-cognito-identity-provider';
import { handler, parseBody } from '../../lib/http.js';
import { requireSuperAdmin } from '../../lib/auth.js';
import { doc } from '../../lib/db.js';
import { randomUUID } from 'crypto';

const T_TENANCY_REQUESTS = process.env.T_TENANCY_REQUESTS;
const T_TENANTS = process.env.T_TENANTS;
const T_TENANT_USERS = process.env.T_TENANT_USERS;
const USER_POOL_ID = process.env.USER_POOL_ID;

const cognito = new CognitoIdentityProviderClient({});

const ReviewRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
  // Optional: customize tenant settings on approval
  maxUsers: z.number().int().min(1).max(1000).optional(),
});

export const main = handler(async (event) => {
  const admin = requireSuperAdmin(event);
  
  const { id } = event.pathParameters || {};
  
  if (!id) {
    const error = new Error('Request ID is required');
    error.statusCode = 400;
    throw error;
  }
  
  // Get the request
  const requestResult = await doc.send(new GetCommand({
    TableName: T_TENANCY_REQUESTS,
    Key: { id },
  }));
  
  if (!requestResult.Item) {
    const error = new Error('Request not found');
    error.statusCode = 404;
    throw error;
  }
  
  const request = requestResult.Item;
  
  if (request.status !== 'pending') {
    const error = new Error(`Request already ${request.status}`);
    error.statusCode = 400;
    throw error;
  }
  
  const body = parseBody(event);
  const data = ReviewRequestSchema.parse(body);
  
  const now = new Date().toISOString();
  
  if (data.action === 'reject') {
    // Update request status to rejected
    await doc.send(new UpdateCommand({
      TableName: T_TENANCY_REQUESTS,
      Key: { id },
      UpdateExpression: 'SET #status = :status, rejectionReason = :reason, reviewedBy = :reviewer, reviewedAt = :reviewedAt, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'rejected',
        ':reason': data.rejectionReason || 'Solicitud rechazada por el administrador',
        ':reviewer': admin.email,
        ':reviewedAt': now,
        ':now': now,
      },
    }));
    
    return {
      message: 'Solicitud rechazada',
      request: { id, status: 'rejected' },
    };
  }
  
  // APPROVE - Create the tenant
  const tenantId = randomUUID();
  
  const tenant = {
    id: tenantId,
    name: request.hospitalName,
    slug: request.slug,
    description: request.description || '',
    contactEmail: request.contactEmail,
    contactPhone: request.contactPhone || '',
    address: request.address || '',
    maxUsers: data.maxUsers || 50,
    status: 'active',
    settings: {
      logo: '',
      primaryColor: '#3b82f6',
      timezone: 'America/Santiago',
      language: 'es',
    },
    createdAt: now,
    updatedAt: now,
    createdBy: admin.email,
  };
  
  // Create tenant
  await doc.send(new PutCommand({
    TableName: T_TENANTS,
    Item: tenant,
  }));
  
  // Add user to TenantUsers as tenant_admin
  await doc.send(new PutCommand({
    TableName: T_TENANT_USERS,
    Item: {
      cognitoSub: request.requestedBy,
      tenantId: tenantId,
      role: 'tenant_admin',
      email: request.requesterEmail,
      name: request.requesterName,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  }));
  
  // Update user's Cognito attributes to reflect new tenant
  // Note: If user already has a tenant, this will update to the new one
  // In a more complex system, you'd handle multiple tenants differently
  try {
    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: request.requesterEmail,
      UserAttributes: [
        { Name: 'custom:role', Value: 'tenant_admin' },
        { Name: 'custom:tenantId', Value: tenantId },
        { Name: 'custom:tenantName', Value: request.hospitalName },
      ],
    }));
  } catch (cognitoError) {
    console.error('Error updating Cognito user:', cognitoError);
    // Don't fail the whole operation if Cognito update fails
  }
  
  // Update request status to approved
  await doc.send(new UpdateCommand({
    TableName: T_TENANCY_REQUESTS,
    Key: { id },
    UpdateExpression: 'SET #status = :status, tenantId = :tenantId, reviewedBy = :reviewer, reviewedAt = :reviewedAt, updatedAt = :now',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': 'approved',
      ':tenantId': tenantId,
      ':reviewer': admin.email,
      ':reviewedAt': now,
      ':now': now,
    },
  }));
  
  return {
    message: 'Solicitud aprobada. Hospital creado y usuario asignado como administrador.',
    request: { id, status: 'approved' },
    tenant: {
      id: tenantId,
      name: tenant.name,
      slug: tenant.slug,
    },
  };
}, 'reviewTenancyRequest');
