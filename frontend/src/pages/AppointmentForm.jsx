import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { getClientSettings } from '../api/settings.js';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import './Forms.css';
import { useVocabulary, formatPlural } from '../hooks/useVocabulary.js';

const statusOptions = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
const statusLabels = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  'no-show': 'No asistió'
};

const ApptSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  idBox: z.string().min(1, 'El recurso agendable es requerido'),
  idStaff: z.string().min(1, 'El Staff es requerido'),
  status: z.enum(statusOptions).default('scheduled'),
  startAt: z.string().min(1, 'La fecha de inicio es requerida'),
  endAt: z.string().min(1, 'La fecha de término es requerida')
}).refine((values) => new Date(values.startAt) < new Date(values.endAt), {
  path: ['endAt'],
  message: 'La hora de término debe ser posterior a la de inicio'
});

const toIso = (dtLocal) => {
  if (!dtLocal) return '';
  return new Date(dtLocal).toISOString();
};

const fromIsoToLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
};

export default function AppointmentForm() {
  const vocab = useVocabulary();
  const reservationLabel = formatPlural(vocab.reservation);

  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const qc = useQueryClient();

  const isEdit = !!id;
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(ApptSchema),
    defaultValues: {
      status: 'scheduled',
      startAt: '',
      endAt: ''
    }
  });

  const { data: boxes = [] } = useQuery({ queryKey: ['boxes'], queryFn: async () => (await api.get('/boxes')).data.items });
  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: async () => (await api.get('/staff')).data.items });

  const { isLoading: loadingAppt } = useQuery({
    queryKey: ['appointments', id],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/${encodeURIComponent(id)}`);
      const appt = {
        ...data,
        startAt: fromIsoToLocal(data.startAt),
        endAt: fromIsoToLocal(data.endAt),
      };
      reset(appt); return appt;
    },
    enabled: isEdit,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: clientSettings } = useQuery({
    queryKey: ['client-settings'],
    queryFn: getClientSettings,
    staleTime: 5 * 60 * 1000
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        startAt: toIso(values.startAt),
        endAt: toIso(values.endAt),
      };
      if (isEdit) {
        return api.put(`/appointments/${encodeURIComponent(id)}`, { appointment: payload });
      }
      return api.post('/appointments', { appointment: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries(['appointments']);
      nav('/appointments');
    }
  });

  const isSubmitting = mutation.isPending;
  const disableSubmit = isSubmitting;

  const autoId = useMemo(() => {
    if (isEdit || !clientSettings) return null;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }, [isEdit, clientSettings]);

  useEffect(() => {
    if (!isEdit && autoId) {
      reset((prev) => ({ ...prev, id: autoId }));
    }
  }, [autoId, isEdit, reset]);

  if (loadingAppt) {
    return (
      <div className="form-page">
        <div className="form-container">
          <div className="form-loading">
            <FaSpinner className="spinner" />
            <p>Cargando {reservationLabel.toLowerCase()}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">{isEdit ? `Editar ${reservationLabel}` : `Nueva ${reservationLabel}`}</h1>
          <p className="form-subtitle">
            {isEdit
              ? `Actualiza los datos de la ${reservationLabel.toLowerCase()}`
              : `Completa los datos para crear una ${reservationLabel.toLowerCase()}`}
          </p>
        </div>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appt-id" className="form-label">
                ID de {reservationLabel} <span className="required">*</span>
              </label>
              <input
                id="appt-id"
                {...register('id')}
                className={`form-input ${errors.id ? 'error' : ''}`}
                placeholder="Ej: 0001"
                readOnly={!!autoId || isEdit}
              />
              {errors.id && <span className="error-message">{errors.id.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="appt-status" className="form-label">Estado</label>
              <select
                id="appt-status"
                {...register('status')}
                className="form-select"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{statusLabels[opt]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appt-box" className="form-label">
                {vocab.resource} <span className="required">*</span>
              </label>
              <select
                id="appt-box"
                {...register('idBox')}
                className={`form-select ${errors.idBox ? 'error' : ''}`}
              >
                <option value="">Selecciona {vocab.resource.toLowerCase()}</option>
                {boxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    {box.nombre || `${vocab.resource} ${box.id}`}
                  </option>
                ))}
              </select>
              {errors.idBox && <span className="error-message">{errors.idBox.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="appt-staff" className="form-label">
                {vocab.staff} <span className="required">*</span>
              </label>
              <select
                id="appt-staff"
                {...register('idStaff')}
                className={`form-select ${errors.idStaff ? 'error' : ''}`}
              >
                <option value="">Selecciona {vocab.staff.toLowerCase()}</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.nombre || `${vocab.staff} ${member.id}`}
                  </option>
                ))}
              </select>
              {errors.idStaff && <span className="error-message">{errors.idStaff.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appt-start" className="form-label">
                Inicio <span className="required">*</span>
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
                Fin <span className="required">*</span>
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
            <button type="submit" className="btn-primary" disabled={disableSubmit}>
              {isSubmitting ? (
                <><FaSpinner className="spinner-small" /> Guardando...</>
              ) : (
                <><FaSave /> Guardar {reservationLabel.toLowerCase()}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
