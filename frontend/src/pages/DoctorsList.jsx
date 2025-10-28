import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Link } from 'react-router-dom';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import DoctorCard from '../components/doctors/DoctorCard.jsx';
import './DoctorsList.css';

const fetchDoctors = async () => (await api.get('/doctors')).data.items;
const removeDoctor = async (id) => api.delete(`/doctors/${id}`);

export default function DoctorsList() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });
  const del = useMutation({ 
    mutationFn: removeDoctor, 
    onSuccess: () => qc.invalidateQueries(['doctors']) 
  });

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este doctor?')) {
      del.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Cargando doctores...</p>
      </div>
    );
  }

  return (
    <div className="doctors-list-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Doctores</h1>
          <p className="page-subtitle">Gestiona el equipo médico de tu clínica</p>
        </div>
        <Link to="/doctors/new" className="btn-primary">
          <FaPlus /> Nuevo Doctor
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <p>No hay doctores registrados</p>
          <Link to="/doctors/new" className="btn-primary">
            <FaPlus /> Agregar primer doctor
          </Link>
        </div>
      ) : (
        <div className="doctors-grid">
          {data.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
