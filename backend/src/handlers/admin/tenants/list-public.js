/**
 * Public endpoint - List available tenants for registration
 * Returns only active tenants with limited info (name, slug, logo)
 */

import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../../lib/http.js';
import { doc } from '../../../lib/db.js';

const T_TENANTS = process.env.T_TENANTS;

export const main = handler(async () => {
  const result = await doc.send(new ScanCommand({
    TableName: T_TENANTS,
    FilterExpression: '#status = :active',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#name': 'name',
    },
    ExpressionAttributeValues: {
      ':active': 'active',
    },
    ProjectionExpression: 'id, #name, slug, settings',
  }));
  
  // Return only public info
  const tenants = (result.Items || [])
    .map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      logo: t.settings?.logo || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return { tenants };
}, 'listTenantsPublic');
