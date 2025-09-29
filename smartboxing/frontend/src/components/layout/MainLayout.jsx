// src/components/layout/MainLayout.jsx
import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';
import './MainLayout.css';

function MainLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  const handleMenuClick = useCallback(() => {
    setIsMobileNavOpen(prev => !prev);
  }, []);

  const handleCloseNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const getContentStyle = () => {
    // Removed background image for boxes dashboard
    return {};
  };

  return (
    <div className="main-layout-root-container">
      <TopHeader 
        onMenuClick={handleMenuClick} 
        isOpen={isMobileNavOpen} 
      />
      <div className="app-layout">
        <Sidebar isOpen={isMobileNavOpen} onClose={handleCloseNav} />
        <main className="main-content" style={getContentStyle()}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default MainLayout;