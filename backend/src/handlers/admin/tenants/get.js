/**
 * Admin Handlers - Tenant Management
 * Get single tenant details (super_admin only)
 */

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../../lib/http.js';
import { requireSuperAdmin } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANTS = process.env.T_TENANTS;

export const main = handler(async (event) => {
  // Only super admins can get tenant details
  requireSuperAdmin(event);
  
  const { id } = event.pathParameters || {};
  
  if (!id) {
    const error = new Error('Tenant ID is required');
    error.statusCode = 400;
    throw error;
  }
  
  const result = await doc.send(new GetCommand({
    TableName: T_TENANTS,
    Key: { id },
  }));
  
  if (!result.Item) {
    const error = new Error('Tenant not found');
    error.statusCode = 404;
    throw error;
  }
  
  return result.Item;
}, 'getTenant');
