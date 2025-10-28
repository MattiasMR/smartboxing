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
  welcomeMessage: z.string().max(200).optional(),
  tagline: z.string().max(100).optional(),
});

// Schema completo de configuración del cliente
export const ClientSettingsSchema = z.object({
  tenantId: z.string(),
  theme: ClientThemeSchema.optional(),
  texts: ClientTextsSchema.optional(),
  branding: z.object({
    companyName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
  }).optional(),
  updatedAt: z.string().optional(),
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
  branding: z.object({
    companyName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
  }).optional(),
});

// Schema para actualización parcial de usuario
export const UpdateUserSettingsSchema = z.object({
  preferences: UserPreferencesSchema.optional(),
});
