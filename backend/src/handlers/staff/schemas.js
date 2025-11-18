import { z } from 'zod';

export const StaffInput = z.object({
  id: z.string().min(1).regex(/^\d+$/, 'Usa solo números (001, 002, ...)'),
  nombre: z.string().min(1),
  especialidad: z.string().optional(),
  estado: z.enum(['activo','inactivo']).default('activo'),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
});
