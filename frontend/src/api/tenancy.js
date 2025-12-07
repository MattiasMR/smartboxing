/**
 * Tenancy API client for multi-tenant management
 * Handles hospital registration requests and tenant switching
 */

import { api } from './client.js';

// ========== TENANCY REQUESTS ==========

/**
 * Create a new hospital registration request
 * @param {Object} data - Request data
 * @param {string} data.hospitalName - Name of the hospital
 * @param {string} data.slug - Unique identifier (URL-friendly)
 * @param {string} [data.description] - Hospital description
 * @param {string} [data.contactEmail] - Contact email
 * @param {string} [data.contactPhone] - Contact phone
 * @param {string} [data.address] - Hospital address
 */
export async function createTenancyRequest(data) {
  const response = await api.post('/tenancy/requests', data);
  return response.data;
}

/**
 * List tenancy requests
 * - Super admin: sees all requests (can filter by status)
 * - Regular users: see only their own requests
 * @param {Object} [params] - Query parameters
 * @param {string} [params.status] - Filter by status: pending, approved, rejected
 * @param {boolean} [params.onlyMine] - If true, force showing only user's own requests (useful for super_admin)
 */
export async function listTenancyRequests(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.onlyMine) {
    queryParams.append('onlyMine', 'true');
  }
  const query = queryParams.toString();
  const response = await api.get(`/tenancy/requests${query ? `?${query}` : ''}`);
  return response.data;
}

/**
 * Review a tenancy request (super_admin only)
 * @param {string} requestId - The request ID
 * @param {Object} data - Review data
 * @param {string} data.action - 'approve' or 'reject'
 * @param {string} [data.rejectionReason] - Reason for rejection
 */
export async function reviewTenancyRequest(requestId, data) {
  const response = await api.post(`/tenancy/requests/${requestId}/review`, data);
  return response.data;
}

// ========== USER TENANCIES ==========

/**
 * Get list of tenants where the current user is admin
 * Returns all tenancies the user can manage
 */
export async function getUserTenancies() {
  const response = await api.get('/tenancy/my-tenants');
  return response.data;
}

/**
 * Switch active tenant for the current user
 * Updates Cognito custom attributes to set new active tenant
 * @param {string} tenantId - The tenant ID to switch to
 */
export async function switchTenant(tenantId) {
  const response = await api.post('/tenancy/switch', { tenantId });
  return response.data;
}

// ========== HELPER FUNCTIONS ==========

/**
 * Generate a URL-friendly slug from a hospital name
 * @param {string} name - Hospital name
 * @returns {string} URL-friendly slug
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')      // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '')          // Remove leading/trailing dashes
    .substring(0, 50);                 // Limit length
}

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} Whether slug is valid
 */
export function isValidSlug(slug) {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}
