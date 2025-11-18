import { z } from 'zod';

export const BoxId = z.string().min(1);
export const TenantId = z.string().min(1);

export const BoxInput = z.object({
  id: z.string().min(1).regex(/^\d+$/, 'Usa solo números (001, 002, ...)'),         // BOX#A1
  nombre: z.string().min(1),       // "Box A1"
  pasillo: z.string().optional(),// "A" | "B" etc.
  estado: z.enum(['disponible','ocupado','mantenimiento']).default('disponible')
});

export const CreateBoxSchema = z.object({
  tenantId: TenantId,
  box: BoxInput
});

export const UpdateBoxSchema = z.object({
  tenantId: TenantId,
  id: BoxId,
  patch: z.object({
    nombre: z.string().min(1).optional(),
    pasillo: z.string().optional(),
    estado: z.enum(['disponible','ocupado','mantenimiento']).optional()
  }).refine(obj => Object.keys(obj).length > 0, 'No hay cambios')
});
