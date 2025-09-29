// src/hooks/useNavigationHistory.js
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useNavigationHistory = () => {
  const [history, setHistory] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const isNavigatingBack = useRef(false);
  
  // Define pages that should not show back button (main navigation pages)
  const mainPages = ['/', '/boxes', '/doctors', '/agenda', '/reports'];
  
  // Define pages that should always show back button (detail pages)
  const detailPages = ['/doctors/', '/boxes/'];
  
  useEffect(() => {
    // Skip if we're navigating back
    if (isNavigatingBack.current) {
      isNavigatingBack.current = false;
      return;
    }
    
    const currentPath = location.pathname;
    
    setHistory(prev => {
      // Don't add the same page twice in a row
      if (prev.length > 0 && prev[prev.length - 1] === currentPath) {
        return prev;
      }
      
      const newHistory = [...prev, currentPath];
      const finalHistory = newHistory.slice(-10); // Keep only last 10 pages
      
      console.log('History updated:', finalHistory);
      return finalHistory;
    });
  }, [location.pathname]);
  
  const goBack = () => {
    console.log('Go back clicked, history:', history);
    
    if (history.length >= 2) {
      // Get the previous page (second to last in history)
      const previousPage = history[history.length - 2];
      console.log('Going back to:', previousPage);
      
      // Remove current page from history
      setHistory(prev => prev.slice(0, -1));
      isNavigatingBack.current = true;
      
      navigate(previousPage);
    } else {
      console.log('No history, going to home');
      navigate('/');
    }
  };
  
  const shouldShowBackButton = () => {
    const currentPath = location.pathname;
    
    // Don't show on main pages
    if (mainPages.includes(currentPath)) {
      return false;
    }
    
    // Only show on detail pages
    const isDetailPage = detailPages.some(page => currentPath.startsWith(page));
    return isDetailPage && history.length >= 2;
  };
  
  const getPreviousPageName = () => {
    if (history.length >= 2) {
      const previousPath = history[history.length - 2];
      
      const pageNames = {
        '/': 'Resumen',
        '/boxes': 'Dashboard de Boxes',
        '/doctors': 'Directorio de Médicos',
        '/agenda': 'Agendas',
        '/reports': 'Analista IA'
      };
      
      if (previousPath.startsWith('/doctors/')) {
        return 'Directorio de Médicos';
      }
      if (previousPath.startsWith('/boxes/')) {
        return 'Dashboard de Boxes';
      }
      
      return pageNames[previousPath] || 'Página anterior';
    }
    return 'Resumen';
  };
  
  return {
    goBack,
    shouldShowBackButton: shouldShowBackButton(),
    previousPageName: getPreviousPageName(),
    history
  };
};
