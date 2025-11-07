import { z } from 'zod';

export const PatientInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(1, 'Phone is required'),
  dateOfBirth: z.string().optional(), // ISO date string
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.array(z.string()).optional().default([]),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  insurance: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PatientUpdate = PatientInput.partial().omit({ id: true, createdAt: true });
