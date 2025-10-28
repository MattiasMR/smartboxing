import { z } from 'zod';
export const AppointmentInput = z.object({
  id: z.string().min(1),         // APPT#...
  idBox: z.string().min(1),
  idDoctor: z.string().min(1),
  startAt: z.string().min(1),    // ISO 8601 (ej. 2025-10-27T12:00:00Z)
  endAt: z.string().min(1)
});
