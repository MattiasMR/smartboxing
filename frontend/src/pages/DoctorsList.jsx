import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Link } from 'react-router-dom';
import { FaPlus, FaSpinner, FaSearch } from 'react-icons/fa';
import DoctorCard from '../components/doctors/DoctorCard.jsx';
import './DoctorsList.css';

const fetchStaff = async () => (await api.get('/staff')).data.items;
const removeStaff = async (id) => api.delete(`/staff/${id}`);

export default function DoctorsList() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['staff'], queryFn: fetchStaff });
  const [search, setSearch] = useState('');
  const del = useMutation({ 
    mutationFn: removeStaff, 
    onSuccess: () => qc.invalidateQueries(['staff']) 
  });

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;

    return data.filter((member) => {
      const haystack = [member.id, member.nombre, member.especialidad]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return haystack.some((value) => value.includes(term));
    });
  }, [data, search]);

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este miembro del staff?')) {
      del.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Cargando staff...</p>
      </div>
    );
  }

  return (
    <div className="doctors-list-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Staff</h1>
          <p className="page-subtitle">Gestiona el equipo operativo de tu organización</p>
        </div>
        <Link to="/staff/new" className="btn-primary">
          <FaPlus /> Nuevo Staff
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <p>No hay miembros de staff registrados</p>
          <Link to="/staff/new" className="btn-primary">
            <FaPlus /> Agregar primer miembro
          </Link>
        </div>
      ) : (
        <>
          <div className="list-toolbar">
            <div className="search-input-wrapper">
              <FaSearch />
              <input
                type="search"
                placeholder="Buscar por ID, nombre o cargo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="empty-state">
              <p>No encontramos miembros que coincidan con “{search}”.</p>
            </div>
          ) : (
            <div className="doctors-grid">
              {filteredStaff.map(doctor => (
                <DoctorCard key={doctor.id} doctor={doctor} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
