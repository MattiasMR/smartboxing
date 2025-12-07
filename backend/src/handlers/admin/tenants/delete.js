/**
 * Admin Handlers - Tenant Management
 * Delete tenant (super_admin only) - soft delete
 */

import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../../lib/http.js';
import { requireSuperAdmin } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANTS = process.env.T_TENANTS;

export const main = handler(async (event) => {
  // Only super admins can delete tenants
  requireSuperAdmin(event);
  
  const { id } = event.pathParameters || {};
  
  if (!id) {
    const error = new Error('Tenant ID is required');
    error.statusCode = 400;
    throw error;
  }
  
  // Check tenant exists
  const existing = await doc.send(new GetCommand({
    TableName: T_TENANTS,
    Key: { id },
  }));
  
  if (!existing.Item) {
    const error = new Error('Tenant not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Soft delete - mark as deleted
  await doc.send(new UpdateCommand({
    TableName: T_TENANTS,
    Key: { id },
    UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt, #deletedAt = :deletedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#updatedAt': 'updatedAt',
      '#deletedAt': 'deletedAt',
    },
    ExpressionAttributeValues: {
      ':status': 'deleted',
      ':updatedAt': new Date().toISOString(),
      ':deletedAt': new Date().toISOString(),
    },
  }));
  
  return { 
    message: 'Tenant deleted successfully',
    id,
  };
}, 'deleteTenant');
