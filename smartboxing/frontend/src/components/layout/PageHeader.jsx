// src/components/layout/PageHeader.jsx
import { FaFilter } from 'react-icons/fa';
import BackButton from '../navigation/BackButton';
import './PageHeader.css'; // Import the CSS file

// We add `showControls = true` to make the controls visible by default
function PageHeader({ 
  title, 
  onFilterClick, 
  showControls = false, 
  searchTerm,
  onSearchTermChange,
  searchPlaceholder = "Buscar...",
  showSearchBox = false // Nueva prop para controlar la visibilidad del buscador
}) {
  return (
    <div className="page-header-container">
      <BackButton />
      {/* Use className to apply styles from PageHeader.css */}
      <div className="page-header">
        <h1 className="page-header-title">{title}</h1>
        
        {/* This section will now only render if showControls or showSearchBox is true */}
        {(showControls || showSearchBox) && (
          <div className="page-header-controls">
            {/* This div and input will render if showSearchBox is true */}
            {showSearchBox && (
              <div className="search-box-container-header">
                {/* <label htmlFor="pageHeaderSearchInput" className="search-box-label-header">Buscar:</label> */}
                <input 
                  type="text"
                  id="pageHeaderSearchInput"
                  className="search-box-input-header"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={onSearchTermChange}
                />
              </div>
            )}
            {/* This button will render if showControls is true */}
            {showControls && (
              <button onClick={onFilterClick} className="page-header-filter-button">
                <FaFilter />
                Filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;