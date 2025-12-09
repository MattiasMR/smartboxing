import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import './Forms.css';
import { nextSequentialId } from '../utils/idHelpers.js';
import { useVocabulary } from '../hooks/useVocabulary.js';

const BoxSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  pasillo: z.string().optional(),
  estado: z.enum(['disponible','ocupado','mantenimiento']).default('disponible')
});

export default function BoxForm() {
  const { id: encodedId } = useParams();
  const id = encodedId ? decodeURIComponent(encodedId) : null;
  const isEdit = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const vocab = useVocabulary();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(BoxSchema),
    defaultValues: { id: '', nombre: '', pasillo: '', estado: 'disponible' }
  });

  const { isLoading: loadingBox } = useQuery({
    queryKey: ['box', id],
    queryFn: async () => {
      const { data } = await api.get(`/boxes/${encodeURIComponent(id)}`);
      reset(data);
      return data;
    },
    enabled: isEdit,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  const { data: allBoxes = [] } = useQuery({
    queryKey: ['boxes', 'all'],
    queryFn: async () => (await api.get('/boxes')).data.items,
    enabled: !isEdit,
    staleTime: 60 * 1000
  });

  const autoId = useMemo(() => (
    !isEdit && allBoxes ? nextSequentialId(allBoxes) : null
  ), [isEdit, allBoxes]);

  useEffect(() => {
    if (!isEdit && autoId) {
      setValue('id', autoId, { shouldValidate: true });
    }
  }, [autoId, isEdit, setValue]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      if (isEdit) {
        return api.put(`/boxes/${encodeURIComponent(id)}`, { box: values });
      }
      return api.post('/boxes', { box: values });
    },
    onSuccess: () => {
      qc.invalidateQueries(['boxes']);
      nav('/boxes');
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error.message || 'Error al guardar' });
    }
  });

  const onSubmit = (values) => {
    setFeedback(null);
    mutation.mutate(values);
  };

  if (loadingBox) {
    return (
      <div className="form-page">
        <div className="form-container">
          <div className="form-loading">
            <FaSpinner className="spinner" />
            <p>Cargando {vocab.resource.toLowerCase()}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">{isEdit ? `Editar ${vocab.resource}` : `Nuevo ${vocab.resource}`}</h1>
          <p className="form-subtitle">
            {isEdit ? `Modifica los datos del ${vocab.resource.toLowerCase()}` : `Completa la información del ${vocab.resource.toLowerCase()}`}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="box-id" className="form-label">
                ID del {vocab.resource} <span className="required">*</span>
              </label>
              <input 
                id="box-id"
                {...register('id')} 
                readOnly={!!autoId || isEdit}
                className={`form-input ${errors.id ? 'error' : ''}`}
                placeholder="Ej: 001"
                title="El ID se asigna automáticamente"
              />
              <span className="form-hint">El ID se genera automáticamente y no puede modificarse.</span>
              {errors.id && <span className="error-message">{errors.id.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="box-estado" className="form-label">
                Estado <span className="required">*</span>
              </label>
              <select 
                id="box-estado"
                {...register('estado')}
                className="form-select"
              >
                <option value="disponible">Disponible</option>
                <option value="ocupado">Ocupado</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="box-nombre" className="form-label">
                Nombre del {vocab.resource} <span className="required">*</span>
              </label>
              <input 
                id="box-nombre"
                {...register('nombre')}
                className={`form-input ${errors.nombre ? 'error' : ''}`}
                placeholder={`Ej: ${vocab.resource} principal`}
              />
              {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="box-pasillo" className="form-label">
                {vocab.reference}
              </label>
              <input 
                id="box-pasillo"
                {...register('pasillo')}
                className="form-input"
                placeholder={`Ej: ${vocab.reference} 2B`}
              />
            </div>
          </div>

          {feedback?.type === 'error' && (
            <div className="form-feedback error">
              {feedback.message}
            </div>
          )}

          <div className="form-actions">
            <Link to="/boxes" className="btn-secondary">
              <FaTimes /> Cancelar
            </Link>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <><FaSpinner className="spinner-small" /> Guardando...</>
              ) : (
                <><FaSave /> Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
