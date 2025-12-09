/**
 * Admin API client for tenant and user management
 */

import { api } from './client.js';

// ========== TENANTS ==========

/**
 * List all tenants (super_admin only)
 */
export async function listTenants() {
  const response = await api.get('/admin/tenants');
  return response.data;
}

/**
 * Get single tenant details
 */
export async function getTenant(id) {
  const response = await api.get(`/admin/tenants/${id}`);
  return response.data;
}

/**
 * Create new tenant
 */
export async function createTenant(data) {
  const response = await api.post('/admin/tenants', data);
  return response.data;
}

/**
 * Update tenant
 */
export async function updateTenant(id, data) {
  const response = await api.put(`/admin/tenants/${id}`, data);
  return response.data;
}

/**
 * Delete tenant (soft delete)
 */
export async function deleteTenant(id) {
  const response = await api.delete(`/admin/tenants/${id}`);
  return response.data;
}

/**
 * List available tenants for registration (public endpoint)
 */
export async function listPublicTenants() {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tenants`);
  if (!response.ok) {
    throw new Error('Failed to fetch tenants');
  }
  return response.json();
}

// ========== USERS ==========

/**
 * List users (filtered by tenant for tenant_admin)
 */
export async function listUsers(tenantId = null) {
  const params = tenantId ? `?tenantId=${tenantId}` : '';
  const response = await api.get(`/admin/users${params}`);
  return response.data;
}

/**
 * Get single user details
 */
export async function getUser(cognitoSub) {
  const response = await api.get(`/admin/users/${cognitoSub}`);
  return response.data;
}

/**
 * Create new user (invite to tenant)
 */
export async function createUser(data) {
  const response = await api.post('/admin/users', data);
  return response.data;
}

/**
 * Update user role or status
 */
export async function updateUser(cognitoSub, data, tenantId = null) {
  const params = tenantId ? `?tenantId=${tenantId}` : '';
  const response = await api.put(`/admin/users/${cognitoSub}${params}`, data);
  return response.data;
}

/**
 * Delete user
 */
export async function deleteUser(cognitoSub, tenantId = null) {
  const params = tenantId ? `?tenantId=${tenantId}` : '';
  const response = await api.delete(`/admin/users/${cognitoSub}${params}`);
  return response.data;
}
