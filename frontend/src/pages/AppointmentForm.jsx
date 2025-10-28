import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import './Forms.css';

const ApptSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  idBox: z.string().min(1, 'El Box es requerido'),
  idDoctor: z.string().min(1, 'El Doctor es requerido'),
  startAt: z.string().min(1, 'La fecha de inicio es requerida'),
  endAt: z.string().min(1, 'La fecha de término es requerida')
});

const toIso = (dtLocal) => {
  if (!dtLocal) return '';
  return new Date(dtLocal).toISOString();
};

const fromIsoToLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AppointmentForm() {
  const { id: idParam } = useParams();
  const id = idParam ? decodeURIComponent(idParam) : null;
  const isEdit = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(ApptSchema),
    defaultValues: { id: '', idBox: '', idDoctor: '', startAt: '', endAt: '' }
  });

  const { isLoading: loadingAppt } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/${encodeURIComponent(id)}`);
      setValue('id', data.id);
      setValue('idBox', data.idBox);
      setValue('idDoctor', data.idDoctor);
      setValue('startAt', fromIsoToLocal(data.startAt));
      setValue('endAt', fromIsoToLocal(data.endAt));
      return data;
    },
    enabled: isEdit,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000
  });

  const createMut = useMutation({
    mutationFn: async (values) => {
      const payload = { ...values, startAt: toIso(values.startAt), endAt: toIso(values.endAt) };
      return api.post('/appointments', { appointment: payload });
    },
    onSuccess: () => { qc.invalidateQueries(['appointments']); nav('/appointments'); }
  });

  const updateMut = useMutation({
    mutationFn: async (values) => {
      const payload = { ...values, startAt: toIso(values.startAt), endAt: toIso(values.endAt) };
      return api.put(`/appointments/${encodeURIComponent(id)}`, { patch: payload });
    },
    onSuccess: () => { qc.invalidateQueries(['appointments']); nav('/appointments'); }
  });

  const onSubmit = (values) => (isEdit ? updateMut.mutate(values) : createMut.mutate(values));
  const isSubmitting = createMut.isPending || updateMut.isPending;

  if (loadingAppt) {
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
          <h1 className="form-title">{isEdit ? 'Editar Cita' : 'Nueva Cita'}</h1>
          <p className="form-subtitle">
            {isEdit ? 'Modifica los datos de la cita' : 'Programa una nueva cita médica'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appt-id" className="form-label">
                ID de la Cita <span className="required">*</span>
              </label>
              <input 
                id="appt-id"
                {...register('id')} 
                disabled={isEdit}
                className={`form-input ${errors.id ? 'error' : ''}`}
                placeholder="Ej: APPT-001"
              />
              {errors.id && <span className="error-message">{errors.id.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appt-box" className="form-label">
                Box <span className="required">*</span>
              </label>
              <input 
                id="appt-box"
                {...register('idBox')}
                className={`form-input ${errors.idBox ? 'error' : ''}`}
                placeholder="Ej: BOX-001"
              />
              {errors.idBox && <span className="error-message">{errors.idBox.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="appt-doctor" className="form-label">
                Doctor <span className="required">*</span>
              </label>
              <input 
                id="appt-doctor"
                {...register('idDoctor')}
                className={`form-input ${errors.idDoctor ? 'error' : ''}`}
                placeholder="Ej: DOC-001"
              />
              {errors.idDoctor && <span className="error-message">{errors.idDoctor.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appt-start" className="form-label">
                Fecha y Hora de Inicio <span className="required">*</span>
              </label>
              <input 
                id="appt-start"
                type="datetime-local" 
                {...register('startAt')}
                className={`form-input ${errors.startAt ? 'error' : ''}`}
              />
              {errors.startAt && <span className="error-message">{errors.startAt.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="appt-end" className="form-label">
                Fecha y Hora de Término <span className="required">*</span>
              </label>
              <input 
                id="appt-end"
                type="datetime-local" 
                {...register('endAt')}
                className={`form-input ${errors.endAt ? 'error' : ''}`}
              />
              {errors.endAt && <span className="error-message">{errors.endAt.message}</span>}
            </div>
          </div>

          <div className="form-actions">
            <Link to="/appointments" className="btn-secondary">
              <FaTimes /> Cancelar
            </Link>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><FaSpinner className="spinner-small" /> Guardando...</>
              ) : (
                <><FaSave /> {isEdit ? 'Guardar Cambios' : 'Crear Cita'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
