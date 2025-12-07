/**
 * Tenancy Request - Create new hospital registration request
 * Any authenticated user can request to register a new hospital
 */

import { z } from 'zod';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { handler, parseBody } from '../../lib/http.js';
import { extractUser } from '../../lib/auth.js';
import { doc } from '../../lib/db.js';
import { randomUUID } from 'crypto';

const T_TENANCY_REQUESTS = process.env.T_TENANCY_REQUESTS;
const T_TENANTS = process.env.T_TENANTS;

const CreateRequestSchema = z.object({
  hospitalName: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug debe ser minúsculas con guiones'),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  reason: z.string().max(1000).optional(), // Why they want this tenant
});

export const main = handler(async (event) => {
  const user = extractUser(event);
  
  if (!user) {
    const error = new Error('Must be authenticated to request a tenancy');
    error.statusCode = 401;
    throw error;
  }
  
  const body = parseBody(event);
  const data = CreateRequestSchema.parse(body);
  
  // Check if slug already exists in tenants
  const existingTenant = await doc.send(new QueryCommand({
    TableName: T_TENANTS,
    IndexName: 'BySlug',
    KeyConditionExpression: 'slug = :slug',
    ExpressionAttributeValues: { ':slug': data.slug },
  }));
  
  if (existingTenant.Items && existingTenant.Items.length > 0) {
    const error = new Error('Este slug ya está en uso por otro hospital');
    error.statusCode = 409;
    throw error;
  }
  
  // Check if there's already a pending request with this slug
  const existingRequest = await doc.send(new QueryCommand({
    TableName: T_TENANCY_REQUESTS,
    IndexName: 'BySlug',
    KeyConditionExpression: 'slug = :slug',
    FilterExpression: '#status = :pending',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { 
      ':slug': data.slug,
      ':pending': 'pending',
    },
  }));
  
  if (existingRequest.Items && existingRequest.Items.length > 0) {
    const error = new Error('Ya existe una solicitud pendiente con este slug');
    error.statusCode = 409;
    throw error;
  }
  
  const now = new Date().toISOString();
  const requestId = randomUUID();
  
  const request = {
    id: requestId,
    hospitalName: data.hospitalName,
    slug: data.slug,
    description: data.description || '',
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone || '',
    address: data.address || '',
    reason: data.reason || '',
    // Requester info
    requestedBy: user.sub,
    requesterEmail: user.email,
    requesterName: user.name || user.email,
    // Status
    status: 'pending', // pending, approved, rejected
    // Timestamps
    createdAt: now,
    updatedAt: now,
  };
  
  await doc.send(new PutCommand({
    TableName: T_TENANCY_REQUESTS,
    Item: request,
  }));
  
  return {
    message: 'Solicitud de tenencia creada exitosamente',
    request: {
      id: request.id,
      hospitalName: request.hospitalName,
      slug: request.slug,
      status: request.status,
      createdAt: request.createdAt,
    },
  };
}, 'createTenancyRequest');
