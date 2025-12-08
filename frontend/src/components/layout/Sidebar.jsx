// src/components/layout/Sidebar.jsx
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { FaTh, FaCalendarAlt, FaUsers, FaTimes, FaCog, FaChartBar, FaUserShield, FaBuilding, FaRobot } from 'react-icons/fa';
import { useAuthContext } from '../../auth/AuthContext.js';

// Items que requieren una tenencia activa
const tenantNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <FaChartBar />, path: '/dashboard' },
  { id: 'boxes', label: 'Boxes', icon: <FaTh />, path: '/boxes' },
  { id: 'staff', label: 'Staff', icon: <FaUsers />, path: '/staff' },
  { id: 'appointments', label: 'Citas', icon: <FaCalendarAlt />, path: '/appointments' },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { isTenantAdmin, isSuperAdmin, tenantId } = useAuthContext();
  
  // Determinar si el usuario tiene una tenencia activa
  const hasTenancy = !!tenantId;

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
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleLinkClick = () => {
    onClose();
  };

  const renderMainMenu = () => (
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
      
      {/* Panel Admin - first for super_admin, or visible for tenant_admin */}
      {(isSuperAdmin() || isTenantAdmin()) && (
        <li className={location.pathname.startsWith('/admin') ? 'active admin-link' : 'admin-link'}>
          <Link to={isSuperAdmin() ? "/admin/tenants" : "/admin/users"} onClick={handleLinkClick}>
            <FaUserShield />
            <span className="nav-label">Panel Admin</span>
          </Link>
        </li>
      )}
      
      {/* My Tenancies - always visible */}
      <li className={location.pathname.startsWith('/account/tenancies') ? 'active' : ''}>
        <Link to="/account/tenancies" onClick={handleLinkClick}>
          <FaBuilding />
          <span className="nav-label">Mis Tenencias</span>
        </Link>
      </li>
      
      {/* Settings - always visible */}
      <li className={location.pathname === '/settings' ? 'active' : ''}>
        <Link to="/settings" onClick={handleLinkClick}>
          <FaCog />
          <span className="nav-label">Configuración</span>
        </Link>
      </li>
      
      {/* Tenant-specific items - only show if user has an active tenancy */}
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
        </>
      )}
    </ul>
  );
  
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
          <p className="developers">Mattias Morales y Francisco Polo</p>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;