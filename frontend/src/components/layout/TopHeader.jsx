// src/components/layout/TopHeader.jsx
import React, { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import { useAuth } from '../../auth/AuthProvider';
import { logoutUrl } from '../../auth/cognito.js';
import './TopHeader.css';

const userAvatar = 'https://i.pravatar.cc/40';

function TopHeader({ onMenuClick, isOpen }) {
  const [now, setNow] = useState(new Date());
  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('app-name') || 'SmartBoxing';
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
    
    window.addEventListener('appNameChanged', handleAppNameChange);
    return () => window.removeEventListener('appNameChanged', handleAppNameChange);
  }, []);

  const formattedDate = now.toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('es-CL');

  const handleLogout = () => {
    // Limpiar tokens locales
    logout();
    // Redirigir a Cognito logout para limpiar sesión del Hosted UI
    window.location.href = logoutUrl();
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
          <h1 className="header-title">{appName}</h1>
        </div>
        
        <div className="header-center" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>{formattedDate}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.2em', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {formattedTime}
          </div>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={userAvatar} alt="User Avatar" style={{ borderRadius: '50%', marginRight: '10px' }} />
          <span style={{ marginRight: '10px', color: 'var(--text-primary)' }}>{user?.name || 'Usuario'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
export default TopHeader;