/**
 * AdminLayout - Layout for admin panel pages
 * Shows admin-specific navigation and styling
 */

import { useState, useCallback } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthContext } from '../../auth/AuthContext.js';
import TopHeader from './TopHeader';
import './AdminLayout.css';

function AdminLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isSuperAdmin, tenantName, role } = useAuthContext();

  const handleMenuClick = useCallback(() => {
    setIsMobileNavOpen(prev => !prev);
  }, []);

  const handleCloseNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  return (
    <div className="admin-layout-root">
      <TopHeader 
        onMenuClick={handleMenuClick} 
        isOpen={isMobileNavOpen} 
      />
      <div className="admin-layout-container">
        {/* Admin Sidebar */}
        <aside className={`admin-sidebar ${isMobileNavOpen ? 'open' : ''}`}>
          <div className="admin-sidebar-header">
            <h2>Panel de Admin</h2>
            <span className="admin-role-badge">
              {role === 'super_admin' ? '🔑 Super Admin' : '👤 Admin'}
            </span>
            {tenantName && role !== 'super_admin' && (
              <span className="admin-tenant-name">{tenantName}</span>
            )}
          </div>
          
          <nav className="admin-nav">
            {isSuperAdmin() && (
              <>
                <NavLink 
                  to="/admin/tenants" 
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleCloseNav}
                >
                  <span className="nav-icon">🏢</span>
                  Tenencias
                </NavLink>
                <NavLink 
                  to="/admin/tenancy-requests" 
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleCloseNav}
                >
                  <span className="nav-icon">📋</span>
                  Solicitudes
                </NavLink>
              </>
            )}
            
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={handleCloseNav}
            >
              <span className="nav-icon">👥</span>
              Usuarios
            </NavLink>
            
            <div className="admin-nav-divider"></div>
            
            <NavLink 
              to="/dashboard" 
              className="admin-nav-link admin-nav-back"
              onClick={handleCloseNav}
            >
              <span className="nav-icon">←</span>
              Volver al Sistema
            </NavLink>
          </nav>
        </aside>

        {/* Main content */}
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isMobileNavOpen && (
        <div className="admin-sidebar-overlay" onClick={handleCloseNav}></div>
      )}
    </div>
  );
}

export default AdminLayout;
