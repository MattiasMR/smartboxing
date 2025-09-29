// src/components/boxes/DashboardFilters.jsx
import React, { useState } from 'react';
import './DashboardFilters.css';
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

function DashboardFilters({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onFilterClear,
  hallwayOptions
}) {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    status: true,
    occupancy: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  return (
    <div className={`filter-panel ${isOpen ? 'show' : ''}`}>
      <div className="filter-header">
        <h3>Filtros</h3>
        <button onClick={onClose} className="close-btn">
          <FaTimes />
        </button>
      </div>
      
      <div className="filter-body">
        <div className="filter-section">
          <div className="section-header" onClick={() => toggleSection('location')}>
            <span>Ubicación</span>
            {expandedSections.location ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {expandedSections.location && (
            <div className="section-content">
              <div className="form-group">
                <label htmlFor="hallway">Pasillo</label>
                <select 
                  id="hallway" 
                  name="hallway" 
                  value={filters.hallway} 
                  onChange={onFilterChange}
                >
                  <option value="">Todos</option>
                  {hallwayOptions.map(hall => <option key={hall} value={hall}>{hall}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="filter-section">
          <div className="section-header" onClick={() => toggleSection('status')}>
            <span>Estado</span>
            {expandedSections.status ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {expandedSections.status && (
            <div className="section-content">
              <div className="form-group">
                <label htmlFor="status">Estado</label>
                <select 
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={onFilterChange}
                >
                  <option value="">Todos</option>
                  <option value="FREE">Libre</option>
                  <option value="OCCUPIED">Ocupado</option>
                  <option value="DISABLED">Inhabilitado</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="filter-section">
          <div className="section-header" onClick={() => toggleSection('occupancy')}>
            <span>Ocupación</span>
            {expandedSections.occupancy ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {expandedSections.occupancy && (
            <div className="section-content">
              <div className="form-group">
                <label htmlFor="occupancyRange">Rango de Ocupación (%)</label>
                <select 
                  id="occupancyRange"
                  name="occupancyRange" 
                  value={filters.occupancyRange} 
                  onChange={onFilterChange}
                >
                  <option value="">Todos</option>
                  <option value="0-33">0 - 33%</option>
                  <option value="34-66">34 - 66%</option>
                  <option value="67-100">67 - 100%</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="filter-footer">
        <button className="clear-btn" onClick={onFilterClear}>Limpiar Filtros</button>
      </div>
    </div>
  );
}

export default DashboardFilters;