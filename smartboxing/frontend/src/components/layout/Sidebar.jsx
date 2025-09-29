// src/components/layout/Sidebar.jsx
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { FaHome, FaTh, FaChartBar, FaCalendarAlt, FaUserMd, FaTimes, FaBrain } from 'react-icons/fa'; // Added FaBrain

const mainNavItems = [
  { id: 'home', label: 'Home', icon: <FaHome />, path: '/' },
  { id: 'boxes', label: 'Boxes', icon: <FaTh />, path: '/boxes' },
  { id: 'doctors', label: 'Doctores', icon: <FaUserMd />, path: '/doctors' },
  { id: 'agenda', label: 'Agendas', icon: <FaCalendarAlt />, path: '/agenda' },
  { id: 'reports', label: 'Reportes', icon: <FaChartBar />, path: '/reports' },
  { id: 'analyst', label: 'Analista IA', icon: <FaBrain />, path: '/analista' }, // Added Analyst IA
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

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
      {mainNavItems.map(item => (
        <li key={item.id} className={location.pathname === item.path ? 'active' : ''}>
          <Link to={item.path} onClick={handleLinkClick}>
            {item.icon}
            <span className="nav-label" style={item.id === 'analyst' ? { color: '#df0b6f' } : {}}>{item.label}</span>
          </Link>
        </li>
      ))}
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