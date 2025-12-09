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
import { useVocabulary } from '../hooks/useVocabulary.js';

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
  const vocab = useVocabulary();
  const roleLabel = vocab.role || 'Cargo';

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(DoctorSchema),
    defaultValues: { id: '', nombre: '', especialidad: '', estado: 'activo' }
  });

  const { isLoading: loadingDoctor } = useQuery({
    queryKey: ['staff', id],
    queryFn: async () => {
      const { data } = await api.get(`/staff/${encodeURIComponent(id)}`);
      reset(data); return data;
    },
    enabled: isEdit,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: async () => (await api.get('/staff')).data.items,
    enabled: !isEdit,
    staleTime: 60 * 1000
  });

  const autoId = useMemo(() => (
    !isEdit && staffList ? nextSequentialId(staffList) : null
  ), [isEdit, staffList]);

  useEffect(() => {
    if (!isEdit && autoId) {
      setValue('id', autoId, { shouldValidate: true });
    }
  }, [autoId, isEdit, setValue]);

  const createMut = useMutation({
    mutationFn: async (values) => api.post('/staff', { staff: values }),
    onSuccess: () => { qc.invalidateQueries(['staff']); nav('/staff'); }
  });

  const updateMut = useMutation({
    mutationFn: async (values) => api.put(`/staff/${encodeURIComponent(id)}`, { patch: values }),
    onSuccess: () => { qc.invalidateQueries(['staff']); nav('/staff'); }
  });

  const onSubmit = (values) => {
    if (isEdit) {
      updateMut.mutate(values);
      return;
    }

    if (!values.id) {
      return;
    }

    createMut.mutate(values);
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;
  const disableSubmit = isSubmitting;

  if (loadingDoctor) {
    return (
      <div className="form-page">
        <div className="form-container">
          <div className="form-loading">
            <FaSpinner className="spinner" />
            <p>Cargando {vocab.staff}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">{isEdit ? `Editar miembro del ${vocab.staff}` : `Nuevo miembro del ${vocab.staff}`}</h1>
          <p className="form-subtitle">
            {isEdit ? `Modifica los datos del ${vocab.staff}` : `Completa la información del nuevo miembro del ${vocab.staff}`}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="staff-id" className="form-label">
                ID del {vocab.staff} <span className="required">*</span>
              </label>
              <input 
                id="staff-id"
                {...register('id')} 
                readOnly
                className={`form-input ${errors.id ? 'error' : ''}`}
                placeholder="Ej: 001"
                title="El ID se asigna automáticamente"
              />
              <span className="form-hint">El ID se genera automáticamente y no puede modificarse.</span>
              {errors.id && <span className="error-message">{errors.id.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="staff-estado" className="form-label">
                Estado <span className="required">*</span>
              </label>
              <select 
                id="staff-estado"
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
              <label htmlFor="staff-nombre" className="form-label">
                Nombre completo <span className="required">*</span>
              </label>
              <input 
                id="staff-nombre"
                {...register('nombre')}
                className={`form-input ${errors.nombre ? 'error' : ''}`}
                placeholder="Ej: Ana Pérez"
              />
              {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="staff-especialidad" className="form-label">
                {roleLabel}
              </label>
              <input 
                id="staff-especialidad"
                {...register('especialidad')}
                className="form-input"
                placeholder="Ej: Coordinador clínico"
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/staff" className="btn-secondary">
              <FaTimes /> Cancelar
            </Link>
            <button type="submit" className="btn-primary" disabled={disableSubmit}>
              {isSubmitting ? (
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
