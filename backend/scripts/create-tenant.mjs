#!/usr/bin/env node

/**
 * Script to create a tenant
 * 
 * Usage:
 *   node scripts/create-tenant.mjs "Hospital Name" [--slug hospital-slug]
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const REGION = process.env.AWS_REGION || 'us-east-1';
const STAGE = process.env.STAGE || 'prod';
const T_TENANTS = `smartboxing-Tenants-${STAGE}`;

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/create-tenant.mjs "Hospital Name" [--slug hospital-slug]');
  process.exit(1);
}

const name = args[0];
const slugIndex = args.indexOf('--slug');
const slug = slugIndex > -1 ? args[slugIndex + 1] : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const tenantId = randomUUID();
const now = new Date().toISOString();

const tenant = {
  id: tenantId,
  name: name,
  slug: slug,
  status: 'active',
  settings: {
    logo: null,
    theme: 'default',
    timezone: 'America/Santiago',
  },
  userCount: 0,
  createdAt: now,
  updatedAt: now,
};

await client.send(new PutCommand({
  TableName: T_TENANTS,
  Item: tenant,
}));

console.log('\n✅ Tenant created successfully!\n');
console.log(`   ID:   ${tenantId}`);
console.log(`   Name: ${name}`);
console.log(`   Slug: ${slug}`);
console.log(`\n📋 Full tenant data:`);
console.log(JSON.stringify(tenant, null, 2));
