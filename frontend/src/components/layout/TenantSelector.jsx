/**
 * TenantSelector - Dropdown to switch between tenancies for tenant_admin users
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserTenancies, switchTenant } from '../../api/tenancy.js';
import { useAuth } from '../../auth/useAuth.js';
import { FaChevronDown, FaExchangeAlt } from 'react-icons/fa';
import './TenantSelector.css';

export default function TenantSelector() {
  const { user, refreshUser, switchTenantLocally } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get user's tenancies
  const { data, isLoading } = useQuery({
    queryKey: ['tenancy', 'my-tenancies'],
    queryFn: getUserTenancies,
    enabled: !!user,
  });

  const switchMutation = useMutation({
    mutationFn: async (tenantId) => {
      await switchTenant(tenantId);
      return tenantId;
    },
    onSuccess: async (tenantId) => {
      setIsOpen(false);
      
      // Find tenant details to update local state immediately
      const targetTenant = data?.tenancies?.find(t => t.tenantId === tenantId);
      if (targetTenant && switchTenantLocally) {
        switchTenantLocally({
          tenantId: targetTenant.tenantId,
          tenantName: targetTenant.name,
          role: targetTenant.role
        });
      }

      // Refresh user data from Cognito to ensure token is updated
      if (refreshUser) {
        await refreshUser();
      }
      
      // Invalidate all queries to reload data for new tenant
      queryClient.invalidateQueries();
      // Navigate to dashboard to ensure clean state
      window.location.href = '/dashboard';
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tenancies = data?.tenancies || [];
  const currentTenantId = user?.tenantId;
  const currentTenantName = user?.tenantName;

  // Don't show selector at all if user has no active tenantId
  // User must explicitly select a tenancy from "Mis Tenencias" page first
  if (!currentTenantId) {
    return null;
  }

  // Don't show dropdown if user has only one tenancy
  if (isLoading || tenancies.length <= 1) {
    // Show current tenant name as static display
    if (currentTenantName) {
      return (
        <div className="tenant-selector-static">
          <span className="tenant-selector-label">🏢</span>
          <span className="tenant-selector-current">{currentTenantName}</span>
        </div>
      );
    }
    return null;
  }

  const handleSwitch = (tenantId) => {
    if (tenantId !== currentTenantId) {
      switchMutation.mutate(tenantId);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="tenant-selector" ref={dropdownRef}>
      <button 
        className="tenant-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switchMutation.isPending}
      >
        <span className="tenant-selector-label">🏢</span>
        <span className="tenant-selector-current">
          {switchMutation.isPending ? 'Cambiando...' : (currentTenantName || 'Seleccionar')}
        </span>
        <FaChevronDown className={`tenant-selector-arrow ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="tenant-selector-dropdown">
          <div className="tenant-selector-header">
            <FaExchangeAlt />
            <span>Cambiar tenencia</span>
          </div>
          <div className="tenant-selector-list">
            {tenancies.map((t) => (
              <button
                key={t.tenantId}
                className={`tenant-selector-option ${t.tenantId === currentTenantId ? 'active' : ''}`}
                onClick={() => handleSwitch(t.tenantId)}
                disabled={switchMutation.isPending}
              >
                <span className="tenant-option-name">{t.tenantName}</span>
                {t.tenantId === currentTenantId && (
                  <span className="tenant-option-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
