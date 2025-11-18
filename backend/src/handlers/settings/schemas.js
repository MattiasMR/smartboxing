import { z } from 'zod';

// Schema para tema/colores del cliente
export const ClientThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  darkMode: z.boolean().optional(),
  logoUrl: z.string().url().optional(),
  backgroundUrl: z.string().url().optional(),
});

// Schema para textos personalizados del cliente
export const ClientTextsSchema = z.object({
  appName: z.string().min(1).max(50).optional(),
  institutionName: z.string().min(1).max(100).optional(),
  welcomeMessage: z.string().max(200).optional(),
  tagline: z.string().max(100).optional(),
});

// Schema para configuración de horarios
export const ScheduleConfigSchema = z.object({
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  slotDuration: z.number().int().min(5).max(240).optional(), // en minutos (5-240)
  workDays: z.array(z.number().int().min(0).max(6)).optional(), // 0=Domingo, 6=Sábado
});

// Schema para opciones operacionales
export const OperationalSettingsSchema = z.object({
  allowOverlapping: z.boolean().optional(),
  requirePatientConfirmation: z.boolean().optional(),
  sendReminders: z.boolean().optional(),
  reminderHoursBefore: z.number().int().min(1).max(72).optional(),
  maxAppointmentsPerDay: z.number().int().min(1).max(100).optional(),
  enableWaitingList: z.boolean().optional(),
});

// Schema completo de configuración del cliente
export const ClientSettingsSchema = z.object({
  tenantId: z.string(),
  theme: ClientThemeSchema.optional(),
  texts: ClientTextsSchema.optional(),
  schedule: ScheduleConfigSchema.optional(),
  operational: OperationalSettingsSchema.optional(),
  branding: z.object({
    companyName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
  }).optional(),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional(),
});

// Schema para preferencias del usuario
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.enum(['es', 'en']).optional(),
  notifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  dashboardLayout: z.string().optional(),
});

// Schema completo de configuración del usuario
export const UserSettingsSchema = z.object({
  tenantId: z.string(),
  userSub: z.string(),
  preferences: UserPreferencesSchema.optional(),
  updatedAt: z.string().optional(),
});

// Schema para actualización parcial de cliente
export const UpdateClientSettingsSchema = z.object({
  theme: ClientThemeSchema.optional(),
  texts: ClientTextsSchema.optional(),
  schedule: ScheduleConfigSchema.optional(),
  operational: OperationalSettingsSchema.optional(),
  branding: z.object({
    companyName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
  }).optional(),
});

// Schema para actualización parcial de usuario
export const UpdateUserSettingsSchema = z.object({
  preferences: UserPreferencesSchema.optional(),
});
