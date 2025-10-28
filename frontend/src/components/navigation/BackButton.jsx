// src/components/navigation/BackButton.jsx
import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigationHistory } from '../../hooks/useNavigationHistory';
import './BackButton.css';

const BackButton = () => {
  const { goBack, shouldShowBackButton, previousPageName } = useNavigationHistory();
  
  // Only render on detail pages when history exists
  if (!shouldShowBackButton) {
    return null;
  }
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('BackButton clicked');
    goBack();
  };
  
  return (
    <button 
      type="button"
      className="back-button" 
      onClick={handleClick}
      title={`Volver a ${previousPageName}`}
    >
      <FaArrowLeft />
      <span>Volver</span>
    </button>
  );
};

export default BackButton;
