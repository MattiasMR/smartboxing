import { z } from 'zod';
export const DoctorInput = z.object({
  id: z.string().min(1),          // DOCTOR#123
  nombre: z.string().min(1),
  especialidad: z.string().optional(),
  estado: z.enum(['activo','inactivo']).default('activo')
});
