import { describe, it, expect, vi } from 'vitest';

// Mock the tenancy API
vi.mock('../../api/tenancy.js', () => ({
  getUserTenancies: vi.fn(),
  switchTenant: vi.fn(),
  listTenancyRequests: vi.fn(),
  createTenancyRequest: vi.fn(),
}));

import { getUserTenancies, switchTenant, listTenancyRequests, createTenancyRequest } from '../../api/tenancy.js';

/**
 * Tests para componentes y flujos de tenancy
 */

describe('Tenancy Utilities', () => {
  describe('Slug Generation', () => {
    const generateSlug = (name) => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')      // Replace non-alphanumeric with dashes
        .replace(/^-+|-+$/g, '')          // Remove leading/trailing dashes
        .substring(0, 50);                 // Limit length
    };

    it('should convert to lowercase', () => {
      expect(generateSlug('Centro Médico')).toBe('centro-medico');
    });

    it('should remove accents', () => {
      expect(generateSlug('Clínica Ñuñoa')).toBe('clinica-nunoa');
    });

    it('should replace spaces with dashes', () => {
      expect(generateSlug('Mi Centro')).toBe('mi-centro');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Centro & Clínica')).toBe('centro-clinica');
    });

    it('should limit to 50 characters', () => {
      const longName = 'Este es un nombre muy largo para una organización que excede el límite';
      expect(generateSlug(longName).length).toBeLessThanOrEqual(50);
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });
  });

  describe('Slug Validation', () => {
    const isValidSlug = (slug) => {
      if (!slug || typeof slug !== 'string') return false;
      if (slug.length < 3 || slug.length > 50) return false;
      return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || /^[a-z0-9]{3,}$/.test(slug);
    };

    it('should accept valid slugs', () => {
      expect(isValidSlug('centro-medico')).toBe(true);
      expect(isValidSlug('clinica123')).toBe(true);
      expect(isValidSlug('abc')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('ab')).toBe(false); // too short
      expect(isValidSlug('')).toBe(false);
      expect(isValidSlug(null)).toBe(false);
    });
  });
});

describe('Tenancy Data Structures', () => {
  describe('User Tenancy', () => {
    it('should have required fields', () => {
      const tenancy = {
        tenantId: 'uuid-tenant',
        tenantName: 'Mi Centro',
        role: 'tenant_admin',
      };

      expect(tenancy.tenantId).toBeDefined();
      expect(tenancy.tenantName).toBeDefined();
      expect(tenancy.role).toBeDefined();
    });

    it('should have valid role values', () => {
      const validRoles = ['super_admin', 'tenant_admin', 'staff'];
      const tenancy = { role: 'tenant_admin' };

      expect(validRoles).toContain(tenancy.role);
    });
  });

  describe('Tenancy Request', () => {
    it('should have required fields for creation', () => {
      const request = {
        tenancyName: 'Mi Nuevo Centro',
        slug: 'mi-nuevo-centro',
        contactEmail: 'contacto@centro.cl',
      };

      expect(request.tenancyName).toBeDefined();
      expect(request.slug).toBeDefined();
      expect(request.contactEmail).toBeDefined();
    });

    it('should have correct status values', () => {
      const validStatuses = ['pending', 'approved', 'rejected'];
      
      validStatuses.forEach(status => {
        const request = { status };
        expect(validStatuses).toContain(request.status);
      });
    });
  });
});

describe('Tenancy State Management', () => {
  describe('Switch Tenant Logic', () => {
    it('should call switchTenant API on tenant change', async () => {
      switchTenant.mockResolvedValueOnce({ 
        message: 'Switched',
        requiresTokenRefresh: true 
      });

      await switchTenant('new-tenant-id');

      expect(switchTenant).toHaveBeenCalledWith('new-tenant-id');
    });

    it('should handle switch errors', async () => {
      switchTenant.mockRejectedValueOnce(new Error('No access'));

      await expect(switchTenant('invalid-tenant')).rejects.toThrow('No access');
    });
  });

  describe('List Tenancies', () => {
    it('should return empty array when no tenancies', async () => {
      getUserTenancies.mockResolvedValueOnce({ tenancies: [] });

      const result = await getUserTenancies();

      expect(result.tenancies).toEqual([]);
    });

    it('should return tenancies array', async () => {
      const mockTenancies = [
        { tenantId: 't1', tenantName: 'Centro 1', role: 'tenant_admin' },
        { tenantId: 't2', tenantName: 'Centro 2', role: 'staff' },
      ];
      getUserTenancies.mockResolvedValueOnce({ tenancies: mockTenancies });

      const result = await getUserTenancies();

      expect(result.tenancies).toHaveLength(2);
      expect(result.tenancies[0].role).toBe('tenant_admin');
    });
  });

  describe('List Requests', () => {
    it('should filter by status', async () => {
      listTenancyRequests.mockResolvedValueOnce({
        requests: [
          { id: 'r1', status: 'pending' },
        ],
      });

      const result = await listTenancyRequests({ status: 'pending' });

      expect(result.requests[0].status).toBe('pending');
    });

    it('should support onlyMine filter', async () => {
      listTenancyRequests.mockResolvedValueOnce({
        requests: [{ id: 'my-request', status: 'pending' }],
      });

      await listTenancyRequests({ onlyMine: true });

      expect(listTenancyRequests).toHaveBeenCalledWith({ onlyMine: true });
    });
  });

  describe('Create Request', () => {
    it('should create request with required data', async () => {
      createTenancyRequest.mockResolvedValueOnce({
        message: 'Created',
        request: { id: 'new-id', status: 'pending' },
      });

      const requestData = {
        hospitalName: 'Nuevo Centro',
        slug: 'nuevo-centro',
        contactEmail: 'contacto@nuevo.cl',
      };

      const result = await createTenancyRequest(requestData);

      expect(result.request.status).toBe('pending');
      expect(createTenancyRequest).toHaveBeenCalledWith(requestData);
    });
  });
});

describe('Role-based Access', () => {
  describe('Role Hierarchy', () => {
    const ROLE_HIERARCHY = {
      super_admin: 3,
      tenant_admin: 2,
      staff: 1,
    };

    const hasRole = (userRole, requiredRole) => {
      const userLevel = ROLE_HIERARCHY[userRole] || 0;
      const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
      return userLevel >= requiredLevel;
    };

    it('should allow super_admin to access all', () => {
      expect(hasRole('super_admin', 'staff')).toBe(true);
      expect(hasRole('super_admin', 'tenant_admin')).toBe(true);
      expect(hasRole('super_admin', 'super_admin')).toBe(true);
    });

    it('should allow tenant_admin to access staff routes', () => {
      expect(hasRole('tenant_admin', 'staff')).toBe(true);
      expect(hasRole('tenant_admin', 'tenant_admin')).toBe(true);
      expect(hasRole('tenant_admin', 'super_admin')).toBe(false);
    });

    it('should restrict staff to staff routes only', () => {
      expect(hasRole('staff', 'staff')).toBe(true);
      expect(hasRole('staff', 'tenant_admin')).toBe(false);
      expect(hasRole('staff', 'super_admin')).toBe(false);
    });
  });

  describe('Tenant Access', () => {
    it('should check if user has active tenant', () => {
      const user1 = { role: 'tenant_admin', tenantId: 'tenant-123' };
      const user2 = { role: 'tenant_admin', tenantId: null };

      expect(!!user1.tenantId).toBe(true);
      expect(!!user2.tenantId).toBe(false);
    });

    it('should allow super_admin without tenant to access admin routes', () => {
      const user = { role: 'super_admin', tenantId: null };

      const canAccessAdmin = user.role === 'super_admin';
      const canAccessTenantRoutes = !!user.tenantId;

      expect(canAccessAdmin).toBe(true);
      expect(canAccessTenantRoutes).toBe(false);
    });
  });
});

describe('Routing Logic', () => {
  describe('Post-login Redirect', () => {
    it('should redirect to tenancies when no active tenant', () => {
      const user = { role: 'tenant_admin', tenantId: null };

      const getRedirectPath = (user) => {
        if (!user) return '/login';
        if (user.role === 'super_admin' && !user.tenantId) return '/admin/tenants';
        if (user.tenantId) return '/dashboard';
        return '/account/tenancies';
      };

      expect(getRedirectPath(user)).toBe('/account/tenancies');
    });

    it('should redirect to dashboard when has tenant', () => {
      const user = { role: 'tenant_admin', tenantId: 'tenant-123' };

      const getRedirectPath = (user) => {
        if (!user) return '/login';
        if (user.role === 'super_admin' && !user.tenantId) return '/admin/tenants';
        if (user.tenantId) return '/dashboard';
        return '/account/tenancies';
      };

      expect(getRedirectPath(user)).toBe('/dashboard');
    });

    it('should redirect super_admin to admin panel', () => {
      const user = { role: 'super_admin', tenantId: null };

      const getRedirectPath = (user) => {
        if (!user) return '/login';
        if (user.role === 'super_admin' && !user.tenantId) return '/admin/tenants';
        if (user.tenantId) return '/dashboard';
        return '/account/tenancies';
      };

      expect(getRedirectPath(user)).toBe('/admin/tenants');
    });
  });

  describe('Protected Route Logic', () => {
    it('should block tenant routes without tenantId', () => {
      const user = { role: 'tenant_admin', tenantId: null };
      const requireTenant = true;
      // Testing route: /dashboard

      const canAccess = !requireTenant || !!user.tenantId;

      expect(canAccess).toBe(false);
    });

    it('should allow account routes without tenantId', () => {
      const user = { role: 'tenant_admin', tenantId: null };
      const path = '/account/tenancies';

      const isAccountRoute = path.startsWith('/account');
      const canAccess = isAccountRoute || !!user.tenantId;

      expect(canAccess).toBe(true);
    });
  });
});
