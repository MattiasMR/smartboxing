// src/pages/DoctorsPage.jsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/layout/PageHeader';
import { fetchDoctors } from '../api/services';
import DoctorCard from '../components/doctors/DoctorCard';
import './DoctorsPage.css';

function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- LÓGICA REFACTORIZADA Y SIMPLIFICADA ---
  // Este useEffect ahora se activa cada vez que el término de búsqueda o el filtro de estado cambian.
  useEffect(() => {
    // Establecemos un delay para no hacer una llamada a la API en cada tecla que se presiona.
    const timerId = setTimeout(() => {
      setIsLoading(true);
      
      console.log('🔍 Fetching doctors with filters:', { search: searchTerm, status: statusFilter });
      
      // Since API doesn't support filtering, get all doctors and filter on frontend
      fetchDoctors()
        .then(res => {
          const allDoctors = res.data?.doctors || res.data || [];
          console.log(`✅ Got ${allDoctors.length} doctors from API`);
          
          // Apply filters on frontend
          let filteredDoctors = allDoctors;
          
          // Search filter
          if (searchTerm) {
            filteredDoctors = filteredDoctors.filter(doctor => 
              doctor.name && doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          // Status filter  
          if (statusFilter) {
            filteredDoctors = filteredDoctors.filter(doctor => 
              doctor.status === statusFilter
            );
          }
          
          console.log(`📋 Filtered to ${filteredDoctors.length} doctors`);
          setDoctors(filteredDoctors);
        })
        .catch(err => {
          console.error("Failed to fetch doctors:", err);
          setDoctors([]);
        })
        .finally(() => setIsLoading(false));

    }, 300); // Espera 300ms después de que el usuario deja de escribir/seleccionar.

    // Esta es una función de limpieza que cancela el timeout si el usuario sigue interactuando.
    return () => clearTimeout(timerId);
  }, [searchTerm, statusFilter]); // El array de dependencias que activa la búsqueda.

  return (
    <div className="doctors-page">
      <PageHeader title="Directorio de Médicos" />
      
      <div className="doctors-filters">
        <input 
          type="text" 
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          className="status-select"
        >
          <option value="">Todos los Estados</option>
          <option value="ON_DUTY">En Servicio</option>
          <option value="ACTIVE">Activo</option>
          <option value="ON_VACATION">De Vacaciones</option>
        </select>
      </div>

      <div className="doctors-grid">
        {isLoading ? (
          <div className="loading-message">Buscando doctores...</div>
        ) : doctors.length > 0 ? (
          doctors.map(doc => <DoctorCard key={doc.id} doctor={doc} />)
        ) : (
          <div className="no-results">No se encontraron doctores con los criterios seleccionados.</div>
        )}
      </div>
    </div>
  );
}

export default DoctorsPage;