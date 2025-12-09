import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Link } from 'react-router-dom';
import { FaPlus, FaSpinner, FaSearch } from 'react-icons/fa';
import BoxCard from '../components/boxes/BoxCard.jsx';
import { useVocabulary, formatPlural } from '../hooks/useVocabulary.js';
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
  const [search, setSearch] = useState('');
  const vocab = useVocabulary();
  const resourceSingular = vocab.resource;
  const resourcePlural = formatPlural(vocab.resource);
  const referenceLabel = vocab.reference || 'Referencia';
  const mutation = useMutation({ 
    mutationFn: deleteBox, 
    onSuccess: () => qc.invalidateQueries(['boxes']) 
  });

  const filteredBoxes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;

    return data.filter((box) => {
      const haystack = [box.id, box.nombre, box.pasillo]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return haystack.some((value) => value.includes(term));
    });
  }, [data, search]);

  const handleDelete = (id) => {
    if (window.confirm(`¿Estás seguro de eliminar este ${resourceSingular.toLowerCase()}?`)) {
      mutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Cargando {resourcePlural.toLowerCase()}...</p>
      </div>
    );
  }

  return (
    <div className="boxes-list-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">{resourcePlural}</h1>
          <p className="page-subtitle">Gestiona tus {resourcePlural.toLowerCase()} y sus {formatPlural(referenceLabel).toLowerCase()}</p>
        </div>
        <Link to="/boxes/new" className="btn-primary">
          <FaPlus /> Nuevo {resourceSingular.toLowerCase()}
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <p>No hay {resourcePlural.toLowerCase()} registrados</p>
          <Link to="/boxes/new" className="btn-primary">
            <FaPlus /> Crear primer {resourceSingular.toLowerCase()}
          </Link>
        </div>
      ) : (
        <>
          <div className="list-toolbar">
            <div className="search-input-wrapper">
              <FaSearch />
              <input
                type="search"
                placeholder={`Buscar por ID, nombre o ${referenceLabel.toLowerCase()}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {filteredBoxes.length === 0 ? (
            <div className="empty-state">
              <p>No encontramos {resourcePlural.toLowerCase()} que coincidan con {search}.</p>
            </div>
          ) : (
            <div className="boxes-grid">
              {filteredBoxes.map(box => (
                <BoxCard key={box.id} box={box} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
