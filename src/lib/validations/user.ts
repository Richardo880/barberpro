/**
 * Validaciones Zod para Users/Auth
 */

import { z } from 'zod';

// Schema para login
export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

// Schema para registro
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Teléfono inválido (formato E.164)' })
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    .regex(/[A-Z]/, { message: 'La contraseña debe contener al menos una mayúscula' })
    .regex(/[0-9]/, { message: 'La contraseña debe contener al menos un número' }),
});

// Schema para actualizar perfil (cliente)
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  birthDate: z.string().datetime().optional(),
});

// Schema para cambiar contraseña
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
      .regex(/[0-9]/, { message: 'Debe contener al menos un número' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

// Schema para crear cliente (admin)
export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  birthDate: z.string().datetime().optional(),
  internalNotes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

// Schema para crear staff (admin)
export const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  bio: z.string().max(500).optional(),
  specialties: z.array(z.string()).optional(),
  serviceIds: z.array(z.string().cuid()),
});

// Schema para query de clientes (admin)
export const clientQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
