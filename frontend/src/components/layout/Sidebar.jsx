// src/components/layout/Sidebar.jsx
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { FaTh, FaCalendarAlt, FaUsers, FaTimes, FaCog, FaChartBar, FaUserShield, FaBuilding, FaRobot } from 'react-icons/fa';
import { useAuthContext } from '../../auth/AuthContext.js';
import { switchTenant } from '../../api/tenancy.js';
import { forceRefreshSession } from '../../auth/cognitoAuth.js';
import { useVocabulary, formatPlural } from '../../hooks/useVocabulary.js';

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user, isTenantAdmin, isSuperAdmin, tenantId, clearActiveTenant } = useAuthContext();
  const vocab = useVocabulary();
  
  // Determinar si el usuario tiene una tenencia activa
  const hasTenancy = !!tenantId;
  const isStaff = user?.role === 'staff';
  const isSuper = isSuperAdmin();
  const tenantNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartBar />, path: '/dashboard' },
    { id: 'boxes', label: formatPlural(vocab.resource), icon: <FaTh />, path: '/boxes' },
    { id: 'staff', label: vocab.staff, icon: <FaUsers />, path: '/staff' },
    { id: 'appointments', label: formatPlural(vocab.reservation), icon: <FaCalendarAlt />, path: '/appointments' },
  ];

  // Close mobile nav on any navigation
  useEffect(() => {
    if (isOpen && location.pathname) {
      onClose();
    }
  }, [location.pathname, isOpen, onClose]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const sidebar = document.querySelector('.sidebar');
      const hamburger = document.querySelector('.hamburger-btn');
      
      if (isOpen && 
          sidebar && 
          !sidebar.contains(event.target) && 
          hamburger && 
          !hamburger.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      // Add listeners for both touch and mouse events
      document.addEventListener('touchstart', handleOutsideClick, { passive: true });
      document.addEventListener('mousedown', handleOutsideClick);
      // Prevent body scroll when sidebar is open on mobile
      if (window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // If super admin, do not render sidebar at all (they use AdminLayout)
  if (isSuperAdmin()) {
    return null;
  }

  const handleLinkClick = () => {
    onClose();
  };

  const handleExitTenancy = async () => {
    try {
      // 1. Call backend to clear tenant from Cognito attributes
      await switchTenant(null);
      
      // 2. Force token refresh to get clean claims
      await forceRefreshSession();
      
      // 3. Clear local state (sets active_tenant_id to 'null')
      clearActiveTenant();
      
      // 4. Close sidebar
      handleLinkClick();
      
      // 5. Redirect
      window.location.href = '/account/tenancies';
    } catch (error) {
      console.error('Error exiting tenancy:', error);
      // Fallback: just clear local and redirect
      clearActiveTenant();
      window.location.href = '/account/tenancies';
    }
  };

  // Super admin uses AdminLayout; avoid rendering sidebar in MainLayout
  if (isSuper) {
    return null;
  }

  const renderMainMenu = () => {
    // Super Admin: No sidebar at all in MainLayout, they use AdminLayout exclusively
    if (isSuper) {
      return null;
    }

    return (
      <ul>
        {/* AI Agent - Highlighted for tenant_admin with active tenancy */}
        {isTenantAdmin() && hasTenancy && (
          <li className={`ai-agent-link ${location.pathname === '/ai-agent' ? 'active' : ''}`}>
            <Link to="/ai-agent" onClick={handleLinkClick}>
              <FaRobot />
              <span className="nav-label ai-highlight">Agente IA</span>
              <span className="ai-badge">✨</span>
            </Link>
          </li>
        )}
        
        {/* My Tenancies - for tenant_admin only (not staff, not super_admin) */}
        {isTenantAdmin() && (
          <li className={location.pathname.startsWith('/account/tenancies') ? 'active' : ''}>
            <Link to="/account/tenancies" onClick={handleLinkClick}>
              <FaBuilding />
              <span className="nav-label">Mis Tenencias</span>
            </Link>
          </li>
        )}
        
        {/* Settings - always visible for non-super-admin */}
        <li className={location.pathname === '/settings' ? 'active' : ''}>
          <Link to="/settings" onClick={handleLinkClick}>
            <FaCog />
            <span className="nav-label">Configuración</span>
          </Link>
        </li>
        
        {/* Tenant-specific items - show for staff AND tenant_admin with active tenancy */}
        {hasTenancy && (
          <>
            <li className="nav-divider">
              <span className="nav-divider-text">Gestión de Tenencia</span>
            </li>
            {tenantNavItems.map(item => (
              <li key={item.id} className={location.pathname === item.path ? 'active' : ''}>
                <Link to={item.path} onClick={handleLinkClick}>
                  {item.icon}
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}

            {/* Exit Tenancy Option - Hide for pure staff */}
            {!isStaff && (
              <li className="exit-tenancy-link">
                <button 
                  onClick={handleExitTenancy} 
                  className="nav-btn-link"
                  style={{ 
                    color: 'var(--text-secondary)', 
                    marginTop: '10px', 
                    paddingTop: '10px',
                    background: 'none',
                    border: 'none',
                    borderTop: '1px solid var(--border-color)',
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 15px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  <FaBuilding style={{ marginRight: '10px' }} />
                  <span className="nav-label">Salir de Tenencia</span>
                </button>
              </li>
            )}
          </>
        )}
      </ul>
    );
  };
  
  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={onClose}
        onTouchStart={onClose} // Also handle touch for overlay
      ></div>
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'show-mobile' : ''}`}>
        <button className="mobile-close-btn" onClick={onClose} type="button" aria-label="Cerrar menú">
          <FaTimes />
        </button>
        {renderMainMenu()}
        
        <div className="developer-info">
          <p className="developed-by">FM IT Solutions</p>
          <p className="developers">Mattias Morales, Francisco Polo y Milan Kurte</p>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;

