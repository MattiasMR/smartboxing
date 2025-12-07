/**
 * Admin Handlers - Tenant Management
 * List all tenants (super_admin only)
 */

import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../../../lib/http.js';
import { requireSuperAdmin } from '../../../lib/auth.js';
import { doc } from '../../../lib/db.js';

const T_TENANTS = process.env.T_TENANTS;

export const main = handler(async (event) => {
  // Only super admins can list all tenants
  requireSuperAdmin(event);
  
  const result = await doc.send(new ScanCommand({
    TableName: T_TENANTS,
  }));
  
  // Sort by name
  const tenants = (result.Items || []).sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );
  
  return {
    tenants,
    count: tenants.length,
  };
}, 'listTenants');
