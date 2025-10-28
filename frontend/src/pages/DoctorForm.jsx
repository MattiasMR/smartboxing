import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import './Forms.css';

const DoctorSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  especialidad: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']).default('activo')
});

export default function DoctorForm() {
  const { id: encodedId } = useParams();
  const id = encodedId ? decodeURIComponent(encodedId) : null;
  const isEdit = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(DoctorSchema),
    defaultValues: { id: '', nombre: '', especialidad: '', estado: 'activo' }
  });

  const { isLoading: loadingDoctor } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const { data } = await api.get(`/doctors/${encodeURIComponent(id)}`);
      reset(data); return data;
    },
    enabled: isEdit,
    retry: 1, // Solo 1 reintento
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000
  });

  const createMut = useMutation({
    mutationFn: async (values) => api.post('/doctors', { doctor: values }),
    onSuccess: () => { qc.invalidateQueries(['doctors']); nav('/doctors'); }
  });

  const updateMut = useMutation({
    mutationFn: async (values) => api.put(`/doctors/${encodeURIComponent(id)}`, { patch: values }),
    onSuccess: () => { qc.invalidateQueries(['doctors']); nav('/doctors'); }
  });

  const onSubmit = (values) => (isEdit ? updateMut.mutate(values) : createMut.mutate(values));
  const isSubmitting = createMut.isPending || updateMut.isPending;

  if (loadingDoctor) {
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
          <h1 className="form-title">{isEdit ? 'Editar Doctor' : 'Nuevo Doctor'}</h1>
          <p className="form-subtitle">
            {isEdit ? 'Modifica los datos del doctor' : 'Completa la información del nuevo doctor'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="doctor-id" className="form-label">
                ID del Doctor <span className="required">*</span>
              </label>
              <input 
                id="doctor-id"
                {...register('id')} 
                disabled={isEdit}
                className={`form-input ${errors.id ? 'error' : ''}`}
                placeholder="Ej: DOC-001"
                title={isEdit ? 'El ID no se puede modificar' : ''}
              />
              {isEdit && <span className="form-hint">El ID no se puede modificar en modo edición</span>}
              {errors.id && <span className="error-message">{errors.id.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="doctor-estado" className="form-label">
                Estado <span className="required">*</span>
              </label>
              <select 
                id="doctor-estado"
                {...register('estado')}
                className="form-select"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="doctor-nombre" className="form-label">
                Nombre Completo <span className="required">*</span>
              </label>
              <input 
                id="doctor-nombre"
                {...register('nombre')}
                className={`form-input ${errors.nombre ? 'error' : ''}`}
                placeholder="Ej: Dr. Juan Pérez"
              />
              {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="doctor-especialidad" className="form-label">
                Especialidad
              </label>
              <input 
                id="doctor-especialidad"
                {...register('especialidad')}
                className="form-input"
                placeholder="Ej: Cardiología"
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/doctors" className="btn-secondary">
              <FaTimes /> Cancelar
            </Link>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><FaSpinner className="spinner-small" /> Guardando...</>
              ) : (
                <><FaSave /> {isEdit ? 'Guardar Cambios' : 'Crear Doctor'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
