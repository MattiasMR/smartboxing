// src/components/layout/TopHeader.jsx
import React, { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import { useAuth } from '../../auth/useAuth';
import { switchTenant } from '../../api/tenancy';
import TenantSelector from './TenantSelector.jsx';
import './TopHeader.css';

function TopHeader({ onMenuClick, isOpen }) {
  const [now, setNow] = useState(new Date());
  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('app-name') || 'SmartBoxing';
  });
  const [institutionName, setInstitutionName] = useState(() => {
    return localStorage.getItem('institution-name') || '';
  });
  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem('app-logo') || '';
  });
  const { logout, user } = useAuth();

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const handleAppNameChange = (event) => {
      setAppName(event.detail);
    };
    
    const handleInstitutionNameChange = (event) => {
      setInstitutionName(event.detail);
    };

    const handleLogoChange = (event) => {
      setLogoUrl(event.detail);
    };
    
    window.addEventListener('appNameChanged', handleAppNameChange);
    window.addEventListener('institutionNameChanged', handleInstitutionNameChange);
    window.addEventListener('logoChanged', handleLogoChange);
    
    return () => {
      window.removeEventListener('appNameChanged', handleAppNameChange);
      window.removeEventListener('institutionNameChanged', handleInstitutionNameChange);
      window.removeEventListener('logoChanged', handleLogoChange);
    };
  }, []);

  const formattedDate = now.toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('es-CL');

  const handleLogout = async () => {
    try {
      // Intentar limpiar la tenencia en el backend antes de salir
      // Esto asegura que el próximo login no tenga tenencia seleccionada
      if (user && user.tenantId) {
        await switchTenant(null);
      }
    } catch (error) {
      console.error('Error clearing tenancy on logout:', error);
      // Continuamos con el logout aunque falle esto
    }

    // Limpiar tokens locales
    logout();
    // Redirigir a Login
    window.location.href = '/login';
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    onMenuClick();
  };

  const handleMenuTouch = (e) => {
    e.stopPropagation();
    onMenuClick();
  };

  return (
    <header className="top-header">
      <div className="top-header-content">
        <div className="header-left">
          <button
            className="hamburger-btn"
            onClick={handleMenuClick}
            onMouseDown={handleMenuClick}
            onTouchStart={handleMenuTouch}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            type="button"
          >
            <FaBars />
          </button>
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="header-logo"
              style={{ height: '40px', marginRight: '1rem', objectFit: 'contain' }}
            />
          )}
          <div className="header-titles">
            <h1 className="header-title">{appName}</h1>
            {institutionName && (
              <span className="institution-name">{institutionName}</span>
            )}
          </div>
        </div>
        
        <div className="header-center" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>{formattedDate}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.2em', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {formattedTime}
          </div>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <TenantSelector />
          <span className="user-name" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Usuario'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
export default TopHeader;
