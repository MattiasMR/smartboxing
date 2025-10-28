import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Link } from 'react-router-dom';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import BoxCard from '../components/boxes/BoxCard.jsx';
import './BoxesList.css';

async function fetchBoxes() {
  const { data } = await api.get('/boxes');
  return data.items;
}

async function deleteBox(id) {
  await api.delete(`/boxes/${id}`);
}

export default function BoxesList() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['boxes'], queryFn: fetchBoxes });
  const mutation = useMutation({ 
    mutationFn: deleteBox, 
    onSuccess: () => qc.invalidateQueries(['boxes']) 
  });

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este box?')) {
      mutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Cargando boxes...</p>
      </div>
    );
  }

  return (
    <div className="boxes-list-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Boxes</h1>
          <p className="page-subtitle">Gestiona los boxes de tu clínica</p>
        </div>
        <Link to="/boxes/new" className="btn-primary">
          <FaPlus /> Nuevo Box
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <p>No hay boxes registrados</p>
          <Link to="/boxes/new" className="btn-primary">
            <FaPlus /> Crear primer box
          </Link>
        </div>
      ) : (
        <div className="boxes-grid">
          {data.map(box => (
            <BoxCard key={box.id} box={box} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
