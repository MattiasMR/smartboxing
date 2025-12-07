/**
 * Admin Handlers - Tenant Management
 * Create new tenant (super_admin only)
 */

import { z } from 'zod';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../../lib/http.js';
import { requireSuperAdmin } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';
import { randomUUID } from 'crypto';

const T_TENANTS = process.env.T_TENANTS;

// Validation schema for tenant creation
const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  maxUsers: z.number().int().min(1).max(1000).optional().default(50),
  settings: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    timezone: z.string().optional().default('America/Santiago'),
    language: z.string().optional().default('es'),
  }).optional().default({}),
});

export const main = handler(async (event) => {
  // Only super admins can create tenants
  const admin = requireSuperAdmin(event);
  
  const body = parseBody(event);
  const data = CreateTenantSchema.parse(body);
  
  // Check if slug already exists
  const existingSlug = await doc.send(new QueryCommand({
    TableName: T_TENANTS,
    IndexName: 'BySlug',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: {
      ':slug': data.slug,
    },
  }));
  
  if (existingSlug.Items && existingSlug.Items.length > 0) {
    const error = new Error(`Tenant with slug "${data.slug}" already exists`);
    error.statusCode = 409;
    throw error;
  }
  
  const now = new Date().toISOString();
  const tenant = {
    id: randomUUID(),
    ...data,
    status: 'active', // active, suspended, deleted
    userCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: admin.email,
  };
  
  await doc.send(new PutCommand({
    TableName: T_TENANTS,
    Item: tenant,
  }));
  
  return tenant;
}, 'createTenant');
