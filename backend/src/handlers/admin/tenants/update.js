/**
 * Admin Handlers - Tenant Management
 * Update tenant (super_admin only)
 */

import { z } from 'zod';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../../lib/http.js';
import { requireSuperAdmin } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANTS = process.env.T_TENANTS;

// Validation schema for tenant update
const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  maxUsers: z.number().int().min(1).max(1000).optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
  settings: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
});

export const main = handler(async (event) => {
  // Only super admins can update tenants
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
  
  const body = parseBody(event);
  const data = UpdateTenantSchema.parse(body);
  
  // Build update expression dynamically
  const updateParts = [];
  const expressionValues = {};
  const expressionNames = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateParts.push(`#${key} = :${key}`);
      expressionNames[`#${key}`] = key;
      expressionValues[`:${key}`] = value;
    }
  });
  
  // Always update timestamp
  updateParts.push('#updatedAt = :updatedAt');
  expressionNames['#updatedAt'] = 'updatedAt';
  expressionValues[':updatedAt'] = new Date().toISOString();
  
  const result = await doc.send(new UpdateCommand({
    TableName: T_TENANTS,
    Key: { id },
    UpdateExpression: `SET ${updateParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
    ReturnValues: 'ALL_NEW',
  }));
  
  return result.Attributes;
}, 'updateTenant');
