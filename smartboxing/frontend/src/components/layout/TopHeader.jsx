// src/components/layout/TopHeader.jsx
import React, { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import { useCognitoAuth } from '../../context/CognitoAuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/hospital-logo.png';
import './TopHeader.css';

const userAvatar = 'https://i.pravatar.cc/40';

function TopHeader({ onMenuClick, isOpen }) {
  const [now, setNow] = useState(new Date());
  const { logout, user } = useCognitoAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formattedDate = now.toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('es-CL');

  const handleLogout = () => {
    logout();
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    console.log('Menu button clicked, isOpen:', isOpen); // Para debug
    onMenuClick();
  };

  const handleMenuTouch = (e) => {
    // Para eventos táctiles, no usamos preventDefault para evitar el warning
    e.stopPropagation();
    console.log('Menu button touched, isOpen:', isOpen); // Para debug
    onMenuClick();
  };

  return (
    <header className="top-header">
      <div className="top-header-content">
        <div className="header-left">
          <button
            className="hamburger-btn"
            onClick={handleMenuClick}
            onMouseDown={handleMenuClick} // Para herramientas de desarrollador
            onTouchStart={handleMenuTouch} // Manejador separado sin preventDefault
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            type="button"
          >
            <FaBars />
          </button>
          <img src={logo} alt="Hospital Logo" className="header-logo" />
        </div>
        
        <div className="header-center" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9em', color: '#555' }}>{formattedDate}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.2em', fontWeight: 'bold' }}>
            {formattedTime}
          </div>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={userAvatar} alt="User Avatar" style={{ borderRadius: '50%', marginRight: '10px' }} />
          <button onClick={handleLogout} className="logout-btn">
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
export default TopHeader;