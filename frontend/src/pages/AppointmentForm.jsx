import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import './Forms.css';
import { nextSequentialId } from '../utils/idHelpers.js';

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
  idBox: z.string().min(1, 'El Box es requerido'),
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
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AppointmentForm() {
  const { id: idParam } = useParams();
  const id = idParam ? decodeURIComponent(idParam) : null;
  const isEdit = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { register, handleSubmit, setValue, setError, clearErrors, formState: { errors } } = useForm({
    resolver: zodResolver(ApptSchema),
    defaultValues: { id: '', idBox: '', idStaff: '', status: 'scheduled', startAt: '', endAt: '' }
  });

  const { isLoading: loadingAppt } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/${encodeURIComponent(id)}`);
      setValue('id', data.id);
      setValue('idBox', data.idBox);
      setValue('idStaff', data.idStaff ?? data.idDoctor ?? '');
      setValue('status', data.status || 'scheduled');
      setValue('startAt', fromIsoToLocal(data.startAt));
      setValue('endAt', fromIsoToLocal(data.endAt));
      return data;
    },
    enabled: isEdit,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000
  });

  const { data: boxes = [], isLoading: loadingBoxes } = useQuery({
    queryKey: ['boxes'],
    queryFn: async () => (await api.get('/boxes')).data.items,
    staleTime: 60 * 1000
  });

  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/staff')).data.items,
    staleTime: 60 * 1000
  });

  const { data: appointments = [], isLoading: loadingAppointmentList } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: async () => (await api.get('/appointments')).data.items,
    staleTime: 30 * 1000
  });

  const autoId = useMemo(() => (
    !isEdit && appointments ? nextSequentialId(appointments) : null
  ), [appointments, isEdit]);

  useEffect(() => {
    if (!isEdit && autoId) {
      setValue('id', autoId, { shouldValidate: true });
    }
  }, [autoId, isEdit, setValue]);

  const detectConflicts = (values) => {
    let conflict = false;
    let boxConflictReported = false;
    let staffConflictReported = false;
    const start = new Date(values.startAt);
    const end = new Date(values.endAt);

    for (const current of appointments || []) {
      if (!current.startAt || !current.endAt) continue;
      if (isEdit && current.id === id) continue;

      const currentStart = new Date(current.startAt);
      const currentEnd = new Date(current.endAt);
      const overlaps = start < currentEnd && end > currentStart;
      if (!overlaps) continue;

      if (!boxConflictReported && current.idBox === values.idBox) {
        setError('idBox', {
          type: 'manual',
          message: `El box ${values.idBox} ya está asignado en ese horario.`
        });
        boxConflictReported = true;
        conflict = true;
      }

      const staffId = current.idStaff ?? current.idDoctor;
      if (!staffConflictReported && staffId === values.idStaff) {
        setError('idStaff', {
          type: 'manual',
          message: `El staff ${values.idStaff} ya tiene una cita en ese horario.`
        });
        staffConflictReported = true;
        conflict = true;
      }
    }

    return conflict;
  };

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

  const onSubmit = (values) => {
    clearErrors(['idBox', 'idStaff']);

    if (!isEdit && !values.id) {
      setError('id', { type: 'manual', message: 'No pudimos generar un ID automático. Recarga e intenta nuevamente.' });
      return;
    }

    if (detectConflicts(values)) {
      return;
    }

    if (isEdit) {
      updateMut.mutate(values);
      return;
    }

    createMut.mutate(values);
  };
  const isSubmitting = createMut.isPending || updateMut.isPending;
  const isFormLoading = loadingAppt || loadingBoxes || loadingStaff || loadingAppointmentList;
  const disableSubmit = isSubmitting || loadingBoxes || loadingStaff || loadingAppointmentList || (!isEdit && !autoId);

  if (isFormLoading) {
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
            {isEdit ? 'Modifica los datos de la cita' : 'Programa una nueva asignación de staff'}
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
                readOnly
                className={`form-input ${errors.id ? 'error' : ''}`}
                placeholder="Auto"
                title="El ID se genera automáticamente"
              />
              <span className="form-hint">Los IDs se asignan automáticamente y no se pueden editar.</span>
              {errors.id && <span className="error-message">{errors.id.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="appt-status" className="form-label">
                Estado <span className="required">*</span>
              </label>
              <select
                id="appt-status"
                {...register('status')}
                className={`form-select ${errors.status ? 'error' : ''}`}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {statusLabels[option]}
                  </option>
                ))}
              </select>
              {errors.status && <span className="error-message">{errors.status.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appt-box" className="form-label">
                Box <span className="required">*</span>
              </label>
              <select
                id="appt-box"
                {...register('idBox')}
                className={`form-select ${errors.idBox ? 'error' : ''}`}
              >
                <option value="">Selecciona un box</option>
                {boxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    {`Box ${box.id} - ${box.nombre || 'Sin nombre'}${box.pasillo ? ` · Pasillo ${box.pasillo}` : ''}`}
                  </option>
                ))}
              </select>
              {errors.idBox && <span className="error-message">{errors.idBox.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="appt-staff" className="form-label">
                Staff asignado <span className="required">*</span>
              </label>
              <select
                id="appt-staff"
                {...register('idStaff')}
                className={`form-select ${errors.idStaff ? 'error' : ''}`}
              >
                <option value="">Selecciona un miembro del staff</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {`${member.nombre || 'Sin nombre'} - ID ${member.id}${member.especialidad ? ` · ${member.especialidad}` : ''}`}
                  </option>
                ))}
              </select>
              {errors.idStaff && <span className="error-message">{errors.idStaff.message}</span>}
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
            <button type="submit" className="btn-primary" disabled={disableSubmit}>
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
