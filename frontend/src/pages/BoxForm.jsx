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

  console.log('[BoxForm] Mode:', isEdit ? 'EDIT' : 'CREATE', 'ID:', id);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(BoxSchema),
    defaultValues: { id: '', nombre: '', pasillo: '', estado: 'disponible' }
  });

  const { isLoading: loadingBox } = useQuery({
    queryKey: ['box', id],
    queryFn: async () => {
      console.log('[BoxForm] Fetching box data for ID:', id);
      const startTime = Date.now();
      const { data } = await api.get(`/boxes/${encodeURIComponent(id)}`);
      console.log('[BoxForm] Box data fetched in', Date.now() - startTime, 'ms');
      reset(data);
      return data;
    },
    enabled: isEdit,
    retry: 1, // Solo 1 reintento en caso de error
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000 // 10 minutos
  });

  const { data: allBoxes = [] } = useQuery({
    queryKey: ['boxes', 'all'],
    queryFn: async () => (await api.get('/boxes')).data.items,
    enabled: !isEdit,
    staleTime: 60 * 1000
  });

  const autoId = useMemo(() => (
    !isEdit && allBoxes ? nextSequentialId(allBoxes) : null
  ), [allBoxes, isEdit]);

  useEffect(() => {
    if (!isEdit && autoId) {
      setValue('id', autoId, { shouldValidate: true });
    }
  }, [autoId, isEdit, setValue]);

  const showFeedback = (type, message) => setFeedback({ type, message });
  const clearFeedback = () => setFeedback(null);
  const handleSuccessNavigation = () => {
    setTimeout(() => nav('/boxes'), 900);
  };
  const getErrorMessage = (error, fallback) => (
    error?.response?.data?.message || fallback
  );

  const createMut = useMutation({
    mutationFn: async (values) => api.post('/boxes', { box: values }),
    onSuccess: () => {
      qc.invalidateQueries(['boxes']);
      showFeedback('success', '✅ Recurso agendable creado correctamente');
      handleSuccessNavigation();
    },
    onError: (error) => {
      showFeedback('error', getErrorMessage(error, 'No pudimos crear el recurso agendable. Intenta nuevamente.'));
    }
  });

  const updateMut = useMutation({
    mutationFn: async (values) => api.put(`/boxes/${encodeURIComponent(id)}`, { patch: values }),
    onSuccess: () => {
      qc.invalidateQueries(['boxes']);
      showFeedback('success', '✅ Cambios guardados');
      handleSuccessNavigation();
    },
    onError: (error) => {
      showFeedback('error', getErrorMessage(error, 'No pudimos guardar los cambios. Revisa los datos del recurso agendable.'));
    }
  });

  const onSubmit = (values) => {
    clearFeedback();
    if (!isEdit && !values.id) {
      showFeedback('error', 'No pudimos generar un ID automático. Refresca e inténtalo nuevamente.');
      return;
    }

    if (isEdit) {
      updateMut.mutate(values);
      return;
    }

    createMut.mutate(values);
  };
  const isSubmitting = createMut.isPending || updateMut.isPending;
  const disableSubmit = isSubmitting || (!isEdit && !autoId);

  if (loadingBox) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Cargando recurso agendable...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">{isEdit ? 'Editar recurso agendable' : 'Nuevo recurso agendable'}</h1>
          <p className="form-subtitle">
            {isEdit ? 'Modifica los datos del recurso agendable' : 'Completa la información del nuevo recurso agendable'}
          </p>
        </div>

        {feedback && (
          <div className={`form-feedback form-feedback--${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="box-id" className="form-label">
                ID del recurso agendable <span className="required">*</span>
              </label>
              <input 
                id="box-id"
                {...register('id')} 
                readOnly
                className={`form-input ${errors.id ? 'error' : ''}`}
                placeholder="Ej: 001"
                title="El ID se asigna automáticamente"
              />
              <span className="form-hint">El ID se genera automáticamente y no se puede cambiar.</span>
              {errors.id && <span className="error-message">{errors.id.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="box-name" className="form-label">
                Nombre <span className="required">*</span>
              </label>
              <input 
                id="box-name"
                {...register('nombre')}
                className={`form-input ${errors.nombre ? 'error' : ''}`}
                placeholder="Ej: Consultorio 1"
              />
              {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="box-pasillo" className="form-label">
                Referencia
              </label>
              <input 
                id="box-pasillo"
                {...register('pasillo')}
                className="form-input"
                placeholder="Ej: Referencia A"
              />
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

          <div className="form-actions">
            <Link to="/boxes" className="btn-secondary">
              <FaTimes /> Cancelar
            </Link>
            <button type="submit" className="btn-primary" disabled={disableSubmit}>
              {isSubmitting ? (
                <><FaSpinner className="spinner-small" /> Guardando...</>
              ) : (
                <><FaSave /> {isEdit ? 'Guardar Cambios' : 'Crear recurso agendable'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
