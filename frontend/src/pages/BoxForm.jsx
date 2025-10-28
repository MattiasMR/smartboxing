import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import './Forms.css';

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

  console.log('[BoxForm] Mode:', isEdit ? 'EDIT' : 'CREATE', 'ID:', id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
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

  const createMut = useMutation({
    mutationFn: async (values) => api.post('/boxes', { box: values }),
    onSuccess: () => { qc.invalidateQueries(['boxes']); nav('/boxes'); }
  });

  const updateMut = useMutation({
    mutationFn: async (values) => api.put(`/boxes/${encodeURIComponent(id)}`, { patch: values }),
    onSuccess: () => { qc.invalidateQueries(['boxes']); nav('/boxes'); }
  });

  const onSubmit = (values) => (isEdit ? updateMut.mutate(values) : createMut.mutate(values));
  const isSubmitting = createMut.isPending || updateMut.isPending;

  if (loadingBox) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">{isEdit ? 'Editar Box' : 'Nuevo Box'}</h1>
          <p className="form-subtitle">
            {isEdit ? 'Modifica los datos del box' : 'Completa la información del nuevo box'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="box-id" className="form-label">
                ID del Box <span className="required">*</span>
              </label>
              <input 
                id="box-id"
                {...register('id')} 
                disabled={isEdit}
                className={`form-input ${errors.id ? 'error' : ''}`}
                placeholder="Ej: BOX-001"
                title={isEdit ? 'El ID no se puede modificar' : ''}
              />
              {isEdit && <span className="form-hint">El ID no se puede modificar en modo edición</span>}
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
                Pasillo
              </label>
              <input 
                id="box-pasillo"
                {...register('pasillo')}
                className="form-input"
                placeholder="Ej: Pasillo A"
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
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><FaSpinner className="spinner-small" /> Guardando...</>
              ) : (
                <><FaSave /> {isEdit ? 'Guardar Cambios' : 'Crear Box'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
