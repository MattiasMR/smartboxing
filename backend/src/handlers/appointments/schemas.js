import { z } from 'zod';

const StaffIdFields = z.object({
  idStaff: z.string().min(1).optional(),
  staffId: z.string().min(1).optional(),
  idDoctor: z.string().min(1).optional(),
  doctorId: z.string().min(1).optional()
});

export const AppointmentStatus = z.enum([
  'scheduled',
  'confirmed',
  'in-progress',
  'completed',
  'cancelled',
  'no-show'
]);

const BaseAppointment = z.object({
  id: z.string().min(1),
  idBox: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  status: AppointmentStatus.optional()
});

export const AppointmentInput = BaseAppointment.merge(StaffIdFields)
  .superRefine((value, ctx) => {
    if (!extractStaffId(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes indicar idStaff',
        path: ['idStaff']
      });
    }
  })
  .transform((value) => {
    const idStaff = extractStaffId(value);
    return {
      id: value.id,
      idBox: value.idBox,
      idStaff,
      startAt: value.startAt,
      endAt: value.endAt,
      status: value.status ?? 'scheduled'
    };
  });

export const normalizeStaffFields = (payload = {}) => {
  const idStaff = extractStaffId(payload);
  const sanitized = { ...payload };
  if (idStaff) {
    sanitized.idStaff = idStaff;
  }
  delete sanitized.staffId;
  delete sanitized.idDoctor;
  delete sanitized.doctorId;
  return sanitized;
};

export const withLegacyDoctorFields = (appointment = {}) => {
  if (!appointment) return appointment;
  const idStaff = extractStaffId(appointment);
  if (!idStaff) return appointment;
  return {
    ...appointment,
    idStaff,
    idDoctor: idStaff,
    doctorId: idStaff
  };
};

function extractStaffId(payload = {}) {
  return payload.idStaff || payload.staffId || payload.idDoctor || payload.doctorId || null;
}
