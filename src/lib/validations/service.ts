/**
 * Validaciones Zod para Services
 */

import { z } from 'zod';

// Schema para crear servicio
export const createServiceSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' }),
  description: z
    .string()
    .max(500, { message: 'La descripción no puede exceder 500 caracteres' })
    .optional(),
  duration: z
    .number()
    .int({ message: 'La duración debe ser un número entero' })
    .min(5, { message: 'La duración mínima es 5 minutos' })
    .max(480, { message: 'La duración máxima es 8 horas (480 minutos)' }),
  price: z
    .number()
    .positive({ message: 'El precio debe ser positivo' })
    .max(10000000, { message: 'El precio no puede exceder 10,000,000' }),
});

// Schema para actualizar servicio
export const updateServiceSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(5).max(480).optional(),
  price: z.number().positive().max(10000000).optional(),
  isActive: z.boolean().optional(),
});
